---
title: Running Qwen3.6-35B-A3B MTP locally on 12GB VRAM
description: End-to-end Qwen3.6-35B-A3B MTP setup on llama.cpp with throughput notes and MTP speculative decoding speedups.
date: 2026-05-12
updated: 2026-05-12
authored_by: ai-assisted
draft: true
tags:
  - AI
  - Self-Host
pinned: false
---

Qwen 3.6 introduces Multi-Token Prediction (MTP) for speculative decoding natively integrated into the model, driving massive latency improvements in local setups.

This post covers my setup running Qwen3.6-35B-A3B MTP on a 12GB VRAM RTX 4070 using a PR fork of llama.cpp, with real-world throughput numbers compared to its non-MTP baseline.

## TL;DR

- **Model**: `unsloth/Qwen3.6-35B-A3B-MTP-GGUF` (`UD-Q4_K_XL`).
- **Stack**: PR#22673 `llama.cpp` (requires MTP draft support branch).
- **Best synthetic bench**: ~65-75 tok/s (MTP) vs ~51 tok/s (Baseline).
- **Server-realistic throughput**: ~67 tok/s @ 128k context (MTP accepted rate ~98%).
- **Key note**: You must use `--spec-type mtp --spec-draft-n-max 2` to leverage speculative decoding.

## Current MTP Landscape

MTP is rapidly becoming table stakes for new local inference architectures. Here is a brief look at the current ecosystem:
- DeepSeekv3 OG
- DeepSeekv3.2/4
- Qwen3.5+
- GLM4.5+
- ~~MiniMax2.5+~~ (Reported to have it, but they clarified they do not)
- Step3.5Flash
- Mimo v2+

Until we get native MTP weights for all of these architectures, you may need to download HF weights and convert to GGUF manually. I think I am going to try either `qwen3.5-122b` or `glm4.5-air` next!

## End-to-end setup

### 1) Build mainline llama.cpp (with PR)

Since MTP support is currently in a pull request (PR #22673), you must build a custom branch.

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
git fetch origin pull/22673/head:pr-22673
git checkout pr-22673
mkdir build && cd build
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DGGML_CUDA=ON \
  -DLLAMA_CURL=ON \
  -DGGML_NATIVE=ON \
  -DGGML_CUDA_GRAPHS=ON \
  -DGGML_CUDA_F16=ON \
  -DGGML_CUDA_FA_ALL_QUANTS=ON \
  -DCMAKE_CUDA_ARCHITECTURES=89
cmake --build . --config Release \
  --target llama-server llama-bench --parallel
```

### 2) Download model

```bash
huggingface-cli download unsloth/Qwen3.6-35B-A3B-MTP-GGUF \
  --include "*UD-Q4_K_XL*" \
  --local-dir ~/models/unsloth/Qwen3.6-35B-A3B-MTP-GGUF
```

### 3) Run text server

```bash
llama-server \
  -m ~/models/unsloth/Qwen3.6-35B-A3B-MTP-GGUF/Qwen3.6-35B-A3B-UD-Q4_K_XL.gguf \
  --alias "unsloth/Qwen3.6-35B-A3B MTP" \
  --host 0.0.0.0 --port 8001 \
  --ctx-size 131072 \
  --n-predict 32768 \
  --fit on --fit-target 1536 --fit-ctx 131072 \
  --temp 0.6 --top-p 0.95 --top-k 20 \
  --presence-penalty 0.0 --repeat-penalty 1.0 \
  -ctk q8_0 -ctv q8_0 \
  --flash-attn on \
  --batch-size 1024 --ubatch-size 512 \
  --threads 10 --threads-batch 12 \
  --no-mmap --mlock \
  --parallel 1 --prio 2 --no-warmup \
  --spec-type mtp --spec-draft-n-max 2 \
  --jinja \
  --chat-template-kwargs "{\"preserve_thinking\": true}"
```

> **Easier path**: [carteakey/l3ms](https://github.com/carteakey/l3ms) wraps all of the above as pre-configured shell scripts along with a build helper, a model downloader, and bench scripts. Everything is editable text, not a UI form.

## Benchmarks

MTP performance scales massively compared to non-MTP generation due to the built-in speculative draft models. Below is a comparison between standard generation and generation with `--spec-type mtp --spec-draft-n-max 2`.

### Synthetic bench results (MTP Bench)

| Task | Baseline (tok/s) | MTP (tok/s) | Accept Rate | Speedup |
| --- | ---: | ---: | ---: | ---: |
| Code (Python) | 51.3 | 66.4 | 97.4% | **1.29x** |
| Code (C++) | 51.2 | 75.1 | 100.0% | **1.46x** |
| Factual QA | 51.8 | 65.4 | 98.2% | **1.26x** |
| Long Code Review | 51.0 | 62.3 | 98.2% | **1.22x** |
| Stepwise Math | 51.1 | 67.5 | 99.2% | **1.32x** |

*Tested on RTX 4070 12GB using the MTP Bench tool.*

## Notes & Tuning MTP Settings

- **Draft Sizes (`--spec-draft-n-max`)**: A draft max of `2` provides an excellent balance between acceptance rate and speed. Pushing draft sizes higher (e.g. `3` or `4`) can occasionally result in diminishing returns due to computation overhead. Note that the MTP branch implements a hard upper limit but also an internal early-stop mechanism if the draft tokens are of low quality.
- **Draft Confidence (`--spec-draft-p-min`)**: Since MTP stops early if draft tokens are poor, you can tune the `--spec-draft-p-min` flag. Lowering the minimum threshold may increase the draft count and total throughput, though potentially at the cost of a slightly lower overall acceptance rate.
- **Thinking Mode**: Retain thinking logic using `preserve_thinking: true` to enable long-term code continuity in agentic environments.
- **Context Length**: The Qwen 3.6 architecture handles contexts up to 262k; running 131k context locally uses ~1.5GB of VRAM headroom when combined with Q8_0 KV quantization and the `--fit` flag logic.
- **Vision/Images**: Note that currently, multimodal inputs (images) are not supported on MTP draft variants. You will need to fall back to the standard, non-MTP multimodal weights (with `--mmproj`) for image reasoning. A potential future workaround could involve setting `.n_max=0` automatically per-request when the prompt contains multimodal input.
