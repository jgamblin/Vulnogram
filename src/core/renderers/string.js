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
