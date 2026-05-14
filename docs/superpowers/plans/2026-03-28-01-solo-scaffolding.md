# Solo Mode Scaffolding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a fresh branch with Vite + Tailwind v4, create the solo mode entry point, and verify the build produces a working standalone HTML file.

**Architecture:** Vite handles both dev server (HMR) and production build. Tailwind v4 processes CSS. Solo mode builds to `standalone/index.html` with all assets inlined. The existing `scripts/standalone.js` Pug-based generator is replaced by a Vite SPA build.

**Tech Stack:** Vite 6, Tailwind CSS v4, PostCSS, AJV (existing dependency for validation)

---

## File Structure

```
(new files)
src/
  solo/
    index.html          — Vite entry HTML (solo mode SPA shell)
    app.js              — Solo mode JS entry point (minimal bootstrap)
  css/
    main.css            — Tailwind directives + component imports
    vg-components.css   — @apply-based component classes
vite.config.js          — Shared Vite config
vite.solo.config.js     — Solo mode build config (outputs to standalone/)
tailwind.config.js      — Tailwind v4 config with custom tokens
postcss.config.js       — PostCSS with Tailwind plugin

(modified files)
package.json            — Add devDependencies + scripts
.gitignore              — Add node_modules patterns for new deps
```

---

### Task 1: Create Branch and Install Dependencies

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create fresh branch from master**

```bash
git checkout master
git pull origin master
git checkout -b ui-modernization
```

- [ ] **Step 2: Install Vite, Tailwind v4, and PostCSS**

```bash
npm install --save-dev vite@^6 @tailwindcss/vite@^4 tailwindcss@^4
```

- [ ] **Step 3: Add build scripts to package.json**

Add these scripts to `package.json` (keep existing scripts intact):

```json
{
  "scripts": {
    "dev": "vite --config vite.solo.config.js",
    "build:solo": "vite build --config vite.solo.config.js",
    "preview:solo": "vite preview --config vite.solo.config.js"
  }
}
```

- [ ] **Step 4: Update .gitignore**

Append to `.gitignore`:

```
# Vite
dist/
*.local
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: create ui-modernization branch, add Vite + Tailwind v4"
```

---

### Task 2: Tailwind and Vite Configuration

**Files:**
- Create: `postcss.config.js`
- Create: `src/css/main.css`
- Create: `src/css/vg-components.css`
- Create: `vite.solo.config.js`

- [ ] **Step 1: Create PostCSS config**

Create `postcss.config.js`:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 2: Create the main CSS entry point**

Create `src/css/main.css`:

```css
@import 'tailwindcss';
@import './vg-components.css';

/* Design tokens — Vulnogram neutral palette */
@theme {
  --color-vg-50: #f9fafb;
  --color-vg-100: #f3f4f6;
  --color-vg-200: #e5e7eb;
  --color-vg-300: #d1d5db;
  --color-vg-400: #9ca3af;
  --color-vg-500: #6b7280;
  --color-vg-600: #4b5563;
  --color-vg-700: #374151;
  --color-vg-800: #1f2937;
  --color-vg-900: #111827;
  --color-vg-950: #030712;

  /* Severity colors */
  --color-severity-critical: #dc2626;
  --color-severity-high: #ea580c;
  --color-severity-medium: #ca8a04;
  --color-severity-low: #2563eb;
  --color-severity-none: #16a34a;

  /* Severity backgrounds (light) */
  --color-severity-critical-bg: #fef2f2;
  --color-severity-high-bg: #fff7ed;
  --color-severity-medium-bg: #fefce8;
  --color-severity-low-bg: #eff6ff;
  --color-severity-none-bg: #f0fdf4;
}
```

- [ ] **Step 3: Create the component CSS file (starter)**

Create `src/css/vg-components.css`:

