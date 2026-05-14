# Source Tab, Polish, and Ship — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a JSON source view tab, polish the UI for screenshot-readiness, add E2E integration tests, and prepare for PR.

**Architecture:** A tab bar above the form switches between Form view and Source (JSON) view. The source view uses a plain textarea with monospace font. The CVSS calculator is a separate view accessible from the sidebar.

---

## File Structure

```
(new files)
src/
  ui/
    tabs.js             — Tab switching (Form/Source views)
    toast.js            — Toast notification for save/export feedback
  solo/
    cvss-page.js        — CVSS calculator page (imports existing cvss40.js)

(modified files)
src/
  solo/
    index.html          — Add tab bar, source textarea, toast container
    app.js              — Wire tabs, CVSS navigation
  css/
    vg-components.css   — Tab bar styles, toast styles
```

---

### Task 1: Tab Bar and JSON Source View

**Files:**

- Create: `src/ui/tabs.js`
- Modify: `src/solo/index.html`
- Modify: `src/solo/app.js`
- Modify: `src/css/vg-components.css`

- [ ] **Step 1: Add tab bar styles to vg-components.css**

```css
/* Tab bar */
.vg-tabs {
  @apply flex border-b border-vg-200 dark:border-vg-700 mb-6;
}

.vg-tab {
  @apply px-4 py-2 text-sm font-medium text-vg-500 border-b-2 border-transparent
         cursor-pointer hover:text-vg-700 hover:border-vg-300
         transition-colors -mb-px
         dark:text-vg-400 dark:hover:text-vg-300 dark:hover:border-vg-600;
}

.vg-tab.active {
  @apply text-vg-900 border-vg-900
         dark:text-vg-100 dark:border-white;
}

/* Toast notifications */
.vg-toast-container {
  @apply fixed bottom-4 right-4 z-50 flex flex-col gap-2;
}

.vg-toast {
  @apply px-4 py-2 rounded-lg text-sm font-medium shadow-lg
         bg-vg-900 text-white dark:bg-white dark:text-vg-900
         transform transition-all duration-300;
}

/* Source editor */
.vg-source-editor {
  @apply w-full min-h-[500px] p-4 font-mono text-sm
         bg-vg-50 border border-vg-200 rounded-lg resize-y
         focus:outline-none focus:ring-2 focus:ring-vg-900/10
         dark:bg-vg-900 dark:border-vg-700 dark:text-vg-100;
}
```

- [ ] **Step 2: Create tabs.js**

```js
// Tab switching — Form/Source view toggle

export function initTabs(options = {}) {
  const { onTabChange } = options;
  const tabs = document.querySelectorAll("[data-tab]");
  const panels = document.querySelectorAll("[data-tab-panel]");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      // Update active tab
      tabs.forEach((t) => t.classList.toggle("active", t === tab));

      // Show target panel, hide others
      panels.forEach((p) => {
        p.classList.toggle("hidden", p.dataset.tabPanel !== target);
      });

      onTabChange?.(target);
    });
  });
}
```

- [ ] **Step 3: Create toast.js**

```js
// Toast notifications

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement("div");
    container.className = "vg-toast-container";
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, duration = 2000) {
  const toast = document.createElement("div");
  toast.className = "vg-toast";
  toast.textContent = message;
  getContainer().appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
```

- [ ] **Step 4: Update index.html with tab bar and source panel**

In the content area, add a tab bar between the form header and form-root. Add a source panel.

- [ ] **Step 5: Update app.js to wire tabs and source view**

When switching to Source tab, serialize current document to JSON in the textarea. When switching back to Form, parse the textarea and update the form.

- [ ] **Step 6: Commit**

---

### Task 2: Sidebar Navigation and CVSS Page

**Files:**

- Create: `src/solo/cvss-page.js`
- Modify: `src/solo/app.js`
- Modify: `src/solo/index.html`

- [ ] **Step 1: Create a basic CVSS calculator page**

Import the existing `cvss40.js` calculator. Render a simple CVSS 4.0 metric selector form using the existing schema data structure.

- [ ] **Step 2: Wire sidebar navigation**

Clicking sidebar items switches between CVE Editor and CVSS Calculator views.

- [ ] **Step 3: Commit**

---

### Task 3: E2E Integration Tests

**Files:**

- Modify: `tests/visual/scaffolding.spec.js`

- [ ] **Step 1: Add form interaction tests**

```js
test.describe("Form interactions", () => {
  test("can fill in CVE ID field", async ({ page }) => { ... });
  test("source tab shows JSON", async ({ page }) => { ... });
  test("switching tabs preserves data", async ({ page }) => { ... });
  test("export button works", async ({ page }) => { ... });
});
```

- [ ] **Step 2: Run all tests**

- [ ] **Step 3: Commit**

---

### Task 4: Final Polish and Screenshots

- [ ] **Step 1: Take screenshots for PR**

Generate screenshots in both light and dark mode showing:

- Form view with some data filled in
- Source view
- Mobile viewport

- [ ] **Step 2: Final commit**

---

## Completion Criteria

- Tab bar switches between Form and Source views
- Source view shows formatted JSON, edits sync back to form
- Toast notifications for save/export actions
- Sidebar navigation works (CVE Editor / CVSS Calculator)
- E2E tests for form interactions
- Screenshots ready for PR

## Next Plan

Plan 06 — PR preparation and team mode planning.
