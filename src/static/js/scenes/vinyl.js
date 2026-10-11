// A record turning at 33⅓ under a resting tonearm, for the listening page.
// The sheen stays put while the grooves and label turn beneath it.
// makeScene({ cols, rows, theme }) -> frame(seconds) -> Float32Array coverage.
const { clamp, mix, smooth, hash, noise, segment } = await import(
  new URL("../halftone-kit.js" + new URL(import.meta.url).search, import.meta.url)
    .href
);

export default function makeScene({ cols, rows, theme = "night" }) {
  const night = theme === "night";
  const A = cols / rows;
  const out = new Float32Array(cols * rows);
  const cx = A * 0.45, cy = 0.5, R = 0.42;
  const pivotX = A * 0.88, pivotY = 0.14;
  const headX = cx + 0.2, headY = cy + 0.2;
  const elbowX = pivotX - 0.02, elbowY = cy + 0.08;

  // Per-cell polar coordinates, computed once.
  const radius = new Float32Array(cols * rows);
  const angle = new Float32Array(cols * rows);
  const arm = new Float32Array(cols * rows).fill(-1);
  for (let j = 0; j < rows; j++) {
    const y = (j + 0.5) / rows;
    for (let i = 0; i < cols; i++) {
      const x = ((i + 0.5) / cols) * A;
      const k = j * cols + i;
      radius[k] = Math.hypot(x - cx, y - cy);
      angle[k] = Math.atan2(y - cy, x - cx);
      // Tonearm: pivot, a slight dogleg, and the headshell on the grooves.
      if (Math.hypot(x - pivotX, y - pivotY) < 0.055) arm[k] = night ? 0.35 : 0.06;
      else if (Math.hypot(x - pivotX, y - pivotY) < 0.075) arm[k] = night ? 0.08 : 0.75;
      else {
        // Pale chrome with an inked outline by day, so it reads on paper and vinyl.
        const d = Math.min(
          segment(x, y, pivotX, pivotY, elbowX, elbowY),
          segment(x, y, elbowX, elbowY, headX, headY),
        );
        if (d < 0.009) arm[k] = night ? 0.45 : 0.1;
        else if (d < 0.017 && !night) arm[k] = 0.85;
      }
      if (arm[k] >= 0) continue;
      if (segment(x, y, headX - 0.01, headY - 0.02, headX + 0.02, headY + 0.03) < 0.022)
        arm[k] = night ? 0.55 : 0.04;
    }
  }

  return function frame(t) {
    const spin = (t * Math.PI * 2 * (100 / 3)) / 60; // 33⅓ rpm
    for (let k = 0; k < out.length; k++) {
      const r = radius[k];
      let v = 0;
      if (r < R) {
        const a = angle[k] - spin;
        if (r > 0.155) {
          // Vinyl: fine grooves, darker gaps between tracks, faint warps
          // that turn with the record so the motion reads.
          const groove = Math.sin(r * 420) > 0.55;
          const gap = [0.22, 0.29, 0.35].some((g) => Math.abs(r - g) < 0.005);
          const warp = noise(Math.cos(a) * 3 + 5, Math.sin(a) * 3 + r * 20);
          v = night ? (groove ? 0.12 : 0.04) + warp * 0.05 : groove ? 0.78 : 0.95;
          if (gap) v = night ? 0.01 : 0.55;
          // Fixed sheen: two bright wedges where the light catches the grooves.
          const lightA = angle[k] + 0.6;
          const sheen = Math.pow(Math.abs(Math.cos(lightA)), 18) * smooth(0.16, 0.24, r);
          v = night ? clamp(v + sheen * 0.55) : clamp(v - sheen * 0.6);
          if (r > R - 0.008) v = night ? 0.3 : 1; // lip
        } else if (r > 0.012) {
          // Label: a printed ring and a mark that shows the turn.
          v = night ? 0.5 : 0.22;
          if (Math.abs(r - 0.12) < 0.008) v = night ? 0.2 : 0.75;
          const mark = Math.cos(a) > 0.92 && r > 0.04 && r < 0.1;
          const dot = Math.hypot(Math.cos(a) * r + 0.06, Math.sin(a) * r) < 0.016;
          if (mark || dot) v = night ? 0.12 : 0.9;
        }
      } else if (r < R + 0.025) {
        v = night ? 0.03 : 0.12 * (1 - (r - R) / 0.025); // platter edge shadow
      }
      if (arm[k] >= 0) v = arm[k];
      out[k] = v;
    }
    // Dust: a few motes catching the light above the platter.
    for (let d = 0; d < 6; d++) {
      const life = (t * 0.05 + hash(d, 1)) % 1;
      const x = cx - R + hash(d, 2) * R * 2 + Math.sin(t * 0.5 + d) * 0.03;
      const y = 0.1 + life * 0.8;
      const i = Math.floor((x / A) * cols), j = Math.floor(y * rows);
      if (i >= 0 && j >= 0 && i < cols && j < rows && night) out[j * cols + i] = Math.max(out[j * cols + i], 0.5 * (1 - life));
    }
    return out;
  };
}
