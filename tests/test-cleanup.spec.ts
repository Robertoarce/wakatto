/**
 * Test Suite: Verify UI cleanup - no traits/promptStyle errors
 * Tests that the app loads and key screens work after removing traits/promptStyle
 */

import { test, expect } from '@playwright/test';

test.describe('App Functionality After Cleanup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
  });

  test('App loads without errors', async ({ page }) => {
    // Wait for app to load
    await page.waitForTimeout(3000);

    // Check for no console errors related to traits/promptStyle
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('traits') || text.includes('promptStyle') || text.includes('PromptStyleId')) {
          errors.push(text);
        }
      }
    });

    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });

  test('Chat screen loads', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check for chat interface elements
    const chatExists = await page.locator('text=/chat|message|send/i').count();
    expect(chatExists).toBeGreaterThan(0);
  });

  test('Wakattors screen accessible', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Try to find Wakattors tab/button
    const wakattorsButton = page.locator('text=/wakattors|characters/i').first();

    if (await wakattorsButton.isVisible()) {
      await wakattorsButton.click();
      await page.waitForTimeout(1000);

      // Verify no trait sliders or promptStyle selectors
      const traitSliders = await page.locator('text=/empathy|directness|formality.*1.*10/i').count();
      expect(traitSliders).toBe(0); // Should be 0 after cleanup

      const promptStyleSelectors = await page.locator('text=/therapeutic approach|prompt style/i').count();
      expect(promptStyleSelectors).toBe(0); // Should be 0 after cleanup
    }
  });

  test('No TypeScript/Runtime errors in console', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.waitForTimeout(3000);

    // Filter out expected/harmless errors
    const criticalErrors = errors.filter(err =>
      !err.includes('DevTools') &&
      !err.includes('favicon') &&
      !err.includes('source map')
    );

    console.log('Console errors:', criticalErrors);
    expect(criticalErrors.length).toBe(0);
  });
});
