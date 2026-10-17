// Build-time SVG charts for posts and pages ("ink and dots", docs/DESIGN_LANGUAGE.md).
//
//   {% chart { type: "line", data: rows, x: "month", y: "plays", kicker: "...", title: "..." } %}
//
// One accent for the point of the chart, grey ink for context, mono labels,
// Fraunces italic for annotations. Every mark also carries presentation
// attributes, so the SVG still reads in feed readers without the stylesheet;
// the .chart-* classes in tailwind.css override them on the site and switch
// the ink wobble and halftone fills (html[data-chart], see /lab/charts/).

const ACCENT = "#2323e6";
const INK = "#1c1917";
const DIM = "#78716c";
const RULE = "#d2cdc3";
const W = 720;
const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const FONT_NOTE = "Fraunces, Georgia, serif";

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const r1 = (v) => Math.round(v * 10) / 10;

export function fmt(v, digits) {
  const n = num(v);
  if (digits !== undefined) return n.toFixed(digits);
  if (!Number.isInteger(n) && Math.abs(n) < 1) return n.toFixed(3);
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function niceStep(span, count) {
  const raw = span / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const f = raw / mag;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
}

function niceTicks(min, max, count = 4) {
  if (max <= min) max = min + 1;
  const step = niceStep(max - min, count);
  const start = Math.floor(min / step + 1e-9) * step;
  const ticks = [];
  for (let t = start; t < max + step * 0.999; t += step) {
    ticks.push(Number(t.toFixed(10)));
  }
  return ticks;
}

// Shared pattern + filter. Repeated in every chart (identical ids are harmless)
// so a chart never depends on another one being rendered and visible.
const DEFS = `<defs><pattern id="cb-dots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.2" class="chart-dots-dot" fill="${ACCENT}"/></pattern><filter id="cb-ink" filterUnits="userSpaceOnUse" x="-50" y="-50" width="2000" height="2000"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter></defs>`;

// Accepts { data, x, y } (rows + keys) or { labels, values }.
function series(opts) {
  if (Array.isArray(opts.data)) {
    const xKey = opts.x || "label";
    const yKey = opts.y || "value";
    return {
      labels: opts.data.map((d) => String(d[xKey])),
      values: opts.data.map((d) => num(d[yKey])),
      counts: opts.count ? opts.data.map((d) => num(d[opts.count])) : null,
    };
  }
  return {
    labels: (opts.labels || []).map(String),
    values: (opts.values || []).map(num),
    counts: null,
  };
}

const tipText = (opts, label, value, count) =>
  `${label}: ${fmt(value, opts.digits)}${opts.unit ? ` ${opts.unit}` : ""}${
    count !== null && count !== undefined
      ? ` · ${fmt(count)} ${opts.countLabel || "rows"}`
      : ""
  }`;

// Year ticks for "YYYY-MM" labels, otherwise about `want` evenly spaced labels.
function xTickIndexes(labels, want = 7) {
  if (labels.length && labels.every((l) => /^\d{4}-\d{2}$/.test(l))) {
    const jan = labels
      .map((l, i) => (l.endsWith("-01") || i === 0 ? i : -1))
      .filter((i) => i >= 0);
    const every = Math.ceil(jan.length / want);
    return jan
      .filter((_, k) => k % every === 0)
      .map((i) => ({ i, text: labels[i].slice(0, 4) }));
  }
  const every = Math.max(1, Math.ceil(labels.length / want));
  return labels
    .map((l, i) => ({ i, text: l }))
    .filter(({ i }) => i % every === 0);
}

// Annotation: an ink ring on the point, a leader, and an italic note.
function note(n, p, plot) {
  const lines = String(n.text || "").split("\n");
  const dx = n.dx ?? (p.x > W * 0.6 ? -64 : 48);
  const dy = n.dy ?? (p.y < plot.t + 60 ? 44 : -36);
  const anchor = dx < 0 ? "end" : "start";
  const tx = Math.min(W - 8, Math.max(8, p.x + dx));
  const ty = p.y + dy;
  const sx = tx + (anchor === "end" ? 3 : -3);
  const sy = dy < 0 ? ty + (lines.length - 1) * 16 + 6 : ty - 14;
  const len = Math.hypot(sx - p.x, sy - p.y) || 1;
  const ex = r1(p.x + ((sx - p.x) / len) * 10);
  const ey = r1(p.y + ((sy - p.y) / len) * 10);
  const tspans = lines
    .map(
      (l, k) =>
        `<tspan x="${r1(tx)}" dy="${k === 0 ? 0 : 16}">${esc(l)}</tspan>`,
    )
    .join("");
  return [
    `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="8" class="chart-ring chart-ink" fill="none" stroke="${ACCENT}" stroke-width="1.4"/>`,
    `<path d="M ${r1(sx)},${r1(sy)} Q ${r1(sx)},${ey} ${ex},${ey}" class="chart-leader chart-ink" fill="none" stroke="${INK}" stroke-width="1"/>`,
    `<text x="${r1(tx)}" y="${r1(ty)}" text-anchor="${anchor}" class="chart-note" fill="${INK}" font-family="${FONT_NOTE}" font-style="italic" font-size="13.5">${tspans}</text>`,
  ].join("");
}

function yAxis(ticks, y, plot, opts) {
  const unit = opts.unit
    ? `<text x="${plot.l - 8}" y="${plot.t - 10}" text-anchor="start" class="chart-text" fill="${DIM}" font-family="${FONT_MONO}" font-size="10">${esc(opts.unit)}</text>`
    : "";
  return unit + ticks
    .map((t, k) => {
      const gy = r1(y(t));
      const base = k === 0;
      const lbl = fmt(t, opts.tickDigits);
      return [
        `<line x1="${plot.l}" y1="${gy}" x2="${W - plot.r}" y2="${gy}" class="${base ? "chart-axis" : "chart-grid"}" stroke="${base ? INK : RULE}" stroke-width="1"${base ? "" : ' stroke-dasharray="2 4"'}/>`,
        `<text x="${plot.l - 8}" y="${gy + 3.5}" text-anchor="end" class="chart-text" fill="${DIM}" font-family="${FONT_MONO}" font-size="10">${esc(lbl)}</text>`,
      ].join("");
    })
    .join("");
}

function refLine(opts, y, plot) {
  if (!opts.ref) return "";
  const gy = r1(y(num(opts.ref.value)));
  return `<line x1="${plot.l}" y1="${gy}" x2="${W - plot.r}" y2="${gy}" class="chart-ref" stroke="${INK}" stroke-width="1" stroke-dasharray="2 3"/><text x="${plot.l + 6}" y="${gy - 5}" text-anchor="start" class="chart-ref-label" fill="${DIM}" font-family="${FONT_MONO}" font-size="10">${esc(opts.ref.label || fmt(opts.ref.value))}</text>`;
}

const svgOpen = (h, label, cls = "chart-svg") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" class="${cls}" role="img" aria-label="${esc(label)}">${DEFS}`;

function figure(opts, inner, table) {
  const meta = [
    opts.source && `Source: ${esc(opts.source)}`,
    opts.n !== undefined && `n = ${fmt(opts.n)}`,
    opts.range && esc(opts.range),
  ].filter(Boolean);
  const head =
    opts.kicker || opts.title || opts.badge
      ? `<div class="data-card-head"><div>${opts.kicker ? `<p class="data-card-kicker">${opts.kicker}</p>` : ""}${opts.title ? `<h3 class="data-card-title">${opts.title}</h3>` : ""}</div>${opts.badge ? `<span class="data-card-badge">${opts.badge}</span>` : ""}</div>`
      : "";
  const foot =
    opts.caption || meta.length
      ? `<figcaption class="data-card-foot">${opts.caption ? `<span class="chart-caption">${opts.caption}</span>` : ""}${meta.length ? `<span class="chart-meta">${meta.join(" · ")}</span>` : ""}</figcaption>`
      : "";
  let details = "";
  if (opts.table !== false && (table || opts.query)) {
    const rows = table
      ? `<div class="chart-table-wrap"><table class="chart-table"><thead><tr>${table.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${table.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      : "";
    const query = opts.query
      ? `<pre class="chart-query"><code>${esc(opts.query)}</code></pre>`
      : "";
    details = `<details class="chart-data"><summary>${opts.query ? "Data and query" : "Data"}</summary>${query}${rows}</details>`;
  }
  return `<figure class="data-card chart-card not-prose">${head}${inner}${foot}${details}</figure>`;
}

const seriesTable = (opts, labels, values, counts) => ({
  head: [
    opts.xLabel || "",
    opts.yLabel || opts.unit || "value",
    ...(counts ? [opts.countLabel || "rows"] : []),
  ],
  rows: labels.map((l, i) => [
    l,
    fmt(values[i], opts.digits),
    ...(counts ? [fmt(counts[i])] : []),
  ]),
});

function line(opts) {
  const { labels, values, counts } = series(opts);
  if (!values.length) return "";
  const H = opts.height || 240;
  const plot = { l: 52, r: 20, t: 22, b: 30 };
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const yMin = opts.yMin ?? (dataMin >= 0 ? 0 : dataMin);
  const ticks = niceTicks(yMin, opts.yMax ?? dataMax, opts.yTicks || 4);
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const n = values.length;
  const pw = W - plot.l - plot.r;
  const ph = H - plot.t - plot.b;
  const x = (i) => plot.l + (n > 1 ? (i / (n - 1)) * pw : pw / 2);
  const y = (v) => plot.t + ph - ((v - lo) / (hi - lo)) * ph;
  const pts = values.map((v, i) => ({ x: x(i), y: y(v) }));
  const path = (from, to) =>
    pts
      .slice(from, to + 1)
      .map((p, k) => `${k ? "L" : "M"} ${r1(p.x)},${r1(p.y)}`)
      .join(" ");

  let hl = null;
  if (Array.isArray(opts.highlight)) {
    const a = labels.indexOf(String(opts.highlight[0]));
    const b = labels.indexOf(String(opts.highlight[1] ?? labels[n - 1]));
    if (a >= 0 && b >= a) hl = [a, b];
  }
  const [a, b] = hl || [0, n - 1];
  const base = r1(y(lo));
  const area =
    opts.area && lo === 0
      ? `<path d="${path(a, b)} L ${r1(pts[b].x)},${base} L ${r1(pts[a].x)},${base} Z" class="chart-area" fill="${ACCENT}" fill-opacity="0.14"/>`
      : "";
  const ctx = hl
    ? `<path d="${path(0, n - 1)}" class="chart-line-ctx" fill="none" stroke="${DIM}" stroke-width="1.5"/>`
    : "";
  const main = `<path d="${path(a, b)}" class="chart-line" fill="none" stroke="${ACCENT}" stroke-width="2.25" stroke-linejoin="round"/>`;

  const marks = (opts.mark ?? [labels[n - 1]])
    .map((l) => labels.indexOf(String(l)))
    .filter((i) => i >= 0)
    .map(
      (i) =>
        `<circle cx="${r1(pts[i].x)}" cy="${r1(pts[i].y)}" r="3.5" class="chart-dot-hl" fill="${ACCENT}"/><text x="${r1(pts[i].x + (i === n - 1 ? -6 : 0))}" y="${r1(pts[i].y - 9)}" text-anchor="${i === n - 1 ? "end" : "middle"}" class="chart-val" fill="${INK}" font-family="${FONT_MONO}" font-size="11" font-weight="700">${fmt(values[i], opts.digits)}</text>`,
    )
    .join("");

  const xt = xTickIndexes(labels, opts.xTicks)
    .map(
      ({ i, text }) =>
        `<text x="${r1(x(i))}" y="${H - 10}" text-anchor="middle" class="chart-text" fill="${DIM}" font-family="${FONT_MONO}" font-size="10">${esc(text)}</text>`,
    )
    .join("");

  const band = n > 1 ? pw / (n - 1) : pw;
  const hits = pts
    .map(
      (p, i) =>
        `<g class="chart-hit"><rect x="${r1(p.x - band / 2)}" y="${plot.t}" width="${r1(band)}" height="${ph}" fill="transparent"/><line x1="${r1(p.x)}" y1="${plot.t}" x2="${r1(p.x)}" y2="${base}" class="chart-cross" opacity="0"/><circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="4" class="chart-hover-dot" opacity="0"/><title>${esc(tipText(opts, labels[i], values[i], counts && counts[i]))}</title></g>`,
    )
    .join("");

  const notes = (opts.notes || [])
    .map((nt) => {
      const i = labels.indexOf(String(nt.at));
      return i >= 0 ? note(nt, pts[i], plot) : "";
    })
    .join("");

  const svg = `<div class="data-card-scroll">${svgOpen(H, opts.title || opts.kicker || "Line chart")}${yAxis(ticks, y, plot, opts)}${refLine(opts, y, plot)}${area}${ctx}${main}${marks}${xt}${hits}${notes}</svg></div>`;
  return figure(opts, svg, seriesTable(opts, labels, values, counts));
}

function bars(opts) {
  const { labels, values, counts } = series(opts);
  if (!values.length) return "";
  const H = opts.height || 220;
  const plot = { l: 52, r: 20, t: 22, b: 30 };
  const ticks = niceTicks(0, opts.yMax ?? Math.max(...values), opts.yTicks || 4);
  const hi = ticks[ticks.length - 1];
  const n = values.length;
  const pw = W - plot.l - plot.r;
  const ph = H - plot.t - plot.b;
  const band = pw / n;
  const bw = Math.max(1, band * (opts.barWidth || 0.68));
  const y = (v) => plot.t + ph - (v / hi) * ph;
  const cx = (i) => plot.l + band * i + band / 2;
  const maxI = values.indexOf(Math.max(...values));
  const hlSet = new Set(
    (opts.highlight === undefined
      ? []
      : [].concat(opts.highlight)
    ).map((h) => (h === "max" ? labels[maxI] : String(h))),
  );
  const any = hlSet.size > 0;
  const labelEvery = Math.max(1, Math.ceil(n / (opts.xTicks || 16)));

  const body = values
    .map((v, i) => {
      const on = !any || hlSet.has(labels[i]);
      const top = r1(y(v));
      const bar = `<rect x="${r1(cx(i) - bw / 2)}" y="${top}" width="${r1(bw)}" height="${r1(y(0) - top)}" class="${on ? "chart-bar" : "chart-bar-ctx"}" fill="${on ? ACCENT : DIM}"${on ? "" : ' fill-opacity="0.35"'}/>`;
      const val =
        any && on
          ? `<text x="${r1(cx(i))}" y="${top - 6}" text-anchor="middle" class="chart-val" fill="${INK}" font-family="${FONT_MONO}" font-size="11" font-weight="700">${fmt(v, opts.digits)}</text>`
          : "";
      const xl =
        i % labelEvery === 0
          ? `<text x="${r1(cx(i))}" y="${H - 10}" text-anchor="middle" class="chart-text" fill="${DIM}" font-family="${FONT_MONO}" font-size="10">${esc(labels[i])}</text>`
          : "";
      const hit = `<g class="chart-hit"><rect x="${r1(cx(i) - band / 2)}" y="${plot.t}" width="${r1(band)}" height="${ph}" fill="transparent"/><title>${esc(tipText(opts, labels[i], v, counts && counts[i]))}</title></g>`;
      return bar + val + xl + hit;
    })
    .join("");

  const notes = (opts.notes || [])
    .map((nt) => {
      const i = labels.indexOf(String(nt.at));
      return i >= 0 ? note(nt, { x: cx(i), y: y(values[i]) }, plot) : "";
    })
    .join("");

  const svg = `<div class="data-card-scroll">${svgOpen(H, opts.title || opts.kicker || "Bar chart")}${yAxis(ticks, y, plot, opts)}${body}${refLine(opts, y, plot)}${notes}</svg></div>`;
  return figure(opts, svg, seriesTable(opts, labels, values, counts));
}

// Measured steps (the original progression_chart): few points, every value labelled.
function steps(opts) {
  const raw = Array.isArray(opts.points) ? opts.points : [];
  if (!raw.length) return "";
  const unit = opts.unit ?? "t/s";
  const vals = raw.map((p) => num(p.val));
  const maxY = num(opts.maxY) || Math.ceil(Math.max(...vals) / 5) * 5 || 25;
  const minY = num(opts.minY);
  const H = 290;
  const plot = { l: 60, r: 40, t: 45, b: 55 };
  const n = raw.length;
  const x = (i) => (n > 1 ? 100 + (i / (n - 1)) * 540 : W / 2);
  const y = (v) => 235 - ((v - minY) / (maxY - minY)) * 190;
  const step = Math.max(1, Math.round((maxY - minY) / 5));
  const ticks = [];
  for (let g = minY; g <= maxY; g += step) ticks.push(g);
  const pts = raw.map((p, i) => ({ ...p, x: x(i), y: y(num(p.val)) }));
  const path = pts.map((p, i) => `${i ? "L" : "M"} ${r1(p.x)},${r1(p.y)}`).join(" ");
  const dots = pts
    .map((p) => {
      const hl = Boolean(p.highlight);
      return `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="${hl ? 6 : 5}" class="${hl ? "chart-dot-hl" : "chart-dot"}" fill="${hl ? ACCENT : "#fbfaf6"}" stroke="${hl ? "#fbfaf6" : ACCENT}" stroke-width="2"/><text x="${r1(p.x)}" y="${r1(p.y - 12)}" text-anchor="middle" class="${hl ? "chart-val-hl" : "chart-val"}" fill="${hl ? ACCENT : INK}" font-family="${FONT_MONO}" font-size="12" font-weight="700">${esc(p.val)}</text><text x="${r1(p.x)}" y="255" text-anchor="middle" class="chart-lbl" fill="${INK}" font-size="11">${esc(p.lbl || "")}</text><text x="${r1(p.x)}" y="270" text-anchor="middle" class="chart-text" fill="${DIM}" font-family="${FONT_MONO}" font-size="10">${esc(p.sub || "")}</text>`;
    })
    .join("");
  const notes = (opts.notes || [])
    .map((nt) => {
      const i = raw.findIndex((p) => String(p.lbl) === String(nt.at));
      return i >= 0 ? note(nt, pts[i], plot) : "";
    })
    .join("");
  const svg = `<div class="data-card-scroll">${svgOpen(H + 20, opts.title || "Progression chart")}${yAxis(ticks, y, { ...plot, l: 60 }, { unit })}<path d="${path}" class="chart-line" fill="none" stroke="${ACCENT}" stroke-width="2.5" stroke-linejoin="round"/>${dots}${notes}</svg></div>`;
  const table = {
    head: ["", unit],
    rows: raw.map((p) => [[p.lbl, p.sub].filter(Boolean).join(" · "), String(p.val)]),
  };
  return figure(opts, svg, table);
}

