---
title: "Unsloth Dynamic vs GSQ-RCO: Testing Qwen3.8-Flash-Next on an RTX 4070"
description: "Benchmarking Unsloth Dynamic V3.1 vs GSQ-RCO on an RTX 4070: memory fit, Q5_0 down projections, and token throughput."
image: /img/blog-sketches/unique/running-qwen3-8-flash-next-locally-stamp-trim.png
imageAlt: "Monochrome sketch representing Qwen3.8-Flash-Next local inference on an RTX 4070"
date: 2026-11-05
giscusTerm: "/blog/local-inference/unsloth-dynamic-vs-gsq-quants/"
authored_by: ai-assisted
draft: true
tags:
  - AI
  - Self-Host
---

Yesterday Unsloth published their Dynamic V3.1 quants for Qwen3.8-Flash-Next. Their claim is that dynamic mixed-precision quantization across the MoE layers beats standard GSQ-RCO quants by double digits on code reasoning benchmarks while keeping file sizes the same.

I've been running the ISTA-DASLab GSQ-RCO `IQ3_XXS` quant as my daily driver on {% device "yeti-cachy" %} since October. It clocks ~70 tok/s steady decode with native MTP speculative decoding in Strata, paired with an unquantized Q8_0 n-gram table streamed from NVMe. So I pulled Unsloth's weights, patched my local `strata-lean` fork to run them, and measured how the new layout behaves on real hardware.

Here's what I found about iso-size matching, memory fit, and how the token throughput compares.

## Sizing by file size, not bit names

The first thing to understand about Unsloth's Dynamic quants is that the naming convention doesn't match standard GGUF bits. Unsloth quantizes dynamically per layer: critical routing gates and attention projections stay at higher bits (like Q4_K or IQ4_XS), sensitive down projections use Q5_0, and the non-critical MoE experts get pushed down to 2-bit.

Because of this mixed layout, you have to compare quants by their total on-disk and in-memory footprint rather than the label on the file:

| Total Model Size | GSQ-RCO Quant | Unsloth Dynamic V3.1 | Non-PLE Fast RAM | DeepSWE v1.1 | 12-Bench Avg Recovery |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **~68.0 GB** | `IQ2_XS` | `UD-IQ1_M` | ~45.7 GB | 39.8 vs **49.6** | 89.5% vs **97.4%** |
| **~75.8 GB** | `IQ3_XXS` *(my baseline)* | **`UD-IQ2_XS`** | **43.8 GB** | 46.9 vs **58.4** | 96.8% vs **99.4%** |
| **~83.7 GB** | `IQ3_S` | `UD-IQ3_XXS` | ~54.9 GB | 54.9 vs **55.1** | 99.0% vs **99.9%** |

On a 64 GB host with a 12 GB GPU, **`UD-IQ2_XS` is the actual peer to GSQ-RCO `IQ3_XXS`**. Both require around 43.8 GB of fast memory for non-PLE weights. That leaves about 18 GB of free headroom for Linux page caches, Wayland, and active terminal buffers.

If you jump straight to `UD-IQ3_XXS` thinking it's the counterpart to `IQ3_XXS`, you'll run out of room. `UD-IQ3_XXS` needs nearly 55 GB of fast RAM. On a 64 GB box, that immediately forces pages into zram swap, triggers NVMe expert re-faults, and tanks token generation from 70 tok/s down to single digits.

## Keeping the unquantized Q8_0 PLE table

Qwen3.8-Flash-Next uses a giant 51-billion-parameter n-gram lookup table (`per_layer_token_embd.weight`). Unsloth packages their quants in three shards, where Shard 3 is a 26.8 GB `IQ4_NL` quantized version of this table.

I didn't download their Shard 3.

The n-gram table is derived from the base model weights, not the quant. It's completely orthogonal to whether the MoE experts are quantized as GSQ or Unsloth Dynamic. My existing uncompressed Q8_0 PLE table sits on NVMe at 54.4 GB. It has an RMSE of 0.0053 against fp16 (compared to 0.0757 for IQ4_NL) and costs exactly zero VRAM because Strata streams its rows via direct unbuffered reads on demand.

So I symlinked Shard 3 directly to my existing Q8_0 PLE file and ran the pack generator:

```bash
python3 tools/iq_pack.py --compat-bf16 \
  --native /mnt/dev/models/unsloth/UD-IQ2_XS/Qwen3.8-Flash-Next-UD-IQ2_XS-00001-of-00003.gguf \
  --ple-gguf /mnt/dev/models/PLE-Q8/Qwen3.8-Flash-Next-GSQ-RCO-Q8_0-PLE-00002-of-00002.gguf \
  --out vendor/Strata-data/packs/ud-iq2_xs
```

Because Strata streams weights in-place with `--compat-bf16`, the packer only extracted the dense projections and metadata (`dense.bin`, 1.5 GB), avoiding redundant 70 GB copies on SSD.

## Fixing the split check and Q5_0 dots in Strata

Getting the new quant to actually boot in my minimal Strata build (`carteakey/strata-lean`) required two quick fixes in C++:

First, Unsloth uses `Q5_0` down-expert dot products. Upstream Strata had a bug in the CUDA activation sum offset (`d5 * d8 * (sumi - 16 * sumu)`), which author Niko fixed in commit `aa678f10`. I cherry-picked that into my lean Ada `sm_89` branch.

Second, because I paired Unsloth's 3-shard model with my existing 2-shard Q8_0 PLE table, Strata's split-loader threw errors during initialization:

```text
strata generate: native embedding: GGUF: ...-00003-of-00003.gguf does not declare itself shard 3 of 3 of this model (split.count / split.no / split.tensors.count)
```

The GGUF header inside my PLE table declared `split.count: 2`, while the Unsloth shards declared `split.count: 3`. I relaxed the split validation checks in `include/strata/artifact/gguf_reader.hpp` and `src/core/native_dense.cpp` so that shards containing only `per_layer_token_embd.weight` bypass the strict shard-index match.

Once recompiled, Strata booted cleanly:

```text
strata generate: native pack: ud-iq2_xs experts (largest blob 2.18 MB)
strata generate: token embedding IQ4_XS in mapped host memory (322 MiB)
strata generate: 300 native projection matrices, 2679.61 MiB of weights
strata generate: PLE on, table 320001536 rows of Q8_0 PLE
strata mtp: draft layer loaded, 818 MiB of VRAM
ready: http://127.0.0.1:10021/v1 (context 131072 tokens)
```

## What the benchmarks show

I ran multi-probe coding benchmarks across both quants on the same hardware (RTX 4070 12 GB, 64 GB host RAM, DDR5, K8V4 KV cache @ 128k context, and native MTP speculative decoding with `--spec 4 --spec-min-p 0.5`):

| Metric | GSQ-RCO `IQ3_XXS` | Unsloth `UD-IQ2_XS` | Real-World Impact |
| :--- | :---: | :---: | :--- |
| **MTP Draft Acceptance** | **72.5%** mean | **77.0%** mean | Up to **88.3%** on algorithmic code |
| **Decode Throughput** | ~70 tok/s | ~60 tok/s (59.7 warm) | ~10 tok/s delta for higher precision math |
| **VRAM Expert Slots** | 3,086 pairs (4.24 GiB) | 2,711 pairs (4.33 GiB) | -375 slots (Q5_0 down matrices are larger) |
| **Host RAM Working Set** | 43.8 GB | 39.4 GB | 4.4 GB more RAM headroom for the OS |
| **SSD Spill (read_bytes)** | ~3.5 KB/tok | ~3.4 KB/tok | Pure PLE streaming, 0 expert refaults |
| **DeepSWE v1.1 (Quality)** | 46.9 | **58.4** | +11.5 points higher code resolution |

### Why MTP draft acceptance climbed to 77%

Speculative decoding relies heavily on the draft model's predictions aligning with the main model's logits. With `UD-IQ2_XS`, the draft acceptance rate noticeably improved, averaging 77.0% (and 78.8% on a cold pass) while hitting 88.3% on complex Dijkstra and attention mechanics prompts (compared to 72.5% on GSQ-RCO).

Because Unsloth preserved higher bit precision on critical routing gates, the main model produces cleaner decision boundaries that align more reliably with the MTP head.

### Why tok/s is lower

With CPU cores locked in `performance` mode (4.5 to 4.9 GHz), decode throughput landed at **59.7 tok/s steady state** (up from 54.6 tok/s when cores idled in powersave), compared to roughly 70 tok/s on GSQ-RCO.

There are two main reasons for this:
1. **Fewer GPU-resident experts**: Because `Q5_0` down-expert matrices have a larger byte footprint per expert pair (1.64 MB vs 1.37 MB), the 4.33 GiB VRAM cache holds 2,711 expert pairs instead of 3,086. That pushes more expert misses onto the CPU worker threads.
2. **Heavier CPU dot products**: The CPU expert pool runs on AVX-2 across physical cores. Executing 5-bit `Q5_0` matrix multiplication on host RAM is computationally heavier than running 3-bit `IQ3_XXS` dots.

(Also, watch your CPU governor: if your cores are sitting in `powersave` with `min_perf_pct: 17`, CPU cores idle at 800 MHz and ramp up late on every expert miss, dropping decode speed down to ~54 tok/s.)

### The VRAM math on a 12 GB card

I wondered if I could just give the expert cache more VRAM to bring it back to 3,400+ pairs. The answer is no, because 2,711 pairs is already the physical ceiling of a 12 GB card:

```text
Native dense attention/projections:   2,680 MiB
MTP draft layer (rt):                   818 MiB
Q5_K output head:                       521 MiB
Pack dense backbone weights:          1,466 MiB
Expert cache (2,711 pairs @ 1.64 MB): 4,435 MiB
K8V4 KV cache + CUDA verify windows:  1,642 MiB
-------------------------------------------------
Total active VRAM:                   11,562 MiB (out of 12,282 MiB)
```

That leaves just 588 MiB of headroom, which dips to ~278 MiB when capturing 5-token speculative verify windows. Bumping the cache to 3,400 pairs would demand another 1,130 MiB, pushing total VRAM to 12.69 GB and triggering immediate driver paging to host RAM, which would crash throughput into the dirt. 

Strata's `auto` allocator already extracted every usable megabyte from the card.

### The verdict

If raw generation speed is your only priority, GSQ-RCO `IQ3_XXS` remains faster at ~70 tok/s.

But for actual coding and multi-turn reasoning, `UD-IQ2_XS` is a clear upgrade. The +11.5 jump on DeepSWE v1.1 is immediately visible in complex refactoring prompts, the MTP draft acceptance is consistently higher, and memory fit is even slightly leaner (39.4 GB vs 43.8 GB), all while reusing your existing unquantized Q8_0 PLE table.
