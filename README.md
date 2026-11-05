# carteakey.dev

[![Netlify Status](https://api.netlify.com/api/v1/badges/08c07e6f-a368-433c-908f-be5c7b37c60e/deploy-status)](https://app.netlify.com/sites/starlit-brigadeiros-b87f35/deploys)

My personal website, blog, and digital workbench. A home for technical notes, local AI benchmarks, hardware setups, half-built tools, and thoughts worth saving.

Live at [carteakey.dev](https://carteakey.dev).

---

## The Philosophy

- **Digital workbench over generic dashboard**: dense editorial typography, `.surface` containers, hand-drawn sketches, and an intentional paper-and-ink aesthetic.
- **Fast and lightweight**: built on the **TEA stack** (Tailwind CSS v4, Eleventy v3, Alpine.js). No heavy client frameworks, minimal runtime JS, instant paints, and clean 100s across Lighthouse.
- **Living personal feeds**: automated syndication and cached readers for Goodreads, Letterboxd, Spotify, Steam, and notes.
- **Terminal Q&A**: [`agentcart`](https://carteakey.dev/ask/) — an on-site AI terminal grounded on the site's own corpus, powered by Netlify Edge Functions.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **SSG** | [Eleventy 3](https://www.11ty.dev/) (ESM, async data cascade) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) (`@theme` tokens, CLI build, zero runtime CSS) |
| **Interactivity** | [Alpine.js](https://alpinejs.dev/) (view toggles, navigation, theme persistence) |
| **Edge & Functions** | [Netlify](https://www.netlify.com/) (Edge Functions for `/ask/`, serverless upvotes) |
| **Fonts & Assets** | Self-hosted *Iosevka Aile*, *Ioskeley Mono*, and *Press Start 2P*; responsive AVIF/WebP heroes via `eleventy-img` |
| **Comments** | [Giscus](https://giscus.app/) (backed by GitHub Discussions) |

## Features

- ✍️ **Writing & Sheets**: markdown posts, technical notes, tool comparisons, and curated reading feeds.
- 🎨 **Editorial visual language**: unique per-post sketch stamps, halftone photography, and interactive toys.
- ⚡ **Sub-second performance**: pre-rendered HTML, preloaded self-hosted WOFF2 fonts, optimized AVIF thumbnails, and deferred non-critical assets.
- 💬 **Ask the Blog (`/ask/`)**: local/edge semantic search across posts and notes.
- 🌗 **Dark Mode**: automatic system theme detection with manual override and instant, flicker-free theme bootstrapping.

## Local Development

```sh
# Install dependencies
pnpm install

# Start local dev server (Eleventy + Tailwind watcher)
pnpm start
```

Visit [http://localhost:8080](http://localhost:8080).

### Verification & Pre-commit

```sh
# Run content, design baseline, version, and smoke checks
pnpm run check

# Production build
pnpm run build
```

## Credits

Built and maintained by [Kartikey Chauhan](https://carteakey.dev).
