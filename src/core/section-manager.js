// Section manager — progressive disclosure with collapsible cards and add chips
import { humanize } from "./renderers/string.js";

// Trusted hardcoded SVG chevron icons (Heroicons, not user input)
const chevronDown = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>`;
const chevronRight = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>`;

export function createSection(title, path, options = {}) {
  const { collapsed = false, removable = false, onRemove, depth = 0 } = options;

  const section = document.createElement("div");
  section.className = "vg-section" + (collapsed ? " collapsed" : "");
  if (depth > 0) section.classList.add("vg-section-nested");
  section.setAttribute("data-section-path", path);

  // Header
  const header = document.createElement("div");
  header.className = "vg-section-header";

  const titleRow = document.createElement("div");
  titleRow.className = "flex items-center gap-2";

  // Collapse chevron (left side) — trusted hardcoded SVG, safe for innerHTML
  const chevron = document.createElement("span");
  chevron.className = "vg-section-chevron";
  chevron.innerHTML = collapsed ? chevronRight : chevronDown;
  titleRow.appendChild(chevron);

  const titleEl = document.createElement("span");
  titleEl.className = "vg-section-title";
  titleEl.textContent = title.includes(" ") ? title : humanize(title);
  titleRow.appendChild(titleEl);

  header.appendChild(titleRow);

  const controls = document.createElement("div");
  controls.className = "flex items-center gap-2";

  // Validation badge placeholder
  const badge = document.createElement("span");
  badge.className = "vg-section-badge hidden";
  badge.setAttribute("data-badge-for", path);
  controls.appendChild(badge);

  if (removable && onRemove) {
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "vg-btn-ghost text-xs text-red-500 p-1";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      onRemove();
    });
    controls.appendChild(removeBtn);
  }

  header.appendChild(controls);

  header.addEventListener("click", () => {
    const isCollapsed = section.classList.toggle("collapsed");
    // Trusted hardcoded SVG, safe for innerHTML
    chevron.innerHTML = isCollapsed ? chevronRight : chevronDown;
  });

  section.appendChild(header);

  // Body
  const body = document.createElement("div");
  body.className = "vg-section-body";
  section.appendChild(body);

  return { section, body, header };
}

export function createChip(label, onClick) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "vg-chip";
  chip.textContent = `+ ${label.includes(" ") ? label : humanize(label)}`;
  chip.addEventListener("click", onClick);
  return chip;
}

export function createChipBar(chips) {
  const bar = document.createElement("div");
  bar.className = "flex flex-wrap gap-2 mt-4";
  bar.setAttribute("data-chip-bar", "");
  chips.forEach((chip) => bar.appendChild(chip));
  return bar;
}
