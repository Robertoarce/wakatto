import { test, expect } from '@playwright/test';

test('debug character selection scroll', async ({ page }) => {
  // Go to the app - web runs on port 19006
  await page.goto('http://localhost:19006');

  // Wait for the app to load
  await page.waitForTimeout(3000);

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/scroll-1-initial.png', fullPage: true });
  console.log('Screenshot 1: Initial state - Login screen');

  // Scroll down to see if there's a guest option
  await page.mouse.move(640, 400);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/scroll-2-scrolled-login.png', fullPage: true });
  console.log('Screenshot 2: Scrolled login');

  // Look for "Sign Up" tab and click it to see if there's a guest option
  const signUpTab = page.locator('text=Sign Up').first();
  if (await signUpTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Found Sign Up tab, clicking...');
    await signUpTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/scroll-3-signup.png', fullPage: true });
    console.log('Screenshot 3: Sign Up tab');
  }

  // Look for Continue as Guest anywhere on the page
  const guestOptions = await page.locator('text=/guest/i').all();
  console.log('Found guest options:', guestOptions.length);

  // Try clicking Sign In with test credentials or look for skip option
  // For now, let's check if there's any way to get past login
  await page.screenshot({ path: '/tmp/scroll-final.png', fullPage: true });
  console.log('Final screenshot');
});
