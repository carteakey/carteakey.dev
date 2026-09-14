---
title: Running Qwen3.8-27B locally on a 12GB VRAM card
description: Ridge 3.7bpw, UD-IQ3_XXS, and UD-Q2_K_XL on llama.cpp with an RTX 4070 — decoding at 34–40 tok/s and a native 262k window
date: 2026-08-19
updated: 2026-08-19
authored_by: ai-assisted
draft: false
tags:
  - AI
  - Self-Host
hidden: false
pinned: false
---

Qwen3.8-27B is a hybrid model — 48 Gated-DeltaNet (SSM) layers and 16 full-attention layers. That hybrid pays off at the edge: on a 12 GB RTX 4070 it decodes at ~35–40 tok/s **fully in VRAM**, and because only a quarter of the layers carry a KV cache, you can hold a huge context without the weights blowing out the card.

This post covers the three quantizations I settled on, the exact llama.cpp flags, and the numbers I measured.

## TL;DR

- **Model**: `empero-ai/Qwen3.8-27B-Ridge-3.7bpw.gguf` (Ridge mix, 3.69 bpw), `unsloth/Qwen3.8-27B-UD-IQ3_XXS.gguf` (3.06 bpw), and `unsloth/Qwen3.8-27B-UD-Q2_K_XL.gguf` (9.14 GiB).
- **Stack**: mainline `llama.cpp` `571d0d5`, CUDA, `--fit on --fit-target 128`.
- **Best synthetic bench (Ridge)**: `pp128=409`, `tg128=34.7 tok/s`.
- **Best synthetic bench (IQ3_XXS)**: `tg128=36.7 tok/s` @ 262k context.
- **Best synthetic bench (Q2_K_XL)**: `pp128=411`, `pp512=873`, `tg128=39.6 tok/s` @ 262k context.
- **Key note**: `--fit` + `llama-bench`, not `llama-cli`. This llama.cpp build's `llama-cli --fit` hangs after generation (spins holding VRAM) and can segfault at 131k+ context; `llama-bench` and `llama-server` are stable.
- **Head-to-head**: how this quant stacks against Qwen3.8-Flash-Next on the same box — throughput, intelligence index, and the chooser matrix — in [Qwen3.8-27B vs Qwen3.8-Flash-Next](/blog/qwen3-8-27b-vs-flash-next/).

## Why these three quants?

The Ridge file is the most faithful: it keeps the Gated-DeltaNet state path at Q8_0 and the mixers at Q4_K, leaving the native MTP draft head in place. It decodes at ~34.7 tok/s and fits fully in VRAM on the 4070 — but it's also the largest, so the KV cache (and thus the window you can hold) is the smallest of the three.

The UD-IQ3_XXS is the *long-context + quality* middle tier. At 10.17 GiB it's ~1.5 GiB smaller than Ridge and ~1 GiB bigger than Q2, and it still fits the **native 262k window** in VRAM. It decodes at ~36.7 tok/s — a small speed cost versus Q2 for noticeably better weight precision (3.06 vs 2.7 bpw).

The UD-Q2_K_XL is the *max context* play. At 9.14 GiB it frees ~2.5 GiB versus Ridge, and the fit solver spends that on a bigger KV cache. Because only 16 of 64 layers are attention, the KV cache stays small enough that the **native 262k window fits in VRAM** while decode holds ~39.6 tok/s. Same architecture, more context, and — surprisingly — *faster* decode than Ridge, because the smaller weights reduce memory traffic.

## Build

Standard CUDA build. Note `-DGGML_CUDA_FA_ALL_QUANTS=ON` — the KV quants we use (`q5_0`/`q4_1`) need CUDA FA coverage or they silently run slow on CPU.

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
mkdir build && cd build
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DGGML_CUDA=ON \
  -DLLAMA_CURL=ON \
  -DGGML_NATIVE=ON \
  -DGGML_CUDA_GRAPHS=ON \
  -DGGML_CUDA_F16=ON \
  -DGGML_CUDA_FA_ALL_QUANTS=ON \
  -DCMAKE_CUDA_ARCHITECTURES=89   # 86=RTX30, 75=RTX20, 61=GTX10
cmake --build . --config Release \
  --target llama-server llama-bench --parallel
```

> **Easier path**: [carteakey/l3ms](https://github.com/carteakey/l3ms) ships the bench scripts (`bench-models/bench-llama-qwen3-8-ridge-baseline.sh`, `...-q2-ctx.sh`) with these settings pre-set.

## Download

```bash
# Ridge (quality play)
huggingface-cli download empero-ai/Qwen3.8-27B-Ridge-GGUF \
  --include 'Qwen3.8-27B-Ridge-3.7bpw.gguf' \
  --local-dir ~/models/empero-ai/Qwen3.8-27B-Ridge-GGUF

# UD-IQ3_XXS (long-context + quality middle tier)
huggingface-cli download unsloth/Qwen3.8-27B-GGUF \
  --include 'Qwen3.8-27B-UD-IQ3_XXS.gguf' \
  --local-dir ~/models/unsloth/Qwen3.8-27B-GGUF

# UD-Q2_K_XL (max context play)
huggingface-cli download unsloth/Qwen3.8-27B-GGUF \
  --include 'Qwen3.8-27B-UD-Q2_K_XL.gguf' \
  --local-dir ~/models/unsloth/Qwen3.8-27B-GGUF
