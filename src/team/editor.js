// Team mode editor — exposes form engine to Pug templates
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
import { exportJSON } from "../core/import-export.js";

// Initialize theme immediately
initTheme();

// Expose to global scope for Pug template inline scripts
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
  exportJSON,
};
