# Blog Post Editorial Features

This is the working inventory for post-level writing primitives in `carteakey.dev`.
Future agents should check this file before adding new Markdown syntax, shortcodes, or CSS for article content.

## Current Primitives

### Footnotes

Use for references or small notes that should not interrupt the sentence.

```md
This claim needs a note.[^source]

[^source]: Footnotes can include **inline Markdown**.
```

Rendered by the local Markdown-it footnote extension in `eleventy.config.mjs`.

### Callouts

Use for compact editorial notes, warnings, examples, todos, and asides.
Do not use blockquotes as generic callouts anymore; blockquotes are for quoted material.

```md
{% callout "warning", "RAM ceiling warning" %}
This machine will run out of RAM if all experts are moved to CPU.
{% endcallout %}
```

Supported kinds: `note`, `warning`, `example`, `todo`, `aside`.

### Inline Updates

Use for dated changes inside posts that have evolved after publication.

```md
{% update "2026-04-30" %}
Added a new section and clarified the benchmark notes.
{% endupdate %}
```

Use frontmatter `updated:` for the post-level modified date; use `{% update %}` for visible inline change notes.

### Definition Popovers

Use for short explanations of terms without adding a footnote.

```md
{% define "viewer", "The app or static site layer that renders the underlying Markdown files." %}
```

Keep definitions short. Longer explanations should be a footnote or sidenote.

### Sidenotes

Use for quiet contextual notes that belong near the sentence but are not handwritten commentary.

```md
{% sidenote "A factual aside that sits in the margin on wide post layouts." %}
anchor text
{% endsidenote %}
```

Sidenotes are distinct from annotations:
- Sidenotes are factual, editorial, and calm.
- Annotations are handwritten, opinionated, or playful.

Put sentence-ending punctuation inside the paired shortcode when the sidenote ends a sentence, so the mobile inline fallback does not orphan punctuation.

### Handwritten Annotations

Use sparingly for personal commentary. Below the fold, the highlight sweeps across and the comment writes itself in on scroll (`src/static/js/ink.js`; static with no JS or reduced motion).

```md
{% annotate "probably for the best", "left" %}sane product manager{% endannotate %}
```

This renders with the handwritten `.note` treatment. On wide screens, the left/right option controls the note's in-flow ordering and alignment so it stays clear of the surrounding sentence.

### Wide Blocks

Use for wide tables or content that should break out of the article measure.

```md
{% wide %}
| Tool | Notes |
| --- | --- |
| Example | Wide table |
{% endwide %}
```

### Editorial Sidebar

Use `theme: editorial` and `sidebar:` frontmatter for a post-level side panel.

```yaml
theme: editorial
sidebar:
  label: "SIDE NOTES"
  title: "On this piece"
  content: |
    Markdown content works here.
```

### Source / Author Attribution

Use frontmatter for post- or quote-level attribution.

```yaml
author: "Author Name"
authorUrl: "https://example.com"
source: "Source Title"
sourceUrl: "https://example.com/source"
```

This is not a source card. It renders as attribution chrome in layouts and feed cards.

### Sources and acknowledgements

Use `attribution` for substantial adaptation: it renders before the article body. Use `sources` for a linked list after the body. Both use frontmatter data and the existing surface/type styles. Credits remain separate from automated Related Posts, which only matches tags.

```yaml
attribution:
  title: "Adapted from Author Name's argument"
  text: "Name the borrowed thesis or structure and explain what you added."
  author: "Author Name"
  titleOfWork: "Original work title"
  url: "https://example.com/original"
sources:
  - title: "Original work title"
    author: "Author Name"
    url: "https://example.com/original"
    contribution: "Explain which ideas, evidence, wording, or images came from this source."
```

A source list alone is insufficient for an adapted argument: credit it prominently and in the relevant sections. Mark verbatim wording as quotation. An AI authorship badge describes the writing process; it doesn't establish ownership of the ideas or substitute for source credit. For images, distinguish the original creator from the account that shared them.

### Charts

`{% chart %}` draws a data figure as SVG at build time (`utils/charts.mjs`). There is no client JavaScript, it renders in both themes, and feed readers get a readable fallback. It uses the shared `.data-card` frame:

- a mono kicker
- a title that states the finding ("2024 was the loudest year", not "Plays per month")
- the chart
- a footer with `caption`, `source`, `n` and `range`
- a collapsed **Data** table, with the `query` when you pass one

