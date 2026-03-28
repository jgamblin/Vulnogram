import { test, expect } from '@playwright/test';

test.describe('Solo mode scaffolding', () => {
  test('renders layout shell in light mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');

    // Sidebar visible
    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('#sidebar')).toContainText('Vulnogram');

    // Top bar visible
    await expect(page.locator('header')).toBeVisible();

    // Content area visible
    await expect(page.locator('#content')).toBeVisible();
    await expect(page.locator('h1')).toContainText('CVE Editor');

    // Visual snapshot — light mode
    await expect(page).toHaveScreenshot('solo-shell-light.png');
  });

  test('renders layout shell in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');

    // Toggle dark mode
    await page.click('#theme-toggle');

    // Verify dark class applied
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Visual snapshot — dark mode
    await expect(page).toHaveScreenshot('solo-shell-dark.png');
  });

  test('dark mode persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.click('#theme-toggle');

    // Reload and verify dark mode persists
    await page.reload();
    await page.waitForSelector('#app');
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });
});
