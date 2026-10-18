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

## 3. Voice, Fine-Tuning & Diffing Workbench

Use the two workflows in `human-writer` (`Workflow 1: Writing, Fine-Tuning & Rewriting Practices` and `Workflow 2: Side-by-Side Diffing & Review Workflow`):

1. **Lock a "Before" snapshot before editing** so the owner can review Before vs After side-by-side in the local dev server (`?diff=split-aligned` or `?diff=word-diff`):
   ```sh
   node utils/snapshot-post.mjs <path-to-post.md>
   ```
2. **Choose the right editing mode (`Workflow 1` in `human-writer`):**
   - **Mode A — Light Fine-Tuning (Default for new posts & clean updates):** Keep raw numbers in tables, keep git SHAs/CLI flags in code blocks, eliminate AI tells (Part 2), and hit the voice baseline (Part 1: **0 em dashes**, ~12–18 contractions/1k, ~15–21 first-person pronouns/1k, ~8–13 bold/1k, <18 inline code spans/1k).
   - **Mode B — Full De-Stuffing & Rewriting (For bloated `ai-assisted` / `ai-generated` posts):** Delete bullet lists that repeat benchmark tables, evict commit-hash/PR soup from narrative prose, collapse stacked `{% update %}` boxes into one, and un-backtick model/quant names in prose before polishing voice.
   - **Mode C — Human Post Proofread (`authored_by: human`):** Typo and grammar fixes only — never rewrite voice or cut sections unless explicitly requested.
3. **Check scorecard & review in browser (`Workflow 2` in `human-writer`):**
   ```sh
   node utils/snapshot-post.mjs --diff <path-to-post.md>
   ```
   Review in the browser's `[READABILITY WORKBENCH]` (`Split (Aligned)`, `Word Diff`, `After (Clean)`). Once approved by the owner, clear the local snapshot (`node utils/snapshot-post.mjs --clear <slug>` or `--clear-all`).
4. Deliberate voice stays (rare, earned swearing is not edited out), and the no-fabrication rule applies to all edits: keep all facts, tables, and reproduction commands intact.

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
