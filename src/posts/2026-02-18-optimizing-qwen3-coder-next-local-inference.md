---
title: Running Qwen3-Coder-Next at 40 t/s on consumer hardware (draft)
description: Squeezing every token per second - the sequel
date: 2026-02-18
updated: 2026-02-18
tags:
  - AI
---
## TL;DR

- **Hardware**: i5-12600K (6P + 4E), RTX 4070 (12 GB), 64 GB DDR5 6000 MT/s, Linux (CachyOS, CUDA 13.0).
- **Model**: Qwen3-Coder-Next MXFP4 (~45 GB) - 80B total params, ~3B active per token.
- **Result**: **~40 t/s** generation, 200+ t/s prompt processing at 32k context.
- **For comparison**: GPT-OSS-120B on the same hardware gets ~30 t/s.

```bash
#!/usr/bin/env bash

export LLAMA_SET_ROWS=1
export GGML_CUDA_GRAPH_OPT=1

# Disable swap to prevent model paging
sudo sysctl vm.swappiness=0

MODEL="/home/carteakey/models/unsloth/Qwen3-Coder-Next-GGUF/Qwen3-Coder-Next-MXFP4_MOE.gguf"
LLAMA_SERVER="./vendor/llama.cpp/build/bin/llama-server"

taskset -c 0-11 $LLAMA_SERVER \
    -m "$MODEL" \
    --alias "unsloth/Qwen3-Coder-Next" \
    --seed 3407 \
    --temp 1.0 \
    --top-p 0.95 \
    --min-p 0.01 \
    --top-k 40 \
    --host 0.0.0.0 \
    --port 8001 \
    --jinja \
    --ctx-size 131072 \
    --fit on \
    --fit-ctx 131072 \
    --fit-target 128 \
    --no-mmap \
    --mlock \
    --threads 10 \
    --threads-batch 12 \
    --flash-attn on \
    --batch-size 2048 \
    --ubatch-size 512 \
    --prio 2 \
    --no-warmup
```

## Why Qwen3-Coder-Next?

Qwen3-Coder-Next is an interesting beast. It's an 80B parameter MoE model that only activates ~3B parameters per token - making it extremely efficient for the amount of intelligence you get. The community consensus is that it's the best local coding model under 60 GB.

Key architectural details:
- **48 layers** with a hybrid attention layout
- **36 layers use GatedDeltaNet** (linear/recurrent attention - no KV cache needed!)
- **12 layers use standard GQA** (16 query heads, 2 KV heads)
- **512 total experts**, 10 active per token + 1 shared
- **262K native context** - and because only 12/48 layers need KV cache, large contexts are cheap

The hybrid DeltaNet + GQA architecture is what makes it special. Most of the model uses linear attention, which means:
1. Context is dramatically cheaper than standard transformers
2. You can push to 64k-128k context without blowing your VRAM budget
3. Token generation is fast because the recurrent layers are efficient

The MXFP4 GGUF is only ~45 GB, making it easier to fit alongside KV cache in 64 GB of system RAM.

## How it compares to GPT-OSS-120B

Both models are MoE and run well on consumer hardware with CPU offloading. Here's how they compare on my system:

|                       | GPT-OSS-120B | Qwen3-Coder-Next |
| --------------------- | ------------ | ---------------- |
| Total params          | 120B         | 80B              |
| Active params/token   | ~5.1B        | ~3B              |
| MXFP4 size            | ~59 GB       | ~45 GB           |
| TG (tok/s)            | ~30          | **~40**          |
| PP (tok/s)            | ~300         | ~200+            |
| Max practical context | 24-32k       | 64-128k          |
| Layers                | 36           | 48               |


Qwen3-Coder-Next is faster because it activates fewer parameters per token (3B vs 13B), meaning less data needs to be read from RAM per generated token.

### Quality comparison

Based on community feedback and my own testing:
- **Coding**: Both are very capable. Q3CN is particularly good at Python, Go, and agentic tool use. GPT-OSS-120B has an edge on complex reasoning.
- **Context handling**: Q3CN is significantly better at long context thanks to the hybrid attention. GPT-OSS-120B's KV cache for full attention gets expensive fast.
- **Agentic use**: Q3CN is described as "aggressively completing tasks" - great for coding agents. It works well with OpenCode, Roo Code, and even Claude Code via llama-server.
- **Quirks**: Q3CN can be verbose and occasionally enters loops with certain agent frameworks. Setting `--temp 0` can help for pure coding tasks.

## Optimization notes

Everything from my [gpt-oss-120b optimization guide](https://carteakey.dev/blog/optimizing-gpt-oss-120b-local-inference/) applies here. The key points:

### Check your RAM speed. Seriously. {#check-your-ram-speed-the-sequel}

I ran my DDR5-6000 RAM at 2000 MT/s for months because BIOS DRAM frequency was set to "Auto." This is worth repeating because it was a **3x performance handicap**.

```bash
sudo dmidecode -t memory | grep -E "Speed|Configured"
# Look for "Configured Memory Speed" - if it doesn't match your XMP profile, enable XMP in BIOS.
```

### Things I haven't tried yet

- **Vulkan backend** - some users report 2x speed for MoE partial offload
- **Speculative decoding** with Qwen3 0.6B as draft model
- **`ik_llama.cpp` fork** - reportedly better MoE performance
- **DDR5 timing tightening** (tRFC especially) for more bandwidth

## Post-mortem / Changelog

- 2026-02-15 - Initial post. Getting ~38 t/s after enabling XMP and updating llama.cpp.

## Reference

- [Qwen3-Coder-Next GGUF (unsloth)](https://huggingface.co/unsloth/Qwen3-Coder-Next-GGUF)
- [What's the best way to run Qwen3 Coder Next?](https://www.reddit.com/r/LocalLLaMA/comments/1qxs34w/whats_the_best_way_to_run_qwen3_coder_next/)
- [Qwen3 Coder Next as first "usable" coding model < 60 GB](https://www.reddit.com/r/LocalLLaMA/comments/1qz5uww/qwen3_coder_next_as_first_usable_coding_model_60/)
- [Qwen Coder Next is an odd model](https://www.reddit.com/r/LocalLLaMA/comments/1r2c34d/qwen_coder_next_is_an_odd_model/)
- My gpt-oss-120b optimization guide: [carteakey.dev](https://carteakey.dev/blog/optimizing-gpt-oss-120b-local-inference/)
