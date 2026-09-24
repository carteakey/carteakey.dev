---
name: downloads-media-router
description: >
  Batch scan, categorize, and route downloaded images and screenshots from ~/Downloads
  (or inbox/) into carteakey.dev's four destinations: vibes gallery, AI memes folio,
  infographics staging (imgcart / img.carteakey.dev), or NOTA (skip/preserve).
---

# Downloads Media Router Skill

Use this skill when the user has accumulated downloaded images, screenshots, memes, diagrams, or benchmarks in `~/Downloads` (or `inbox/`) and wants to sort and import them across `carteakey.dev` and `img.carteakey.dev`.

There are **4 content destinations**:
1. **a) Vibes Page (`src/static/img/vibes/`)**: General memes, aesthetic illustrations, internet culture, and quotes.
2. **b) AI Memes Folio (`src/static/img/folio/ai-memes/` + `src/_data/ai-memes.yaml`)**: Memes specifically satirizing AI models, agents, prompt engineering, rate limits, and AI labs.
3. **c) Infographics / Technical Diagrams (`inbox/imgcart/` and `~/Downloads/imgcart/`)**: High-resolution architecture diagrams, cost analyses, benchmarks, and model timelines staged for upload to `img.carteakey.dev`.
4. **d) NOTA (None of the Above)**: Personal documents, receipts, private photos, and duplicates to leave intact in Downloads or ignore.

---

## Workflow

### Step 1 — Fast OCR Scan & Metadata Extraction

Never guess or inspect images one-by-one by hand. Use macOS's built-in `Vision` framework via the pre-bundled Swift script to extract headline text across all downloads in ~2 seconds:

```bash
swiftc -O .agents/skills/downloads-media-router/scripts/scan-downloads.swift -o /tmp/scan_dl && /tmp/scan_dl
```

This outputs each filename alongside recognized text snippets. Use `view_file` on binary images only when visual layout or memes require human inspection (e.g., textless visual memes or artwork).

---

### Step 2 — Propose Classification Table

Compile and present a breakdown table grouped by the 4 buckets before performing any copies:

| Destination | File | Detected Content / Purpose | Proposed Action / Slug |
|---|---|---|---|
| **Vibes** | `xyz.webp` | Dog meme in truck | `thug-dog-in-truck.jpg` |
| **AI Memes** | `abc.png` | Claude rate limit cycle | `claude-rate-limit-cycle.webp` |
| **Imgcart** | `def.png` | Homelab topology diagram | `homelab-overview-topology.png` |
| **NOTA** | `doc.jpg` | Personal receipt / headshot | Leave untouched |

Ask the user to approve the routing.

---

### Step 3 — Execution Rules per Destination

#### Destination A: Vibes (`src/static/img/vibes/`)
- Target directory: `src/static/img/vibes/`
- Supported extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`.
- Normalize double extensions (e.g. rename `.jpg.webp` to `.webp`).
- Use lowercase kebab-case slugified filenames (e.g., `radiohead-ketchup-at-mcdonalds.webp`).
- `src/_data/vibes.js` automatically detects all images in this folder at build time. No YAML edits required.

#### Destination B: AI Memes Folio (`src/folio/agent-tick/`)
- Image directory: `src/static/img/folio/ai-memes/`
- Data file: `src/_data/ai-memes.yaml`
- Copy image with a clean slug.
- Read existing `src/_data/ai-memes.yaml` to find the current highest ID (e.g., `"040"`).
- Prepend new entries at the **top** of `src/_data/ai-memes.yaml` in descending order (`"057"`, `"056"`, ...).
- YAML entry schema:
```yaml
- id: "041"
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

#### Destination C: Infographics (`imgcart` / `img.carteakey.dev`)
- Target staging directories:
  - `inbox/imgcart/` (repo staging, git-ignored)
  - `~/Downloads/imgcart/` (local user downloads staging)
- Slugify technical filenames (e.g., `ai-startups-500m-run-rate.jpeg`, `local-models-accuracy-and-memory.png`).
- These are prepared for direct drag-and-drop batch upload into `https://img.carteakey.dev`.

#### Destination D: NOTA
- Leave original files in `~/Downloads` untouched.
- Skip personal receipts, personal tickets, headshots, sensitive screenshots, and duplicates.

---

### Step 4 — Verification & Version Bump

1. Run a site build to verify image discovery and YAML syntax:
   ```bash
   npm run build
   ```
2. Bump patch version in `versions.json`:
   ```json
   {
     "version": "2.6.x",
     "releasedAt": "YYYY-MM-DD"
   }
   ```
3. Add entry to `docs/CHANGELOG.md` under current date:
   ```markdown
   ## [2.6.x] - YYYY-MM-DD
   ### Added
   - Folio: Imported [N] new AI memes to the Agent Tick archive (`src/_data/ai-memes.yaml`).
   - Vibes: Added [N] new visuals to the vibes gallery (`src/static/img/vibes/`).
   ```

---

### Step 5 — Commit & Cleanup

1. Commit changes to `main`:
   ```bash
   git add docs/CHANGELOG.md versions.json src/_data/ai-memes.yaml src/static/img/folio/ai-memes/ src/static/img/vibes/
   git commit -m "feat(media): import [N] ai-memes to folio and [N] visuals to vibes"
   ```
2. Clean up original imported files from `~/Downloads` (leaving NOTA files and `~/Downloads/imgcart/` intact).
3. Remind user of unpushed batch status (aim for 5–10 commits per push to conserve Netlify minutes).
