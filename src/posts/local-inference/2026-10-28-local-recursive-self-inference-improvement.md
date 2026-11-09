---
title: "Local recursive self inference improvement: how an agent tunes the model it runs on"
description: "How an agent safely benchmarks its own GPU during a blackout, separates fake gains, and promotes real speedups."
image: /img/blog-sketches/unique/strata-on-an-rtx-4070-stamp-trim.png
imageAlt: "Monochrome pencil sketch of a graphics card beside a tray of cached chips, a larger chip pile, a RAM stick, and a stopwatch"
date: 2026-10-28
giscusTerm: "/blog/local-inference/local-recursive-self-inference-improvement/"
authored_by: ai-assisted
draft: true
hidden: false
tags:
  - AI
  - Self-Host
pinned: false
---

My local coding agent runs on Qwen3.8-Flash-Next (a 125B MoE) served through my `strata-lean` fork and `llama-swap` on {% device "yeti-cachy" %}. On a 12 GB RTX 4070, that model fills almost the entire card. When I asked the agent to help tune its own inference engine, we hit an immediate wall: the agent and the benchmark share the same GPU.

In the cloud, an agent can spin up a separate VM while profiling. On a single homelab card, the moment the agent runs a benchmark script, it stops `llama-swap.service` and kills the server generating the agent's next token.

For the agent to benchmark and tune its own runtime locally, I needed it to schedule its own temporary blackout, survive session teardown, wake back up on the next turn, and grade the logs without falling for switches that trade away accuracy.

## The Homelab Blackout Problem

If the agent runs a benchmark directly in its shell tool, the connection drops mid-turn and nothing gets evaluated. To close the loop, I had the agent use a five-step detached handoff:

1. **Audit and propose:** Inspect its own startup logs and serving config to pick candidate flags, env vars, or upstream commits.
2. **Arm the timer:** Package the A/B benchmark ladder (bookended by a control run at the start and end) into a self-contained script and spawn it via `setsid nohup` with a 75-second delay.
3. **Yield the turn:** Finish its response and return control before the timer fires.
4. **Run in the dark:** The background script stops `llama-swap`, checks that the GPU is idle, runs the benchmark ladder, saves per-arm engine logs and config metadata, and restarts `llama-swap`.
5. **Wake up and grade:** On the next turn, the agent wakes up on the restarted server, reads the JSONL telemetry, and compares every arm against the bookended control pair.

## The Temptation of "Cheating" Benchmarks

On MoE models, raw tokens per second is easy to game if you don't check how the router picked its experts.

In my first nine-arm sweep, one candidate flag looked huge on paper: `STRATA_ROUTE_PRIOR=1.5`. Decode speed jumped from 71.1 to **102.2 tok/s sustained**, the VRAM expert cache hit rate climbed from 57% to 93%, and PCIe traffic dropped near zero.

Reading `route_prior.cu` showed why: the switch adds a logit bonus during top-k selection to whichever experts are already sitting in GPU VRAM. Instead of routing tokens strictly to the highest-scoring experts, the model favored whatever happened to be cached on the card. Upstream's own release notes showed agent task completion dropping from 56% to 45% with that bias enabled, and higher values broke code syntax altogether. Even though upstream later turned it on by default for 12 GB NVIDIA cards, I pinned it off alongside `STRATA_ROUTE_TAIL_SKIP=0`.

## Finding Real Headroom: The Elastic KV Cache

The first clean win came from three lines in the agent's startup log:

```text
expert cache 2583 slots, 4.24 GiB of VRAM
serve: WARNING: only 410 MiB of VRAM free at start of request
decode expert cache hit rate: 58.6%
```

At full 128k context with quantized KV (`--kv k8v4`), Strata reserves **1.32 GiB** of VRAM up front. Enabling `--kv-grow` switches that buffer to CUDA virtual memory management (VMM): it maps only a small initial slice at startup and hands the remaining **1.11 GiB** straight to the expert cache without altering routing or math:

| Metric (`IQ3_XXS`, DDR5-5200) | Static 128k KV (`base`) | Elastic KV (`--kv-grow`) |
| --- | :---: | :---: |
| **VRAM expert slots at load** | 2,583 (`4.24 GiB`) | **3,277** (`5.35 GiB`, +694 slots) |
| **VRAM cache hit rate** | 57.4% | **62.1%** |
| **Steady decode** | 71.1 tok/s | **73.5 tok/s** (78.9 peak) |
| **Slots held at 114k context** | 2,581 | **2,642** (after returning 634 slots to KV) |

As a live coding session grows, the expert cache returns physical pages to the KV cache step by step. Even past 114k tokens in my own session, the card still held more experts in VRAM than the static config, only dipping below static near the full 128k ceiling.

