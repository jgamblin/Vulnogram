// String field renderer — text input, textarea, URL, email, datetime
import { registerRenderer } from "./index.js";

/** Turn camelCase / snake_case property names into readable labels */
function humanize(str) {
  // Known acronyms to keep uppercased
  const acronyms = new Set([
    "CVE",
    "CNA",
    "ADP",
    "CPE",
    "CVSS",
    "CWE",
    "URL",
    "ID",
    "SSA",
    "SSVC",
  ]);
  return (
    str
      // insert space before capitals in camelCase
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      // replace underscores / hyphens with spaces
      .replace(/[_-]+/g, " ")
      // capitalize each word, preserving acronyms
      .split(/\s+/)
      .map((w) =>
        acronyms.has(w.toUpperCase())
          ? w.toUpperCase()
          : w.charAt(0).toUpperCase() + w.slice(1),
      )
      .join(" ")
  );
}

function createLabel(schema, path) {
  const label = document.createElement("label");
  label.className = "vg-field-label";
  label.setAttribute("for", `field-${path}`);
  label.textContent = schema.title || humanize(path.split(".").pop());
  return label;
}

function createHelpText(schema, placeholder) {
  if (!schema.description) return null;
  // Don't show help text if it's identical to the placeholder
  if (placeholder && schema.description === placeholder) return null;
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
  const placeholder = schema.examples?.[0] || schema.description || "";
  if (placeholder) input.placeholder = placeholder;
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

  // Help text (suppress if identical to placeholder)
  const help = createHelpText(schema, placeholder);
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

export { createLabel, createHelpText, humanize };
