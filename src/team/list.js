// Team mode list page
import "../css/team.css";
import { initTheme, toggleTheme } from "../ui/theme.js";

// Initialize theme immediately
initTheme();

// Expose to global scope
window.VulnogramList = { initTheme, toggleTheme };
