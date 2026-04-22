---
name: blog-sketches
description: >
  Create or refine optional blog post sketch images for carteakey.dev. Use this
  when a post needs a unique monochrome transparent illustration, when existing
  sketch assets need cleanup for feed/post rendering, or when wiring a post to
  the site-wide `image` / `imageAlt` workflow.
---

# Blog Sketches

Create optional per-post sketch images that work as:

- a thumbnail in `/blog/`, `/feed/`, and homepage featured slots
- a lead image on the post page
- the post's OG/Twitter/JSON-LD image

Treat these images as editorial flavor, not hero art. They should feel like a
small stamped sketch that belongs to the post, not a reusable category badge.

## Non-negotiables

- One image per post. Do not reuse category art across multiple posts.
- Transparent background preferred. Avoid white or off-white boxed backplates.
- Dark-mode safe. The site already uses `dark:invert`, so the drawing should be
  pure monochrome and hold up when inverted.
- Readable at small sizes. The same asset needs to survive around `80px-96px`
  in feeds and much larger on the post page.
- Optional means optional. If the image is weak, skip it.

## House Style

- Monotone black-ink or pencil sketch
- Notion-ish / editorial / notebook-adjacent, but not cute clipart
- Clear central silhouette with 1 main subject and 2-5 supporting objects
- Square-ish composition preferred
- Moderate detail, not noisy crosshatching everywhere
- Technical or personal scene tied to the specific post, not the tag
- No color accents, gradients, or textured paper slabs
- No border frame, caption card, or fake printed card baked into the image
- Avoid wide empty margins; trim the asset so the subject reads quickly

## Subject Selection

Read the post front matter plus opening section before generating anything.
Pick a scene that reflects the post's actual angle:

- workflow post: laptop, terminals, notes, diagrams, desk objects
- local inference post: workstation, GPU tower, benchmark notes, tokens/meters
- homelab post: router, cables, NAS, Pi, rack shelf, dashboard
- notes / PKM post: notebook, vault cards, graphs, bookmarks, filing motifs
- reflective / essay post: fewer objects, stronger central symbol

Do not generate generic "AI art" symbols unless the post is explicitly about
that symbol.

## File Conventions

- Final assets live in `src/static/img/blog-sketches/unique/`
- Use slugged names like `post-slug-stamp-trim.png`
- Front matter should point at the trimmed transparent asset

Example:

```yaml
image: /img/blog-sketches/unique/agent-ide-stamp-trim.png
imageAlt: Transparent monochrome sketch of an AI coding workspace
```

## Workflow

1. Read the target post and decide whether an image is worth adding.
2. Generate one post-specific sketch with the raster image workflow/tooling.
3. If the generated asset has a paper-colored background, run the helper:

```bash
node .agents/skills/blog-sketches/scripts/prepare-sketch.mjs \
  src/static/img/blog-sketches/agent-ide.png \
  src/static/img/blog-sketches/unique/agent-ide-stamp-trim.png
```

4. Add `image` and `imageAlt` to exactly one post.
5. Verify the result on:
   - `/blog/`
   - `/feed/`
   - the post page
6. Run `npm run build`.

## Prompting Guidance

Keep prompts concrete and post-specific. Ask for:

- transparent background when possible
- monochrome pencil / ink sketch
- centered composition
- strong silhouette for thumbnail use
- no colored fills
- no paper card or white border

Bad prompt shape:

- "make a sketch for AI agents"

Good prompt shape:

- "Transparent monochrome editorial sketch of a laptop workspace for an essay
  about searching for the perfect agent IDE: code editor on screen, floating
  app cards, notebook with flowchart, coffee mug, clean black-ink lines, no
  background card, square composition, readable as a small blog thumbnail."

## Editing Existing Assets

Use `scripts/prepare-sketch.mjs` when a generated image is close but still has:

- off-white paper background
- too much transparent padding
- weak separation from the site background

The script keys out the near-paper background, preserves darker strokes, then
trims the transparent edges.

## Integration Notes

- The site templates already support optional `image` / `imageAlt`.
- Do not add images to many posts at once unless each one is unique.
- Keep archive/feed density intact; do not add large framed thumbnails to lists.
- If you need to place the image inside post content manually, use the existing
  Eleventy image shortcode rather than Markdown image syntax.
