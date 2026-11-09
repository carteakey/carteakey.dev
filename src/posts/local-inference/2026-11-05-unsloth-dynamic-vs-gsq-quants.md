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

Yesterday Unsloth published their Dynamic V3.1 quants for Qwen3.8-Flash-Next, claiming double-digit gains on code reasoning benchmarks over standard GSQ-RCO quants at the same file size.

I've been running the ISTA-DASLab GSQ-RCO IQ3_XXS quant as my daily driver on {% device "yeti-cachy" %} since October (~70 tok/s steady decode in Strata with native MTP and an unquantized Q8_0 n-gram table on NVMe). I pulled Unsloth's weights, patched my local `strata-lean` fork to boot them, and measured how the new layout behaves on the 12 GB card.

## Sizing by file size, not bit names

Unsloth's Dynamic quants don't match standard GGUF bit labels. Critical routing gates and attention projections stay at higher bits, sensitive down projections use Q5_0, and the bulk of the MoE experts drop to 2-bit. You have to compare them by total memory footprint rather than the name on the file:

{% image_cc "./src/static/img/local-inference/qwen38-flash-next-unsloth-v31-vs-gsq-benchmarks.webp", "Four-panel benchmark comparison of Qwen3.8-Flash-Next under Unsloth V3.1 dynamic quants vs GSQ-RCO across total model size in GB. Panels show 12-benchmark average recovery, DeepSWE v1.1, Terminal Bench 2.1, and LiveCodeBench v6.", "", "Unsloth's published benchmarks by total model size. At ~76 GB, UD-IQ2_XS recovers 99.4% of the 12-benchmark BF16 baseline and scores 58.4 on DeepSWE v1.1 vs 46.9 for GSQ-RCO IQ3_XXS." %}

| Total Model Size | GSQ-RCO Quant | Unsloth Dynamic V3.1 | Non-PLE Fast RAM | DeepSWE v1.1 | 12-Bench Avg Recovery |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **~68.0 GB** | `IQ2_XS` | `UD-IQ1_M` | ~45.7 GB | 39.8 vs **49.6** | 89.5% vs **97.4%** |
| **~75.8 GB** | `IQ3_XXS` *(my baseline)* | **`UD-IQ2_XS`** | **43.8 GB** | 46.9 vs **58.4** | 96.8% vs **99.4%** |
| **~83.7 GB** | `IQ3_S` | `UD-IQ3_XXS` | ~54.9 GB | 54.9 vs **55.1** | 99.0% vs **99.9%** |

On a 64 GB host with a 12 GB GPU, **UD-IQ2_XS is the actual peer to GSQ-RCO IQ3_XXS**, leaving about 18 GB of free RAM for Linux page caches, Wayland, and terminal buffers. Jumping straight to UD-IQ3_XXS because the name matches IQ3_XXS eats nearly 55 GB of fast RAM, pushes pages into zram swap, triggers NVMe expert re-faults, and drops decode into single digits.

## Keeping the unquantized Q8_0 PLE table

Qwen3.8-Flash-Next uses a 51-billion-parameter n-gram lookup table (`per_layer_token_embd.weight`). Unsloth ships Shard 3 as a 26.8 GB IQ4_NL quantized version of that table, and I skipped downloading it.

Because the n-gram table comes from the base model weights rather than the MoE quant, my existing uncompressed Q8_0 PLE shard on NVMe (54.4 GB, ten times lower RMSE against fp16 than IQ4_NL) works with any expert quant and costs zero VRAM because Strata streams its rows via unbuffered reads on demand. I symlinked Shard 3 to my Q8_0 PLE file and ran the pack generator:

```bash
python3 tools/iq_pack.py --compat-bf16 \
  --native /mnt/dev/models/unsloth/UD-IQ2_XS/Qwen3.8-Flash-Next-UD-IQ2_XS-00001-of-00003.gguf \
  --ple-gguf /mnt/dev/models/PLE-Q8/Qwen3.8-Flash-Next-GSQ-RCO-Q8_0-PLE-00002-of-00002.gguf \
  --out vendor/Strata-data/packs/ud-iq2_xs
```

With `--compat-bf16`, the packer only extracts the dense projections and metadata (`dense.bin`, 1.5 GB) without duplicating the expert shards on SSD.

