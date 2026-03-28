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
