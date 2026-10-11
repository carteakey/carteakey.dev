// An old reel-to-reel projector throwing a cone of light, for the watching page.
// makeScene({ cols, rows, theme }) -> frame(seconds) -> Float32Array coverage.
const { clamp, mix, smooth, hash, noise, segment } = await import(
  new URL("../halftone-kit.js" + new URL(import.meta.url).search, import.meta.url)
    .href
);

export default function makeScene({ cols, rows, theme = "night" }) {
  const night = theme === "night";
  const A = cols / rows;
  const out = new Float32Array(cols * rows);
  const n = cols * rows;

  // Layout (world units; y down).
  const reels = [
    { x: 0.17, y: 0.37 },
    { x: 0.42, y: 0.37 },
  ];
  const reelR = 0.12;
  const lens = { x: 0.64, y: 0.73 };
  const aim = (-34 * Math.PI) / 180; // up and to the right
  const half = (15 * Math.PI) / 180;
  const dirX = Math.cos(aim), dirY = Math.sin(aim);
  const BODY = night ? 0.07 : 0.94;
  const LIT = night ? 0.55 : 0.34;

  const solid = new Float32Array(n); // projector body, static
  const rimmask = new Uint8Array(n);
  const beamAlong = new Float32Array(n).fill(-1);
  const beamAcross = new Float32Array(n);
  const inBody = (x, y) => {
    // Main case, a stepped nose for the lens, feet, arms up to the reels.
    if (x > 0.07 && x < 0.5 && y > 0.6 && y < 0.84) return true;
    if (x >= 0.5 && x < 0.57 && y > 0.66 && y < 0.8) return true; // nose
    if (x >= 0.57 && x < 0.64 && y > 0.68 && y < 0.78) return true; // lens barrel
    if (x > 0.58 && x < 0.62 && y > 0.65 && y < 0.81) return true; // lens collar
    if (segment(x, y, 0.1, 0.84, 0.08, 0.9) < 0.016) return true; // feet
    if (segment(x, y, 0.47, 0.84, 0.49, 0.9) < 0.016) return true;
    for (const r of reels) if (Math.abs(x - r.x) < 0.016 && y > r.y && y < 0.62) return true; // reel posts
    for (const r of reels) if (Math.hypot(x - r.x, y - r.y) < 0.024) return true; // hubs
    // Film path: reels down to the gate and out through the case.
    if (segment(x, y, reels[0].x + 0.1, reels[0].y + 0.04, 0.3, 0.65) < 0.005) return true;
    if (segment(x, y, reels[1].x - 0.1, reels[1].y + 0.04, 0.3, 0.65) < 0.005) return true;
    return false;
  };
  const mask = new Uint8Array(n);
  for (let j = 0; j < rows; j++) {
    const y = (j + 0.5) / rows;
    for (let i = 0; i < cols; i++) {
      const x = ((i + 0.5) / cols) * A;
      const k = j * cols + i;
      if (inBody(x, y)) mask[k] = 1;
      // The beam cone from the lens.
      const dx = x - lens.x, dy = y - lens.y;
      const along = dx * dirX + dy * dirY;
      if (along > 0.01 && !mask[k]) {
        const perp = -dx * dirY + dy * dirX;
        const w = along * Math.tan(half) + 0.012;
        if (Math.abs(perp) < w) {
          beamAlong[k] = along;
          beamAcross[k] = perp / w;
        }
      }
    }
  }
  const reelOf = new Int8Array(n).fill(-1);
  for (let j = 0; j < rows; j++) {
    const y = (j + 0.5) / rows;
    for (let i = 0; i < cols; i++) {
      const x = ((i + 0.5) / cols) * A;
      reels.forEach((r, q) => {
        if (Math.hypot(x - r.x, y - r.y) < reelR) reelOf[j * cols + i] = q;
      });
    }
  }
  // Light catches edges facing the beam (up and to the right).
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      if (!mask[k]) continue;
      solid[k] = BODY;
      const up = j > 0 && !mask[k - cols] && reelOf[k - cols] < 0;
      const right = i < cols - 1 && !mask[k + 1] && reelOf[k + 1] < 0;
      const rowY = (j + 0.5) / rows;
      if ((up || right) && rowY > 0.58) solid[k] = LIT;
    }
  }
  // Lens glass: bright where the light leaves.
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ((i + 0.5) / cols) * A, y = (j + 0.5) / rows;
      if (x >= 0.62 && x < 0.64 && Math.abs(y - lens.y) < 0.034) solid[j * cols + i] = night ? 0.95 : 0.12;
    }
  }

  // Dust motes: each lives somewhere along the beam and drifts.
  const motes = Array.from({ length: 64 }, (_, q) => ({
    s: hash(q, 1.3),
    c: hash(q, 5.7) * 2 - 1,
    speed: 0.012 + 0.02 * hash(q, 9.1),
    sway: 0.6 + hash(q, 2.2),
    ph: hash(q, 7.7) * 6.28,
    b: 0.6 + 0.4 * hash(q, 3.3),
  }));
  const reach = 0.95;

  return function frame(t) {
    // A projector's 24-frame flutter in the light.
    const flicker = 0.9 + 0.1 * hash(Math.floor(t * 24), 3.1) + 0.04 * Math.sin(t * 60);
    for (let k = 0; k < n; k++) {
      let v = solid[k];
      const a = beamAlong[k];
      if (a >= 0) {
        const edge = smooth(1, 0.8, Math.abs(beamAcross[k]));
        const fall = 1 - smooth(0.05, reach, a) * (night ? 0.45 : 0.55);
        const cast = night ? 0.38 : 0.3;
        const dust = 0.85 + 0.15 * noise(a * 14 - t * 0.5, beamAcross[k] * 3);
        v = cast * edge * fall * flicker * dust;
        if (!night) v = Math.max(v, 0.12 * edge * (a < reach ? 1 : 0));
      }
      out[k] = v;
    }
    // Reels: rim, spokes that turn, film wound on the near one.
    for (let j = 0; j < rows; j++) {
      const y = (j + 0.5) / rows;
      for (let i = 0; i < cols; i++) {
        const q = reelOf[j * cols + i];
        if (q < 0) continue;
        const x = ((i + 0.5) / cols) * A;
        const r = reels[q];
        const d = Math.hypot(x - r.x, y - r.y);
        const spin = t * (q ? -2.6 : 2.2);
        const ang = Math.atan2(y - r.y, x - r.x);
        let v = 0;
        if (d > reelR - 0.014) {
          v = BODY; // rim
          if (!night) {
            const facing = Math.cos(ang + Math.PI / 4);
            if (facing > 0.8) v = LIT;
          } else if (Math.cos(ang + Math.PI / 4) > 0.55) v = LIT;
        } else if (d < 0.024) v = BODY;
        else {
          // Six spokes with the film wound near the rim.
          const sp = Math.cos(6 * (ang - spin)) > 0.82;
          if (sp) v = BODY;
          else if (d > reelR - 0.04) v = night ? 0.1 : 0.55; // wound film
          else v = night ? 0 : 0;
        }
        out[j * cols + i] = v;
      }
    }
    // Dust motes drifting in the cone, brighter as they cross the flicker.
    for (const m of motes) {
      const s = (m.s + t * m.speed) % 1;
      const along = 0.08 + s * (reach - 0.08);
      const w = along * Math.tan(half) + 0.012;
      const c = clamp(m.c * 0.9 + Math.sin(t * 0.7 * m.sway + m.ph) * 0.08, -0.9, 0.9);
      const px = lens.x + dirX * along - dirY * c * w;
      const py = lens.y + dirY * along + dirX * c * w + Math.sin(t * 0.9 + m.ph) * 0.006;
      const i = Math.floor((px / A) * cols), j = Math.floor(py * rows);
      if (i < 0 || j < 0 || i >= cols || j >= rows) continue;
      const k = j * cols + i;
      if (beamAlong[k] < 0) continue;
      const glint = m.b * (0.6 + 0.4 * Math.sin(t * 3 * m.sway + m.ph));
      out[k] = Math.max(out[k], (night ? 0.95 : 0.85) * glint);
    }
    return out;
  };
}
