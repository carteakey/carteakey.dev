---
title: "Qwen3.8-27B vs Qwen3.8-Flash-Next: Which One to Run Locally?"
description: "Dense vs MoE on an RTX 4070: measured throughput on llama.cpp and Strata, estimated intelligence, and when to pick each."
image: /img/blog-sketches/unique/qwen3-8-27b-vs-flash-next-stamp-trim.png
imageAlt: "Monochrome pencil sketch of a balance scale weighing a compact solid block against a large hollow lattice cube"
date: 2026-08-31
updated: 2026-10-18
authored_by: ai-assisted
draft: false
giscusTerm: "/blog/qwen3-8-27b-vs-flash-next/"
tags:
  - AI
  - Hardware
hidden: false
pinned: false
---

{% update "2026-10-18", "October 2026 Update: Strata Flipped the Speed Equation" %}
When I first wrote this comparison on stock `llama.cpp`, the trade-off was simple: the dense model was nearly twice as fast, while the sparse MoE was noticeably smarter. With [Strata](/blog/local-inference/strata-on-an-rtx-4070/) and the uncompressed n-gram table, Flash-Next now hits **53 to 74.8 tok/s steady decode** on the exact same GPU, making the larger MoE both smarter *and* faster whenever host RAM is available.
{% endupdate %}

I run both siblings from Alibaba's Qwen3.8 lineup on {% device "yeti-cachy" %}:
- **[Qwen3.8-27B](/blog/local-inference/running-qwen3-8-27b-locally/)**, a dense hybrid model that fits completely inside my GPU's VRAM with zero host memory overhead.
- **[Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/)**, a large sparse MoE paired with an external n-gram lookup table that spans VRAM, system RAM, and NVMe SSD.

They draw roughly the same wall power under load, but on a single mid-range card they can't sit in memory at the same time. Only one gets to be the default behind [llama-swap](https://github.com/mostlygeek/llama-swap). Here's how they compare on speed, memory, quality, and when I reach for each one.

## TL;DR

On Strata, **Flash-Next is my daily driver for almost everything**. It decodes nearly twice as fast as the dense model does on stock `llama.cpp`, prefills prompts at full GPU speed, and holds a real lead on multi-step coding and complex instructions.

I still keep **Qwen3.8-27B** on the roster for two specific jobs:
1. **When my desktop needs its memory:** the dense model uses zero bytes of system RAM, whereas Flash-Next claims most of my host DDR5 for its offloaded experts.
2. **When context goes past 128k:** three-quarters of the dense model's layers are linear Gated-DeltaNet blocks that don't grow a traditional KV cache, so it holds its full **262k context window** inside VRAM without breaking a sweat.

## Measured head-to-head

All tests ran on {% device "yeti-cachy" %} (i5-12600K, RTX 4070 12 GB, 64 GB DDR5, WD Black SN770 NVMe):

| Metric / Dimension | Qwen3.8-27B (UD-IQ3_XXS) | Qwen3.8-Flash-Next (`llama.cpp` AD-4.27bpw) | Qwen3.8-Flash-Next (Strata IQ3_XXS) |
| :--- | :---: | :---: | :---: |
| **Model Footprint** | 10.17 GiB (pure VRAM) | 88 GiB (split RAM+VRAM+NVMe) | 75.8 GiB (split RAM+VRAM+NVMe) |
| **Prompt Processing (Prefill)** | **~1,160 t/s** (pure GPU) | ~200 - 385 t/s | **1,138 - 2,013 t/s** |
| **Decode: Steady Generation** | **36.7 t/s** (flat across context) | 20.5 - 22.1 t/s (plain master) | **53.2 - 65.8 t/s** (74.8 t/s w/ Q8_0 PLE) |
| **Decode: Speculative / MTP** | 36.7 t/s | 25.3 - 27.1 t/s (16k MTP) | Included above (native MTP) |
| **Max Working Context** | **262k native** (fits in VRAM) | 96k (`q8_0` KV) | **128k native** (`k8v4` KV) |
| **Host System RAM Load** | **0 GB** (pure GPU resident) | ~50 GiB RSS | **48 - 52 GiB RSS** |
| **Desktop Multitasking** | **Effortless** (all 64 GB RAM free) | Tight (desktop spikes risk swap) | Manageable (~12 GB headroom) |

{% image_cc "./src/static/img/diagrams/qwen38-decode-speed-chart.png", "Horizontal bar chart of decode speed on an RTX 4070 12GB in tokens per second: 27B on llama.cpp 36.7, Flash-Next on llama.cpp 20.5, Flash-Next on llama.cpp with MTP 25.3, Flash-Next on Strata steady 53 to 63, Flash-Next on Strata burst 90.2 using a Q2_0 quant", "sketch-draw", "Decode speed across setups on the RTX 4070 12 GB." %}

## The intelligence gap (~90 vs ~74 estimate)

