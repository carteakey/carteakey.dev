---
name: update-now-page
description: >
  Draft and publish the carteakey.dev /now/ page: gather what actually happened from
  git, the changelog, and new posts and notes, write a draft in the author's voice,
  archive the outgoing page, then promote the draft. Use when asked to "generate a now
  page", "update /now/", or write a "now" update, and whenever nowPage.yaml is about to
  be replaced.
---

# Update the /now page

**Status: draft.** The data shape, archive format, and YAML validation were
checked on 2026-10-01 while producing `src/now/drafts/2026-10-01.yaml`. The
promote step has not been run yet.

## How /now/ is built

- Written part: `src/_data/nowPage.yaml` with three fields:
  `lastUpdated` (ISO 8601 with offset), `highlights` (list of HTML strings) and
  `updates` (list of HTML strings). Each string renders as an `<li>`; links are
  plain `<a href>`.
- The rest of the page (reading, watching, listening, games) fills itself from
  Goodreads, Letterboxd, Spotify, etc. Do not repeat that in the written part.
- Past pages live in `src/now/archive/YYYY-MM-DD.md`.

## Rules (AGENTS.md)

- **Before replacing `nowPage.yaml` content, archive the outgoing page** as
  `src/now/archive/<its lastUpdated date>.md`. If the outgoing page is empty
  (`highlights: []`, `updates: []`), there is nothing to archive; say so.
- Dynamic feed sections need no archive snapshot on each refresh.
- Never invent personal facts (trips, hikes, books, health). Only things the
  record shows, plus clearly marked slots for the author to fill.

## Workflow

1. **Gather evidence** since the last update date:
   ```sh
   git log --since=<lastUpdated> --format='%ad %s' --date=short
   sed -n 1,60p docs/CHANGELOG.md                       # what shipped
   ls -t src/posts src/notes | head                     # new posts and notes (check dates in frontmatter)
   ```
   Pick 2 to 3 highlights (the things the author would tell a friend) and a few
   shorter updates. Link new posts and notes.
2. **Write the draft** in `src/now/drafts/YYYY-MM-DD.yaml` (Eleventy ignores
   YAML here, so it cannot publish by accident). Same three fields as
   `nowPage.yaml`, plus a header comment explaining how to promote it.
   Voice: apply the `human-writer` baseline (first person, contractions, short,
   **no em dashes**, plain words). Past Now pages are a couple of short bullets,
   casual, sometimes a photo. Do not write a recap or a mission statement.
3. **Mark what you cannot know.** Add `# CONFIRM:` comments for anything public
   or sensitive (drafts, unannounced projects) and an `# OFFLINE:` slot for
   something that is not a screen. Ask the author to fill it.
4. **Validate the YAML.** A `# comment` inside a folded `>-` block is *text, not a
   comment*, and would publish. Put comments on their own lines between items,
   then parse:
   ```sh
   node -e 'const y=require("js-yaml");const d=y.load(require("fs").readFileSync("src/now/drafts/YYYY-MM-DD.yaml","utf8"));
   console.log(Object.keys(d).join(","), d.highlights.length, d.updates.length,
   [...d.highlights,...d.updates].some(x=>x.includes("# ")))'
   ```
   Expect `lastUpdated,highlights,updates`, sensible counts, and `false`.
5. **Show the author the draft.** Do not promote without their edits to the
   CONFIRM and OFFLINE slots.

## Promote (when the author approves)

1. Archive the outgoing page if it has content: create
   `src/now/archive/<old date>.md` with the old items as a list:

   ```md
   ---
   layout: layouts/home.njk
   title: "Now — October 11, 2025"
   permalink: "{{ '2025-10-11' | archivePermalink }}"
   archiveDate: 2025-10-11
   ---

   <ul>
       <li>...</li>
   </ul>
   ```
2. Copy `lastUpdated`, `highlights`, `updates` into `src/_data/nowPage.yaml`
   (keep its header comment). Delete the draft file.
3. Check `/now/` and `/now/archive/` render (`visual-check`), run
   `npm run check:content`, update `docs/CHANGELOG.md`, commit with
   `commit-batches`.

## Report

Say what evidence each item came from (commit, post, note), which slots are the
author's to fill, and whether an archive snapshot was needed.
