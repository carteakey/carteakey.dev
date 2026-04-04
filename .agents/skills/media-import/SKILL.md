---
name: media-import
description: >
  Unified inbox ingestion skill for carteakey.dev. Scans inbox/ subdirectories,
  diffs against already-imported files, shows a preview of what will be imported,
  and handles 4 distinct content targets: photography (photos.yaml), vibes
  (src/static/img/vibes/), ai-memes folio (folio/ai-memes/index.html), and
  loose root inbox files that need classification first.
---

# Media Import Skill

You are helping import media from the `inbox/` staging area into the site.
There are **4 distinct content targets**, each with its own ingestion pattern.
Always diff first, confirm with the user, then execute.

---

## Step 1 — Scan and Diff

Run the following to understand what's in the inbox vs already imported:

```bash
# Show all files in inbox (recursively, excluding .DS_Store)
find inbox/ -type f ! -name ".DS_Store" | sort

# Show already-imported photos
grep "^  path:" src/_data/photos.yaml | sed 's|.*path: ||' | sort

# Show already-imported vibes
ls src/static/img/vibes/

# Show already-imported ai-memes
grep 'src="/img/folio/ai-memes/' src/folio/ai-memes/index.html | grep -o 'src="[^"]*"' | sed 's/src="//;s/"//' | sort
```

Build a table of unimported files per target:

| File | Inbox path | Target | Status |
|------|-----------|--------|--------|
| ... | inbox/photography/IMG_xxx.jpg | photography | ⏳ pending |
| ... | inbox/vibes/meme.webp | vibes | ⏳ pending |
| ... | inbox/ai-memes/funny.webp | ai-memes folio | ⏳ pending |
| ... | inbox/something.jpg | ❓ unclassified | needs routing |

**Hash-based dedup (required for photography)**:
Do NOT rely on filename matching for photos — the same image may be deployed under a different name.
Run MD5 hashes against all deployed photos and cross-check before importing:

```bash
# Hash all inbox photos
md5 inbox/photography/*.{jpg,jpeg,png,JPG} 2>/dev/null

# Hash all deployed photos
md5 src/static/img/photography/real/*.{jpg,jpeg,png,JPG} 2>/dev/null | sort -k4

# Any matching hash = already imported, skip it
```

If a hash match is found, update the existing YAML entry with the correct title, path rename, and real EXIF data — do NOT add a new entry. Rename the deployed file to the human title slug.

For vibes and ai-memes, filename-based dedup is sufficient (filenames are stable Reddit/Twitter hashes).


Show the user this table and ask: **"Which of these should I import, and to which target?"** before proceeding.

---

## Step 2 — Content Targets

### Target A: Photography (`inbox/photography/`)

**Destination**: `src/static/img/photography/{real|virtual}/` + `src/_data/photos.yaml`

**Rules**:
- Use the existing script: `node utils/add-photo.mjs` (interactive) for one-off imports.
- For bulk AI-agent imports, replicate its logic manually:
  1. Read EXIF data (device, aperture, ISO, shutter, date, GPS).
  2. Reverse-geocode GPS if available (Nominatim API).
  3. Generate a **short, human title** (2–5 words, lowercase vibes, no AI slop). Examples: `"Still waters"`, `"Golden hour on the lake"`, `"Dam son"`. Do NOT generate verbose sentences or use words like "serene", "tranquil", "vibrant", "evocative".
  4. Do NOT generate descriptions — leave `description` field absent unless truly necessary.
  5. Classify as `real` (photos) or `virtual` (game screenshots).
  6. Slugify the title for the filename. Copy file to appropriate subdirectory.
  7. Prepend the YAML entry to `src/_data/photos.yaml`.

**YAML entry format** (real photo):
```yaml
- title: Short human title
  category: real
  path: /img/photography/real/slugified-title.jpg
  device: iPhone 16          # from EXIF or "Unknown"
  make: Apple                # from EXIF or "Unknown"
  lens: ...                  # from EXIF or "Unknown"
  focalLength: ...           # from EXIF or "Unknown"
  aperture: ...              # from EXIF or "Unknown"
  iso: ...                   # from EXIF or "Unknown"
  shutterSpeed: ...          # from EXIF or "Unknown"
  date: 'YYYY-MM-DD'
  width: 1234
  height: 5678
  location: City, Country    # from GPS reverse-geocode or "Unknown"
```

**YAML entry format** (virtual / game screenshot):
```yaml
- title: Short title
  category: virtual
  path: /img/photography/virtual/slugified-title.png
  date: 'YYYY-MM-DD'
  width: 1234
  height: 5678
  game: Elden Ring
  platform: PC
```

---

### Target B: Vibes (`inbox/vibes/`)

