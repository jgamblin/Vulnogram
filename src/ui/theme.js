const html = document.documentElement;

export function initTheme() {
  const stored = localStorage.getItem('vg-theme');
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  }
}

export function toggleTheme() {
  html.classList.toggle('dark');
  localStorage.setItem('vg-theme', html.classList.contains('dark') ? 'dark' : 'light');
}
