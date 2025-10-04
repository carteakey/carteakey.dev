# carteakey.dev Agent Instructions

These notes codify the rules I follow when pairing with Copilot/Codex on the blog.

## Pre-edit checklist
- Read these instructions before touching code.
- Keep changes scoped to the `sonnet` branch and stay consistent with the existing stack.
- Prefer the simplest possible solution; no `var`, no jQuery, no IE shims.

## Manual workflow
1. Make the change.
2. Test locally in the browser; ship only when the console is clean.
3. Update `docs/CHANGELOG.md` with a SemVer entry under the current date.
4. Bump the release number in `versions.json`.
5. Confirm keyboard shortcuts, dark mode, and accent themes still behave.
6. Commit with a concise message and push `sonnet`.

## Project context
- Eleventy 3 drives the static site (`eleventy.config.mjs`).
- Tailwind 4 is compiled from `src/static/css/tailwind.css` to `_site/css` by the CLI.
- Alpine.js sprinkles live behaviour through `src/_includes/layouts/base.njk`.
- Content lives in `src/` (posts, snippets, data files). Build output is `_site/`; never edit it manually.

## Data and integrations
- Dynamic data modules (`_data/*.js`) cache responses via `@11ty/eleventy-fetch`.
- Spotify, Steam, Upstash, OpenAI/OpenRouter, and Ollama credentials must be provided via `.env`.
- The Netlify Function `netlify/functions/upvote.js` serves GET/POST upvote requests.
- Images are processed through `eleventy-img`; helper scripts in the repo add new photography records.

## Build and verification tips
- `npm run start` runs Eleventy serve and the Tailwind watcher in parallel.
- `npm run build` performs a production build; `npm run build:11ty` triggers Eleventy only.
- Use the feed, posts index, `/now`, `/stats`, and `/bookmarks` pages as sanity checks before ship.
- When introducing new data or dynamic behaviour, favour ESM modules that export plain objects or functions.

See `docs/prompt.md` for the current mission statement and `docs/TODO.md` for the active backlog.
