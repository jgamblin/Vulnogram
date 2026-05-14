# Validation, Drafts, and Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add schema validation (AJV), local draft persistence (IndexedDB), JSON import/export, and load the real CVE5 schema so the form engine renders actual CVE records.

**Architecture:** AJV validates against the CVE5 JSON Schema on every change (debounced). Drafts auto-save to IndexedDB with the same `vulnogram_cache` database pattern as the existing codebase. Import reads JSON files, export downloads them. The real CVE5 schema replaces the test schema.

**Tech Stack:** AJV 8 (npm), IndexedDB (native), Vite (bundles schema as JSON import)

---

## File Structure

```
(new files)
src/
  core/
    validator.js        — AJV validation wrapper
    drafts.js           — IndexedDB draft persistence
    import-export.js    — File import/export utilities

(modified files)
src/
  solo/
    app.js              — Wire validation, drafts, import/export, real schema
  css/
    vg-forms.css        — Validation error styles
package.json            — Add ajv dependency
```

---

### Task 1: Install AJV and Create Validator

**Files:**

- Modify: `package.json`
- Create: `src/core/validator.js`

- [ ] **Step 1: Install AJV**

```bash
npm install ajv@^8 ajv-formats@^3
```

- [ ] **Step 2: Create validator.js**

Create `src/core/validator.js`:

```js
// Schema validator — AJV wrapper with error mapping to field paths
import Ajv from "ajv";
import addFormats from "ajv-formats";

let ajv = null;
let validate = null;

export function initValidator(schema) {
  ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false,
    validateFormats: false,
  });
  addFormats(ajv);

  try {
    validate = ajv.compile(schema);
  } catch (e) {
    console.warn("Schema compilation failed, validation disabled:", e.message);
    validate = null;
  }
}

export function validateDocument(doc) {
  if (!validate) return { valid: true, errors: [] };

  const valid = validate(doc);
  if (valid) return { valid: true, errors: [] };

  const errors = (validate.errors || []).map((err) => {
    const path = err.instancePath
      ? err.instancePath.substring(1).replace(/\//g, ".")
      : "";
    return {
      path,
      message: err.message || "Invalid value",
      keyword: err.keyword,
      params: err.params,
    };
  });

  return { valid: false, errors };
}

export function showErrors(errors, container) {
  // Clear all existing errors
  container.querySelectorAll(".vg-field-error").forEach((el) => {
    el.textContent = "";
    el.classList.add("hidden");
  });

  // Clear section badges
  container.querySelectorAll(".vg-section-badge").forEach((el) => {
    el.textContent = "";
    el.classList.add("hidden");
  });

  if (!errors.length) return;

  // Group errors by top-level section
  const sectionErrors = {};

  errors.forEach((err) => {
    // Show field-level error
    const errorEl = container.querySelector(`[data-error-for="${err.path}"]`);
    if (errorEl) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("hidden");
    }

    // Track section error counts
    const section = err.path.split(".")[0];
    sectionErrors[section] = (sectionErrors[section] || 0) + 1;
  });

  // Update section badges
  Object.entries(sectionErrors).forEach(([section, count]) => {
    const badge = container.querySelector(`[data-badge-for="${section}"]`);
    if (badge) {
      badge.textContent = `${count} issue${count > 1 ? "s" : ""}`;
      badge.className = "vg-badge vg-badge-high text-xs";
      badge.classList.remove("hidden");
    }
  });
}
```

- [ ] **Step 3: Add validation error highlight styles**

Append to `src/css/vg-forms.css`:

```css
/* Validation error states */
.vg-field.has-error .vg-input {
  @apply border-red-400 dark:border-red-500;
}

.vg-field.has-error .vg-field-label {
  @apply text-red-600 dark:text-red-400;
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json src/core/validator.js src/css/vg-forms.css
git commit -m "feat: AJV schema validation with error display"
```

---

### Task 2: IndexedDB Draft Persistence

**Files:**

- Create: `src/core/drafts.js`

- [ ] **Step 1: Create drafts.js**

Create `src/core/drafts.js`:

```js
// Draft persistence — IndexedDB storage for offline CVE records

const DB_NAME = "vulnogram_cache";
const STORE_NAME = "docs";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function saveDraft(id, doc) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({
      id,
      doc,
      updatedAt: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDraft(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result?.doc || null);
    request.onerror = () => reject(request.error);
  });
}

export async function listDrafts() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDraft(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/drafts.js
git commit -m "feat: IndexedDB draft persistence for offline CVE records"
```

---

### Task 3: Import/Export Utilities

**Files:**

- Create: `src/core/import-export.js`

- [ ] **Step 1: Create import-export.js**

Create `src/core/import-export.js`:

```js
// Import/Export — file handling for CVE JSON records

export function exportJSON(doc, filename = "cve-record.json") {
  // Clean document for export (remove internal fields)
  const cleaned = cleanForExport(doc);
  const json = JSON.stringify(cleaned, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const doc = JSON.parse(reader.result);
          resolve(doc);
        } catch (e) {
          reject(new Error("Invalid JSON file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
    input.click();
  });
}

function cleanForExport(doc) {
  const cleaned = JSON.parse(JSON.stringify(doc));
  // Remove internal CNA_private fields if present
  delete cleaned.CNA_private;
  return cleaned;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/import-export.js
git commit -m "feat: JSON import/export utilities for CVE records"
```

---

### Task 4: Load Real CVE5 Schema and Wire Everything

**Files:**

- Modify: `src/solo/app.js`
- Modify: `src/solo/index.html`

This task integrates everything: loads the real CVE5 schema, initializes validation, wires up drafts, and adds import/export buttons.

- [ ] **Step 1: Update app.js with full integration**

Replace `src/solo/app.js` to:

1. Import the real CVE5 schema from `../../default/cve5/cve5.schema.json` (Vite handles JSON imports)
2. Initialize AJV validator with the schema
3. Auto-save drafts on changes (2-second debounce)
4. Load draft from URL parameter on startup
5. Wire import/export buttons
6. Validate on every change and show errors

- [ ] **Step 2: Add import button to index.html header**

In the form header button group, add an Import JSON button before Save Draft.

- [ ] **Step 3: Build and verify**

```bash
npm run build:solo
```

- [ ] **Step 4: Update tests**

Add tests for:

- Form renders with real CVE schema sections
- Export button triggers download
- Import button opens file dialog

- [ ] **Step 5: Run tests**

```bash
npm run build:solo && npm run test:visual -- --update-snapshots
npm run test:visual
```

- [ ] **Step 6: Commit**

```bash
git add src/ tests/ package.json
git commit -m "feat: wire validation, drafts, import/export with real CVE5 schema"
```

---

## Completion Criteria

After all 4 tasks:

- AJV validates against the real CVE5 JSON Schema
- Validation errors display inline at field level and as section badges
- Drafts auto-save to IndexedDB (2-second debounce)
- Save Draft button manually saves with confirmation
- Import JSON button loads a file into the form
- Export JSON button downloads the current document
- Real CVE5 schema renders all sections with progressive disclosure
- All tests passing

## Next Plan

Plan 05 — Source Tab, CVSS Calculator, and Polish: ACE editor for raw JSON, CVSS 4.0 calculator integration, UI polish.
