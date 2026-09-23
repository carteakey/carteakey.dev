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
// (invert/sepia/saturate/hue-rotate/contrast/brightness) against the art's
// real bold-ink tone (~rgb(13,13,13), the 10th percentile of opaque pixel
// values - sampled from the source art, not assumed). An earlier version
// forced every pixel through brightness(0) first to guarantee one exact hue,
// but these sketches use light-vs-dark *opaque* gray values (not alpha) for
// shading and fine detail - forcing pure black erased that shading entirely,
// flattening detailed icons into solid silhouettes. This version leaves the
// source's natural tonal range alone (so shading/detail survive) and solves
// each theme's transform to land close to its target hex at the ink tone,
// capping brightness to 75-125% so lighter shading pixels don't blow out to
// white in the process. Fit is close but not pixel-exact (worst case ~0.07
// in normalized RGB distance, e.g. lime/green) - an intentional trade for
// keeping the art legible.
const STAMP_FILTERS = {
  gray: "invert(40%) sepia(75%) saturate(50%) hue-rotate(183deg) contrast(140%) brightness(95%)",
  slate: "invert(40%) sepia(100%) saturate(50%) hue-rotate(177deg) contrast(200%) brightness(90%)",
  zinc: "invert(40%) sepia(60%) saturate(50%) hue-rotate(201deg) contrast(80%) brightness(95%)",
  neutral: "invert(30%) sepia(60%) saturate(50%) hue-rotate(60deg) contrast(80%) brightness(120%)",
  stone: "invert(40%) sepia(60%) saturate(50%) hue-rotate(342deg) contrast(80%) brightness(95%)",
  red: "invert(30%) sepia(60%) saturate(1450%) hue-rotate(327deg) contrast(100%) brightness(105%)",
  orange: "invert(40%) sepia(100%) saturate(600%) hue-rotate(348deg) contrast(100%) brightness(105%)",
  amber: "invert(40%) sepia(75%) saturate(1000%) hue-rotate(21deg) contrast(160%) brightness(120%)",
  yellow: "invert(40%) sepia(100%) saturate(900%) hue-rotate(30deg) contrast(200%) brightness(110%)",
  lime: "invert(40%) sepia(100%) saturate(900%) hue-rotate(51deg) contrast(80%) brightness(120%)",
  green: "invert(40%) sepia(90%) saturate(600%) hue-rotate(96deg) contrast(80%) brightness(120%)",
  emerald: "invert(40%) sepia(100%) saturate(250%) hue-rotate(108deg) contrast(140%) brightness(115%)",
  teal: "invert(40%) sepia(100%) saturate(350%) hue-rotate(126deg) contrast(100%) brightness(115%)",
  cyan: "invert(40%) sepia(100%) saturate(350%) hue-rotate(141deg) contrast(120%) brightness(115%)",
  sky: "invert(40%) sepia(60%) saturate(750%) hue-rotate(156deg) contrast(100%) brightness(115%)",
  blue: "invert(30%) sepia(90%) saturate(1250%) hue-rotate(198deg) contrast(80%) brightness(110%)",
  indigo: "invert(40%) sepia(100%) saturate(400%) hue-rotate(201deg) contrast(200%) brightness(95%)",
  violet: "invert(30%) sepia(100%) saturate(650%) hue-rotate(225deg) contrast(100%) brightness(110%)",
  purple: "invert(40%) sepia(60%) saturate(350%) hue-rotate(228deg) contrast(200%) brightness(105%)",
  fuchsia: "invert(40%) sepia(75%) saturate(500%) hue-rotate(246deg) contrast(140%) brightness(95%)",
  pink: "invert(30%) sepia(60%) saturate(850%) hue-rotate(282deg) contrast(100%) brightness(120%)",
  rose: "invert(30%) sepia(100%) saturate(1050%) hue-rotate(318deg) contrast(100%) brightness(95%)"
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
