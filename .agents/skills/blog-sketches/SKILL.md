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
- Bold line weight: Avoid flimsy, hairline digital strokes. Outlines must be strong, thick, and well-defined (similar to a 4B pencil or felt ink pen) to ensure legibility at 80px feed sizes.
- Organic sketch texture: Favor charcoal, pencil, or ink textures over clean, flat vector blocks or clipart shapes.
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
3. If the generated asset has a removable flat chroma-key background, use the
   installed imagegen helper:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input tmp/imagegen/agent-ide-keyed.png \
  --out src/static/img/blog-sketches/unique/agent-ide-stamp-trim.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill \
  --force
```

4. Add `image` and `imageAlt` to exactly one post.
5. Verify the result on:
   - `/blog/`
   - `/feed/`
   - the post page
6. Run `npm run build`.

## Batch Workflow

Use a batch pass when many posts lack thumbnails, but still treat every image as
unique. The safest pattern is:

1. List posts missing `image` front matter, excluding the template:

```bash
for f in src/posts/**/*.md src/posts/*.md; do
  [ -f "$f" ] || continue
  [ "${f##*/}" = "1990-01-01-template.md" ] && continue
  if ! sed -n '1,/^---$/p' "$f" | rg -q '^image:'; then
    printf '%s\n' "$f"
  fi
done
```

2. Read each post's front matter and opening section before prompting.
3. Generate one image per post with the built-in `image_gen` tool. Use one
   prompt per post, not one generic prompt for the set.
4. Preserve a stable ordered mapping from generated source file to post slug.
   The built-in tool saves under `$CODEX_HOME/generated_images/...`; sort by
   modification time when generation order matters.
5. Copy or process the selected source into the repo. Never reference an image
   directly from `$CODEX_HOME/generated_images`.
6. Remove the chroma key and trim transparent edges into
   `src/static/img/blog-sketches/unique/{slug}-stamp-trim.png`.
7. Normalize any residual keyed tint to neutral grayscale. This matters because
   faint green or magenta wash can survive inside antialiased pencil shading and
   looks wrong after dark-mode inversion.
8. Validate each final PNG:
   - has an alpha channel
   - transparent corners are `0`
   - the subject has plausible coverage, roughly `0.12-0.60`
   - the contact sheet reads clearly at thumbnail size
9. Add `image` and `imageAlt` only to the matching post. Do not touch posts that
   already have a thumbnail unless replacing one intentionally.
10. Remove temporary keyed sources and contact sheets after final assets are in
    `src/static/img/blog-sketches/unique/`.
11. Run `npm run build`.
12. Serve `_site` locally and spot-check `/blog/`, `/feed/`, and representative
    updated post pages. If Browser/Playwright is unavailable, at minimum fetch
    the pages and `HEAD` the sketch image URLs.

Useful batch post-processing shape:

```python
from pathlib import Path
from PIL import Image

def trim_to_square_alpha(path: Path, out: Path, pad: int = 28) -> None:
    im = Image.open(path).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        raise ValueError(f"no visible subject: {path}")
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(im.width, right + pad)
    bottom = min(im.height, bottom + pad)
    cropped = im.crop((left, top, right, bottom))
    size = max(cropped.width, cropped.height)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(cropped, ((size - cropped.width) // 2, (size - cropped.height) // 2), cropped)
    canvas.save(out, optimize=True)

def neutralize_to_grayscale(path: Path) -> None:
    im = Image.open(path).convert("RGBA")
    pixels = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            lum = int(0.299 * r + 0.587 * g + 0.114 * b)
            pixels[x, y] = (lum, lum, lum, a)
    im.save(path, optimize=True)
```

For front-matter edits in a batch, prefer a path-keyed script over a broad text
replacement. Insert `image` / `imageAlt` after `description` when present, and
skip files that already contain `image:`.

## Prompting Guidance

Keep prompts concrete and post-specific. Ask for:

- transparent background when possible
- monochrome textured charcoal pencil / ink sketch
- bold hand-drawn outlines, thick pencil strokes, and strong shaded contours
- no clean vector lines, no flat digital clipart, no hairlines
- centered composition with a strong silhouette readable as a small blog thumbnail
- tangible real-world metaphors (e.g. massive open tome with tiny companion notepad for model offloading, or a hand stamping a checkmark on blocks for token verification) rather than generic abstract network circles
- no colored fills
- no paper card or white border
- no readable text, labels, letters, or numbers unless the post specifically
  needs them

Bad prompt shape:

- "make a sketch for AI agents"

Good prompt shape:

- "Transparent monochrome editorial sketch of a laptop workspace for an essay
  about searching for the perfect agent IDE: code editor on screen, floating
  app cards, notebook with flowchart, coffee mug, clean black-ink lines, no
  background card, square composition, readable as a small blog thumbnail."

For chroma-key batch generation, add a strict removable-background block:

```text
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for
background removal.

Constraints: uniform #00ff00 background only, no shadows, no gradients, no
texture, no reflections, no floor plane, no readable text, no watermark, no
border, no card, no white paper backplate, and no #00ff00 inside the subject.
```

If the subject is green-heavy, use `#ff00ff` instead. Avoid blue keys for local
inference, hardware, and UI sketches because screens, charts, and technical
objects often pick up blue-toned shading.

## Editing Existing Assets

If a generated image is close but still has:

- off-white paper background
- too much transparent padding
- weak separation from the site background

then key out the background, trim the transparent edges, and desaturate the
remaining visible pixels to grayscale. The skill currently has no project-local
`scripts/prepare-sketch.mjs`; use the installed imagegen chroma-key helper or
add a local helper intentionally before referencing one.

## Integration Notes

- The site templates already support optional `image` / `imageAlt`.
- Do not add images to many posts at once unless each one is unique.
- Keep archive/feed density intact; do not add large framed thumbnails to lists.
- If you need to place the image inside post content manually, use the existing
  Eleventy image shortcode rather than Markdown image syntax.
- Permanent thumbnail batches should update `docs/CHANGELOG.md` and
  `versions.json` according to the repo playbook.
- Treat unrelated worktree changes as user-owned. Do not clean or revert
  existing deleted temp/source files unless explicitly asked.
