// Theme Management - Dark/Light Mode and Accent Colors
// Extracted from base.njk for cleaner template

const ACCENT_COLORS = {
  gray: "#6b7280",
  slate: "#64748b",
  zinc: "#71717a",
  neutral: "#737373",
  stone: "#78716c",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e"
};

const isDarkMode = () =>
  localStorage.theme === "dark" ||
  (!("theme" in localStorage) &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);

// Initialize dark mode immediately to prevent flash
if (isDarkMode()) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

// Accent color theme management
const getAccentTheme = () => {
  return localStorage.accentTheme || "amber";
};

const setAccentVariables = (theme) => {
  const accentColor = ACCENT_COLORS[theme] || ACCENT_COLORS.amber;
  document.documentElement.style.setProperty("--accent-color", accentColor);
};

const setAccentTheme = (theme) => {
  localStorage.accentTheme = theme;
  updateAccentClasses(theme);
};

const updateAccentClasses = (theme) => {
  setAccentVariables(theme);
  const proseElement = document.querySelector('.prose');
  if (proseElement) {
    // Remove all existing prose color classes
    const colorClasses = ['prose-gray', 'prose-slate', 'prose-zinc', 'prose-neutral', 'prose-stone', 'prose-red', 'prose-orange', 'prose-amber', 'prose-yellow', 'prose-lime', 'prose-green', 'prose-emerald', 'prose-teal', 'prose-cyan', 'prose-sky', 'prose-blue', 'prose-indigo', 'prose-violet', 'prose-purple', 'prose-fuchsia', 'prose-pink', 'prose-rose'];
    colorClasses.forEach(cls => proseElement.classList.remove(cls));
    
    // Add the new theme class
    proseElement.classList.add(`prose-${theme}`);
  }
};

// Initialize accent variables immediately
setAccentVariables(getAccentTheme());

// Apply saved accent theme on page load
document.addEventListener('DOMContentLoaded', () => {
  updateAccentClasses(getAccentTheme());
});

// Prism syntax highlighting theme switching
function switchPrismTheme() {
  const themeLink = document.getElementById('prism-theme');
  if (!themeLink) return;
  
  if (isDarkMode()) {
    themeLink.setAttribute('href', '/static/css/prism/prism-twilight.css');
  } else {
    themeLink.setAttribute('href', '/static/css/prism/prism-coy.css');
  }
  if (typeof Prism !== 'undefined') Prism.highlightAll();
}

// Initialize Prism theme
switchPrismTheme();
