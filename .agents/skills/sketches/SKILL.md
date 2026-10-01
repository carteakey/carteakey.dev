---
name: sketches
description: >
  Create hand-drawn sketch images for carteakey.dev posts. Separate jobs
  with separate rules: (A) per-post THUMBNAILS (monochrome stamp, `image:`
  front matter), (B) inline ILLUSTRATIVE diagrams (Qwen-Image-2.1 whiteboard
  sketches) and (C) EXACT diagrams and charts whose logic or numbers must be
  right (Excalidraw, driven from a spec or data). Use this when a post needs a
  thumbnail, when a post contains an ASCII box diagram, decision tree,
  multi-tier comparison or a trend/benchmark chart, or when existing sketch
  assets look hazy, boxed, or wrong in dark mode.
---

# Sketches

Three jobs, three rule sets. Do not mix them. A and B are generated raster
sketches; C is exact, data-driven Excalidraw (Part C below).

| | A. Thumbnail | B. Diagram |
|---|---|---|
| Purpose | Flavor image in `/blog/`, `/feed/`, OG card | Explains something inside the post body |
| Where | `image:` / `imageAlt:` front matter | `{% image_cc %}` in the body |
| Subject | A tangible scene tied to the post | A specific structure: tiers, flows, comparisons |
| Text in image | None | Short labels only (see B) |
| Colour | Pure monochrome, no accent | Black ink + cobalt accent, nothing else |
| Size | Readable at 80-96px | Readable at ~640px wide |
| Dir | `src/static/img/blog-sketches/unique/` | `src/static/img/diagrams/` |
| File | `{slug}-stamp-trim.png` | `{post-slug}-{what}.png` |
| Cleanup | chroma-key + grayscale + trim | `utils/prepare-diagram.mjs` |
| Required? | **Required, exactly one per post** (`check:content` enforces it) | Only where it beats prose, a table, or a fenced code block |

## Shared setup: GPU and ComfyUI

Qwen-Image-2.1 INT8 needs ~11.3 GB VRAM. The RTX 4070 (12 GB) cannot hold it
alongside the LLM server (Strata ~11.5 GB). **Stopping `llama-swap` interrupts
anything the user is serving, so ask before doing it.**

```bash
systemctl --user stop llama-swap.service
nvidia-smi --query-gpu=memory.used --format=csv,noheader   # expect ~44 MiB
bash /home/kchauhan/repos/l2m2/maintenance/run-comfyui.sh gpu   # wait ~20 s
# ...generate (workflow below)...
# stop ComfyUI, then:
systemctl --user start llama-swap.service
```

Generation goes through the ComfyUI HTTP API, not the UI (the l2m2 workflow
JSON has an unlinked `images.image_1` slot that fails the UI validator). If a
submit returns HTTP 400, print the response body: it names the missing input.
Check node schemas with `curl :8188/object_info/<NodeName>` before trusting any
documented workflow. A 1280x896 image takes ~30 s on the 4070. See
"ComfyUI API workflow" under Part B; thumbnails may also use the built-in
`image_gen` tool.

Raw generator output stays out of the repo (`/home/kchauhan/media-output/comfyui/`).
Only the processed PNG is committed.

---

# Part A: Thumbnails

Every post needs a unique per-post sketch image. It works as a thumbnail in `/blog/`, `/feed/`
and homepage slots, the lead image on the post page, and the OG/Twitter/JSON-LD
image. Treat them as editorial flavor, not hero art: a small stamped sketch that
belongs to the post, not a reusable category badge.

## Non-negotiables

- One image per post. Do not reuse category art across multiple posts.
- Transparent background preferred. Avoid white or off-white boxed backplates.
- Dark-mode safe. The site already uses `dark:invert`, so the drawing should be
  pure monochrome and hold up when inverted.
- Readable at small sizes. The same asset needs to survive around `80px-96px`
  in feeds and much larger on the post page.
- Required means required: every post ships with one, and `npm run check:content`
  fails without `image`, `imageAlt`, and an existing file. If a generated image is
  weak, re-roll it; do not skip it or borrow another post's.

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
remaining visible pixels to grayscale. Use the installed imagegen chroma-key helper (above), or
`utils/prepare-diagram.mjs` if the source is dark ink on white paper.

## Integration Notes

- Posts must set `image` / `imageAlt` (enforced by `utils/check-content.mjs`).
- Do not add images to many posts at once unless each one is unique.
- Keep archive/feed density intact; do not add large framed thumbnails to lists.
- If you need to place the image inside post content manually, use the existing
  Eleventy image shortcode rather than Markdown image syntax.
