// Enum renderer — pill toggles for short lists, select for long lists
import { registerRenderer } from "./index.js";
import { createLabel } from "./string.js";

function enumRenderer(schema, path, value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "vg-field";
  wrapper.setAttribute("data-path", path);

  wrapper.appendChild(createLabel(schema, path));

  const options = schema.enum || [];

  if (options.length <= 7) {
    // Pill toggles
    const pills = document.createElement("div");
    pills.className = "vg-pills";

    options.forEach((opt) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "vg-pill" + (value === opt ? " active" : "");
      pill.textContent = opt;
      pill.addEventListener("click", () => {
        pills
          .querySelectorAll(".vg-pill")
          .forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        onChange(path, opt);
      });
      pills.appendChild(pill);
    });

    wrapper.appendChild(pills);
  } else {
    // Select dropdown
    const select = document.createElement("select");
    select.className = "vg-input";
    select.id = `field-${path}`;

    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Select...";
    select.appendChild(empty);

    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (value === opt) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener("change", () => {
      onChange(path, select.value || undefined);
    });

    wrapper.appendChild(select);
  }

  const error = document.createElement("div");
  error.className = "vg-field-error hidden";
  error.setAttribute("data-error-for", path);
  wrapper.appendChild(error);

  return wrapper;
}

registerRenderer("enum", enumRenderer);
