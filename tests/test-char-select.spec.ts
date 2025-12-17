import { test, expect } from '@playwright/test';

test('character selection screen', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(5000);

  // Take screenshot of current state
  await page.screenshot({ path: '/tmp/wakatto-1-initial.png', fullPage: true });
  console.log('Screenshot 1 saved');

  // Look for "New Conversation" or "+" button to trigger character selection
  // First check if we need to login
  const loginButton = page.locator('text=Login').first();
  const guestButton = page.locator('text=Continue as Guest').first();

  if (await guestButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Found guest button, clicking...');
    await guestButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/wakatto-2-after-guest.png', fullPage: true });
  }

  // Look for new conversation button
  const newConvButton = page.locator('text=New').first();
  if (await newConvButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Found New button, clicking...');
    await newConvButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/wakatto-3-char-select.png', fullPage: true });
    console.log('Screenshot 3 - character selection saved');
  }

  // Also try clicking a + icon
  const plusButton = page.locator('[class*="add"], [aria-label*="new"], [aria-label*="add"]').first();
  if (await plusButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    console.log('Found plus button');
    await plusButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/wakatto-4-after-plus.png', fullPage: true });
  }

  // Final screenshot
  await page.screenshot({ path: '/tmp/wakatto-final.png', fullPage: true });
  console.log('Final screenshot saved');
});
