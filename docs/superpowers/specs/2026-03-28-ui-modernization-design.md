# Vulnogram UI Modernization — Design Spec

## Overview

A clean-slate rebuild of Vulnogram's entire frontend: CSS, templates, client-side JavaScript, and form rendering. Replaces the existing custom CSS and JSON Editor-driven forms with a Tailwind CSS design system, progressive disclosure form engine, and modern build tooling. Ships with full Playwright test coverage (visual regression + E2E integration).

**Build order:** Solo mode first (vulnogram.org is the public face), then team mode.

**Branch strategy:** Fresh branch `ui-modernization` from master. No incremental migration — the old UI layer is replaced entirely. The existing `ui-tailwind-v2` branch is abandoned.

## Design Direction

Clean SaaS / Notion-like aesthetic:
- Light-first with dark mode from day one (Tailwind `class` strategy, system-preference default + manual toggle)
- Generous whitespace, soft borders (`1px solid` light grays), clean typography (system font stack)
- Color reserved for semantics: severity badges, validation states, interactive elements
- Neutral gray palette — not warm/stone, keeping it professional and clean
- Border radius: 8px for cards/inputs, 6px for buttons/chips, 12px for badges

## CSS Framework

Tailwind CSS v4 with an `@apply`-based component layer.

Component classes defined in `src/css/vg-components.css`:
- `.vg-btn`, `.vg-btn-primary`, `.vg-btn-ghost` — button variants
- `.vg-input`, `.vg-select`, `.vg-textarea` — form inputs
- `.vg-card` — expandable form section cards
- `.vg-chip` — dashed `+ Add section` affordances
- `.vg-badge` — severity badges (CRITICAL, HIGH, MEDIUM, LOW, NONE)
- `.vg-sidebar`, `.vg-sidebar-collapsed` — collapsible sidebar states
- `.vg-topbar` — top navigation bar

Pug templates use these semantic component classes, not raw Tailwind utilities. This keeps templates readable and avoids the utility-class sprawl that caused problems in prior attempts.

All component classes include `dark:` variants. Tailwind CLI watches `views/**/*.pug` and `src/**/*.js` for class extraction.

## Layout

**Collapsible sidebar + top bar:**

- Sidebar defaults to full labeled view (~220px) showing section icons + names, recent records, and navigation context
- Collapses to an icon-only rail (~48px) via keyboard shortcut (`[`) or toggle button
- Light background, flat styling — no heavy dark sidebar
- Top bar: logo/branding left, search center, user menu + theme toggle right
- `Cmd+K` command palette for power-user navigation (fuzzy search across sections, fields, and actions)

**Content area** takes remaining width. Single-column layout for the editor — no right-panel split.

## Progressive Disclosure Form Engine

Replaces JSON Editor entirely. A custom `FormEngine` class reads the CVE JSON Schema and renders progressive disclosure forms.

### Schema-Driven Rendering

Each JSON Schema property type maps to a renderer:
- `string` → text input (with subtypes for URL, email, datetime, textarea via `format`)
- `enum` → select dropdown or inline pill toggles (for short lists)
- `boolean` → toggle switch
- `array` → repeatable group with add/remove/reorder
- `object` → nested section card or inline field group

The schema's `required` array determines default visibility. Schema metadata (`title`, `description`, `examples`) drives labels, help text, and placeholders.

### Disclosure Behavior

- **New record:** Only required fields and description visible. Optional top-level sections (affected products, metrics, references, credits, timeline, CWE) appear as `+ Add` dashed chips below a divider
- **Existing record:** Sections with data auto-expand. Empty optional sections remain as chips
- **Section cards:** Each expanded section is a collapsible bordered card with a header showing the section name, validation status, and collapse toggle. Users can collapse sections they're done with
- **Nested objects:** Render inline within their parent card. Only top-level schema groups get their own cards

### Array Handling

For repeated items (e.g., multiple affected products):
- Each array item renders as a sub-card within the section
- `+ Add [item]` button at the bottom of the section
- Items are individually collapsible — show a summary line when collapsed (e.g., "Acme Corp / libfoo / ≤ 2.3.1")
- Drag to reorder, click to delete (with confirmation)

### Validation

- Real-time inline validation as users type (debounced, ~300ms)
- Schema-driven: required fields, pattern matching, enum constraints, format validation
- Section-level validation badges on each card header (green check or error count)
- Full-document validation via AJV available as a "Validate" action
- Validation errors shown inline below the offending field, styled as subtle red text

### Command Palette

`Cmd+K` opens a fuzzy search overlay:
- Search section names and field labels
- Jump to any section or add an optional section
- Surface actions: Save Draft, Publish, Export JSON, Import JSON, Validate
- Keyboard-navigable (arrow keys + enter)

## View Architecture

### Solo Mode (Phase 1 — Priority)

Single-page application served as static HTML from `standalone/index.html`:
- **Editor view:** Progressive disclosure form + JSON source tab (ACE editor) + preview/export tab. Tab switching via horizontal tab bar
- **Draft management:** Sidebar drawer or modal listing locally-stored drafts (localStorage). Import/export JSON files
- **CVSS calculator:** Inline within the metrics section card — CVSS score updates live as vectors are toggled. Not a separate page
- **Command palette:** `Cmd+K` overlay