// Ranked rows: HTML so long labels wrap; a hairline rail with an accent bar.
function rank(opts) {
  const xKey = opts.x || "label";
  const yKey = opts.y || "value";
  const items = (opts.data || []).slice(0, opts.limit || 10);
  if (!items.length) return "";
  const max = Math.max(...items.map((d) => num(d[yKey])));
  const hl = new Set([].concat(opts.highlight ?? [0]));
  const rows = items
    .map((d, i) => {
      const v = num(d[yKey]);
      const w = max ? r1((v / max) * 100) : 0;
      const pct = opts.total ? ` · ${fmt((v * 100) / opts.total, 1)}%` : "";
      const sub = opts.sub && d[opts.sub] ? `<span class="chart-rank-sub">${esc(d[opts.sub])}</span>` : "";
      return `<li class="chart-rank-row${hl.has(i) ? " is-hl" : ""}"><span class="chart-rank-n">${i + 1}</span><span class="chart-rank-label">${esc(d[xKey])}${sub}</span><span class="chart-rank-val">${fmt(v, opts.digits)}${opts.unit ? ` ${esc(opts.unit)}` : ""}${pct}</span><svg class="chart-rank-track" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="3" x2="100" y2="3" class="chart-rank-rail" stroke="${RULE}" stroke-width="1" vector-effect="non-scaling-stroke"/><line x1="0" y1="3" x2="${w}" y2="3" class="chart-rank-bar" stroke="${hl.has(i) ? ACCENT : DIM}" stroke-width="3" vector-effect="non-scaling-stroke"/></svg></li>`;
    })
    .join("");
  return figure(opts, `<ol class="chart-rank">${rows}</ol>`, null);
}

