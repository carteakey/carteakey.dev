---
name: downloads-media-router
description: >
  Batch scan, categorize, and route downloaded images and screenshots from ~/Downloads
  (or inbox/) into carteakey.dev's four destinations (vibes gallery, AI memes folio,
  infographics staging, or NOTA) using local decision models via Sortling.
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

### Step 1 — Decision Model Classification with Sortling

Do NOT guess, read files manually, or rely on fragile OCR scripts. Run `sortling.py` in dry-run mode with the `inbox` profile. Sortling uses local decision models (`local-d3` or `local-clef` via `llama-swap` on `:8080`) to evaluate images semantically and visually against the four buckets in under a second per image:

```bash
SORTLING="${SORTLING_PATH:-$HOME/repos/sortling/sortling.py}"
PROFILE="inbox/.sortling.json"

python3 "$SORTLING" \
  --root "${SOURCE_DIR:-$HOME/Downloads}" \
  --profile-file "$PROFILE" \
  --json \
  --no-progress
```

> **Rules for Sortling in this skill:**
> - **Always dry-run:** Never pass `--apply` to `sortling.py`. Sortling generates the classification plan; this skill handles the site-specific slugs, YAML entries, and destination staging.
> - **Local by default:** Sortling automatically routes through local decision models (`local-d3`, `local-clef`). Do not send personal downloads to hosted backends without user consent.
> - **Fallbacks:** If no model is serving, Sortling falls back to filename keywords and flags `classifier: "keywords"` in the JSON. Inform the user if running in keyword fallback mode.

---

### Step 2 — Propose Classification Table

Parse the JSON output from Sortling (`records` array). Extract `file`, `target_folder`, `confidence`, and `reason`, and generate clean kebab-case slugs for proposed additions.

Present the proposed plan to the user in a Markdown table:

| Destination | File | Confidence / Reason | Proposed Action / Slug |
|---|---|---|---|
| **Vibes** | `xyz.webp` | 89% (aesthetic illustration) | `thug-dog-in-truck.webp` |
| **AI Memes** | `abc.png` | 93% (ai-memes: rate limit cycle) | `claude-rate-limit-cycle.webp` |
| **Imgcart** | `def.png` | 88% (infographics: architecture) | `homelab-overview-topology.png` |
| **NOTA / Review** | `doc.jpg` | 42% (below threshold / personal) | Leave untouched |

Ask the user to confirm the routing before touching any files.

---

### Step 3 — Execution Rules per Destination

#### Destination A: Vibes (`src/static/img/vibes/`)
- Target directory: `src/static/img/vibes/`
- Supported extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`.
- Normalize double extensions (e.g. rename `.jpg.webp` to `.webp`).
- Use lowercase kebab-case slugified filenames (e.g., `radiohead-ketchup-at-mcdonalds.webp`).
- `src/_data/vibes.js` automatically detects all images in this folder at build time. No YAML edits required.

#### Destination B: AI Memes Folio (`src/static/img/folio/ai-memes/`)
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

#### Destination D: NOTA & `_review`
- Leave original files in `~/Downloads` untouched.
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
3. Bump patch version in `package.json` and `versions.json`.
4. Add entry to `docs/CHANGELOG.md` under the current date.

---

### Step 5 — Commit & Cleanup

1. Commit changes following conventional commits:
   ```bash
   git add docs/CHANGELOG.md versions.json package.json src/_data/ai-memes.yaml src/static/img/folio/ai-memes/ src/static/img/vibes/
   git commit -m "feat(media): import [N] ai-memes to folio and [N] visuals to vibes"
   ```
2. Clean up original imported files from `~/Downloads` (leaving NOTA files and `~/Downloads/imgcart/` intact).
3. Remind user of unpushed batch status (aim for 5–10 commits per push to conserve Netlify minutes).
