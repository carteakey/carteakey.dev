---
name: update-skill
description: >
  Refresh a skill in .agents/skills/ that is vendored from an upstream repo (for
  example humanizer from blader/humanizer), or recalibrate a personal-voice skill
  (human-writer) against the author's real posts. Use when asked to "update",
  "refresh", "check the latest version of", or "calibrate" a skill.
---

# Updating skills

Two cases. Pick one, do not blend them.

| | A. Vendored skill | B. Personal-voice skill |
|---|---|---|
| Example | `humanizer` (upstream: blader/humanizer, MIT) | `human-writer` (the author's own fingerprint) |
| Source of truth | The upstream repo | The author's posts (`authored_by: human`) |
| Method | Clone upstream, copy it in pristine | Measure the corpus, rewrite the claims |
| Local rules go | In a *separate* skill, never in the vendored file | In the skill itself, backed by a table |

## A. Vendored skill from upstream

1. **Find the latest version.** `WebSearch` the project (`<owner>/<repo> releases`), then `WebFetch` its releases page for the changelog between the local version and latest. Note what changed (patterns added, merged, workflow rules). Local version is in the SKILL.md frontmatter (`version:` or `metadata.version`).
2. **Clone, do not fetch the file.** `WebFetch` refuses to return a whole file verbatim and only summarises. Use git:
   ```bash
   S=$SCRATCHPAD
   git clone --depth 1 https://github.com/<owner>/<repo> $S/<name>-up
   git -C $S/<name>-up log -1 --format='%h %ad %s' --date=short
   ```
3. **Check the license** (`$S/<name>-up/LICENSE`). Only vendor if it allows it (MIT is fine). Copy `LICENSE` next to `SKILL.md`.
4. **Look for local customizations before overwriting.** `grep -n -i -E 'carteakey|human-writer|eleventy|\{%|blog' <local>/SKILL.md` and `git log -- <local-skill-dir>`. If the local copy has repo-specific edits, move them into a separate skill (or this repo's `human-writer`) first. Never leave local edits inside the vendored file: they make the next update a merge instead of a copy.
5. **Replace directly.**
   ```bash
   cp $S/<name>-up/SKILL.md .agents/skills/<name>/SKILL.md
   cp $S/<name>-up/LICENSE  .agents/skills/<name>/LICENSE
   ```
   Skip upstream's `agents/`, `scripts/`, README unless the skill needs them.
6. **Verify.** Frontmatter `name` matches the folder, the version is the new one, and `grep -c '^### '` gives roughly the pattern count the release notes promise.
7. **Record it.** Add a line to `docs/CHANGELOG.md` and update the memory note (`writing-voice-calibration.md`) if the update method changed.

Rules: keep upstream pristine; do not paraphrase or "improve" the vendored file; do not invent changes the release notes do not mention.

## B. Personal-voice skill (`human-writer`)

The skill must describe what the author *actually* does, not what a model assumes. Verify every claim against the corpus.

1. **Measure.** From the repo root:
   ```bash
   python3 .agents/skills/human-writer/scripts/calibrate.py
   ```
   It compares posts and notes by `authored_by` (human vs ai-assisted vs ai-generated) on sentence rhythm, dashes, contractions, pronouns, bold, numbers, bullets, and tell words.
2. **Check each existing claim against the table.** Keep what the data supports. Correct what it contradicts. Delete claims that do not discriminate (a trait shared by human and AI text is not a fingerprint).
3. **Write hard targets** (numbers per 1k words) plus a "what does NOT discriminate" list so nobody over-corrects. Note the corpus size and date at the top of the section.
4. **Deliberate choices stay.** Rare, earned things like the swearing in "what in the fuck?" are voice. Record them as intentional so editing passes do not sanitise them.
5. **Re-run `calibrate.py` after editing a post** to confirm the draft moved toward the baseline. Report before and after; say which signals are still far off (usually length and number density for benchmark posts).

## Using the two together

Humanizer first (removes generic AI tells), then check the result against the `human-writer` baseline table (em dashes, contractions, bold, `---`, conclusion heading). The table overrides the humanizer's generic style defaults.

## Gotchas

- Use absolute paths. Do not `cd` into a skill folder: the shell keeps that directory and later relative commands break.
- Other sessions may be editing the same posts. Make edits as guarded replacements (assert the old text exists, skip with a warning if not), not whole-file rewrites.
- A skill folder is untracked until committed, so `git diff` cannot show what changed. Copy the old file to the scratchpad before a big rewrite if you need a comparison.
- `npm run check:content` and `npm run check:design` do not scan skills, but run them after any post edit you make as part of calibration.
