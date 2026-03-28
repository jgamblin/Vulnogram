// Array renderer — repeatable groups with add/remove
import { registerRenderer } from "./index.js";
import { renderField } from "./index.js";
import { createLabel } from "./string.js";

function arrayRenderer(schema, path, value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "vg-field";
  wrapper.setAttribute("data-path", path);

  wrapper.appendChild(createLabel(schema, path));

  const items = Array.isArray(value) ? value : [];
  const itemSchema = schema.items || {};
  const container = document.createElement("div");
  container.className = "vg-array-container";

  function renderItems() {
    container.textContent = "";
    const currentItems = Array.isArray(value) ? [...value] : [];

    currentItems.forEach((item, i) => {
      const itemWrapper = document.createElement("div");
      itemWrapper.className = "vg-array-item";

      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "vg-btn-ghost text-xs text-red-500 float-right";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        const arr = [...(value || [])];
        arr.splice(i, 1);
        value = arr;
        onChange(path, arr);
        renderItems();
      });
      itemWrapper.appendChild(removeBtn);

      // Render item fields
      const itemPath = `${path}.${i}`;
      if (itemSchema.type === "object" && itemSchema.properties) {
        Object.entries(itemSchema.properties).forEach(([key, propSchema]) => {
          const fieldEl = renderField(
            propSchema,
            `${itemPath}.${key}`,
            item?.[key],
            (p, v) => {
              const arr = [...(value || [])];
              if (!arr[i]) arr[i] = {};
              const relPath = p.substring(itemPath.length + 1);
              setNestedValue(arr[i], relPath, v);
              value = arr;
              onChange(path, arr);
            },
          );
          itemWrapper.appendChild(fieldEl);
        });
      } else {
        const fieldEl = renderField(itemSchema, itemPath, item, (p, v) => {
          const arr = [...(value || [])];
          arr[i] = v;
          value = arr;
          onChange(path, arr);
        });
        itemWrapper.appendChild(fieldEl);
      }

      container.appendChild(itemWrapper);
    });

    // Add button
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "vg-array-add";
    const itemTitle = itemSchema.title || schema.title || "item";
    addBtn.textContent = `+ Add ${itemTitle}`;
    addBtn.addEventListener("click", () => {
      const arr = [...(value || [])];
      arr.push(itemSchema.type === "object" ? {} : "");
      value = arr;
      onChange(path, arr);
      renderItems();
    });
    container.appendChild(addBtn);
  }

  renderItems();
  wrapper.appendChild(container);

  return wrapper;
}

function setNestedValue(obj, path, value) {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] == null) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

registerRenderer("array", arrayRenderer);
