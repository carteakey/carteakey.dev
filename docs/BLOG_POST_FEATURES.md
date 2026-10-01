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

### Progression Chart

Use for a measured series of values (throughput by runtime, scores over time). Renders through the shared `.data-card` and `.chart-*` classes: one accent line, straight segments, no gradient.

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

- Bibliography / further-reading block.
- Source card shortcode for inline references that need richer metadata than frontmatter attribution.
- Pull quote primitive.
