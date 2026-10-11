// A Souls-style bonfire: a coiled sword thrust into a mound of ash, flames
// licking up the blade, embers drifting off. Same contract as the coast:
// makeScene({ cols, rows, theme }) -> frame(seconds) -> Float32Array coverage.
const { clamp, mix, smooth, hash, noise, fbm, segment, stamp } = await import(
  new URL("../halftone-kit.js" + new URL(import.meta.url).search, import.meta.url)
    .href
);

export default function makeScene({ cols, rows, theme = "night" }) {
  const night = theme === "night";
  const A = cols / rows;
  const out = new Float32Array(cols * rows);
  const cx = A / 2;
  const ground = 0.8;

  // Blade leans slightly; buried point at the mound, hilt up top.
  const tipX = cx + 0.01, tipY = ground - 0.03;
  const guardX = cx - 0.035, guardY = 0.36;
  const bladeLen = Math.hypot(tipX - guardX, tipY - guardY);
  const ux = (guardX - tipX) / bladeLen, uy = (guardY - tipY) / bladeLen;
  const pommelX = guardX + ux * 0.11, pommelY = guardY + uy * 0.11;

  function sword(x, y) {
    // Blade, with the twisted coil as diagonal bands along it.
    const along = (x - tipX) * ux + (y - tipY) * uy;
    const across = (x - tipX) * -uy + (y - tipY) * ux;
    if (along > 0 && along < bladeLen) {
      const half = 0.016 + 0.006 * (along / bladeLen);
      if (Math.abs(across) < half) {
        const coil = Math.sin(along * 95 + (across / half) * 2.4) > 0.15;
        // A dark silhouette against the fire by night, pale steel by day.
        if (night) return coil ? 0.3 : 0.03;
        return coil ? 0.95 : 0.12;
      }
    }
    // Crossguard, grip, pommel.
    if (segment(x, y, guardX - uy * 0.065, guardY + ux * 0.065, guardX + uy * 0.065, guardY - ux * 0.065) < 0.012)
      return night ? 0.55 : 0.95;
    if (segment(x, y, guardX, guardY, pommelX, pommelY) < 0.009) return night ? 0.3 : 0.85;
    if (Math.hypot(x - pommelX, y - pommelY) < 0.018) return night ? 0.6 : 1;
    return -1;
  }

  // Static: the ash mound, stones, and the ground plane.
  const base = new Float32Array(cols * rows);
  const lightable = new Float32Array(cols * rows); // how much firelight a cell catches
  for (let j = 0; j < rows; j++) {
    const y = (j + 0.5) / rows;
    for (let i = 0; i < cols; i++) {
      const x = ((i + 0.5) / cols) * A;
      const k = j * cols + i;
      let v = 0;
      let catches = 0;
      const mound = Math.hypot((x - cx) / 0.27, (y - ground) / 0.075);
      if (y > ground - 0.02) {
        // Ground: a pool of shadow (day) or firelight (night) around the fire.
        const reach = Math.hypot((x - cx) / 0.5, (y - ground) / 0.16);
        v = night ? 0 : 0.22 * (1 - smooth(0.4, 1, reach));
        catches = 1 - smooth(0, 1, reach);
      }
      if (mound < 1 && y > ground - 0.08) {
        const ash = fbm(x * 40, y * 40, 3);
        v = night ? 0.05 : ash > 0.55 ? 0.35 : 0.62;
        catches = 1.2 - mound * 0.5;
        // Bones and skulls half-buried in the ash.
        if (hash(i, j) > 0.93 && mound > 0.35) v = night ? 0.2 : 0.06;
      }
      // A ring of stones along the front of the mound.
      for (let s = 0; s < 7; s++) {
        const a = Math.PI * (0.08 + (0.84 * s) / 6);
        const sx = cx + Math.cos(a) * 0.3;
        const sy = ground + Math.sin(a) * 0.06 + 0.02;
        const d = Math.hypot((x - sx) / 0.042, (y - sy) / 0.03);
        if (d < 1) {
          const top = y < sy - 0.008;
          v = night ? (top ? 0.12 : 0.02) : top ? 0.55 : 0.95;
          catches = top ? 1 : 0.2;
        }
      }
      base[k] = v;
      lightable[k] = catches;
    }
  }

  // Flame field: five tongues of different heights, each a teardrop that
  // sways and breaks up in rising noise.
  const tongues = [-2, -1, 0, 1, 2].map((k) => ({
    dx: k * 0.05 + (hash(k, 1) - 0.5) * 0.02,
    height: 0.5 - Math.abs(k) * 0.09 + 0.06 * hash(k, 2),
    phase: hash(k, 3) * 6.28,
  }));
  function flame(x, y, t) {
    let f = 0;
    for (const tg of tongues) {
      const height = tg.height * (0.82 + 0.18 * Math.sin(t * 3.3 + tg.phase));
      const h = (ground - y) / height;
      if (h < -0.08 || h > 1) continue;
      const sway = 0.03 * h * Math.sin(y * 16 - t * 4.4 + tg.phase);
      const width = 0.075 * Math.pow(clamp(1 - h), 0.7) * (h < 0 ? 1 + h * 6 : 1);
      const edge = 1 - Math.abs(x - cx - tg.dx - sway) / Math.max(0.001, width);
      if (edge > 0) f = Math.max(f, edge * (1.15 - h * 0.6));
    }
    if (f <= 0) return 0;
    const lick = fbm(x * 10, y * 8 + t * 2.6, 3);
    return clamp(f * 1.3 + (lick - 0.5) * 0.9);
  }

  return function frame(t) {
    const flicker = 0.85 + 0.15 * noise(t * 5, 0.5);
    for (let j = 0; j < rows; j++) {
      const y = (j + 0.5) / rows;
      for (let i = 0; i < cols; i++) {
        const x = ((i + 0.5) / cols) * A;
        const k = j * cols + i;
        let v = base[k];
        const dFire = Math.hypot((x - cx) * 1.1, y - (ground - 0.12));

        if (night) {
          // Warm air: a halo of light around the fire, and light on the ground.
          v += 0.2 * Math.exp(-dFire * 6) * flicker;
          v += lightable[k] * 0.42 * Math.exp(-dFire * 3.2) * flicker;
        }

        const f = flame(x, y, t);
        const s = sword(x, y);
        // The blade stands in front of the upper flames; fire wraps its base.
        if (s >= 0 && !(f > 0.5 && y > ground - 0.1)) v = s;
        else if (f > 0.05) {
          const core = smooth(0.55, 0.95, f);
          v = night
            ? Math.max(v, mix(0.5, 1, core) * smooth(0.05, 0.25, f))
            : mix(0.92, 0.2, core) * smooth(0.05, 0.2, f) + v * (1 - smooth(0.05, 0.2, f));
        }
        out[k] = clamp(v);
      }
    }

    // Embers: rise, drift, wink out.
    for (let e = 0; e < 22; e++) {
      const life = (t * (0.16 + 0.1 * hash(e, 1)) + hash(e, 2)) % 1;
      const x = cx + (hash(e, 3) - 0.5) * 0.2 + Math.sin(t * 1.4 + e) * 0.04 * life + life * 0.06;
      const y = ground - 0.2 - life * 0.62;
      const glow = (1 - life) * (0.6 + 0.4 * Math.sin(t * 9 + e * 3));
      if (glow > 0.15)
        stamp(out, cols, rows, Math.floor((x / A) * cols), Math.floor(y * rows), night ? glow : -0.85);
    }
    return out;
  };
}
