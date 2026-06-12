---
title: "Ultrafast Gemma 4 12B QAT + MTP: 120 tok/s Local Inference"
description: "Setup and benchmark results running Gemma 4 12B QAT with Multi-Token Prediction on a single RTX 4070 GPU."
date: 2026-06-12
authored_by: ai-generated
draft: false
tags:
  - AI
  - Self-Host
  - Benchmarks
pinned: false
---

Google recently released the QAT (Quantization-Aware Training) variant of their Gemma 4 models, including the 12B parameter model. Because it is highly compact, it fits entirely within the VRAM of a standard 12GB GPU. 

By pairing Unsloth's QAT quantized model with a converted Q8_0 assistant/draft model and running mainline llama.cpp with native Gemma 4 MTP support, we can achieve an incredible **120.8 tokens/second** locally!

![](/img/speed.gif)

## System Specifications

- **OS**: CachyOS
- **GPU**: NVIDIA GeForce RTX 4070 Super 12GB (display driven by iGPU, leaving 100% VRAM free for inference)
- **CPU**: Intel Core i5-12600K
- **RAM**: 32GB DDR5-6000

## Performance Comparison (Gemma 4 12B-it)

### Without MTP (Baseline)

A standard prompt completion on the Q4_K_XL quant without Multi-Token Prediction yields a consistent **~60 tok/s**:

```
 code_python        pred= 192 draft=   0 acc=   0 rate=n/a tok/s=59.9
 code_cpp           pred= 192 draft=   0 acc=   0 rate=n/a tok/s=60.0
 explain_concept    pred= 192 draft=   0 acc=   0 rate=n/a tok/s=59.9
 summarize          pred= 192 draft=   0 acc=   0 rate=n/a tok/s=59.9
 qa_factual         pred= 192 draft=   0 acc=   0 rate=n/a tok/s=59.9
 translation        pred= 192 draft=   0 acc=   0 rate=n/a tok/s=60.0
 creative_short     pred= 192 draft=   0 acc=   0 rate=n/a tok/s=60.0
 stepwise_math      pred= 192 draft=   0 acc=   0 rate=n/a tok/s=59.8
 long_code_review   pred= 192 draft=   0 acc=   0 rate=n/a tok/s=57.6

Aggregate: {
  "n_requests": 9,
  "total_predicted": 1728,
  "total_draft": 0,
  "total_draft_accepted": 0,
  "aggregate_accept_rate": null,
  "wall_s_total": 30.2
}
```

### With MTP Enabled

By passing Google's official assistant model configured with `--spec-draft-n-max 4`, throughput spikes to **~120 tok/s**, averaging a **2.0x speedup** with a very high **65.8% aggregate accept rate**:

```
 code_python        pred= 192 draft= 172 acc= 133 rate=0.773 tok/s=130.5
 code_cpp           pred= 192 draft= 187 acc= 128 rate=0.684 tok/s=120.4
 explain_concept    pred= 192 draft= 213 acc= 119 rate=0.559 tok/s=105.7
 summarize          pred= 192 draft= 168 acc= 134 rate=0.798 tok/s=133.5
 qa_factual         pred= 192 draft= 210 acc= 120 rate=0.571 tok/s=107.2
 translation        pred= 192 draft= 175 acc= 132 rate=0.754 tok/s=128.6
 creative_short     pred= 192 draft= 240 acc= 110 rate=0.458 tok/s=94.0
 stepwise_math      pred= 192 draft= 165 acc= 135 rate=0.818 tok/s=135.7
 long_code_review   pred= 192 draft= 197 acc= 125 rate=0.634 tok/s=111.7

Aggregate: {
  "n_requests": 9,
  "total_predicted": 1728,
  "total_draft": 1727,
  "total_draft_accepted": 1136,
  "aggregate_accept_rate": 0.6578,
  "wall_s_total": 15.66
}
```

## Step-by-Step Instructions

### 1) Build Mainline llama.cpp
Mainline llama.cpp has officially merged Gemma 4 MTP support. Build it with CUDA enabled:

```bash
git clone https://github.com/ggml-org/llama.cpp.git
cd llama.cpp
mkdir build && cd build
cmake .. -DGGML_CUDA=ON -DBUILD_SHARED_LIBS=OFF
cmake --build . --config Release -j$(nproc)
```

### 2) Download the Models
You need both the main model and the assistant draft model directly from the same repository:
- **Main model**: [unsloth/gemma-4-12B-it-qat-GGUF](https://huggingface.co/unsloth/gemma-4-12B-it-qat-GGUF) (Grab `gemma-4-12B-it-qat-UD-Q4_K_XL.gguf`)
- **Assistant model**: Download `mtp-gemma-4-12B-it.gguf` from the same [unsloth/gemma-4-12B-it-qat-GGUF](https://huggingface.co/unsloth/gemma-4-12B-it-qat-GGUF) repository (this is a smart Q4_0 drafter that is near-lossless and half the size).

### 3) Run llama-server with MTP

```bash
llama-server \
  -m gemma-4-12B-it-qat-UD-Q4_K_XL.gguf \
  --model-draft mtp-gemma-4-12B-it.gguf \
  --spec-type draft-mtp \
  --spec-draft-n-max 4 \
  --parallel 1 \
  --ctx-size 131072 \
  --temp 1.0 \
  --top-p 0.95 \
  --top-k 64 \
  -fa on \
  -t 10 --threads-batch 12
```

## VRAM Considerations

To run this model comfortably at max speed, both the base 12B model and the 0.4B assistant must fit entirely into the GPU VRAM. In CachyOS with display output offloaded to the CPU's integrated graphics (iGPU), you get 100% of the discrete GPU's 12GB VRAM. 

On Windows or setups where the display is driven by the dGPU, the OS and graphics driver can consume 500MB to 1.5GB of VRAM. If you run into Out of Memory errors, try reducing the context size (`--ctx-size 16384`) or lowering the CPU offload target using `--fit` configurations to free up space.
