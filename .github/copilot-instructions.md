# Copilot playbook for `carteakey.dev`

You're working at the `carteakey.dev` codebase, a personal blog and portfolio site built with Eleventy, Tailwind CSS, and Alpine.js. This playbook outlines the key guidelines, practices, and workflows to follow when contributing to this project.

The branch is `sonnet`. This is where you should make all your changes.

 ## 📋 PRE-EDIT CHECKLIST

**Adherence to these rules is mandatory, ALWAYS check this file and follow these rules.**

---

## 🧭 Guiding Principles

1. **Simplicity First**: Use a minimal approach. Avoid unnecessary complexity, libraries, or build tools.
---

## ⚠️ Prohibited Practices

* ❌ **No Legacy Code**: Do not use `var`, jQuery, or write code for Internet Explorer compatibility.

---

## 🔄 Version Control & Commit Workflow

This project uses a manual versioning process. It is your responsibility to keep it accurate.

**Manual Workflow:**

1. **Code**: Make your changes following all guidelines.
2. **Test**: Thoroughly test your changes in-browser. Check for console errors and verify all functionality. 

3. **Update `CHANGELOG.md`**:

   * Add a new entry under the current date.
   * Use SemVer headings and clear sections `Added`, `Changed`, `Fixed`.

```
## [1.2.3] - 2025-09-11
### Added
- video.js: keyboard shortcut “K” for pause
```

4. **Commit**: Write a short, descriptive commit message (e.g., `fix(nav): correct mobile layout overlap`).

**Pre-commit checklist:**

* Browser tested, no console errors.
* Shortcuts intact.
* `versions.json` bumped correctly.
* `CHANGELOG.md` updated.


5. **Push**: Push your changes to the `sonnet` branch.

6. Update the TODO.md file if you added or fixed something that should be noted there.
---



- Site runs on the TEA stack: Eleventy 3 (`eleventy.config.mjs`), Tailwind 4 via CLI (`src/static/css/tailwind.css`), and Alpine enhancements embedded in `src/_includes/layouts/base.njk`.

- Eleventy source lives in `src/`; `_includes/layouts/*.njk` hold page shells, `_data/*.{js,yaml}` feed global data, and build output is `_site/` (don’t hand-edit it).

- Use `npm run start` for live work (parallel Eleventy serve + Tailwind watch). `npm run build` = Eleventy + Tailwind production passes used by Netlify (`netlify.toml`).

- Local-only Eleventy re-run exists via `npm run build:11ty`; VS Code task “Build Eleventy site” wraps that command if you prefer the task runner.

- Collections: blog posts in `src/posts/*.md` (front matter `title`, `description`, `date`, optional `updated`, `hidden`, `tags`); snippets in `src/snippets`; pages like `now/` and `gallery.njk` expect matching data in `_data`.

- The post layout (`src/_includes/layouts/post.njk`) wires in upvotes, TOC, and Giscus. Keep `page.fileSlug` stable or update `upvotes.posts[slug]` in `src/_data/upvotes.js`.

- Global metadata comes from `src/_data/metadata.yaml`; navigation ordering uses `eleventyNavigation` and the layout menu logic in `base.njk`.

- Templates opt into nav by adding front matter like `eleventyNavigation: { key: 'Projects', order: 5 }`; `base.njk` filters to show About/Blog/Now inline and everything else under the overflow menu.

- Dynamic data modules rely on `@11ty/eleventy-fetch` `AssetCache`: e.g., Spotify (`_data/spotify.js`), Steam (`_data/steam.js`), quotes (`_data/qotd.js`), GitHub (`_data/github.js`). They cache into `.cache/`; keep cacheable fallbacks and guard for missing env vars.

- Data helpers like `src/_data/stats.js` expect Eleventy collections (`data.collections.posts`, `tagList`, etc.); when creating new computed data, follow the pattern of exporting plain objects with functions.

- Required env secrets: Spotify (`SPOTIFY_CLIENT_ID/SECRET/REFRESH_TOKEN`), Steam (`STEAM_API_KEY/STEAM_USER_ID`), Upstash (`UPSTASH_REDIS_REST_URL/TOKEN`), OpenAI (`OPENAI_API_KEY`), OpenRouter (`OPENROUTER_API_KEY`, optional model/site vars), Ollama (`OLLAMA_API_URL`). Load them locally via `.env` before running data-dependent builds.


- Netlify Function `netlify/functions/upvote.js` powers the upvote widget; GET returns counts, POST increments. Local changes should preserve method handling and JSON payload structure.

- Image tooling: use `eleventy-img` shortcodes (`eleventy.config.mjs`) and scripts `add-photo.mjs` / `bulk-add-photos.mjs` to append entries to `src/_data/photos.yaml` and copy assets into `src/static/img/photography/{real|virtual}` (requires Ollama/OpenAI creds). GIFs bypass processing via `mapSrcToPublicUrl`.

- Styling lives in `src/static/css/tailwind.css` with Tailwind v4 `@theme` tokens and custom fonts copied via passthrough; regenerate CSS through the Tailwind CLI scripts rather than editing `_site/css` directly.
- CMS editing goes through Netlify CMS (`src/admin/config.yml`); any new collection should update both the folder structure and allowed fields there.

- Build ignores: `.eleventyignore` skips `README.md`. Formatting defaults to two-space indent per `.editorconfig` / `.prettierrc`.

- Hosting/automation: Netlify deploys on pushes to `main`; GitHub Action `.github/workflows/main.yml` pings `NETLIFY_BUILD_URL` nightly at 00:00 UTC to refresh dynamic data.

- When adding new data files, export plain functions/objects so Eleventy’s data cascade can consume them (`export default async function(data) { … }`). Stick to ESM (`type: "module"`).

- If adding new interactive features, prefer Alpine snippets inside `base.njk` blocks and remember dark-mode + accent-theme helpers already manipulate the DOM on load.

- Keep third-party assets self-hosted when possible (fonts copied via passthrough, Prism theme switched in `base.njk`). Any CDN additions should degrade gracefully during prerender builds.

- Clear the `.cache/` directory if you need fresh API fetches; Netlify plugin `netlify-plugin-cache` persists it between builds, so handle cache busts deliberately.

- There are no automated tests; sanity-check changes with `npm run build` and spot-verify key pages (`/`, `/posts`, `/now`) in the local server before pushing.
