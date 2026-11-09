---
name: update-now-page
description: >
  Draft and publish the carteakey.dev /now/ page with a strict split between
  Life (human-authored personal updates with `enabled: false` placeholders) and
  Building (agent-gathered 1-liner dev updates from git, Notion Forge,
  commitActivity.json, changelog, and posts/notes), archive the outgoing page,
  and promote the update. Use when asked to "generate a now page", "update /now/",
  or run a periodic /now/ refresh.
---

# Update the /now page (`carteakey.dev`)

## Core Principle: Life (Human) vs. Building (Agent)

The `/now/` page separates what an agent can verify from what only the author can write:

1. **`life` (Rendered under "Life" — Human-Owned)**:
   - Personal, off-screen, and life updates must be written in the author's own words.
   - **Never invent or paraphrase personal updates.** When refreshing `/now/`, either carry forward existing enabled `life` items (if the author wants to keep them) or insert `{ text: "TODO (...)", enabled: false }` placeholders in `src/_data/nowPage.yaml`.
   - Because `src/now.njk` filters `nowPage.life | enabled`, any `enabled: false` placeholder stays completely hidden on the live site until the author writes their line and flips `enabled: true`.
2. **`highlights` & `updates` (Rendered under "Building" — Agent-Driven)**:
   - **Crisp 1-liner** dev/project bullets (1 sentence each, no multi-sentence paragraphs) gathered directly from git history, `src/_data/commitActivity.json`, `docs/CHANGELOG.md`, new posts/notes, and Notion Forge (`/home/kchauhan/repos/context-backup/snapshots/`).
   - `highlights` holds the top 1–2 headline projects; `updates` holds 3–5 shorter 1-liner updates.
3. **Automated Feeds (Below "Building")**:
   - **Shipping**: Monthly commit/PR trends and top active repos (`src/_data/commitActivity.json`). Refresh with `node utils/commit-activity.mjs` + `./utils/render-excalidraw-chart.sh` when requested.
   - **Reading, watching & playing**: Populated automatically from Goodreads, Letterboxd, Strava, and Steam. Do not repeat these in `life` or `updates`.

---

## Periodic Refresh Workflow

### 1. Gather Evidence Since `lastUpdated`

```sh
# 1. Check current lastUpdated and outgoing items
cat src/_data/nowPage.yaml

# 2. Check git commits, changelog, and commitActivity across repos
git log --since=<lastUpdated> --format='%ad %s' --date=short
sed -n 1,60p docs/CHANGELOG.md
cat src/_data/commitActivity.json | head -n 130

# 3. Check newest posts and notes
ls -lt src/posts/**/*.md src/posts/*.md src/notes/*.md | head -n 15

# 4. Check Notion Forge snapshot (if /home/kchauhan/repos/context-backup exists)
ls -lt /home/kchauhan/repos/context-backup/snapshots/ | head -n 5
```

### 2. Archive the Outgoing Page First (Mandatory Rule)

Before replacing `src/_data/nowPage.yaml`, preserve the outgoing snapshot in `src/now/archive/<old-YYYY-MM-DD>.md` (using the date part of the outgoing `lastUpdated`):

```md
---
layout: layouts/home.njk
title: "Now — October 16, 2026"
permalink: "{{ '2026-10-16' | archivePermalink }}"
archiveDate: 2026-10-16
---

<ul class="now-log">
  <li>...</li>
</ul>
```

Include all enabled items from the outgoing `life`, `highlights`, and `updates` lists. If the outgoing `nowPage.yaml` already has the same date as today, update in place without creating a duplicate archive file.

### 3. Write Crisp 1-Liners + Personal Placeholders

Whether staging in `src/now/drafts/YYYY-MM-DD.yaml` (for review) or promoting directly into `src/_data/nowPage.yaml`:

- **1-liner discipline**: Every item in `highlights` and `updates` must be **a single concise line/sentence**. Link the relevant post (`/blog/...`) or page (`/projects/`, `/notes/...`) with plain `<a href="...">`.
- **Voice conventions (`human-writer`)**: First person, contractions, zero em dashes (`—`), use spaced hyphens (` - `) or colons, state concrete numbers (`70.4 tok/s`, `16 models across 7 chip families`) without marketing tropes.
- **Personal placeholders**: Keep 1–2 `enabled: false` slots under `life:` prompting the author for what's happening off-screen:

```yaml
lastUpdated: 2026-11-09T14:45:00-05:00

life:
  - text: "TODO (personal): Recent trip / travel or what life outside the terminal looks like right now."
    enabled: false
  - text: "TODO (off-screen): Routine, Toronto fall/winter, or what I'm spending time on away from keyboards."
    enabled: false

highlights:
  - 'Rooted my Hisense TV (<a href="/blog/alvidaa/alvidaa/">alvidaa</a>) to block its telemetry, run Doom, and replace the ad home screen with an on-TV Go launcher - plus logged my first vendor advisory (<code>VIDAA-PSIRT-2026-005</code>).'
  - 'Building <a href="/projects/">Herding</a>, a native Rust + GPUI desktop client for Herdr to run multi-agent workspaces and git worktrees without Electron.'

updates:
  - 'Pushed <a href="/blog/local-inference/strata-on-an-rtx-4070/">Strata on the 12 GB 4070</a> from 53 up to <strong>70.4 tok/s</strong> on Qwen3.8-Flash-Next with <code>UD-IQ2_XS</code> and adaptive expert fetching.'
```

### 4. Validate YAML & Run Site Checks

```sh
node --input-type=module -e 'import * as y from "js-yaml"; import fs from "fs"; const d=y.load(fs.readFileSync("src/_data/nowPage.yaml","utf8")); console.log(Object.keys(d).join(","), (d.life||[]).length, d.highlights.length, d.updates.length)'
npm run check:content && npm run check:design
```

### 5. Report to the Author

- List the **Building** 1-liners that were promoted and what evidence each came from (commit, post, Forge note).
- Point out the `enabled: false` **`life:`** placeholders in `src/_data/nowPage.yaml` so the author can drop in a personal line and flip `enabled: true` whenever they want.