// Weekday x hour grid. Default: halftone dots sized by value (area ∝ value).
// html[data-chart=plain|ink] swaps to square cells stepped by opacity.
function heatmap(opts) {
  const matrix = opts.matrix || [];
  if (!matrix.length) return "";
  const rows = opts.rows || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cols = opts.cols || Array.from({ length: matrix[0].length }, (_, i) => String(i));
  const unit = opts.unit || "";
  const max = Math.max(...matrix.flat().map(num), 0);
  const pitch = 14;
  const cell = 12;
  const left = 30;
  const top = 14;
  const steps = [0.16, 0.34, 0.54, 0.76, 1];
  const vw = left + cols.length * pitch + 2;
  const vh = top + matrix.length * pitch + 2;
  let body = "";
  cols.forEach((c, ci) => {
    if (ci % (opts.colEvery || 3) === 0)
      body += `<text class="dot-grid-label" x="${left + ci * pitch + pitch / 2}" y="9" text-anchor="middle" fill="${DIM}" font-family="${FONT_MONO}" font-size="7">${esc(c)}</text>`;
  });
  matrix.forEach((row, ri) => {
    body += `<text class="dot-grid-label" x="0" y="${top + ri * pitch + pitch / 2 + 3}" fill="${DIM}" font-family="${FONT_MONO}" font-size="7">${esc(rows[ri])}</text>`;
    row.forEach((raw, ci) => {
      const v = num(raw);
      const x = left + ci * pitch + (pitch - cell) / 2;
      const y = top + ri * pitch + (pitch - cell) / 2;
      const tip = `<title>${esc(`${rows[ri]} ${cols[ci]}${opts.colSuffix ?? ":00"}: ${fmt(v)}${unit ? ` ${unit}` : ""}`)}</title>`;
      if (v > 0 && max > 0) {
        const step = Math.floor(Math.sqrt(v / max) * 4.999);
        const r = r1(Math.max(0.9, Math.sqrt(v / max) * (cell / 2)));
        body += `<g><rect x="${x}" y="${y}" width="${cell}" height="${cell}" class="heat-cell chart-heat-sq" fill="${ACCENT}" fill-opacity="${steps[step]}" display="none"/><circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="${r}" class="chart-heat-dot" fill="${ACCENT}"/>${tip}</g>`;
      } else {
        body += `<g><rect x="${x + 0.25}" y="${y + 0.25}" width="${cell - 0.5}" height="${cell - 0.5}" class="heat-cell-empty chart-heat-sq" display="none"/><circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="0.6" class="chart-heat-zero" fill="${RULE}"/>${tip}</g>`;
      }
    });
  });
  const legendSq = steps
    .map((o) => `<svg viewBox="0 0 10 10" width="10" height="10" class="chart-heat-sq-key" display="none"><rect width="10" height="10" class="heat-cell" fill="${ACCENT}" fill-opacity="${o}"/></svg>`)
    .join("");
  const legendDot = steps
    .map((o) => `<svg viewBox="0 0 10 10" width="10" height="10" class="chart-heat-dot-key"><circle cx="5" cy="5" r="${r1(Math.sqrt(o) * 5)}" class="chart-heat-dot" fill="${ACCENT}"/></svg>`)
    .join("");
  const svg = `<div class="dot-heatmap-scroll"><svg xmlns="http://www.w3.org/2000/svg" class="dot-grid dot-grid-heatmap" viewBox="0 0 ${vw} ${vh}" role="img" aria-label="${esc(opts.title || "Heatmap")}">${body}</svg><p class="heat-legend" aria-hidden="true">Fewer ${legendSq}${legendDot} More</p></div>`;
  const table = {
    head: ["", ...cols],
    rows: matrix.map((row, ri) => [rows[ri], ...row.map((v) => fmt(v))]),
  };
  return figure(opts, svg, table);
}

