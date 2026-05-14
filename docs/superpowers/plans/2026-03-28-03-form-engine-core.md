# Form Engine Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the schema-driven form engine that parses JSON Schema and renders progressive disclosure forms with field renderers for all CVE schema types.

**Architecture:** A `FormEngine` class reads JSON Schema, determines required vs optional sections, and renders fields using a registry of type-specific renderers. Top-level schema groups become collapsible section cards. Optional sections appear as `+ Add` chips. All rendering uses safe DOM methods.

**Tech Stack:** Vanilla JS (ES modules), AJV for validation (later plan), Tailwind component classes

---

## File Structure

```
(new files)
src/
  core/
    form-engine.js      — Main engine: parses schema, manages sections, renders form
    renderers/
      index.js          — Renderer registry
      string.js         — Text input, textarea, URL, email, datetime
      enum.js           — Select dropdown and inline pill toggles
      boolean.js        — Toggle switch
      array.js          — Repeatable groups with add/remove
      object.js         — Nested object groups (inline or section card)
    section-manager.js  — Progressive disclosure: chips, expand/collapse sections
    state.js            — Document state: get/set values by JSON path
  css/
    vg-forms.css        — Form-specific component classes

(modified files)
src/
  solo/
    index.html          — Load schema, mount form engine
    app.js              — Initialize form engine with CVE schema
  css/
    main.css            — Import vg-forms.css
```

---

### Task 1: Document State Manager

**Files:**

- Create: `src/core/state.js`

A simple state object that stores the current document as a plain JS object and provides get/set by JSON path (dot-notation like `containers.cna.descriptions.0.value`).

- [ ] **Step 1: Create state.js**

```js
// Document state — get/set values by dot-notation path

let document = {};
const listeners = new Set();

export function getDocument() {
  return document;
}

export function setDocument(doc) {
  document = doc;
  notify();
}

export function getValue(path) {
  if (!path) return document;
  const parts = path.split(".");
  let current = document;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

export function setValue(path, value) {
  if (!path) {
    document = value;
    notify();
    return;
  }
  const parts = path.split(".");
  let current = document;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    if (current[part] == null) {
      // Create intermediate: array if next part is numeric, object otherwise
      current[part] = /^\d+$/.test(nextPart) ? [] : {};
    }
    current = current[part];
  }
  const lastPart = parts[parts.length - 1];
  if (value === undefined) {
    if (Array.isArray(current)) {
      current.splice(Number(lastPart), 1);
    } else {
      delete current[lastPart];
    }
  } else {
    current[lastPart] = value;
  }
  notify();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) {
    try {
      fn(document);
    } catch (e) {
      console.error("State listener error:", e);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/state.js
git commit -m "feat: document state manager with path-based get/set"
```

---

### Task 2: Renderer Registry and String Renderer

**Files:**

- Create: `src/core/renderers/index.js`
- Create: `src/core/renderers/string.js`
- Create: `src/css/vg-forms.css`
- Modify: `src/css/main.css`

- [ ] **Step 1: Create renderer registry**

Create `src/core/renderers/index.js`:

```js
// Renderer registry — maps JSON Schema types to render functions

const renderers = {};

export function registerRenderer(type, renderer) {
  renderers[type] = renderer;
}

export function getRenderer(type) {
  return renderers[type] || renderers["string"]; // fallback to string
}

export function renderField(schema, path, value, onChange) {
  const type = resolveType(schema);
  const renderer = getRenderer(type);
  return renderer(schema, path, value, onChange);
}

function resolveType(schema) {
  if (schema.enum) return "enum";
  if (schema.format === "radio" && schema.enum) return "enum";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "array") return "array";
  if (schema.type === "object") return "object";
  if (schema.type === "integer" || schema.type === "number") return "number";
  return "string";
}
```

- [ ] **Step 2: Create string renderer**

Create `src/core/renderers/string.js`:

