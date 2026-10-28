// A message in a bottle, for the newsletter. Afloat on the footer coast's sea,
// or (mode "ashore") washed up on the sand with the note half out of the neck.
// makeScene({ cols, rows, theme, mode }) -> frame(seconds) -> Float32Array coverage.
const { clamp, mix, smooth, hash, noise } = await import(
  new URL("../halftone-kit.js" + new URL(import.meta.url).search, import.meta.url)
    .href
);

export default function makeScene({ cols, rows, theme = "night", mode = "" }) {
  const night = theme === "night";
  const ashore = mode === "ashore";
  const A = cols / rows;
  const n = cols * rows;
  const out = new Float32Array(n);
  const horizon = ashore ? 0.26 : 0.42;
  const px = 1 / rows;

  // Bottle geometry in its own frame: u along the axis (base to cork), v across.
  const R = 0.085; // body radius
  const baseU = -0.3;
  const bodyEnd = 0.06;
  const neckStart = 0.17;
  const neckR = 0.027;
  const lipA = 0.27, lipB = 0.295;
  const halfWidth = (u) => {
    if (u < baseU || u > lipB) return 0;
    if (u < baseU + R) return R * Math.sqrt(Math.max(0, 1 - ((u - baseU - R) / R) ** 2));
    if (u < bodyEnd) return R;
    if (u < neckStart) return mix(R, neckR, smooth(bodyEnd, neckStart, u));
    if (u < lipA) return neckR;
    return neckR + 0.008;
  };

  // Where things sit. Afloat: centred on the water. Ashore: lying on the sand.
  const P = ashore
    ? { cx: A * 0.37, cy: 0.75, th: -0.2, sc: 1.0 }
    : { cx: A * 0.5, cy: horizon + 0.2, th: -0.3, sc: 1.25 };

  // Per-cell world coordinates and sea depth, computed once.
  const X = new Float32Array(n), Y = new Float32Array(n), D = new Float32Array(n);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      X[k] = ((i + 0.5) / cols) * A;
      Y[k] = (j + 0.5) / rows;
      D[k] = clamp((Y[k] - horizon) / (1 - horizon));
    }
  }

  // Static: sky, stars, and the sand's stipple.
  const sky = new Float32Array(n);
  const stars = new Float32Array(n);
  const sand = new Float32Array(n);
  const sandTop = 0.42; // where the shallowest wash ends
  for (let k = 0; k < n; k++) {
    const y = Y[k];
    if (y < horizon) {
      const h = y / horizon;
      sky[k] = night ? 0.1 * Math.pow(h, 1.4) : 0.12 * smooth(horizon - 0.2, horizon, y);
      if (night && h < 0.8 && hash(X[k] * 91.7, y * 77.3) > 0.985) stars[k] = 0.4 + 0.6 * hash(y * 31, X[k] * 17);
    }
    if (ashore && y > sandTop) {
      const depth = (y - sandTop) / (1 - sandTop);
      // A quiet sand tone with sparse grains; dense random stipple reads as noise.
      const speck = hash(X[k] * 213.1, y * 187.7);
      const grain = speck > 0.975 - 0.02 * depth;
      sand[k] = night ? (grain ? 0.2 : 0.035) : grain ? 0.4 : 0.08 + 0.05 * depth;
    }
  }

  // Sea phase: a log ramp so ripple lines crowd toward the horizon.
  const seaPhase = new Float32Array(n);
  for (let k = 0; k < n; k++) seaPhase[k] = 4.7 * Math.log(1 + 4 * D[k]);

  // Bottle shading at one point. Returns -1 outside the bottle.
  function bottle(x, y, cx, cy, th, t) {
    const c = Math.cos(th), s = Math.sin(th);
    const dx = x - cx, dy = y - cy;
    const u = ((dx * c + dy * s) / P.sc) + 0.02;
    const v = (-dx * s + dy * c) / P.sc;
    const w = halfWidth(u);
    const inGlass = w > 0 && Math.abs(v) < w;

    // Cork (afloat) sits in the lip, solid ink.
    if (!ashore && u >= lipA + 0.005 && u < 0.36 && Math.abs(v) < 0.029) {
      const shade = smooth(-0.9, 0.9, v / 0.027);
      return night ? mix(0.34, 0.08, shade) : mix(0.8, 0.98, shade);
    }

    // The scroll: inside the glass, and in ashore mode out through the open neck.
    const scrollEnd = ashore ? 0.52 : 0.07;
    const sr = u < neckStart ? 0.034 : u < lipB ? 0.021 : 0.046;
    if (u > -0.2 && u < scrollEnd && Math.abs(v) < sr && (inGlass || (ashore && u > lipA - 0.01))) {
      const edge = Math.abs(v) > sr - (u > lipB ? 0.012 : 0.0075);
      const capL = Math.hypot((u + 0.2) / 0.011, v / sr) < 1; // rolled end, near
      const capR = ashore && Math.hypot((u - scrollEnd) / 0.011, v / sr) < 1;
      if (night) {
        if (edge || capL || capR) return 0.75;
        return Math.abs(v) < 0.003 && Math.sin(u * 200) > 0 ? 0.62 : 0.48 + 0.1 * Math.sin(t * 1.2);
      }
      if (edge || capL || capR) return 0.92;
      // A line of writing along the roll.
      // Only inside the glass: past the neck the line breaks into noise.
      if (inGlass && Math.abs(v) < 0.004 && Math.sin(u * 190) > -0.2 && u < scrollEnd - 0.04) return 0.7;
      return 0.1;
    }
    if (!inGlass) return -1;

    const sNorm = v / w; // -1 on the lit (upper) side, +1 shaded
    const body = u < neckStart + 0.02 ? 1 : 0;
    if (night) {
      if (Math.abs(sNorm) > 0.74 || u < baseU + 0.015) return 0.85; // rim light
      if (sNorm < -0.3 && sNorm > -0.6 && u > -0.22 && u < 0.05) return 0.5; // sheen
      return 0.0;
    }
    if (Math.abs(sNorm) > (ashore ? 0.72 : 0.8) || u < baseU + 0.012) return ashore ? 0.95 : 0.88; // darker edge
    if (sNorm < -0.3 && sNorm > -0.6 && u > -0.22 && u < 0.05) return 0.0; // lit streak
    if (sNorm < -0.3 && sNorm > -0.6 && u > -0.27 && u < -0.24) return 0.0; // glint at the base
    // Ashore the glass is drawn pale so it stands off the wet sand.
    return ashore ? mix(0.16, 0.3, smooth(0, 1, sNorm)) : mix(0.5, 0.66, smooth(0, 1, sNorm));
  }

  return function frame(t) {
    // Swell: the bottle rises and falls with the wave and rolls on its slope.
    const phase = t * 1.1;
    const bob = ashore ? 0 : 0.013 * Math.sin(phase);
    const roll = ashore ? 0 : 0.11 * Math.cos(phase) + 0.03 * Math.sin(t * 0.43);
    const cy = P.cy + bob;
    const th = P.th + roll;
    const waterY = cy + 0.045; // where the glass meets the sea (afloat)

    // Wash: 0 at its lowest, 1 reaching the bottle (ashore).
    const wash = 0.5 - 0.5 * Math.cos(t * 0.85);
    const lap = 0.4 + 0.15 * (wash < 0.5 ? 2 * wash * wash : 1 - 2 * (1 - wash) * (1 - wash));
    const wetMax = 0.6;

    for (let k = 0; k < n; k++) {
      const x = X[k], y = Y[k], depth = D[k];
      let v;
      if (y < horizon) {
        v = sky[k];
        if (stars[k]) v = Math.max(v, stars[k] * (0.55 + 0.45 * Math.sin(t * 1.7 + k * 0.37)));
        if (night && ashore === false && y > horizon - 0.0001) v = 0;
      } else {
        // Sea: flat tone deepening toward the viewer, ripple lines drifting with the swell.
        v = night ? mix(0.0, 0.05, depth) : mix(0.06, 0.2, depth);
        const ph = seaPhase[k] - t * 0.45 + Math.sin(x * 5 + t * 0.5) * 0.35;
        const line = smooth(0.55, 0.92, Math.sin(ph * 6.2832));
        const dash = smooth(0.3, 0.55, noise(x * 4 + t * 0.25, Math.floor(ph) * 3.7));
        v = night ? Math.max(v, 0.34 * line * dash * (0.4 + depth)) : Math.max(v, 0.6 * line * dash * (0.5 + 0.5 * depth));
        // Glitter band under the bottle: light on dark by night, paper gaps by day.
        const spread = 0.05 + depth * 0.22;
        const path = Math.exp(-(((x - A * 0.82) / spread) ** 2));
        if (path > 0.05) {
          const glint = smooth(0.5, 0.7, noise(x * 16 + t * 0.4, y * 110 - t * 0.7));
          v = night ? Math.max(v, 0.6 * path * glint) : mix(v, 0.0, path * glint);
        }
        if (y - horizon < px * 0.9) v = night ? 0.2 : 0.55; // the horizon line
      }

      if (ashore) {
        const yf = lap + 0.012 * Math.sin(x * 13 + t * 0.9) + 0.01 * Math.sin(x * 29 - t * 0.6);
        if (y > horizon + 0.005) {
          const foamTop = yf - 0.05 - 0.02 * noise(x * 9 + t * 0.3, 3);
          if (y > yf) {
            // Beach: wet where the wash has been, dry stipple above the high water mark.
            const wet = y < wetMax + 0.02 * Math.sin(x * 9 + 1) + 0.012;
            if (wet) {
              const dryBand = smooth(wetMax - 0.1, wetMax, y);
              v = night ? 0.03 + 0.08 * (1 - dryBand) : mix(0.3, 0.12, dryBand);
              // Water draining back leaves a thin sheet and bubbles.
              v = Math.max(v, sand[k] * 0.9);
            } else {
              v = sand[k];
            }
          } else if (y > foamTop) {
            // Foam: paper by day, bright by night, lacy at its rear edge.
            const lace = (y - foamTop) / (yf - foamTop);
            // Coherent lace that drifts with the water, not per-frame static.
            const holes = noise(x * 34 - t * 0.4, y * 70) > 0.35 + 0.5 * lace;
            v = night ? (holes ? 0.5 * lace + 0.1 : 0.04) : holes ? 0.0 : 0.38;
            if (yf - y < px * 1.1 && noise(x * 8 - t * 0.2, 7) > 0.3) v = night ? 0.8 : 0.8; // leading edge, broken
          }
        }
      }

      out[k] = v;
    }

    // Wake and reflection under the bottle, with rings spreading from it.
    if (!ashore) {
      const wy = waterY + 0.035;
      for (let k = 0; k < n; k++) {
        const x = X[k], y = Y[k];
        if (y < wy - 0.04 || y > wy + 0.12) continue;
        const dx = x - P.cx, dy = y - wy;
        // Reflection: a dark smear of the glass, shortening with the bob.
        const refl = Math.hypot(dx / 0.3, dy / (0.03 + 0.004 * Math.sin(phase)));
        if (refl < 1) {
          const wob = smooth(0.35, 0.7, noise(x * 22, y * 140 - t * 0.8));
          const m = (1 - refl) * (1 - 0.6 * wob);
          out[k] = night ? Math.max(out[k], 0.16 * m) : Math.max(out[k], 0.45 * m);
        }
        // Rings: three paper-gap (or light) ellipses easing outward.
        for (let r = 0; r < 2; r++) {
          const age = (t * 0.14 + r / 2) % 1;
          const rx = 0.16 + age * 0.4;
          const ring = Math.abs(Math.hypot(dx / rx, dy / (rx * 0.1)) - 1);
          const fade = Math.sin(age * Math.PI);
          if (ring < 0.07 && y > waterY + 0.03 && noise(x * 9 + r * 4, 5) > 0.35) {
            const a = (1 - ring / 0.07) * fade;
            out[k] = night ? Math.max(out[k], 0.45 * a) : Math.max(out[k], 0.6 * a);
          }
        }
      }
    }

    // The bottle, drawn over everything. Ashore it also throws a shadow on the sand.
    const reach = 0.62;
    if (ashore) {
      const c = Math.cos(th), s = Math.sin(th);
      for (let k = 0; k < n; k++) {
        const dx = X[k] - P.cx - 0.03, dy = Y[k] - P.cy - 0.075;
        if (dx * dx + dy * dy > reach * reach) continue;
        const u = ((dx * c + dy * s) / P.sc) + 0.02, v = (-dx * s + dy * c) / P.sc;
        const w = halfWidth(u);
        if (w > 0 && Math.abs(v) < w * 0.9 && !night) out[k] = Math.max(out[k], 0.5);
      }
    }
    for (let k = 0; k < n; k++) {
      const dx = X[k] - P.cx, dy = Y[k] - cy;
      if (dx * dx + dy * dy > reach * reach) continue;
      const b = bottle(X[k], Y[k], P.cx, cy, th, t);
      if (b >= 0) out[k] = b;
    }

    // Ashore: the cork rolled a little way up the beach.
    if (ashore) {
      for (let k = 0; k < n; k++) {
        const d = Math.hypot((X[k] - A * 0.86) / 0.032, (Y[k] - 0.9) / 0.019);
        if (d < 1) out[k] = night ? 0.4 : 0.95;
      }
    }
    return out;
  };
}