```css
/* Vulnogram component classes — built with @apply on Tailwind utilities */
/* Each class includes dark: variants for dark mode support */

.vg-btn {
  @apply inline-flex items-center justify-center px-4 py-2
         text-sm font-medium rounded-md
         border border-vg-300 bg-white text-vg-700
         hover:bg-vg-50 transition-colors cursor-pointer
         dark:bg-vg-800 dark:text-vg-200 dark:border-vg-600 dark:hover:bg-vg-700;
}

.vg-btn-primary {
  @apply inline-flex items-center justify-center px-4 py-2
         text-sm font-medium rounded-md
         border border-transparent bg-vg-900 text-white
         hover:bg-vg-800 transition-colors cursor-pointer
         dark:bg-white dark:text-vg-900 dark:hover:bg-vg-100;
}

.vg-btn-ghost {
  @apply inline-flex items-center justify-center px-4 py-2
         text-sm font-medium rounded-md
         border border-transparent bg-transparent text-vg-600
         hover:bg-vg-100 transition-colors cursor-pointer
         dark:text-vg-400 dark:hover:bg-vg-800;
}

.vg-input {
  @apply w-full px-3 py-2 text-sm rounded-lg
         border border-vg-200 bg-white text-vg-900
         placeholder:text-vg-400
         focus:outline-none focus:ring-2 focus:ring-vg-900/10 focus:border-vg-400
         dark:bg-vg-900 dark:text-vg-100 dark:border-vg-700
         dark:placeholder:text-vg-500 dark:focus:ring-white/10;
}

.vg-card {
  @apply border border-vg-200 rounded-xl p-4
         bg-white
         dark:bg-vg-900 dark:border-vg-700;
}

.vg-chip {
  @apply inline-flex items-center px-3 py-1.5
         text-sm text-vg-500 rounded-lg
         border border-dashed border-vg-300
         bg-vg-50 cursor-pointer
         hover:border-vg-400 hover:text-vg-700 hover:bg-vg-100
         transition-colors
         dark:text-vg-400 dark:bg-vg-800/50 dark:border-vg-600
         dark:hover:border-vg-500 dark:hover:text-vg-300;
}

.vg-badge {
  @apply inline-flex items-center px-2 py-0.5
         text-xs font-semibold rounded-full;
}

.vg-badge-critical {
  @apply bg-severity-critical-bg text-severity-critical
         dark:bg-red-900/30 dark:text-red-400;
}

.vg-badge-high {
  @apply bg-severity-high-bg text-severity-high
         dark:bg-orange-900/30 dark:text-orange-400;
}

.vg-badge-medium {
  @apply bg-severity-medium-bg text-severity-medium
         dark:bg-yellow-900/30 dark:text-yellow-400;
}

.vg-badge-low {
  @apply bg-severity-low-bg text-severity-low
         dark:bg-blue-900/30 dark:text-blue-400;
}

.vg-badge-none {
  @apply bg-severity-none-bg text-severity-none
         dark:bg-green-900/30 dark:text-green-400;
}
```

- [ ] **Step 4: Create Vite solo config**

Create `vite.solo.config.js`:

```js
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/solo',
  plugins: [tailwindcss()],
  build: {
    outDir: resolve(__dirname, 'standalone'),
    emptyOutDir: true,
  },
});
```

- [ ] **Step 5: Commit**

```bash
git add postcss.config.js src/css/main.css src/css/vg-components.css vite.solo.config.js
git commit -m "feat: add Tailwind v4 config with design tokens and component classes"
```

---

### Task 3: Solo Mode HTML Entry Point

**Files:**
- Create: `src/solo/index.html`
- Create: `src/solo/app.js`

- [ ] **Step 1: Create the solo mode HTML shell**

