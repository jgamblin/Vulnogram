import { initTheme, toggleTheme } from '../ui/theme.js';
import { initSidebar } from '../ui/sidebar.js';
import { initCommandPalette } from '../ui/command-palette.js';

initTheme();
document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
initSidebar();
initCommandPalette();

console.log('Vulnogram solo mode initialized');
