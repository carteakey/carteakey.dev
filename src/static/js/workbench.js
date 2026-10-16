(() => {
  const toggleDarkBtn = document.getElementById("toggleDarkMode");
  if (toggleDarkBtn) {
    toggleDarkBtn.addEventListener("click", () => {
      if (typeof isDarkMode === "function" && isDarkMode()) {
        localStorage.theme = "light";
        document.documentElement.classList.remove("dark");
      } else {
        localStorage.theme = "dark";
        document.documentElement.classList.add("dark");
      }
      if (typeof switchPrismTheme === "function") {
        switchPrismTheme();
      }
      if (typeof window.syncThemeColorMeta === "function") {
        window.syncThemeColorMeta();
      }
    });
  }

  const initDomHelpers = () => {
    if (typeof window.mediumZoom === "function") {
      window.mediumZoom("[data-zoomable]", { background: "rgba(0,0,0,0.85)" });
    }

    document.querySelectorAll('pre[class*="language-"]').forEach((pre) => {
      const code = pre.querySelector("code");
      if (!code || pre.querySelector(".copy-code-btn")) return;
      const btn = document.createElement("button");
      btn.className = "copy-code-btn";
      btn.title = "Copy code";
      const copyIcon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      const checkIcon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      btn.innerHTML = copyIcon;
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(code.textContent);
          btn.innerHTML = checkIcon;
          setTimeout(() => {
            btn.innerHTML = copyIcon;
          }, 2000);
        } catch {
          btn.textContent = "!";
        }
      });
      pre.style.position = "relative";
      pre.appendChild(btn);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDomHelpers, { once: true });
  } else {
    initDomHelpers();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/static/js/sw.js").catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
    });
  }

  const nav = {
    h: "/",
    b: "/blog/",
    l: "/notes/",
    f: "/feed/",
    s: "/notes/?type=snippet",
    n: "/now/",
    t: "/notes/?type=til",
    r: "/reading/",
    a: "/ai/",
    u: "/uses/",
  };

  const toggleShortcutsOverlay = (forceOpen) => {
    const overlay = document.getElementById("shortcuts-overlay");
    if (!overlay) return;
    const isHidden = overlay.classList.contains("hidden");
    const nextOpen = typeof forceOpen === "boolean" ? forceOpen : isHidden;
    overlay.classList.toggle("hidden", !nextOpen);
    overlay.classList.toggle("flex", nextOpen);
  };

  window.toggleShortcutsOverlay = toggleShortcutsOverlay;

  document.addEventListener("keydown", (e) => {
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable
    ) {
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.shiftKey && e.key !== "?") return;
    const k = e.key.toLowerCase();
    if (nav[k]) {
      window.location.href = nav[k];
      return;
    }
    if (k === "d") {
      document.getElementById("toggleDarkMode")?.click();
      return;
    }
    if (k === "/") {
      e.preventDefault();
      window.location.href = "/search/";
      return;
    }
    if (e.key === "?") {
      toggleShortcutsOverlay();
      return;
    }
    if (e.key === "Escape") {
      toggleShortcutsOverlay(false);
    }
  });
})();
