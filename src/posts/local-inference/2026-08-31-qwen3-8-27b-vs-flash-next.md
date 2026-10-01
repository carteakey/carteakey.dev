---
title: Qwen3.8-27B vs Qwen3.8-Flash-Next — Which One to Run Locally?
description: Head-to-head on an RTX 4070 12GB + 64 GB DDR5 box — measured throughput on llama.cpp and Strata, an estimated intelligence index (~90 vs ~74), and a decision guide for dense vs. MoE local inference.
image: /img/blog-sketches/unique/qwen3-8-27b-vs-flash-next-stamp-trim.png
imageAlt: "Monochrome pencil sketch of a balance scale weighing a compact solid block against a large hollow lattice cube"
date: 2026-08-31
updated: 2026-09-30
authored_by: ai-assisted
draft: false
giscusTerm: "/blog/qwen3-8-27b-vs-flash-next/"
tags:
  - AI
  - Hardware
hidden: false
pinned: false
---

I run both flagship siblings from Alibaba's Qwen3.8 generation on the same homelab machine:
1. **The Dense Workhorse**: [Qwen3.8-27B](/blog/local-inference/running-qwen3-8-27b-locally/) — a 27B dense hybrid model packed entirely into 10.17 GiB of VRAM.
2. **The 176B Sparse Behemoth**: [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/) — a 125B MoE + 51B Per-Layer Embedding (PLE) table sprawling across VRAM, host DDR5 RAM, and Gen4 NVMe.

