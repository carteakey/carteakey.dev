---
name: dataviz
description: >
  Design, build, and maintain data visualizations, charts, and metric displays across
  carteakey.dev using the build-time SVG chart system ({% chart %}, utils/charts.mjs,
  and chartSvg()). Covers the "ink and dots" editorial grammar, all 8 chart types,
  data wiring from cartebase or 11ty collections, sparklines on stat tiles, and
  verification via /lab/charts/ and check:design. Use whenever adding or editing charts,
  dashboards, stat pages, or progression graphs in posts and pages.
---

# Data Visualization & Chart System (`dataviz`)

All charts on `carteakey.dev` render at build time as pure SVG through `utils/charts.mjs`. There is zero client-side JavaScript, no external chart libraries (no Chart.js), full dark/light theme support, and graceful fallback rendering in feed readers.

## 🧭 Core Principles & Design Grammar ("Ink and Dots")

1. **Build-Time SVG**: Every chart is generated during the Eleventy build. Never load client-side charting libraries (`Chart.js`, `D3`, `Mermaid` scripts).
2. **One Accent Color**: The site's chart palette is strictly monochromatic context with a single accent:
   - Grey ink (`#78716c` / `#1c1917` / `--chart-dim` / `--chart-ink`) for context, gridlines, and baseline axes.
   - Accent color (`--accent-color`) for the specific data point, line, or bar the sentence or chart is about.
   - Halftone dots (`url(#cb-dots)`) for filled areas and heatmaps.
   - Never use multi-colored rainbow series, soft gradients, or drop shadows.
3. **Editorial Framing**:
   - **Kicker**: Mono label stating category or data source.
   - **Title**: Must state the **finding or insight** (e.g. *"2024 was the loudest year, peaking in November"*, not *"Plays per month"*).
   - **Footer**: Caption, source attribution, sample size (`n = ...`), and date range.
   - **Collapsible Data Table**: Automatically emitted (toggleable via `table: false`), with raw SQL `query` if supplied.
4. **Typography**:
   - Axis ticks and metadata: Mono (`ui-monospace, SFMono-Regular, Menlo, monospace`).
   - Annotations & Notes: Fraunces italic on a hand-drawn leader line and ink ring.

---

## 🛠 Usage in Templates and Posts

### In Markdown Blog Posts & Nunjucks Pages: `{% chart %}`

```liquid
{% chart {
  type: "line",
  data: cartebase.photo_aesthetics.monthly,
  x: "month",
  y: "mean",
  kicker: "Apple Photos · mean score by month",
  title: "Winter photos score lower",
  highlight: ["2026-01", "2026-04"],
  notes: [{ at: "2026-02", text: "Jan–Apr only", dx: -40, dy: 40 }],
  ref: { value: 0.427, label: "all-time mean" },
  source: "cartebase · photos_assets",
  n: 10384,
  range: "2022 – Apr 2026",
  query: "SELECT strftime('%Y-%m', date_created) as month, AVG(overall_aesthetic_score) FROM photos_assets..."
} %}
```

### In Nunjucks Components & Macros: `chartSvg()`

When embedding sparklines inside macro parameters (such as `cb.stat_tile`):

```liquid
{% import "components/cartebase-charts.njk" as cb %}

{{ cb.stat_tile(
  "Posts",
  collections.posts.length | localeNumber,
  "since " ~ startYear,
  chartSvg({ type: "spark", data: postsPerYearData, x: "year", y: "count" })
) }}
```

---

## 📊 The 8 Chart Types

| Type | Best For | Key Parameters |
|---|---|---|
| `line` | Change over time, trends | `data`, `x`, `y`, `area`, `yMin`, `yMax`, `highlight`, `mark`, `ref`, `notes`, `count`, `digits`, `unit` |
| `bars` | Magnitudes across categories or bins | `data`, `x`, `y`, `highlight: "max"` or array, `xTicks`, `barWidth`, `ref`, `notes`, `digits`, `unit` |
| `rank` | Top-N lists, distributions | `data`, `x`, `y`, `total` (computes share %), `sub` (secondary label), `limit`, `unit`, `highlight` |
| `heatmap` | 2D rhythm (e.g. hour × weekday) | `matrix` (2D array), `rows`, `cols`, `unit`, `colEvery`, `colSuffix` |
| `waffle` | Single percentage out of 100 dots | `value` (0–100), `label`, `digits` |
| `multiples` | Several series on a shared scale | `labels`, `series: [{ label, values }]`, `start`, `limit`, `unit`, `digits`, `yMax` |
| `steps` | Discrete progression benchmarks | `points: [{ val, lbl, sub, highlight }]`, `unit`, `minY`, `maxY`, `notes` |
| `spark` | Compact inline tile trendlines | `data`, `x`, `y`, `yMin` |

