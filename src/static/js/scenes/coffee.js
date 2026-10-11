// A cup of coffee with steam curling off it, for the support page.
// makeScene({ cols, rows, theme }) -> frame(seconds) -> Float32Array coverage.
const { clamp, mix, smooth, noise, fbm } = await import(
  new URL("../halftone-kit.js" + new URL(import.meta.url).search, import.meta.url)
    .href
);

export default function makeScene({ cols, rows, theme = "night" }) {
  const night = theme === "night";
  const A = cols / rows;
  const out = new Float32Array(cols * rows);
  const cx = A * 0.46;
  const rimY = 0.5, rimRx = 0.2, rimRy = 0.05;
  const bottomY = 0.83;

  // Static cup, saucer, and shadow.
  const base = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    const y = (j + 0.5) / rows;
    for (let i = 0; i < cols; i++) {
      const x = ((i + 0.5) / cols) * A;
      let v = 0;
      // Saucer: a flat ellipse with a lit rim and a shadow under the cup.
      const saucer = Math.hypot((x - cx) / 0.34, (y - 0.86) / 0.055);
      if (saucer < 1) {
        const shadow = Math.hypot((x - cx - 0.03) / 0.22, (y - 0.85) / 0.03) < 1;
        v = night ? (saucer > 0.8 ? 0.4 : 0.14) : saucer > 0.8 ? 0.2 : shadow ? 0.75 : 0.42;
      }
      // Body: a slightly tapered cylinder lit from the left.
      const f = (y - rimY) / (bottomY - rimY);
      const half = rimRx * (1 - 0.12 * f);
      const curve = rimRy * Math.sqrt(Math.max(0, 1 - ((x - cx) / half) ** 2));
      if (f >= 0 && y < bottomY + curve * 0.8 && Math.abs(x - cx) < half) {
        const u = (x - cx) / half; // -1 lit edge, +1 shaded edge
        const shade = smooth(-0.9, 0.8, u);
        v = night ? mix(0.62, 0.08, shade) : mix(0.08, 0.7, shade);
        // A band glazed around the cup.
        if (f > 0.22 && f < 0.32) v = night ? mix(0.25, 0.03, shade) : mix(0.75, 0.98, shade);
      }
      // Handle: a ring on the shaded side.
      const hx = cx + rimRx + 0.02, hy = rimY + 0.14;
      const ring = Math.hypot((x - hx) / 1.1, y - hy);
      if (x > cx + half * 0.9 && ring > 0.055 && ring < 0.095) v = night ? 0.12 : 0.8;
      // Rim and the coffee surface, with a crescent of crema.
      const rim = Math.hypot((x - cx) / rimRx, (y - rimY) / rimRy);
      if (rim < 1) {
        const crema = Math.hypot((x - cx + 0.03) / (rimRx * 0.8), (y - rimY + 0.008) / (rimRy * 0.75));
        v = night ? (crema > 0.85 ? 0.3 : 0.04) : crema > 0.85 ? 0.55 : 0.97;
        if (rim > 0.88) v = night ? 0.7 : 0.06;
      }
      base[(j * cols) + i] = v;
    }
  }

  return function frame(t) {
    out.set(base);
    // Steam: three wisps that rise, curl, thin out, and break apart.
    for (let j = 0; j < rows; j++) {
      const y = (j + 0.5) / rows;
      if (y > rimY - 0.02) break;
      const rise = (rimY - y) / rimY; // 0 at the cup, 1 at the top
      for (let i = 0; i < cols; i++) {
        const x = ((i + 0.5) / cols) * A;
        let s = 0;
        for (let w = 0; w < 3; w++) {
          const sx =
            cx + (w - 1) * 0.07 +
            Math.sin(y * 9 - t * 1.5 + w * 2.1) * 0.05 * rise +
            (noise(y * 4 - t * 0.6, w * 3) - 0.5) * 0.08 * rise;
          const width = 0.016 + 0.03 * rise;
          s = Math.max(s, 1 - Math.abs(x - sx) / width);
        }
        if (s <= 0) continue;
        const breakup = fbm(x * 12, y * 10 + t * 0.9, 3);
        const fade = smooth(0, 0.15, rise) * (1 - smooth(0.55, 1, rise));
        const steam = clamp(s * 1.4 + (breakup - 0.5) * 1.2) * fade;
        const k = j * cols + i;
        out[k] = clamp(out[k] + steam * (night ? 0.5 : 0.42));
      }
    }
    return out;
  };
}
