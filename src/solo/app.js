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