### 1. `line` (Time Series)
- `data`: Array of objects or rows.
- `x`, `y`: Key names for horizontal axis (e.g. `"month"`, `"date"`) and value.
- `area: true`: Fills area under the curve with halftone dots pattern.
- `highlight: [startKey, endKey]`: Renders highlighted span in accent color, while surrounding context is dimmed grey.
- `mark: [key]`: Adds accent dot and value label to specific point(s) (default: last point).
- `ref: { value: 0.5, label: "mean" }`: Draws dashed reference baseline.
- `notes: [{ at: "2024-11", text: "Peak month\n4,279 plays", dx: -150, dy: -4 }]`: Italic callout note with leader line.

### 2. `bars` (Distribution / Bins)
- `highlight`: `"max"` or specific key string (e.g. `"2025"`) or array of keys. Non-highlighted bars render in dimmed grey without top labels.
- `xTicks`: Step interval for x-axis labels to avoid label crowding.
- `barWidth`: Fraction of available slot (default `0.68`).

### 3. `rank` (Top-N Ranked Rows)
- Renders as accessible `<ol class="chart-rank">` with proportional horizontal rail and accent indicator.
- `total`: Total sum across all items. When provided, automatically appends formatted percentage (e.g. `42 · 14.5%`).
- `sub`: Secondary object key displayed as dimmed subtitle (e.g. `artist` under `track`).

### 4. `heatmap` (Grid Density)
- `matrix`: 2D numeric array (e.g. 7 rows × 24 cols).
- Dot area scales proportionally to cell value (`area ∝ value`). Empty cells display faint pinpoint dots.

### 5. `waffle` (Single Share)
- 10 × 10 grid of dots representing 100%.
- Filled dots use accent color; remaining dots use faint stroke outline.
- Accompanied by large percentage typography and descriptive label.

### 6. `multiples` (Small Multiples)
- Useful when comparing 4–9 series without cluttering a single chart with conflicting lines.
- Shares uniform y-scale across all panels. Peak value and timestamp automatically highlighted on each card.

### 7. `steps` (Progression Benchmarks)
- Formerly `{% progression_chart %}` (which remains supported as an alias).
- Designed for engineering benchmarks (tok/s over optimization stages, latency reductions).
- `points`: Array of `{ val: 24.5, lbl: "Tuned", sub: "MTP draft", highlight: true }`.

### 8. `spark` (Stat Tile Sparkline)
- Bare SVG line without figure wrapping, axes, or chrome.
- Intended for `cb.stat_tile` in dashboard grids (`/data/`, `/listening/`, `/stats/`).

---

## 🗃 Data Sourcing

1. **Site Collections**:
   - `collections.posts | countByYear`: Yearly post volume.
   - `collections.posts | sumWordCounts`: Global word count.
   - `collections.posts | computeAuthorship`: Human / AI assisted / AI generated distribution.
2. **Cartebase SQLite**:
   - Sourced via `src/_data/cartebase.js` and `src/_data/cartebase/*.json`.
   - Exporters in `~/repos/cartebase/exporters/` (e.g. `blog_snapshots.py`, `top_aesthetic_photos.py`).
3. **Shortcode Arguments**:
   - Supports passing global data directly: `data: cartebase.listening.plays_per_month`.

---

## 🔬 Testing & Visual Verification

- **Chart Lab**: Visit `/lab/charts/` on the local dev server. Compare rendering variants via URL parameter:
  - `?chart=off` or default: Full ink wobble + halftone dot fills.
  - `?chart=dots`: Halftone fills, straight ruled lines.
  - `?chart=ink`: Hand-drawn wobble, flat tints.
  - `?chart=plain`: Clean geometric lines, flat tints.
- **Design Guard**: Always run before committing:
  ```bash
  npm run check:design
  ```
  Ensure no new off-palette colors or manual styling drift is introduced. If removing old baseline debt, ratchet down using `node utils/check-design.mjs --update-baseline`.