Grammar ("ink and dots"): grey ink for context and the accent for the one thing the sentence is about. Hairline axes, mono labels, and Fraunces italic notes on a leader. Areas and heatmaps use halftone dots. See every type with real data at `/lab/charts/`.

```md
{% chart {
  type: "line",                       // line | bars | rank | heatmap | waffle | multiples | steps
  data: cartebase.photo_aesthetics.monthly, x: "month", y: "mean",
  kicker: "Apple Photos · mean score by month",
  title: "Winter photos score lower",
  highlight: ["2026-01", "2026-04"],  // line: accent span, rest grey; bars: label(s) or "max"
  notes: [{ at: "2026-02", text: "Jan–Apr only", dx: -40, dy: 40 }],
  ref: { value: 0.427, label: "all-time mean" },
  source: "cartebase · photos_assets", n: 10384, range: "2022 – Apr 2026",
  query: "SELECT ..."
} %}
```

| Type | For | Key options |
|---|---|---|
| `line` | change over time | `area`, `yMin`/`yMax`, `highlight`, `mark`, `ref`, `notes`, `count` (adds n to tooltips) |
| `bars` | magnitude across categories or bins | `highlight`, `xTicks`, `ref`, `notes` |
| `rank` | top-N lists | `total` (adds a share), `sub` (secondary key), `limit`, `unit` |
| `heatmap` | two-way rhythm (weekday × hour) | `matrix`, `rows`, `cols`, `unit` |
| `waffle` | one share out of 100 | `value` (percent), `label` |
| `multiples` | several series, one accent | `labels`, `series`, `start`, `unit` |
| `steps` | a few measured values in sequence | `points: [{ val, lbl, sub, highlight }]`, `unit` |

Data comes from `data` + `x` + `y` (rows and key names; global data such as `cartebase.*` works) or from `labels` + `values`. Keep it to one or two notes per chart. Never put more than one series in an accent hue: use `multiples` instead. Pass `table: false` only when the figure already prints every value.

`{% progression_chart { kicker, title, unit, points } %}` is the original name for `steps` and still works:

```md
{% progression_chart { kicker: "...", title: "...", unit: "t/s", points: [ { val: 6.5, lbl: "Baseline", sub: "stock" }, { val: 20.8, lbl: "Tuned", highlight: true } ] } %}
```

### Gallery

Use for a set of related images that should read as one block (screenshots of several runs, a track-by-track preview) instead of one full-width image per section. Dense masonry (the "wall" archetype): flat, square, uncropped, no JS; images keep their own aspect ratio and flow top-to-bottom per column. Each image is optimised and click-to-zoom like `{% image_cc %}`.

```md
{% gallery [
  { src: "./src/static/img/example/one.png", alt: "What the image shows", caption: "Short mono label" },
  { src: "./src/static/img/example/two.png", alt: "What the image shows", caption: "Short mono label" }
] %}
```

Keep captions to a few words (the name plus one clause); long commentary belongs in the prose. Use `{% image_cc %}` instead for a single image, a diagram, or a sketch.

### Diagram Sketches

Use for spatial structure that would otherwise be ASCII box art. Made with the `sketches` skill (Part B), placed with `{% image_cc %}` and the class `sketch-draw` (dark-mode treatment plus a left-to-right ink wipe when scrolled into view). Not for file trees, logs, or tables.

## Deliberately Retired / Avoid

- Raw `<div>`/`<svg>` blocks, Tailwind utility stacks, and Alpine widgets written directly into a post. Use a documented primitive, or propose a new shared one first (AGENTS.md rule 5).

- Generic blockquote callouts using `> :information_source:` or `> :warning:`. Migrate these to `{% callout %}`.
- Old `.annotate`, `.handnote`, and `.margin-note` CSS utilities. The active annotation shortcode uses `.note`; true sidenotes use `.sidenote`.
- `statblock`. CSS comments used to mention it, but no shortcode implementation exists. Do not reference it unless a real implementation is added.
- `{% analysis %}` boxed comparison cards. Retired; use `{% callout %}` for boxed reasoning and a table for comparisons.

## Still Missing

- Source card shortcode for inline references that need richer metadata than frontmatter attribution.
- Pull quote primitive.