- Permanent thumbnail batches should update `docs/CHANGELOG.md` and
  `versions.json` according to the repo playbook.
- Treat unrelated worktree changes as user-owned. Do not clean or revert
  existing deleted temp/source files unless explicitly asked.

---

# Part B: Inline diagrams

Hand-drawn whiteboard diagrams embedded in post bodies. Their job is to replace
ASCII box art and crude comparison layouts with something that reads as drawn by
a person at a workbench.

> **Routing:** Qwen-Image is fine for illustrations and loose tiers, but it
> paints arrows rather than connecting boxes. On a 6-node decision tree it
> spelled every label right and got the flow logic wrong on all 4 seeds. For
> anything where topology or numbers must be exact (decision trees, flows with
> 5+ nodes, any chart), use **Part C** instead.

## When to replace an ASCII block (and when not to)

Replace it when the block is a **diagram**: boxes joined by arrows, tiers,
a pipeline, a before/after comparison, a topology.

Leave it alone when it is **text that must stay text**: terminal output, logs,
file trees, directory listings, config, a budget or arithmetic column, anything
a reader might copy. A drawn picture of a file tree is worse than the fenced
block. Also do not draw a chart: use `{% progression_chart %}` or a table.

Decision order: table first if it's rows and columns, fenced code if it's
copyable, sketch only if spatial relationships carry the meaning.

## House style

- Flat 2D whiteboard sketch, tldraw/Excalidraw feel: rough marker, slightly wobbly lines
- Ink palette: black outlines plus cobalt blue accent. Nothing else
- No 3D, CGI, gradient, glow, drop shadow, or paper texture
- Square-ish or landscape composition, generous gaps between elements
- 3-6 elements. If you need more, split into two diagrams

## Text inside the image

Image models misspell and drop characters, and tiny text is illegible once the
page scales it down.

- Labels only: 1-4 words each, at most ~8 labels
- Put numbers that must be exactly right (bandwidths, sizes) in the label
  string verbatim in the prompt, then **verify every character** after
- Never ask for sentences, legends, or a paragraph of annotation. Put that in the caption
- If a label keeps coming out wrong after 3 seeds, drop it from the prompt and
  say it in the caption instead

## Prompt pattern

```
Hand-drawn technical whiteboard architecture diagram, tldraw excalidraw style,
rough ink marker sketch on flat solid white paper background. Flat 2D layout.
[SPECIFIC DIAGRAM: each box with its exact label, each arrow with direction and
its exact label]. Loose rough marker strokes, minimal black and cobalt blue ink,
completely 2D flat, no 3D render, no CGI.
```

Negative prompt:

```
3D render, CGI, glossy, neon glow, cyber, realistic photo, darkness, black
background, shiny surfaces, complex rendering, bevel, gradient blob, drop
shadow, paper texture, vignette
```

Write arrows explicitly: "arrow from X pointing down to Y, labeled 'PCIe 4.0
31.5 GB/s'". Vague arrow prompts produce ambiguous arrowheads, which is the most
common failure (see review rubric).

## Prompt lessons from real runs

- Do not draw crossed-out boxes in the flow. The model routes the main arrow
  through them and the diagram reads wrongly. Use plain text labels with a
  blue brace or tag ("deleted") instead.
