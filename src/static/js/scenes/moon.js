// Tonight's moon, in its real phase, for the now page.
// makeScene({ cols, rows, theme, date }) -> frame(seconds) -> Float32Array coverage.
// Seen from the northern hemisphere: a waxing moon is lit on the right.
const { clamp, mix, smooth, hash, noise, fbm } = await import(
  new URL("../halftone-kit.js" + new URL(import.meta.url).search, import.meta.url)
    .href
);

const SYNODIC = 29.530588853; // days
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // a known new moon

export function moonPhase(date = Date.now()) {
  const days = (new Date(date).getTime() - NEW_MOON) / 86400000;
  const fraction = (((days % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC; // 0 new, 0.5 full
  const illumination = (1 - Math.cos(fraction * Math.PI * 2)) / 2;
  const f = fraction;
  let name;
  if (f < 0.03 || f >= 0.97) name = "new moon";
  else if (f < 0.22) name = "waxing crescent";
  else if (f < 0.28) name = "first quarter";
  else if (f < 0.47) name = "waxing gibbous";
  else if (f < 0.53) name = "full moon";
  else if (f < 0.72) name = "waning gibbous";
  else if (f < 0.78) name = "last quarter";
  else name = "waning crescent";
  return { fraction, illumination, name };
}

// Caption text, also used by the page script for a fresh live value.
export function describe(date = Date.now()) {
  const { name, illumination } = moonPhase(date);
  return `Tonight in Toronto: ${name}, ${Math.round(illumination * 100)}% lit`;
}

export default function makeScene({ cols, rows, theme = "night", date }) {
  const night = theme === "night";
  const A = cols / rows;
  const out = new Float32Array(cols * rows);
  const { fraction, illumination } = moonPhase(date ?? Date.now());
  const k = Math.cos(fraction * Math.PI * 2); // 1 new ... -1 full
  const waxing = fraction < 0.5;
  const cx = A * 0.5, cy = 0.5, R = 0.31;

  // Static layer: the disc (lit part, maria, craters, earthshine) and halo.
  const base = new Float32Array(cols * rows);
  const sky = new Float32Array(cols * rows); // 1 where open sky, for stars and cloud
  const craters = [
    [-0.32, -0.38, 0.1], [0.38, -0.22, 0.08], [-0.1, 0.5, 0.12],
    [0.5, 0.3, 0.07], [-0.55, 0.15, 0.06], [0.05, -0.62, 0.05],
  ];
  const edge = 1.4 / (R * rows); // one dot of softness at the terminator
  for (let j = 0; j < rows; j++) {
    const y = (j + 0.5) / rows;
    for (let i = 0; i < cols; i++) {
      const x = ((i + 0.5) / cols) * A;
      const p = j * cols + i;
      const u = (x - cx) / R, v = (y - cy) / R;
      const d = Math.hypot(u, v);
      let value = 0;
      if (d < 1) {
        const s = Math.sqrt(1 - v * v);
        // Lit where x is past the terminator ellipse (half-width |k| * s).
        const t = waxing ? u - k * s : -k * s - u;
        const lit = smooth(-edge, edge, t);
        // Maria: soft patches, darker, seen on the near side.
        let maria = smooth(0.5, 0.38, fbm(u * 2.3 + 4, v * 2.3, 3)) * smooth(0.95, 0.6, d);
        // Craters: a dark floor with a bright rim.
        let rim = 0;
        for (const [qx, qy, qr] of craters) {
          const e = Math.hypot(u - qx, v - qy) / qr;
          if (e < 0.8) maria = Math.max(maria, 0.4);
          else if (e < 1.1) rim = 1;
        }
        const body = night ? mix(1, 0.72, maria) : mix(0.96, 0.62, maria);
        const litV = rim ? Math.min(1, body + 0.1) : body;
        // The dark part: earthshine strong enough to show the maria, so a new
        // moon still reads as the moon rather than an empty disc.
        const dark = night ? 0.08 + 0.1 * (1 - maria) : 0.17 - 0.08 * maria;
        value = mix(dark, litV, lit);
        // A drawn limb keeps the unlit disc from dissolving into the sky.
        if (d > 0.9 && lit < 0.5) value = Math.max(value, night ? 0.3 : 0.42);
      } else {
        sky[p] = 1;
        // A soft halo, stronger when fuller.
        if (night) value = (0.05 + 0.17 * illumination) * Math.exp(-(d - 1) * 4.2) * smooth(2.6, 1.1, d);
        // Stars: sparse, away from the halo; each twinkles in the frame.
        else value = 0;
      }
      base[p] = value;
    }
  }

  return function frame(t) {
    out.set(base);
    if (!night) return out;
    for (let j = 0; j < rows; j++) {
      const y = (j + 0.5) / rows;
      for (let i = 0; i < cols; i++) {
        const p = j * cols + i;
        if (!sky[p]) continue;
        const x = ((i + 0.5) / cols) * A;
        // Stars.
        const h = hash(i * 0.71 + 3, j * 1.37);
        if (h > 0.985 && Math.hypot(x - cx, y - cy) > R * 1.5) {
          const tw = 0.55 + 0.45 * Math.sin(t * (0.8 + 2 * hash(j, i)) + h * 40);
          out[p] = Math.max(out[p], (0.3 + 0.6 * hash(i, j * 2.1)) * tw);
        }
      }
    }
    // A thin wisp of cloud drifting across, veiling what it crosses.
    const wx = (((t * 0.015) % 1.8) - 0.4) * A; // slow, loops off-screen
    const wispY = 0.6 + 0.04 * Math.sin(t * 0.07);
    for (let j = 0; j < rows; j++) {
      const y = (j + 0.5) / rows;
      const band = smooth(0.09, 0.0, Math.abs(y - wispY));
      if (band <= 0) continue;
      for (let i = 0; i < cols; i++) {
        const x = ((i + 0.5) / cols) * A;
        const env = smooth(0.45, 0.0, Math.abs(x - wx));
        if (env <= 0) continue;
        const w = smooth(0.5, 0.75, fbm(x * 5 - wx * 3, y * 16 + x * 3, 3)) * band * env;
        if (w <= 0.03) continue;
        const p = j * cols + i;
        out[p] = clamp(out[p] * (1 - 0.45 * w) + 0.14 * w);
      }
    }
    return out;
  };
}
