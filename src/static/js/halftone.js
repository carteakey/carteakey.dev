// The hero portrait's halftone, as a reusable live canvas.
// Orthogonal dot screen, dot area follows coverage (r = 0.6 pitch at full),
// accent ink on a 6% accent tint, slow diagonal breath, swell under the cursor.
// The build-time SVG stills stay underneath as the no-JS fallback.
//
// mountHalftone(shell, makeScene, { cols, fps, still, options })
//   makeScene({ cols, rows, theme, ...options }) -> frame(seconds) -> Float32Array
//   cols: dots across (pitch is clamped to 2.6-4 CSS px)
export function mountHalftone(
  shell,
  makeScene,
  { cols: across = 300, fps = 15, still = 0, options = {} } = {},
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.className = "halftone-canvas";
  canvas.setAttribute("aria-hidden", "true");
  shell.appendChild(canvas);

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  const interval = 1000 / fps;
  let scene, cols, rows, width, height, theme, ink;
  let coverage, drawnAt = 0; // last computed frame, redrawn alone for the cursor
  let pointer = null;
  let pointerFrame;
  let visible = false;
  const started = performance.now();
  let last = -Infinity;
  let raf;

  const build = () => {
    width = shell.clientWidth;
    height = shell.clientHeight;
    if (!width || !height) return false;
    const pitch = Math.max(2.6, Math.min(4, width / across));
    cols = Math.round(width / pitch);
    rows = Math.round(height / pitch);
    theme = root.classList.contains("dark") ? "night" : "day";
    scene = makeScene({ cols, rows, theme, ...options });
    coverage = undefined;
    ink = getComputedStyle(shell).color; // accent; build() re-runs on theme change
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  };

  // Paint dots from the cached coverage: cheap, so the cursor swell can run
  // at display rate while the scene itself advances at `fps`.
  const render = () => {
    if (!coverage) return;
    const seconds = drawnAt;
    const sx = width / cols;
    const sy = height / rows;
    const rMax = Math.min(sx, sy) * 0.6;
    const breath = motion.matches ? 0 : 0.09;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.06;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let j = 0; j < rows; j++) {
      const y = (j + 0.5) * sy;
      for (let i = 0; i < cols; i++) {
        const c = coverage[j * cols + i];
        if (c < 0.015) continue;
        const x = (i + 0.5) * sx;
        let r =
          rMax *
          Math.sqrt(c) *
          (1 + breath * Math.sin(seconds * 1.1 + (x + y) * 0.028));
        if (pointer) {
          const d = Math.hypot(x - pointer.x, y - pointer.y);
          if (d < 60) r *= 1 + 0.55 * (1 - d / 60) ** 2;
        }
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, 6.2832);
      }
    }
    ctx.fill();
    shell.classList.add("is-live");
  };

  const draw = (seconds) => {
    if (!scene && !build()) return;
    coverage = scene(seconds);
    drawnAt = seconds;
    render();
  };

  const now = () => (performance.now() - started) / 1000 + still;
  const paint = () => draw(motion.matches ? still : now());

  const loop = (time) => {
    raf = undefined;
    if (!visible || document.hidden || motion.matches) return;
    raf = requestAnimationFrame(loop);
    if (time - last < interval) return;
    last = time;
    draw((time - started) / 1000 + still);
  };

  const update = () => {
    if (motion.matches) {
      if (raf) cancelAnimationFrame(raf);
      raf = undefined;
      if (visible) paint();
    } else if (visible && !document.hidden && !raf) {
      raf = requestAnimationFrame(loop);
    }
  };

  // One dot redraw per display frame at most, never a scene recompute.
  const swell = () => {
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = undefined;
      if (coverage) render();
      else paint();
    });
  };
  shell.addEventListener("pointermove", (e) => {
    const b = shell.getBoundingClientRect();
    pointer = { x: e.clientX - b.left, y: e.clientY - b.top };
    swell();
  });
  shell.addEventListener("pointerleave", () => {
    pointer = null;
    swell();
  });

  let resizeTimer;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      scene = undefined;
      if (visible) paint();
    }, 80);
  }).observe(shell);

  // Theme switches carry the same scene between day and night.
  new MutationObserver(() => {
    const next = root.classList.contains("dark") ? "night" : "day";
    if (next !== theme) {
      scene = undefined;
      paint();
    }
  }).observe(root, { attributes: true, attributeFilter: ["class"] });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !shell.classList.contains("is-live")) paint();
    update();
  }).observe(shell);
  document.addEventListener("visibilitychange", update);
  motion.addEventListener("change", update);
}
