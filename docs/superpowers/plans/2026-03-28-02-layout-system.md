# Layout System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full layout system: collapsible sidebar (labeled → icon rail), top bar with search, command palette shell, and responsive breakpoints with visual tests.

**Architecture:** The sidebar collapses between a 220px labeled view and a 48px icon rail via a CSS class toggle. The command palette is a modal overlay triggered by Cmd+K. All layout is responsive with a mobile breakpoint at 768px where the sidebar becomes an overlay.

**Tech Stack:** Tailwind CSS v4 (existing), Heroicons (inline SVG), vanilla JS

**Security note:** Icon rendering uses a closed set of trusted SVG strings from a local module — not user input. The command palette renders only from a hardcoded command list using safe DOM methods (createElement/textContent), not innerHTML with untrusted data.

---

## File Structure

```
(new files)
src/
  ui/
    sidebar.js          — Sidebar collapse/expand logic + keyboard shortcut
    command-palette.js  — Cmd+K modal with fuzzy search
    theme.js            — Dark mode (extracted from app.js)
  solo/
    icons.js            — Inline SVG icon definitions (Heroicons subset)

(modified files)
src/
  solo/
    index.html          — Full layout with collapsible sidebar, search, responsive
    app.js              — Import new modules
  css/
    vg-components.css   — Add sidebar + topbar + command palette component classes
tests/
  visual/
    scaffolding.spec.js — Update for new layout structure
```

---

### Task 1: Extract Theme Module and Create Icon Definitions

**Files:**
- Create: `src/ui/theme.js`
- Create: `src/solo/icons.js`
- Modify: `src/solo/app.js`

- [ ] **Step 1: Create the theme module**

Create `src/ui/theme.js`:

```js
// Dark mode theme management

const html = document.documentElement;

export function initTheme() {
  const stored = localStorage.getItem('vg-theme');
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  }
}

export function toggleTheme() {
  html.classList.toggle('dark');
  localStorage.setItem('vg-theme', html.classList.contains('dark') ? 'dark' : 'light');
}
```

- [ ] **Step 2: Create the icon definitions module**

Create `src/solo/icons.js` — a subset of Heroicons used across the layout. Each export is an SVG string. These are trusted, hardcoded SVG definitions from Heroicons (MIT license), not user-supplied content.

```js
// Heroicons (outline, 24x24) — only icons used in the layout
// Source: https://heroicons.com (MIT license)

export const icons = {
  cve: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286Z"/></svg>`,

  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>`,

  calculator: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008H15.75v-.008Zm0 2.25h.008v.008H15.75V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z"/></svg>`,

  search: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>`,

  moon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg>`,

  sun: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>`,

  chevronLeft: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>`,

  chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>`,

  bars3: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>`,

  xMark: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>`,
};
```

- [ ] **Step 3: Update app.js to use modules**

Replace `src/solo/app.js` with:

```js
// Solo mode entry point — Vulnogram UI Modernization
import { initTheme, toggleTheme } from '../ui/theme.js';
import { initSidebar } from '../ui/sidebar.js';
import { initCommandPalette } from '../ui/command-palette.js';

// Initialize
initTheme();

// Theme toggle button
document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

// Sidebar (will be created in Task 2)
initSidebar();

// Command palette (will be created in Task 3)
initCommandPalette();

console.log('Vulnogram solo mode initialized');
```

Note: `sidebar.js` and `command-palette.js` don't exist yet — they'll be created in Tasks 2 and 3. For now, create stub files so the imports don't break:

Create `src/ui/sidebar.js`:
```js
export function initSidebar() {
  // Will be implemented in Task 2
}
```

Create `src/ui/command-palette.js`:
```js
export function initCommandPalette() {
  // Will be implemented in Task 3
}
```

- [ ] **Step 4: Verify dev server still works**

```bash
npm run dev
```

Expected: Dev server starts, page loads without JS errors in console.

- [ ] **Step 5: Commit**

```bash
git add src/ui/ src/solo/icons.js src/solo/app.js
git commit -m "refactor: extract theme module, add icon definitions, stub sidebar + palette"
```

---

### Task 2: Collapsible Sidebar

**Files:**
- Modify: `src/ui/sidebar.js`
- Modify: `src/solo/index.html`
- Modify: `src/css/vg-components.css`

- [ ] **Step 1: Add sidebar component classes to vg-components.css**

Append to `src/css/vg-components.css`:

```css
/* Sidebar layout */
.vg-sidebar {
  @apply w-56 border-r border-vg-200 flex flex-col
         bg-vg-50/50 transition-all duration-200 ease-in-out
         dark:border-vg-800 dark:bg-vg-900/50;
}

.vg-sidebar.collapsed {
  @apply w-12;
}

.vg-sidebar-brand {
  @apply h-14 flex items-center px-4 font-semibold text-sm tracking-tight
         border-b border-vg-200 dark:border-vg-800;
}

.vg-sidebar.collapsed .vg-sidebar-brand {
  @apply px-2 justify-center;
}

.vg-sidebar-nav {
  @apply flex-1 px-2 py-2 space-y-0.5 text-sm overflow-y-auto overflow-x-hidden;
}

.vg-sidebar-item {
  @apply flex items-center gap-3 px-3 py-2 rounded-lg
         text-vg-600 hover:bg-vg-100 hover:text-vg-900
         transition-colors cursor-pointer whitespace-nowrap overflow-hidden
         dark:text-vg-400 dark:hover:bg-vg-800 dark:hover:text-vg-100;
}

.vg-sidebar-item.active {
  @apply bg-vg-100 text-vg-900 font-medium
         dark:bg-vg-800 dark:text-vg-100;
}

.vg-sidebar.collapsed .vg-sidebar-item {
  @apply px-0 justify-center;
}

.vg-sidebar.collapsed .vg-sidebar-label {
  @apply hidden;
}

.vg-sidebar-icon {
  @apply w-5 h-5 flex-shrink-0;
}

.vg-sidebar-footer {
  @apply px-2 py-2 border-t border-vg-200 dark:border-vg-800;
}

/* Top bar */
.vg-topbar {
  @apply h-14 border-b border-vg-200 flex items-center px-4 gap-3
         bg-white dark:bg-vg-950 dark:border-vg-800;
}

.vg-topbar-search {
  @apply flex items-center gap-2 px-3 py-1.5 rounded-lg
         bg-vg-100 text-vg-400 text-sm cursor-pointer
         hover:bg-vg-200 transition-colors
         dark:bg-vg-800 dark:text-vg-500 dark:hover:bg-vg-700;
}

/* Mobile overlay */
.vg-sidebar-overlay {
  @apply fixed inset-0 bg-black/30 z-40 hidden
         dark:bg-black/50;
}

@media (max-width: 768px) {
  .vg-sidebar {
    @apply fixed inset-y-0 left-0 z-50 -translate-x-full;
  }
  .vg-sidebar.mobile-open {
    @apply translate-x-0;
  }
  .vg-sidebar.mobile-open ~ .vg-sidebar-overlay {
    @apply block;
  }
}
```

- [ ] **Step 2: Update index.html with full sidebar layout**

Replace the content of `src/solo/index.html` with:

```html
<!DOCTYPE html>
<html lang="en" class="">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vulnogram — CVE Editor</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>">
  <link rel="stylesheet" href="../css/main.css">
</head>
<body class="bg-white text-vg-900 dark:bg-vg-950 dark:text-vg-100 min-h-screen">
  <div id="app" class="flex min-h-screen">
    <!-- Sidebar overlay (mobile) -->
    <div id="sidebar-overlay" class="vg-sidebar-overlay"></div>

    <!-- Sidebar -->
    <aside id="sidebar" class="vg-sidebar">
      <div class="vg-sidebar-brand">
        <span class="vg-sidebar-label">Vulnogram</span>
        <span class="hidden vg-sidebar-icon-only">V</span>
      </div>
      <nav class="vg-sidebar-nav">
        <a href="#" class="vg-sidebar-item active" data-section="cve">
          <span class="vg-sidebar-icon" data-icon="cve"></span>
          <span class="vg-sidebar-label">CVE Editor</span>
        </a>
        <a href="#" class="vg-sidebar-item" data-section="cvss">
          <span class="vg-sidebar-icon" data-icon="calculator"></span>
          <span class="vg-sidebar-label">CVSS Calculator</span>
        </a>
      </nav>
      <div class="vg-sidebar-footer">
        <button id="sidebar-toggle" class="vg-sidebar-item w-full" title="Toggle sidebar ([)">
          <span class="vg-sidebar-icon" data-icon="chevronLeft" data-collapsed-icon="chevronRight"></span>
          <span class="vg-sidebar-label">Collapse</span>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- Top bar -->
      <header class="vg-topbar">
        <!-- Mobile menu button -->
        <button id="mobile-menu-btn" class="vg-btn-ghost p-2 md:hidden" aria-label="Open menu">
          <span data-icon="bars3"></span>
        </button>

        <!-- Search trigger (opens command palette) -->
        <button id="search-trigger" class="vg-topbar-search flex-1 max-w-md">
          <span data-icon="search"></span>
          <span>Search or jump to...</span>
          <kbd class="ml-auto text-xs text-vg-300 dark:text-vg-600 border border-vg-200 dark:border-vg-700 rounded px-1.5 py-0.5">⌘K</kbd>
        </button>

        <div class="flex-1"></div>

        <!-- Theme toggle -->
        <button id="theme-toggle" class="vg-btn-ghost p-2" aria-label="Toggle dark mode">
          <span class="dark:hidden" data-icon="moon"></span>
          <span class="hidden dark:block" data-icon="sun"></span>
        </button>
      </header>

      <!-- Content area -->
      <div id="content" class="flex-1 p-6 max-w-4xl mx-auto w-full">
        <h1 class="text-2xl font-semibold mb-2">CVE Editor</h1>
        <p class="text-vg-500 dark:text-vg-400 mb-8">Create and edit CVE records</p>

        <!-- Placeholder for form engine -->
        <div class="vg-card">
          <p class="text-sm text-vg-500">Form engine will render here.</p>
        </div>
      </div>
    </main>
  </div>

  <!-- Command palette modal (shell) -->
  <div id="command-palette" class="hidden fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/30 dark:bg-black/50" id="palette-backdrop"></div>
    <div class="relative mx-auto mt-[20vh] w-full max-w-lg">
      <div class="vg-card shadow-2xl">
        <input id="palette-input" type="text" class="vg-input border-0 text-base" placeholder="Type a command or search..." autofocus>
        <div id="palette-results" class="mt-2 max-h-64 overflow-y-auto">
          <!-- Results render here via safe DOM methods -->
        </div>
      </div>
    </div>
  </div>

  <script type="module" src="./app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Implement sidebar.js**

Replace `src/ui/sidebar.js` with:

```js
// Sidebar collapse/expand and mobile toggle
import { icons } from '../solo/icons.js';