```

## Run

The single most important flag is `--fit on --fit-target 128`. `--fit` is a *solver*: it auto-places layers to meet a VRAM margin, and — crucially — **backs off whole layers (including their KV) as context grows**, so it never OOMs; it just degrades gracefully. A larger `--fit-target` (the 512 that ships in most configs) is too conservative here and pushes most of the 11.7 GiB Ridge file to CPU, tanking decode to ~3 t/s.

```bash
# Ridge, native 131k window
llama-server \
  -m ~/models/empero-ai/Qwen3.8-27B-Ridge-GGUF/Qwen3.8-27B-Ridge-3.7bpw.gguf \
  --host 0.0.0.0 --port 8001 \
  --ctx-size 131072 \
  --fit on --fit-target 128 --fit-ctx 131072 \
  --temp 1.0 --top-p 0.95 --top-k 20 \
  -ctk q5_0 -ctv q4_1 \
  --flash-attn on \
  --batch-size 512 --ubatch-size 512 \
  --threads 10 --threads-batch 12 \
  --no-mmap \
  --parallel 1 --no-warmup --jinja
```

For the IQ3_XXS and Q2_K_XL, swap the model and set `--ctx-size 262144` / `--fit-ctx 262144` for the native window.

## Bench

Use `llama-bench`, not `llama-cli`:

```bash
llama-bench \
  -m ~/models/unsloth/Qwen3.8-27B-GGUF/Qwen3.8-27B-UD-Q2_K_XL.gguf \
  -ngl 0 -p 128 -n 128 -r 1 \
  --fit-target 128 --fit-ctx 262144 \
  -ctk q5_0 -ctv q4_1 \
  -fa on
```

### Synthetic bench results (RTX 4070, 12 GB, `--fit-target 128`, KV `q5_0`/`q4_1`)

| Model | Size | pp128 (tok/s) | pp512 (tok/s) | tg128 (tok/s) |
| --- | ---: | ---: | ---: | ---: |
| Ridge-3.7bpw | 11.72 GiB | 409 | — | 34.7 |
| UD-IQ3_XXS | 10.17 GiB | — | — | 36.7 |
| UD-Q2_K_XL | 9.14 GiB | 411 | 873 | **39.6** |

### Context scaling (decode tg128)

| Context | IQ3_XXS | Q2_K_XL |
| ---: | ---: | ---: |
| 32k | 36.7 tok/s | 39.6 tok/s |
| 131k | 36.7 tok/s | 39.6 tok/s |
| 262k (native) | 36.7 tok/s | 39.6 tok/s |

Decode is VRAM-bandwidth-bound, not context-bound, so it holds flat until the KV cache finally crowds the weights off the card.

## What did NOT help (and why)

- **MTP draft speculation** — a wash at best, a *net loss* at large context. On a fully GPU-resident model (the norm at `fit-target 128`) MTP just adds a draft forward pass and its own KV. I measured it end-to-end via `llama-server` at 128k context and it **slowed both quants**: Q2_K_XL 13.6→8.4 tok/s, IQ3_XXS 10.0→7.1 tok/s. It only pays off when the main model is memory/CPU-bound with offload, which these configs avoid.
- **Manual `-ot` FFN-only offload** (the technique from a popular reddit guide for this exact model on 16 GB cards) — *worse* than `--fit` here. Offloading 12/16/24 FFN blocks gave 13.5/11.3/9.3 tok/s, and **OOM'd at 100k context** because it keeps each block's KV on GPU while only the stateless FFN GEMMs go to CPU. `--fit` sheds whole layers, freeing KV room that `-ot` can't.
- **Q3_K_M** — 14.6 GiB, *larger* than Ridge. It does not fit 12 GB and leaves even less room for a KV cache. The reddit guide recommending it was written for a 16 GB card.

## Notes

- **The 1M YaRN context** is *estimated* to fit by the solver but I did not verify it as a real KV allocation — `llama-bench --fit-ctx` is a planning hint, not a live buffer. Treat 262k as the verified ceiling.
- `llama-bench` reports the Ridge file's GGUF metadata as "IQ2_M - 2.7 bpw"; that's the file's own tag, not a description of what we ran.
- The `vendor/...` build dirs in my checkout get pruned by cleanup jobs, so the scripts point at a stable `~/runtime-builds/` copy.
- Stale `llama-cli --fit` processes hold VRAM forever; always kill them before the next run or everything OOMs with a confusing `cudaMalloc` failure.

## Changelog

| Date | Note |
| --- | --- |
| 2026-08-19 | Initial post — Ridge + Q2_K_XL setup, fit-target tuning, context scaling. |
| 2026-08-19 | Added UD-IQ3_XXS as the long-context + quality middle tier; verified all three at 262k native ctx; measured MTP as a net loss (via llama-server) at 128k ctx and left it off. |

## References

- [empero-ai/Qwen3.8-27B-Ridge-GGUF](https://huggingface.co/empero-ai/Qwen3.8-27B-Ridge-GGUF)
- [Qwen/Qwen3.8-27B (base)](https://huggingface.co/Qwen/Qwen3.8-27B)
- [unsloth/Qwen3.8-27B-GGUF](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF)
- [llama.cpp](https://github.com/ggml-org/llama.cpp)
- [l3ms - homelab LLM toolkit with scripts for this model](https://github.com/carteakey/l3ms)