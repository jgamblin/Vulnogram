// Boolean renderer — toggle switch
import { registerRenderer } from "./index.js";
import { createLabel } from "./string.js";

function booleanRenderer(schema, path, value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "vg-field flex items-center gap-3";
  wrapper.setAttribute("data-path", path);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "vg-toggle" + (value ? " active" : "");
  toggle.setAttribute("role", "switch");
  toggle.setAttribute("aria-checked", String(!!value));

  const dot = document.createElement("span");
  dot.className = "vg-toggle-dot";
  toggle.appendChild(dot);

  toggle.addEventListener("click", () => {
    const newVal = !toggle.classList.contains("active");
    toggle.classList.toggle("active", newVal);
    toggle.setAttribute("aria-checked", String(newVal));
    onChange(path, newVal);
  });

  wrapper.appendChild(toggle);

  const label = document.createElement("span");
  label.className = "text-sm font-medium text-vg-700 dark:text-vg-300";
  label.textContent = schema.title || path.split(".").pop();
  wrapper.appendChild(label);

  return wrapper;
}

registerRenderer("boolean", booleanRenderer);
