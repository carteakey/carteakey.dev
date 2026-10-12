---
name: media-import
description: >
  Scan, classify, and import media from ~/Downloads or inbox/ across carteakey.dev destinations
  (photography, vibes gallery, AI memes folio, infographics staging, or NOTA) using local decision
  models via Sortling.
---

# Media Import Skill

Use this skill when importing, sorting, or triaging images, screenshots, memes, diagrams, or photographs from `~/Downloads` or the repo's `inbox/` staging area into `carteakey.dev` and `img.carteakey.dev`.

There are **5 content destinations**:
1. **Photography (`src/static/img/photography/{real|virtual}/` + `src/_data/photos.yaml`)**: Camera photos, street photography, landscapes, and game screenshots with EXIF metadata.
2. **AI Memes Folio (`src/static/img/folio/ai-memes/` + `src/_data/ai-memes.yaml`)**: Memes specifically satirizing AI models, agents, prompt engineering, rate limits, and AI labs.
3. **Vibes Page (`src/static/img/vibes/`)**: General memes, aesthetic illustrations, internet culture, and quotes.
4. **Infographics (`inbox/imgcart/` or `~/Downloads/imgcart/`)**: High-resolution architecture diagrams, cost analyses, benchmarks, and model timelines staged for upload to `https://img.carteakey.dev`.
5. **NOTA (None of the Above)**: Personal documents, receipts, private photos, tickets, and duplicates to leave intact.

---

## Workflow

### Step 1 — Decision Model Classification with Sortling

Do NOT guess, read files manually, or rely on fragile regexes. Run `sortling.py` in dry-run mode using the `media-import` profile. Sortling uses local decision models (`local-d3` or `local-clef` via `llama-swap` on port `:8080`) to evaluate images semantically and visually against the categories:

```bash
SORTLING="${SORTLING_PATH:-$HOME/repos/sortling/sortling.py}"
PROFILE=".agents/skills/media-import/profile.json"
SOURCE_DIR="${SOURCE_DIR:-$HOME/Downloads}"  # or "inbox"

python3 "$SORTLING" \
  --root "$SOURCE_DIR" \
  --profile-file "$PROFILE" \
  --json \
  --no-progress

# Clean up Sortling's dry-run cache manifest immediately
rm -rf "$SOURCE_DIR/_sortling"
```

> **Rules for Sortling:**
> - **Always dry-run:** Never pass `--apply` to `sortling.py`. Sortling generates the classification plan; this skill handles slugs, EXIF parsing, YAML entries, and destination staging.
> - **Clean up `_sortling/`:** Sortling writes a dry-run cache in `<root>/_sortling/`. Always delete this directory after JSON capture.
> - **Local by default:** Sortling automatically routes through local decision models on `:8080`. Do not send personal downloads to hosted backends without user consent.
> - **Fallbacks:** If no local model server is reachable, Sortling falls back to filename keywords and flags `classifier: "keywords"` in the JSON. Inform the user if running in keyword fallback mode.

---

### Step 2 — Propose Classification Table

Parse the JSON output from Sortling (`records` array). Extract `file`, `target_folder`, `confidence`, and `reason`, and generate clean kebab-case slugs for proposed additions.

Present the proposed plan to the user in a Markdown table:

| Destination | File | Confidence / Reason | Proposed Action / Slug |
|---|---|---|---|
| **Photography** | `IMG_4821.jpg` | 94% (landscape photo) | `sunset-over-lake-ontario.jpg` |
| **AI Memes** | `abc.png` | 93% (ai-memes: rate limit cycle) | `claude-rate-limit-cycle.webp` |
| **Vibes** | `xyz.webp` | 89% (aesthetic illustration) | `thug-dog-in-truck.webp` |
| **Infographics** | `def.png` | 88% (infographics: architecture) | `homelab-overview-topology.png` |
| **NOTA / Review** | `doc.jpg` | 42% (below threshold / personal) | Leave untouched |

Ask the user to confirm the routing before touching any files.

---

### Step 3 — Execution Rules per Destination

#### Destination A: Photography (`src/static/img/photography/{real|virtual}/`)
- Destination: `src/static/img/photography/{real|virtual}/` + `src/_data/photos.yaml`
- **Hash-based dedup (required)**: Run MD5 hashes against all deployed photos before importing to prevent duplicates under different filenames:
  ```bash
  md5 "$SOURCE_FILE"
  md5 src/static/img/photography/real/*.{jpg,jpeg,png,JPG} 2>/dev/null | sort -k4
  ```
