// Theme Management - Dark/Light Mode and Accent Colors
// Extracted from base.njk for cleaner template

const ASSET_VERSION = document.currentScript?.dataset.assetVersion || '';
const versionedAsset = (path) => ASSET_VERSION
  ? `${path}?v=${encodeURIComponent(ASSET_VERSION)}`
  : path;

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

// Recolors the transparent sketch illustrations (stamp-cobalt) to match the
// chosen accent exactly. Solved by simulating the actual CSS Filter Effects
// matrices (invert/sepia/saturate/hue-rotate/brightness) against pure black -
// brightness(0) saturate(100%) always collapses the source to black first, so
// this is a fixed transform per accent, not an approximation guessed by eye.
const STAMP_FILTERS = {
  gray: "brightness(0) saturate(100%) invert(25%) sepia(90%) saturate(50%) hue-rotate(180deg) brightness(150%) contrast(100%)",
  slate: "brightness(0) saturate(100%) invert(25%) sepia(90%) saturate(100%) hue-rotate(177deg) brightness(150%) contrast(100%)",
  zinc: "brightness(0) saturate(100%) invert(30%) sepia(60%) saturate(50%) hue-rotate(207deg) brightness(130%) contrast(100%)",
  neutral: "brightness(0) saturate(100%) invert(30%) sepia(60%) saturate(50%) hue-rotate(237deg) brightness(130%) contrast(100%)",
  stone: "brightness(0) saturate(100%) invert(30%) sepia(60%) saturate(50%) hue-rotate(330deg) brightness(130%) contrast(100%)",
  red: "brightness(0) saturate(100%) invert(25%) sepia(75%) saturate(1200%) hue-rotate(327deg) brightness(130%) contrast(100%)",
  orange: "brightness(0) saturate(100%) invert(30%) sepia(75%) saturate(750%) hue-rotate(348deg) brightness(150%) contrast(100%)",
  amber: "brightness(0) saturate(100%) invert(30%) sepia(100%) saturate(1350%) hue-rotate(30deg) brightness(150%) contrast(100%)",
  yellow: "brightness(0) saturate(100%) invert(30%) sepia(100%) saturate(1500%) hue-rotate(36deg) brightness(150%) contrast(100%)",
  lime: "brightness(0) saturate(100%) invert(30%) sepia(100%) saturate(1500%) hue-rotate(60deg) brightness(150%) contrast(100%)",
  green: "brightness(0) saturate(100%) invert(30%) sepia(100%) saturate(350%) hue-rotate(93deg) brightness(150%) contrast(100%)",
  emerald: "brightness(0) saturate(100%) invert(30%) sepia(100%) saturate(350%) hue-rotate(111deg) brightness(150%) contrast(100%)",
  teal: "brightness(0) saturate(100%) invert(30%) sepia(100%) saturate(350%) hue-rotate(129deg) brightness(150%) contrast(100%)",
  cyan: "brightness(0) saturate(100%) invert(25%) sepia(100%) saturate(1350%) hue-rotate(162deg) brightness(150%) contrast(100%)",
  sky: "brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(550%) hue-rotate(156deg) brightness(150%) contrast(100%)",
  blue: "brightness(0) saturate(100%) invert(30%) sepia(60%) saturate(750%) hue-rotate(180deg) brightness(140%) contrast(100%)",
  indigo: "brightness(0) saturate(100%) invert(25%) sepia(60%) saturate(950%) hue-rotate(207deg) brightness(150%) contrast(100%)",
  violet: "brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(700%) hue-rotate(225deg) brightness(120%) contrast(100%)",
  purple: "brightness(0) saturate(100%) invert(25%) sepia(60%) saturate(1200%) hue-rotate(240deg) brightness(150%) contrast(100%)",
  fuchsia: "brightness(0) saturate(100%) invert(25%) sepia(75%) saturate(1350%) hue-rotate(264deg) brightness(140%) contrast(100%)",
  pink: "brightness(0) saturate(100%) invert(25%) sepia(75%) saturate(700%) hue-rotate(282deg) brightness(150%) contrast(100%)",
  rose: "brightness(0) saturate(100%) invert(30%) sepia(75%) saturate(1150%) hue-rotate(315deg) brightness(110%) contrast(100%)"
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
  return localStorage.accentTheme || "teal";
};

const setAccentVariables = (theme) => {
  const accentColor = ACCENT_COLORS[theme] || ACCENT_COLORS.teal;
  document.documentElement.style.setProperty("--accent-color", accentColor);
  document.documentElement.style.setProperty(
    "--stamp-filter",
    STAMP_FILTERS[theme] || STAMP_FILTERS.teal
  );
  const tcMeta = document.getElementById("theme-color-meta");
  if (tcMeta) tcMeta.setAttribute("content", accentColor);
};

const setAccentTheme = (theme) => {
  localStorage.accentTheme = theme;
  updateAccentClasses(theme);
  syncThemeColorMeta();
};

const updateAccentClasses = (theme) => {
  setAccentVariables(theme);
};

const syncThemeColorMeta = () => {
  const meta = document.getElementById("theme-color-meta");
  if (!meta) return;

  if (isDarkMode()) {
    meta.setAttribute("content", "#000000");
    return;
  }

  const accentTheme = getAccentTheme();
  const accentColor = ACCENT_COLORS[accentTheme] || ACCENT_COLORS.teal;
  meta.setAttribute("content", accentColor);
};

// Initialize accent variables immediately
setAccentVariables(getAccentTheme());
syncThemeColorMeta();

// Apply saved accent theme on page load
document.addEventListener('DOMContentLoaded', () => {
  updateAccentClasses(getAccentTheme());
  syncThemeColorMeta();
});

// Prism syntax highlighting theme switching
function switchPrismTheme() {
  const themeLink = document.getElementById('prism-theme');
  if (!themeLink) return;
  
  if (isDarkMode()) {
    themeLink.setAttribute('href', versionedAsset('/static/css/prism/prism-twilight.css'));
  } else {
    themeLink.setAttribute('href', versionedAsset('/static/css/prism/prism-light.css'));
  }
  if (typeof Prism !== 'undefined') Prism.highlightAll();
}

// Initialize Prism theme
switchPrismTheme();

// Expose globals needed by Alpine.js expressions and inline event handlers
window.setAccentTheme = setAccentTheme;
window.isDarkMode = isDarkMode;
window.switchPrismTheme = switchPrismTheme;
window.syncThemeColorMeta = syncThemeColorMeta;