```js
// String field renderer — text input, textarea, URL, email, datetime
import { registerRenderer } from "./index.js";

function createLabel(schema, path) {
  const label = document.createElement("label");
  label.className = "vg-field-label";
  label.setAttribute("for", `field-${path}`);
  label.textContent = schema.title || path.split(".").pop();
  return label;
}

function createHelpText(schema) {
  if (!schema.description) return null;
  const help = document.createElement("p");
  help.className = "vg-field-help";
  help.textContent = schema.description;
  return help;
}

function stringRenderer(schema, path, value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "vg-field";
  wrapper.setAttribute("data-path", path);

  // Label
  wrapper.appendChild(createLabel(schema, path));

  // Input or textarea
  let input;
  if (
    schema.format === "textarea" ||
    (schema.maxLength && schema.maxLength > 256)
  ) {
    input = document.createElement("textarea");
    input.className = "vg-input vg-textarea";
    input.rows = 3;
  } else {
    input = document.createElement("input");
    input.className = "vg-input";
    input.type = mapFormat(schema.format);
  }

  input.id = `field-${path}`;
  input.name = path;
  input.value = value ?? "";
  if (schema.examples?.[0]) input.placeholder = schema.examples[0];
  else if (schema.description) input.placeholder = schema.description;
  if (schema.readOnly) input.readOnly = true;
  if (schema.pattern) input.pattern = schema.pattern;

  // Debounced change handler
  let timeout;
  input.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      onChange(path, input.value);
    }, 300);
  });

  wrapper.appendChild(input);

  // Help text
  const help = createHelpText(schema);
  if (help) wrapper.appendChild(help);

  // Error placeholder
  const error = document.createElement("div");
  error.className = "vg-field-error hidden";
  error.setAttribute("data-error-for", path);
  wrapper.appendChild(error);

  return wrapper;
}

function mapFormat(format) {
  switch (format) {
    case "uri":
    case "url":
      return "url";
    case "email":
      return "email";
    case "date-time":
    case "date":
      return "date";
    default:
      return "text";
  }
}

function numberRenderer(schema, path, value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "vg-field";
  wrapper.setAttribute("data-path", path);

  wrapper.appendChild(createLabel(schema, path));

  const input = document.createElement("input");
  input.className = "vg-input";
  input.type = "number";
  input.id = `field-${path}`;
  input.name = path;
  input.value = value ?? "";
  if (schema.minimum != null) input.min = schema.minimum;
  if (schema.maximum != null) input.max = schema.maximum;
  if (schema.readOnly) input.readOnly = true;

  let timeout;
  input.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const val = input.value === "" ? undefined : Number(input.value);
      onChange(path, val);
    }, 300);
  });

  wrapper.appendChild(input);

  const error = document.createElement("div");
  error.className = "vg-field-error hidden";
  error.setAttribute("data-error-for", path);
  wrapper.appendChild(error);

  return wrapper;
}

registerRenderer("string", stringRenderer);
registerRenderer("number", numberRenderer);

export { createLabel, createHelpText };
```

- [ ] **Step 3: Create form-specific CSS**

Create `src/css/vg-forms.css`:

