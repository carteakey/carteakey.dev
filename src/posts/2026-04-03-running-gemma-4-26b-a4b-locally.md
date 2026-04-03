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

Google DeepMind's Gemma 4 family is out—truly open with Apache 2 licenses, multimodal with support for text, image, and audio, and efficient enough to run on-device. The 26B-A4B variant is a mixture-of-experts model with only 4B parameters active per token, making it an ideal candidate for consumer hardware.

This post covers my setup running Gemma 4 26B-A4B on 12GB VRAM using mainline llama.cpp, with real-world throughput numbers for both text and vision workloads.

## TL;DR

- **Model**: `unsloth/gemma-4-26B-A4B-it-GGUF` (`UD-Q5_K_XL`) + `mmproj-BF16`.
- **Stack**: mainline `llama.cpp` (rebuilt from latest upstream) + scripts in [carteakey/l3ms](https://github.com/carteakey/l3ms).
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

### 1) Build or refresh mainline llama.cpp

```bash
cd ~/repos/l3ms
./maintenance/build-llama-cpp.sh
```

### 2) Download model + mmproj

```bash
./model_downloader/download_hf_model.py \
  --repo-id unsloth/gemma-4-26B-A4B-it-GGUF \
  --allow-patterns '*gemma-4-26B-A4B-it-UD-Q5_K_XL.gguf*' '*mmproj-BF16.gguf*' \
  --local-dir /home/kchauhan/models/unsloth/gemma-4-26B-A4B-it-GGUF \
  --max-workers 2
```

### 3) Run text and vision

Text server (128k default in script):

```bash
./run-models/run-llama-cpp-gemma-4-26b-a4b.sh
```

Vision server (stable profile for 12GB VRAM):

```bash
PORT=8001 \
FIT_TARGET=2048 \
CTX_SIZE=65536 \
FIT_CTX=65536 \
BATCH_SIZE=256 \
UBATCH_SIZE=512 \
./run-models/run-llama-cpp-gemma-4-26b-a4b-vision.sh
```

Both scripts keep Gemma-recommended sampling defaults:

- `temperature=1.0`
- `top_p=0.95`
- `top_k=64`

## Benchmarks and observed results

The model's pretty good. Gemma series of models (and even Gemini) have always been praised for their language capabilities; they're much more natural sounding - compared to something like Qwen3.5. Every model's geography of origin seems to influence its writing style (gemma/qwen/sarvam) - almost as if we're embedding the culture itself into the model weights. (more on that in another post)

In the traditional sense of [simonw's pelican test](https://simonwillison.net/2026/Apr/2/gemma-4/) (which it nailed!, maybe due to being in the training set now) - i like to test the models one-shotting capabilities on the bouncing ball prompts.

Here's it one-shotting the bouncing balls prompt (easy version).

{% image_cc "./src/static/img/bouncing-balls-gemma-html.gif", "Bouncing balls easy version", "", "Here's it one-shotting the bouncing balls prompt (easy version)." %}

With a minimal harness (pi) - it also does the [hard version](/prompts/bouncing-balls-spinning-heptagon/) pretty well

{% image "./src/static/img/bouncing-balls-gemma.gif", "Bouncing balls hard version" %}


### Synthetic bench (llama-bench style)

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

## References

- [Unsloth Gemma 4 26B-A4B GGUF](https://huggingface.co/unsloth/gemma-4-26B-A4B-it-GGUF)
- [llama.cpp](https://github.com/ggml-org/llama.cpp)
- [l3ms scripts used in this post](https://github.com/carteakey/l3ms)
