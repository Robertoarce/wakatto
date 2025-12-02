import { test, expect } from '@playwright/test';

test.describe('Wakattor Selection', () => {
  test('should allow selecting wakattors without closing the panel', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:19006');

    // Wait for app to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on the Wakattor selector button
    const wakattorButton = page.locator('text=/\\d+ Wakattor/');
    await expect(wakattorButton).toBeVisible({ timeout: 10000 });
    await wakattorButton.click();

    // Wait for selector panel to appear
    await page.waitForTimeout(500);

    // Verify the panel is visible
    const selectorTitle = page.locator('text=Select Wakattors (Max 10)');
    await expect(selectorTitle).toBeVisible();

    // Click on a character card (first one)
    const firstCharacter = page.locator('[class*="characterSelectorCard"]').first();
    await expect(firstCharacter).toBeVisible();
    await firstCharacter.click();

    // Wait a moment
    await page.waitForTimeout(300);

    // Verify the panel is still visible after clicking a character
    await expect(selectorTitle).toBeVisible();
    console.log('✓ Panel stays open after clicking character');

    // Click on another character
    const secondCharacter = page.locator('[class*="characterSelectorCard"]').nth(1);
    await secondCharacter.click();
    await page.waitForTimeout(300);

    // Panel should still be visible
    await expect(selectorTitle).toBeVisible();
    console.log('✓ Panel stays open after clicking second character');

    // Click outside the panel (on backdrop) to close it
    await page.mouse.click(100, 100);
    await page.waitForTimeout(300);

    // Panel should now be closed
    await expect(selectorTitle).not.toBeVisible();
    console.log('✓ Panel closes when clicking backdrop');

    console.log('\n✅ All Wakattor selection tests passed!');
  });
});