- **Rules**:
  1. Read EXIF data (device, aperture, ISO, shutter, date, GPS).
  2. Reverse-geocode GPS if available (Nominatim API).
  3. Generate a **short, human title** (2–5 words, lowercase vibes, no AI slop). Examples: `"Still waters"`, `"Golden hour on the lake"`, `"Dam son"`. Do NOT use words like "serene", "tranquil", "vibrant", "evocative".
  4. Do NOT generate descriptions - leave `description` field absent unless requested.
  5. Classify as `real` (photos) or `virtual` (game screenshots).
  6. Slugify the title for the filename. Copy file to appropriate subdirectory.
  7. Prepend the YAML entry to `src/_data/photos.yaml`.

```yaml
- title: Short human title
  category: real
  path: /img/photography/real/slugified-title.jpg
  device: iPhone 16
  make: Apple
  date: 'YYYY-MM-DD'
  width: 1234
  height: 5678
  location: Toronto, Canada
```

#### Destination B: AI Memes Folio (`src/static/img/folio/ai-memes/`)
- Image directory: `src/static/img/folio/ai-memes/`
- Data file: `src/_data/ai-memes.yaml` (loaded into Eleventy global `memes` data via `eleventy.config.mjs` and rendered by `src/folio/ai-memes/index.html`)
- Copy image with a clean slug (prefer `.webp` or `.png`).
- Read existing `src/_data/ai-memes.yaml` to find the current highest ID (e.g., `"059"`).
- IDs are formatted as 3-digit zero-padded strings (`"060"`, `"061"`, ...).
- Prepend new entries at the **top** of `src/_data/ai-memes.yaml` in descending order (`"061"`, `"060"`, ...).
- YAML entry schema:
```yaml
- id: "060"
  image: "/img/folio/ai-memes/slugified-filename.webp"
  caption: "Punchy, witty caption (avoid AI buzzwords)."
  tags:
    - "agents"
    - "vibe-coding"
  vibes: 0
  submitter: "anonymous intern"
  time: "just now"
```
- Available tags: `agents`, `vibe-coding`, `relatable`, `existential`, `prompt-engineering`, `burnout`, `hallucinated`, `shipped-to-prod`, `my-agent-did-this`, `xkcd-style`.

#### Destination C: Vibes (`src/static/img/vibes/`)
- Target directory: `src/static/img/vibes/`
- Supported extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`.
- Normalize double extensions (e.g. rename `.jpg.webp` to `.webp`).
- Use lowercase kebab-case slugified filenames (e.g., `radiohead-ketchup-at-mcdonalds.webp`).
- `src/_data/vibes.js` automatically detects all images in this folder at build time. No YAML edits required.

#### Destination D: Infographics (`imgcart` / `img.carteakey.dev`)
- Target staging directories:
  - `inbox/imgcart/` (repo staging, git-ignored)
  - `~/Downloads/imgcart/` (local user downloads staging)
- Slugify technical filenames (e.g., `ai-startups-500m-run-rate.jpeg`, `local-models-accuracy-and-memory.png`).
- These are prepared for direct drag-and-drop batch upload into `https://img.carteakey.dev`.

#### Destination E: NOTA & Private files
- Leave original files untouched in source directory.
- Skip personal receipts, personal tickets, headshots, sensitive screenshots, and duplicates.

---

### Step 4 — Verification & Version Bump

1. Run checks:
   ```bash
   npm run check:content && npm run check:design
   ```
2. Verify build:
   ```bash
   npm run build
   ```
3. If importing significant new media collections, bump patch version in `package.json` and `versions.json`, and record in `docs/CHANGELOG.md`.

---

### Step 5 — Commit & Cleanup

1. Commit changes following conventional commits:
   ```bash
   git add src/_data/photos.yaml src/_data/ai-memes.yaml src/static/img/photography/ src/static/img/folio/ai-memes/ src/static/img/vibes/
   git commit -m "feat(media): import [N] photos / [N] ai-memes / [N] vibes"
   ```
2. Automatically delete the imported files from source (`~/Downloads` or `inbox/`), leaving NOTA files and `imgcart` intact.
3. If `inbox/manifest.yaml` was tracking the imported files, remove their entries from `inbox/manifest.yaml`.
4. Remind user of unpushed batch status (aim for ~5–10 commits per push to conserve Netlify minutes).
