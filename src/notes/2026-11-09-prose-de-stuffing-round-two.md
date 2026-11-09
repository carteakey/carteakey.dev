---
title: "Making AI Content Readable, Part 2: Guidelines, Not Scripts"
layout: layouts/note.njk
permalink: /notes/{{ page.fileSlug }}/
description: "What broke when I ran a second prose pass across seven posts, and why anti-slop rules need a leash too."
date: 2026-11-09
authored_by: ai-assisted
tags:
  - AI
  - LLMs
---

After [Part 1 on de-stuffing benchmark logs](/notes/2026-10-18-gemini-4-argon-and-the-great-prose-de-stuffing/), I ran a second round today across seven more posts: both [Alvidaa](/blog/alvidaa/alvidaa/) TV-rooting writeups, [Herding](/blog/herding-multi-agent-teams/), [Unsloth UD vs GSQ](/blog/local-inference/unsloth-dynamic-vs-gsq-quants/), [local recursive inference tuning](/blog/local-inference/local-recursive-self-inference-improvement/), [Strata](/blog/local-inference/strata-on-an-rtx-4070/), and [overfit inference engines](/blog/local-inference/the-rise-of-overfit-inference-engines/).

A few things broke in interesting ways, and the fixes went straight back into my `human-writer` skill:

- **Guidelines, not scripts.** That's now the first line of the skill. If you hand a model a style guide that reads like a linter, it treats the rules as a reward function and scrubs the life out of the draft.
- **Don't turn good headings into changelog labels.** In the first pass today, the "make headings literal" rule rewrote *"Of course we ran Doom"* into *"Testing interactive frame rates with Doom"*, *"The TV argues back"* into *"Persistence daemons and update checks"*, and *"Wait, my own project uses this"* into *"Evaluating the argument"*. Every one of those edits made the post worse. The rule is only meant for theatrical LLM headings (*"The Verdict"*, *"Why It Matters"*, *"Enter X"*). If a heading already has a pulse, leave it alone.
- **Models hallucinate richer hardware than you own.** An LLM's training prior for "local inference workstation" points straight at a 24 GB RTX 4090. `Herding` had quietly upgraded my 12 GB RTX 4070 to an RTX 4090 in a background paragraph. The pre-edit pass now checks hardware claims against my actual fleet.
- **Kill the solo-builder "we" and the trailing essay.** On a one-person project, *"We built X to solve Y"* sounds like a press release, and `"we"` only belongs when referring to me + the coding agent running an experiment together. I also axed the trailing `## Why this matters` / `## What This Proves` sections that models love to staple onto the end of a build log after the numbers already made the point.
- **Fingerprints catch mislabeled badges.** `Herding` was marked `authored_by: human`, but the workbench metrics (zero contractions in 1,854 words, bold-colon bullet lists, and *"Not X. Not Y. Just Z."* cadences) made it obvious a model drafted the prose. Flipped the badge to `ai-assisted` and cut it from 1,854 to 1,116 words (`-40%`).
- **Section-aligned diffs.** When a pass cuts 30-40% of a post, a raw side-by-side scroll falls out of sync after the second heading. The local readability workbench now pairs `Before` and `After` by `##` section with per-section word deltas, so I can spot bad heading or paragraph rewrites in seconds.

| Post | Before | After | Delta |
| :--- | ---: | ---: | ---: |
| **Herding multi-agent teams** | 1,854 w | 1,116 w | -40% |
| **Unsloth UD vs GSQ quants** | 1,080 w | 764 w | -29% |
| **Strata on an RTX 4070** | 1,984 w | 1,563 w | -21% |
| **Local recursive self-inference** | 1,257 w | 1,086 w | -14% |
| **Alvidaa (part 1)** | 2,000 w | 1,739 w | -13% |
| **Alvidaa firmware telemetry** | 1,430 w | 1,297 w | -9% |
| **Overfit inference engines** | 1,861 w | 1,827 w | -2% |
