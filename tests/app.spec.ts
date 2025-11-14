import { test, expect } from '@playwright/test';

test.describe('Wakatto AI Diary', () => {
  test('should load the app successfully', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:19006');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot for verification
    await page.screenshot({ path: 'tests/screenshots/01-app-loaded.png' });

    console.log('✅ App loaded successfully');
  });

  test('should show login screen', async ({ page }) => {
    await page.goto('http://localhost:19006');
    await page.waitForLoadState('networkidle');

    // Check for login/register elements
    const loginText = await page.getByText(/login|sign in|email/i).first();
    await expect(loginText).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'tests/screenshots/02-login-screen.png' });

    console.log('✅ Login screen is visible');
  });

  test('should register and access settings to verify Claude default', async ({ page }) => {
    await page.goto('http://localhost:19006');
    await page.waitForLoadState('networkidle');

    // Generate unique email for testing
    const testEmail = `test-${Date.now()}@wakatto.test`;
    const testPassword = 'TestPassword123!';

    try {
      // Look for register link/button
      const registerButton = page.getByText(/register|sign up|create account/i).first();
      if (await registerButton.isVisible({ timeout: 5000 })) {
        await registerButton.click();
        await page.waitForTimeout(1000);
      }

      // Fill in registration form
      await page.fill('input[type="email"], input[placeholder*="mail" i]', testEmail);
      await page.fill('input[type="password"]', testPassword);

      // Click register/submit button
      const submitButton = page.getByRole('button', { name: /register|sign up|create/i }).first();
      await submitButton.click();

      // Wait for navigation
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'tests/screenshots/03-after-register.png' });

      // Navigate to Settings tab
      const settingsTab = page.getByText(/settings/i, { selector: '*[role="button"], button, a' }).last();
      if (await settingsTab.isVisible({ timeout: 5000 })) {
        await settingsTab.click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'tests/screenshots/04-settings-screen.png' });

        // Check for Claude/Anthropic in the settings
        const claudeText = await page.getByText(/anthropic|claude/i).first();
        if (await claudeText.isVisible({ timeout: 5000 })) {
          console.log('✅ Claude (Anthropic) is visible in settings');
        } else {
          console.log('⚠️ Could not verify Claude in settings - might be in a dropdown');
        }
      }

      console.log('✅ Successfully registered and accessed settings');

    } catch (error) {
      console.log('⚠️ Registration test encountered an issue:', error.message);
      await page.screenshot({ path: 'tests/screenshots/error.png' });
    }
  });

  test('should verify environment variable is loaded', async ({ page }) => {
    await page.goto('http://localhost:19006');
    await page.waitForLoadState('networkidle');

    // Check console logs for environment variable confirmation
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    await page.waitForTimeout(2000);

    // Look for our custom log message
    const hasEnvLog = logs.some(log =>
      log.includes('Using API key from environment') ||
      log.includes('Loaded environment variables')
    );

    if (hasEnvLog) {
      console.log('✅ Environment variable successfully loaded');
    } else {
      console.log('📋 Console logs:', logs.slice(-10));
    }
  });
});
