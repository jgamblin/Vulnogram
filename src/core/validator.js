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
