---
title: Running Qwen3.6-35B-A3B locally with text + vision
description: Practical Qwen3.6 setup on 12 GB VRAM using llama.cpp.
image: /img/blog-sketches/unique/qwen-3.6-stamp-trim.png
imageAlt: Transparent monochrome sketch of a workstation with a GPU tower
date: 2026-04-17
updated: 2026-04-17
giscusTerm: "/blog/running-qwen3-6-35b-a3b-locally/"
authored_by: ai-assisted
draft: true
tags:
  - AI
  - Self-Host
pinned: false
---

Qwen3.6 continues the strong trend of highly capable open models, and the 35B-A3B MoE variant hits a sweet spot for consumer hardware. With a low active parameter count per token, it runs fast while still retaining the "smart" feel of larger reasoning models, and includes multimodal capabilities out of the box.

This post covers my setup running Qwen3.6-35B-A3B on 12GB VRAM using mainline llama.cpp, with real-world throughput numbers for text and vision.

## TL;DR

- **Model**: `unsloth/Qwen3.6-35B-A3B-GGUF` (`UD-Q5_K_XL`) + `mmproj-F16.gguf`.
- **Stack**: mainline `llama.cpp` (rebuilt from upstream).
- **Best synthetic bench (fit)**: `pp512=970.77`, `tg128=52.33` (fit winner).
- **Vision-safe defaults (12 GB class GPUs)**: `FIT_TARGET=2048`, `BATCH_SIZE=256`, `GGML_CUDA_GRAPH_OPT=0`.

## End-to-end setup

### 1) Build mainline llama.cpp

Clone and build from upstream. You need the CUDA toolkit installed.

```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
mkdir build && cd build
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DGGML_CUDA=ON \
  -DLLAMA_CURL=ON \
  -DGGML_NATIVE=ON \
  -DGGML_LTO=ON \
  -DGGML_CUDA_GRAPHS=ON \
  -DGGML_CUDA_F16=ON \
  -DGGML_CUDA_FA_ALL_QUANTS=ON \
  -DCMAKE_CUDA_ARCHITECTURES=89   # change to match your GPU
cmake --build . --config Release \
  --target llama-server llama-bench --parallel
```

### 2) Download model + mmproj

Use `huggingface-cli` (from `pip install huggingface_hub`):

```bash
huggingface-cli download unsloth/Qwen3.6-35B-A3B-GGUF \
  --include '*UD-Q5_K_XL*' '*mmproj-F16*' \
  --local-dir ~/models/unsloth/Qwen3.6-35B-A3B-GGUF
```

### 3) Run text server

```bash
llama-server \
  -m ~/models/unsloth/Qwen3.6-35B-A3B-GGUF/Qwen3.6-35B-A3B-UD-Q5_K_XL.gguf \
  --alias "unsloth/Qwen3.6-35B-A3B" \
  --host 0.0.0.0 --port 8001 \
  --ctx-size 65536 \
  --fit on --fit-ctx 65536 --fit-target 512 \
  --temp 0.6 --top-p 0.95 --top-k 20 --min-p 0.0 \
  --repeat-penalty 1.0 \
  -ctk q8_0 -ctv q8_0 \
  --flash-attn on \
  --batch-size 1024 --ubatch-size 512 \
  --threads 10 --threads-batch 12 \
  --no-mmap --mlock \
  --parallel 1 --prio 2 --no-warmup --jinja
```

### 4) Run vision server

```bash
llama-server \
  -m ~/models/unsloth/Qwen3.6-35B-A3B-GGUF/Qwen3.6-35B-A3B-UD-Q5_K_XL.gguf \
  --mmproj ~/models/unsloth/Qwen3.6-35B-A3B-GGUF/mmproj-F16.gguf \
  --alias "unsloth/Qwen3.6-35B-A3B-vision" \
  --host 0.0.0.0 --port 8001 \
  --ctx-size 65536 \
  --fit on --fit-ctx 65536 --fit-target 2048 \
  --temp 0.6 --top-p 0.95 --top-k 20 --min-p 0.0 \
  --repeat-penalty 1.0 \
  -ctk q8_0 -ctv q8_0 \
  --flash-attn on \
  --batch-size 256 --ubatch-size 512 \
  --threads 10 --threads-batch 12 \
  --no-mmap --mlock \
  --parallel 1 --prio 2 --no-warmup --jinja
```

Key differences for vision: the mmproj is included, `FIT_TARGET=2048` leaves more VRAM headroom, and batch size is reduced to 256 to avoid assertion errors when processing large images.

{% callout "example", "Easier path" %}
[carteakey/l3ms](https://github.com/carteakey/l3ms) wraps all of the above as pre-configured shell scripts (`bench-models/run-llama-cpp-qwen3-6-35b-a3b.sh`, `bench-models/run-llama-cpp-qwen3-6-35b-a3b-vision.sh`) along with a build helper, a model downloader, and bench scripts. Everything is editable text, not a UI form.
{% endcallout %}

## Text benchmark outcomes

Hardware profile used for these runs: RTX 4070 12 GB + 64 GB DDR5 host RAM.

| Strategy | pp512 (tok/s) | tg128 (tok/s) |
| --- | ---: | ---: |
| baseline / all-cpu experts | 654.16 | 41.10 |
| partial-cpu | 746.36 | 44.35 |
| up-down-cpu | 865.26 | 48.95 |
| fit (winner) | **970.77** | **52.33** |
| up-cpu | OOM | OOM |

The fit-derived split was the clear winner and provides a very fluid token generation rate while maximizing GPU offload.

## Vision notes that matter

Qwen3.6 vision is stable on 12 GB VRAM with conservative headroom:

- `FIT_TARGET=2048`
- `BATCH_SIZE=256`
- `UBATCH_SIZE=512`
- `GGML_CUDA_GRAPH_OPT=0`

Trying to push `FIT_TARGET` too low while keeping high context can trigger OOM during longer sessions or when attaching larger images.

## References

- [Qwen3.6-35B-A3B GGUF (unsloth)](https://huggingface.co/unsloth/Qwen3.6-35B-A3B-GGUF)
- [llama.cpp](https://github.com/ggml-org/llama.cpp)
- [l3ms - homelab LLM toolkit with scripts for this model](https://github.com/carteakey/l3ms)
