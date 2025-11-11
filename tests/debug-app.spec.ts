import { test, expect } from '@playwright/test';

test('debug app loading', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  // Capture console messages
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto('/');

  // Wait a bit for app to load
  await page.waitForTimeout(10000);

  // Take screenshot
  await page.screenshot({ path: 'screenshots/debug-screenshot.png', fullPage: true });

  // Get page HTML
  const html = await page.content();
  console.log('\n=== PAGE HTML ===');
  console.log(html.substring(0, 500));

  // Print console messages
  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => console.log(msg));

  // Print errors
  console.log('\n=== ERRORS ===');
  errors.forEach(err => console.log(err));

  // Check what's in the DOM
  const rootContent = await page.locator('#root').innerHTML();
  console.log('\n=== ROOT CONTENT ===');
  console.log(rootContent.substring(0, 500));
});
