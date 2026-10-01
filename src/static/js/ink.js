// Ink: three small "drawn by hand" touches.
//   1. Halftone avatar that breathes and swells under the cursor.
//   2. {% annotate %} marks that highlight and write themselves in on scroll.
//   3. .sketch-draw diagrams that wipe in left to right like ink.
// Everything degrades to the static page: no JS, or prefers-reduced-motion,
// leaves the plain avatar image, annotations, and sketches untouched.
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // 2 + 3. Arm elements that start below the fold, then reveal on scroll.
  const arm = (selector, armedClass, drawnClass, threshold) => {
    const els = [...document.querySelectorAll(selector)].filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight * 0.9
    );
    if (!els.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(drawnClass);
          io.unobserve(entry.target);
        });
      },
      { threshold }
    );
    els.forEach((el) => {
      el.classList.add(armedClass);
      io.observe(el);
    });
  };

  // 1. Breathing halftone avatar. Re-draws the SVG's own dots on a canvas so the
  // radius can move; the <img> stays underneath as the no-JS fallback.
  const initAvatar = async () => {
    const shell = document.querySelector(".home-avatar-shell");
    const img = shell && shell.querySelector("img");
    if (!img) return;
    let svg;
    try {
      svg = await (await fetch(img.currentSrc || img.src)).text();
    } catch (e) {
      return;
    }
    const dots = [];
    const re = /<circle cx='([\d.]+)' cy='([\d.]+)' r='([\d.]+)'/g;
    for (let m; (m = re.exec(svg)); ) dots.push(+m[1], +m[2], +m[3]);
    if (!dots.length) return;

    const canvas = document.createElement("canvas");
    canvas.className = "home-avatar-canvas";
    canvas.setAttribute("aria-hidden", "true");
    shell.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const SRC = 320; // the SVG's viewBox
    let size = 0;
    let ptr = null; // pointer in SVG units
    let visible = true;
    let last = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = shell.clientWidth;
      canvas.width = canvas.height = Math.round(size * dpr);
      ctx.setTransform((size * dpr) / SRC, 0, 0, (size * dpr) / SRC, 0, 0);
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, SRC, SRC);
      ctx.fillStyle = "rgba(35,35,230,0.06)";
      ctx.fillRect(0, 0, SRC, SRC);
      ctx.fillStyle = "#2323e6";
      ctx.beginPath();
      for (let i = 0; i < dots.length; i += 3) {
        const x = dots[i], y = dots[i + 1];
        let r = dots[i + 2];
        // Slow diagonal breath, about +/-9% of the dot radius.
        r *= 1 + 0.09 * Math.sin(t * 0.0011 + (x + y) * 0.028);
        if (ptr) {
          const d = Math.hypot(x - ptr.x, y - ptr.y);
          if (d < 70) r *= 1 + 0.55 * Math.pow(1 - d / 70, 2);
        }
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, Math.max(r, 0), 0, 6.2832);
      }
      ctx.fill();
    };

    const frame = (t) => {
      requestAnimationFrame(frame);
      if (!visible || document.hidden || t - last < 33) return; // ~30 fps
      last = t;
      draw(t);
    };

    shell.addEventListener("pointermove", (e) => {
      const b = shell.getBoundingClientRect();
      ptr = { x: ((e.clientX - b.left) / b.width) * SRC, y: ((e.clientY - b.top) / b.height) * SRC };
    });
    shell.addEventListener("pointerleave", () => { ptr = null; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(shell);
    }
    window.addEventListener("resize", resize, { passive: true });
    resize();
    draw(0);
    shell.classList.add("is-breathing");
    requestAnimationFrame(frame);
  };

  const start = () => {
    arm(".note", "note-armed", "note-drawn", 0.6);
    arm(".sketch-draw", "sketch-armed", "sketch-drawn", 0.25);
    initAvatar();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
