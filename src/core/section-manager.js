// Section manager — progressive disclosure with collapsible cards and add chips

export function createSection(title, path, options = {}) {
  const { collapsed = false, removable = false, onRemove } = options;

  const section = document.createElement("div");
  section.className = "vg-section" + (collapsed ? " collapsed" : "");
  section.setAttribute("data-section-path", path);

  // Header
  const header = document.createElement("div");
  header.className = "vg-section-header";

  const titleEl = document.createElement("span");
  titleEl.className = "vg-section-title";
  titleEl.textContent = title;
  header.appendChild(titleEl);

  const controls = document.createElement("div");
  controls.className = "flex items-center gap-2";

  // Validation badge placeholder
  const badge = document.createElement("span");
  badge.className = "vg-section-badge hidden";
  badge.setAttribute("data-badge-for", path);
  controls.appendChild(badge);

  // Collapse chevron
  const chevron = document.createElement("span");
  chevron.className = "text-vg-400 transition-transform";
  chevron.textContent = collapsed ? "›" : "‹";
  controls.appendChild(chevron);

  header.appendChild(controls);

  header.addEventListener("click", () => {
    const isCollapsed = section.classList.toggle("collapsed");
    chevron.textContent = isCollapsed ? "›" : "‹";
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
  chip.textContent = `+ ${label}`;
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
