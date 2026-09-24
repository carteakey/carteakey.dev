---
title: "Opus 5.5 Replaces /wait-what"
layout: layouts/note.njk
permalink: /notes/{{ page.fileSlug }}/
description: "The most load-bearing shift in Claude Opus 5.5 is communication density. It leads with dollar impact and root cause instead of forcing you to run /wait-what."
date: 2026-09-24
authored_by: ai-assisted
tags:
  - AI
  - Agents
---

The `/wait-what` skill was one of the most practical additions to agent workflows this year.

If you haven't used it: it was designed for when an agent loses you in the weeds. A model would find a bug, dump three paragraphs of narrative history, paste twenty lines of code you didn't ask for, and bury the actual root cause somewhere in paragraph four. You'd type `/wait-what` to interrupt the drift and force it to re-pitch the explanation in plain English with actual specifics.

Anthropic dropped a side-by-side comparison for Claude Opus 5.5 today, and it immediately made the skill obsolete.

{% image "./src/static/img/notes/opus-5-5-wait-what.png", "Side-by-side comparison of Claude Opus 5 and Claude Opus 5.5 diagnosing a billing bug regression", "w-full rounded-lg border border-surface-border" %}

Look at the difference in the screenshot.

Both models identified the exact same bug: commit `0552feb` refactored interval bounds in `periods.py` and silently dropped the last day of the month.

Opus 5 gave the standard LLM play-by-play. "What I found," "The bug," three separate code blocks, an explanation of datetime arithmetic, and a lecture on why `test_periods.py` missed it. Classic junior engineer presentation: showing all the work because it wants you to know it did the work.

Opus 5.5 led with the dollar amount and the commit:

> "The extra drop is a bug in the billing refactor. The free-tier change accounts for only $1.50 of acme's August drop. The other $9.92 comes from a bug in commit 0552feb."

Then it showed the one-line half-open interval comparison `[Aug 1 00:00, Sep 1 00:00)` and explained the boundary condition in three sentences.

Everyone tracks SWE-bench percentages and context window sizes on release day. But when you spend eight hours a day inside an agent terminal, this is the actual load-bearing news. You don't need a meta-prompt or an external skill to slap the model into being concise anymore. It just speaks like a staff engineer on the first try.
