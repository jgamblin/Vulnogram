import { test, expect } from "@playwright/test";

test.describe("Solo mode scaffolding", () => {
  test("renders full layout in light mode", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#app");

    // Sidebar visible with text
    await expect(page.locator("#sidebar")).toBeVisible();
    await expect(page.locator("#sidebar")).toContainText("Vulnogram");
    await expect(page.locator("#sidebar")).toContainText("CVE Editor");
    await expect(page.locator("#sidebar")).toContainText("CVSS Calculator");

    // Top bar visible
    await expect(page.locator(".vg-topbar")).toBeVisible();

    // Content area visible
    await expect(page.locator("#content")).toBeVisible();
    await expect(page.locator("h1")).toContainText("CVE Editor");

    // Visual snapshot — light mode
    await expect(page).toHaveScreenshot("layout-light.png");
  });

  test("renders full layout in dark mode", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#app");

    // Toggle dark mode
    await page.click("#theme-toggle");

    // Verify dark class applied
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    // Visual snapshot — dark mode
    await expect(page).toHaveScreenshot("layout-dark.png");
  });

  test("sidebar collapses to icon rail", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#app");

    // Click collapse toggle
    await page.click("#sidebar-toggle");

    // Sidebar should have collapsed class
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toHaveClass(/collapsed/);

    // Labels should be hidden
    const labels = sidebar.locator(".vg-sidebar-label");
    const count = await labels.count();
    for (let i = 0; i < count; i++) {
      await expect(labels.nth(i)).toBeHidden();
    }

    // Visual snapshot — collapsed
    await expect(page).toHaveScreenshot("sidebar-collapsed.png");
  });

  test("sidebar collapse persists across reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#app");

    // Collapse sidebar
    await page.click("#sidebar-toggle");
    await expect(page.locator("#sidebar")).toHaveClass(/collapsed/);

    // Reload and verify persistence
    await page.reload();
    await page.waitForSelector("#app");
    await expect(page.locator("#sidebar")).toHaveClass(/collapsed/);
  });

  test("dark mode persists across reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#app");

    await page.click("#theme-toggle");

    // Reload and verify dark mode persists
    await page.reload();
    await page.waitForSelector("#app");
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);
  });

  test("keyboard shortcut [ toggles sidebar", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#app");

    // Press [ to collapse
    await page.keyboard.press("[");
    await expect(page.locator("#sidebar")).toHaveClass(/collapsed/);

    // Press [ again to expand
    await page.keyboard.press("[");
    await expect(page.locator("#sidebar")).not.toHaveClass(/collapsed/);
  });
});
