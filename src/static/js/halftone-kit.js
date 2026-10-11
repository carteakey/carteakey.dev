// Shared math for halftone scenes. Each scene returns coverage per dot (0..1).
export const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function noise(x, y) {
  const ix = Math.floor(x),
    iy = Math.floor(y);
  const fx = x - ix,
    fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx),
    uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy),
    b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1),
    d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

export function fbm(x, y, octaves = 4) {
  let sum = 0,
    amp = 0.5,
    norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x, y);
    norm += amp;
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 9.7;
    amp *= 0.5;
  }
  return sum / norm;
}

// Distance from point p to segment ab.
export function segment(px, py, ax, ay, bx, by) {
  const dx = bx - ax,
    dy = by - ay;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy));
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}

// Toronto seasons by month: winter runs long, into March.
export function seasonFor(date = new Date()) {
  const month = Number(
    new Intl.DateTimeFormat("en-CA", {
      month: "numeric",
      timeZone: "America/Toronto",
    }).format(date),
  );
  if (month === 12 || month <= 3) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

// Write a value into a coverage grid where it contrasts with what is there,
// so falling snow or petals read on both paper and solid ink.
export function stamp(out, cols, rows, i, j, value) {
  if (i < 0 || j < 0 || i >= cols || j >= rows) return;
  const k = j * cols + i;
  out[k] = value < 0 ? (out[k] > 0.5 ? 0.04 : -value) : Math.max(out[k], value);
}
