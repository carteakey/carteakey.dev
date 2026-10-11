// Lighthouse coast for the footer, drawn as a halftone like the hero portrait.
// The scene is sampled once per dot at the display grid, so nothing is
// resampled or stretched. Pure module: the browser animates it and the build
// renders a still SVG from it.
//
// makeScene({ cols, rows, theme, season, mode }) -> frame(seconds) -> Float32Array
// season: winter | spring | summer | autumn. mode "search" keeps the beam on
// in daylight too (the 404 page).
// "day" coverage is ink on paper; "night" coverage is light on a dark ground.
// Composition is in world units: height 1, width = cols / rows.

// Helpers load with this module's release query so cache busting reaches them.
const { clamp, mix, smooth, hash, noise, fbm, segment, stamp } = await import(
  new URL("./halftone-kit.js" + new URL(import.meta.url).search, import.meta.url)
    .href
);

// Sharp-crested ranges read better than rounded hills at this dot size.
function ridged(x, octaves = 5) {
  let sum = 0, amp = 0.5, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * (1 - Math.abs(2 * noise(x, i * 7.3) - 1));
    norm += amp;
    x *= 2.1;
    amp *= 0.48;
  }
  return sum / norm;
}

// One palette of tones per theme. Day is ink, night is light.
// Both keep the hero's logic: big quiet fields, a few strong planes.
const TONES = {
  day: {
    skyTop: 0.0, skyLow: 0.08, cloud: 0.17,
    far: 0.3, near: 0.56, haze: 0.18, land: 0.9, strata: 0.6, rim: 1,
    waterFar: 0.05, waterNear: 0.24, reflect: 0.62, glint: 1,
    towerLit: 0.2, towerShade: 0.5, band: 0.92, bandShade: 1,
    lantern: 1, cap: 1, wall: 0.2, wallShade: 0.45, roof: 0.95, window: 1,
    tree: 1, orb: 1, star: 0, hull: 0.95, sail: 0.04, mast: 0.9,
  },
  night: {
    skyTop: 0.02, skyLow: 0.17, cloud: 0.1, cloudOrb: 0.42,
    far: 0.06, near: 0.02, haze: 0.08, land: 0, strata: 0, rim: 0.32,
    waterFar: 0.12, waterNear: 0.02, reflect: 0.0, glint: 0.95,
    towerLit: 0.7, towerShade: 0.38, band: 0.16, bandShade: 0.08,
    lantern: 1, cap: 0.05, wall: 0.3, wallShade: 0.12, roof: 0.04, window: 1,
    tree: 0, orb: 1, star: 1, hull: 0.02, sail: 0.2, mast: 0.14,
  },
};

const SKY = 0, FAR = 1, NEAR = 2, WATER = 3, LAND = 4, TREE = 5, BUILT = 6;

