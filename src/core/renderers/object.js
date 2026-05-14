// Object renderer — renders nested object fields with visual hierarchy
import { registerRenderer } from "./index.js";
import { renderField } from "./index.js";
import { createLabel, humanize } from "./string.js";
import { createSection } from "../section-manager.js";

function objectRenderer(schema, path, value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "vg-field";
  wrapper.setAttribute("data-path", path);

  const depth = path.split(".").length - 1;
  const properties = schema.properties || {};
  const required = schema.required || [];

  // Nested objects with properties get rendered as sub-sections
  if (depth > 0 && Object.keys(properties).length > 0) {
    const title = schema.title || humanize(path.split(".").pop());
    const { section, body } = createSection(title, path, { depth });

    Object.entries(properties).forEach(([key, propSchema]) => {
      if (propSchema.options?.hidden) return;

      const fieldPath = `${path}.${key}`;
      const fieldValue = value?.[key];

      const fieldEl = renderField(propSchema, fieldPath, fieldValue, (p, v) => {
        const obj = { ...(value || {}) };
        if (p === fieldPath) {
          obj[key] = v;
        } else {
          obj[key] = v;
        }
        onChange(path, obj);
      });
      body.appendChild(fieldEl);
    });

    wrapper.appendChild(section);
    return wrapper;
  }

  // Top-level or property-less objects: render fields inline
  if (path.includes(".")) {
    wrapper.appendChild(createLabel(schema, path));
  }

  const fieldsContainer = document.createElement("div");
  fieldsContainer.className = "vg-object-fields";

  Object.entries(properties).forEach(([key, propSchema]) => {
    if (propSchema.options?.hidden) return;

    const fieldPath = path ? `${path}.${key}` : key;
    const fieldValue = value?.[key];

    const fieldEl = renderField(propSchema, fieldPath, fieldValue, (p, v) => {
      const obj = { ...(value || {}) };
      if (p === fieldPath) {
        obj[key] = v;
      } else {
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