```css
/* Form field components */

.vg-field {
  @apply mb-4;
}

.vg-field-label {
  @apply block text-sm font-medium text-vg-700 mb-1.5
         dark:text-vg-300;
}

.vg-field-label .vg-required {
  @apply text-red-500 ml-0.5;
}

.vg-field-help {
  @apply mt-1 text-xs text-vg-400 dark:text-vg-500;
}

.vg-field-error {
  @apply mt-1 text-xs text-red-600 dark:text-red-400;
}

.vg-textarea {
  @apply min-h-[80px] resize-y;
}

/* Section cards (progressive disclosure) */
.vg-section {
  @apply border border-vg-200 rounded-xl mb-3
         bg-white dark:bg-vg-900 dark:border-vg-700;
}

.vg-section-header {
  @apply flex items-center justify-between px-4 py-3 cursor-pointer
         hover:bg-vg-50 rounded-t-xl transition-colors
         dark:hover:bg-vg-800/50;
}

.vg-section-title {
  @apply text-sm font-semibold text-vg-900 dark:text-vg-100;
}

.vg-section-body {
  @apply px-4 pb-4;
}

.vg-section.collapsed .vg-section-body {
  @apply hidden;
}

/* Array items */
.vg-array-item {
  @apply border border-vg-100 rounded-lg p-3 mb-2
         bg-vg-50/50 dark:bg-vg-800/30 dark:border-vg-700;
}

.vg-array-add {
  @apply text-sm text-vg-500 hover:text-vg-700
         dark:text-vg-400 dark:hover:text-vg-300
         cursor-pointer py-2;
}

/* Pill toggles (for enums) */
.vg-pills {
  @apply flex flex-wrap gap-1.5;
}

.vg-pill {
  @apply px-3 py-1.5 text-sm rounded-lg cursor-pointer
         border border-vg-200 bg-vg-50 text-vg-600
         hover:border-vg-300 hover:bg-vg-100
         transition-colors
         dark:border-vg-700 dark:bg-vg-800 dark:text-vg-400
         dark:hover:border-vg-600 dark:hover:bg-vg-700;
}

.vg-pill.active {
  @apply border-vg-900 bg-vg-900 text-white
         dark:border-white dark:bg-white dark:text-vg-900;
}
```

- [ ] **Step 4: Import vg-forms.css in main.css**

Add to `src/css/main.css` after the existing import:

```css
@import "./vg-forms.css";
```

- [ ] **Step 5: Commit**

```bash
git add src/core/renderers/ src/css/vg-forms.css src/css/main.css
git commit -m "feat: renderer registry, string/number renderers, form CSS"
```

---

### Task 3: Enum, Boolean, Array, and Object Renderers

**Files:**

- Create: `src/core/renderers/enum.js`
- Create: `src/core/renderers/boolean.js`
- Create: `src/core/renderers/array.js`
- Create: `src/core/renderers/object.js`

- [ ] **Step 1: Create enum renderer**

Create `src/core/renderers/enum.js`:

```js
// Enum renderer — pill toggles for short lists, select for long lists
import { registerRenderer } from "./index.js";
import { createLabel } from "./string.js";

function enumRenderer(schema, path, value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "vg-field";
  wrapper.setAttribute("data-path", path);

  wrapper.appendChild(createLabel(schema, path));

  const options = schema.enum || [];

  if (options.length <= 7) {
    // Pill toggles
    const pills = document.createElement("div");
    pills.className = "vg-pills";

    options.forEach((opt) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "vg-pill" + (value === opt ? " active" : "");
      pill.textContent = opt;
      pill.addEventListener("click", () => {
        pills
          .querySelectorAll(".vg-pill")
          .forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        onChange(path, opt);
      });
      pills.appendChild(pill);
    });

    wrapper.appendChild(pills);
  } else {
    // Select dropdown
    const select = document.createElement("select");
    select.className = "vg-input";
    select.id = `field-${path}`;

    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Select...";
    select.appendChild(empty);

    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (value === opt) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener("change", () => {
      onChange(path, select.value || undefined);
    });

    wrapper.appendChild(select);
  }

  const error = document.createElement("div");
  error.className = "vg-field-error hidden";
  error.setAttribute("data-error-for", path);
  wrapper.appendChild(error);

  return wrapper;
}

registerRenderer("enum", enumRenderer);
```

- [ ] **Step 2: Create boolean renderer**

Create `src/core/renderers/boolean.js`:

```js
// Boolean renderer — toggle switch
import { registerRenderer } from "./index.js";
import { createLabel } from "./string.js";

function booleanRenderer(schema, path, value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "vg-field flex items-center gap-3";
  wrapper.setAttribute("data-path", path);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "vg-toggle" + (value ? " active" : "");
  toggle.setAttribute("role", "switch");
  toggle.setAttribute("aria-checked", String(!!value));

  const dot = document.createElement("span");
  dot.className = "vg-toggle-dot";
  toggle.appendChild(dot);

  toggle.addEventListener("click", () => {
    const newVal = !toggle.classList.contains("active");
    toggle.classList.toggle("active", newVal);
    toggle.setAttribute("aria-checked", String(newVal));
    onChange(path, newVal);
  });

  wrapper.appendChild(toggle);

  const label = document.createElement("span");
  label.className = "text-sm font-medium text-vg-700 dark:text-vg-300";
  label.textContent = schema.title || path.split(".").pop();
  wrapper.appendChild(label);

  return wrapper;
}

registerRenderer("boolean", booleanRenderer);
```