export default function makeScene({
  cols,
  rows,
  theme = "night",
  season = "autumn",
  mode = "footer",
}) {
  const T = TONES[theme] || TONES.night;
  const night = theme === "night";
  const search = mode === "search";
  const winter = season === "winter";
  const snow = night ? 0.42 : 0.14; // pale ink by day (paper vanishes on paper), moonlit by night
  const A = cols / rows;
  const n = cols * rows;
  const out = new Float32Array(n);
  const horizon = 0.62;
  const shore = 0.82; // where the headland meets the water

  // Landmarks by fraction of the width, so a phone keeps both the lighthouse
  // and the moon in frame; landforms use world units so they never stretch.
  const capeX = Math.min(1.4, A * 0.32);
  const plateau = 0.5;
  const towerX = capeX * 0.4;
  const orbX = A * 0.66;
  const orbY = night ? 0.24 : 0.3;
  const orbR = night ? 0.09 : 0.1;
  const treeStart = A - Math.min(0.5, A * 0.12);

  const colX = (i) => ((i + 0.5) / cols) * A;
  const rowY = (j) => (j + 0.5) / rows;

  const far = new Float32Array(cols);
  const near = new Float32Array(cols);
  const cape = new Float32Array(cols);
  const trees = new Float32Array(cols);
  for (let i = 0; i < cols; i++) {
    const x = colX(i);
    far[i] = horizon - 0.03 - 0.19 * Math.pow(ridged(x * 0.8 + 2.7), 2.6);
    near[i] = horizon - 0.006 - 0.06 * Math.pow(fbm(x * 1.6 + 6.1, 2.4, 4), 2) * 2;
    // Headland: a plateau that breaks into a cliff down to the water.
    const edge = smooth(capeX - 0.42, capeX, x);
    const top = plateau - 0.07 * smooth(capeX - 0.2, 0, x) - 0.025 * fbm(x * 3, 1.1, 3);
    cape[i] =
      x > capeX
        ? 2
        : mix(top, shore, Math.pow(edge, 1.6)) + 0.012 * (fbm(x * 18, 3.3, 2) - 0.5);
    // Ground under the pines.
    trees[i] = x > treeStart - 0.4 ? 0.93 + 0.04 * fbm(x * 5, 2) : 2;
  }

  // Foreground pines: tiered conifers running off the right edge.
  const pines = [0, 1, 2, 3].map((k) => ({
    x: A + 0.03 - k * 0.15 - 0.05 * hash(k, 3),
    top: [0.04, 0.2, 0.12, 0.36][k],
    spread: 0.085 + 0.025 * hash(k, 5),
  }));
  function pine(x, y) {
    for (const p of pines) {
      if (y < p.top) continue;
      const f = (y - p.top) / (1 - p.top);
      const tier = (f * 6) % 1; // each tier flares out at its bottom edge
      const half = 0.006 + p.spread * Math.min(1, f * 1.35) * (0.45 + 0.55 * tier);
      const jag = 0.006 * Math.sin(y * 260 + p.x * 40);
      const dx = Math.abs(x - p.x);
      if (dx < half + jag) {
        // Winter: snow rests on the upper face of each tier's flare.
        if (winter && tier > 0.55 && tier < 0.8 && dx > half * 0.3) return 2;
        return 1;
      }
    }
    return 0;
  }

  // A deciduous tree beside the lighthouse carries the season.
  const oakX = towerX - 0.2;
  const hasOak = oakX > 0.08;
  const oakGround = hasOak ? cape[clamp(Math.floor((oakX / A) * cols), 0, cols - 1)] + 0.01 : 0;
  const crownY = oakGround - 0.2;
  const limbs = [];
  if (hasOak) {
    const grow = (x, y, angle, len, depth) => {
      const x2 = x + Math.sin(angle) * len;
      const y2 = y - Math.cos(angle) * len;
      limbs.push([x, y, x2, y2, 0.0045 + depth * 0.0035]);
      if (depth === 0) return;
      grow(x2, y2, angle - 0.5 - 0.2 * hash(x2, depth), len * 0.68, depth - 1);
      grow(x2, y2, angle + 0.45 + 0.2 * hash(y2, depth), len * 0.7, depth - 1);
    };
    grow(oakX, oakGround, 0.04, 0.11, 3);
  }
  const blobs = [
    [0, 0, 0.095],
    [-0.08, 0.035, 0.07],
    [0.08, 0.03, 0.072],
    [-0.035, -0.065, 0.065],
    [0.045, -0.06, 0.062],
  ];
  function oak(x, y) {
    if (!hasOak || Math.abs(x - oakX) > 0.2 || y < crownY - 0.15 || y > oakGround) return -1;
    let crown = 0;
    for (const [bx, by, r] of blobs) {
      const d = Math.hypot(x - oakX - bx, (y - crownY - by) * 1.1) / r;
      crown = Math.max(crown, 1 - d);
    }
    const leaf = fbm(x * 40, y * 40, 3);
    if (crown > 0 && season !== "winter") {
      if (season === "summer") return night ? 0 : leaf > 0.62 ? 0.62 : 0.88;
      if (season === "spring") {
        // Blossom: pale clusters with paper between them.
        if (leaf > 0.38) return night ? 0.28 + 0.3 * leaf : 0.2 + 0.6 * (leaf - 0.38);
      }
      if (season === "autumn" && leaf > 0.5 - crown * 0.15) return night ? 0.03 : 0.72;
    }
    for (const [ax, ay, bx, by, w] of limbs) {
      if (segment(x, y, ax, ay, bx, by) < w) {
        if (winter && y < Math.min(ay, by) + 0.006 && Math.abs(ay - by) < Math.abs(ax - bx) * 2) return snow;
        return night ? 0.0 : 0.92;
      }
    }
    return -1;
  }

  // Lighthouse and cottage, in world units on top of the plateau.
  const groundAt = (x) => cape[clamp(Math.floor((x / A) * cols), 0, cols - 1)];
  const towerBase = groundAt(towerX) + 0.01;
  const towerH = 0.29;
  const towerTop = towerBase - towerH;
  const lanternTop = towerTop - 0.05;
  const lampY = (towerTop + lanternTop) / 2;
  const houseX0 = towerX + 0.08;
  const houseX1 = towerX + 0.27;
  const houseBase = groundAt((houseX0 + houseX1) / 2) + 0.01;
  const wallTop = houseBase - 0.075;

  function built(x, y) {
    const dx = x - towerX;
    // Tapered tower, three bands, lit from the moon's side (the right).
    if (y < towerBase && y > towerTop) {
      const f = (towerBase - y) / towerH;
      const half = mix(0.036, 0.025, f);
      if (Math.abs(dx) < half) {
        const band = Math.floor(f * 6) % 2 === 1;
        const lit = smooth(-0.8, 0.9, dx / half);
        return band ? mix(T.bandShade, T.band, lit) : mix(T.towerShade, T.towerLit, lit);
      }
    }
    if (Math.abs(y - towerTop) < 0.012 && Math.abs(dx) < 0.04) return night ? 0.08 : 1; // gallery
    if (y <= towerTop && y > lanternTop && Math.abs(dx) < 0.02) {
      // Lantern glass with two mullions.
      if (!night && Math.abs(Math.abs(dx) - 0.008) < 0.003) return 0.15;
      return T.lantern;
    }
    if (y <= lanternTop && y > lanternTop - 0.04 && Math.abs(dx) < 0.026 * (1 - (lanternTop - y) / 0.04) + 0.003)
      return T.cap;
    // Cottage: whitewashed wall, dark pitched roof, one lit window, a chimney.
    if (x > houseX0 && x < houseX1) {
      const mid = (houseX0 + houseX1) / 2;
      const roofTop = wallTop - 0.07 + (Math.abs(x - mid) / (houseX1 - houseX0)) * 0.14;
      if (y >= wallTop && y < houseBase) {
        if (Math.abs(x - (houseX0 + 0.05)) < 0.017 && y > wallTop + 0.018 && y < wallTop + 0.05) return T.window;
        if (Math.abs(x - (houseX1 - 0.045)) < 0.014 && y > wallTop + 0.025) return night ? 0.02 : 0.9;
        return x > mid ? T.wall : T.wallShade;
      }
      if (y > roofTop - 0.012 && y < wallTop) return winter && y < roofTop + 0.012 ? snow : T.roof;
    }
    if (x > houseX1 - 0.06 && x < houseX1 - 0.04 && y > wallTop - 0.09 && y < wallTop - 0.03) return T.roof; // chimney
    return -1;
  }

  // Static tones and a per-cell layer, computed once per size.
  const base = new Float32Array(n);
  const layer = new Uint8Array(n);
  const stars = new Float32Array(n);
  for (let j = 0; j < rows; j++) {
    const y = rowY(j);
    for (let i = 0; i < cols; i++) {
      const x = colX(i);
      const k = j * cols + i;
      let v, L;
      if (y < horizon) {
        const h = y / horizon;
        v = night
          ? mix(T.skyTop, T.skyLow, Math.pow(h, 1.25))
          : T.skyLow * smooth(horizon - 0.2, horizon, y); // bare paper, haze low
        L = SKY;
        const d = Math.hypot(x - orbX, y - orbY);
        if (night) {
          v += 0.2 * Math.exp(-Math.max(0, d - orbR) * 11);
          if (h < 0.8 && hash(i * 0.71, j * 1.37) > 0.99) stars[k] = 0.35 + 0.65 * hash(j, i);
        } else {
          // Ink radiates from the sun and fades to bare paper.
          v += 0.32 * Math.exp(-Math.max(0, d - orbR) * 22);
        }
        if (d < orbR) {
          // The orb is the one solid shape in the sky; the moon gets maria.
          v = T.orb;
          if (night && fbm(x * 22 + 3, y * 22, 3) < 0.4) v = 0.72;
        }
        if (y > far[i]) {
          // Atmospheric haze lightens each range toward its foot.
          v = mix(T.far, T.haze, smooth(far[i], horizon, y) * 0.6);
          if (night && y - far[i] < 1.5 / rows && x > orbX - 1.2) v = 0.24; // moonlit crest
          if (winter && far[i] < horizon - 0.08 && y - far[i] < 0.03 + 0.02 * noise(x * 30, 1))
            v = night ? 0.2 : 0.05; // snowcaps
          L = FAR;
        }
        if (y > near[i]) {
          v = T.near;
          L = NEAR;
        }
      } else {
        const depth = (y - horizon) / (1 - horizon);
        v = mix(T.waterFar, T.waterNear, Math.pow(depth, 0.9));
        L = WATER;
      }
      if (y > cape[i] && y < shore + 0.004) {
        // Cliff face: strata lines and a hard rim on top.
        const fromTop = y - cape[i];
        v = T.land;
        if (fromTop < 1.2 / rows) v = T.rim;
        else if (winter && fromTop < 0.04 + 0.015 * noise(x * 25, 2)) v = snow;
        else {
          // Weathered rock: lighter facets where the slope faces the light.
          // Tilted sedimentary bands, broken up so they never read as ruled lines.
          const bed = Math.sin((y - x * 0.07 + 0.02 * fbm(x * 4, y * 4)) * 95);
          if (fromTop > 0.035 && bed > 0.86 && fbm(x * 7, y * 3, 2) > 0.42) v = T.strata;
          if (!night && fromTop > 0.012 && fromTop < 0.035 && hash(i, j) > 0.55) v = 0.7; // grass
        }
        L = LAND;
      }
      const needles = x > treeStart - 0.6 ? pine(x, y) : 0;
      if (y > trees[i] || needles) {
        v = needles === 2 ? snow : T.tree;
        L = TREE;
      }
      const o = oak(x, y);
      if (o >= 0) {
        v = o;
        L = TREE;
      }
      const b = built(x, y);
      if (b >= 0) {
        v = b;
        L = BUILT;
      }
      base[k] = v;
      layer[k] = L;
    }
  }

  function cloud(x, y, shift) {
    // Long stratus bands, the way clouds sit in a wide coastal sky.
    const band = smooth(0.07, 0.13, y) * (1 - smooth(0.22, 0.3, y));
    if (band <= 0) return 0;
    const v = fbm((x + shift) * 0.7, y * 18, 5) * 0.7 + fbm((x + shift) * 2.5, y * 5, 2) * 0.3;
    return smooth(0.64, 0.72, v) * band;
  }

  // Clouds drift a fifth of a dot per quarter second, so the costly fbm
  // field refreshes at 4 Hz instead of every frame.
  const clouds = new Float32Array(n);
  let cloudTick = -1;
  function refreshClouds(t) {
    const tick = Math.floor(t * 4);
    if (tick === cloudTick) return;
    cloudTick = tick;
    const shift = (tick / 4) * 0.01;
    for (let j = 0; j < rows; j++) {
      const y = rowY(j);
      if (y > 0.3) break; // below the cloud band
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        clouds[k] = layer[k] === SKY ? cloud(colX(i), y, shift) : 0;
      }
    }
  }

  return function frame(t) {
    refreshClouds(t);
    const beamPhase = (t * Math.PI * 2) / (search ? 14 : 10); // one turn per 10 s
    const sweep = Math.cos(beamPhase); // sideways reach, signed
    const facing = Math.sin(beamPhase); // > 0: turned toward the viewer
    // On the 404 page the boat is you: adrift just past the beam's reach.
    const boatX = search
      ? A * 0.6 + Math.sin(t * 0.06) * A * 0.08
      : mix(-0.1, A + 0.1, (t * 0.0045 + 0.48) % 1);
    const beamOn = night || search;
    const beamInk = night ? 0.55 : 0.32;
    const meteor = (t % 23) / 1.1; // a brief shooting star now and then

    for (let j = 0; j < rows; j++) {
      const y = rowY(j);
      for (let i = 0; i < cols; i++) {
        const x = colX(i);
        const k = j * cols + i;
        const L = layer[k];
        let v = base[k];

        if (L === SKY) {
          const c = clouds[k];
          if (c > 0) {
            const orbD = Math.hypot(x - orbX, y - orbY);
            const inOrb = orbD < orbR;
            const nearOrb = Math.exp(-Math.abs(x - orbX) * 1.6);
            const tone = inOrb
              ? night ? 0.35 : 0.0
              : night ? mix(T.cloud, T.cloudOrb, nearOrb) : T.cloud;
            // By day the sun burns through; by night clouds veil the moon.
            v = mix(v, tone, night ? c : c * smooth(orbR, orbR + 0.08, orbD));
          }
          if (stars[k]) v = Math.max(v, stars[k] * (0.6 + 0.4 * Math.sin(t * 1.7 + k * 0.37)));
          if (night && meteor < 1) {
            const mx = orbX - 0.5 + meteor * 0.9;
            const my = 0.08 + meteor * 0.18;
            const along = (mx - x) * 0.9 + (my - y) * 0.2;
            const off = Math.abs((y - my) - (x - mx) * 0.2);
            if (along > 0 && along < 0.22 && off < 0.008) v = Math.max(v, 1 - along / 0.22);
          }
        }

        if (L === WATER) {
          const depth = (y - horizon) / (1 - horizon);
          const wob = 0.014 * Math.sin(y * 210 + t * 1.2) * (0.4 + depth);
          // Horizontal ripple lines: open paper gaps that drift with the swell.
          const lines = Math.sin(y * (300 - depth * 140) + Math.sin(x * 7 + t * 0.5) * 2 - t * 1.4);
          const ci = clamp(Math.floor(((x + wob) / A) * cols), 0, cols - 1);
          // Reflections of the far ranges and of the cliff below the shore.
          const up = 2 * horizon - y;
          if (up > near[ci] && up < horizon) v = mix(v, T.near * 0.8, 0.55);
          else if (up > far[ci] && up < horizon) v = mix(v, T.far * 0.8, 0.45);
          if (y > shore && 2 * shore - y > cape[ci]) v = mix(v, night ? 0.0 : T.reflect, 0.85);
          if (lines > 0.55) v *= night ? 0.35 : 0.45;
          // Glitter path under the orb: ink dashes by day, light by night.
          const spread = 0.04 + depth * 0.32;
          const path = Math.exp(-Math.pow((x + wob - orbX) / spread, 2));
          if (path > 0.04) {
            const dash = noise(x * 14 + t * 0.35, y * 120 - t * 0.6);
            v = mix(v, T.glint, path * smooth(0.45, 0.7, dash));
          }
          // The beam skims the bay when it swings toward the viewer.
          if (beamOn && facing > 0 && y < shore) {
            const bx = towerX + sweep * depth * 2.4;
            const glow = facing * Math.exp(-Math.pow((x - bx) / (0.04 + depth * 0.25), 2));
            v = Math.max(v, glow * 0.55 * smooth(0.2, 0.7, noise(x * 10, y * 90 - t)));
          }
        }

        // The beam: a widening cone from the lamp, sweeping over the sky.
        if (beamOn && (L === SKY || L === FAR || L === NEAR)) {
          const dx = x - towerX;
          const dy = y - lampY;
          const reach = Math.abs(sweep) * A * 0.55;
          if (dx * sweep > 0 && Math.abs(dx) < reach) {
            const along = Math.abs(dx);
            const width = 0.01 + along * 0.075;
            const off = Math.abs(dy + along * 0.04);
            if (off < width * 2.5) {
              const fall = Math.pow(1 - along / reach, 1.2) * Math.exp(-Math.pow(off / width, 2));
              v = clamp(v + beamInk * fall * (0.85 + 0.15 * Math.sin(along * 40 - t * 3)));
            }
          }
        }
        if (beamOn) {
          // Lamp flare as it turns to face the viewer.
          const d = Math.hypot(x - towerX, (y - lampY) * 1.3);
          if (d < 0.14 && facing > 0) v = Math.max(v, Math.pow(facing, 8) * Math.pow(1 - d / 0.14, 1.5));
        }

        // A sailboat crossing far out, slow enough to feel still.
        if (L === WATER || L === NEAR || L === FAR || L === SKY) {
          const bx = x - boatX;
          const by = horizon + 0.075;
          if (Math.abs(bx) < 0.07) {
            if (y > by && y < by + 0.022 && Math.abs(bx) < 0.055 - (y - by) * 1.4) v = T.hull;
            else if (Math.abs(bx + 0.003) < 0.0035 && y < by && y > by - 0.15) v = T.mast;
            else if (bx > 0.004 && y < by - 0.01 && y > by - 0.14 && bx < (y - (by - 0.14)) * 0.38) v = T.sail;
            else if (bx < -0.004 && y < by - 0.01 && y > by - 0.1 && -bx < (y - (by - 0.1)) * 0.3) v = T.sail;
            else if (night && Math.hypot(bx, (y - (by - 0.155)) * 1.2) < 0.009) v = 1;
          }
        }

        // Day: gulls gliding in long, slow arcs.
        if (!night && !winter && L === SKY) {
          for (let g = 0; g < 3; g++) {
            const gx = mix(-0.1, A + 0.1, (t * (0.012 + g * 0.004) + 0.15 + g * 0.31) % 1);
            const gy = 0.14 + g * 0.07 + 0.02 * Math.sin(t * 0.6 + g * 2);
            const dx = Math.abs(x - gx);
            const span = 0.05 - g * 0.008;
            if (dx < span) {
              const flap = 0.35 + 0.3 * Math.sin(t * 2.4 + g * 1.7);
              const wing = gy - dx * flap * (1 - dx / span) * 2.2;
              if (Math.abs(y - wing) < 0.009) v = 0.95;
            }
          }
        }

        out[k] = clamp(v);
      }
    }
    weather(t);
    return out;
  };

  // Seasonal particles are stamped over the finished frame.
  function weather(t) {
    const put = (x, y, value) =>
      stamp(out, cols, rows, Math.floor((x / A) * cols), Math.floor(y * rows), value);
    const wrap = (v, m) => ((v % m) + m) % m;
    if (winter) {
      for (let f = 0; f < Math.round(A * 40); f++) {
        const h = hash(f, 1.7);
        const speed = 0.035 + 0.05 * hash(f, 3.1);
        const x = wrap(hash(f, 9.2) * A + t * 0.015 + Math.sin(t * 0.8 + f) * 0.015, A);
        const y = wrap(hash(f, 4.4) + t * speed, 1);
        put(x, y, night ? 0.85 : -0.7);
        if (h > 0.86) put(x + 1 / rows, y, night ? 0.6 : -0.6); // nearer, bigger flakes
      }
    } else if (season === "spring" && hasOak) {
      for (let f = 0; f < 36; f++) {
        const life = wrap(t * (0.035 + 0.02 * hash(f, 2)) + hash(f, 5), 1);
        const x = oakX + (hash(f, 7) - 0.5) * 0.14 + life * A * 0.55;
        const y = crownY + (hash(f, 8) - 0.3) * 0.08 + life * 0.5 + Math.sin(t * 2 + f) * 0.02;
        if (x < A) put(x, y, night ? 0.55 : -0.5);
      }
    } else if (season === "autumn" && hasOak) {
      for (let f = 0; f < 28; f++) {
        const life = wrap(t * (0.03 + 0.02 * hash(f, 2)) + hash(f, 5), 1);
        const x = oakX + (hash(f, 7) - 0.5) * 0.14 + life * A * 0.4;
        const y = crownY + (hash(f, 8) - 0.3) * 0.08 + life * 0.55 + Math.sin(t * 1.4 + f) * 0.03;
        if (x > A) continue;
        // Tumbling: a leaf turns edge-on, then broadside.
        put(x, y, night ? 0.4 : -0.85);
        if (Math.sin(t * 3.5 + f * 1.3) > 0) put(x + 1 / rows, y, night ? 0.35 : -0.8);
      }
    } else if (season === "summer" && night) {
      for (let f = 0; f < 26; f++) {
        const h = hash(f, 3.3);
        const homeX = h < 0.6 ? hash(f, 1) * capeX : treeStart - 0.4 + hash(f, 1) * 0.5;
        const x = homeX + Math.sin(t * 0.3 * (1 + h) + f) * 0.05;
        const y = plateau - 0.06 + hash(f, 2) * 0.24 + Math.sin(t * 0.45 + f * 2) * 0.03;
        const blink = Math.pow(Math.max(0, Math.sin(t * (0.9 + h) + f * 7)), 3);
        if (blink < 0.05) continue;
        const ci = Math.floor((x / A) * cols);
        const cj = Math.floor(y * rows);
        stamp(out, cols, rows, ci, cj, blink);
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
          stamp(out, cols, rows, ci + di, cj + dj, 0.4 * blink);
      }
    }
  }
}
