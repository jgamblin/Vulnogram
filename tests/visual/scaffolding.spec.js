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
    await expect(page.locator("h1").first()).toContainText("CVE Editor");

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

test.describe("Command palette", () => {
  test("opens with Cmd+K and shows commands", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#app");
    await page.keyboard.press("Meta+k");
    await expect(page.locator("#command-palette")).toBeVisible();
    await expect(page.locator("#palette-input")).toBeFocused();
    await expect(page.locator("#palette-results")).toContainText("CVE Editor");
    await expect(page.locator("#palette-results")).toContainText(
      "CVSS Calculator",
    );
    await expect(page).toHaveScreenshot("command-palette-open.png");
  });

  test("filters commands on input", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#app");
    await page.keyboard.press("Meta+k");
    await page.fill("#palette-input", "cvss");
    await expect(page.locator("#palette-results")).toContainText(
      "CVSS Calculator",
    );
    await expect(page.locator(".vg-palette-item")).toHaveCount(1);
  });

  test("closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#app");
    await page.keyboard.press("Meta+k");
    await expect(page.locator("#command-palette")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#command-palette")).toBeHidden();
  });

  test("opens from search trigger click", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#app");
    await page.click("#search-trigger");
    await expect(page.locator("#command-palette")).toBeVisible();
  });
});

test.describe("Form engine", () => {
  test("renders progressive disclosure form", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#form-root");

    // Required sections should be visible
    await expect(page.locator("#form-root")).toContainText("CVE Metadata");
    await expect(page.locator("#form-root")).toContainText("Containers");

    // Form fields should render
    await expect(page.locator("#form-root")).toContainText("CVE ID");
    await expect(page.locator("#form-root")).toContainText("State");

    await expect(page).toHaveScreenshot("form-engine-initial.png");
  });

  test("chips expand optional sections", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#form-root");

    // Look for add chips for optional sections
    const chipBar = page.locator("[data-chip-bar]");
    if ((await chipBar.count()) > 0) {
      // Click first chip to expand a section
      const firstChip = chipBar.locator(".vg-chip").first();
      if ((await firstChip.count()) > 0) {
        const chipText = await firstChip.textContent();
        await firstChip.click();
        // After clicking, the section should appear and chip should be gone
        await expect(page.locator("#form-root")).toContainText(
          chipText.replace("+ ", ""),
        );
      }
    }
  });

  test("import and export buttons visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#form-root");
    await expect(page.locator("#btn-import")).toBeVisible();
    await expect(page.locator("#btn-export")).toBeVisible();
    await expect(page.locator("#btn-save-draft")).toBeVisible();
  });

  test("enum fields render as pills", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#form-root");

    // State field should render as pills
    const pills = page.locator(".vg-pills").first();
    await expect(pills).toBeVisible();
    await expect(pills).toContainText("PUBLISHED");
  });
});

test.describe("Tab bar and source view", () => {
  test("tab bar visible with Form and Source tabs", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#form-root");

    const formTab = page.locator('[data-tab="form"]');
    const sourceTab = page.locator('[data-tab="source"]');
    await expect(formTab).toBeVisible();
    await expect(sourceTab).toBeVisible();
    await expect(formTab).toHaveClass(/active/);
  });

  test("switching to source tab shows JSON editor", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#form-root");

    await page.click('[data-tab="source"]');
    const editor = page.locator("#source-editor");
    await expect(editor).toBeVisible();

    // Should contain valid JSON
    const value = await editor.inputValue();
    expect(() => JSON.parse(value)).not.toThrow();
  });

  test("editing source JSON and switching to form applies changes", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#form-root");

    // Switch to source tab
    await page.click('[data-tab="source"]');
    const editor = page.locator("#source-editor");
    await expect(editor).toBeVisible();

    // Set JSON with a CVE ID
    await editor.fill(
      JSON.stringify({ cveMetadata: { cveId: "CVE-2024-99999" } }, null, 2),
    );

    // Switch back to form — should apply JSON to form
    await page.click('[data-tab="form"]');
    await expect(page.locator('input[name="cveMetadata.cveId"]')).toHaveValue(
      "CVE-2024-99999",
    );
  });
});

test.describe("Sidebar navigation", () => {
  test("clicking CVSS Calculator shows calculator page", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#form-root");

    await page.click('[data-section="calculator"]');
    await expect(page.locator('[data-page="calculator"]')).toBeVisible();
    await expect(page.locator('[data-page="cve"]')).toBeHidden();
    await expect(page.locator('[data-page="calculator"]')).toContainText(
      "CVSS 4.0 Calculator",
    );
  });

  test("clicking CVE Editor returns to editor", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#form-root");

    // Navigate to calculator and back
    await page.click('[data-section="calculator"]');
    await page.click('[data-section="cve"]');
    await expect(page.locator('[data-page="cve"]')).toBeVisible();
    await expect(page.locator('[data-page="calculator"]')).toBeHidden();
  });
});
