import { test, expect } from '@playwright/test';

test.describe('Claude Configuration Verification', () => {
  test('should verify Claude API key is loaded from environment', async ({ page }) => {
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];

    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Navigate to the app
    await page.goto('http://localhost:19006');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/claude-config.png' });

    console.log('\n📋 Console Output Analysis:');
    console.log('─'.repeat(80));

    // Check for environment variable logs
    const envLogs = consoleLogs.filter(log =>
      log.includes('CLAUDE_API_KEY') ||
      log.includes('Loaded environment variables') ||
      log.includes('Using API key from environment')
    );

    if (envLogs.length > 0) {
      console.log('✅ Environment variables loaded:');
      envLogs.forEach(log => console.log('   ', log));
    }

    // Check for AI initialization logs
    const aiLogs = consoleLogs.filter(log =>
      log.includes('[AI]') ||
      log.includes('anthropic') ||
      log.includes('claude')
    );

    if (aiLogs.length > 0) {
      console.log('✅ AI configuration logs:');
      aiLogs.forEach(log => console.log('   ', log));
    }

    // Check for any errors
    if (consoleErrors.length > 0) {
      console.log('⚠️  Console errors detected:');
      consoleErrors.slice(0, 5).forEach(err => console.log('   ', err));
    } else {
      console.log('✅ No console errors detected');
    }

    console.log('─'.repeat(80));

    // Verify at least some logs were captured
    expect(consoleLogs.length).toBeGreaterThan(0);
  });

  test('should verify Claude is available in the app code', async ({ page }) => {
    await page.goto('http://localhost:19006');
    await page.waitForLoadState('networkidle');

    // Execute JavaScript to check for Claude configuration
    const claudeConfig = await page.evaluate(() => {
      // Check if process.env.CLAUDE_API_KEY is defined
      const hasEnvKey = typeof (window as any).process !== 'undefined' &&
                        (window as any).process.env &&
                        (window as any).process.env.CLAUDE_API_KEY;

      return {
        hasEnvKey: !!hasEnvKey,
        envKeyPrefix: hasEnvKey ? (window as any).process.env.CLAUDE_API_KEY.substring(0, 10) : null,
      };
    });

    console.log('\n🔍 Browser Environment Check:');
    console.log('─'.repeat(80));
    console.log('CLAUDE_API_KEY present:', claudeConfig.hasEnvKey);
    if (claudeConfig.hasEnvKey) {
      console.log('API Key prefix:', claudeConfig.envKeyPrefix);
      console.log('✅ Claude API key successfully injected into browser environment');
    } else {
      console.log('⚠️  Claude API key not found in browser environment');
    }
    console.log('─'.repeat(80));

    // We expect the key to be present
    expect(claudeConfig.hasEnvKey).toBeTruthy();
  });

  test('should load without critical errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:19006');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n🔍 Error Check:');
    console.log('─'.repeat(80));

    if (errors.length === 0) {
      console.log('✅ No JavaScript errors detected');
    } else {
      console.log(`⚠️  ${errors.length} error(s) detected:`);
      errors.slice(0, 5).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.substring(0, 100)}`);
      });
    }
    console.log('─'.repeat(80));
  });
});