{% diagram_card {
  src: "./src/static/img/diagrams/qwen38-flash-next-throughput-progression.png",
  alt: "Line chart showing decode throughput progression on an RTX 4070 up to the strata-lean fork at 69.6 t/s, --kv-grow at 73.5 t/s, and UD-IQ2_XS + ADAPT_FETCH at 70.4 t/s.",
  kicker: "Inference Uplift · RTX 4070 12GB + 64GB DDR5",
  title: "Qwen3.8-Flash-Next Decode Throughput Progression",
  badge: "6.5 → 73.5 tok/s (70.4 UD-IQ2_XS)",
  caption: "Early unoptimized baseline (6.5 t/s) → llama.cpp MTP (27.06 t/s) → Strata dynamic cache (60.3 t/s) → DDR5-5800 tuning (65.8 t/s) → strata-lean fork on stable DDR5-5200 (69.6 t/s) → elastic --kv-grow cache expansion (73.5 t/s) → Unsloth Dynamic UD-IQ2_XS + ADAPT_FETCH (70.4 t/s, +11.5 DeepSWE)."
} %}

## When the Benchmark Harness Lies

Once the agent started running multi-arm ladders on its own, the biggest bugs turned out to be in our measurement harness:

- **Why greedy identity checks fail on hybrid MoE:** For the second sweep, the agent built a seven-prompt greedy identity gate (`temperature 0`). The control arm failed against *itself* on three of seven prompts inside the same boot. Because only a fraction of the model's experts sit in VRAM, which experts are resident shifts between passes; GPU tensor cores and CPU AVX2 threads accumulate floating-point sums in a different order, flipping near-tie tokens. On a hybrid GPU/CPU cache, quality gates have to compare against the control pair's own cross-boot divergence floor rather than bitwise text equality.
- **Warm-up climb and log collisions:** Three warm-up probes weren't enough to warm the expert cache before timing started, leaving a wide spread between the opening and closing controls. Worse, naming both bookends `base` caused the closing control to append to the opening control's log file. Doubling the warm-up pass and sequence-prefixing every arm's log stopped false promotions.
- **Disproving the Lamina draft head:** Using the hardened harness across three paired ladders, the agent tested the trimmed Lamina MTP draft head (40,525 tokens vs 106,299 stock). Its claimed draft-acceptance gain didn't reproduce on my Unsloth Dynamic pack (**81.4% vs 80.8%**, inside standard error). What *did* hold up was the **132 MiB** VRAM savings, which I banked in reserve in case I ever need a higher VRAM floor.

## Rejecting an Upstream Rebase and Cherry-Picking the Wins

After I switched the primary tier to Unsloth Dynamic V3.1 (`UD-IQ2_XS` + `Q8_0` PLE, which raised DeepSWE from 46.9% to 58.4% at the same 43.8 GB RAM footprint), upstream Strata reached `v0.2.12` - over 3,500 commits ahead of my `strata-lean` base.

Instead of rebasing blind, the agent built `v0.2.12` as a reference arm and ran paired ladders against `strata-lean`:

| Arm (`UD-IQ2_XS` + `Q8_0` PLE) | Steady Decode | 2k Prefill | 8k Prefill | VRAM Slots | Verdict |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`strata-lean` baseline** | 55.6 - 62.6 tok/s | 939 tok/s | 1,866 tok/s | 2,711 | Baseline |
| **Upstream `v0.2.12` re-slice** | 62.6 tok/s | 1,096 tok/s | 1,571 tok/s (-12%) | 2,527 (-184) | **Rejected** (extra 256 MiB reserve shrinks cache & 8k chunk) |
| **`strata-lean` + `CPU_SHARE_MAX=3072`** | 58.5 tok/s | **1,116 tok/s (+19%)** | 1,860 tok/s | 2,711 | **Promoted** (`env` config) |
| **`strata-lean` + `STRATA_ADAPT_FETCH=1`** | **70.4 tok/s (+27%)** | **1,116 tok/s** | **1,884 tok/s** | 2,711 | **Promoted** (cherry-picked `24c6c2f6` → `20c19b89`) |

Rebasing onto `v0.2.12` wholesale would've cost 184 expert slots and 12% of 8k prefill throughput for zero decode gain. Instead, I had the agent extract the two changes that actually helped on a 12 GB card:

1. **Wider CPU prefill sharing (`STRATA_PREFILL_CPU_SHARE_MAX=3072`):** Raises the prompt threshold where idle CPU threads help evaluate uncached experts from 1k to 3k tokens, lifting 2k prefill by **+19%** without shrinking the 8k GPU chunk.
2. **Adaptive PCIe miss admission (`STRATA_ADAPT_FETCH=1`):** Ported upstream's PCIe admission patch into `strata-lean`. Previously, when a verify window fetched a missed expert over PCIe, those weights were discarded after the step. With `STRATA_ADAPT_FETCH=1`, the engine copies that fetched expert into an unrouted slot in the GPU cache and updates the lookahead table. Cache hit rate jumped from **46.6% to 67.2%** in the benchmark window (and **81.5%** in live sessions), bringing `UD-IQ2_XS` decode from **55.6 to 70.4 tok/s** while keeping `strata-lean`'s 8k prefill advantage.


