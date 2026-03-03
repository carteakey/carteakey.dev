---
title: "Tailwind v4 layers don't respect CSS specificity the way you think"
date: 2026-02-26
tags: [css, tailwind]
source: https://tailwindcss.com/docs/upgrade-guide
---

In Tailwind v4, `@layer utilities` **always beats** `@layer components` — regardless of selector specificity. This is by design (layers follow declaration order, not specificity). The fix: move rules you need to win completely outside any `@layer`. Unlayered CSS beats all layered CSS.

This bit me when `.title-hover:hover` inside `@layer components` was being overridden by `text-gray-900` from `@layer utilities`, even though a pseudo-class selector should win on specificity alone.
