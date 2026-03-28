// Solo mode entry point — Vulnogram UI Modernization

// Dark mode toggle
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Initialize theme from localStorage or system preference
function initTheme() {
  const stored = localStorage.getItem('vg-theme');
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  }
}

themeToggle.addEventListener('click', () => {
  html.classList.toggle('dark');
  localStorage.setItem('vg-theme', html.classList.contains('dark') ? 'dark' : 'light');
});

initTheme();

console.log('Vulnogram solo mode initialized');
