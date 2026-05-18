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
- **Stack**: `atomic-llama-cpp-turboquant` fork (supports `gemma4_assistant` + TurboQuant KV optimizations).
- **Throughput**: ~50-58 tok/s (MTP + TurboQuant) vs ~44 tok/s (Baseline).
- **Key note**: Use `--mtp-head <assistant_gguf> --spec-type mtp --draft-block-size 3 --draft-max 8`.
- **Default Stack**: This optimized setup is now the default model for my L3MS stack.

## The Gemma 4 MTP Advantage

Google recently released dedicated small assistant models specifically trained on Gemma 4's distribution to act as high-accuracy drafters. Unlike Qwen 3.6 which integrates MTP heads into the main weight file, Gemma 4 uses a separate, lightweight drafter model that shares activations with the target model.

### How it works

Standard inference is memory-bandwidth bound. MTP decouples token generation from verification. By pairing a heavy target model (e.g., 26B MoE) with a lightweight drafter (~0.4B), we utilize idle compute to “predict” several future tokens at once. If the target model agrees with the draft, it accepts the entire sequence in a single forward pass.

Additionally, using a specialized fork like **atomic-llama-cpp-turboquant** enables TurboQuant KV-cache optimizations. This allows us to use `turbo3` or `turbo4` cache types, significantly reducing memory pressure and improving throughput on consumer-grade hardware.

## End-to-end setup

### 1) Build atomic-llama-cpp-turboquant

For full Gemma 4 MTP support and TurboQuant optimizations, use the specialized AtomicBot fork.

```bash
git clone https://github.com/AtomicBot-ai/atomic-llama-cpp-turboquant
cd atomic-llama-cpp-turboquant
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

Due to the significant speedup and reliable vision support on the RTX 4070, **`gemma-4-26b-mtp-vision`** has been promoted to the default production model for the L3MS stack, preloading on startup for near-instant latency.

| Task | Baseline (tok/s) | MTP + TurboQuant (tok/s) | Accept Rate |
| --- | ---: | ---: | ---: |
| Factual QA | 44.7 | 44.3 | 78.4% |
| Summarize | 44.9 | 46.5 | 72.4% |
| Stepwise Math | 44.4 | 57.8 | 81.6% |
| Translation | 44.6 | 50.1 | 92.5% |

*Note: Pushing `n-max` higher can currently lead to instability or speed regressions on some hardware due to compute overhead.*

## Vision Support

Note that while vision (multimodal) inputs were originally not supported on the initial MTP draft implementations, they **are** now fully supported in the mainline `llama.cpp` release! You can simply combine the MTP draft configuration with the standard `--mmproj` flag.

### Vision Benchmarks (RTX 4070 12GB)

Interestingly, on 12GB hardware, the overhead of the separate assistant model negates the speedup for vision tasks.

| Model | Mode | Throughput (tok/s) |
| --- | --- | ---: |
| Gemma 4 26B | Baseline Vision | **6.23** |
| Gemma 4 26B | MTP Vision | **6.03** |

While MTP doesn't drive a vision speedup here, it remains fully functional. Note that on current builds, loading vision weights (`--mmproj`) causes the server to safely skip MTP drafting for all prompts (including text-only) to avoid potential tensor crashes. For the full 1.3x speedup on text tasks, you should use the dedicated text-only MTP profile.

---

## Changelog

| Date | Note |
| --- | --- |
| 2026-05-17 | Noted that vision weights currently disable MTP drafting for stability. |
| 2026-05-17 | Promoted `gemma-4-26b-mtp-vision` to the default model for the L3MS stack. |
| 2026-05-17 | Switched to `atomic-llama-cpp-turboquant` fork for better MTP support and enabled TurboQuant KV-cache. |
| 2026-05-17 | Verified Vision support and added benchmark results. |
| 2026-05-17 | Initial post for Gemma 4 MTP setup. |
