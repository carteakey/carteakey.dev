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

This post covers my setup running Qwen3.6-35B-A3B MTP on a 12GB VRAM RTX 4070 using a PR fork of llama.cpp, with real-world throughput numbers.

## TL;DR

- **Model**: `unsloth/Qwen3.6-35B-A3B-MTP-GGUF` (`UD-Q4_K_XL`).
- **Stack**: PR#22673 `llama.cpp` (requires MTP draft support branch).
- **Best synthetic bench**: ~65-75 tok/s (MTP bench).
- **Server-realistic throughput**: ~67 tok/s @ 128k context (MTP accepted rate ~98%).
- **Key note**: You must use `--spec-type mtp --spec-draft-n-max 2` to leverage speculative decoding.

## End-to-end setup

### 1) Build mainline llama.cpp (with PR)

Since MTP support is currently in a pull request (PR #22673), you must build a custom branch.

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
git fetch origin pull/22673/head:pr-22673
git checkout pr-22673
mkdir build && cd build
cmake ..   -DCMAKE_BUILD_TYPE=Release   -DGGML_CUDA=ON   -DLLAMA_CURL=ON   -DGGML_NATIVE=ON   -DGGML_CUDA_GRAPHS=ON   -DGGML_CUDA_F16=ON   -DGGML_CUDA_FA_ALL_QUANTS=ON   -DCMAKE_CUDA_ARCHITECTURES=89
cmake --build . --config Release   --target llama-server llama-bench --parallel
```

### 2) Download model

```bash
huggingface-cli download unsloth/Qwen3.6-35B-A3B-MTP-GGUF   --include "*UD-Q4_K_XL*"   --local-dir ~/models/unsloth/Qwen3.6-35B-A3B-MTP-GGUF
```

### 3) Run text server

```bash
llama-server   -m ~/models/unsloth/Qwen3.6-35B-A3B-MTP-GGUF/Qwen3.6-35B-A3B-UD-Q4_K_XL.gguf   --alias "unsloth/Qwen3.6-35B-A3B MTP"   --host 0.0.0.0 --port 8001   --ctx-size 131072   --n-predict 32768   --fit on --fit-target 1536 --fit-ctx 131072   --temp 0.6 --top-p 0.95 --top-k 20   --presence-penalty 0.0 --repeat-penalty 1.0   -ctk q8_0 -ctv q8_0   --flash-attn on   --batch-size 1024 --ubatch-size 512   --threads 10 --threads-batch 12   --no-mmap --mlock   --parallel 1 --prio 2 --no-warmup   --spec-type mtp --spec-draft-n-max 2   --jinja   --chat-template-kwargs "{"preserve_thinking": true}"
```

> **Easier path**: [carteakey/l3ms](https://github.com/carteakey/l3ms) wraps all of the above as pre-configured shell scripts along with a build helper, a model downloader, and bench scripts. Everything is editable text, not a UI form.

## Benchmarks

MTP performance scales massively compared to non-MTP generation due to the built-in speculative draft models.

### Synthetic bench results (MTP Bench)

| Task | Accept Rate | Throughput (tok/s) |
| --- | ---: | ---: |
| Code (Python) | 97.4% | 66.4 |
| Code (C++) | 100.0% | 75.1 |
| Factual QA | 98.2% | 65.4 |
| Long Code Review | 98.2% | 62.3 |
| Stepwise Math | 99.2% | 67.5 |

*Tested on RTX 4070 12GB using the MTP Bench tool.*

## Notes

- **MTP Settings**: `spec-draft-n-max 2` provides an excellent balance between acceptance rate and speed.
- **Thinking Mode**: Retain thinking logic using `preserve_thinking: true` to enable long-term code continuity.
- **Context Length**: The Qwen 3.6 architecture handles contexts up to 262k; running 131k context locally uses ~1.5GB of VRAM headroom when combined with Q8_0 KV quantization and the `--fit` flag logic.
