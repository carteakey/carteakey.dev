---
title: "The NEAT Framework: How I Built This Site"
description: "The tech stack powering this site — Netlify, Eleventy, Alpine, and Tailwind — and all the services that make it tick"
date: 2026-03-05
tags:
  - 11ty
  - Self-Host
---

When I moved away from Jekyll a couple years ago, I didn't expect to end up with something I'd name. It wasn't planned — it just evolved as I added features and tried to keep things simple. I now call it the **NEAT** framework: **N**etlify, **E**leventy, **A**lpine.js, and **T**ailwind CSS.

The name fits twice over. It's an acronym, and it describes the philosophy: no heavy frameworks, no build drama, no unnecessary moving parts. Just a neat stack for a personal site.

## The Four Pillars

### Eleventy — The Steady Foundation

I picked Eleventy because migrating from Jekyll was supposed to be "easy." Spoiler: it wasn't exactly easy, but it was worth it. Eleventy 3.x is what I'm running now — fully ESM, faster builds, and it doesn't fight me when I want to do something unusual.

What I love about it is the complete absence of opinions. No prescribed folder structure, no mandatory client-side JS, no lock-in to a particular templating language. I use Nunjucks for most things and drop into WebC for the few components that genuinely benefit from it.

### Tailwind — The CSS That Made Sense

Yes, the HTML looks like alphabet soup. But I can style a component in minutes without switching files, inventing class names, or worrying about cascade collisions.

I upgraded to Tailwind v4 when it dropped, and it was worth the migration. The new CSS-first config, the improved `@apply` ergonomics, and the faster CLI all make a real difference day-to-day. No more `tailwind.config.js` — configuration lives in the CSS file itself.

### Alpine.js — JavaScript Without the Drama

Alpine gives me just enough JavaScript to make things interactive without turning a simple site into a SPA. Here's an actual example from the navigation:

```html
<div x-data="{ open: false }" @click.away="open = false">
  <button @click="open = !open">Menu</button>
  <div x-show="open" x-transition>
    <!-- items -->
  </div>
</div>
```

No build step, no virtual DOM, no existential crisis about state management. It's served locally — no CDN dependency.

### Netlify — Deploy and Forget

Push to GitHub, and 30 seconds later the site is live. Netlify Functions let me add server-side behaviour without managing a server. My upvote system is a Netlify Function that talks to Upstash Redis:

```javascript
// netlify/functions/upvote.js
export const handler = async (event) => {
  const { slug } = JSON.parse(event.body);
  const count = await redis.incr(`upvotes:${slug}`);
  return { statusCode: 200, body: JSON.stringify({ count }) };
};
```

That's the entire thing. Serverless where it needs to be, static everywhere else.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Content        │    │  External APIs   │    │  Build / Deploy │
│                 │    │                  │    │                 │
│ • Markdown      │    │ • GitHub API     │    │ • Netlify CI    │
│ • YAML Data     │───▶│ • Spotify API    │───▶│ • Netlify Funcs │
│ • Netlify CMS   │    │ • Strava API     │    │ • GitHub Actions│
└─────────────────┘    │ • OpenAI/Ollama  │    └─────────────────┘
                       └──────────────────┘
          │                      │                      │
          └──────────────────────┴──────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NEAT Core                                │
│                                                                 │
│      Netlify  •  Eleventy 3.x  •  Alpine.js  •  Tailwind v4    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Deployed Site                               │
│                                                                 │
│   Syntax Highlight • Giscus Comments • Upstash Redis • EXIF    │
└─────────────────────────────────────────────────────────────────┘
```

Here's the original sketch I drew when trying to make sense of it all:

{% image_cc "./src/static/img/neat.png", "Handdrawn diagram of the NEAT Framework", "rounded-lg border border-gray-200 dark:border-gray-700 w-full", "The original architecture sketch. Yes, I drew this by hand. Yes, a doctor would have better handwriting. 'Utterances' has since become Giscus, and the chicken-scratch in the middle is definitely Tailwind, Alpine, and Eleventy — not a cry for help." %}

## The Ecosystem That Grew Around It

What started as a simple blog somehow accumulated a lot of moving parts. Here's what's actually running:

### Data & APIs

Content and dynamic data comes from a few places:

- **Markdown files** — posts, snippets, notes, TILs, folio entries
- **YAML files** — blogroll, bookmarks, reading list, uses, quotes, projects
- **GitHub Contributions API** — the heatmap on the stats page
- **Spotify API** — what I'm currently listening to (fetched at build time)
- **Strava API** — workout data
- **OpenAI / OpenRouter / Ollama** — quote of the day, with a fallback chain: local Ollama first, OpenRouter if that's unavailable, cached result otherwise

All external API calls go through `@11ty/eleventy-fetch` which caches responses so builds don't hammer rate limits.

### Features That Snuck In

**Image optimization** — `@11ty/eleventy-img` converts and resizes images at build time. EXIF data is extracted for photos so metadata (camera, location) can be displayed.

**Syntax highlighting** — `@11ty/eleventy-plugin-syntaxhighlight` with copy buttons, because I write a lot of code posts.

**Comments** — Giscus, backed by GitHub Discussions. No database, no moderation dashboard, no cost.

**Table of contents** — auto-generated from headings via `eleventy-plugin-toc`. Appears in the sidebar on wide screens.

**Upvotes** — Netlify Function + Upstash Redis. Frivolous but fun.

**Search** — client-side, powered by Alpine.js filtering directly on rendered DOM. Fast enough for the volume of content here.

**Dark mode** — CSS custom properties toggled by Alpine, persisted in `localStorage`.

**Feed** — unified timeline across posts, snippets, notes, TILs, photos, and Now updates. One `collections.feed` to rule them all.

## The Honest Truth About Performance

The site scores well on Lighthouse, but mostly because of what it *doesn't* do:

- **It's mostly text** — no heavy client-side framework
- **Static files** — everything is pre-built and served from Netlify's CDN
- **Image optimization** — handled at build time, not runtime
- **Lazy loading** — images load when scrolled into view
- **Caching** — Netlify handles it automatically

The "performance optimizations" are largely the natural result of the static site approach. I didn't have to think about it much, which is the point.

## Why This Works for Me

This setup hits the sweet spot for a personal site:

- **Fast enough** — sub-second loads on a slow connection
- **Simple enough** — I can hold the entire stack in my head
- **Flexible enough** — adding new features rarely requires touching the core
- **Cheap enough** — essentially free to run
- **Fun enough** — I actually enjoy working on it

The NEAT stack scales down gracefully. At its simplest, it's just Markdown files and a build command. The APIs, functions, and data layers are additive — remove any of them and the core still works.

## What I'd Do Differently

If I started over tomorrow:

1. **Better image organization** — the `/img` folder is a sprawl
2. **More consistent naming conventions** — some data files follow patterns, others don't
3. **Automated tests** — I have none, and it shows when I refactor templates

## Final Thoughts

I called it NEAT because the acronym worked out and because "neat" is exactly what I was going for — no excess, no lock-in, just the right tools for the job. Each piece does one thing well. If one stops working for me, I can swap it out without touching the others.

*If you're curious about any specific part of this setup, ask in the comments.*

Pretty NEAT, right?
