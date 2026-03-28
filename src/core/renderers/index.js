// Renderer registry — maps JSON Schema types to render functions

const renderers = {};

export function registerRenderer(type, renderer) {
  renderers[type] = renderer;
}

export function getRenderer(type) {
  return renderers[type] || renderers["string"]; // fallback to string
}

export function renderField(schema, path, value, onChange) {
  const type = resolveType(schema);
  const renderer = getRenderer(type);
  return renderer(schema, path, value, onChange);
}

function resolveType(schema) {
  if (schema.enum) return "enum";
  if (schema.format === "radio" && schema.enum) return "enum";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "array") return "array";
  if (schema.type === "object") return "object";
  if (schema.type === "integer" || schema.type === "number") return "number";
  return "string";
}