let collapsed = false;

function renderIcons() {
  // Icons are from a trusted, hardcoded set — not user input
  document.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.getAttribute('data-icon');
    if (icons[name]) {
      el.innerHTML = icons[name];
    }
  });
}

function updateCollapseIcon() {
  const btn = document.getElementById('sidebar-toggle');
  if (!btn) return;
  const iconEl = btn.querySelector('[data-icon]');
  if (!iconEl) return;
  const iconName = collapsed
    ? (iconEl.getAttribute('data-collapsed-icon') || 'chevronRight')
    : (iconEl.getAttribute('data-icon'));
  if (icons[iconName]) {
    iconEl.innerHTML = icons[iconName];
  }
}

export function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  collapsed = !collapsed;
  sidebar.classList.toggle('collapsed', collapsed);
  localStorage.setItem('vg-sidebar-collapsed', collapsed ? '1' : '0');
  updateCollapseIcon();
}

function openMobile() {
  const sidebar = document.getElementById('sidebar');
  sidebar?.classList.add('mobile-open');
  document.getElementById('sidebar-overlay')?.classList.remove('hidden');
}

function closeMobile() {
  const sidebar = document.getElementById('sidebar');
  sidebar?.classList.remove('mobile-open');
  document.getElementById('sidebar-overlay')?.classList.add('hidden');
}

export function initSidebar() {
  // Render all icons from trusted icon set
  renderIcons();

  // Restore collapsed state
  const stored = localStorage.getItem('vg-sidebar-collapsed');
  if (stored === '1') {
    collapsed = true;
    document.getElementById('sidebar')?.classList.add('collapsed');
    updateCollapseIcon();
  }

  // Sidebar toggle button
  document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);

  // Keyboard shortcut: [ to toggle sidebar
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    if (e.key === '[') {
      e.preventDefault();
      toggleSidebar();
    }
  });

  // Mobile menu
  document.getElementById('mobile-menu-btn')?.addEventListener('click', openMobile);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeMobile);
}
```

- [ ] **Step 4: Rebuild and verify**

```bash
npm run build:solo
```

Expected: Build succeeds.

- [ ] **Step 5: Update visual tests for new layout**

Replace `tests/visual/scaffolding.spec.js` with:

```js
import { test, expect } from '@playwright/test';

