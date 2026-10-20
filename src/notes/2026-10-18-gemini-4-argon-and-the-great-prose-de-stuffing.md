---
title: "Gemini 4 Argon and the Great Prose De-Stuffing"
layout: layouts/note.njk
permalink: /notes/{{ page.fileSlug }}/
description: "A local diff workbench plus Gemini 4 Argon cleaned up a year of commit-hash soup in my local inference posts."
date: 2026-10-18
authored_by: ai-assisted
tags:
  - AI
  - LLMs
---

The local inference posts ([Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/), [Strata](/blog/local-inference/strata-on-an-rtx-4070/), [27B vs Flash-Next](/blog/local-inference/qwen3-8-27b-vs-flash-next/), and the [optimization guide](/blog/local-inference/local-llm-optimization/)) had picked up a familiar kind of AI-assisted debt. Commit hashes and PR numbers sat in the middle of paragraphs. Four or five update boxes stacked at the top of an article. Prose repeated the table right below it. An earlier "evidence pass" had stamped bold labels like `Tested here:` into every section.

This weekend I cleaned it up with Gemini 4 Argon and a new local-only diff view. Argon was noticeably better at this than the models I'd used before. Most models read "tighten this up" as permission to summarize away the exact flags, failure modes, and caveats that make a workbench post useful. Argon kept those and dropped the filler.

What we did, roughly:

- Built a readability workbench. `node utils/snapshot-post.mjs` freezes a post's before state, and local preview then shows split and word-diff views with live prose metrics (numbers, bold, and inline code per 1k words, em dashes, contractions). None of it ships to production.
- Split editing into three modes: light tuning, full de-stuffing for benchmark logs, and proofread-only for posts I wrote by hand, so personal essays never get rewritten.
- Cut the three single-model posts by roughly half. Update boxes folded into the narrative, run guides moved to the top, and comparisons moved out of sentences into tables.
- Restored the 24-section guide. The explanations that had been flattened in earlier edits came back, and it now covers PLE on NVMe, Strata's per-expert cache, linear attention, and the greedy vs Thinking Mode question.

The guide is the one post where I still have the before snapshot, so here's its scorecard (prose only, tables and code excluded):

| Metric | Before | After |
| :--- | ---: | ---: |
| Numbers / 1k words | 52.4 | 43.1 |
| Bold / 1k words | 11.4 | 0.6 |
| Inline code / 1k words | 25.9 | 21.4 |
| Contractions / 1k words | 2.1 | 6.6 |
| Em dashes | 0 | 0 |

A full post on the workbench and the prose fingerprint behind it is coming later.
