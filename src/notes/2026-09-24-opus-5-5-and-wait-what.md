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

Anthropic dropped a side-by-side comparison for Claude Opus 5.5 today, and it immediately made the skill obsolete.

{% image "./src/static/img/notes/opus-5-5-wait-what.png", "Side-by-side comparison of Claude Opus 5 and Claude Opus 5.5 diagnosing a billing bug regression", "w-full rounded-lg border border-surface-border" %}

Look at the difference. Both models caught the exact same bug (`0552feb` dropping the last day of the month in `periods.py`). Opus 5 gave the classic junior engineer play-by-play with three code blocks and a lecture. Opus 5.5 led with the dollar amount and the commit:

> "The extra drop is a bug in the billing refactor. The free-tier change accounts for only $1.50 of acme's August drop. The other $9.92 comes from a bug in commit 0552feb."

Everyone tracks SWE-bench percentages and context windows on release day. But when you spend all day in an agent terminal, this is the actual load-bearing news. It finally learned how to shut up, lead with the dollar amount, and talk like a staff engineer on the first try.
