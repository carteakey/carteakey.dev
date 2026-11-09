#!/usr/bin/env node
// Spec JSON -> Excalidraw elements JSON (stdout). Geometry is computed from the data.
// Bar chart:  { title, unit, max, step, bars: [{ label, value, text, range?, accent? }] }
// Line chart: { title, unit, minY, maxY, step, points: [{ val, lbl, sub?, highlight? }] }
//             (same points shape as the {% progression_chart %} shortcode)
// Panels:     { title, labels: [{ lbl, sub? }], panels: [{ name, maxY, step, values, accent?, highlight?, partialLast? }] }
//             (stacked lines on one shared x axis, for series on different scales)
import fs from "node:fs";
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const AX = spec.ax ?? 400,
  ROW = spec.row ?? 70,
  BAR_H = spec.barH ?? 44,
  TOP = spec.top ?? 70,
  SCALE = spec.scale ?? 6;
const INK = "#1e1e1e",
  ACCENT = "#1971c2",
  FILL = "#d0ebff";
const els = [];
if (spec.panels) {
  // Stacked line panels sharing one x axis (small multiples), for series whose
  // scales differ too much for one axis, e.g. commits vs PRs per month.
  // { title, width, labels: [{ lbl, sub? }], panels: [{ name, maxY, step, values,
  //   accent?, highlight?: [index], partialLast? }] }
  // partialLast draws the final segment dashed and its marker hollow: a month
  // still in progress must not read as a collapse.
  const W = spec.width ?? 1000,
    PH = spec.panelHeight ?? 210,
    GAP = spec.gap ?? 96,
    X0 = 70,
    n = spec.labels.length;
  const px = (i) => X0 + 40 + (i * (W - 80)) / (n - 1);
  const cw = (str, size) => String(str).length * size * 0.5;
  const text = (x, y, t, fontSize, strokeColor) =>
    els.push({ type: "text", x, y, text: String(t), fontSize, strokeColor });
  const hline = (x, y, w, extra = {}) =>
    els.push({
      type: "line",
      x,
      y,
      points: [
        [0, 0],
        [w, 0],
      ],
      strokeColor: INK,
      strokeWidth: 2,
      ...extra,
    });
  let top = 0;
  if (spec.title) {
    text(0, 0, spec.title, 26, INK);
    top = 60;
  }
  spec.panels.forEach((panel, pi) => {
    const colour = panel.accent ? ACCENT : INK;
    const hi = panel.maxY,
      step = panel.step;
    const Y0 = top + 40;
    const py = (v) => Y0 + PH - (v / hi) * PH;
    text(X0, top, panel.name, 22, colour);
    els.push({
      type: "line",
      x: X0,
      y: Y0 - 10,
      points: [
        [0, 0],
        [0, PH + 10],
      ],
      strokeColor: INK,
      strokeWidth: 2,
    });
    hline(X0, Y0 + PH, W);
    for (let v = 0; v <= hi; v += step) {
      text(X0 - 14 - 10 * String(v).length, py(v) - 10, v, 18, "#495057");
      if (v > 0)
        hline(X0, py(v), W, {
          strokeColor: "#ced4da",
          strokeStyle: "dashed",
          strokeWidth: 1,
        });
    }
    const vals = panel.values;
    const last = vals.length - 1;
    const solidEnd = panel.partialLast ? last - 1 : last;
    els.push({
      type: "line",
      x: px(0),
      y: py(vals[0]),
      points: vals
        .slice(0, solidEnd + 1)
        .map((v, i) => [px(i) - px(0), py(v) - py(vals[0])]),
      strokeColor: colour,
      strokeWidth: 4,
    });
    if (panel.partialLast)
      els.push({
        type: "line",
        x: px(last - 1),
        y: py(vals[last - 1]),
        points: [
          [0, 0],
          [px(last) - px(last - 1), py(vals[last]) - py(vals[last - 1])],
        ],
        strokeColor: colour,
        strokeWidth: 3,
        strokeStyle: "dashed",
      });
    const peak = new Set(panel.highlight ?? []);
    vals.forEach((v, i) => {
      const x = px(i),
        y = py(v),
        isPeak = peak.has(i),
        partial = panel.partialLast && i === last,
        r = isPeak ? 10 : 7;
      els.push({
        type: "ellipse",
        x: x - r,
        y: y - r,
        width: 2 * r,
        height: 2 * r,
        strokeColor: colour,
        strokeWidth: 2,
        strokeStyle: partial ? "dashed" : "solid",
        backgroundColor: isPeak ? colour : "#ffffff",
        fillStyle: "solid",
        roughness: 1,
      });
      const size = isPeak ? 22 : 18;
      text(
        x - cw(v, size) / 2,
        y - r - size - 8,
        v,
        size,
        isPeak ? colour : INK,
      );
    });
    top = Y0 + PH + (pi === spec.panels.length - 1 ? 14 : GAP - 40);
  });
  spec.labels.forEach((l, i) => {
    const x = px(i);
    text(x - cw(l.lbl, 20) / 2, top, l.lbl, 20, INK);
    if (l.sub) text(x - cw(l.sub, 16) / 2, top + 28, l.sub, 16, "#495057");
  });
  process.stdout.write(JSON.stringify(els, null, 1));
  process.exit(0);
}
if (spec.points) {
  // Sizes are in canvas px and the image is shown at roughly 55-65% of that, so
  // text is deliberately large (labels 24, subs 18) to stay legible in a card.
  const W = spec.width ?? 1000,
    H = 340,
    X0 = 70,
    n = spec.points.length;
  const Y0 = spec.title ? 70 : 50;
  const lo = spec.minY ?? 0,
    hi = spec.maxY,
    step = spec.step ?? 20;
  const px = (i) => X0 + 50 + (i * (W - 100)) / (n - 1);
  const py = (v) => Y0 + H - ((v - lo) / (hi - lo)) * H;
  const maxLines = Math.max(
    ...spec.points.map((p) => String(p.lbl).split("\n").length),
  );
  const cw = (str, size) =>
    Math.max(
      ...String(str)
        .split("\n")
        .map((l) => l.length),
    ) *
    size *
    0.5;
  const centered = (cx, y, text, fontSize, strokeColor) =>
    els.push({
      type: "text",
      x: cx - cw(text, fontSize) / 2,
      y,
      text,
      fontSize,
      strokeColor,
      textAlign: "center",
    });
  if (spec.title)
    els.push({
      type: "text",
      x: 0,
      y: 0,
      text: spec.title,
      fontSize: 26,
      strokeColor: INK,
    });
  els.push({
    type: "line",
    x: X0,
    y: Y0 - 10,
    points: [
      [0, 0],
      [0, H + 10],
    ],
    strokeColor: INK,
    strokeWidth: 2,
  });
  els.push({
    type: "line",
    x: X0,
    y: Y0 + H,
    points: [
      [0, 0],
      [W, 0],
    ],
    strokeColor: INK,
    strokeWidth: 2,
  });
  for (let v = lo; v <= hi; v += step) {
    els.push({
      type: "text",
      x: X0 - 16 - 11 * String(v).length,
      y: py(v) - 11,
      text: String(v),
      fontSize: 20,
      strokeColor: INK,
    });
    if (v > lo)
      els.push({
        type: "line",
        x: X0,
        y: py(v),
        points: [
          [0, 0],
          [W, 0],
        ],
        strokeColor: "#ced4da",
        strokeStyle: "dashed",
        strokeWidth: 1,
      });
  }
  els.push({
    type: "text",
    x: X0 - 60,
    y: Y0 - 44,
    text: spec.unit,
    fontSize: 22,
    strokeColor: INK,
  });
  els.push({
    type: "line",
    x: px(0),
    y: py(spec.points[0].val),
    points: spec.points.map((p, i) => [
      px(i) - px(0),
      py(p.val) - py(spec.points[0].val),
    ]),
    strokeColor: ACCENT,
    strokeWidth: 4,
  });
  spec.points.forEach((p, i) => {
    const x = px(i),
      y = py(p.val),
      r = p.highlight ? 13 : 10;
    els.push({
      type: "ellipse",
      x: x - r,
      y: y - r,
      width: 2 * r,
      height: 2 * r,
      strokeColor: ACCENT,
      strokeWidth: 3,
      backgroundColor: p.highlight ? ACCENT : "#ffffff",
      fillStyle: "solid",
      roughness: 1,
    });
    const next = spec.points[i + 1];
    const steep = next && (next.val - p.val) / (hi - lo) > 0.2; // keep the label clear of a steep outgoing line
    const vt = String(p.val);
    els.push({
      type: "text",
      x: x - cw(vt, 26) / 2 - (steep ? 34 : 0),
      y: y - r - 38,
      text: vt,
      fontSize: 26,
      strokeColor: p.highlight ? ACCENT : INK,
    });
    const lines = String(p.lbl).split("\n").length;
    centered(x, Y0 + H + 16 + (maxLines - lines) * 15, p.lbl, 24, INK); // single-line labels sit mid-block so sub-labels share a baseline
    if (p.sub)
      centered(x, Y0 + H + 16 + maxLines * 30 + 6, p.sub, 18, "#495057");
  });
  process.stdout.write(JSON.stringify(els, null, 1));
  process.exit(0);
}
const n = spec.bars.length;
const axisH = n * ROW;
els.push({
  type: "text",
  x: 0,
  y: 0,
  text: spec.title,
  fontSize: 24,
  strokeColor: INK,
});
// axis + ticks
els.push({
  type: "line",
  x: AX,
  y: TOP - 10,
  points: [
    [0, 0],
    [0, axisH],
  ],
  strokeColor: INK,
  strokeWidth: 2,
});
for (let v = 0; v <= spec.max; v += spec.step) {
  const x = AX + v * SCALE;
  els.push({
    type: "line",
    x,
    y: TOP + axisH - 10,
    points: [
      [0, 0],
      [0, 10],
    ],
    strokeColor: INK,
  });
  els.push({
    type: "text",
    x: x - 8 * String(v).length,
    y: TOP + axisH + 4,
    text: String(v),
    fontSize: 16,
    strokeColor: INK,
  });
  if (v > 0)
    els.push({
      type: "line",
      x,
      y: TOP - 10,
      points: [
        [0, 0],
        [0, axisH],
      ],
      strokeColor: "#ced4da",
      strokeStyle: "dashed",
      strokeWidth: 1,
    });
}
spec.bars.forEach((b, i) => {
  const y = TOP + i * ROW;
  const c = b.accent ? ACCENT : INK;
  els.push({
    type: "text",
    x: 0,
    y: y + 10,
    text: b.label,
    fontSize: 18,
    strokeColor: INK,
  });
  els.push({
    type: "rectangle",
    x: AX,
    y,
    width: b.value * SCALE,
    height: BAR_H,
    strokeColor: c,
    backgroundColor: b.accent ? FILL : "#e9ecef",
    fillStyle: "hachure",
    roughness: 1,
  });
  const end = AX + (b.range ? b.range[1] : b.value) * SCALE;
  if (b.range) {
    const cy = y + BAR_H / 2,
      x0 = AX + b.range[0] * SCALE,
      x1 = AX + b.range[1] * SCALE;
    els.push({
      type: "line",
      x: x0,
      y: cy,
      points: [
        [0, 0],
        [x1 - x0, 0],
      ],
      strokeColor: INK,
      strokeWidth: 3,
    });
    els.push({
      type: "line",
      x: x1,
      y: cy - 10,
      points: [
        [0, 0],
        [0, 20],
      ],
      strokeColor: INK,
      strokeWidth: 3,
    });
  }
  els.push({
    type: "text",
    x: end + 14,
    y: y + 8,
    text: b.text,
    fontSize: 22,
    strokeColor: c,
  });
});
els.push({
  type: "text",
  x: AX + (spec.max * SCALE) / 2 - 40,
  y: TOP + axisH + 32,
  text: spec.unit,
  fontSize: 18,
  strokeColor: INK,
});
process.stdout.write(JSON.stringify(els, null, 1));
