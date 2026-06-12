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

Here is a breakdown of how the stack works and the three core techniques making it possible.

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

## Core Optimization Techniques

To run these massive models with usable speeds on 12GB VRAM, we leverage three advanced quantization and execution techniques:

### Technique 1: Quantization-Aware Training (QAT) + Speculative Drafting (MTP)
For models like **Gemma 4 12B** and **Gemma 4 26B**, we combine low-bit QAT quants with Multi-Token Prediction (MTP) drafting:
* **Quantization-Aware Training (QAT)**: Normally, standard 4-bit quants degrade intelligence. QAT introduces quantization noise *during* training, allowing the model to adapt. The resulting `UD-Q4_K_XL` quant (~14.2 GB for 26B) gives 8-bit intelligence at a 4-bit memory footprint, fitting entirely in VRAM.
* **MTP Speculative Decoding**: We run the QAT base model along with a lightweight 460MB MTP assistant model (`mtp-gemma-4-26B-A4B-it.gguf`). The assistant drafts multiple tokens in parallel, and the base model verifies them in a single GPU pass. 

By offloading the entire model to VRAM and using MTP, we achieve:
* **Gemma 4 12B QAT + MTP**: **120.80 tok/s**
* **Gemma 4 26B MoE QAT + MTP**: **100.60 tok/s**

### Technique 2: Static Expert-Offloading (CPU/GPU Hybrid routing)
For models that cannot possibly fit in VRAM, like **gpt-oss-120b** or **Qwen3-Coder-Next 80B.A3B**, we bypass standard automatic split layers. Instead, we write a static offloading matrix inside `llama-swap.yaml`:
* **The Non-Expert Layer Split**: We offload all non-expert attention and normalization layers (which are small but compute-heavy) to the GPU using llama.cpp's `-ngl` flag.
* **CPU Routing for MoE Experts**: We lock the model's massive MoE (Mixture of Experts) feed-forward blocks to the CPU using tensor overrides:
  ```bash
  --override-tensor "blk\.(5|[6-9]|[0-9][0-9]|[0-9][0-9][0-9])\.ffn_(up|down|gate)_(ch|)exps=CPU"
  ```
* **Thread Optimization**: We lock CPU inference to a specific thread affinity map using `taskset -c 0-11` on our Intel i5-12600K to prevent scheduler thrashing.

Because MoE models only activate a tiny subset of experts per token (e.g., 2 out of 64), we don't need to read all 120 billion parameters from system RAM for every token. Squeezing the active layers into the GPU while pinning the expert parameters in system RAM gives us highly usable speeds:
* **Qwen3-Coder-Next 80B**: **39.6 tok/s** (at a massive 64k context size!)
* **gpt-oss-120b**: **23.4 tok/s**

### Technique 3: Mainline llama.cpp Fit Offloading
For models like **Qwen 3.6 35B**, we use llama.cpp's dynamic memory fitting parameters:
```bash
--fit on --fit-ctx 131072 --fit-target 1536
```
This flag tells the runtime to dynamically fit as many layers as possible into the available VRAM while ensuring we have exactly 1536 MiB of headroom left over to hold the large 131k context KV caches.

---

## Active Served Models Catalog

Here is the inventory of active models configured in our homelab stack right now:

* **`gpt-oss-120b`**: Optimized MXFP4 quant. Serves as our master reasoning engine. Uses static split (blk 0–4 on GPU, blk 5+ experts on CPU).
* **`qwen3-coder-next`**: Qwen 3 Coder 80B MoE. Deployed in UD-Q4_K_XL. Serves as our primary programming assistant with 64k context window.
* **`qwen3-6-mtp`**: Qwen 3.6 35B MoE at UD-Q4_K_XL with MTP drafting. Excellent middle-weight reasoning.
* **`qwen3-6-mtp-vision`**: The 35B model with visual capabilities enabled via a `mmproj-F16.gguf` projection layer.
* **`gemma-4-26b-qat-mtp`**: Gemma 4 26B MoE. Standard startup default. Runs at 100.6 tok/s.
* **`gemma-4-26b-qat-mtp-vision`**: Gemma 4 26B MoE with vision support using a `mmproj-BF16` projector.
* **`gemma-4-12b-qat-mtp`**: Gemma 4 12B dense. Blazing fast at 120.8 tok/s.
* **`gemma-4-12b-qat-mtp-vision`**: Gemma 4 12B with vision support.
* **`sarvam-30b`**: Sarvam 30B (Q6_K precision) for specialized tasks.

By combining dynamic swapping (`llama-swap`), hybrid MoE offloading (`--override-tensor`), and speculative parallel decoding (`MTP`), a consumer 12GB GPU ceases to be a limitation. It becomes an incredibly powerful, versatile local AI host.
