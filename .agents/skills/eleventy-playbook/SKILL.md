---
name: eleventy-playbook
description: Technical constraints, gotchas, and debugging tips specific to this site's Eleventy 3.0 configuration and data cascade.
---

# Eleventy Debugging Playbook

This skill outlines the specific quirks and patterns of this site's Eleventy configuration to accelerate debugging.

## Common Gotchas

### 1. `templateContent` Lazy Evaluation in Collections
- **The Problem:** In `eleventy.config.mjs`, when mapping custom collections (like `feed`), creating a new object with a detached getter `try { return entry.templateContent; }` fails to render the HTML body in Nunjucks templates (like `feed-card.njk`).
- **The Fix:** Pass the raw Eleventy item instead (`original: entry`). Nunjucks handles `item.original.templateContent` correctly when the original object context is preserved.

### 2. UI Tag Badges
- **The Problem:** You added a new organizational tag (e.g., `lexicon`, `til`, `now`) and now it appears as a weird badge on every post card.
- **The Fix:** Internal tags used for routing and collections must be excluded from the UI. Add the tag to the `filterTagList` function inside `eleventy.config.mjs`.

### 3. Date Volatility
- **The Problem:** A page's date changes every time it is deployed or modified.
- **The Fix:** Never rely on file system modification times. All content must explicitly declare `date` (and `updated`, if applicable) in its YAML frontmatter.

### 4. Custom UI Surfaces
- **The Problem:** You are building a new component and trying to style it with utility classes like `bg-white shadow-md p-4 rounded-lg`.
- **The Fix:** The site uses a specific "Dense Editorial / Workbench" design language. Use the centralized tokens (e.g., `.surface`, `.surface-compact`) instead of raw utility classes to ensure dark mode and theme consistency.
