---
name: publish-post
description: >
  Preflight a carteakey.dev post (or note) before it goes live: frontmatter, thumbnail,
  changelog, voice pass with measurable before/after, fact-check against the site's own
  data, links, checks, and a visual check, then flip it from draft to published. Use
  when asked to publish, ship, finalize, review, or "get this post ready", and as the
  last step after writing or editing a post.
---

# Publish a post

**Status: draft.** A chain over skills and checks that already exist, plus a
fact-check step distilled from the problems found in the overfit-engines post
(spec mismatches, a `file://` link, unsourced claims, a bandwidth calculation that
was wrong by 5x). Run the steps in order; stop and report on any failure.

## 1. Frontmatter (see `docs/POST_FRONTMATTER.md`)

- `title`, `description`, explicit `date` (never rely on file times), `updated`
  when it changed after publishing.
- `tags`: **1 to 2**, Title Case, and reuse an existing tag. A new tag has to be
  added to the registry deliberately (`check:design`).
- `authored_by`: exactly `human`, `ai-assisted`, or `ai-generated`. Not `hybrid`.
  Ask the owner if unsure; do not guess.
- **`image` and `imageAlt` are required** and the file must exist
  (`src/static/img/blog-sketches/unique/<slug>-stamp-trim.png`). Make it with the
  `sketches` skill, Part A.
- Visibility: `hidden: true` = private (excluded from collections, banner shows);
  `draft: true` = public and listed but flagged, never featured. Publishing means
  `draft: false` and no `hidden`. Pinning/featuring is the owner's call.
- If the post changed after first publish: a trailing `## Changelog` table,
  `| Date | Note |`, **newest first**, and `updated` equal to the newest row.

## 2. Structure and primitives (AGENTS.md rule 6)

- Only documented primitives (callout, update, define, sidenote, annotate, wide,
  analysis, gallery, progression/diagram chart, `image_cc`, tables, fenced code).
  No raw HTML or utility classes in the body.
- Blockquotes only for real quoted material, not as callouts or italic asides.
- ASCII box diagrams become sketches (`sketches` skill); copyable text stays in
  fences; tables stay tables.
- Images use the shortcodes, never `![]()`. Diagrams use class `sketch-draw`.
- No `---` rules between sections and no recap "Conclusion" heading unless the
  owner wants one (they rarely use either).

## 3. Voice

1. Run the `humanizer` skill for generic AI tells.
2. Check the result against the `human-writer` baseline table. Measure, do not guess:

   ```sh
   python3 .agents/skills/human-writer/scripts/calibrate.py     # corpus baseline
   ```
   For one file, load it through the same `metrics()` function and compare
   before and after. Targets per 1k words: **0 em dashes**, ~12 contractions,
   ~21 first-person pronouns, ~8 bold. Say which signals are still far off
   (length and number density on benchmark posts are the usual ones).
3. Deliberate voice stays. Rare, earned swearing ("what in the fuck?") is the
   owner's and is not edited out.

## 4. Fact-check

The humanizer's no-fabrication rule applies to your edits; this step catches the
author's and the model's slips.

- **Hardware and specs** must match the device sheet, which is the source of
  truth: `src/devices/yeti-cachy.md` (i5-12600K 6P+4E, RTX 4070 12 GB, 64 GB
  DDR5-5600, WD Black SN770 2 TB). Use `{% device "yeti-cachy" %}` instead of
  retyping specs. Grep sibling posts for conflicting figures.
- **Numbers**: recompute any arithmetic in the prose (the overfit post claimed
  75 GB/s / 0.77 GB = 20-22 tok/s; it is ~97). Check totals, percentages and
  speedups against the table in the same post.
- **Measured vs claimed**: a number the author did not measure is labeled as an
  estimate or attributed. Flag unsourced superlatives and invented precision
  ("48 hours", "40 engineer-years").
- **Links**: no `file://` or local paths. Check external links resolve
  (`curl -sI -m 10 -o /dev/null -w '%{http_code}' <url>`), internal links exist in
  the built output, and posts that moved have a `_redirects` entry for the old URL.
- **Names and projects** the post depends on (repos, PR numbers, model names) are
  linked or clearly marked unverified. Never invent a source.

## 5. Checks and look

```sh
npm run check:content && npm run check:design && node utils/check-version.mjs
npx eleventy --output=$SCRATCHPAD/site-test --quiet           # never over a running dev server
```

Then the `visual-check` skill on the post in light, dark, and mobile.

## 6. Flip and ship

Set `draft: false` / remove `hidden`, add the changelog row, update `docs/CHANGELOG.md` and
`versions.json`, and commit with `commit-batches`. After it is live, offer the
syndication skills (`cross-platform-distribution` for blog posts,
`notes-twitter-sync` for notes) and the newsletter picks it up in the Friday digest.

## Report

List each step as done, skipped (why), or failed, with the specific findings
(fixed vs left for the owner).
