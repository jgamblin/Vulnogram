# Team Mode Integration — Implementation Plan

**Goal:** Integrate the new Tailwind/Vite UI into the Express/Pug team mode, replacing the old CSS framework and JSON Editor with the modern form engine.

**Approach:** Hybrid — keep Express/Pug server-side rendering, but serve new Vite-built CSS/JS assets. The form engine mounts client-side on a DOM element, similar to how JSON Editor worked.

**What changes:** CSS, client-side JS, Pug templates. **What stays:** Express routes, middleware, MongoDB, authentication, realtime collaboration protocol.

---

## File Structure

```
(new files)
vite.team.config.js           — Vite config for team mode assets
src/
  team/
    editor.js                 — Team mode editor entry (form engine + realtime)
    list.js                   — Team mode list page JS
  css/
    team.css                  — Team mode CSS entry (imports main.css + team overrides)

(modified files)
views/
  head.pug                    — Load new CSS/JS instead of old
  layout.pug                  — New sidebar/topbar with Tailwind classes
  edit.pug                    — Mount form engine instead of JSON Editor
  list.pug                    — Update list styling
  splash.pug                  — Modernize login page
package.json                  — Add build:team script
```

---

### Task 1: Vite Team Mode Build Config

Create a Vite config that builds team mode assets (CSS + JS) to `public/dist/`.

- [ ] **Step 1: Create `vite.team.config.js`**

```js
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: resolve(__dirname, "public/dist"),
    emptyOutDir: true,
    lib: {
      entry: {
        editor: resolve(__dirname, "src/team/editor.js"),
        list: resolve(__dirname, "src/team/list.js"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
```

- [ ] **Step 2: Create team CSS entry**

```css
/* src/css/team.css */
@import "./main.css";

/* Team mode overrides */
/* Server-rendered pages need these additional styles */
```

- [ ] **Step 3: Create team editor entry**

```js
// src/team/editor.js — Team mode editor
import "../css/team.css";
import { FormEngine } from "../core/form-engine.js";
import { derefSchema } from "../core/schema-deref.js";
import {
  initValidator,
  validateDocument,
  showErrors,
} from "../core/validator.js";
import { initTheme, toggleTheme } from "../ui/theme.js";
import { initTabs } from "../ui/tabs.js";
import { showToast } from "../ui/toast.js";
import { subscribe, getDocument, setDocument } from "../core/state.js";

// Expose to global scope for Pug template usage
window.VulnogramEditor = {
  FormEngine,
  derefSchema,
  initValidator,
  validateDocument,
  showErrors,
  initTheme,
  toggleTheme,
  initTabs,
  showToast,
  subscribe,
  getDocument,
  setDocument,
};
```

- [ ] **Step 4: Create team list entry**

```js
// src/team/list.js — Team mode list page
import "../css/team.css";
import { initTheme, toggleTheme } from "../ui/theme.js";

window.VulnogramList = { initTheme, toggleTheme };
```

- [ ] **Step 5: Add build script to package.json**

```json
"build:team": "vite build --config vite.team.config.js"
```

- [ ] **Step 6: Build and commit**

---

### Task 2: Update Pug Layout Template

Modernize `views/layout.pug` with the new Tailwind sidebar and topbar.

- [ ] **Step 1: Update `views/head.pug`**

Replace old CSS links with new:

```pug
link(rel='stylesheet' href='/dist/editor.css')
```

- [ ] **Step 2: Update `views/layout.pug`**

Replace the old CSS-only sidebar with the new Tailwind sidebar structure. Keep the Pug block system so child templates still work.

- [ ] **Step 3: Commit**

---

### Task 3: Update Edit Template

Replace JSON Editor mounting with form engine.

- [ ] **Step 1: Update `views/edit.pug`**

Replace the JSON Editor initialization with form engine mounting. The schema is passed from the server via `opts.schema`, and the document via `doc`.

- [ ] **Step 2: Commit**

---

### Task 4: Update List and Login Templates

- [ ] **Step 1: Modernize `views/list.pug`**
- [ ] **Step 2: Modernize `views/splash.pug`** (login page)
- [ ] **Step 3: Commit**

---

### Task 5: Build and Test

- [ ] **Step 1: Build team assets**
- [ ] **Step 2: Start server and verify**
- [ ] **Step 3: Commit**

---

## Completion Criteria

- Team mode serves new Tailwind CSS and form engine JS
- Edit page mounts the FormEngine with schema from server
- List page has modernized styling
- Login page has modernized styling
- Existing Express routes, auth, and realtime work unchanged
- Both solo and team builds work