- [ ] **Step 3: Create array renderer**

Create `src/core/renderers/array.js`:

```js
// Array renderer — repeatable groups with add/remove
import { registerRenderer } from "./index.js";
import { renderField } from "./index.js";
import { createLabel } from "./string.js";

function arrayRenderer(schema, path, value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "vg-field";
  wrapper.setAttribute("data-path", path);

  wrapper.appendChild(createLabel(schema, path));

  const items = Array.isArray(value) ? value : [];
  const itemSchema = schema.items || {};
  const container = document.createElement("div");
  container.className = "vg-array-container";

  function renderItems() {
    container.textContent = "";
    const currentItems = Array.isArray(value) ? [...value] : [];

    currentItems.forEach((item, i) => {
      const itemWrapper = document.createElement("div");
      itemWrapper.className = "vg-array-item";

      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "vg-btn-ghost text-xs text-red-500 float-right";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        const arr = [...(value || [])];
        arr.splice(i, 1);
        value = arr;
        onChange(path, arr);
        renderItems();
      });
      itemWrapper.appendChild(removeBtn);

      // Render item fields
      const itemPath = `${path}.${i}`;
      if (itemSchema.type === "object" && itemSchema.properties) {
        Object.entries(itemSchema.properties).forEach(([key, propSchema]) => {
          const fieldEl = renderField(
            propSchema,
            `${itemPath}.${key}`,
            item?.[key],
            (p, v) => {
              const arr = [...(value || [])];
              if (!arr[i]) arr[i] = {};
              const relPath = p.substring(itemPath.length + 1);
              setNestedValue(arr[i], relPath, v);
              value = arr;
              onChange(path, arr);
            },
          );
          itemWrapper.appendChild(fieldEl);
        });
      } else {
        const fieldEl = renderField(itemSchema, itemPath, item, (p, v) => {
          const arr = [...(value || [])];
          arr[i] = v;
          value = arr;
          onChange(path, arr);
        });
        itemWrapper.appendChild(fieldEl);
      }

      container.appendChild(itemWrapper);
    });

    // Add button
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "vg-array-add";
    const itemTitle = itemSchema.title || schema.title || "item";
    addBtn.textContent = `+ Add ${itemTitle}`;
    addBtn.addEventListener("click", () => {
      const arr = [...(value || [])];
      arr.push(itemSchema.type === "object" ? {} : "");
      value = arr;
      onChange(path, arr);
      renderItems();
    });
    container.appendChild(addBtn);
  }

  renderItems();
  wrapper.appendChild(container);

  return wrapper;
}

function setNestedValue(obj, path, value) {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] == null) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

registerRenderer("array", arrayRenderer);
```

- [ ] **Step 4: Create object renderer**

Create `src/core/renderers/object.js`:

```js
// Object renderer — renders nested object fields inline
import { registerRenderer } from "./index.js";
import { renderField } from "./index.js";
import { createLabel } from "./string.js";

function objectRenderer(schema, path, value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "vg-field";
  wrapper.setAttribute("data-path", path);

  // Only show label if this is a nested object (not top-level)
  if (path.includes(".")) {
    wrapper.appendChild(createLabel(schema, path));
  }

  const properties = schema.properties || {};
  const required = schema.required || [];

  const fieldsContainer = document.createElement("div");
  fieldsContainer.className = "vg-object-fields";

  Object.entries(properties).forEach(([key, propSchema]) => {
    // Skip hidden properties
    if (propSchema.options?.hidden) return;

    const fieldPath = path ? `${path}.${key}` : key;
    const fieldValue = value?.[key];
    const isRequired = required.includes(key);

    const fieldEl = renderField(propSchema, fieldPath, fieldValue, (p, v) => {
      const obj = { ...(value || {}) };
      const relKey = p.substring(path.length + 1).split(".")[0];
      if (p === fieldPath) {
        obj[key] = v;
      } else {
        // Nested update — let the child renderer handle it
        obj[key] = v;
      }
      onChange(path, obj);
    });

    fieldsContainer.appendChild(fieldEl);
  });

  wrapper.appendChild(fieldsContainer);

  return wrapper;
}

registerRenderer("object", objectRenderer);
```

