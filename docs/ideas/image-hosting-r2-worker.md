# Future plan: move heavy images off git (Cloudflare R2 + Worker)

Status: parked, not started. Written 2026-10-01 from measurements of this repo.
Revisit when a trigger below fires. Not needed today.

## Where the repo is (2026-10-01)

- `.git`: 422 MB, 846 commits, about 40% of GitHub's ~1 GB soft limit. History never shrinks.
- Images: 474 files, about 380 MB, almost all of the repo. 49 blobs over 2 MB in history.
- Biggest folders: `image-generator-battle` 117 MB, `blog-sketches` 77 MB, `photography` 66 MB,
  `projects` 20 MB, `folio` 12 MB. Seven GIFs total 26 MB (one is 11 MB).
- Growth: about 88 image files touched in the last 30 days, mostly sketches.
- Build: a cold build is about 230 s (`eleventy-img` makes avif/webp/jpeg at 4 widths per image;
  `_site/img` is 454 MB). Warm builds with the `.cache` are 3-5 s (`netlify-plugin-cache`).
  Netlify minutes are the constraint (see the batch-push rule in `CLAUDE.md`).

## Triggers: move when any is true

1. `.git` is around 800 MB to 1 GB, or clones and CI checkouts feel slow.
2. Cold builds are over about 5 minutes, or the cache misses often. This is the likely first one.
3. You regularly add photos, GIFs or short video (more than about 50 MB a month).
4. You want to add a photo to a note from your phone without a commit and a rebuild.
5. You want per-device resizing and format negotiation done on the fly, not at build time.

## Do first (cheap, no migration)

- Find out why a cold build ever happens. 230 s means the `.cache` is not surviving some builds.
  Fixing that removes most of the pain.
- Stop adding raw photos and GIFs to git. Put new ones on R2 and leave existing ones alone.

## Keep in git regardless

Small, hand-made, versioned assets: diagrams, Excalidraw sources (`diagrams/`), thumbnails and
stamps, spec files. A few hundred KB, they change with the post, and you want them in dev and in review.
A broken remote link on a diagram is worse than a larger repo.

## Move first (about 200 MB of the 380 MB)

`photography/`, the GIFs, `image-generator-battle/`, and large screenshots. Least reason to be versioned.

## Sketch of the setup

- R2 bucket for originals (zero egress; check Cloudflare's current free limits).
- Serve through a Worker (or Cloudflare image transforms) for resize and format negotiation.
- Reuse the existing `remote_image` / `remote_image_cc` shortcodes; add a small manifest of
  `{ key, width, height, alt }` so layout shift stays at zero without build-time `eleventy-img`.
- An upload helper script (R2 put, then print the shortcode) so the step is one command.

## Costs and risks

- Lose build-time optimization and LQIP unless the Worker provides them.
- Images no longer in git, so they need their own backup and a dev setup that works without them.
- Extra upload step per image.
- Old posts keep working as long as existing images stay in git (migrate folder by folder, with
  redirects or rewritten paths).

## History hygiene: compressing images without duplicating history (2026-10-01)

Git cannot replace a blob in place. A compressed copy has different bytes, so it is a new blob and
the old one stays in history forever. Identical bytes dedupe; recompressed images do not, and binary
delta compression barely helps on images.

Measured: of 412 MB of image blobs ever committed, only 58 MB (14%, 71 blobs) are old versions or
deleted files not in HEAD. 37 MB of that is `tmp/imagegen` (temp generator output committed by accident);
the rest is small (`blog-sketches/unique` 6.5 MB, `llm-benchmarks` 5.6 MB, ...). So the duplication
problem is modest today; the cheap lever is prevention.

Prevention (do these):
- Compress before the first commit. Keep originals outside the repo (local folder or R2). Existing
  helpers: `utils/compress-pngs.mjs`, `utils/prepare-diagram.mjs`, `utils/prepare-sketch.mjs`.
- Add `tmp/` (and generator scratch dirs) to `.gitignore`. It is not ignored today.
- Add an image size guard to `utils/check-content.mjs` (it already runs on commit): fail on, say,
  images over 500 KB or GIFs over 1 MB unless allow-listed.
- Batch edits to an already-committed image into one commit; every re-compression is another blob.

Purging history (only if the numbers justify it):
- `git filter-repo` rewrites every commit hash and needs a force-push, so coordinate all sessions
  (several Claude sessions commit to this repo) and take a backup clone first.
- Drop junk by path: `git filter-repo --path tmp/imagegen --invert-paths` (about 37 MB).
- Drop old versions: build the list of image blob ids not in HEAD and use `--strip-blobs-with-ids`
  (about 58 MB total). Old commits then lack those images, which is fine.
- GitHub keeps old objects reachable (PR refs, forks, cached views) until GC, so the hosted size does
  not drop immediately; a support request can trigger it.
- Not worth doing alone for 37-58 MB of 405 MB. Do it once, together with the R2 migration, when a
  bigger rewrite (`--path src/static/img/photography --invert-paths`, etc.) is already happening.
- Git LFS does not fix existing history (needs `git lfs migrate import --everything`, also a rewrite),
  has GitHub bandwidth quotas, and is clunky on Netlify.