Comparing raw foundation benchmarks without accounting for quantization doesn't tell the whole story when one model is a 3-bit dense quant and the other is a sparse MoE. To get a rough directional picture, I put together a back-of-the-envelope estimate combining [public LLM Stats benchmarks](https://llm-stats.com/models/compare/qwen3.7-plus-vs-qwen3.8-flash-next) with my own assumptions for quantization retention:

| Variant / Profile | Base Capability | Assumed Quant Retention | **Estimated Index** |
| :--- | :---: | :---: | :---: |
| **Qwen3.8-Flash-Next BF16** | 100 | 100% | **100** |
| **Qwen3.8-Flash-Next (Served quant)** | 100 | ~90% | **~90** |
| **Qwen3.8-27B BF16** | ~87 | 100% | **~87** |
| **Qwen3.8-27B (UD-IQ3_XXS, 3.06 bpw)** | ~87 | ~85 - 87% | **~74** |

Treat that spread as a rule of thumb rather than a lab measurement:
- **At full precision**, Flash-Next leads Qwen3.7-Plus and the dense model by roughly fifteen percent across GPQA, LiveCodeBench, and SWE-bench Verified.
- **Under aggressive quantization**, a dense model has every parameter active on every token, so rounding error in the attention projections accumulates faster than it does in a sparse MoE whose router gates and isolated lookup table stay at higher precision.

In my day-to-day coding, that gap is easy to feel. The dense model occasionally slips on an off-by-one regex or drops a secondary constraint in a long multi-turn thread, while Flash-Next is much more reliable on the first pass.

## How to choose between them

You can generalize this choice to almost any compact dense model versus a large offloaded MoE:

{% wide %}
| Gate | If your setup / task is… | Pick | Why |
| :--- | :--- | :--- | :--- |
| **1. System RAM** | Under 64 GB host RAM | **Qwen3.8-27B** | Fits entirely in 10.2 GB VRAM and needs zero host RAM. The 88 GiB MoE file can't run comfortably in 32 GB. |
| **2. GPU setup** | CPU-only or Apple Silicon | **Flash-Next** | Only ~6B active parameters per token, so it streams from RAM several times faster than a 27B dense model. |
| **3. Workload on 12GB VRAM + 64GB RAM** | Heavy desktop multitasking, Docker builds, or >128k context (up to 262k) | **Qwen3.8-27B** | Leaves all 64 GB of system RAM free for your tools and holds 262k context inside VRAM at a flat 36.7 tok/s. |
| | Dedicated coding agent, complex logic, or normal sessions under 128k | **Flash-Next (on Strata)** | Gives you the higher reasoning ceiling at 53 to 74.8 tok/s steady decode. (If you're stuck on stock `llama.cpp` at 20.5 tok/s, the 27B still wins on raw speed.) |
{% endwide %}

{% image_cc "./src/static/img/diagrams/qwen38-dense-vs-moe-chooser.png", "Decision tree: if the MoE does not fit in RAM plus VRAM, pick Dense 27B; otherwise if there is no discrete GPU, pick the MoE; otherwise if you need over 128k context or free host RAM, pick Dense 27B, else the MoE (Flash-Next)", "sketch-draw", "The three decision gates drawn as a flow." %}

## Why Strata flipped the trade-off

When I only had stock `llama.cpp`, running Flash-Next meant accepting ~20 tok/s because almost all of its MoE layers were stuck in system RAM. [Strata](/blog/local-inference/strata-on-an-rtx-4070/) broke that bottleneck by caching the hottest individual experts across every layer directly in VRAM and verifying multi-token draft predictions in a single pass.

Two fair caveats apply here: my dense model numbers are still on stock `llama.cpp` rather than a custom engine, and Strata runs a 3-bit quant rather than the 4.27-bit build I originally tested on `llama.cpp`. Even with those caveats, getting over 50 tok/s steady out of the larger MoE made it the clear default on my box, with the dense model reserved for heavy multitasking and ultra-long contexts.

## References

- [Running Qwen3.8-27B Locally (Pure VRAM Configuration)](/blog/local-inference/running-qwen3-8-27b-locally/)
- [Running Qwen3.8-Flash-Next Locally (`llama.cpp` Guide)](/blog/local-inference/running-qwen3-8-flash-next-locally/)
- [Strata on an RTX 4070: 75 tok/s from a 176B Model at 128k Context](/blog/local-inference/strata-on-an-rtx-4070/)
- [The Rise of Overfit Inference Engines](/blog/local-inference/the-rise-of-overfit-inference-engines/)
- [LLM Stats: Qwen3.7-Plus vs Qwen3.8-Flash-Next](https://llm-stats.com/models/compare/qwen3.7-plus-vs-qwen3.8-flash-next)

## Changelog

| Date | Note |
| --- | --- |
| 2026-10-18 | Updated Strata decode figures (up to 74.8 tok/s steady with `Q8_0` PLE), consolidated the duplicate decision tables, and tightened prose for readability. |
| 2026-09-30 | Added the Strata update showing how dynamic expert caching flipped the speed comparison against the 27B dense model. |
| 2026-08-31 | Initial head-to-head comparison between Qwen3.8-27B and Qwen3.8-Flash-Next on stock `llama.cpp`. |