- [ ] **Step 5: Add toggle switch CSS to vg-forms.css**

Append to `src/css/vg-forms.css`:

```css
/* Toggle switch */
.vg-toggle {
  @apply relative inline-flex h-6 w-11 items-center rounded-full
         bg-vg-200 transition-colors cursor-pointer
         dark:bg-vg-700;
}

.vg-toggle.active {
  @apply bg-vg-900 dark:bg-white;
}

.vg-toggle-dot {
  @apply inline-block h-4 w-4 rounded-full bg-white
         transform transition-transform translate-x-1
         dark:bg-vg-900;
}

.vg-toggle.active .vg-toggle-dot {
  @apply translate-x-6;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/core/renderers/ src/css/vg-forms.css
git commit -m "feat: enum, boolean, array, and object field renderers"
```

---

### Task 4: Form Engine and Section Manager

**Files:**

- Create: `src/core/form-engine.js`
- Create: `src/core/section-manager.js`

- [ ] **Step 1: Create section manager**

Create `src/core/section-manager.js`:

```js
// Section manager — progressive disclosure with collapsible cards and add chips

export function createSection(title, path, options = {}) {
  const { collapsed = false, removable = false, onRemove } = options;

  const section = document.createElement("div");
  section.className = "vg-section" + (collapsed ? " collapsed" : "");
  section.setAttribute("data-section-path", path);

  // Header
  const header = document.createElement("div");
  header.className = "vg-section-header";

  const titleEl = document.createElement("span");
  titleEl.className = "vg-section-title";
  titleEl.textContent = title;
  header.appendChild(titleEl);

  const controls = document.createElement("div");
  controls.className = "flex items-center gap-2";

  // Validation badge placeholder
  const badge = document.createElement("span");
  badge.className = "vg-section-badge hidden";
  badge.setAttribute("data-badge-for", path);
  controls.appendChild(badge);

  // Collapse chevron
  const chevron = document.createElement("span");
  chevron.className = "text-vg-400 transition-transform";
  chevron.textContent = collapsed ? "›" : "‹";
  controls.appendChild(chevron);

  header.appendChild(controls);

  header.addEventListener("click", () => {
    const isCollapsed = section.classList.toggle("collapsed");
    chevron.textContent = isCollapsed ? "›" : "‹";
  });

  section.appendChild(header);

  // Body
  const body = document.createElement("div");
  body.className = "vg-section-body";
  section.appendChild(body);

  return { section, body, header };
}

export function createChip(label, onClick) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "vg-chip";
  chip.textContent = `+ ${label}`;
  chip.addEventListener("click", onClick);
  return chip;
}

export function createChipBar(chips) {
  const bar = document.createElement("div");
  bar.className = "flex flex-wrap gap-2 mt-4";
  bar.setAttribute("data-chip-bar", "");
  chips.forEach((chip) => bar.appendChild(chip));
  return bar;
}
```

- [ ] **Step 2: Create form engine**

Create `src/core/form-engine.js`:

