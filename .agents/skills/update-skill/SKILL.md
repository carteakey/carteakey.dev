---
name: update-skill
description: >
  Refresh a skill in .agents/skills/ that is vendored from an upstream repo, or
  recalibrate/refresh parts of the unified personal-voice skill (human-writer). Use
  when asked to "update", "refresh", "check the latest version of", or "calibrate" a skill.
---

# Updating skills

Skills in `.agents/skills/` fall into three categories:

| Category | Example | How to update |
|---|---|---|
| **Author voice & baseline** | `human-writer` (Part 1) | Run `python3 .agents/skills/human-writer/scripts/calibrate.py` to re-measure posts (`authored_by: human`). |
| **Upstream humanizer engine** | `human-writer` (Part 2) | Clone `blader/humanizer` upstream, review changelog, and merge new patterns into Part 2. |
| **Vendored skills** | Upstream repos (MIT) | Clone upstream into scratchpad, copy in pristine with `LICENSE`. |

---

## A. Unified Writing Skill (`human-writer`)

The `human-writer` skill is composed of two parts:

### Part 1: Author Voice & Baseline (carteakey.dev)
1. **Measure from repo root:**
   ```bash
   python3 .agents/skills/human-writer/scripts/calibrate.py
   ```
   It compares posts and notes by `authored_by` (human vs ai-assisted vs ai-generated) on sentence rhythm, dashes, contractions, pronouns, bold, numbers, bullets, and tell words.
2. **Check each existing claim against the table.** Keep what the data supports. Correct what it contradicts.
3. **Write hard targets** (numbers per 1k words) plus a "what does NOT discriminate" list.
4. **Deliberate choices stay.** Rare, earned things like the swearing in "what in the fuck?" are voice. Record them as intentional.
5. **Re-run `calibrate.py` after editing a post** to confirm the draft moved toward the baseline.

### Part 2: Upstream Humanizer Engine
1. **Check latest upstream release:**
   ```bash
   git clone --depth 1 https://github.com/blader/humanizer.git /tmp/humanizer-up
   git -C /tmp/humanizer-up log -1 --format='%h %ad %s'
   ```
2. **Inspect changes:** Check `CHANGELOG.md` or diff `SKILL.md` in upstream against Part 2 of `human-writer/SKILL.md`.
3. **Merge new patterns** into Part 2 while keeping Part 1's author-specific overrides (zero em dashes, Indian context, local style).
4. **Clean up:** `rm -rf /tmp/humanizer-up`.

---

## B. General Vendored Skills from Upstream

1. **Find latest version:** Web search `<owner>/<repo> releases` and check tag notes.
2. **Clone shallowly to scratchpad:**
   ```bash
   git clone --depth 1 https://github.com/<owner>/<repo> /tmp/<name>-up
   ```
3. **Check license:** Ensure license permits redistribution (MIT/Apache 2.0). Copy `LICENSE`.
4. **Replace cleanly:** Copy `SKILL.md` and `LICENSE` to `.agents/skills/<name>/`.
5. **Clean up:** Delete `/tmp/<name>-up`.

## Gotchas

- Use absolute paths. Do not `cd` into a skill folder: the shell keeps that directory and later relative commands break.
- Other sessions may be editing the same posts. Make edits as guarded replacements (assert the old text exists, skip with a warning if not), not whole-file rewrites.
- A skill folder is untracked until committed, so `git diff` cannot show what changed. Copy the old file to the scratchpad before a big rewrite if you need a comparison.
- `npm run check:content` and `npm run check:design` do not scan skills, but run them after any post edit you make as part of calibration.
