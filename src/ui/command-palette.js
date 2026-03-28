const commands = [
  {
    label: "CVE Editor",
    section: "Navigation",
    action: () => {
      /* navigate to CVE editor */
    },
  },
  {
    label: "CVSS Calculator",
    section: "Navigation",
    action: () => {
      /* navigate to CVSS calculator */
    },
  },
  {
    label: "New CVE Record",
    section: "Actions",
    action: () => {
      /* create new record */
    },
  },
  {
    label: "Import JSON",
    section: "Actions",
    action: () => {
      /* import JSON */
    },
  },
  {
    label: "Export JSON",
    section: "Actions",
    action: () => {
      /* export JSON */
    },
  },
  {
    label: "Validate Record",
    section: "Actions",
    action: () => {
      /* validate */
    },
  },
  {
    label: "Toggle Dark Mode",
    section: "Settings",
    action: () => {
      document.getElementById("theme-toggle")?.click();
    },
  },
];

let filteredCommands = [...commands];
let selectedIndex = 0;

function fuzzyMatch(query, text) {
  return text.toLowerCase().includes(query.toLowerCase());
}

function render() {
  const results = document.getElementById("palette-results");
  if (!results) return;
  results.textContent = "";

  let renderedSection = "";
  filteredCommands.forEach((cmd, i) => {
    if (cmd.section !== renderedSection) {
      renderedSection = cmd.section;
      const label = document.createElement("div");
      label.className = "vg-palette-section-label";
      label.textContent = cmd.section;
      results.appendChild(label);
    }

    const item = document.createElement("div");
    item.className =
      "vg-palette-item" + (i === selectedIndex ? " selected" : "");
    item.textContent = cmd.label;
    item.addEventListener("click", () => executeCommand(i));
    results.appendChild(item);
  });
}

function show() {
  const palette = document.getElementById("command-palette");
  const input = document.getElementById("palette-input");
  if (!palette || !input) return;
  palette.classList.remove("hidden");
  input.value = "";
  filteredCommands = [...commands];
  selectedIndex = 0;
  render();
  input.focus();
}

function hide() {
  const palette = document.getElementById("command-palette");
  if (palette) palette.classList.add("hidden");
}

function executeCommand(index) {
  if (filteredCommands[index]) {
    filteredCommands[index].action();
  }
  hide();
}

function onInput(e) {
  const query = e.target.value.trim();
  if (query === "") {
    filteredCommands = [...commands];
  } else {
    filteredCommands = commands.filter((cmd) => fuzzyMatch(query, cmd.label));
  }
  selectedIndex = 0;
  render();
}

function onKeydown(e) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % filteredCommands.length;
    render();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex =
      (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
    render();
  } else if (e.key === "Enter") {
    e.preventDefault();
    executeCommand(selectedIndex);
  } else if (e.key === "Escape") {
    e.preventDefault();
    hide();
  }
}

export function registerCommand(cmd) {
  commands.push(cmd);
}

export function initCommandPalette() {
  // Global Cmd+K / Ctrl+K shortcut
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      const palette = document.getElementById("command-palette");
      if (palette && palette.classList.contains("hidden")) {
        show();
      } else {
        hide();
      }
    }
  });

  // Search trigger button
  document.getElementById("search-trigger")?.addEventListener("click", show);

  // Backdrop click to close
  document.getElementById("palette-backdrop")?.addEventListener("click", hide);

  // Input and keydown bindings
  const input = document.getElementById("palette-input");
  if (input) {
    input.addEventListener("input", onInput);
    input.addEventListener("keydown", onKeydown);
  }
}
