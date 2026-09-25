---
title: "Opus 5.5 Replaces /wait-what"
layout: layouts/note.njk
permalink: /notes/{{ page.fileSlug }}/
description: "Opus 5.5 replaced the need for the /wait-what skill, and this is the biggest load-bearing news of the release."
date: 2026-09-24
authored_by: human
tags:
  - AI
  - Agents
---

The `/wait-what` skill was one of the most practical additions to agent workflows this year. Whenever a model would find a bug, dump three paragraphs of narrative history, and bury the root cause somewhere in paragraph four, you'd type `/wait-what` to interrupt the drift and force it to re-pitch in plain English.

{% image "./src/static/img/notes/opus-5-5-wait-what.png", "Side-by-side comparison of Claude Opus 5 and Claude Opus 5.5 diagnosing a billing bug regression", "w-full rounded-lg border border-surface-border" %}

Worth stating plainly, saying the quiet part out loud: with Opus 5.5, the load-bearing issue of Claude's lingo and chronic verbosity may decisively be heading in the right direction. For years, every bug investigation came bundled with a three-act play, five paragraphs of unsolicited pedagogical sympathy, and bespoke prompt skills like `/wait-what` just to get it to stop talking. If Opus 5.5's grand architectural breakthrough is that it finally learned how to shut up, lead with the dollar amount, and close the PR, then we are truly living in the future.