```js
// Form Engine — parses JSON Schema, renders progressive disclosure form

import { renderField } from "./renderers/index.js";
import { createSection, createChip, createChipBar } from "./section-manager.js";
import {
  setValue,
  getValue,
  getDocument,
  setDocument,
  subscribe,
} from "./state.js";

// Import all renderers to register them
import "./renderers/string.js";
import "./renderers/enum.js";
import "./renderers/boolean.js";
import "./renderers/array.js";
import "./renderers/object.js";

export class FormEngine {
  constructor(container, schema, options = {}) {
    this.container = container;
    this.schema = schema;
    this.options = options;
    this.sections = new Map();
    this.chips = new Map();
  }

  mount(initialValue = {}) {
    setDocument(initialValue);
    this.render();
  }

  render() {
    this.container.textContent = "";
    const doc = getDocument();

    // Determine the active schema branch
    // CVE schema uses oneOf at root for PUBLISHED/REJECTED states
    const activeSchema = this.resolveSchema(this.schema, doc);
    if (!activeSchema?.properties) return;

    const required = activeSchema.required || [];
    const properties = activeSchema.properties;

    // Separate top-level groups into required (always visible) and optional (chips)
    const requiredSections = [];
    const optionalSections = [];

    Object.entries(properties).forEach(([key, propSchema]) => {
      if (propSchema.options?.hidden) return;

      const isRequired = required.includes(key);
      const hasValue =
        doc[key] != null &&
        (typeof doc[key] !== "object" || Object.keys(doc[key]).length > 0);

      if (isRequired || hasValue || propSchema.type !== "object") {
        requiredSections.push({
          key,
          schema: propSchema,
          required: isRequired,
        });
      } else {
        optionalSections.push({ key, schema: propSchema });
      }
    });

    // Render required/populated sections
    requiredSections.forEach(({ key, schema: propSchema, required: isReq }) => {
      this.renderTopLevelField(key, propSchema, isReq);
    });

    // Render optional section chips
    if (optionalSections.length > 0) {
      const divider = document.createElement("div");
      divider.className = "border-t border-vg-200 dark:border-vg-700 mt-6 mb-4";
      this.container.appendChild(divider);

      const chipLabel = document.createElement("div");
      chipLabel.className =
        "text-xs font-medium text-vg-400 uppercase tracking-wider mb-2 dark:text-vg-500";
      chipLabel.textContent = "Add sections";
      this.container.appendChild(chipLabel);

      const chips = optionalSections.map(({ key, schema: propSchema }) => {
        const title = propSchema.title || key;
        return createChip(title, () => {
          // Initialize empty value and re-render
          const doc = getDocument();
          if (propSchema.type === "array") {
            doc[key] = [];
          } else {
            doc[key] = {};
          }
          setDocument(doc);
          this.render();
        });
      });

      this.container.appendChild(createChipBar(chips));
    }

    // Cmd+K hint
    const hint = document.createElement("div");
    hint.className =
      "mt-6 py-2 text-center text-xs text-vg-400 dark:text-vg-500";
    hint.textContent = "\u2318K to jump to any section";
    this.container.appendChild(hint);
  }

  renderTopLevelField(key, propSchema, isRequired) {
    const value = getValue(key);

    if (propSchema.type === "object" && propSchema.properties) {
      // Render as a collapsible section card
      const title = propSchema.title || key;
      const { section, body } = createSection(title, key);

      const innerRequired = propSchema.required || [];
      Object.entries(propSchema.properties).forEach(
        ([propKey, innerSchema]) => {
          if (innerSchema.options?.hidden) return;

          const fieldPath = `${key}.${propKey}`;
          const fieldValue = value?.[propKey];

          const fieldEl = renderField(
            innerSchema,
            fieldPath,
            fieldValue,
            (path, val) => {
              setValue(path, val);
            },
          );
          body.appendChild(fieldEl);
        },
      );

      this.container.appendChild(section);
    } else if (propSchema.type === "array") {
      // Render array as section card
      const title = propSchema.title || key;
      const { section, body } = createSection(title, key);

      const fieldEl = renderField(propSchema, key, value, (path, val) => {
        setValue(path, val);
      });
      body.appendChild(fieldEl);
      this.container.appendChild(section);
    } else {
      // Simple field — render inline
      const fieldEl = renderField(propSchema, key, value, (path, val) => {
        setValue(path, val);
      });
      this.container.appendChild(fieldEl);
    }
  }

  resolveSchema(schema, value) {
    // Handle oneOf — pick the matching branch based on current value
    if (schema.oneOf) {
      // For CVE schema, pick based on cveMetadata.state
      // Default to first option (PUBLISHED)
      return this.mergeOneOf(schema, schema.oneOf[0]);
    }
    return schema;
  }

  mergeOneOf(base, branch) {
    // Merge base schema properties with the selected oneOf branch
    const merged = { ...base };
    delete merged.oneOf;
    if (branch.properties) {
      merged.properties = {
        ...(merged.properties || {}),
        ...branch.properties,
      };
    }
    if (branch.required) {
      merged.required = [...(merged.required || []), ...branch.required];
    }
    return merged;
  }

  getValue() {
    return getDocument();
  }

  setValue(doc) {
    setDocument(doc);
    this.render();
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/core/form-engine.js src/core/section-manager.js
git commit -m "feat: form engine with progressive disclosure sections and chip bar"
```