## Fixing the split check and Q5_0 dots in Strata

Booting the hybrid pack in my `carteakey/strata-lean` fork needed two small C++ changes:

1. **Q5_0 down-expert dot products:** Upstream Strata had a bug in the CUDA activation sum offset (`d5 * d8 * (sumi - 16 * sumu)`), which Niko fixed in commit `aa678f10`. I cherry-picked that onto my Ada branch.
2. **Shard-count mismatch on the PLE table:** Pairing Unsloth's 3-shard model with my 2-shard Q8_0 PLE file tripped Strata's split-loader check (`split.count: 2` vs `3`). I relaxed the check in `include/strata/artifact/gguf_reader.hpp` and `src/core/native_dense.cpp` when a shard only holds `per_layer_token_embd.weight`:

```text
strata generate: native pack: ud-iq2_xs experts (largest blob 2.18 MB)
strata generate: token embedding IQ4_XS in mapped host memory (322 MiB)
strata generate: 300 native projection matrices, 2679.61 MiB of weights
strata generate: PLE on, table 320001536 rows of Q8_0 PLE
strata mtp: draft layer loaded, 818 MiB of VRAM
ready: http://127.0.0.1:10021/v1 (context 131072 tokens)
```

## What the benchmarks show

I ran coding probes across both quants on the same box (RTX 4070 12 GB, 64 GB DDR5, k8v4 KV cache at 128k context, and native MTP with `--spec 4 --spec-min-p 0.5` and CPU governor locked to `performance`):

| Metric | GSQ-RCO `IQ3_XXS` | Unsloth `UD-IQ2_XS` (initial) | Unsloth `UD-IQ2_XS` (`+ADAPT_FETCH`) |
| :--- | :---: | :---: | :--- |
| **MTP Draft Acceptance** | 72.5% mean | **77.0%** mean (up to 88.3%) | **77.0%** mean |
| **Decode Throughput** | ~70 tok/s | 59.7 tok/s | **70.4 tok/s** |
| **VRAM Expert Slots** | 3,086 pairs (4.24 GiB) | 2,711 pairs (4.33 GiB) | 2,711 pairs (67.2% hit rate) |
| **Host RAM Working Set** | 43.8 GB | **39.4 GB** | **39.4 GB** |
| **SSD Spill (read_bytes)** | ~3.5 KB/tok | ~3.4 KB/tok | ~3.4 KB/tok |
| **DeepSWE v1.1 (Quality)** | 46.9 | **58.4** | **58.4** |

Higher bit precision on the routing gates gives cleaner logits that agree more often with the MTP draft head, lifting draft acceptance from 72.5% to 77.0% (and up to 88.3% on algorithmic code).

### Why tok/s dropped at first - and how `ADAPT_FETCH` bought it back

On the first run, decode speed dropped by about 10 tok/s for two reasons:
1. **Larger expert pairs in VRAM:** Because Q5_0 down-expert matrices are larger than IQ3_XXS pairs (1.64 MB vs 1.37 MB), the 4.33 GiB VRAM cache holds 375 fewer expert pairs, sending more misses to the CPU worker threads.
2. **Heavier CPU AVX-2 dots:** Running 5-bit Q5_0 matrix multiplications in host RAM is heavier per miss than 3-bit IQ3_XXS (and if your CPU governor sits in `powersave`, cores idle between misses and drop another ~5 tok/s).

We couldn't just grow the VRAM cache past 2,711 pairs, because that already fills 11,562 MiB out of 12,282 MiB on the card:

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

Instead of adding slots, two config and cache changes bought the speed back two days later: raising the CPU prefill share limit from 1,024 to 3,072 tokens lifted 2K prefill from 939 to 1,116 tok/s, and porting upstream's `STRATA_ADAPT_FETCH=1` switch (which admits a fetched expert into an idle resident slot instead of discarding it) raised the cache hit rate from 46.6% to 67.2% and brought steady decode back up to **70.4 tok/s**.

At 70.4 tok/s, UD-IQ2_XS runs at virtually the same speed as my old IQ3_XXS setup while scoring 11.5 points higher on DeepSWE v1.1 and using 4.4 GB less host RAM.
