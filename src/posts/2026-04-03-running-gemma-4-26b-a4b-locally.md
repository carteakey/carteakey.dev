---
title: Running Gemma 4 26B-A4B locally on 12GB VRAM
description: End-to-end Gemma 4 setup on mainline llama.cpp with text and vision throughput notes.
date: 2026-04-03
updated: 2026-04-03
authored_by: ai-assisted
draft: true
tags:
  - AI
  - Self-Host
pinned: false
---

Google DeepMind's Gemma 4 family is out-truly open with Apache 2 licenses, multimodal with support for text, image, and audio, and efficient enough to run on-device. The 26B-A4B variant is a mixture-of-experts model with only 4B parameters active per token, making it an ideal candidate for consumer hardware.

This post covers my setup running Gemma 4 26B-A4B on 12GB VRAM using mainline llama.cpp, with real-world throughput numbers for both text and vision workloads.

## TL;DR

- **Model**: `unsloth/gemma-4-26B-A4B-it-GGUF` (`UD-Q5_K_XL`) + `mmproj-BF16`.
- **Stack**: mainline `llama.cpp` (rebuilt from upstream) + run scripts from [carteakey/l3ms](https://github.com/carteakey/l3ms).
- **Best synthetic bench (fit)**: `pp512=1466.82`, `tg128=47.94`, `pp512+tg128=207.08`.
- **Server-realistic throughput**:
  - **Text @ 128k context**: `~44.20 tok/s`
  - **Vision @ 64k context**: `~42.09 tok/s`
- **Most important stability note**: vision can OOM with aggressive fit headroom (`FIT_TARGET=512`) on a 12GB card. A safer vision profile was `FIT_TARGET=2048`, `BATCH_SIZE=256`, `UBATCH_SIZE=512`.

If you want one local model that stays strong across coding + long context + multimodal use, this variant is an excellent default.

## Why Gemma 4 26B-A4B?

Gemma 4 has stronger variants (31B), but 26B-A4B is a practical speed/quality point for consumer GPUs because only a subset of parameters is active per token.

On my 12GB VRAM setup, it delivered:

1. Fast enough generation for daily interactive use.
2. Viable 128k text serving with fit-based placement.
3. Working vision inference with the mmproj adapter under stable memory settings.

## End-to-end setup

### 1) Build mainline llama.cpp

Clone and build from upstream. You need CUDA toolkit installed (see [CUDA installation guide](https://developer.nvidia.com/cuda-downloads)).

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
  -DCMAKE_CUDA_ARCHITECTURES=89   # change to match your GPU: 86=RTX30, 75=RTX20, 61=GTX10
cmake --build . --config Release \
  --target llama-server llama-bench --parallel
```

### 2) Download model + mmproj

Use `huggingface-cli` (from `pip install huggingface_hub`):

```bash
huggingface-cli download unsloth/gemma-4-26B-A4B-it-GGUF \
  --include '*gemma-4-26B-A4B-it-UD-Q5_K_XL.gguf*' '*mmproj-BF16.gguf*' \
  --local-dir ~/models/unsloth/gemma-4-26B-A4B-it-GGUF
```

### 3) Run text server (128k context)

```bash
llama-server \
  -m ~/models/unsloth/gemma-4-26B-A4B-it-GGUF/gemma-4-26B-A4B-it-UD-Q5_K_XL.gguf \
  --alias "unsloth/gemma-4-26B-A4B-it (UD-Q5_K_XL)" \
  --host 0.0.0.0 --port 8001 \
  --ctx-size 131072 \
  --fit on --fit-ctx 131072 --fit-target 512 \
  --temp 1.0 --top-p 0.95 --top-k 64 \
  --repeat-penalty 1.0 \
  -ctk q8_0 -ctv q8_0 \
  --flash-attn on \
  --batch-size 1024 --ubatch-size 512 \
  --threads 10 --threads-batch 12 \
  --no-mmap --mlock \
  --parallel 1 --prio 2 --no-warmup --jinja
```

### 4) Run vision server (stable profile for 12GB VRAM)

```bash
llama-server \
  -m ~/models/unsloth/gemma-4-26B-A4B-it-GGUF/gemma-4-26B-A4B-it-UD-Q5_K_XL.gguf \
  --mmproj ~/models/unsloth/gemma-4-26B-A4B-it-GGUF/mmproj-BF16.gguf \
  --alias "unsloth/gemma-4-26B-A4B-it (UD-Q5_K_XL)" \
  --host 0.0.0.0 --port 8001 \
  --ctx-size 65536 \
  --fit on --fit-ctx 65536 --fit-target 2048 \
  --temp 1.0 --top-p 0.95 --top-k 64 \
  --repeat-penalty 1.0 \
  -ctk q8_0 -ctv q8_0 \
  --flash-attn on \
  --batch-size 256 --ubatch-size 512 \
  --threads 10 --threads-batch 12 \
  --no-mmap --mlock \
  --parallel 1 --prio 2 --no-warmup --jinja
```

Key differences from the text profile: mmproj enabled, 64k context, `FIT_TARGET=2048` for safe headroom, smaller batch sizes to avoid assertion errors when processing image tokens.

Both profiles keep Gemma-recommended sampling defaults:

- `temperature=1.0`
- `top_p=0.95`
- `top_k=64`

> **Easier path**: [carteakey/l3ms](https://github.com/carteakey/l3ms) wraps all of the above as pre-configured shell scripts (`run-models/run-llama-cpp-gemma-4-26b-a4b.sh`, `run-models/run-llama-cpp-gemma-4-26b-a4b-vision.sh`) along with a build helper, a model downloader, and bench scripts. Everything is editable text, not a UI form.

## Benchmarks and observed results

The model's pretty good. Gemma series of models (and even Gemini) have always been praised for their language capabilities; they're much more natural sounding compared to something like Qwen3.5. Every model's geography of origin seems to influence its writing style (gemma/qwen/sarvam) -- almost as if we're embedding the culture itself into the model weights. (more on that in another post)

In the traditional sense of [simonw's pelican test](https://simonwillison.net/2026/Apr/2/gemma-4/) (which it nailed!, maybe due to being in the training set now) -- I like to test the models on one-shotting the bouncing ball prompts.

Here's it one-shotting the bouncing balls prompt (easy version).

{% image_cc "./src/static/img/bouncing-balls-gemma-html.gif", "Bouncing balls easy version", "", "Here's it one-shotting the bouncing balls prompt (easy version)." %}

With a minimal harness (pi) - it also does the [hard version](/prompts/bouncing-balls-spinning-heptagon/) pretty well

{% image "./src/static/img/bouncing-balls-gemma.gif", "Bouncing balls hard version" %}


### Synthetic bench (llama-bench)

```bash
llama-bench \
  -m ~/models/unsloth/gemma-4-26B-A4B-it-GGUF/gemma-4-26B-A4B-it-UD-Q5_K_XL.gguf \
  -p 512 -n 128 \
  --flash-attn 1 --no-mmap \
  -ctk q8_0 -ctv q8_0 \
  --batch-size 1024 --ubatch-size 512 \
  --threads 10
```

| Config | pp512 (tok/s) | tg128 (tok/s) | pp512+tg128 (tok/s) |
| --- | ---: | ---: | ---: |
| Fit bench (best) | **1466.82** | **47.94** | **207.08** |
| Strategy: all-ffn-cpu | 809.82 | 25.38 | - |

The fit-based setup was the clear winner for this model on this hardware.

### Server-realistic numbers

| Mode | Context | Throughput |
| --- | ---: | ---: |
| Text | 128k | **~44.20 tok/s** |
| Vision | 64k | **~42.09 tok/s** |

These are from actual server runs (not just synthetic bench), so they are closer to real usage expectations.

## Vision memory notes (important)

Two failure modes showed up quickly while tuning:

1. **OOM during mmproj allocation** when fit headroom was too aggressive (`FIT_TARGET=512` in my tests).
2. **Batch assertion** when image token batch exceeded `n_ubatch`.

What stayed stable on a 12GB card:

- `FIT_TARGET=3072`
- `CTX_SIZE=65536`
- `BATCH_SIZE=256`
- `UBATCH_SIZE=512`

If you want higher vision throughput, reduce context before reducing fit margin.

## Practical default profile

For daily usage on this class of hardware:

- **Text default**: 128k context, fit-based placement.
- **Vision default**: 64k context with conservative fit margin and smaller batch.
- **One server at a time** if you are VRAM-constrained.

This keeps Gemma 4 26B-A4B responsive without constant OOM babysitting.

## Changelog

| Date | Note |
| --- | --- |
| 2026-04-03 | Initial post - text + vision setup, bench numbers, memory notes. |

## References

- [Unsloth Gemma 4 26B-A4B GGUF](https://huggingface.co/unsloth/gemma-4-26B-A4B-it-GGUF)
- [llama.cpp](https://github.com/ggml-org/llama.cpp)
- [l3ms - homelab LLM toolkit with scripts for this model](https://github.com/carteakey/l3ms)