---

### Task 5: Wire Up Form Engine to Solo Mode

**Files:**

- Modify: `src/solo/index.html`
- Modify: `src/solo/app.js`

- [ ] **Step 1: Update index.html to include form mount point**

In `src/solo/index.html`, replace the content area placeholder:

Replace:

```html
<h1 class="text-2xl font-semibold mb-2">CVE Editor</h1>
<p class="text-vg-500 dark:text-vg-400 mb-8">Create and edit CVE records</p>

<!-- Placeholder for form engine -->
<div class="vg-card">
  <p class="text-sm text-vg-500">Form engine will render here.</p>
</div>
```

With:

```html
<!-- Form header (populated by app.js) -->
<div id="form-header" class="flex items-center justify-between mb-6">
  <div>
    <div class="text-sm text-vg-500 dark:text-vg-400" id="form-status">
      New Record
    </div>
    <h1 class="text-2xl font-semibold" id="form-title">CVE Editor</h1>
  </div>
  <div class="flex gap-2">
    <button id="btn-save-draft" class="vg-btn">Save Draft</button>
    <button id="btn-export" class="vg-btn-primary">Export JSON</button>
  </div>
</div>

<!-- Form engine mount point -->
<div id="form-root"></div>
```

- [ ] **Step 2: Update app.js to initialize form engine**

Replace `src/solo/app.js`:

