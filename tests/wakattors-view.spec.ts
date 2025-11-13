import { test, expect } from '@playwright/test';

test.describe('Wakattors Screen - View Button', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:19006');

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Quick login (assuming dev login is available)
    const loginButton = page.getByText('Quick Dev Login');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(2000); // Wait for login to complete
    }

    // Navigate to Wakattors tab
    const wakattorsTab = page.getByText('Wakattors').first();
    await wakattorsTab.click();
    await page.waitForTimeout(1000);
  });

  test('View button should be clickable and open modal', async ({ page }) => {
    // Wait for character cards to load
    await page.waitForSelector('text=Sigmund Freud', { timeout: 10000 });

    // Find the first View button by text - try multiple approaches
    const viewButton = page.locator('text=View').first();

    // Check if button is visible
    await expect(viewButton).toBeVisible();

    // Try clicking with force and position
    await viewButton.click({ force: true, position: { x: 20, y: 10 } });

    // Wait longer for modal to appear
    await page.waitForTimeout(1500);

    // Check if modal is visible by looking for the "Test Animations" text that appears only in modals
    const modalContent = page.locator('text=Test Animations');
    await expect(modalContent).toBeVisible({ timeout: 5000 });

    // Also check for modal header
    const modalHeader = page.locator('text=/Description|System Prompt/');
    await expect(modalHeader).toBeVisible();
  });

  test('View button should show character details in modal', async ({ page }) => {
    // Click first View button
    const viewButton = page.getByRole('button', { name: /view/i }).first();
    await viewButton.click();

    await page.waitForTimeout(500);

    // Check for modal content sections
    await expect(page.getByText('Description')).toBeVisible();
    await expect(page.getByText('System Prompt')).toBeVisible();
    await expect(page.getByText('Personality Traits')).toBeVisible();
    await expect(page.getByText('Test Animations')).toBeVisible();
  });

  test('Animation buttons in modal should be interactive', async ({ page }) => {
    // Click View button
    const viewButton = page.getByRole('button', { name: /view/i }).first();
    await viewButton.click();

    await page.waitForTimeout(500);

    // Find and click animation button
    const thinkingButton = page.getByRole('button', { name: /thinking/i }).first();
    await expect(thinkingButton).toBeVisible();
    await thinkingButton.click();

    // Check if button gets active state (you might need to adjust selector)
    await page.waitForTimeout(300);

    // Try another animation
    const happyButton = page.getByRole('button', { name: /happy/i }).first();
    await happyButton.click();
    await page.waitForTimeout(300);
  });

  test('Modal should close when close button is clicked', async ({ page }) => {
    // Open modal
    const viewButton = page.getByRole('button', { name: /view/i }).first();
    await viewButton.click();
    await page.waitForTimeout(500);

    // Find modal title to confirm it's open
    const modalContent = page.getByText('Description');
    await expect(modalContent).toBeVisible();

    // Click close button
    const closeButton = page.locator('[name="close"]').first();
    await closeButton.click();

    // Check that modal is gone
    await expect(modalContent).not.toBeVisible({ timeout: 2000 });
  });

  test('All three default characters should have View buttons', async ({ page }) => {
    // Count View buttons (should have at least 3 for Freud, Jung, Adler)
    const viewButtons = page.getByRole('button', { name: /view/i });
    const count = await viewButtons.count();

    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('Edit button should also work', async ({ page }) => {
    // Test Edit button as comparison
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    await expect(editButton).toBeVisible();

    // Listen for console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    await editButton.click();
    await page.waitForTimeout(500);

    // Check if console log was triggered
    const hasEditLog = consoleLogs.some(log => log.includes('Edit button clicked for:'));
    expect(hasEditLog).toBe(true);

    // Check if edit modal opened
    const modalTitle = page.getByText(/Edit Wakattor|Create Wakattor/i);
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
  });

  test('View button should be clickable on all character cards', async ({ page }) => {
    // Get all View buttons
    const viewButtons = page.getByRole('button', { name: /view/i });
    const count = await viewButtons.count();

    // Test first 3 buttons (Freud, Jung, Adler)
    for (let i = 0; i < Math.min(3, count); i++) {
      const button = viewButtons.nth(i);
      await expect(button).toBeVisible();

      // Click button
      await button.click();
      await page.waitForTimeout(300);

      // Check modal opened
      const modal = page.getByText('Test Animations');
      await expect(modal).toBeVisible();

      // Close modal
      const closeButton = page.locator('[name="close"]').first();
      await closeButton.click();
      await page.waitForTimeout(300);

      // Verify modal closed
      await expect(modal).not.toBeVisible();
    }
  });
});
