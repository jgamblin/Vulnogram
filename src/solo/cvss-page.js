// CVSS 4.0 Calculator page
import { CVSS40 } from "../../default/cvss4/static/cvss40.js";

const METRIC_GROUPS = {
  "Base — Exploitability": {
    AV: {
      title: "Attack Vector",
      values: { N: "Network", A: "Adjacent", L: "Local", P: "Physical" },
    },
    AC: {
      title: "Attack Complexity",
      values: { L: "Low", H: "High" },
    },
    AT: {
      title: "Attack Requirements",
      values: { N: "None", P: "Present" },
    },
    PR: {
      title: "Privileges Required",
      values: { N: "None", L: "Low", H: "High" },
    },
    UI: {
      title: "User Interaction",
      values: { N: "None", P: "Passive", A: "Active" },
    },
  },
  "Base — Vulnerable System Impact": {
    VC: {
      title: "Confidentiality",
      values: { H: "High", L: "Low", N: "None" },
    },
    VI: {
      title: "Integrity",
      values: { H: "High", L: "Low", N: "None" },
    },
    VA: {
      title: "Availability",
      values: { H: "High", L: "Low", N: "None" },
    },
  },
  "Base — Subsequent System Impact": {
    SC: {
      title: "Confidentiality",
      values: { H: "High", L: "Low", N: "None" },
    },
    SI: {
      title: "Integrity",
      values: { H: "High", L: "Low", N: "None" },
    },
    SA: {
      title: "Availability",
      values: { H: "High", L: "Low", N: "None" },
    },
  },
  Threat: {
    E: {
      title: "Exploit Maturity",
      values: { X: "Not Defined", A: "Attacked", P: "POC", U: "Unreported" },
    },
  },
};

function severityFromScore(score) {
  if (score === 0.0) return "NONE";
  if (score <= 3.9) return "LOW";
  if (score <= 6.9) return "MEDIUM";
  if (score <= 8.9) return "HIGH";
  return "CRITICAL";
}

function getSeverityClass(severity) {
  const map = {
    NONE: "vg-badge-none",
    LOW: "vg-badge-low",
    MEDIUM: "vg-badge-medium",
    HIGH: "vg-badge-high",
    CRITICAL: "vg-badge-critical",
  };
  return map[severity] || "vg-badge-none";
}

export function renderCVSSPage(container) {
  container.textContent = "";

  // Score display
  const scoreSection = document.createElement("div");
  scoreSection.className = "flex items-center gap-4 mb-8";

  const scoreDisplay = document.createElement("div");
  scoreDisplay.id = "cvss-score";
  scoreDisplay.className = "text-5xl font-bold text-vg-900 dark:text-vg-100";
  scoreDisplay.textContent = "0.0";
  scoreSection.appendChild(scoreDisplay);

  const severityBadge = document.createElement("span");
  severityBadge.id = "cvss-severity";
  severityBadge.className = "vg-badge vg-badge-none text-base px-3 py-1";
  severityBadge.textContent = "NONE";
  scoreSection.appendChild(severityBadge);

  container.appendChild(scoreSection);

  // Vector string display
  const vectorCard = document.createElement("div");
  vectorCard.className = "vg-card p-4 mb-6";
  const vectorLabel = document.createElement("div");
  vectorLabel.className =
    "text-xs font-medium text-vg-400 uppercase tracking-wider mb-1";
  vectorLabel.textContent = "Vector String";
  vectorCard.appendChild(vectorLabel);
  const vectorDisplay = document.createElement("code");
  vectorDisplay.id = "cvss-vector";
  vectorDisplay.className =
    "text-sm font-mono text-vg-700 dark:text-vg-300 break-all";
  vectorDisplay.textContent =
    "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:N/SC:N/SI:N/SA:N";
  vectorCard.appendChild(vectorDisplay);
  container.appendChild(vectorCard);

  // Create CVSS instance
  let cvss;
  try {
    cvss = new CVSS40();
  } catch (e) {
    container.textContent =
      "Failed to initialize CVSS calculator: " + e.message;
    return;
  }

  function updateDisplay() {
    try {
      const score = cvss.Score();
      const severity = severityFromScore(score);
      document.getElementById("cvss-score").textContent = score.toFixed(1);

      const badge = document.getElementById("cvss-severity");
      badge.textContent = severity;
      badge.className =
        "vg-badge text-base px-3 py-1 " + getSeverityClass(severity);

      document.getElementById("cvss-vector").textContent = cvss.Vector();
    } catch (e) {
      console.warn("CVSS calculation error:", e);
    }
  }

  // Render metric groups
  Object.entries(METRIC_GROUPS).forEach(([groupName, metrics]) => {
    const section = document.createElement("div");
    section.className = "mb-6";

    const groupTitle = document.createElement("h3");
    groupTitle.className =
      "text-sm font-semibold text-vg-900 dark:text-vg-100 mb-3";
    groupTitle.textContent = groupName;
    section.appendChild(groupTitle);

    Object.entries(metrics).forEach(([metricKey, metric]) => {
      const field = document.createElement("div");
      field.className = "mb-3";

      const label = document.createElement("div");
      label.className =
        "text-sm font-medium text-vg-600 dark:text-vg-400 mb-1.5";
      label.textContent = metric.title;
      field.appendChild(label);

      const pills = document.createElement("div");
      pills.className = "vg-pills";

      Object.entries(metric.values).forEach(([value, displayName]) => {
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = "vg-pill";
        pill.textContent = displayName;
        pill.dataset.metric = metricKey;
        pill.dataset.value = value;

        // Set initial active state
        try {
          if (cvss.Get(metricKey) === value) {
            pill.classList.add("active");
          }
        } catch (e) {
          /* metric not set yet */
        }

        pill.addEventListener("click", () => {
          // Deactivate siblings
          pills
            .querySelectorAll(".vg-pill")
            .forEach((p) => p.classList.remove("active"));
          pill.classList.add("active");

          try {
            cvss.Set(metricKey, value);
            updateDisplay();
          } catch (e) {
            console.warn("Invalid metric value:", e);
          }
        });

        pills.appendChild(pill);
      });

      field.appendChild(pills);
      section.appendChild(field);
    });

    container.appendChild(section);
  });

  updateDisplay();
}