```js
// Solo mode entry point — Vulnogram UI Modernization
import { initTheme, toggleTheme } from "../ui/theme.js";
import { initSidebar } from "../ui/sidebar.js";
import { initCommandPalette } from "../ui/command-palette.js";
import { FormEngine } from "../core/form-engine.js";

// Initialize UI
initTheme();
document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
initSidebar();
initCommandPalette();

// Initialize form engine
async function initForm() {
  const formRoot = document.getElementById("form-root");
  if (!formRoot) return;

  try {
    // Load CVE schema — in production this will be bundled
    // For now, use a minimal test schema to verify the engine works
    const schema = getDefaultSchema();

    const engine = new FormEngine(formRoot, schema);
    engine.mount({});

    // Export button
    document.getElementById("btn-export")?.addEventListener("click", () => {
      const data = engine.getValue();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cve-record.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    // Make accessible for debugging
    window.__vulnogramEngine = engine;
  } catch (err) {
    console.error("Failed to initialize form engine:", err);
    formRoot.textContent = "Failed to load form engine.";
  }
}

function getDefaultSchema() {
  // Minimal CVE-like schema for testing the form engine
  // Will be replaced with the real cve5.schema.json in a later plan
  return {
    type: "object",
    properties: {
      cveMetadata: {
        type: "object",
        title: "CVE Metadata",
        properties: {
          cveId: {
            type: "string",
            title: "CVE ID",
            examples: ["CVE-2024-"],
            description: "The CVE identifier",
          },
          state: {
            type: "string",
            title: "State",
            enum: ["PUBLISHED", "RESERVED", "REJECTED"],
          },
          datePublic: {
            type: "string",
            title: "Date Public",
            format: "date",
          },
        },
        required: ["cveId", "state"],
      },
      containers: {
        type: "object",
        title: "Containers",
        properties: {
          cna: {
            type: "object",
            title: "CNA Container",
            properties: {
              title: {
                type: "string",
                title: "Vulnerability Title",
                description: "A short title for this vulnerability",
              },
              descriptions: {
                type: "array",
                title: "Descriptions",
                items: {
                  type: "object",
                  title: "Description",
                  properties: {
                    lang: {
                      type: "string",
                      title: "Language",
                      enum: ["en", "es", "fr", "de", "ja", "zh"],
                      default: "en",
                    },
                    value: {
                      type: "string",
                      title: "Description Text",
                      format: "textarea",
                      description: "Describe the vulnerability",
                    },
                  },
                  required: ["lang", "value"],
                },
              },
              affected: {
                type: "array",
                title: "Affected Products",
                items: {
                  type: "object",
                  title: "Product",
                  properties: {
                    vendor: { type: "string", title: "Vendor" },
                    product: { type: "string", title: "Product" },
                    versions: {
                      type: "array",
                      title: "Versions",
                      items: {
                        type: "object",
                        title: "Version",
                        properties: {
                          version: { type: "string", title: "Version" },
                          status: {
                            type: "string",
                            title: "Status",
                            enum: ["affected", "unaffected", "unknown"],
                          },
                        },
                      },
                    },
                  },
                },
              },
              metrics: {
                type: "object",
                title: "CVSS Metrics",
                properties: {
                  cvssV4_0: {
                    type: "object",
                    title: "CVSS v4.0",
                    properties: {
                      vectorString: {
                        type: "string",
                        title: "Vector String",
                        readOnly: true,
                      },
                      baseScore: {
                        type: "number",
                        title: "Base Score",
                        minimum: 0,
                        maximum: 10,
                      },
                      baseSeverity: {
                        type: "string",
                        title: "Severity",
                        enum: ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
                      },
                    },
                  },
                },
              },
              references: {
                type: "array",
                title: "References",
                items: {
                  type: "object",
                  title: "Reference",
                  properties: {
                    url: { type: "string", title: "URL", format: "uri" },
                    name: { type: "string", title: "Name" },
                  },
                },
              },
              credits: {
                type: "array",
                title: "Credits",
                items: {
                  type: "object",
                  title: "Credit",
                  properties: {
                    lang: { type: "string", title: "Language", default: "en" },
                    value: { type: "string", title: "Name" },
                    type: {
                      type: "string",
                      title: "Type",
                      enum: [
                        "finder",
                        "reporter",
                        "analyst",
                        "coordinator",
                        "remediation developer",
                        "remediation reviewer",
                        "remediation verifier",
                        "tool",
                        "sponsor",
                        "other",
                      ],
                    },
                  },
                },
              },
            },
            required: ["descriptions"],
          },
        },
      },
    },
    required: ["cveMetadata", "containers"],
  };
}

initForm();
```

- [ ] **Step 3: Build and verify**

```bash
npm run build:solo
```

Expected: Build succeeds.

- [ ] **Step 4: Update visual tests**

Add a form engine test to `tests/visual/scaffolding.spec.js`:

```js
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

  test("enum fields render as pills", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#form-root");

    // State field should render as pills
    const pills = page.locator(".vg-pills").first();
    await expect(pills).toBeVisible();
    await expect(pills).toContainText("PUBLISHED");
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm run build:solo && npm run test:visual -- --update-snapshots
npm run test:visual
```

Expected: 13 tests pass (10 existing + 3 new).

- [ ] **Step 6: Commit**

```bash
git add src/ tests/
git commit -m "feat: wire form engine to solo mode with test CVE schema"
```

---

## Completion Criteria

After all 5 tasks:

- FormEngine class mounts on a container, parses schema, renders progressive disclosure form
- Renderers for string, number, enum (pills/select), boolean (toggle), array (repeatable), object (nested)
- Section manager creates collapsible cards for top-level objects/arrays
- Optional sections appear as `+ Add` chips below a divider
- Document state manager tracks values by path
- Export JSON button works
- 13 visual tests passing
- Form renders with a test CVE schema showing metadata, descriptions, and optional sections

## Next Plan

Plan 04 — Validation, Drafts, and Features: AJV validation, draft management (IndexedDB), import/export, ACE source tab.
