// Tab switching — Form/Source view toggle

export function initTabs(options = {}) {
  const { onTabChange } = options;
  const tabs = document.querySelectorAll("[data-tab]");
  const panels = document.querySelectorAll("[data-tab-panel]");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      // Update active tab
      tabs.forEach((t) => t.classList.toggle("active", t === tab));

      // Show target panel, hide others
      panels.forEach((p) => {
        p.classList.toggle("hidden", p.dataset.tabPanel !== target);
      });

      onTabChange?.(target);
    });
  });
}
