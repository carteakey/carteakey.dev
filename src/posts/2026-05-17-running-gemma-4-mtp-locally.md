---
title: Running Gemma 4 MTP locally on 12GB VRAM
description: End-to-end Gemma 4 setup with official MTP assistant drafter models on llama.cpp.
image: /img/blog-sketches/unique/running-gemma-4-mtp-locally-stamp-trim.png
imageAlt: Transparent monochrome sketch of two network node icons connected by arrows, representing Multi-Token Prediction (MTP) speculative decoding
date: 2026-05-17
updated: 2026-05-20
authored_by: ai-assisted
draft: true
tags:
  - AI
  - Self-Host
pinned: false
---

**Update (May 20, 2026)**: Gemma 4 MTP support has arrived in mainline `llama.cpp` via [PR #23398](https://github.com/ggml-org/llama.cpp/pull/23398)! We are no longer dependent on the `atomic-llama-cpp-turboquant` fork.


**Update (May 21, 2026)**: Successfully benchmarked Gemma 4 26B-A4B MTP on mainline `llama.cpp` using [PR #23398](https://github.com/ggml-org/llama.cpp/pull/23398). On a 12GB RTX 4070, the mainline PR achieves **~52.4 tok/s** (with f16 KV cache), which is a **~17% speedup** over the non-MTP baseline (~44.6 tok/s) and significantly outperforms the Atomic fork (~40.8 tok/s) on this hardware. Note that Q8 KV cache currently drops acceptance rate to near zero; stick to f16 for now.

Gemma 4 includes native Multi-Token Prediction (MTP) support, which significantly boosts inference speed when used with `llama.cpp` by predicting several tokens at once.

This post covers the setup for Gemma 4 using the official assistant drafter models on consumer hardware. Note that the **dense models (e.g. 31B)** see >2x speedups with this PR, while the **MoE models (e.g. 26B-A4B)** currently show negligible speedups natively in mainline.

## TL;DR

- **Model**: `google/gemma-4-31B-it` or `google/gemma-4-26B-A4B-it` (Main) + their respective `assistant` models.
- **Stack**: Mainline `llama.cpp` (via PR #23398).
- **Throughput**: ~94 tok/s (MTP) vs ~34 tok/s (Baseline) for the 31B model on dual high-end GPUs.
- **Key note**: Use `--spec-type draft-mtp --spec-draft-n-max 4`.
- **Known bugs**: Quantized KV cache (like Q8_0) currently breaks acceptance rates (drops to 0%). Keep KV cache as f16 for now. Multi-GPU users must specify `--device-draft` (e.g. `--device-draft CUDA1`).

## The Gemma 4 MTP Advantage

Google recently released dedicated small assistant models specifically trained on Gemma 4's distribution to act as high-accuracy drafters. Unlike Qwen 3.6 which integrates MTP heads into the main weight file, Gemma 4 uses a separate, lightweight drafter model that shares activations with the target model.

### How it works

Standard inference is memory-bandwidth bound. MTP decouples token generation from verification. By pairing a heavy target model (e.g., 31B Dense) with a lightweight drafter (~0.4B), we utilize idle compute to “predict” several future tokens at once. If the target model agrees with the draft, it accepts the entire sequence in a single forward pass.

## End-to-end setup

### 1) Build mainline llama.cpp with the PR

Instead of relying on the TurboQuant fork, you can build the active pull request directly:

```bash
git clone https://github.com/ggml-org/llama.cpp.git
cd llama.cpp
gh pr checkout 23398
mkdir build && cd build
cmake .. -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=89
cmake --build . --target llama-server --parallel
```

### 2) Download models

You need both the base model and the assistant model in GGUF format.

```bash
# Example for the 31B model
huggingface-cli download am17an/Gemma4-31B-it-GGUF \
  --include "*Q8_0.gguf*" \
  --local-dir ~/models/gemma-4-31b

huggingface-cli download am17an/Gemma4-31B-it-GGUF \
  --include "mtp-gemma-4-31B-it.gguf" \
  --local-dir ~/models/gemma-4-31b
```

### 3) Run server

```bash
llama-server \
  -m ~/models/gemma-4-31b/Gemma4-31B-Q8_0.gguf \
  --spec-draft-model ~/models/gemma-4-31b/mtp-gemma-4-31B-it.gguf \
  --spec-type draft-mtp --spec-draft-n-max 4 \
  --flash-attn on --ctx-size 16384 \
  --fit on --fit-target 1536
```

*(Note: If you have multiple GPUs, add `--device-draft CUDA1` to place the drafter on the second GPU.)*

## Benchmarks

The speedup heavily depends on whether you run a Dense or MoE variant. The PR author and community testers note that the dense models (like the 31B) see **over a 2x speedup**, while the MoE (26B-A4B) currently sees minimal gains natively without additional kv-cache optimizations.

**Community Results (31B Dense model, RTX 5090 + 4090):**
- **No MTP:** 33.9 tok/s
- **MTP Enabled (n-max 4):** 94.7 tok/s (Accept rate ~60%)

**Community Results (31B Dense model, 2x RTX 3090):**
- **No MTP:** 35.72 tok/s
- **MTP Enabled:** 62.34 tok/s (+74.5% speedup, Accept rate ~44%)

*Note: Pushing `n-max` higher can currently lead to instability or speed regressions on some hardware due to compute overhead.*

## Vision Support

Note that while vision (multimodal) inputs were originally not supported on the initial MTP draft implementations, they **are** now fully supported in the mainline `llama.cpp` release! You can simply combine the MTP draft configuration with the standard `--mmproj` flag.

### Vision Benchmarks (RTX 4070 12GB)

Interestingly, on 12GB hardware, the overhead of the separate assistant model negates the speedup for vision tasks with the 26B-A4B MoE model.

| Model | Mode | Throughput (tok/s) |
| --- | --- | ---: |
| Gemma 4 26B-A4B | Baseline Vision | **6.23** |
| Gemma 4 26B-A4B | MTP Vision | **6.03** |

While MTP doesn't drive a vision speedup here, it remains fully functional. Note that on current builds, loading vision weights (`--mmproj`) causes the server to safely skip MTP drafting for all prompts (including text-only) to avoid potential tensor crashes. For the full speedup on text tasks, you should use the dedicated text-only MTP profile.

---

## Changelog

| Date | Note |
| --- | --- |
| 2026-05-21 | Verified PR #23398 speedups: 52.4 tok/s (Mainline) vs 40.8 tok/s (Fork) on 12GB VRAM. |
| 2026-05-20 | Updated instructions to use PR #23398 instead of the TurboQuant fork. Added community benchmark metrics demonstrating >2x speedup for Dense models. |
| 2026-05-17 | Noted that vision weights currently disable MTP drafting for stability. |
| 2026-05-17 | Promoted `gemma-4-26b-mtp-vision` to the default model for the L3MS stack. |
| 2026-05-17 | Switched to `atomic-llama-cpp-turboquant` fork for better MTP support and enabled TurboQuant KV-cache. |
| 2026-05-17 | Verified Vision support and added benchmark results. |
| 2026-05-17 | Initial post for Gemma 4 MTP setup. |