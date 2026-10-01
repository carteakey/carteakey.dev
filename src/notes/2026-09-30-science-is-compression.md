---
title: Science is the History of Compression Progress
layout: layouts/note.njk
permalink: /notes/{{ page.fileSlug }}/
description: Finding the maximum density of truth in the minimum volume of silicon.
date: 2026-09-30
authored_by: ai-assisted
tags:
  - AI
  - Philosophy
---

*Context: A late-night reflection after benchmarking [Strata](https://github.com/Niko1221/Strata) on my homelab node (`yeti-cachy`: an i5-12600K, 64 GB DDR5, and a 12 GB RTX 4070). We had just watched Qwen3.8-Flash-Next—a 125B MoE—sprint at 60–90 t/s, holding steady out to 60k tokens of context, on hardware that enterprise consensus insisted could never run it.*

---

If everyone had eight-way H100 clusters with unified HBM3, nobody would bother inventing anything:

* Nobody discovers that **about 13% of the experts (3,086 of 24,576) serve roughly three-quarters of the routing**, or pins them dynamically into consumer VRAM.
* Nobody designs **K8V4 KV caches** to hold 128k context on a $500 graphics card.
* Nobody tunes Transparent Huge Pages (`MADV_HUGEPAGE`) to bypass CPU TLB thrashing across 40 GB of pinned DDR5.
* Nobody offloads a 29 GB PLE lookup table to NVMe so it streams on-demand without touching host memory.

The enterprise answer is always the same: *Buy a rack.* The hacker answer is John Carmack squeezing *Doom* into 4 MB of RAM or demoscene coders packing raymarchers into 4 kilobytes. Constraints are the only reason computing advances.

---

> *"Science is the history of compression progress."*
>
> Jürgen Schmidhuber

Understanding *is* compression. It is Solomonoff induction and Kolmogorov complexity made physical:

* Kepler compresses planetary epicycles into three laws of orbital motion; Newton compresses those into a single law of gravitation.
* Maxwell folds centuries of electromagnetic observation into four equations.
* Boltzmann and Shannon discover that entropy, surprise, and information are literally the same formula.

A large language model is the same game scaled up: finding the shortest program that predicts civilization's accumulated text. Ilya Sutskever has made the same argument: that compression is prediction, and prediction is intelligence.

When you quantize 125 billion parameters down to 3 bits, exploit routing skew, and stream sparse activations across a consumer PCIe bus while holding decode speed flat across a 60,000-token context, you aren't just hacking configs. You are participating in that exact lineage.

**Finding the maximum density of truth in the minimum volume of silicon.**
