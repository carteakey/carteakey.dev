---
name: notes-twitter-sync
description: Bidirectional workflow between site notes and X/Twitter. Covers outbound POSSE syndication (notes to tweet threads with media) and on-demand inbound manual ingestion (tweets to markdown notes).
---

# Notes ↔ Twitter / X Workflow

This skill defines the workflow for syncing short-form notes (`src/notes/`) with X/Twitter (`@carteakey`).

## Core Architecture

- **Canonical Source of Truth**: Site notes in `src/notes/YYYY-MM-DD-<slug>.md`.
- **Primary Direction (Site → Twitter)**: Write note locally, syndicate to X as a thread/tweet with images, and record `tweet_url` back in frontmatter.
- **Inbound Direction (Twitter → Site)**: When an author tweets on X first, manually ingest the tweet URL into a note. It extracts text, downloads photos to `src/static/img/notes/`, and creates the note markdown with `tweet_url` prefilled.
- **Loop Prevention**: Both directions check `tweet_url`. If `tweet_url` exists, outbound syndication skips it.

---

## 1. Outbound Syndication (Notes → Twitter)

### Command
```bash
# Preview formatting, character lengths, thread splitting, and attached media
npm run syndicate:note src/notes/YYYY-MM-DD-<slug>.md

# Or manually associate an already-published tweet URL with a note
npm run syndicate:note src/notes/YYYY-MM-DD-<slug>.md --set-url "https://x.com/carteakey/status/<id>"
```

### Automation Credentials (Optional)
If direct API posting is enabled, add to `.env`:
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`

---

## 2. Inbound Ingestion (Twitter → Notes)

When you write a tweet/thread on X and want to convert it to a site note:

### Command
```bash
npm run ingest:tweet -- https://x.com/carteakey/status/<id>
```

Optional flags:
- `--title "Custom Note Title"` (defaults to first line of tweet text)
- `--tags "AI,Agents"` (defaults to `AI`, 1–2 tags maximum, Title Case)

### What it does:
1. Fetches metadata via public syndication endpoint (`api.fxtwitter.com`) — zero API keys required.
2. Downloads attached images to `src/static/img/notes/<slug>-<n>.<ext>`.
3. Formats Eleventy `{% image %}` shortcodes for all media.
4. Generates `src/notes/YYYY-MM-DD-<slug>.md` with `tweet_url` prefilled.

---

## 3. Frontmatter Convention

Notes supporting Twitter linkage include:
```yaml
---
title: "Note Title"
layout: layouts/note.njk
permalink: /notes/{{ page.fileSlug }}/
description: "A brief summary for feed and social cards"
date: 2026-09-24
authored_by: human # or ai-assisted
tweet_url: "https://x.com/carteakey/status/183884920194819"
tags:
  - AI
  - Agents
---
```

When `tweet_url` is present:
- Single note view renders `· X / Twitter ↗` in the header metadata.
- Note card stream/wall/list view renders an `On X ↗` link in the card footer.
