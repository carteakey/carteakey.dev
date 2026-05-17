---
title: Running Gemma 4 MTP locally on 12GB VRAM
description: End-to-end Gemma 4 setup with official MTP assistant drafter models on llama.cpp.
date: 2026-05-17
updated: 2026-05-17
authored_by: ai-assisted
draft: true
tags:
  - AI
  - Self-Host
pinned: false
---

Gemma 4 includes native Multi-Token Prediction (MTP) support, which significantly boosts inference speed when used with `llama.cpp` by predicting several tokens at once.

This post covers the setup for Gemma 4 26B-A4B (MoE) using the official assistant drafter models on a 12GB VRAM RTX 4070.

## TL;DR

- **Model**: `google/gemma-4-26B-A4B-it` (Main) + `google/gemma-4-26B-A4B-it-assistant` (Drafter).
- **Stack**: `llama.cpp` PR#23211 (adds `gemma4_assistant` architecture).
- **Throughput**: ~45-49 tok/s (MTP) vs ~44 tok/s (Baseline).
- **Key note**: Use `--spec-draft-model <assistant_gguf> --spec-type draft-mtp`.

## The Gemma 4 MTP Advantage

Google recently released dedicated small assistant models specifically trained on Gemma 4's distribution to act as high-accuracy drafters. Unlike Qwen 3.6 which integrates MTP heads into the main weight file, Gemma 4 uses a separate, lightweight drafter model that shares activations with the target model.

### How it works

Standard inference is memory-bandwidth bound. MTP decouples token generation from verification. By pairing a heavy target model (e.g., 26B MoE) with a lightweight drafter (~0.4B), we utilize idle compute to “predict” several future tokens at once. If the target model agrees with the draft, it accepts the entire sequence in a single forward pass.

## End-to-end setup

### 1) Build llama.cpp with PR #23211

As of May 17, 2026, the specific `gemma4_assistant` architecture support is in PR #23211.

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
git fetch origin pull/23211/head:pr-23211
git checkout pr-23211
# Resolve any conflicts with mainline master if needed
mkdir build && cd build
cmake .. -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=89
cmake --build . --target llama-server --parallel
```

### 2) Download models

You need both the base model and the assistant model in GGUF format.

```bash
huggingface-cli download AtomicChat/gemma-4-26B-A4B-it-assistant-GGUF \
  --include "*Q4_K_M.gguf*" \
  --local-dir ~/models/gemma-4-assistant
```

### 3) Run server

```bash
llama-server \
  -m ~/models/unsloth/gemma-4-26B-A4B-it-GGUF/gemma-4-26B-A4B-it-UD-Q5_K_XL.gguf \
  --spec-draft-model ~/models/AtomicChat/gemma-4-26B-A4B-it-assistant-GGUF/gemma-4-26B-A4B-it-assistant.Q4_K_M.gguf \
  --spec-type draft-mtp --spec-draft-n-max 3 \
  --flash-attn on --ctx-size 131072 \
  --fit on --fit-target 1536
```

## Benchmarks (RTX 4070 12GB)

While early results show promising gains, the overhead of the separate assistant model is more noticeable on lower-VRAM cards compared to integrated MTP heads. 

Interestingly, these gains are currently much more modest than what we observed with [Qwen 3.6 MTP](/posts/running-qwen3-6-mtp-locally), where we saw massive 1.5x+ speedups. This is likely due to the "beta" nature of the current Gemma 4 implementation and the overhead of managing a separate drafter model versus Qwen's native auxiliary heads. As the `llama.cpp` implementation matures, we expect these numbers to climb.

| Task | Baseline (tok/s) | MTP (n=4, tok/s) | Accept Rate |
| --- | ---: | ---: | ---: |
| Factual QA | 44.7 | 46.0 | 77.8% |
| Summarize | 44.9 | 49.2 | 72.8% |
| Stepwise Math | 44.4 | 32.1 | 40.1% |

*Note: Pushing `n-max` higher can currently lead to instability or speed regressions on some hardware due to compute overhead.*

## Vision Support

Note that while vision (multimodal) inputs were originally not supported on the initial MTP draft implementations, they **are** now fully supported in the mainline `llama.cpp` release! You can simply combine the MTP draft configuration with the standard `--mmproj` flag.

### Vision Benchmarks (RTX 4070 12GB)

Interestingly, on 12GB hardware, the overhead of the separate assistant model negates the speedup for vision tasks.

| Model | Mode | Throughput (tok/s) |
| --- | --- | ---: |
| Gemma 4 26B | Baseline Vision | **6.23** |
| Gemma 4 26B | MTP Vision | **6.03** |

While MTP doesn't drive a vision speedup here, it remains fully functional and maintains standard text generation speeds (~45+ tok/s) while the vision weights are resident.

---

## Changelog

| Date | Note |
| --- | --- |
| 2026-05-17 | Verified Vision support and added benchmark results. |
| 2026-05-17 | Initial post for Gemma 4 MTP setup. |
