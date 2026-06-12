---
title: "The 12GB VRAM Miracle: Running 120B, 80B, and 100+ TPS MoEs on a Single RTX 4070"
description: "How we configured the L3MS local LLM stack to squeeze massive models and speculative drafting out of consumer hardware."
date: 2026-06-12
authored_by: ai-generated
draft: false
tags:
  - AI
  - Self-Host
  - Benchmarks
pinned: false
---

A common belief in the local LLM community is that a 12GB VRAM card (like the Nvidia RTX 4070) is an "entry-level" bracket. Conventional wisdom says you are mostly limited to 8B or 14B models at decent speeds. If you want to run anything larger-like an 80B coder or a 120B reasoning model-you either need to stack multiple GPUs, accept painful CPU inference speeds (1–2 tok/s), or rent cloud compute.

But by designing an optimized local inference stack around **L3MS** and **llama-swap**, we have turned a single 12GB consumer GPU into a high-performance LLM workstation. 

We are currently serving a **120B MoE**, an **80B MoE**, and getting **over 100 tokens/second** on a 26B MoE-all locally, all on the same 12GB RTX 4070. To track these active configurations, benchmarks, and performance ranges in real time, we deployed a new high-density cyber-brutalist dashboard at [l3ms.carteakey.dev](https://l3ms.carteakey.dev).

Here is a breakdown of how the stack is orchestrated, followed by the complete inventory of active configurations on the leaderboard.

---

## The L3MS Stack Architecture

To make this setup ergonomic, we don't try to run all these models simultaneously. Instead, we rely on the stateful model-swapping capabilities of **`llama-swap`**:

* **`llama-swap` Gateway**: This is a stateful model-swapping daemon that acts as our single entry point. It exposes a standard OpenAI-compatible API and intercepts all incoming client requests. When a request targets a model that isn't currently loaded, `llama-swap` automatically unloads the active model, loads the requested one, and resumes. It uses a global TTL (Time-To-Live) of 10 minutes to auto-unload idle models, freeing up VRAM.

By letting `llama-swap` manage memory swapping dynamically, it feels like we have unlimited VRAM. We can write code with our 80B coder, swap to a 12B model for high-speed chat, and query the 120B giant for complex reasoning, with only a 10–20 second load delay between switches.

## Performance Tracking & Visualization

To catalog active configurations and benchmark results, we use a separate static dashboard deployed at [l3ms.carteakey.dev](https://l3ms.carteakey.dev). This is purely a visualization layer for tracking our performance leaderboards, not an active part of the serving stack:

* <span style="color: #00ff66">🏆 Active TPS Leaderboard</span>: Interactive leaderboard of serving configurations on the CachyOS RTX 4070 node. Includes live sorting (Speed, Context, Size), search, and tags (MTP, Vision, MoE).
* <span style="color: #00e5ff">📊 Performance Ranges</span>: Visual task-specific performance bar charts comparing baseline speeds against MTP drafting speeds.
* <span style="color: #ff007f">📦 Archived Catalog</span>: Structured breakdown of retired configurations showing parameters, retirement date, and replacement suggestions.

---

## Active Served Models & Leaderboard Inventory

Here is the full inventory of active served configurations on the CachyOS node, including their VRAM footprints (quants), context sizes, and maximum recorded throughput (TPS) as tracked on the leaderboard:

### 1. Blazing Fast Speculative Models (QAT + MTP)
These models combine training-optimized Quantization-Aware Training (QAT) with Multi-Token Prediction (MTP) drafting to achieve triple-digit generation speeds:
* **gemma-4-12B QAT + MTP** (`UD-Q4_K_XL` base, 131k context) - **120.80 tok/s**. Ultrafast dense model utilizing native speculative drafting.
* **gemma-4-26B QAT + MTP** (`UD-Q4_K_XL` base, 131k context) - **100.60 tok/s**. Our startup preload default, delivering MoE intelligence at a single-GPU VRAM footprint.
* **Qwen3.6-35B-A3B MTP** (`UD-Q4_K_XL` base, 131k context) - **73.97 tok/s**. Middle-weight MoE running MTP drafting.

### 2. High-Precision & Multimodal Variations
Standard baseline configurations and vision-capable profiles utilizing visual projection layers:
* **gemma-4-26B QAT** (`UD-Q4_K_XL` base, 131k context) - **69.00 tok/s**. Text-only base model without speculative drafting enabled.
* **Qwen3.6-35B-A3B MTP (Vision)** (`UD-Q4_K_XL` base, 131k context) - **65.00 tok/s**. MoE visual assistant using a F16 CLIP projection layer.
* **gemma-4-12B QAT** (`UD-Q4_K_XL` base, 131k context) - **59.90 tok/s**. Text-only base 12B without speculative drafting.
* **Qwen3.6-35B-A3B MTP Q6** (`UD-Q6_K` precision, 131k context) - **50.00 tok/s**. Higher-precision MoE using 6-bit weights.
* **gemma-4-26B QAT + MTP (Vision)** (`UD-Q4_K_XL` base, 131k context) - **39.00 tok/s**. Speculative drafting MoE with BF16 visual projection.
* **gemma-4-12B QAT + MTP (Vision)** (`UD-Q4_K_XL` base, 131k context) - **35.00 tok/s**. Speculative drafting dense model with BF16 visual projection.

### 3. CPU/GPU Split Giants
Heavyweight MoE models that exceed VRAM limits but are routed through static expert offloading to maximize CPU/GPU throughput:
* **Qwen3-Coder-Next 80B.A3B** (`UD-Q4_K_XL` base, 65k context) - **39.60 tok/s**. Our primary coding model, running via static bench-derived expert splitting.
* **gpt-oss 120B** (`MXFP4` base, 32k context) - **23.40 tok/s**. High-reasoning production giant, utilizing optimized CPU/GPU expert routing.
* **sarvam-30B** (`Q6_K` precision, 4k context) - **15.00 tok/s**. Specialized configuration.

By using the `llama-swap` gateway for dynamic memory swapping, we can access any model in this extensive inventory on-demand, getting top performance and high-density tracking without needing a massive server rack.
