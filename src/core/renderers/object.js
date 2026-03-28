// Object renderer — renders nested object fields inline
import { registerRenderer } from "./index.js";
import { renderField } from "./index.js";
import { createLabel } from "./string.js";

function objectRenderer(schema, path, value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "vg-field";
  wrapper.setAttribute("data-path", path);

  // Only show label if this is a nested object (not top-level)
  if (path.includes(".")) {
    wrapper.appendChild(createLabel(schema, path));
  }

  const properties = schema.properties || {};
  const required = schema.required || [];

  const fieldsContainer = document.createElement("div");
  fieldsContainer.className = "vg-object-fields";

  Object.entries(properties).forEach(([key, propSchema]) => {
    // Skip hidden properties
    if (propSchema.options?.hidden) return;

    const fieldPath = path ? `${path}.${key}` : key;
    const fieldValue = value?.[key];
    const isRequired = required.includes(key);

    const fieldEl = renderField(propSchema, fieldPath, fieldValue, (p, v) => {
      const obj = { ...(value || {}) };
      const relKey = p.substring(path.length + 1).split(".")[0];
      if (p === fieldPath) {
        obj[key] = v;
      } else {
        // Nested update — let the child renderer handle it
        obj[key] = v;
      }
      onChange(path, obj);
    });

    fieldsContainer.appendChild(fieldEl);
  });

  wrapper.appendChild(fieldsContainer);

  return wrapper;
}

registerRenderer("object", objectRenderer);