// Unit chart: 100 dots, one per percent.
function waffle(opts) {
  const pct = Math.max(0, Math.min(100, num(opts.value)));
  const filled = Math.round(pct);
  let dots = "";
  for (let k = 0; k < 100; k++) {
    const cx = 6 + (k % 10) * 12;
    const cy = 6 + Math.floor(k / 10) * 12;
    dots +=
      k < filled
        ? `<circle cx="${cx}" cy="${cy}" r="4.2" class="chart-waffle-on" fill="${ACCENT}"/>`
        : `<circle cx="${cx}" cy="${cy}" r="3.6" class="chart-waffle-off" fill="none" stroke="${RULE}" stroke-width="1"/>`;
  }
  const inner = `<div class="chart-waffle"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" class="chart-waffle-svg" role="img" aria-label="${esc(`${fmt(pct, 1)}% ${opts.label || ""}`)}">${dots}</svg><div class="chart-waffle-text"><p class="chart-waffle-num">${fmt(pct, opts.digits ?? 1)}%</p>${opts.label ? `<p class="chart-waffle-label">${opts.label}</p>` : ""}</div></div>`;
  return figure(opts, inner, null);
}

// Small multiples: one accent panel per series on a shared y scale.
function multiples(opts) {
  const all = (opts.labels || []).map(String);
  const from = opts.start ? Math.max(0, all.indexOf(String(opts.start))) : 0;
  const labels = all.slice(from);
  // Accepts { label, values } or the exporter's { artist, data }; "Other" is dropped.
  const list = (opts.series || [])
    .map((s) => ({ label: s.label ?? s.artist, values: (s.values ?? s.data ?? []).slice(from) }))
    .filter((s) => s.label !== "Other")
    .slice(0, opts.limit || 9);
  if (!list.length) return "";
  const yMax = opts.yMax ?? Math.max(...list.flatMap((s) => s.values.map(num)));
  const PW = 220;
  const PH = 72;
  const pad = { l: 4, r: 4, t: 6, b: 4 };
  const panels = list
    .map((s) => {
      const v = s.values.map(num);
      const n = v.length;
      const x = (i) => pad.l + (n > 1 ? (i / (n - 1)) * (PW - pad.l - pad.r) : 0);
      const y = (val) => pad.t + (PH - pad.t - pad.b) * (1 - val / yMax);
      const d = v.map((val, i) => `${i ? "L" : "M"} ${r1(x(i))},${r1(y(val))}`).join(" ");
      const peak = v.indexOf(Math.max(...v));
      const base = PH - pad.b;
      const hits = v
        .map((val, i) => `<g class="chart-hit"><rect x="${r1(x(i) - (PW / n) / 2)}" y="0" width="${r1(PW / n)}" height="${PH}" fill="transparent"/><title>${esc(`${s.label} · ${labels[i]}: ${fmt(val, opts.digits)}${opts.unit || ""}`)}</title></g>`)
        .join("");
      return `<div class="chart-mult-panel"><p class="chart-mult-title">${esc(s.label)}</p><p class="chart-mult-peak">peak ${fmt(v[peak], opts.digits)}${esc(opts.unit || "")} · ${esc(labels[peak] || "")}</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" class="chart-mult-svg" role="img" aria-label="${esc(s.label)}">${DEFS}<line x1="0" y1="${base}" x2="${PW}" y2="${base}" class="chart-axis" stroke="${INK}" stroke-width="1"/><path d="${d} L ${r1(x(n - 1))},${base} L ${r1(x(0))},${base} Z" class="chart-area" fill="${ACCENT}" fill-opacity="0.14"/><path d="${d}" class="chart-line" fill="none" stroke="${ACCENT}" stroke-width="1.75"/>${hits}</svg></div>`;
    })
    .join("");
  const axis = labels.length
    ? `<p class="chart-mult-axis"><span>${esc(labels[0])}</span><span>shared scale, 0–${fmt(yMax, opts.digits)}${esc(opts.unit || "")}</span><span>${esc(labels[labels.length - 1])}</span></p>`
    : "";
  const table = {
    head: ["", ...labels],
    rows: list.map((s) => [s.label, ...s.values.map((v) => fmt(v, opts.digits))]),
  };
  return figure(opts, `<div class="chart-multiples">${panels}</div>${axis}`, table);
}

// Inline sparkline for stat tiles; no figure chrome.
function spark(opts) {
  const { values } = series(opts);
  if (values.length < 2) return "";
  const SW = 120;
  const SH = 28;
  const max = Math.max(...values);
  const min = opts.yMin ?? 0;
  const x = (i) => 2 + (i / (values.length - 1)) * (SW - 6);
  const y = (v) => 3 + (SH - 6) * (1 - (v - min) / (max - min || 1));
  const d = values.map((v, i) => `${i ? "L" : "M"} ${r1(x(i))},${r1(y(v))}`).join(" ");
  const last = values.length - 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SW} ${SH}" class="chart-spark" aria-hidden="true"><path d="${d}" class="chart-line" fill="none" stroke="${ACCENT}" stroke-width="1.5"/><circle cx="${r1(x(last))}" cy="${r1(y(values[last]))}" r="2.2" class="chart-dot-hl" fill="${ACCENT}"/></svg>`;
}

const TYPES = { line, bars, steps, rank, heatmap, waffle, multiples, spark };

export function chart(opts = {}) {
  const render = TYPES[opts.type || "line"];
  if (!render) throw new Error(`chart: unknown type "${opts.type}"`);
  return render(opts);
}

export const chartTypes = Object.keys(TYPES);
