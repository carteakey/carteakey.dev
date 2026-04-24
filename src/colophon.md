---
layout: layouts/base.njk
title: Colophon
description: How this site is made, what it runs on, and the philosophy behind it.
permalink: /colophon/
eleventyNavigation:
  key: Colophon
  order: 99
---

{% include "components/breadcrumbs.njk" %}

{% set pageTitle = "Colophon" %}
{% set pageDescription = "How this site is made." %}
{% include "components/page-header.njk" %}

<div class="site-content">

## Stack

This site is built with the **NEAT stack** - Netlify, Eleventy, Alpine, Tailwind.

| Layer | Tool |
|---|---|
| Static site generator | [Eleventy 3](https://www.11ty.dev/) |
| CSS framework | [Tailwind CSS v4](https://tailwindcss.com/) |
| JS sprinkles | [Alpine.js](https://alpinejs.dev/) |
| Hosting | [Netlify](https://netlify.com) |
| Comments | [Giscus](https://giscus.app/) (GitHub Discussions) |
| Upvotes | [Upstash Redis](https://upstash.com/) via Netlify Functions |
| Search | Client-side JS (no external service) |
| Analytics | None (privacy-first) |
| Fonts | Inter (sans), JetBrains Mono (code) - self-hosted |
| Icons | [Feather Icons](https://feathericons.com/) |
| Syntax highlighting | [Prism.js](https://prismjs.com/) with custom themes |
| Images | [eleventy-img](https://www.11ty.dev/docs/plugins/image/) for responsive processing |
| Version | v{{ versions.version }} |

## Design

The site uses a unified **Surface Component System**—an evolution of my previous "Dense Editorial" layout. It embraces glassmorphism, subtle elevation, and consistent rounded geometry (`.surface` classes) while retaining a focus on typographic hierarchy.

Inspirations: Modern OS interfaces, glassmorphism, and minimal but tactile digital environments.

Key design decisions:
- 15px base font, system sans-serif stack
- `--accent-color` CSS variable driving all highlights - user-selectable from 22 colors
- Flat `border-b` dividers instead of card shadows
- List-first layouts with optional grid toggle

## AI-Assisted Development

This site is actively developed with AI assistance - primarily GitHub Copilot (Claude Sonnet) and occasionally Codex. The AI helps with boilerplate, CSS wrangling, and feature implementation while I drive direction and make design decisions.

Some posts are also AI-assisted and marked accordingly. I think transparency here matters.

## Source

The source code is [on GitHub](https://github.com/carteakey/carteakey.dev). It's not a template - it's a mess - but feel free to poke around.

</div>
