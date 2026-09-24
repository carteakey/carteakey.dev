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
// chosen accent. Solved by simulating the actual CSS Filter Effects matrices
// (invert/sepia/saturate/hue-rotate/brightness). Two earlier versions of
// this each overfit to one calibration image's characteristic ink tone:
// v1 forced every pixel through brightness(0)/saturate(100%) first, which
// erased the light-vs-dark *opaque* gray shading some icons use for detail
// (not alpha) - fan blades and gauge markings flattened into solid
// silhouettes. v2 dropped that but calibrated only against one sketch's
// near-black ink (~rgb(13,13,13)); a different icon with a much lighter
// natural ink tone (~rgb(74,74,74), no true dark anchor at all) still
// flattened under the resulting high saturate/contrast values, which
// amplify range-dependent behavior. This version solves against BOTH
// tones at once (minimizes combined error) with contrast dropped entirely
// and saturate capped low (<=5x) so the transform stays gentle enough to
// degrade gracefully on any sketch's tonal range, at the cost of being a
// looser match to the exact target hex than either earlier version.
const STAMP_FILTERS = {
  gray: "invert(25%) sepia(65%) saturate(70%) hue-rotate(180deg) brightness(100%)",
  slate: "invert(25%) sepia(90%) saturate(110%) hue-rotate(177deg) brightness(95%)",
  zinc: "invert(25%) sepia(90%) saturate(30%) hue-rotate(201deg) brightness(95%)",
  neutral: "invert(25%) sepia(50%) saturate(30%) hue-rotate(234deg) brightness(105%)",
  stone: "invert(25%) sepia(90%) saturate(30%) hue-rotate(342deg) brightness(95%)",
  red: "invert(25%) sepia(100%) saturate(490%) hue-rotate(318deg) brightness(110%)",
  orange: "invert(25%) sepia(100%) saturate(490%) hue-rotate(342deg) brightness(110%)",
  amber: "invert(25%) sepia(100%) saturate(490%) hue-rotate(348deg) brightness(110%)",
  yellow: "invert(25%) sepia(100%) saturate(490%) hue-rotate(354deg) brightness(110%)",
  lime: "invert(25%) sepia(100%) saturate(490%) hue-rotate(33deg) brightness(110%)",
  green: "invert(25%) sepia(100%) saturate(330%) hue-rotate(96deg) brightness(110%)",
  emerald: "invert(25%) sepia(100%) saturate(490%) hue-rotate(117deg) brightness(110%)",
  teal: "invert(25%) sepia(100%) saturate(490%) hue-rotate(132deg) brightness(110%)",
  cyan: "invert(25%) sepia(100%) saturate(490%) hue-rotate(150deg) brightness(110%)",
  sky: "invert(25%) sepia(100%) saturate(490%) hue-rotate(156deg) brightness(110%)",
  blue: "invert(25%) sepia(100%) saturate(490%) hue-rotate(183deg) brightness(110%)",
  indigo: "invert(25%) sepia(100%) saturate(490%) hue-rotate(201deg) brightness(110%)",
  violet: "invert(25%) sepia(100%) saturate(490%) hue-rotate(216deg) brightness(110%)",
  purple: "invert(25%) sepia(100%) saturate(490%) hue-rotate(225deg) brightness(110%)",
  fuchsia: "invert(25%) sepia(100%) saturate(490%) hue-rotate(249deg) brightness(105%)",
  pink: "invert(25%) sepia(100%) saturate(490%) hue-rotate(288deg) brightness(110%)",
  rose: "invert(25%) sepia(100%) saturate(490%) hue-rotate(306deg) brightness(110%)"
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
