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

Use sparingly for personal commentary.

```md
{% annotate "probably for the best", "left" %}sane product manager{% endannotate %}
```

This renders with the handwritten `.note` treatment and can use the left or right gutter on wide screens.

### Wide Blocks

Use for wide tables or content that should break out of the article measure.

```md
{% wide %}
| Tool | Notes |
| --- | --- |
| Example | Wide table |
{% endwide %}
```

### Analysis Cards

Use for structured comparisons or local reasoning blocks.

```md
{% analysis title="Risk comparison", winner="Lower risk", side="a" %}
Markdown body here.
{% endanalysis %}
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

## Deliberately Retired / Avoid

- Generic blockquote callouts using `> :information_source:` or `> :warning:`. Migrate these to `{% callout %}`.
- Old `.annotate`, `.handnote`, and `.margin-note` CSS utilities. The active annotation shortcode uses `.note`; true sidenotes use `.sidenote`.
- `statblock`. CSS comments used to mention it, but no shortcode implementation exists. Do not reference it unless a real implementation is added.

## Still Missing

- Bibliography / further-reading block.
- Source card shortcode for inline references that need richer metadata than frontmatter attribution.
- Pull quote primitive.
