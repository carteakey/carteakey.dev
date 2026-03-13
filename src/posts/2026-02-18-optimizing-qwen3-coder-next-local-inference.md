---
title: Running Qwen3-Coder-Next at 40 t/s on consumer hardware (draft)
description: Squeezing every token per second - the sequel
date: 2026-02-18
authored_by: human
updated: 2026-07-15
tags:
  - AI
---
## TL;DR

- **Hardware**: i5-12600K (6P + 4E), RTX 4070 (12 GB), 64 GB DDR5 6000 MT/s, Linux (CachyOS, CUDA 13.0).
- **Scripts**: All bench and server scripts are in [carteakey/l3ms](https://github.com/carteakey/l3ms) under `bench-models/`.
- **Model**: Qwen3-Coder-Next MXFP4 (~45 GB) - 80B total params, ~3B active per token.
- **Result**: **~40 t/s** generation, 510+ t/s prompt processing.
- **For comparison**: GPT-OSS-120B on the same hardware gets ~25 t/s.
- **Key flags** that made it possible:
	- `--fit on` (automatic VRAM-aware layer placement - easiest starting point)
	- `-ctk q8_0 -ctv q8_0` (KV quantization - halves KV VRAM, unlocks extra GPU layers)
	- `--parallel 1` (single slot - reclaims KV cache VRAM for model weights)
	- `taskset -c 0-11` (P-core threads only)
	- `-fa` (flash-attention)

**Recommended run script** - uses `--fit` to auto-place layers, works on any system without tuning (tweak paths as needed). Full script in the [l3ms repo](https://github.com/carteakey/l3ms/blob/main/run-models/run-llama-cpp-qwen3-coder-next-optimized.sh):

```bash
#!/usr/bin/env bash

export LLAMA_SET_ROWS=1
export GGML_CUDA_GRAPH_OPT=1

MODEL="/path/to/Qwen3-Coder-Next-UD-Q4_K_XL.gguf"
LLAMA_SERVER="./vendor/llama.cpp/build/bin/llama-server"

taskset -c 0-11 $LLAMA_SERVER \
    -m "$MODEL" \
    --alias "unsloth/Qwen3-Coder-Next" \
    --ctx-size 65536 \
    --fit on \
    --fit-ctx 65536 \
    --fit-target 128 \
    -ctk q8_0 \
    -ctv q8_0 \
    --parallel 1 \
    --no-mmap \
    --mlock \
    --threads 10 \
    --threads-batch 12 \
    --flash-attn on \
    --batch-size 2048 \
    --ubatch-size 512 \
    --seed 3407 \
    --temp 1.0 \
    --top-p 0.95 \
    --min-p 0.01 \
    --top-k 40 \
    --jinja \
    --host 0.0.0.0 \
    --port 8001 \
    --prio 2 \
    --no-warmup
```

`--fit` probes free VRAM at startup and automatically computes the optimal `-ngl` + `--override-tensor` placement. No manual tuning needed. On an RTX 4070 12 GB with 64k context and q8_0 KV, it places blk 0–7 fully on GPU and spills blk 8 gate+down + blk 9–48 experts to CPU. To see exactly what it would choose without running the server, use `llama-fit-params` directly - see the [optimization notes](#optimization-notes) below.

**Advanced:** for a deterministic, zero-startup-overhead version with the placement hardcoded, see the [optimized run script](https://github.com/carteakey/l3ms/blob/main/run-models/run-llama-cpp-qwen3-coder-next-optimized.sh) in the l3ms repo (`-ngl 49 --override-tensor ...`).

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
- **Agentic use**: Q3CN is described as "aggressively completing tasks" - great for coding agents. It works well with OpenCode, Roo Code, Claude Code, and Qwen Code via llama-server. Because Q3CN is a non-thinking model, it doesn't waste tokens generating internal `<think>` blocks like GPT-OSS and other reasoning models. This keeps your context window clear and agent loops fast.
- **Quirks**: Q3CN can be verbose and occasionally enters loops with certain agent frameworks. Setting `--temp 0` can help for pure coding tasks.

## Using with Qwen Code

Since llama-server exposes an OpenAI-compatible API, [Qwen Code](https://github.com/QwenLM/qwen-code) - the open-source terminal agent by QwenLM - can connect to it directly with no extra tooling.

Full configuration steps are in the [Qwen Code local llama.cpp snippet](/snippets/qwen-code-local-llama-cpp), but the short version is a `~/.qwen/settings.json` like this:

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "unsloth/Qwen3-Coder-Next",
        "name": "unsloth/Qwen3-Coder-Next",
        "baseUrl": "http://localhost:8001/v1",
        "envKey": "LOCAL_LLAMA_API_KEY"
      }
    ]
  },
  "env": { "LOCAL_LLAMA_API_KEY": "local" },
  "security": { "auth": { "selectedType": "openai" } },
  "model": {
    "name": "unsloth/Qwen3-Coder-Next",
    "generationConfig": { "contextWindowSize": 131072 }
  }
}
```

Match `id` to your `--alias`, `baseUrl` to your `--port`, and `contextWindowSize` to your `--ctx-size`. The result is a fully local coding agent - llama-server handles inference, Qwen Code handles the agentic loop.

## Optimization notes

Everything from my [gpt-oss-120b optimization guide](https://carteakey.dev/blog/optimizing-gpt-oss-120b-local-inference/) applies here. The key points:

### Check your RAM speed. Seriously.

I ran my DDR5-6000 RAM at 2000 MT/s for months because BIOS DRAM frequency was set to "Auto." This is worth repeating because it was a **3x performance handicap**.

```bash
sudo dmidecode -t memory | grep -E "Speed|Configured"
# Look for "Configured Memory Speed" - if it doesn't match your XMP profile, enable XMP in BIOS.
```

### MoE offload strategies and `--fit`

One of the core challenges with a 47 GB model on a 12 GB card is deciding *which* tensors stay on GPU. There are three broad approaches in upstream llama.cpp (UD-Q4_K_XL quant, `pp512+tg128`, RTX 4070 12 GB, 10 threads pinned to cores 0–11, flash-attn on, mmap off).

**Benchmark context:** `pp512` = 512-token prompt, `tg128` = 128 tokens generated. llama-bench sizes its KV cache to exactly `n_prompt + n_gen` (640 tokens here) - all runs on equal footing. Synthetic throughput only; real-world speeds at longer contexts will differ, especially for prefill.

| Strategy | Description | pp512 (t/s) | tg128 (t/s) |
| -------- | ----------- | ----------: | ----------: |
| `N_CPU_MOE=40` (default) | Keep first 40 MoE layers on CPU as integer count | 451 | **40.6** |
| `--ot .ffn_.*_exps.=CPU` | All expert tensors to CPU via regex | 410 | 33.7 |
| `--fit` (128 MiB margin, 131k ctx) | llama-fit-params auto-places tensors per-layer | 476 | 38.2 |
| `--fit` (128 MiB margin, 64k ctx) | Smaller ctx floor frees VRAM for 2 more GPU layers | 497 | 39.60 |
| `--fit` + q8\_0 KV (64k ctx, 128 MiB margin) | q8\_0 KV frees another ~2 GB, one more GPU layer | 511 | 39.93 |
| `--fit` + q8\_0 KV (64k ctx, 512 MiB margin) | 512 MiB margin for VMM pool safety | **502** | **39.62** |

**`--fit` wins on prefill, and gets better with a smaller context floor.** At 131k context, llama-fit-params placed blk 0–4 fully on GPU, partially spilled blk 5 (`ffn_down` only), and moved all MoE experts from blk 6 onward to CPU (pp=476). Dropping to a 64k context floor freed enough VRAM to keep blks 5–6 fully on GPU, pushing the CPU boundary to blk 7 (pp=497, +21 t/s). Passing `-ctk q8_0 -ctv q8_0` to `llama-fit-params` told it to account for the smaller KV footprint (~2 GB at 64k vs ~4 GB at 64k f16), freeing one more layer - blk 7 fully on GPU, CPU starting at blk 8 (pp=**511**, tg=**39.93**).

**`N_CPU_MOE=40` no longer wins on generation.** The 64k+q8_0 fit result (39.93 tg) matches the N_CPU_MOE=40 baseline (40.6 tg) within bench noise, while delivering 60 t/s more prefill.

**Manual `all-cpu-moe` is the worst of both.** Bluntly forcing all `_exps` tensors to CPU with a single regex hurts both prefill and generation. It's the right starting point for understanding your VRAM budget, not the ending point. The `up-down-cpu` and `up-cpu` strategies both OOM on a 12 GB card - 512 experts × gate/up/down projections across 40+ layers simply doesn't fit even with nothing else on GPU.

**The production server script** (`run-llama-cpp-qwen3-coder-next-optimized.sh`) uses the static `-ot` derived from the 64k+q8_0 fit for deterministic startup - same placement, no fit probing delay. The `--fit` approach (with `--fit-ctx 65536`) is still useful for experimentation or for adapting to different VRAM configurations.

### `--poll`, `--numa`, `-ctk`/`-ctv` - flat or negative

Tested against the `N_CPU_MOE=40` baseline (pp512: ~453, tg128: ~39.5):

| Experiment | pp512 (t/s) | tg128 (t/s) | verdict |
| ---------- | ----------: | ----------: | ------- |
| `--poll 0` | 453 | 37.4 | noise |
| `--poll 50` (default) | 453 | 36.4 | baseline |
| `--poll 100` | 454 | 37.1 | noise |
| `--numa isolate` (no taskset) | 453 | 33.0 | worse |
| `--numa distribute` (no taskset) | 454 | 33.3 | worse |
| `-ctk q8_0 -ctv q8_0` | 453 | 36.0 | flat at bench ctx |

Poll is completely flat - on hybrid CPU+GPU inference the synchronisation overhead dominates, polling level doesn't matter. NUMA modes are actually worse than `taskset -c 0-11` because this is a single-socket system with no NUMA topology to exploit. KV quantisation has no visible effect at the 640-token bench context; it will matter in production at 131k context where the KV cache is several GB.

### `ik_llama.cpp` - in progress 🚧

[ikawrakow/ik_llama.cpp](https://github.com/ikawrakow/ik_llama.cpp) is a fork with MoE-specific kernel optimisations not yet upstream. Results so far (same hardware, same model):

| Config | pp512 (t/s) | tg128 (t/s) | notes |
| ------ | ----------: | ----------: | ----- |
| upstream baseline | **453** | 40.6 | reference |
| ik fused-moe (default) | 215 | 40.5 | +1 tg, −238 pp |
| ik fused-moe + merge-qkv | 217 | 40.9 | marginal over fused alone |
| ik fused-moe + merge-up-gate | 215 | **41.1** | best tg; ~73 GB RAM needed |
| ik fused-moe + ger + merge-up-gate | 215 | 41.2 | diminishing returns |

The fused MoE kernel hits 40+ t/s on generation - the target - but cuts prefill roughly in half vs upstream. `--merge-up-gate-experts` repacks the up+gate weight matrices into a single tensor for better read locality; it gives another ~0.6 tg but nearly doubles RAM usage (model swells from 46 to 73 GB in memory). Not usable if you're tight on RAM.

**Net verdict:** ik_llama is the right choice if you are generation-bottlenecked and have RAM headroom. Upstream llama.cpp remains better for prefill-heavy workloads. The best overall config depends on your use case - coding agents are tg-heavy, so ik_llama's fused-moe default is worth the pp regression.

For benchmarking and experimentation, all scripts are in [carteakey/l3ms](https://github.com/carteakey/l3ms) under `bench-models/`:

```bash
# Upstream: simple default (N_CPU_MOE=40)
./bench-llama-cpp-qwen3-coder-next.sh

# Upstream: manual strategy presets
STRATEGY=all-cpu-moe ./bench-llama-cpp-qwen3-coder-next-strategies.sh

# Upstream: auto-fit
FIT_TARGET=128 FIT_CTX=131072 ./bench-llama-cpp-qwen3-coder-next-fit.sh

# ik_llama: default (fused-moe on)
./bench-ik-llama-cpp-qwen3-coder-next.sh

# ik_llama: strategy presets
STRATEGY=fused-muge ./bench-ik-llama-cpp-qwen3-coder-next-strategies.sh
```

### Things I haven't tried yet

- **Vulkan backend** - some users report 2x speed for MoE partial offload
- **Speculative decoding** with a small Qwen3 draft model
- **DDR5 timing tightening** (tRFC especially) for more bandwidth

## Post-mortem / Changelog

- 2026-07-16 - 64k context + q8_0 KV fit: best bench pp=511 (FIT_TARGET=128). Production script uses FIT_TARGET=512 (pp=502, tg=39.62) to avoid CUDA VMM pool OOM at long prompts - GGML's pool grows in 1 GiB chunks; 128 MiB headroom is insufficient for mid-session growth. Also disabled `GGML_CUDA_GRAPH_OPT` which triggers CUDA graph re-capture at new context depths.
- 2026-07-15 - Extended benchmark: added poll, numa, ctk/ctv, and ik_llama results. Poll and NUMA flat/negative on single-socket hybrid inference. KV quant no effect at bench context. ik_llama fused-moe hits 40.5 tg (target!) but halves prefill vs upstream - best for generation-heavy workloads. Added ik_llama bench scripts and bench runbook to [carteakey/l3ms](https://github.com/carteakey/l3ms).
- 2026-07-14 - Benchmarked MoE offload strategies. `--fit` wins on prefill (476 t/s); `N_CPU_MOE=40` leads on generation (39.5 t/s). llama-bench sizes KV cache to `n_prompt + n_gen` so comparisons are apples-to-apples.
- 2026-03-13 - Found root cause of intermittent slow tg (32–35 t/s): `power-profiles-daemon` (KDE default) was setting a non-performance HWP state on some boots - all sysfs checks looked fine but hardware was degraded. Replaced with `tuned-ppd` + `throughput-performance` profile (CachyOS recommended). Clean reboot now consistently delivers **40.6 t/s** with zero manual tuning. Updated baselines.
- 2026-03-02 - Added `-ctk q8_0` and `-ctv q8_0` parameters for KV cache and token vector quantization.
- 2026-02-15 - Initial post. Getting ~38 t/s after enabling XMP and updating llama.cpp.

## Reference

- [Qwen3-Coder-Next GGUF (unsloth)](https://huggingface.co/unsloth/Qwen3-Coder-Next-GGUF)
- [What's the best way to run Qwen3 Coder Next?](https://www.reddit.com/r/LocalLLaMA/comments/1qxs34w/whats_the_best_way_to_run_qwen3_coder_next/)
- [Qwen3 Coder Next as first "usable" coding model < 60 GB](https://www.reddit.com/r/LocalLLaMA/comments/1qz5uww/qwen3_coder_next_as_first_usable_coding_model_60/)
- [Qwen Coder Next is an odd model](https://www.reddit.com/r/LocalLLaMA/comments/1r2c34d/qwen_coder_next_is_an_odd_model/)
- My gpt-oss-120b optimization guide: [carteakey.dev](https://carteakey.dev/blog/optimizing-gpt-oss-120b-local-inference/)

<!-- TODO: Future post - GPT-OSS-120B vs Qwen3-Coder-Next head-to-head comparison:
  - Benchmark suite: coding (HumanEval, SWE-bench), reasoning, long-context retrieval
  - Side-by-side inference speeds across different context lengths
  - Quality comparison on real agentic tasks (OpenCode / Roo Code sessions)
  - VRAM+RAM tradeoffs: 45 GB vs 59 GB MXFP4, practical fitting strategies
  - When to pick each model
-->