Create `src/solo/index.html`:

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
    <!-- Sidebar -->
    <aside id="sidebar" class="w-56 border-r border-vg-200 dark:border-vg-800 flex flex-col bg-vg-50/50 dark:bg-vg-900/50">
      <div class="p-4 font-semibold text-sm tracking-tight">Vulnogram</div>
      <nav class="flex-1 px-2 space-y-0.5 text-sm">
        <a href="#" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-vg-100 dark:bg-vg-800 text-vg-900 dark:text-vg-100 font-medium">
          CVE Editor
        </a>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="flex-1 flex flex-col">
      <!-- Top bar -->
      <header class="h-14 border-b border-vg-200 dark:border-vg-800 flex items-center px-4 gap-4">
        <div class="flex-1"></div>
        <button id="theme-toggle" class="vg-btn-ghost p-2" aria-label="Toggle dark mode">
          <svg class="w-5 h-5 dark:hidden" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg>
          <svg class="w-5 h-5 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>
        </button>
      </header>

      <!-- Content area -->
      <div id="content" class="flex-1 p-6 max-w-4xl mx-auto w-full">
        <h1 class="text-2xl font-semibold mb-2">CVE Editor</h1>
        <p class="text-vg-500 dark:text-vg-400 mb-8">Create and edit CVE records</p>

        <!-- Placeholder for form engine (Task 2+ plans) -->
        <div class="vg-card">
          <p class="text-sm text-vg-500">Form engine will render here.</p>
        </div>
      </div>
    </main>
  </div>

  <script type="module" src="./app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create the solo mode JS entry point**

Create `src/solo/app.js`:

```js
// Solo mode entry point — Vulnogram UI Modernization

// Dark mode toggle
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Initialize theme from localStorage or system preference
function initTheme() {
  const stored = localStorage.getItem('vg-theme');
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  }
}

themeToggle.addEventListener('click', () => {
  html.classList.toggle('dark');
  localStorage.setItem('vg-theme', html.classList.contains('dark') ? 'dark' : 'light');
});

initTheme();

console.log('Vulnogram solo mode initialized');
```

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts, opens browser showing the layout shell with sidebar, topbar, dark mode toggle, and placeholder card. Clicking the moon/sun icon toggles dark mode.

- [ ] **Step 4: Verify production build**

```bash
npm run build:solo
ls standalone/
```

Expected: `standalone/` directory contains `index.html` and `assets/` with bundled CSS and JS.

- [ ] **Step 5: Commit**

```bash
git add src/solo/index.html src/solo/app.js
git commit -m "feat: solo mode HTML shell with sidebar, topbar, and dark mode toggle"
```

---

### Task 4: Verify Tailwind Components Render Correctly

**Files:**
- Create: `tests/visual/scaffolding.spec.js`
- Create: `playwright.config.js`

- [ ] **Step 1: Install Playwright**

Playwright is already in `package.json` but needs browsers installed:

```bash
npx playwright install chromium
```

- [ ] **Step 2: Create Playwright config**

Create `playwright.config.js`:

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './tests/results',
  snapshotDir: './tests/snapshots',
  use: {
    baseURL: 'http://localhost:4173',
  },
  projects: [
    {
      name: 'visual',
      testMatch: /visual\/.*\.spec\.js/,
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: 'npm run preview:solo',
    port: 4173,
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 3: Add test script to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test:visual": "npx playwright test --project=visual"
  }
}
```

- [ ] **Step 4: Write the scaffolding visual test**

Create `tests/visual/scaffolding.spec.js`:

```js
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
```

- [ ] **Step 5: Build and run tests**

```bash
npm run build:solo && npm run test:visual -- --update-snapshots
```

Expected: 3 tests pass. Snapshots created in `tests/snapshots/`. First run uses `--update-snapshots` to create baseline images.

- [ ] **Step 6: Run tests again without --update-snapshots to verify stability**

```bash
npm run test:visual
```

Expected: 3 tests pass, matching the snapshots created in step 5.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.js tests/ package.json
git commit -m "test: add Playwright visual regression tests for solo mode shell"
```

---

## Completion Criteria

After all 4 tasks:
- Fresh `ui-modernization` branch from master
- Vite dev server serves solo mode with HMR at `localhost:5173`
- Tailwind v4 processes CSS with custom design tokens and component classes
- Solo mode shell renders: collapsible sidebar, top bar, dark mode toggle, content placeholder
- Production build outputs to `standalone/` directory
- 3 Playwright visual tests passing (light mode, dark mode, persistence)
- All component classes (`.vg-btn`, `.vg-card`, `.vg-chip`, etc.) defined and available

## Next Plan

Plan 02 — Design System & Layout: Build out the full sidebar (collapsible → icon rail), top bar with search, and responsive breakpoints.
