---
title: Running Qwen3.6-35B-A3B MTP locally on 12GB VRAM
description: End-to-end Qwen3.6-35B-A3B MTP setup on llama.cpp with throughput notes and MTP speculative decoding speedups.
date: 2026-05-12
updated: 2026-05-16
authored_by: ai-assisted
draft: true
tags:
  - AI
  - Self-Host
pinned: false
---

**Update (May 16, 2026)**: The MTP support PR has officially been merged into the `llama.cpp` mainline master branch! You no longer need to check out a custom PR branch, and the flag has been officially renamed to `--spec-type draft-mtp`.

Qwen 3.6 introduces Multi-Token Prediction (MTP) for speculative decoding natively integrated into the model, driving massive latency improvements in local setups.

This post covers my setup running Qwen3.6-35B-A3B MTP on a 12GB VRAM RTX 4070 using llama.cpp, with real-world throughput numbers compared to its non-MTP baseline.

## TL;DR

- **Model**: `unsloth/Qwen3.6-35B-A3B-MTP-GGUF` (`UD-Q4_K_XL`).
- **Stack**: Mainline `llama.cpp` (MTP is now officially merged!).
- **Best synthetic bench**: ~65-75 tok/s (MTP) vs ~51 tok/s (Baseline).
- **Server-realistic throughput**: ~67 tok/s @ 128k context (MTP accepted rate ~98%).
- **Key note**: You must use `--spec-type draft-mtp --spec-draft-n-max 2` to leverage speculative decoding optimally without tanking performance.

## What is Speculative Decoding and MTP?

Standard large language models generate text autoregressively, producing exactly one token at a time. The technical reality is that standard LLM inference is *memory-bandwidth bound*, creating a significant latency bottleneck. The processor spends the majority of its time moving billions of parameters from VRAM to the compute units just to generate a single token. This leads to under-utilized compute and high latency.

Speculative decoding circumvents this by decoupling generation from verification. It guesses the next several tokens rapidly, then uses the large, target model to verify all of those guesses in parallel. If the target model agrees with the draft, it accepts the entire sequence in a single forward pass, granting you multiple tokens for the computational price of one. 

There are several ways to generate these draft tokens:
- **N-gram**: Uses and matches strings already in the context. Extremely fast but only good for repetitive text like code.
- **Draft model**: Uses a tiny model (e.g. 0.8B) of the same family to quickly generate draft tokens for a larger model (e.g. 35B). Fairly easy to implement but acceptance rates vary wildly based on how well the models align.
- **Eagle3**: SOTA speculative decoding bolted onto an existing model, though it requires expensive training of a custom draft head.
- **DFlash**: Similar to Eagle3 but uses an experimental block diffusion model for prediction. 
- **MTP (Multi-Token Prediction)**: The holy grail. The full model itself is pre-trained with auxiliary heads specifically to output draft tokens alongside its actual prediction. 

## Current MTP Landscape

MTP is rapidly becoming table stakes for new local inference architectures. Here is a brief look at the current ecosystem of native MTP models:
- DeepSeekv3 OG
- DeepSeekv3.2/4
- Qwen3.5+
- GLM4.5+
- ~~MiniMax2.5+~~ (Reported to have it, but they clarified they do not)
- Step3.5Flash
- Mimo v2+
- Gemma 4 (Pending official un-censored weights from Google, but the community is extracting them!)

Until we get native MTP weights for all of these architectures, you may need to download HF weights and convert to GGUF manually. I think I am going to try either `qwen3.5-122b` or `gemma-4-31B` next!

## End-to-end setup

### 1) Build mainline llama.cpp

Since MTP support is now merged into `master`, you can just pull and build the standard repository.

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
  --spec-type draft-mtp --spec-draft-n-max 2 \
  --jinja \
  --chat-template-kwargs "{\"preserve_thinking\": true}"
```

> **Easier path**: [carteakey/l3ms](https://github.com/carteakey/l3ms) wraps all of the above as pre-configured shell scripts along with a build helper, a model downloader, and bench scripts. Everything is editable text, not a UI form.

## Benchmarks

MTP performance scales massively compared to non-MTP generation due to the built-in speculative draft models. Below is a comparison between standard generation and generation with `--spec-type draft-mtp --spec-draft-n-max 2`.

### Synthetic bench results (MTP Bench)

| Task | Baseline (tok/s) | MTP (n=2, tok/s) | Accept Rate (n=2) | MTP (n=3, tok/s) | Accept Rate (n=3) | MTP (n=5, tok/s) | Accept Rate (n=5) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Code (Python) | 51.3 | 66.4 | 97.4% | 69.1 | 95.3% | 59.8 | 89.1% |
| Code (C++) | 51.2 | 75.1 | 100.0% | 71.0 | 92.1% | 56.2 | 77.0% |
| Factual QA | 51.8 | 65.4 | 98.2% | 57.3 | 84.5% | 54.6 | 75.8% |
| Long Code Review | 51.0 | 62.3 | 98.2% | 55.5 | 81.3% | 49.5 | 72.3% |
| Stepwise Math | 51.1 | 67.5 | 99.2% | 66.3 | 92.1% | 65.5 | 82.7% |

*Tested on RTX 4070 12GB using the MTP Bench tool.*

## Notes & Tuning MTP Settings

- **Draft Sizes (`--spec-draft-n-max`)**: A draft max of `2` provides an excellent balance between acceptance rate and speed. In my testing, pushing draft sizes to `3` or `5` (even with `--spec-draft-p-min 0.0`) dropped the overall acceptance rate to ~75-88% and actually *decreased* throughput down to ~50-60 tok/s due to the computational overhead of predicting more garbage tokens.
- **Draft Confidence (`--spec-draft-p-min`)**: The MTP branch implements a hard upper limit but also an internal early-stop mechanism if the draft tokens are of low quality. Lowering this minimum threshold increases the draft count, but again, I've found a hard limit of `2` without messing with `p-min` is best on 12GB cards.
- **Thinking Mode**: Retain thinking logic using `preserve_thinking: true` to enable long-term code continuity in agentic environments.
- **Context Length**: The Qwen 3.6 architecture handles contexts up to 262k; running 131k context locally uses ~1.5GB of VRAM headroom when combined with Q8_0 KV quantization and the `--fit` flag logic.
- **Vision/Images**: Note that while multimodal inputs (images) were originally not supported on the experimental MTP draft branches, they *are* now fully supported with MTP enabled in the mainline release! You can simply combine the MTP draft configuration with the standard `--mmproj` flag. The draft models seamlessly utilize the target model's activations, making this a massive win for agentic vision workflows. Benchmarking the model with the `--mmproj` flag loaded confirms no speed regression on standard text generation (maintaining ~74 tok/s).

## Changelog

| Date | Note |
| --- | --- |
| 2026-05-16 | Verified and updated post to reflect that Vision (multimodal) inputs are supported with MTP! |
| 2026-05-16 | MTP PR merged into mainline. Updated flags to `--spec-type draft-mtp`. |
| 2026-05-12 | Initial post. |
