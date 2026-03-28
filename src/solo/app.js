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

// Import real CVE5 schema for validation
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

    // Use rendering-friendly schema (real schema needs $ref resolution for rendering)
    const renderSchema = getDefaultSchema();
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

function getDefaultSchema() {
  // Rendering-friendly CVE schema (real schema needs $ref resolution)
  // This covers the main CVE record structure accurately
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
          assignerOrgId: {
            type: "string",
            title: "Assigner Org ID",
            description: "UUID of the assigning organization",
          },
          assignerShortName: {
            type: "string",
            title: "Assigner Short Name",
            description: "Short name of the assigning CNA",
          },
          dateReserved: {
            type: "string",
            title: "Date Reserved",
            format: "date-time",
          },
          datePublished: {
            type: "string",
            title: "Date Published",
            format: "date-time",
          },
          dateUpdated: {
            type: "string",
            title: "Date Updated",
            format: "date-time",
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
                    supportingMedia: {
                      type: "array",
                      title: "Supporting Media",
                      items: {
                        type: "object",
                        title: "Media",
                        properties: {
                          type: { type: "string", title: "MIME Type" },
                          base64: { type: "boolean", title: "Base64 Encoded" },
                          value: {
                            type: "string",
                            title: "Content",
                            format: "textarea",
                          },
                        },
                      },
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
                    collectionURL: {
                      type: "string",
                      title: "Collection URL",
                      format: "uri",
                    },
                    packageName: { type: "string", title: "Package Name" },
                    defaultStatus: {
                      type: "string",
                      title: "Default Status",
                      enum: ["affected", "unaffected", "unknown"],
                    },
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
                          versionType: {
                            type: "string",
                            title: "Version Type",
                          },
                          lessThan: { type: "string", title: "Less Than" },
                          lessThanOrEqual: {
                            type: "string",
                            title: "Less Than or Equal",
                          },
                        },
                      },
                    },
                    platforms: {
                      type: "array",
                      title: "Platforms",
                      items: { type: "string", title: "Platform" },
                    },
                  },
                },
              },
              problemTypes: {
                type: "array",
                title: "Problem Types (CWE)",
                items: {
                  type: "object",
                  title: "Problem Type",
                  properties: {
                    descriptions: {
                      type: "array",
                      title: "Descriptions",
                      items: {
                        type: "object",
                        title: "CWE Entry",
                        properties: {
                          lang: {
                            type: "string",
                            title: "Language",
                            default: "en",
                          },
                          description: { type: "string", title: "Description" },
                          cweId: {
                            type: "string",
                            title: "CWE ID",
                            examples: ["CWE-"],
                          },
                          type: {
                            type: "string",
                            title: "Type",
                            enum: ["CWE", "OWASP", "text"],
                          },
                        },
                      },
                    },
                  },
                },
              },
              metrics: {
                type: "array",
                title: "Metrics",
                items: {
                  type: "object",
                  title: "Metric",
                  properties: {
                    format: {
                      type: "string",
                      title: "Format",
                      enum: ["CVSS:4.0", "CVSS:3.1", "CVSS:3.0", "CVSS:2.0"],
                    },
                    scenarios: {
                      type: "array",
                      title: "Scenarios",
                      items: {
                        type: "object",
                        title: "Scenario",
                        properties: {
                          lang: {
                            type: "string",
                            title: "Language",
                            default: "en",
                          },
                          value: { type: "string", title: "Scenario" },
                        },
                      },
                    },
                    cvssV4_0: {
                      type: "object",
                      title: "CVSS v4.0",
                      properties: {
                        vectorString: {
                          type: "string",
                          title: "Vector String",
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
                    cvssV3_1: {
                      type: "object",
                      title: "CVSS v3.1",
                      properties: {
                        vectorString: {
                          type: "string",
                          title: "Vector String",
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
                    tags: {
                      type: "array",
                      title: "Tags",
                      items: {
                        type: "string",
                        title: "Tag",
                        enum: [
                          "broken-link",
                          "customer-entitlement",
                          "exploit",
                          "government-resource",
                          "issue-tracking",
                          "mailing-list",
                          "mitigation",
                          "not-applicable",
                          "patch",
                          "permissions-required",
                          "media-coverage",
                          "product",
                          "related",
                          "release-notes",
                          "signature",
                          "technical-description",
                          "third-party-advisory",
                          "tool-signature",
                          "vendor-advisory",
                        ],
                      },
                    },
                  },
                },
              },
              workarounds: {
                type: "array",
                title: "Workarounds",
                items: {
                  type: "object",
                  title: "Workaround",
                  properties: {
                    lang: { type: "string", title: "Language", default: "en" },
                    value: {
                      type: "string",
                      title: "Description",
                      format: "textarea",
                    },
                  },
                },
              },
              solutions: {
                type: "array",
                title: "Solutions",
                items: {
                  type: "object",
                  title: "Solution",
                  properties: {
                    lang: { type: "string", title: "Language", default: "en" },
                    value: {
                      type: "string",
                      title: "Description",
                      format: "textarea",
                    },
                  },
                },
              },
              timeline: {
                type: "array",
                title: "Timeline",
                items: {
                  type: "object",
                  title: "Event",
                  properties: {
                    time: {
                      type: "string",
                      title: "Time",
                      format: "date-time",
                    },
                    lang: { type: "string", title: "Language", default: "en" },
                    value: { type: "string", title: "Description" },
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
              source: {
                type: "object",
                title: "Source",
                properties: {
                  discovery: {
                    type: "string",
                    title: "Discovery",
                    enum: ["UNKNOWN", "INTERNAL", "EXTERNAL", "USER"],
                  },
                  defect: {
                    type: "array",
                    title: "Defect IDs",
                    items: { type: "string", title: "Defect ID" },
                  },
                },
              },
              datePublic: {
                type: "string",
                title: "Date Public",
                format: "date-time",
              },
              providerMetadata: {
                type: "object",
                title: "Provider Metadata",
                properties: {
                  orgId: { type: "string", title: "Organization ID" },
                  shortName: { type: "string", title: "Short Name" },
                  dateUpdated: {
                    type: "string",
                    title: "Date Updated",
                    format: "date-time",
                  },
                },
              },
            },
            required: ["descriptions", "affected", "references"],
          },
        },
      },
    },
    required: ["cveMetadata", "containers"],
  };
}

initForm();
