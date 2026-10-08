// Smooth circles, like the hero portrait, from a scene's continuous ink coverage.
// Keep the character frame underneath until the first canvas draw succeeds.
export function makeHalftoneRenderer(element, theme) {
  const canvas = document.createElement("canvas");
  canvas.className = `ascii-canvas ascii-canvas-${theme}`;
  canvas.setAttribute("aria-hidden", "true");
  const context = canvas.getContext("2d");
  if (!context) return null;
  element.parentElement.appendChild(canvas);
  let latest;

  function draw() {
    if (!latest || !canvas.clientWidth || !canvas.clientHeight) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = getComputedStyle(canvas.parentElement).color;
    const { density, cols, rows } = latest;
    const step = width / Math.min(480, Math.ceil(width / 2.4));
    context.beginPath();
    for (let y = step / 2; y < height; y += step) {
      // Stagger the screen to avoid the old vertical character-grid stripes.
      const offset = Math.round(y / step) % 2 ? step / 2 : 0;
      for (let x = step / 2 + offset; x < width; x += step) {
        const sx = Math.max(0, Math.min(cols - 1, (x / width) * cols - 0.5));
        const sy = Math.max(0, Math.min(rows - 1, (y / height) * rows - 0.5));
        const ix = Math.floor(sx),
          iy = Math.floor(sy);
        const nx = Math.min(ix + 1, cols - 1),
          ny = Math.min(iy + 1, rows - 1);
        const fx = sx - ix,
          fy = sy - iy;
        const top =
          density[iy * cols + ix] * (1 - fx) + density[iy * cols + nx] * fx;
        const bottom =
          density[ny * cols + ix] * (1 - fx) + density[ny * cols + nx] * fx;
        const coverage = top * (1 - fy) + bottom * fy;
        if (coverage < 0.008) continue;
        const radius = step * 0.55 * Math.sqrt(coverage);
        context.moveTo(x + radius, y);
        context.arc(x, y, radius, 0, Math.PI * 2);
      }
    }
    context.fill();
    element.classList.add("is-painted");
  }

  new ResizeObserver(draw).observe(canvas);
  // Repaint a still frame too when the visitor changes the accent or theme.
  new MutationObserver(draw).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  return (frame) => {
    latest = frame;
    draw();
  };
}
