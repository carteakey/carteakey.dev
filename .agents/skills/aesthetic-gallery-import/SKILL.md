---
name: aesthetic-gallery-import
description: >
  Shortlist the best-looking photos in the Apple Photos library by Apple's own
  aesthetic score (via cartebase), export them from the Mac, let the author pick,
  and import the keepers into /gallery/ with the score in each caption. Use when
  asked to "export my most aesthetic photos", "refresh the gallery from Photos",
  or add top-scoring photos to the gallery.
---

# Aesthetic gallery import

Four hosts and hands are involved. Keep them straight:

| Step | Where | Who runs it |
|---|---|---|
| 1. Shortlist | m1 (`~/repos/cartebase`), over SSH is fine | agent |
| 2. Export images | m1, **Terminal in the logged-in macOS session** | author |
| 3. Pick | any machine | author, agent proposes |
| 4. Import | carteakey.dev checkout | agent |

The score is `overall_aesthetic_score` from Photos' on-device analysis, read into
`cartebase.db` by the Apple Photos importer. Apple does not document how it is
computed. Treat it as a ranking hint, not a verdict, and say so wherever it is shown.

## 1. Shortlist (agent)

```bash
ssh m1 'cd ~/repos/cartebase && python3 exporters/top_aesthetic_photos.py --limit 40'
```

- Writes `data/exports/top-aesthetic/uuids.txt` and `manifest.json` (score, date,
  camera, composition/lighting/subject sub-scores per UUID).
- Default filters: camera photos only, no screenshots, hidden or trashed photos,
  score ≥ 0.6, and exact `0.5` is skipped (Photos' "not analysed yet" placeholder).
- **People, documents and screens are excluded by default** (scene labels such as
  `people`, `selfie`, `portrait`, `child`, `document`, `receipt`). The gallery is public.
  Only pass `--include-people` if the author asks, and then review every photo with them.
- `--since YYYY-MM-DD` limits to recent photos; `--exclude-uuids rejects.txt` skips
  photos already turned down in an earlier round.
- If `cartebase.db` is older than the library (check `summary.json` `last_updated`),
  say so: re-running the Apple Photos importer comes first.

## 2. Export the files (author, on the Mac)

Most originals live in iCloud, not on disk, so they come out through osxphotos with
PhotoKit. PhotoKit needs the GUI session's Photos permission, which an SSH shell does
not have. Ask the author to paste this into Terminal on m1:

```bash
cd ~/repos/cartebase && uvx osxphotos export data/exports/top-aesthetic/images \
  --uuid-from-file data/exports/top-aesthetic/uuids.txt \
  --download-missing --use-photokit \
  --convert-to-jpeg --jpeg-quality 0.9 \
  --skip-live --filename "{uuid}"
```

The first run asks for Photos access; approve it. Files land as `<UUID>.jpeg`, which
is how step 4 matches them back to their scores.

## 3. Pick (author)

Do not import the shortlist wholesale. A high score is not the same as a photo worth
showing, and nothing automatic catches a house number, a licence plate or a friend
at the edge of the frame.

1. Copy the exports to this checkout's inbox:
   `scp -r m1:repos/cartebase/data/exports/top-aesthetic/images/ src/static/img/photography/inbox/`
   and `scp m1:repos/cartebase/data/exports/top-aesthetic/manifest.json /tmp/top-aesthetic-manifest.json`.
2. Show the author the inbox as a contact sheet (the `visual-check` or browser skills,
   or a quick local page), with each photo's score and date from the manifest.
3. Delete the rejects from the inbox. Append their UUIDs to
   `~/repos/cartebase/data/exports/top-aesthetic/rejects.txt` so the next round skips them.

## 4. Import (agent)

```bash
node utils/bulk-add-photos.mjs --category real --max-edge 1600 \
  --meta /tmp/top-aesthetic-manifest.json --dry-run
```

Check the dry-run output, then run it without `--dry-run`.

- `--max-edge 1600` re-encodes upright JPEGs without metadata, so **no GPS ships**.
  The city-level `location` in `photos.yaml` is reverse-geocoded before the strip.
- `--meta` adds `aestheticScore` and `source: cartebase-top-aesthetic` to each entry.
  The gallery shows the score in the lightbox caption and says in its intro how many
  photos were shortlisted this way.
- Titles and descriptions come from the local vision model (`--model Ollama`, the
  default). Do not switch to a hosted model for personal photos without asking.
- Read every generated title against the photo. Fix ones that are wrong or overclaim
  in `src/_data/photos.yaml`, and run them through the `human-writer` skill.

Then rebuild, open `/gallery/`, and check the new photos and captions in light and dark.

## Done when

- Only photos the author approved are in `src/static/img/photography/real/`.
- Each new `photos.yaml` entry has `aestheticScore` and a checked title.
- `file src/static/img/photography/real/<new>.jpeg` shows no `Exif` GPS data.
- `npm run check` passes; changelog entry under Added or Changed.
