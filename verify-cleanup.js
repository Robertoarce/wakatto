/**
 * Quick verification script to test imports after cleanup
 */

console.log('🔍 Verifying cleanup...\n');

try {
  // Test 1: Import character config
  console.log('✓ Testing character config import...');
  const characters = require('./src/config/characters');

  // Verify CharacterBehavior interface doesn't have traits/promptStyle
  const freud = characters.CHARACTERS.freud;
  console.log('  - Freud character loaded:', freud.name);

  if (freud.traits) {
    console.error('  ✗ ERROR: traits property still exists!');
    process.exit(1);
  }
  if (freud.promptStyle) {
    console.error('  ✗ ERROR: promptStyle property still exists!');
    process.exit(1);
  }

  // Check required properties exist
  if (!freud.systemPrompt) {
    console.error('  ✗ ERROR: systemPrompt is missing!');
    process.exit(1);
  }

  console.log('  ✓ No traits property found (good!)');
  console.log('  ✓ No promptStyle property found (good!)');
  console.log('  ✓ systemPrompt exists:', freud.systemPrompt.substring(0, 50) + '...');
  console.log('  ✓ Character properties:', Object.keys(freud).join(', '));

  console.log('\n✅ All verification checks passed!');
  console.log('\nCharacter structure is clean:');
  console.log('  - No traits object');
  console.log('  - No promptStyle property');
  console.log('  - systemPrompt is present and required');

} catch (error) {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
}
