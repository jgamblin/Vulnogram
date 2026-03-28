// Toast notifications

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement("div");
    container.className = "vg-toast-container";
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, duration = 2000) {
  const toast = document.createElement("div");
  toast.className = "vg-toast";
  toast.textContent = message;
  getContainer().appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
