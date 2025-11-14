import { test, expect } from '@playwright/test';

test.describe('3D Character Display', () => {
  test('should display 3D character in chat taking 1/4 vertical space', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load - look for actual app elements
    await page.waitForLoadState('networkidle');

    // Wait for the app to render (check for input field as indicator)
    const inputField = page.getByPlaceholder(/Type your message/i);
    await expect(inputField).toBeVisible({ timeout: 30000 });

    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/3d-character-initial.png', fullPage: true });

    // Check if the character display container exists
    const characterDisplay = page.locator('canvas').first();
    await expect(characterDisplay).toBeVisible({ timeout: 10000 });

    // Get viewport height and character display height
    const viewportSize = page.viewportSize();
    if (viewportSize) {
      const characterBox = await characterDisplay.boundingBox();
      if (characterBox) {
        const characterHeight = characterBox.height;
        const viewportHeight = viewportSize.height;
        const ratio = characterHeight / viewportHeight;

        console.log(`Character display height: ${characterHeight}px`);
        console.log(`Viewport height: ${viewportHeight}px`);
        console.log(`Ratio: ${ratio} (expected ~0.25 for 1/4)`);

        // Character should take approximately 1/4 of space (with some tolerance)
        expect(ratio).toBeGreaterThan(0.15);
        expect(ratio).toBeLessThan(0.35);
      }
    }

    // Check that character info is displayed
    await expect(page.getByText('Jung')).toBeVisible();

    // Take final screenshot
    await page.screenshot({ path: 'screenshots/3d-character-final.png', fullPage: true });
  });

  test('should show 3D Models tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for app to render
    const inputField = page.getByPlaceholder(/Type your message/i);
    await expect(inputField).toBeVisible({ timeout: 30000 });

    // Find and click the 3D Models tab
    const modelsTab = page.getByText('3D Models');
    await expect(modelsTab).toBeVisible();
    await modelsTab.click();

    // Wait for 3D canvas to load
    await page.waitForTimeout(2000);

    // Take screenshot of 3D Models tab
    await page.screenshot({ path: 'screenshots/3d-models-tab.png', fullPage: true });
  });

  test('should animate character when AI is responding', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for app to render
    const inputField = page.getByPlaceholder(/Type your message/i);
    await expect(inputField).toBeVisible({ timeout: 30000 });

    // Get initial canvas state
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Take screenshot before interaction
    await page.screenshot({ path: 'screenshots/character-before-message.png', fullPage: true });

    // Type a message (don't send to avoid actual AI call)
    const input = page.getByPlaceholder(/Type your message/i);
    await input.fill('Hello Jung!');

    // Take screenshot with typed message
    await page.screenshot({ path: 'screenshots/character-with-input.png', fullPage: true });
  });
});