- State the main path explicitly ("a long straight arrow from A to B along the
  bottom") and add "No arrow passes through any other box."
- Separate a main lane from side branches in the prompt ("two lanes").
- Check every arrow exists. One seed silently dropped the arrow between two boxes.

## Releasing the GPU (do this exactly)

`pkill -f` patterns match your own shell command and kill it. Find ComfyUI by
pid instead, confirm VRAM is free, and only then restart the LLM server:

```bash
for p in $(nvidia-smi --query-compute-apps=pid --format=csv,noheader); do
  case "$(ps -o args= -p $p)" in *"port 8188"*) kill $p;; esac
done
sleep 4; nvidia-smi --query-gpu=memory.used --format=csv,noheader   # expect ~44 MiB
systemctl --user start llama-swap.service
```

**Stopping `llama-swap` can leave its `llama-server` child running** (journal:
"Unit process ... remains running after unit stopped"), still holding ~8-10 GB of
VRAM. After the stop, check `nvidia-smi`; if VRAM is not ~44 MiB, kill the
orphaned `.../vendor/llama.cpp/build/bin/llama-server` by pid before starting
ComfyUI, and again before restarting `llama-swap`.

**`llama-swap` listens on `:8080`, the same port Eleventy defaults to.** If the
dev server is started while `llama-swap` is down, `llama-swap` cannot bind,
crash-loops (exit 1, `start-limit-hit`), and leaves an orphan `llama-server`
each time. Start `llama-swap` first so Eleventy falls through to `:8081`, or stop
the dev server before restarting `llama-swap`. Recover with
`systemctl --user reset-failed llama-swap.service` then `start`.

Never launch ComfyUI while `llama-swap` is still running. The system Python has
no `requests`; use `urllib` for the API script.

## ComfyUI API workflow

```python
import requests, time

COMFY = "http://127.0.0.1:8188"
workflow = {
    "10": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2.1_int8_convrot.safetensors", "weight_dtype": "fp8_e4m3fn"}},
    "11": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen3vl_8b_int8_convrot.safetensors", "type": "qwen_image", "device": "default"}},
    "12": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_2.1_vae_bf16.safetensors"}},
    # One node encodes both prompts. Outputs: 0=positive, 1=negative, 2=latent.
    # (Older docs used separate "text" nodes; those inputs no longer exist.)
    "13": {"class_type": "TextEncodeQwenImage21", "inputs": {"clip": ["11", 0], "prompt": "POSITIVE PROMPT", "negative_prompt": "NEGATIVE PROMPT", "resolution": 1024}},
    "15": {"class_type": "EmptyLatentImage", "inputs": {"width": 1280, "height": 960, "batch_size": 1}},
    "16": {"class_type": "KSampler", "inputs": {"model": ["10", 0], "positive": ["13", 0], "negative": ["13", 1], "latent_image": ["15", 0], "seed": 42, "steps": 25, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}},
    "17": {"class_type": "VAEDecode", "inputs": {"samples": ["16", 0], "vae": ["12", 0]}},
    "18": {"class_type": "SaveImage", "inputs": {"images": ["17", 0], "filename_prefix": "my_diagram"}},
}
pid = requests.post(f"{COMFY}/prompt", json={"prompt": workflow}).json()["prompt_id"]
while pid not in requests.get(f"{COMFY}/history/{pid}").json():
    time.sleep(2)
```

Use a landscape canvas for wide diagrams (comparisons) and portrait for vertical
stacks, rather than the default square: square canvases leave dead space that
then has to be trimmed. Generate 3-4 seeds per diagram and pick the best; the
cost is seconds each.

## Background removal: `utils/prepare-diagram.mjs`

```bash
node utils/prepare-diagram.mjs /home/kchauhan/media-output/comfyui/my_diagram_00001_.png \
  src/static/img/diagrams/<post-slug>-<what>.png
```

It un-mattes against white, so the alpha comes from how dark each pixel is and
ink keeps its true colour. It trims and pads.

**Do not use `prepare-sketch.mjs` for diagrams.** It keys on a fixed warm paper
colour `[252, 250, 244]`. Qwen's paper is cooler (about `[250, 250, 254]`), so
nothing matched: the previous diagrams shipped with 0.3% transparent pixels and
a ~96% semi-transparent haze that turned into a grey slab under `dark:invert`.
Never use a flat luminance threshold either; it eats antialiased ink edges.

Always verify after processing:

```bash
node -e 'const s=require("sharp");s("OUT.png").ensureAlpha().raw().toBuffer({resolveWithObject:true}).then(({data})=>{let t=0;for(let i=3;i<data.length;i+=4)if(!data[i])t++;console.log("clear%",(100*t/(data.length/4)).toFixed(1))})'
```

Expect roughly 85-95% fully clear. Under ~50% means paper haze survived.

## Embedding

```njk
{% image_cc "./src/static/img/diagrams/<slug>.png",
   "Alt text that states what the diagram shows, including its labels",
   "sketch-draw",
   "Caption: carries the detail the labels can't" %}
```

- Always pass exactly `sketch-draw` as the class. It applies the dark-mode
  treatment (`invert` plus `hue-rotate(180deg)`, so cobalt stays blue instead of
  turning yellow) and the left-to-right ink wipe on scroll (`src/static/js/ink.js`).
  Do not hand-write `dark:invert`.
- No `rounded-*`, no `shadow-*`, no border: the sketch sits directly on paper.
  The design language is squarish and flat.
- Size is governed by the post layout (figures cap at 44rem wide, 20rem tall).
  Do not add `w-full`/`max-w-*` utilities.
- Alt text describes content, not style. "Three-tier memory hierarchy: VRAM
  (hot experts) above DDR5 (cold experts) above NVMe (n-gram table)" beats
  "hand-drawn diagram".

## Review rubric (do this for every generated diagram)

Look at the actual image, in both a light and a dark preview, and score it. Do
not commit anything that fails a "must".

Must:
- [ ] Every label spelled correctly; every number matches the post
- [ ] Every arrow's direction is unambiguous, and matches the claim in the text
- [ ] Nothing is labeled with the wrong quantity (e.g. disk size where a table size is meant)
- [ ] Transparent: clear% in the expected range, no haze, no boxed backplate
- [ ] Reads at ~640px wide; smallest text still legible

Should:
- [ ] No large dead zones (re-roll or change aspect ratio)
- [ ] 3-6 elements, one visual centre
- [ ] The diagram says something the surrounding prose doesn't already say better

Record the score and the seed in the commit message or PR notes. A 5/10 diagram
that's merely "OK" is worse than the ASCII block it replaces: re-roll or keep
the block.

## Storage and checklist

- [ ] Decided a sketch beats a table or fenced block (see "When to replace")
- [ ] Asked before stopping `llama-swap`; confirmed VRAM free
- [ ] Generated 3-4 seeds via the HTTP API; picked one by the rubric
- [ ] Stopped ComfyUI, restarted `llama-swap`
- [ ] `node utils/prepare-diagram.mjs`; checked clear%
- [ ] Viewed light and dark previews; every "must" passes
- [ ] Wired with `{% image_cc %}` using class `sketch-draw`
- [ ] Removed the ASCII block it replaces
- [ ] `npm run build`

---

# Part C: Exact diagrams and charts (Excalidraw)

Use when the logic or the numbers must be correct by construction: decision
trees, pipelines with 5+ nodes, and every trend/benchmark chart. The agent writes
elements (or a data spec), Excalidraw draws them with real hand-drawn styling,
and the screenshot loop verifies the result. Spelling and arrow routing cannot
drift the way they do with an image model.

| | B. Qwen diagram | C. Excalidraw |
|---|---|---|
| Labels and numbers | Generated; verify char by char | Exact, from a spec or typed elements |
| Look | Whiteboard marker, varies per seed | Excalifont, hand-drawn, consistent |
| Source of truth | The PNG | `diagrams/<slug>.excalidraw` (commit it) |
| GPU | ~11 GB, stop `llama-swap` | None |
| Reproducible | No (seed-dependent) | Yes; exports are byte-stable |

Tried and verified on the Qwen3.8-27B vs Flash-Next post: a 7-box/6-arrow
decision tree and a 5-bar speed chart, both correct on the first run.

## Setup (no install, no MCP config, no GPU)

Pin the version; `npx -y` otherwise runs whatever is latest. Run from a scratch
dir, never the repo.

```bash
# Run as a bash script (or bash -c). In zsh, `X="npx ..."; $X start` does NOT
# word-split and fails with "command not found", so use a function instead.
xc() { npx -y mcp-excalidraw-server@2.0.0 "$@"; }
xc start                                   # canvas on 127.0.0.1:3000 (check the port is free)
# PNG/SVG export needs a connected browser tab. A headless Firefox counts:
mkdir -p ffprof
(nohup firefox --headless --no-remote --profile "$PWD/ffprof" http://127.0.0.1:3000 >ff.log 2>&1 &)
sleep 20                                    # 12s was not always enough; screenshot then fails silently
xc clear --yes                              # canvas is in-memory; start clean
xc add spec.json                            # elements JSON array
xc describe                                 # text summary: ids, positions, labels
xc screenshot --format png --out "$PWD/out.png"   # must print "success"; if not, the tab isn't connected. LOOK at the image
xc export --out "$PWD/name.excalidraw"      # committable source, byte-stable
xc stop
# Kill the headless Firefox by finding it, not by the launcher pid (that pid is a
# wrapper; the real browser keeps running and holds the profile lock, which makes
# the NEXT run's screenshot fail and silently reuse the old PNG).
for p in $(pgrep -x firefox); do tr '\0' '\n' </proc/$p/environ 2>/dev/null | grep -q '^MOZ_HEADLESS=1' && kill $p; done
```

- `--no-remote` + a throwaway `--profile` keeps this separate from the user's real Firefox: `--no-remote` stops it handing the URL to an already-running instance, and the fresh profile dir means the real profile, tabs, and session are never touched or locked. Delete the profile dir afterwards.
- Stop Firefox by pid (`kill "$(cat ff.pid)"`), not `pkill -f`, which matches and kills your own shell.
- Absolute paths for `--out`. Always `rm` the old PNG first, or confirm its mtime changed: a failed screenshot leaves the previous file in place.
- To edit an existing diagram, `$X import name.excalidraw` instead of `add`.
- Never use `share` (uploads to excalidraw.com).

## Diagrams

Elements are plain JSON. Give boxes `id`, `text`, position and size; connect them
with arrows via `startElementId` / `endElementId` and a `text` label:

```json
{"id":"g1","type":"rectangle","x":100,"y":0,"width":260,"height":90,"text":"Discrete GPU?"},
{"type":"arrow","x":0,"y":0,"startElementId":"g1","endElementId":"m1","text":"NO"}
```

- Gates: black stroke. Outcomes: `#1971c2` stroke, `#d0ebff` fill, `fillStyle: hachure`. Matches the Part B palette (ink + cobalt).
- Use one leaf box per outcome (duplicate "Dense 27B") rather than crossing arrows.
- Lay out on a grid: main spine down, branches right. Always `describe` then screenshot before accepting.

## Charts from data

`utils/chart-to-excalidraw.mjs spec.json > elements.json` turns a spec into bars
(`bars`) or a line chart (`points`, the same shape as the `{% progression_chart %}`
shortcode), with axis, ticks, grid and value labels, so every position is
computed from the data. Bar chart:

```json
{ "title": "Decode speed, RTX 4070 12GB", "unit": "t/s", "max": 100, "step": 20,
  "bars": [ { "label": "27B · llama.cpp", "value": 36.7, "text": "36.7" },
            { "label": "Flash-Next · Strata, steady", "value": 53.2, "range": [53.2, 62.6], "text": "53–63", "accent": true } ] }
```

- `accent: true` = cobalt (the subject), otherwise grey/ink. `range` adds a whisker.

Line chart (`points`; `highlight: true` fills the marker; keep `lbl` under ~12
characters and `sub` under ~14 so 9 points fit at `width: 1000`):

```json
{ "title": "Flash-Next decode throughput by runtime, RTX 4070 12GB", "unit": "t/s",
  "minY": 0, "maxY": 100, "step": 20, "width": 1000,
  "points": [ { "val": 6.5, "lbl": "Powersave", "sub": "Aug 27 base" },
              { "val": 60.3, "lbl": "Strata", "sub": "Dynamic cache", "highlight": true } ] }
```

Put the long stage-by-stage description in the figure caption, not in the image.
- Put quant/engine caveats **in the label** (e.g. "burst (Q2_0)"), not only the caption.
- Layout constants (400 px label gutter, 6 px per unit) are tuned for ~30-character labels and a 0-100 scale. Adjust `AX` / `SCALE` for others, then re-screenshot.
- Check bar ends against the gridlines and every printed number against the post's table.

## Finishing (same as Part B)

```bash
node utils/prepare-diagram.mjs out.png src/static/img/diagrams/<post-slug>-<what>.png   # expect ~85-95% clear
```

Commit the source beside the image: `diagrams/<post-slug>-<what>.excalidraw` (and
`.spec.json` for charts) so it can be re-imported and updated. Embed with
`{% image_cc ... "sketch-draw" ... %}` exactly as in Part B (alt text states the
content and numbers).

**Do not rasterize the exported SVG with sharp/librsvg.** The font is embedded
as a data-URL `@font-face`, which librsvg ignores, so digits and text render
wrong. Browsers are fine. Use the browser-rendered PNG, or inline the SVG.

## Checklist

- [ ] Chose Part C because logic/numbers must be exact (else Part B)
- [ ] Port 3000 free; version pinned; canvas and Firefox stopped afterwards
- [ ] `describe` matches the spec; looked at the screenshot
- [ ] Every number/label checked against the post; caveats are in labels
- [ ] `prepare-diagram.mjs`; clear% 85-95; checked a dark preview
- [ ] Committed `.excalidraw` (+ `.spec.json`) in `diagrams/`
- [ ] Embedded with `sketch-draw`; `npm run build`

## Open items

- **Dark mode for SVG exports.** The exported SVG uses fixed colours. Either
  recolour with `currentColor`, or invert like the PNGs (`sketch-draw`). Test
  both on a real post page before choosing; not yet decided.
- **A chart has not yet been through the light/dark preview check.**