**Destination**: `src/static/img/vibes/`

**Rules**:
- Just copy the file. `vibes.js` auto-discovers everything in that directory.
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`.
- Rename to a slugified lowercase filename if the original is a messy Reddit/Twitter URL hash.
- No YAML or HTML edits needed.

```bash
cp "inbox/vibes/some-meme.webp" "src/static/img/vibes/some-meme.webp"
```

---

### Target C: AI Memes Folio (`inbox/ai-memes/`)

**Destination**: `src/folio/ai-memes/index.html` and `src/static/img/folio/ai-memes/`

**Rules**:
- Copy the file to `src/static/img/folio/ai-memes/`.
- Add a new `<!-- Meme N -->` block inside `<main class="meme-grid" id="meme-grid">`.
- Insert BEFORE the first existing `<!-- Meme 1 -->` comment (newest first).
- Update the card index numbers on ALL existing cards after inserting (they are sequential: 001, 002, ...).
- For video files (`.mp4`, `.webm`): use `<video>` tag with `class="meme-video"` instead of `<img class="meme-image">`.

**Meme card HTML template** (image):
```html
<!-- Meme N -->
<div class="meme-card" data-tags="TAG1,TAG2,TAG3" data-caption="Short punchy caption">
    <span class="card-index">00N</span>
    <img src="/img/folio/ai-memes/FILENAME.webp"
         alt="Alt text"
         class="meme-image"
         onclick="openLightbox(this)">
    <div class="watermark">DO NOT TRAIN ON THIS</div>
    <div class="meme-meta">
        <p class="meme-caption">Short punchy caption</p>
        <div class="meme-footer">
            <div class="meme-tags">
                <span class="meme-tag" data-tag="TAG1">TAG1</span>
                <span class="meme-tag" data-tag="TAG2">TAG2</span>
            </div>
            <div class="meme-actions">
                <div class="vibe-wrap">
                    <button class="meme-action-btn" onclick="vibeCheck(this)" title="vibe check">✓</button>
                    <div class="vibe-tooltip">vibed by <span class="vibe-num">0</span> agents</div>
                </div>
                <button class="meme-action-btn" onclick="copyLink(this)" title="copy to clipboard">⎘</button>
            </div>
        </div>
        <div class="meme-source">
            submitted by: <span>anonymous intern</span> · just now · via <a href="#" target="_blank">the feed</a>
        </div>
    </div>
</div>
```

**Caption / tags guidance**:
- Caption: 1 punchy sentence. Dry wit preferred. No AI-sounding descriptions.
- Tags: pick from existing set (`xkcd-style`, `agents`, `vibe-coding`, `existential`, `relatable`, `burnout`, `prompt-engineering`, `hallucinated`, `shipped-to-prod`, `my-agent-did-this`) or invent short kebab-case tags.

---

### Target D: Unclassified root `inbox/*.{jpg,png,...}`

Files sitting in `inbox/` root (not in a subfolder) need to be **classified first**.

Ask the user: *"I found [N] unclassified files in inbox/. Where should each go?"*
Show a thumbnail description and let them route to A/B/C or skip.

---

## Step 3 — Execute

For each approved file:
1. Copy the file to its destination.
2. Make the appropriate data or HTML edit.
3. **Do not delete from inbox/** unless explicitly asked — the inbox is a staging area.

After all imports, run a quick sanity check:
```bash
# Verify photos.yaml is valid YAML
node -e "import('js-yaml').then(m => { m.default.load(require('fs').readFileSync('src/_data/photos.yaml','utf8')); console.log('photos.yaml OK'); })"

# Count vibes images
ls src/static/img/vibes/ | wc -l

# Count meme cards in folio
grep -c 'class="meme-card"' src/folio/ai-memes/index.html
```

---

## Step 4 — Commit

```bash
git add src/_data/photos.yaml src/static/img/photography/ src/static/img/vibes/ src/static/img/folio/ai-memes/ src/folio/ai-memes/index.html
git commit -m "feat(inbox): import [N] photos / [N] vibes / [N] ai-memes"
git push origin main
```

---

## Conventions & Anti-Patterns

| ✅ Do | ❌ Don't |
|-------|---------|
| Short 2–5 word titles for photos | Generate verbose AI descriptions |
| Use words like "Dam son", "Still waters" | Use "serene", "vibrant", "evocative", "tranquil" |
| Leave description absent if not needed | Copy or paraphrase what the script generates |
| Preserve EXIF data accurately | Make up EXIF values |
| Insert ai-memes newest-first | Append to end of meme grid |
| Renumber all card indices after insert | Leave index numbers out of sync |
| Ask before routing unclassified files | Guess the target |