Everything runs in the browser. No login, no list view, no server dependency.

### Team Mode (Phase 2)

Server-rendered Pug templates using the same design system:
- **Login page:** Clean centered card on a minimal page
- **List view:** Sortable table with horizontal pill-tab facet filters, search bar, bulk actions, pagination
- **Editor view:** Same form engine as solo mode plus: real-time collaboration indicators (avatar presence dots), comment thread sidebar, version history panel
- **Dashboard:** Chart cards for CVE statistics, recent activity feed
- **User management:** Profile editing, admin user list

### Shared Between Modes

The form engine, design tokens, Tailwind components, and all form-related JS are identical. Solo mode bundles them into a single HTML file. Team mode loads them as separate assets served by Express.

## Assets Removed

- `public/css/min.css` — replaced by Tailwind output (`public/dist/vg-tailwind.css`)
- `public/css/vg-forms.css` — replaced by component classes
- `public/css/vg-icons.css` (137KB icon font) — replaced by inline SVG icons (Heroicons, tree-shaken to only icons used)
- `public/js/jsoneditor.min.js` (535KB) — replaced by FormEngine
- `scripts/bundle-editor.js` (custom concatenation bundler) — replaced by Vite
- `Makefile` solo build targets — replaced by `npm run build:solo` (Vite)

## Build System

**Vite** replaces the custom bundler and handles Tailwind CSS processing, JS module bundling, and minification.

### Client-Side JS Structure

```
src/
  core/
    form-engine.js        — Schema parser + component tree builder
    renderers/
      string.js           — Text, textarea, URL, email inputs
      enum.js             — Select, pill toggles
      array.js            — Repeatable groups with add/remove/reorder
      object.js           — Nested section cards
      boolean.js          — Checkboxes, toggles
    validation.js         — AJV-based inline + full-document validation
    state.js              — Document state management
  ui/
    sidebar.js            — Collapsible sidebar with rail toggle
    command-palette.js    — Cmd+K fuzzy search and actions
    section-chips.js      — Progressive disclosure "+ Add" chips
    theme.js              — Dark mode toggle + system preference detection
    feedback.js           — Toast notifications
  features/
    drafts.js             — localStorage draft management
    export.js             — JSON export/import, preview rendering
    cvss.js               — CVSS v4 inline calculator
    ace-source.js         — ACE editor wrapper for JSON source tab
  team/                   — Team-mode only (not bundled in solo)
    realtime.js           — Socket.IO collaboration
    comments.js           — Comment threads
    history.js            — Version history viewer
  solo/
    app.js                — Solo mode entry point
  team/
    app.js                — Team mode entry point
```

Proper ES modules with tree-shaking. Solo mode excludes `team/` modules entirely.

### Build Commands

```
npm run dev             — Vite dev server (solo mode with HMR)
npm run dev:team        — Express + Vite middleware (team mode)
npm run build:solo      — Production solo build → standalone/
npm run build           — Production team build → public/dist/
npm run test            — All Playwright tests
npm run test:visual     — Visual regression tests only
npm run test:e2e        — E2E integration tests only
```

## Testing Strategy

### Visual Regression Tests (Playwright)

Snapshot every major view state in light and dark mode across three breakpoints (desktop 1280px, tablet 768px, mobile 375px):

**Solo mode:**
- Empty form (new record)
- Form with sections expanded
- Form with data filled
- Draft drawer open
- Command palette open
- CVSS calculator active
- JSON source tab

**Team mode:**
- Login page
- List view (empty, populated, filtered)
- Editor view (with collaboration indicators)
- Dashboard

Snapshots committed to the repo as the visual baseline. PRs that change the UI update snapshots intentionally.

### E2E Integration Tests (Playwright)

Require a running app + MongoDB via `docker-compose.test.yml`:

- **Auth flow:** Register, login, logout, invalid credentials
- **CVE lifecycle:** Create → fill required fields → add optional sections → save → publish → verify in list → edit → verify history
- **Form engine:** Verify chips appear, clicking chip expands section, sections with data auto-expand on reload
- **Validation:** Submit with missing required fields → verify inline errors → fix → verify errors clear
- **Search & list:** Create multiple records → search → filter → sort → bulk actions
- **Real-time collaboration:** Two browser contexts editing the same record → verify patches sync
- **Solo mode:** Full lifecycle — create, edit, save draft, load draft, export JSON, import JSON
- **Draft persistence:** Create draft → reload → verify draft restored from localStorage

### Test Infrastructure

- `docker-compose.test.yml` — MongoDB for integration tests
- `playwright.config.js` — separate projects for visual and integration tests
- GitHub Actions workflow alongside existing CodeQL
- `npm run test` runs all tests; `npm run test:visual` and `npm run test:e2e` run independently

## PR Strategy

- Screenshots captured from Playwright visual regression tests included directly in the PR body
- PR targets master from a fresh branch (not the existing `ui-tailwind-v2`)
- Phase 1 PR: Solo mode with full visual regression tests + solo E2E tests
- Phase 2 PR: Team mode with integration tests and real-time collaboration tests
