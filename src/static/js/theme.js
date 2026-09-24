// Theme Management - Dark/Light Mode
// Extracted from base.njk for cleaner template

const ASSET_VERSION = document.currentScript?.dataset.assetVersion || '';
const versionedAsset = (path) => ASSET_VERSION
  ? `${path}?v=${encodeURIComponent(ASSET_VERSION)}`
  : path;

// Match the light-mode accent in tailwind.css for browser chrome.
const ACCENT_COLOR = "#2323e6";

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

const syncThemeColorMeta = () => {
  const meta = document.getElementById("theme-color-meta");
  if (!meta) return;
  meta.setAttribute("content", isDarkMode() ? "#000000" : ACCENT_COLOR);
};

syncThemeColorMeta();

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
window.isDarkMode = isDarkMode;
window.switchPrismTheme = switchPrismTheme;
window.syncThemeColorMeta = syncThemeColorMeta;