test.describe('Solo mode layout', () => {
  test('renders full layout in light mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');

    // Sidebar visible with brand and nav
    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('#sidebar')).toContainText('Vulnogram');
    await expect(page.locator('#sidebar')).toContainText('CVE Editor');
    await expect(page.locator('#sidebar')).toContainText('CVSS Calculator');

    // Top bar with search trigger
    await expect(page.locator('.vg-topbar')).toBeVisible();
    await expect(page.locator('#search-trigger')).toBeVisible();
    await expect(page.locator('#theme-toggle')).toBeVisible();

    // Content area
    await expect(page.locator('#content')).toBeVisible();
    await expect(page.locator('h1')).toContainText('CVE Editor');

    await expect(page).toHaveScreenshot('solo-layout-light.png');
  });

  test('renders full layout in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveClass(/dark/);

    await expect(page).toHaveScreenshot('solo-layout-dark.png');
  });

  test('sidebar collapses to icon rail', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');

    await page.click('#sidebar-toggle');

    await expect(page.locator('#sidebar')).toHaveClass(/collapsed/);
    await expect(page.locator('#sidebar .vg-sidebar-label').first()).toBeHidden();

    await expect(page).toHaveScreenshot('solo-layout-collapsed.png');
  });

  test('sidebar collapse persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.click('#sidebar-toggle');
    await page.reload();
    await page.waitForSelector('#app');
    await expect(page.locator('#sidebar')).toHaveClass(/collapsed/);
  });

  test('dark mode persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.click('#theme-toggle');
    await page.reload();
    await page.waitForSelector('#app');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('keyboard shortcut [ toggles sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
    await page.keyboard.press('[');
    await expect(page.locator('#sidebar')).toHaveClass(/collapsed/);
    await page.keyboard.press('[');
    await expect(page.locator('#sidebar')).not.toHaveClass(/collapsed/);
  });
});
```

- [ ] **Step 6: Run tests with updated snapshots**

```bash
npm run build:solo && npm run test:visual -- --update-snapshots
```

Expected: 6 tests pass. New snapshots created.

- [ ] **Step 7: Verify test stability**

```bash
npm run test:visual
```

Expected: 6 tests pass without --update-snapshots.

- [ ] **Step 8: Commit**

```bash
git add src/ tests/
git commit -m "feat: collapsible sidebar with icon rail, mobile responsive, keyboard shortcut"
```

---

### Task 3: Command Palette

**Files:**
- Modify: `src/ui/command-palette.js`
- Modify: `src/css/vg-components.css`

- [ ] **Step 1: Add command palette component classes**

Append to `src/css/vg-components.css`:

```css
/* Command palette */
.vg-palette-item {
  @apply flex items-center gap-3 px-3 py-2 rounded-lg
         text-sm text-vg-700 cursor-pointer
         hover:bg-vg-100
         dark:text-vg-300 dark:hover:bg-vg-800;
}

.vg-palette-item.selected {
  @apply bg-vg-100 dark:bg-vg-800;
}

.vg-palette-item-icon {
  @apply w-5 h-5 text-vg-400 dark:text-vg-500;
}

.vg-palette-section-label {
  @apply px-3 py-1 text-xs font-medium text-vg-400 uppercase tracking-wider
         dark:text-vg-500;
}
```

- [ ] **Step 2: Implement command-palette.js**

Replace `src/ui/command-palette.js` with a safe DOM implementation (no innerHTML with user input):

```js
// Command palette — Cmd+K fuzzy search overlay
// Uses safe DOM methods (createElement/textContent) for rendering

const commands = [
  { id: 'cve-editor', label: 'CVE Editor', section: 'Navigation', action: () => {} },
  { id: 'cvss-calc', label: 'CVSS Calculator', section: 'Navigation', action: () => {} },
  { id: 'new-record', label: 'New CVE Record', section: 'Actions', action: () => {} },
  { id: 'import-json', label: 'Import JSON', section: 'Actions', action: () => {} },
  { id: 'export-json', label: 'Export JSON', section: 'Actions', action: () => {} },
  { id: 'validate', label: 'Validate Record', section: 'Actions', action: () => {} },
  { id: 'toggle-theme', label: 'Toggle Dark Mode', section: 'Settings', action: () => {
    document.getElementById('theme-toggle')?.click();
  }},
];

let visible = false;
let selectedIndex = 0;
let filteredCommands = [...commands];

function fuzzyMatch(query, text) {
  return text.toLowerCase().includes(query.toLowerCase());
}

function render() {
  const results = document.getElementById('palette-results');
  if (!results) return;

  // Clear previous results
  results.textContent = '';

  if (filteredCommands.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'px-3 py-4 text-sm text-vg-400 text-center';
    empty.textContent = 'No results found';
    results.appendChild(empty);
    return;
  }

  let currentSection = '';
  filteredCommands.forEach((cmd, i) => {
    // Section header
    if (cmd.section !== currentSection) {
      currentSection = cmd.section;
      const sectionEl = document.createElement('div');
      sectionEl.className = 'vg-palette-section-label';
      sectionEl.textContent = currentSection;
      results.appendChild(sectionEl);
    }

    // Command item
    const item = document.createElement('div');
    item.className = 'vg-palette-item' + (i === selectedIndex ? ' selected' : '');
    item.setAttribute('data-index', i);
    item.textContent = cmd.label;
    item.addEventListener('click', () => executeCommand(i));
    results.appendChild(item);
  });
}

