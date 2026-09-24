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
// (invert/sepia/saturate/hue-rotate/brightness). Three earlier versions of
// this each missed a different part of the problem:
// v1 forced every pixel through brightness(0)/saturate(100%) first, which
// erased the light-vs-dark *opaque* gray shading some icons use for detail
// (not alpha) - fan blades and gauge markings flattened into solid
// silhouettes. v2 dropped that but calibrated only against one sketch's
// near-black ink (~rgb(13,13,13)); a different icon with a much lighter
// natural tone still flattened. v3 solved against two source tones at
// once but still visibly mismatched between images (e.g. one thumbnail
// reading orange, another red, at the same accent) - the actual root
// cause turned out to be upstream: post_thumbnail's 64px minimum width
// (see generatePostThumbnailMetadata in eleventy.config.mjs) blurred each
// sketch's thin ink strokes by a different amount depending on line
// density, before this filter ever ran (measured: one source's ~14/255
// ink landed at ~83/255 post-resize at 64px, another barely moved).
// Raising that floor to 96px shrank the gap between sources substantially
// (~64 vs ~74/255, was ~13 vs ~74) - recalibrated here against those
// post-fix values, which is why this version can afford more saturation
// than v3 while still tracking closely across different source images.
const STAMP_FILTERS = {
  gray: "invert(25%) sepia(100%) saturate(50%) hue-rotate(180deg) brightness(95%)",
  slate: "invert(25%) sepia(90%) saturate(110%) hue-rotate(177deg) brightness(95%)",
  zinc: "invert(25%) sepia(90%) saturate(30%) hue-rotate(201deg) brightness(95%)",
  neutral: "invert(25%) sepia(50%) saturate(30%) hue-rotate(234deg) brightness(105%)",
  stone: "invert(25%) sepia(100%) saturate(30%) hue-rotate(342deg) brightness(95%)",
  red: "invert(25%) sepia(100%) saturate(490%) hue-rotate(318deg) brightness(95%)",
  orange: "invert(25%) sepia(100%) saturate(490%) hue-rotate(342deg) brightness(110%)",
  amber: "invert(25%) sepia(100%) saturate(490%) hue-rotate(351deg) brightness(110%)",
  yellow: "invert(25%) sepia(100%) saturate(490%) hue-rotate(354deg) brightness(110%)",
  lime: "invert(25%) sepia(100%) saturate(490%) hue-rotate(33deg) brightness(110%)",
  green: "invert(25%) sepia(100%) saturate(330%) hue-rotate(96deg) brightness(110%)",
  emerald: "invert(25%) sepia(100%) saturate(490%) hue-rotate(117deg) brightness(110%)",
  teal: "invert(25%) sepia(100%) saturate(370%) hue-rotate(132deg) brightness(110%)",
  cyan: "invert(25%) sepia(100%) saturate(490%) hue-rotate(147deg) brightness(110%)",
  sky: "invert(25%) sepia(100%) saturate(490%) hue-rotate(156deg) brightness(110%)",
  blue: "invert(25%) sepia(100%) saturate(470%) hue-rotate(180deg) brightness(105%)",
  indigo: "invert(25%) sepia(100%) saturate(490%) hue-rotate(201deg) brightness(95%)",
  violet: "invert(25%) sepia(100%) saturate(490%) hue-rotate(219deg) brightness(95%)",
  purple: "invert(25%) sepia(100%) saturate(470%) hue-rotate(228deg) brightness(100%)",
  fuchsia: "invert(25%) sepia(100%) saturate(490%) hue-rotate(249deg) brightness(105%)",
  pink: "invert(25%) sepia(100%) saturate(490%) hue-rotate(282deg) brightness(95%)",
  rose: "invert(25%) sepia(100%) saturate(490%) hue-rotate(306deg) brightness(95%)"
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