They consume roughly the same electrical power under load, but on a 12 GB GPU, they cannot co-exist in memory simultaneously. Only one can claim the default slot behind [llama-swap](https://github.com/mostlygeek/llama-swap).

This post breaks down the measured head-to-head performance, constructs an estimated **Intelligence Index (~90 vs ~74)** anchored on public evals and rough quant-retention assumptions, and provides a reusable decision guide for choosing between compact dense models and large-scale MoEs on consumer hardware.

---

> [!NOTE]
> **September 2026 Update**: When this comparison was originally authored in late August, Flash-Next was bound by `llama.cpp`'s layer-offloading memory wall at **~20.5 t/s**, giving the 27B a nearly 2× decode lead (36.7 t/s). With the arrival of dedicated bare-metal engines like **[Strata](/blog/local-inference/the-rise-of-overfit-inference-engines/)**, Flash-Next now achieves **53–63 t/s steady decode (up to 90.2 t/s burst)** on this exact same box. See the [September 2026 Update section](#7-the-september-2026-update-how-strata-flipped-the-speed-equation) below for how this re-shaped the trade-off.

---

## 1. TL;DR

* **Intelligence (estimate)**: Indexed against Flash-Next BF16 = 100, the serving quants land at roughly **~90 (Flash-Next AD-4.27bpw)** versus **~74 (27B UD-IQ3_XXS)**. [Section 4](#4-the-intelligence-index-90-vs-74) explains how soft that number is. The ~16-point gap shows up on multi-step reasoning, subtle code debugging, and complex instruction following.
* **Speed on Strata (current)**: Flash-Next decodes at **53–63 t/s steady** (up to 90.2 t/s burst on a lower-bit Q2_0 quant) with **1,138–2,013 t/s prefill**, ahead of the 27B's **36.7 t/s flat** and **~1,160 t/s prefill** on stock `llama.cpp`.
* **Speed on stock `llama.cpp` (historical)**: Flash-Next managed **~20.5 t/s** (**~25.3 t/s with MTP**, **35.9 t/s** once n-grams warm up), so the 27B led by nearly 2× before bare-metal engines arrived.
* **Context Ceiling**:
  * **27B**: Holds the full native **262k context window** inside 12 GB VRAM using `q5_0`/`q4_1` KV cache. Only 16 of its 64 layers store KV state (the other 48 are constant-state Gated-DeltaNet linear attention), which slashes the cache footprint.
  * **Flash-Next**: **128k** on Strata (K8V4 KV streaming); only **64k** on stock `llama.cpp`, where 128k hits CUDA-OOM.
* **The Verdict**: Flash-Next on Strata is the default for nearly everything. Keep the 27B for the cases it still wins: when the desktop needs the host RAM, or when you need context beyond 128k up to 262k.

---

## 2. The Contenders & Hardware Setup

All tests were recorded on my primary homelab workstation ({% device "yeti-cachy" %}), running CachyOS Linux:
* **GPU**: NVIDIA GeForce RTX 4070 (12.28 GiB VRAM, Ada Lovelace SM89)
* **CPU**: Intel Core i5-12600K (10 cores [6P+4E], 16 threads, AVX2, Performance governor)
* **RAM**: 64 GB DDR5-5600 MT/s (dual-channel)
* **Storage**: WD Black SN770 2TB Gen4 NVMe SSD (7,000 MB/s read)

### The Models
* **Qwen3.8-27B** (`unsloth/Qwen3.8-27B-UD-IQ3_XXS`, 3.06 bpw, 10.17 GiB): A hybrid architecture consisting of 48 Gated-DeltaNet (GDN) linear recurrent blocks and 16 standard multi-head attention blocks. The entire model fits cleanly into GPU VRAM with zero host RAM overhead.
* **Qwen3.8-Flash-Next** (AtomicChat `AD-4.27bpw-Q4_K_M-M64` / DASLab `IQ3_XXS`, ~75–88 GiB): A massive sparse MoE with 48 layers, 512 routed experts per layer (top-10 active, ~6B active parameters per token), a 51.2B-parameter n-gram PLE table, and an integrated speculative drafting head. Attention and routers run on GPU; cold experts live in host RAM; the 29 GB PLE table streams on-demand from NVMe via `mmap`.

---

## 3. Measured Head-to-Head

| Metric / Dimension | Qwen3.8-27B (UD-IQ3_XXS) | Qwen3.8-Flash-Next (`llama.cpp` AD-4.27bpw) | Qwen3.8-Flash-Next (Strata Platinum IQ3_XXS) |
| :--- | :---: | :---: | :---: |
| **Model Footprint** | 10.17 GiB (pure VRAM) | 88 GiB (split RAM+VRAM+NVMe) | 75.8 GiB (split RAM+VRAM+NVMe) |
| **Prompt Processing (Prefill)** | **~1,160 t/s** (pp4096, pure GPU) | ~200 t/s (cold), ~385 t/s (warm) | **1,138–2,013 t/s** (MMQ chunks) |
| **Decode: Novel Generation** | **36.7 t/s** (flat across context) | 20.5–22.1 t/s (plain master) | **53.2–62.6 t/s** (steady code) |
| **Decode: High Speculation / N-Gram** | 36.7 t/s | 25.3–27.1 t/s (MTP PR #28243) / 35.9 t/s (warm PLE) | **90.2 t/s** (native MTP Q2_0) |
| **Max Working Context** | **262k native** (fits in VRAM) | 64k (`-c 65536`, 128k OOMs) | **128k native** (K8V4 KV streaming) |
| **Host System RAM Load** | **0 GB** (pure GPU resident) | ~50 GiB RSS (14 GB headroom) | **48 GiB RSS** (16 GB headroom) |
| **Desktop / Multitasking Friendliness** | **Flawless** (full host RAM free) | Sensitive (desktop memory spikes cause swap) | Good (16 GB host headroom + THP) |

{% image_cc "./src/static/img/diagrams/qwen38-decode-speed-chart.png", "Horizontal bar chart of decode speed on an RTX 4070 12GB in tokens per second: 27B on llama.cpp 36.7, Flash-Next on llama.cpp 20.5, Flash-Next on llama.cpp with MTP 25.3, Flash-Next on Strata steady 53 to 63, Flash-Next on Strata burst 90.2 using a Q2_0 quant", "sketch-draw", "Decode speed from the table above. The Strata steady bar is the low end of the 53.2–62.6 t/s range (whisker to the top); the 90.2 t/s burst figure is on a lower-bit Q2_0 quant." %}

---

## 4. The Intelligence Index (~90 vs ~74)

Benchmark scores often collapse nuance, but evaluating raw models without accounting for quantization degradation is equally deceptive. This index is a back-of-envelope **estimate**, not a measurement: base capability comes from public evals, while the quant-retention percentages are my own assumptions, not numbers I measured on these exact quants. It combines:
1. **Public Foundation Benchmark Deltas** (LLM Stats, LiveCodeBench, SWE-bench).
2. **Assumed Quantization Retention** (rough ranges informed by KL-divergence / top-1% token agreement behavior vs. full BF16).

### 4.1 Base Model Capability
On the global [LLM Stats](https://llm-stats.com/models/compare/qwen3.7-plus-vs-qwen3.8-flash-next) leaderboard:
* **Qwen3.8-Flash-Next** achieves an overall score of **49.7** (#15 globally at time of writing). In the linked head-to-head against Qwen3.7-Plus it wins every shared evaluation (e.g. GPQA 91.7 vs 90.3, LiveCodeBench v6 91.9 vs 89.6; SWE-bench Verified 54.2%).
* **Qwen3.8-27B** performs on par with Qwen3.7-Plus (~43.0), showing a **13% to 15% capability deficit** at full precision. While remarkably sharp for a 27B model, its smaller capacity shows on long-horizon reasoning, symbolic math, and multi-turn refactoring.

### 4.2 Quantization Retention Analysis
Quantizing a model degrades its top-1% logits agreement. However, dense and MoE architectures degrade at fundamentally different rates:
* **Dense 3-bit (`UD-IQ3_XXS`, 3.06 bpw)**: Because all 27B parameters are continuously active, aggressively quantizing down to 3 bits introduces measurable rounding error into attention projections. Quant retention is assumed at **~85–87%**.
* **MoE 3-bit / 4-bit (`AD-4.27bpw` / `IQ3_XXS`)**: Sparse MoEs tend to be more quantization-resilient (and the scored variant is the 4.27bpw quant, so part of the gap is simply more bits). Router gating isolates noise, and critical PLE tables remain at higher precision on disk. Quant retention is assumed at **~90–92%**.

### 4.3 The Combined Index
Setting unquantized **Qwen3.8-Flash-Next BF16 = 100**:

| Variant / Profile | Base Capability | Quant Retention | **Intelligence Index** |
| :--- | :---: | :---: | :---: |
| **Qwen3.8-Flash-Next BF16** | 100 | 100% | **100** |
| **Qwen3.8-Flash-Next (AD-4.27bpw / IQ3_XXS)** | 100 | ~90% | **~90** |
| **Qwen3.8-27B BF16** | ~87 | 100% | **~87** |
| **Qwen3.8-27B (UD-IQ3_XXS, 3.06 bpw)** | ~87 | ~85–87% | **~74** |

The resulting spread is **~90 vs ~74** (roughly 45 vs 37 in absolute LLM Stats points). Treat it as directional: a 10–20 point gap is plausible, the exact figure is not.

In my own day-to-day use (anecdotal, not benchmarked), the 27B occasionally produces an off-by-one error in complex regex or drops a secondary instruction in multi-turn chat, whereas Flash-Next more reliably nails subtle constraints on the first pass.

---

## 5. The Hardware & Workload Decision Matrix

### 5.1 Hardware Filter

Two gates decide most setups:

{% wide %}
| Gate | If… | Pick | Why |
| :--- | :--- | :--- | :--- |
| **1. Host RAM ≥ 64 GB?** | No | **Qwen3.8-27B** | Fits in 10.2 GB VRAM and needs no host RAM. The ~88 GiB MoE file (expert weights plus the ~29 GB PLE table, which streams from NVMe) can't be served comfortably from less. |
| **2. Discrete GPU?** | No GPU / Mac | **Flash-Next** | The MoE streams ~6B active params quickly from RAM, while a dense model crawls. |
| | 12 GB GPU | **Both fit** | Split by workload, below. |
{% endwide %}

### 5.2 Task Routing on a 12GB / 64GB Box

| Workload Scenario | Recommended Model | Why |
| :--- | :---: | :--- |
| **Heavy Multitasking / Gaming / Dev Containers** | **Qwen3.8-27B** | Consumes 0 GB host RAM. Leaves all 64 GB free for browsers, compilers, and Docker. |
| **Ultra-Deep Context (>128k up to 262k)** | **Qwen3.8-27B** | Native 262k context lives in VRAM; Flash-Next tops out at 128k on Strata (64k on stock `llama.cpp`). |
| **Autonomous Coding Loops & Fast Tool Calls** | **Flash-Next (Strata)** | 53–63 t/s steady decode and 1,100+ t/s prefill beat the 27B's 36.7 t/s. On stock `llama.cpp` (20.5 t/s) the 27B is the faster pick. |
| **Complex Logic, Architecture, Math & Nuance** | **Flash-Next** | The estimated ~16-point intelligence premium (~90 vs ~74) helps on tricky code. |
| **Repetitive Boilerplate & Code Refactoring** | **Flash-Next** | N-gram table and MTP speculative decoding hit 35–90 t/s on repetitive structures (the top end is on a lower-bit quant). |

---

## 6. The Generic Dense vs. MoE Chooser Tree

This decision logic generalizes beyond Qwen to any pair comparing a **compact dense model (7B–32B)** against a **large sparse MoE (100B+ total, ≤10B active)**:

{% wide %}
| Gate | If… | Pick | Why |
| :--- | :--- | :--- | :--- |
| **1. Fast-memory headroom** | Spills to disk | **Dense, full VRAM** | Dense CPU offload crawls (5–10× decode drop), but pure-VRAM dense holds ~37 tok/s with no host RAM thrash. |
| **2. Discrete GPU** | CPU / unified memory only | **MoE (Flash-Next)** | Only ~6B active params per token, so it decodes several times faster from system RAM than a dense model. |
| **3. Workload** | >128k context or shared machine | **Dense (Qwen 27B)** | Leaves 100% of host RAM free and holds 262k context in VRAM at a flat 36.7 t/s. |
| | Unconstrained workstation | **MoE (Flash-Next)** | Unlocks the ~90 intelligence ceiling at 53–63 tok/s steady on Strata (about 20 tok/s on stock `llama.cpp`). |
{% endwide %}

{% image_cc "./src/static/img/diagrams/qwen38-dense-vs-moe-chooser.png", "Decision tree: if the MoE does not fit in RAM plus VRAM, pick Dense 27B; otherwise if there is no discrete GPU, pick the MoE; otherwise if you need over 128k context or free host RAM, pick Dense 27B, else the MoE (Flash-Next)", "sketch-draw", "The same three gates as the table, drawn as a flow: each question either ends at a model or hands off to the next gate." %}

---

## 7. The September 2026 Update: How Strata Flipped the Speed Equation

When this head-to-head was first benchmarked on stock `llama.cpp`, the trade-off was straightforward:
> *"Qwen3.8-27B is twice as fast (36.7 vs 20.5 t/s), but Flash-Next is noticeably smarter (~90 vs ~74)."*

In September 2026, the rise of [bare-metal, overfit inference engines](/blog/local-inference/the-rise-of-overfit-inference-engines/)—specifically **Strata** and **StrataGP**—completely upended that balance:

1. **Dynamic Expert Caching**: Instead of offloading all 512 experts of 3 layers to VRAM and leaving 45 layers on CPU, Strata keeps the top **3,086 hottest experts across all 48 layers in VRAM**. GPU hit rates reach 70–75%.
2. **Transparent Huge Pages (`MADV_HUGEPAGE`)**: Eliminates host memory TLB misses by collapsing 10.5 million 4 KB page entries into 2 MB hugepages.
3. **Speculative MTP Drafting**: Verifies multi-token draft predictions on the GPU with 70–97% acceptance.

### The New Reality:
* **Prefill**: Scaled from 200 t/s up to **1,138–2,013 t/s**.
* **Generation**: Jumped from 20.5 t/s to **53–63 t/s steady state** (and **90.2 t/s peak**).
* **Context**: Expanded safely to **128k (`131072`)** using K8V4 KV cache streaming.

As a result, **Flash-Next is now faster than the 27B on the very same 12 GB card (60 t/s vs 36.7 t/s)** while (presumably) keeping its intelligence advantage. Two caveats: the 27B figure is still stock `llama.cpp`, so this compares a tuned engine against an untuned one, and the Strata numbers use IQ3_XXS (Q2_0 for the 90.2 t/s peak), lower-bit quants than the AD-4.27bpw scored in section 4, so the ~90 index may not carry over in full.

### Does Qwen3.8-27B Still Have a Role?
Yes—and its role is now sharply defined:
* **The Zero-Footprint Workhorse**: The 27B claims zero bytes of system RAM. You can render 3D scenes, compile massive codebases, or run memory-heavy IDEs without worrying about model thrashing.
* **The Full 262k Horizon**: If you need to search a 250,000-token codebase in a single pass without loading 50 GB into DDR5, the 27B handles it effortlessly inside VRAM.

For everything else, Flash-Next has taken the throne.

---

## References & Further Reading

* [Running Qwen3.8-27B Locally (Pure VRAM Configuration)](/blog/local-inference/running-qwen3-8-27b-locally/)
* [Running Qwen3.8-Flash-Next Locally (Dual-PR & Serving Stack)](/blog/local-inference/running-qwen3-8-flash-next-locally/)
* [The Rise of Overfit Inference Engines: Why Bare-Metal Targeting Beats Universal Runtimes](/blog/local-inference/the-rise-of-overfit-inference-engines/)
* [LLM Stats: Qwen3.7-Plus vs Qwen3.8-Flash-Next](https://llm-stats.com/models/compare/qwen3.7-plus-vs-qwen3.8-flash-next)
* [Unsloth Qwen3.8-27B GGUF Repository](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF)
* [ISTA-DASLab Qwen3.8-Flash-Next GSQ-RCO Quants](https://huggingface.co/ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF)

