#!/usr/bin/env node
/**
 * Auto-increment patch version on deploy
 * Updates: package.json, app.json, src/config/version.ts
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Read package.json
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Parse current version
const [major, minor, patch] = packageJson.version.split('.').map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;
const buildDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

console.log(`📦 Bumping version: ${packageJson.version} → ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('   ✓ package.json');

// Update app.json
const appJsonPath = path.join(rootDir, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
appJson.expo.version = newVersion;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
console.log('   ✓ app.json');

// Update src/config/version.ts
const versionTsPath = path.join(rootDir, 'src/config/version.ts');
const versionTsContent = `// App version configuration
// This is the single source of truth for the app version
// Auto-updated by scripts/bump-version.js on deploy
export const APP_VERSION = '${newVersion}';
export const BUILD_DATE = '${buildDate}';

export const getVersionString = () => \`v\${APP_VERSION}\`;
export const getFullVersionString = () => \`v\${APP_VERSION} (\${BUILD_DATE})\`;
`;
fs.writeFileSync(versionTsPath, versionTsContent);
console.log('   ✓ src/config/version.ts');

console.log(`\n✅ Version bumped to ${newVersion} (${buildDate})`);

