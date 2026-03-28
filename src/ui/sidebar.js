import { icons } from "../solo/icons.js";

const STORAGE_KEY = "vg-sidebar-collapsed";

/**
 * Render all data-icon attributes with their SVG content.
 * Safe: icons object contains only hardcoded trusted SVG strings from icons.js,
 * not user-supplied content.
 */
function renderIcons() {
  document.querySelectorAll("[data-icon]").forEach((el) => {
    const name = el.getAttribute("data-icon");
    if (icons[name]) {
      // Safe: icons[name] is a trusted hardcoded SVG string, not user input
      el.innerHTML = icons[name];
    }
  });
}

/** Toggle sidebar collapsed state */
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  sidebar.classList.toggle("collapsed");
  const isCollapsed = sidebar.classList.contains("collapsed");
  localStorage.setItem(STORAGE_KEY, isCollapsed ? "true" : "false");
  updateCollapseIcon(isCollapsed);
  updateCollapsedBrand(isCollapsed);
}

/** Swap the collapse toggle icon based on state */
function updateCollapseIcon(isCollapsed) {
  const toggle = document.querySelector(
    "#sidebar-toggle [data-collapsed-icon]",
  );
  if (!toggle) return;
  const iconName = isCollapsed
    ? toggle.getAttribute("data-collapsed-icon")
    : toggle.getAttribute("data-icon");
  if (icons[iconName]) {
    // Safe: icons[iconName] is a trusted hardcoded SVG string, not user input
    toggle.innerHTML = icons[iconName];
  }
}

/** Show/hide the collapsed brand "V" */
function updateCollapsedBrand(isCollapsed) {
  const label = document.querySelector(".vg-sidebar-collapsed-brand");
  if (label) {
    label.classList.toggle("hidden", !isCollapsed);
  }
}

/** Open mobile sidebar */
function openMobile() {
  document.getElementById("sidebar")?.classList.add("mobile-open");
}

/** Close mobile sidebar */
function closeMobile() {
  document.getElementById("sidebar")?.classList.remove("mobile-open");
}

/** Initialize sidebar behavior */
export function initSidebar() {
  renderIcons();

  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  // Restore collapsed state from localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "true") {
    sidebar.classList.add("collapsed");
    updateCollapseIcon(true);
    updateCollapsedBrand(true);
  }

  // Bind collapse toggle button
  document
    .getElementById("sidebar-toggle")
    ?.addEventListener("click", toggleSidebar);

  // Keyboard shortcut: [ to toggle sidebar
  document.addEventListener("keydown", (e) => {
    if (e.key === "[") {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable)
        return;
      e.preventDefault();
      toggleSidebar();
    }
  });

  // Mobile menu open/close
  document
    .getElementById("mobile-menu-btn")
    ?.addEventListener("click", openMobile);
  document
    .getElementById("sidebar-overlay")
    ?.addEventListener("click", closeMobile);
}
