---
title: "Gemma 4 26B QAT + MTP: 100 tok/s Local MoE on 12GB VRAM"
description: "Local benchmarks comparing Gemma 4 26B under standard, QAT, MTP, and combined QAT+MTP configurations on an RTX 4070."
date: 2026-06-12
authored_by: ai-assisted
draft: false
tags:
  - AI
  - Self-Host
  - Benchmarks
pinned: false
---

Google's release of the QAT (Quantization-Aware Training) variants of Gemma 4 has changed the game for local inference on consumer hardware. By combining **QAT** with **MTP (Multi-Token Prediction)**, we can now run the heavy Gemma 4 26B MoE model at over **100 tokens/second** on a single 12GB GPU.

![](/img/speed.gif)

Here is a performance breakdown comparing various configurations on a consumer RTX 4070 setup.

## Performance Table (Gemma 4 26B-A4B-it)

| Configuration | Quant / Precision | MTP Assistant | Throughput (tok/s) | Speedup vs Baseline |
| :--- | :---: | :---: | :---: | :---: |
| **Both Disabled (Baseline)** | UD-Q5_K_XL | None | **38.50** | 1.0x (Reference) |
| **MTP Only (QAT Disabled)** | UD-Q5_K_XL | Q8_0 MTP | **46.40** | 1.20x |
| **QAT Only (MTP Disabled)** | UD-Q4_K_XL (QAT) | None | **69.00** | 1.79x |
| **Both Enabled (QAT + MTP)** | UD-Q4_K_XL (QAT) | Q8_0 MTP | **100.60** | **2.61x** |

*Tested on CachyOS, RTX 4070 (iGPU as main display output for 100% free VRAM), Intel Core i5-12600K, 32GB DDR5-6000 RAM. Benchmarks run using llama.cpp mainline (with Gemma 4 MTP support).*

## Key Observations

1. **The VRAM Fitting Advantage (QAT Only)**:
   The standard `UD-Q5_K_XL` baseline model is ~18 GB, which exceeds the 12GB VRAM of the RTX 4070. By using the QAT `UD-Q4_K_XL` variant (~14.2 GB), far more layers are offloaded directly to the GPU using llama.cpp's `--fit on` mechanism. This optimization drives speed from **38.5 tok/s** up to **69.0 tok/s** without losing the training-aware accuracy of the quant.
2. **MTP Scaling (QAT + MTP)**:
   Combining the lighter QAT model with the MTP assistant draft model (`mtp-gemma-4-26B-A4B-it.gguf` ~460MB) allows the GPU to verify draft tokens in parallel. Because the draft model fits entirely in VRAM, the speed hits a blazing **100.6 tok/s**!
3. **Draft Settings**:
   For the MoE 26B variant, pushing `--spec-draft-n-max` beyond `2` introduces compute overhead that degrades throughput on 12GB cards. Sticking to `n-max 2` provides the optimal acceptance-rate-to-overhead ratio.

## End-to-End Setup in llama.cpp

Ensure you are using a mainline llama.cpp build with Gemma 4 MTP support. 

### Run QAT + MTP Command

```bash
llama-server \
  -m /mnt/lab/models/unsloth/gemma-4-26B-A4B-it-qat-GGUF/gemma-4-26B-A4B-it-qat-UD-Q4_K_XL.gguf \
  --spec-draft-model /mnt/lab/models/unsloth/gemma-4-26B-A4B-it-qat-GGUF/mtp-gemma-4-26B-A4B-it.gguf \
  --spec-type draft-mtp \
  --spec-draft-n-max 2 \
  --flash-attn on \
  --ctx-size 131072 \
  --fit on --fit-target 1536 \
  -ctk f16 -ctv f16 \
  -t 10 --threads-batch 12
```

*(Note: We use `-ctk f16 -ctv f16` because quantized KV cache like Q8_0 degrades the MTP acceptance rate to near zero on Gemma 4).*
