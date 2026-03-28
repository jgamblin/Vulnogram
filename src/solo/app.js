// Solo mode entry point — Vulnogram UI Modernization
import { initTheme, toggleTheme } from "../ui/theme.js";
import { initSidebar } from "../ui/sidebar.js";
import { initCommandPalette } from "../ui/command-palette.js";
import { initTabs } from "../ui/tabs.js";
import { showToast } from "../ui/toast.js";
import { FormEngine } from "../core/form-engine.js";
import {
  initValidator,
  validateDocument,
  showErrors,
} from "../core/validator.js";
import { saveDraft, loadDraft } from "../core/drafts.js";
import { exportJSON, importJSON } from "../core/import-export.js";
import { subscribe, getDocument, setDocument } from "../core/state.js";
import { derefSchema } from "../core/schema-deref.js";
import { renderCVSSPage } from "./cvss-page.js";

// Import real CVE5 schema for validation and rendering
import cve5Schema from "../../default/cve5/cve5.schema.json";

// Initialize UI
initTheme();
document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
initSidebar();
initCommandPalette();

// Sidebar navigation
document.querySelectorAll("[data-section]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const section = link.dataset.section;

    // Update active sidebar item
    document.querySelectorAll("[data-section]").forEach((l) => {
      l.classList.toggle("active", l === link);
    });

    // Show/hide pages
    document.querySelectorAll("[data-page]").forEach((page) => {
      page.classList.toggle("hidden", page.dataset.page !== section);
    });

    // Initialize CVSS calculator on first visit
    if (section === "calculator") {
      const cvssRoot = document.getElementById("cvss-root");
      if (cvssRoot && !cvssRoot.hasChildNodes()) {
        renderCVSSPage(cvssRoot);
      }
    }
  });
});

// Current draft ID
let currentDraftId =
  new URLSearchParams(window.location.search).get("doc") || "new";

// Initialize form engine
async function initForm() {
  const formRoot = document.getElementById("form-root");
  if (!formRoot) return;

  try {
    // Initialize AJV validator with real CVE5 schema
    initValidator(cve5Schema);

    // Dereference $refs in the CVE5 schema for form rendering
    const renderSchema = derefSchema(cve5Schema);
    const engine = new FormEngine(formRoot, renderSchema);

    // Try to load existing draft
    const draft = await loadDraft(currentDraftId).catch(() => null);
    engine.mount(draft || {});

    // Initialize tabs
    const sourceEditor = document.getElementById("source-editor");
    initTabs({
      onTabChange: (tab) => {
        if (tab === "source") {
          // Sync form data to source editor
          sourceEditor.value = JSON.stringify(getDocument(), null, 2);
        } else if (tab === "form") {
          // Sync source editor back to form
          try {
            const doc = JSON.parse(sourceEditor.value);
            engine.setValue(doc);
          } catch (e) {
            showToast("Invalid JSON — changes not applied");
          }
        }
      },
    });

    // Auto-save drafts on state changes (2-second debounce)
    let saveTimeout;
    subscribe(() => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        const doc = getDocument();
        await saveDraft(currentDraftId, doc).catch((e) =>
          console.warn("Draft save failed:", e),
        );
        showToast("Draft saved");
      }, 2000);
    });

    // Validate on state changes (500ms debounce)
    let validateTimeout;
    subscribe(() => {
      clearTimeout(validateTimeout);
      validateTimeout = setTimeout(() => {
        const doc = getDocument();
        const result = validateDocument(doc);
        showErrors(result.errors, formRoot);
      }, 500);
    });

    // Import button
    document
      .getElementById("btn-import")
      ?.addEventListener("click", async () => {
        try {
          const doc = await importJSON();
          engine.setValue(doc);
          // Generate draft ID from CVE ID if available
          const cveId = doc?.cveMetadata?.cveId;
          if (cveId) {
            currentDraftId = cveId;
            updateURL(currentDraftId);
          }
          showToast("Imported successfully");
        } catch (e) {
          if (e.message !== "No file selected") {
            console.error("Import failed:", e);
          }
        }
      });

    // Save Draft button
    document
      .getElementById("btn-save-draft")
      ?.addEventListener("click", async () => {
        const doc = getDocument();
        const cveId = doc?.cveMetadata?.cveId;
        if (cveId && currentDraftId === "new") {
          currentDraftId = cveId;
          updateURL(currentDraftId);
        }
        await saveDraft(currentDraftId, doc);
        showToast("Draft saved");
      });

    // Export button
    document.getElementById("btn-export")?.addEventListener("click", () => {
      const doc = getDocument();
      const cveId = doc?.cveMetadata?.cveId || "cve-record";
      exportJSON(doc, `${cveId}.json`);
    });

    // Make accessible for debugging
    window.__vulnogramEngine = engine;
  } catch (err) {
    console.error("Failed to initialize form engine:", err);
    formRoot.textContent = "Failed to load form engine.";
  }
}

function updateStatus(message) {
  const el = document.getElementById("form-status");
  if (el) {
    el.textContent = message;
    setTimeout(() => {
      el.textContent = currentDraftId === "new" ? "New Record" : currentDraftId;
    }, 2000);
  }
}

function updateURL(id) {
  const url = new URL(window.location.href);
  url.searchParams.set("doc", id);
  window.history.pushState({}, "", url);
}

initForm();