function executeCommand(index) {
  const cmd = filteredCommands[index];
  if (cmd?.action) {
    hide();
    cmd.action();
  }
}

function show() {
  const palette = document.getElementById('command-palette');
  const input = document.getElementById('palette-input');
  if (!palette) return;
  visible = true;
  palette.classList.remove('hidden');
  input.value = '';
  selectedIndex = 0;
  filteredCommands = [...commands];
  render();
  input?.focus();
}

function hide() {
  const palette = document.getElementById('command-palette');
  if (!palette) return;
  visible = false;
  palette.classList.add('hidden');
}

function onInput(e) {
  const query = e.target.value.trim();
  if (query === '') {
    filteredCommands = [...commands];
  } else {
    filteredCommands = commands.filter(cmd => fuzzyMatch(query, cmd.label));
  }
  selectedIndex = 0;
  render();
}

function onKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
    render();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex = Math.max(selectedIndex - 1, 0);
    render();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    executeCommand(selectedIndex);
  } else if (e.key === 'Escape') {
    hide();
  }
}

export function initCommandPalette() {
  // Cmd+K / Ctrl+K to open
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (visible) {
        hide();
      } else {
        show();
      }
    }
  });

  // Search trigger button
  document.getElementById('search-trigger')?.addEventListener('click', show);

  // Backdrop click to close
  document.getElementById('palette-backdrop')?.addEventListener('click', hide);

  // Input handling
  document.getElementById('palette-input')?.addEventListener('input', onInput);
  document.getElementById('palette-input')?.addEventListener('keydown', onKeydown);
}

// Export for extensibility — other modules can add commands
export function registerCommand(cmd) {
  commands.push(cmd);
}
```

- [ ] **Step 3: Rebuild and verify**

```bash
npm run build:solo
```

Expected: Build succeeds.

- [ ] **Step 4: Add command palette visual tests**

Append these tests to `tests/visual/scaffolding.spec.js`:

```js
test.describe('Command palette', () => {
  test('opens with Cmd+K and shows commands', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');

    await page.keyboard.press('Meta+k');
    await expect(page.locator('#command-palette')).toBeVisible();
    await expect(page.locator('#palette-input')).toBeFocused();

    await expect(page.locator('#palette-results')).toContainText('CVE Editor');
    await expect(page.locator('#palette-results')).toContainText('CVSS Calculator');

    await expect(page).toHaveScreenshot('command-palette-open.png');
  });

  test('filters commands on input', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
    await page.keyboard.press('Meta+k');

    await page.fill('#palette-input', 'cvss');
    await expect(page.locator('#palette-results')).toContainText('CVSS Calculator');
    await expect(page.locator('.vg-palette-item')).toHaveCount(1);
  });

  test('closes with Escape', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
    await page.keyboard.press('Meta+k');
    await expect(page.locator('#command-palette')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#command-palette')).toBeHidden();
  });

  test('opens from search trigger click', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
    await page.click('#search-trigger');
    await expect(page.locator('#command-palette')).toBeVisible();
  });
});
```

- [ ] **Step 5: Run tests with updated snapshots**

```bash
npm run build:solo && npm run test:visual -- --update-snapshots
```

Expected: 10 tests pass (6 layout + 4 command palette).

- [ ] **Step 6: Verify test stability**

```bash
npm run test:visual
```

Expected: 10 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/ tests/
git commit -m "feat: command palette with fuzzy search, keyboard navigation, Cmd+K shortcut"
```

---

## Completion Criteria

After all 3 tasks:
- Sidebar collapses between labeled (220px) and icon rail (48px) with `[` keyboard shortcut
- Sidebar state persists in localStorage
- Mobile responsive: sidebar becomes overlay below 768px with hamburger toggle
- Top bar with search trigger showing `⌘K` hint
- Command palette opens via Cmd+K or clicking search, with fuzzy filtering and keyboard navigation
- Icons rendered from Heroicons inline SVGs (tree-shakeable)
- Theme module extracted and reusable
- 10 visual regression tests passing (layout light/dark/collapsed, persistence, keyboard, palette open/filter/close/click)

## Next Plan

Plan 03 — Form Engine Core: Schema parser, renderer registry, and basic field renderers (string, enum, boolean).
