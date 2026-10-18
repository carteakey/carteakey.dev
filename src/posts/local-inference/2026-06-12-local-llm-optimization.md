---
title: "Local LLM Inference Optimization: The Complete Guide"
description: "A practical guide to hardware, OS, and llama.cpp tuning, from a year of experiments on one consumer CUDA workstation."
image: /img/blog-sketches/unique/local-llm-optimization-stamp-trim.png
imageAlt: "Transparent monochrome sketch of a workstation PC tower with exposed GPU fans, monitor displaying tuning parameters, and dials measuring tokens-per-second performance"
date: 2026-06-12
updated: 2026-10-18
giscusTerm: "/blog/local-inference/local-llm-optimization/"
authored_by: ai-assisted
draft: false
tags:
  - AI
  - Self-Host
pinned: true
---

{% callout "note", "How this guide was built" %}
I put this reference together from my notes, benchmark runs, and server scripts in the [L3MS homelab toolkit](https://github.com/carteakey/l3ms) alongside the local inference posts on this site. Every experiment, measurement, and failure mode documented here comes from real runs on my own workstation.
{% endcallout %}

## Preface

Over the past year I've written posts on running [gpt-oss-120b](/blog/local-inference/optimizing-gpt-oss-120b-local-inference/), [Qwen3-Coder-Next](/blog/local-inference/optimizing-qwen3-coder-next-local-inference/), [Gemma 4 26B](/blog/local-inference/running-gemma-4-26b-a4b-locally/), [Qwen3.6-35B-A3B](/blog/local-inference/running-qwen3-6-35b-a3b-locally/), [Gemma 4 MTP](/blog/local-inference/running-gemma-4-mtp-locally/), [Qwen3.8-27B](/blog/local-inference/running-qwen3-8-27b-locally/), [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/), and [Strata](/blog/local-inference/strata-on-an-rtx-4070/) locally on consumer hardware. Each post has its own failure modes and tuning logs, yet the same lessons keep showing up: check your RAM speed first, pin threads to P-cores, quantize the KV cache, and don't trust the default desktop power profile.

Rather than re-discovering the same flags in every new model write-up, I wanted one master reference I could link back to. If you're hitting a throughput wall, setting up a workstation from scratch, or trying to figure out what a specific knob actually changes, start here.

The scope is wide, though my measurements come from one machine: {% device "yeti-cachy" %}, my main homelab node with an RTX 4070, an Intel i5-12600K, DDR5 memory (upgraded from 32 GB to 64 GB mid-year), CachyOS Linux, CUDA, and source builds of llama.cpp alongside model-specific runtimes like [Strata](/blog/local-inference/strata-on-an-rtx-4070/). Because my RAM capacity changed during the project, the [L3MS dashboard](https://github.com/carteakey/l3ms) records the exact hardware snapshot for each run instead of pretending every result came from a fixed box. The Apple Silicon, AMD, and multi-GPU sections are here as starting points, though I haven't tested those setups myself.

When I share a throughput number or memory ceiling, I measured it on this node. Where I'm describing upstream llama.cpp behavior or an untested lead, I'll say so plainly.

## 1. TL;DR: Start Here

- Build llama.cpp from source when you want full flag control and portable performance. Most of this guide assumes you have direct access to `llama-server` flags.
- If a custom "overfit" engine exists for your exact model and GPU, test it alongside llama.cpp. Moving [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/) from llama.cpp to [Strata](/blog/local-inference/strata-on-an-rtx-4070/) nearly tripled my long-context decode speed from 27 tok/s to 75 tok/s on the same card.
- Use LM Studio when you want a desktop GUI, easy model browsing, and a local OpenAI-compatible server with JIT loading and idle eviction.
- Evaluate vLLM when you need multi-user serving and continuous batching on datacenter GPUs.
- On Apple Silicon, compare llama.cpp Metal with mlx; unified memory changes the sizing math completely.
- If token generation is unexpectedly slow on an MoE model, check your RAM clock before touching any software flags. Enabling XMP brought my machine back from roughly one-third speed.
- When you hit VRAM limits, drop `--parallel` to a single slot, quantize the KV cache (symmetric q8_0 or asymmetric K8V4), trim context to what you actually use, and let `--fit` place the remaining layers.
- When a model ships with Per-Layer Embeddings (PLE) like Qwen3.8-Flash-Next, leave mmap enabled so the giant embedding lookup table streams from NVMe SSD instead of evicting active MoE experts from system RAM.
- For MTP speculative decoding, benchmark draft acceptance and KV cache precision under your real sampling parameters. Greedy decoding (`temp = 0`) flatters draft acceptance and can trigger `<think>` repetition loops on reasoning models.
- For coding agents, measure time to first token, prompt processing, decode speed, prompt-cache reuse, and full tool-call loop latency together.

### 1.1 Where to Jump In

This is a workbench reference, not a linear tutorial. Jump straight to the part that matches your problem:

- Slow MoE generation: check [the 3-tier memory hierarchy and RAM speed](#6-1-the-memory-hierarchy-the-most-important-mental-model), then [layer placement and dynamic expert caching](#10-layer-placement-the-core-optimization-for-moe), and [P-core thread pinning](#14-3-taskset-p-core-pinning-linux).
- A model that won't load or crashes mid-session: start with [`--fit` placement](#10-4-fit-automatic-placement), [context and KV cache sizing](#11-context-and-kv-cache), and the [known OOM and TG variability table](#known-tg-variability-root-causes).
- A model with a huge PLE table (like Qwen3.8-Flash-Next) thrashing RAM: see [the `--no-mmap` PLE exception](#15-1-no-mmap) and [3-tier NVMe streaming](#6-1-the-memory-hierarchy-the-most-important-mental-model).
- Vision failing at load or on the first image: go to [Vision / Multimodal](#20-vision-multimodal). The projector needs its own VRAM headroom (or a CPU offload path) and a large enough micro-batch.
- MTP speculation that isn't faster than plain decoding: check [target vs draft KV precision](#19-2-target-and-draft-kv-cache-precision), [rejection spirals on offloaded MoEs](#19-1-mtp-drafting-configuration-flags), and [Thinking Mode sampling](#13-1-temp-temperature).
- Coding agents that feel sluggish despite fast decode: measure the full inspect-and-edit loop in [Coding Workloads](#18-coding-workloads-what-to-measure).
- Pushing a flagship MoE past llama.cpp's layer-offload ceiling: read [Dynamic Per-Expert Caching](#10-5-static-placement-vs-dynamic-per-expert-caching) and [Custom Inference Engines & Specialized Forks](#22-custom-inference-engines-specialized-forks-strata-ik-llama-cpp).
- More than one GPU: read the [Multi-GPU Primer](#21-multi-gpu-primer) before guessing tensor split ratios.
- LM Studio or Ollama users: the [hardware](#6-hardware), [OS tuning](#7-os-choice), and [security](#23-security-notes) sections still apply directly, even where CLI flags don't.

### 1.2 Start with the Symptom

| Symptom | Check first | Then change |
| --- | --- | --- |
| Model fails to load or dies late in a session | Free VRAM and real serving context | Drop slots to 1, quantize KV (`q8_0` or `K8V4`), raise `--fit-target` headroom, then tune [placement](#10-layer-placement-the-core-optimization-for-moe) |
| Prompt processing is slow | Prefill speed with a realistic prompt | Sweep [`--ubatch-size`](#12-2-ubatch-size-ub-physical-micro-batch); verify GPU offload and Flash Attention |
| Token generation is slow | Decode speed, RAM MT/s, CPU frequency | Fix XMP and OS power state, then compare [placement / expert caching](#10-layer-placement-the-core-optimization-for-moe) and [P-core pinning](#14-3-taskset-p-core-pinning-linux) |
| Speculation adds no speed | Draft acceptance rate and end-to-end loop time | Cap `--spec-draft-n-max` to 2, set `--spec-draft-p-min 0.7`, or check [KV precision](#19-2-target-and-draft-kv-cache-precision) and [PLE quantization](#15-1-no-mmap) |
| Reasoning model loops inside `<think>` | Sampling temperature and penalties | Switch from greedy (`temp 0`) to [official Thinking Mode sampling](#13-1-temp-temperature) (`temp 1.0, top-p 0.95, top-k 20`) |
| Two GPUs are slower than one | Split mode and PCIe interconnect | Start with [layer mode](#21-multi-gpu-primer); treat tensor mode as experimental |

### 1.3 Safe Starting Profiles

These are the conservative starting profiles I use on my single-user node before doing model-specific sweeps.

{% wide %}
| Workload | `--fit-target` | Context | KV cache | `--parallel` | Batch / ubatch |
| --- | ---: | ---: | --- | ---: | ---: |
| Text, 12 GB VRAM (standard) | 512 MiB | 64k | `q8_0` / `q8_0` | 1 | 1024 / 512 |
| Text, 12 GB VRAM (long-context MoE / hybrid) | 512 MiB | 128k–262k | `q8_0` / `q4_0` (`K8V4`) | 1 | 1024 / 512 |
| Text, 24 GB VRAM | 512–768 MiB | 128k | `q8_0` / `q8_0` | 1–2 | 1024 / 512 |
| Vision, 12 GB VRAM (GPU mmproj) | 2048 MiB | 64k | `q8_0` / `q8_0` | 1 | 256 / 512 |
| MTP speculative decoding | 512+ MiB | 64k–128k | Benchmark per model | 1 | 1024 / 512 |
{% endwide %}

{% callout "warning", "Avoid the classic 12 GB failure modes" %}
I always leave at least 512 MiB of `--fit-target` headroom so CUDA's VMM pool can grow as context fills, exclude E-cores on hybrid Intel CPUs, keep mmap enabled if the model uses an external PLE table, and test `GGML_CUDA_GRAPH_OPT` on long sessions before trusting it.
{% endcallout %}

## 2. Optimization Priority Checklist

Here's the order I work through on my node, ranked by how much throughput or stability each step actually buys.

{% wide %}
| # | Action | Measured impact / reason | Section |
| ---: | --- | --- | ---: |
| 1 | **Enable rated XMP / EXPO memory profile in BIOS** | Restored MoE decode from roughly one-third speed back to baseline | §6.1 |
| 2 | **Evaluate a model-specific engine (e.g. Strata) for giant MoEs** | Dynamic per-expert VRAM caching jumped Qwen3.8-Flash-Next from 27 to 75 tok/s at 128k | §10.5, §22 |
| 3 | **Use native MTP speculative drafting on supported models** | 2.0–2.6x decode speedup on Gemma 4 QAT; +25–35% on offloaded Qwen3.8 MoE | §19.1 |
| 4 | **Keep PLE tables uncompressed (`Q8_0`) on NVMe via `mmap`** | Costs zero VRAM/RAM and lifted Strata decode by +31.7% (56.8 to 74.8 tok/s) via higher draft acceptance | §6.1, §15.1 |
| 5 | **Prefer QAT or Dynamic GGUF low-bit quants over plain PTQ** | Gemma 4 QAT Q4 matched near-Q8 quality while fitting 12 GB VRAM | §9.3, §9.4 |
| 6 | **Run Linux, or switch Windows to High/Ultimate Performance** | Linux ran 15–20% faster than the Windows setup I compared on the same hardware | §7 |
| 7 | **Replace `power-profiles-daemon` with `tuned-ppd` on Linux** | Eliminated an intermittent 20–30% boot-to-boot decode drop on Intel HWP | §7.4 |
| 8 | **Build `llama.cpp` from source and keep a known-good binary** | Captures new fused CUDA kernels and NVMe prefetching while allowing clean A/B tests | §8.2, §17.4 |
| 9 | **Let `--fit` probe placement before hardcoding `-ngl` / `-ot`** | Automatically accounts for KV cache and `mmproj` within your VRAM headroom target | §10.4 |
| 10 | **Quantize KV cache (`q8_0/q8_0` or asymmetric `K8V4`)** | Frees 2–4 GB of VRAM at 64k–128k context so more layers or experts stay on the GPU | §11.2 |
| 11 | **Benchmark target and draft KV precision together for MTP** | Target `q8_0` killed Gemma 4 draft acceptance; `f16` kept acceptance above 70% | §19.2 |
| 12 | **Use official Thinking Mode sampling (`temp 1.0`) on reasoning models** | Prevents `<think>` repetition loops at a ~4.9% decode cost vs greedy (`temp 0`) | §13.1 |
| 13 | **Set `--parallel 1` on a single-user server** | Prevents multiplying KV cache VRAM by unused concurrent slots | §11.3 |
| 14 | **Pin threads to P-cores with `taskset -c` on hybrid Intel CPUs** | Keeping E-cores out of the thread pool improved MoE decode by 20–30% | §14.3 |
| 15 | **Enable Flash Attention (`--flash-attn on`)** | Cuts attention memory traffic and makes 64k–262k context practical on 12 GB | §11.4 |
| 16 | **Use `--no-mmap` on standard hybrid MoEs, but NEVER on PLE models** | Removes cold page-fault jitter for RAM-resident experts; fatal if a giant PLE table is present | §15.1 |
| 17 | **Use `--mlock` when ZRAM/swap degrades long sessions** | Pins active model pages in RAM when host memory has enough headroom | §15.2 |
| 18 | **Drop to headless mode or route display through the iGPU** | Reclaims 300–1000 MiB of desktop compositor VRAM on the dedicated GPU | §6.2, §7.4 |
| 19 | **Sweep `--ubatch-size` against your real prompt shape** | Balances prefill speed against peak VRAM allocation | §12.2 |
| 20 | **A/B test `GGML_CUDA_GRAPH_OPT` on long sessions** | Can lower kernel dispatch overhead, or cause VMM growth and regressions as context fills | §17.1 |
{% endwide %}

## 3. What to Measure Before Tuning

Tuning only makes sense when you know which phase is actually holding you back. I check whether I'm bottlenecked on prefill, decode bandwidth, draft acceptance, or memory spill before changing flags.

| Metric | What it tells you | Common bottleneck |
| --- | --- | --- |
| **TTFT** (time to first token) | How long before output starts streaming | Model load, cold prefill, or uncached system prompts |
| **PP** (prompt processing) | How fast the model reads input context (prefill) | Batch/ubatch size, GPU compute kernels, cold SSD page-in |
| **TG** (token generation) | How fast output streams after prefill (decode) | VRAM/DDR5 bandwidth, expert placement, CPU thread pinning |
| **VRAM at load** | Whether weights, KV cache, and `mmproj` fit cleanly | Context length, `--parallel` slots, quant bit-width |
| **VRAM after long sessions** | Whether memory creeps into OOM territory over time | CUDA graph re-capture, VMM pool growth, tight `--fit-target` |
| **RAM bandwidth & spill** | Whether offloaded MoE experts are starving the CPU | Disabled XMP/EXPO, single-channel RAM, or SSD page thrashing |
| **Draft acceptance rate** | Whether speculative decoding is doing useful work | Draft head quality, KV precision mismatch, PLE quantization, or draft length |
| **Prompt-cache hit rate** | Whether repeated agent context is reused across turns | Cache key drift, prompt prefix changes, or server restarts |
| **Tool-call loop time** | Real wall-clock latency felt in an editor or CLI | TTFT + tool execution + repeated prefill across turns |

Don't optimize from a single short prompt. Short prompts hide KV cache costs, long-context VMM growth, and slot allocations. Always benchmark at the context length you actually serve.

Three habits keep my numbers comparable across runs:

- Discard the warm-up. Decode speed has a cold transient right after load while n-gram pools, expert caches, and OS page tables settle. I throw away the first couple of probes and report steady state. Use a unique prefix on each prefill probe, or KV reuse will inflate the result.
- Log the system state with every run. I record the CPU scaling governor, EPP state, RAM speed, free memory, Transparent Huge Pages state, and temperatures. Running under the powersave governor alone drops decode noticeably against performance, so I never compare runs across different power states.
- Check for SSD spill during decode. With the model loaded and warmed up, diff `/proc/<llama-server-pid>/io` `read_bytes` across a steady generation probe. Near zero (or a few kilobytes per token for SSD-resident PLE tables) is healthy; tens of megabytes per token means hot expert pages are re-faulting from disk and decode will crater. Ignore ZRAM counters here; check physical `/proc/<pid>/io` after several warm-up generations.

## 4. Glossary

| Term | Definition |
| --- | --- |
| **GGUF** | The binary file format `llama.cpp` uses to store quantized weights, architecture metadata, and the tokenizer in a single file (or shard set). |
| **Quantization** | Lowering weight precision (e.g. FP16 to 4-bit) to shrink memory footprint and reduce bandwidth traffic per token. |
| **QAT (Quantization-Aware Training)** | Training or fine-tuning with simulated quantization noise in the loop so weights adapt to low-bit rounding before export. |
| **MTP (Multi-Token Prediction)** | Speculative decoding using a built-in or companion draft head trained to propose multiple future tokens that the target model verifies in one forward pass. |
| **PLE (Per-Layer Embeddings)** | A large external lookup table (`per_layer_token_embd.weight`, used in models like Qwen3.8-Flash-Next) that injects high-dimensional n-gram token representations into every layer while reading only a few kilobytes per token. |
| **Gated-DeltaNet (Linear Attention)** | A recurrent state-space-style attention layer that keeps a fixed-size state instead of a growing per-token KV cache, drastically shrinking long-context VRAM use when interleaved with full attention. |
| **PP / Prompt Processing** | Tokens per second while reading the input prompt (the compute-bound prefill phase). |
| **TG / Token Generation** | Tokens per second while streaming the response (the bandwidth-bound autoregressive decode phase). |
| **KV Cache** | The VRAM buffer storing attention Key and Value tensors for prior tokens in the session. Grows linearly with context length on full-attention layers. |
| **Context Window** | The maximum combined input and output tokens a server slot can hold, which sets the upper bound on KV cache memory. |
| **Dense Model** | A standard transformer where every parameter activates on every token. Needs to fit entirely in VRAM for fast generation. |
| **MoE / Mixture of Experts** | A sparse architecture where each token routes through only a small fraction of total expert weights (e.g. 10 of 512 experts per layer), making hybrid VRAM + RAM execution practical. |
| **Active Parameters** | The subset of weights read and computed for a single token. Decode speed follows the active parameter path and where those weights live in memory. |
| **Perplexity (PPL)** | A statistical measure of model surprise on a reference text corpus. Good for catching broken quants, though blind to subtle answer flips. |
| **KLD / KL Divergence** | The distributional distance between a quantized model's next-token probabilities and the unquantized reference model on identical prompts. |
| **`llama-bench`** | The synthetic CLI benchmark included with `llama.cpp` for isolated PP and TG sweeps. |
| **`llama-fit-params`** | A dry-run utility that probes free VRAM and prints deterministic `-ngl` and `-ot` placement flags without starting the server. |
| **`-ngl` / `--n-gpu-layers`** | The number of transformer blocks offloaded to GPU VRAM. |
| **`-ot` / `--override-tensor`** | A regex-based rule for routing specific tensor families (such as routed MoE experts or PLE tables) to the CPU or GPU. |
| **XMP / EXPO** | Intel and AMD BIOS memory profiles that run DDR4/DDR5 RAM at its rated speed instead of the slow JEDEC fallback clock. |

## 5. The Inference Landscape

### 5.1 Why Run Locally?

- Prompts, private codebases, and local notes never leave hardware I control.
- There's no per-token bill once the machine is running.
- I can pick any checkpoint, quant, context window, and sampling setup the hardware will tolerate without an API changing underneath my workflow.
- Everything keeps working offline.
- I can run controlled benchmarks and swap runtimes while holding the hardware constant.

### 5.2 Cloud vs Local: Honest Tradeoffs

| Dimension | Hosted API | Rented Cloud GPU | Local Workstation |
| --- | --- | --- | --- |
| Setup time | Minutes | Hours | Hours to days |
| Model ceiling | Frontier proprietary models | Limited by rented VRAM | Limited by the hardware you own |
| Ongoing cost | Per token or monthly seat | Per GPU-hour plus storage | Electricity under load |
| Data privacy | Provider processes every prompt | You control the container | Prompts stay on your LAN |
| Upfront hardware | None | None | Consumer GPU + fast system RAM |

I use both every day. Hosted APIs are still better for frontier architectural tasks, while local models on {% device "yeti-cachy" %} handle private repo indexing, routine coding loops, classification, and experiments without a meter running.

### 5.3 Local Inference Tools & Custom Engines

Before touching flags, pick the runtime that matches your job. Most of this guide focuses on llama.cpp because it's the universal reference runtime across hardware backends. Recently, though, a second category has emerged: model-specific ("overfit") inference engines like [Strata](/blog/local-inference/strata-on-an-rtx-4070/) that drop multi-vendor abstractions to squeeze maximum speed out of a single model family on a single GPU architecture (a trend I wrote about in [The Rise of Overfit Inference Engines](/blog/local-inference/the-rise-of-overfit-inference-engines/)).

{% wide %}
| Tool | Best for | Tradeoffs & notes |
| --- | --- | --- |
| **`llama.cpp`** | Universal hardware/model support, full flag control, rock-solid server | Build from source; static layer/tensor placement hits a ceiling on giant offloaded MoEs |
| **Custom / Overfit Engines ([Strata](/blog/local-inference/strata-on-an-rtx-4070/), `ninfer`, `ds4`)** | Maximum single-GPU speed on a specific flagship model (e.g. Qwen3.8-Flash-Next) | Purpose-built features like dynamic per-expert VRAM caching (`75 tok/s` at 128k); narrow model support |
| **`ik_llama.cpp`** | Advanced CPU / hybrid MoE kernels and frontier `IQ_K` quants | Fork-specific quant formats and flags that don't merge back to mainline `llama.cpp` |
| **LM Studio** | Desktop GUI, model discovery, and clean headless/server UX | Wraps `llama.cpp` and `mlx` with JIT loading and TTL eviction; fewer low-level placement knobs |
| **Ollama** | Quick Docker/CLI setup and simple model lifecycle | Uses `llama.cpp` under the hood but hides nearly every tuning flag covered in §10–§19 |
| **`vLLM`** | Multi-user production serving and continuous batching | Built for models that fit entirely in VRAM; not designed for consumer RAM/NVMe hybrid offloading |
| **`exllamav2` / `exllamav3`** | Fast single-GPU inference on dense models that fit in VRAM | CUDA-focused; great when the entire model lives on the card |
| **`mlx`** | Apple Silicon Macs | Native unified-memory framework on macOS; worth benchmarking alongside `llama.cpp` Metal |
{% endwide %}

### 5.4 Backends Within `llama.cpp`

{% wide %}
| Backend | CMake build flag | Best for |
| --- | --- | --- |
| **CUDA** | `-DGGML_CUDA=ON` | NVIDIA GPUs; highest performance and broadest kernel coverage |
| **HIP / ROCm** | `-DGGML_HIP=ON` | AMD GPUs via the ROCm stack |
| **Vulkan** | `-DGGML_VULKAN=ON` | Cross-vendor GPU fallback (AMD, Intel Arc, and NVIDIA) |
| **Metal** | *(enabled by default on macOS)* | Apple Silicon unified memory |
| **SYCL** | `-DGGML_SYCL=ON` | Intel Arc, Data Center Max, and integrated GPUs |
| **CPU-only** | *(no GPU flag)* | Pure CPU execution, debugging, or small models |
| **RPC** | `-DGGML_RPC=ON` | Experimental distributed multi-node inference |
{% endwide %}

{% callout "note", "CUDA-first perspective" %}
This guide assumes a CUDA build on Linux. Where behavior differs on Vulkan or CPU-only builds, I've marked it with `[Vulkan]` or `[CPU]`. You can also compile multiple backends as runtime plugins with `-DGGML_BACKEND_DL=ON`, though for a single NVIDIA box I prefer a static CUDA build with fewer moving parts.
{% endcallout %}

## 6. Hardware

### 6.1 The Memory Hierarchy: The Most Important Mental Model

Autoregressive token generation is limited by how fast the runtime can stream active weights through the memory hierarchy. Here's what the bandwidth cliff looks like across a workstation:

```text
GPU VRAM (on-die GDDR6X / GDDR7)    ~500–1,000+ GB/s   (RTX 4070: 504 GB/s)
Apple Silicon Unified Memory        ~200–800 GB/s      (M-series Pro / Max / Ultra)
System RAM (dual-channel DDR5)       ~60–95 GB/s       (DDR5-5800/6000: ~90 GB/s theoretical)
PCIe 4.0 x16 interconnect            ~25–32 GB/s       (host-to-device transfer ceiling)
NVMe Gen4 SSD (via OS mmap)           ~5–7 GB/s        (viable ONLY for sparse KB-per-token lookups)
SATA SSD / HDD                      ~0.5–3 GB/s        (unusable for active inference traffic)
```

How an architecture maps onto those tiers shapes your entire tuning strategy:

| Architecture class | Active memory tiers | How weights are placed |
| --- | --- | --- |
| **Dense models** (e.g. [Qwen3.8-27B](/blog/local-inference/running-qwen3-8-27b-locally/)) | **1-tier (VRAM)** | Every token reads all weights. Must fit in VRAM for full speed; spilling to RAM causes a steep decode drop. |
| **Standard MoE** (e.g. [Qwen3.6-35B-A3B](/blog/local-inference/running-qwen3-6-35b-a3b-locally/), [gpt-oss-120b](/blog/local-inference/optimizing-gpt-oss-120b-local-inference/)) | **2-tier (VRAM + DDR5 RAM)** | Attention and shared weights stay in VRAM; sparse routed experts stream from dual-channel system RAM. |
| **MoE + Per-Layer Embeddings** (e.g. [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/)) | **3-tier (VRAM + DDR5 RAM + NVMe SSD)** | Attention, KV cache, and hot experts live in VRAM; remaining routed experts live in DDR5 RAM; the giant PLE lookup table streams from NVMe via mmap (~5 KB/token). |

Why does a 3-tier layout work for PLE models when SSD offloading normally ruins LLM speed? Because the Per-Layer Embedding table (`per_layer_token_embd.weight`) is a sparse n-gram lookup table rather than a dense matrix multiply. Each token only faults in its own row (a few kilobytes of data), which an NVMe SSD serves in microseconds while leaving system RAM completely free for active MoE experts.

{% callout "warning", "Check your RAM clock before touching a single flag" %}
When my system RAM silently reset from its XMP profile to the base JEDEC clock, MoE token generation dropped to roughly one-third of normal speed. Don't read that recovery as a normal XMP overclock uplift; read it as fixing a hardware fault condition before wasting hours chasing llama.cpp flags.
{% endcallout %}

Verify that your RAM is running at its rated speed right now:

```bash
sudo dmidecode -t memory | grep -E "Speed|Configured"
# "Configured Memory Speed" must match your XMP/EXPO profile speed.
# If it doesn't, enable XMP/EXPO in BIOS.
```

### 6.2 GPU and VRAM Sizing

VRAM is your primary inference resource. Every megabyte you save on desktop overhead or KV caches translates into more layers or more hot experts living on the GPU.

| VRAM tier | Dense model sweet spot | Hybrid MoE / 3-tier sweet spot |
| --- | --- | --- |
| **8 GB** | 7B–14B Q4 | 30B–35B MoE (e.g. Qwen3.6-35B-A3B) with RAM offload |
| **12 GB** | 14B–27B Q4 / IQ4 (e.g. Qwen3.8-27B at 262k ctx) | 80B–176B MoE (gpt-oss-120b, Qwen3.8-Flash-Next) with 32–64 GB DDR5 |
| **24 GB** | 32B–34B Q4/Q5; 27B Q6/Q8 | 120B–176B MoE with high GPU expert residency |
| **48 GB+** | 70B Q4/Q5; 32B FP16 | Most mid-size MoEs partially or fully on GPU |
| **80 GB+** | 70B–120B Q8/FP16 | Full-VRAM serving without host RAM offload |

If your desktop CPU has integrated graphics, route your monitor through the motherboard video output instead of the discrete NVIDIA card. Moving desktop composition off the discrete GPU frees half a gigabyte to a full gigabyte of VRAM, which is enough to hold an extra layer or widen your dynamic expert cache.

### 6.3 CPU Architecture & P-Core Pinning

For dense models that sit entirely in VRAM, the CPU is nearly idle during decode.

For hybrid MoE runs, CPU-resident experts make the processor and memory bus a direct decode bottleneck. On Intel hybrid CPUs, P-cores and E-cores have very different matrix throughput. Including E-cores in the thread pool dragged my token generation down by 20–30%, so I always pin inference to P-cores only:

```bash
taskset -c 0-11 llama-server ...   # i5-12600K: cores 0-11 are P-cores
```

Set `--threads` to your P-core thread count minus a thread or two for the OS, then confirm with a quick sweep.

### 6.4 How Throughput Feels in Daily Use

| Decode speed (TG) | What it feels like in practice |
| --- | --- |
| **< 5 tok/s** | Painful; barely usable |
| **5–10 tok/s** | Functional for short chats (~7 tok/s is human reading speed) |
| **10–25 tok/s** | Comfortable for interactive chat |
| **25–50 tok/s** | Fast; coding agents feel snappy |
| **50–100+ tok/s** | Near-instant; long `<think>` traces and multi-file edits fly by |

For coding agents, don't read this table in isolation. Cold time to first token and repeated prefill can still dominate the session if your prompt cache isn't hitting.

## 7. OS Choice & Kernel Tuning

### 7.1 Linux

Linux exposes the CPU, memory, and service controls that matter most for hybrid inference.

- In my comparisons on this exact machine, Linux ran 15–20% faster than Windows thanks to leaner driver overhead and better scheduling under sustained load.
- You get direct access to the CPU governor, hardware P-states, huge pages, `taskset`, and headless targets.
- Pick a distribution with a current GPU stack. My node runs CachyOS; Arch, Ubuntu, and Debian are great choices too.

### 7.2 Windows

Windows works well and CUDA support is solid, provided you fix two default power settings:

- Set the Windows power plan to High Performance or Ultimate Performance. The default Balanced plan throttles the CPU between token barriers.
- In NVIDIA Control Panel under Power management mode, select Prefer maximum performance.
- WSL2 runs close to native CUDA speed, though virtualization takes a slice of RAM and VRAM. If dual-booting isn't an option, WSL2 is fine as long as you aren't scraping the memory ceiling.

### 7.3 macOS (Apple Silicon)

macOS runs a completely different stack where CUDA flags don't apply:

- The Metal backend activates automatically in llama.cpp.
- Because the CPU and GPU share unified physical memory, a high-memory Mac can hold large dense or MoE models without crossing a PCIe bus.
- Memory bandwidth on Max and Ultra chips is competitive with mid-range discrete GPUs for the models they can hold.
- Evaluate Apple's native mlx framework alongside llama.cpp for Metal workloads.

### 7.4 Linux OS Tuning

These settings fixed measurable regressions on my workstation. Apply them one at a time and verify against your baseline.

#### CPU Governor and the `power-profiles-daemon` Trap

```bash
# Must be "performance" on all cores
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# EPP must also be "performance" - governor alone is not enough on intel_pstate
cat /sys/devices/system/cpu/cpu0/cpufreq/energy_performance_preference

# Verify actual P-core frequency near max boost
grep "cpu MHz" /proc/cpuinfo | sort -rn | head -6
```

KDE and GNOME ship with power-profiles-daemon, which can leave Intel hardware P-states (HWP) in a degraded mode on some boots. What makes this trap so insidious is that every standard sysfs check (scaling_governor, energy_performance_preference, and cpuinfo) still reports performance mode, yet token generation runs 20–30% slower and varies from one reboot to the next. The throttling happens at the hardware MSR level where standard sysfs checks don't look.

Replacing power-profiles-daemon with `tuned-ppd` made my throughput rock-solid across reboots:

```bash
# Arch / CachyOS
sudo pacman -S tuned-ppd       # removes power-profiles-daemon automatically
sudo systemctl enable --now tuned
sudo tuned-adm profile throughput-performance

# Ubuntu / Debian
sudo apt install tuned
sudo systemctl enable --now tuned
sudo tuned-adm profile throughput-performance
```

#### Transparent Huge Pages (THP) and the Pinned-Memory Caveat

Enabling system-wide Transparent Huge Pages cuts TLB misses when the CPU scans large offloaded MoE expert tables:

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
# Recommended on this node: [always]
echo always | sudo tee /sys/kernel/mm/transparent_hugepage/enabled
```

{% callout "warning", "Do not force MADV_HUGEPAGE on giant pinned CUDA arenas" %}
While standard kernel THP is safe and helpful, watch out for runtimes or patches that explicitly call `madvise(MADV_HUGEPAGE)` on massive pinned CUDA memory pools. When I tested explicit huge-page advice on Strata's pinned expert arena on a 64 GB host, forcing contiguous huge-page compaction alongside pinned DMA buffers and an NVMe-mapped PLE file triggered a hard kernel crash under memory pressure. Stick to standard kernel THP (`[always]`), which backs allocations with huge pages when contiguous space is free and falls back cleanly when RAM gets tight.
{% endcallout %}

#### Headless Mode

```bash
# Stop desktop compositor - frees desktop RAM + compositor VRAM
sudo systemctl isolate multi-user.target
sudo sync && sudo sh -c "echo 3 > /proc/sys/vm/drop_caches"

# Restore when done
sudo systemctl isolate graphical.target
```

Without a display server, run zellij or tmux in any TTY to get split panes without X11 or Wayland overhead.

## 8. Why `llama.cpp`, and How to Build It

### 8.1 Why Not Ollama?

Ollama uses llama.cpp internally, but it deliberately exposes a small, fixed-default configuration surface. Nearly every knob in §10 through §20 of this guide (layer placement regexes, asymmetric KV cache quantization, `--fit-target` headroom, separate target/draft KV precision for MTP, and external PLE mounts) is unexposed in Ollama.

Ollama is great for quick setup. If you're reading this guide, you've outgrown it. Run `llama-server` directly and front it with llama-swap if you still want automatic model lifecycle management.

### 8.2 Building from Source

Always build from source when tuning. Distro packages lag behind upstream and aren't compiled for your exact GPU architecture, while MoE and linear-attention kernel performance improves regularly on master. Keep your previous binary around when rebuilding so you can A/B test commits cleanly.

**CUDA build (NVIDIA):**

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
mkdir build && cd build

cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DGGML_CUDA=ON \
  -DLLAMA_CURL=ON \
  -DGGML_NATIVE=ON \
  -DGGML_LTO=ON \
  -DGGML_CUDA_GRAPHS=ON \
  -DGGML_CUDA_FA=ON \
  -DGGML_CUDA_FA_ALL_QUANTS=ON \
  -DCMAKE_CUDA_ARCHITECTURES=89
# 89 = Ada / RTX 40-series. Check NVIDIA's compute capability table for your card.

cmake --build . --config Release \
  --target llama-server llama-bench llama-fit-params llama-cli --parallel
```

`CMAKE_CUDA_ARCHITECTURES=89` matches my RTX 4070. Don't cargo-cult that number; check NVIDIA's [compute capability table](https://developer.nvidia.com/cuda/gpus) for your card. If you have mixed cards, pass a semicolon list like `"86;89"`. If you're building a portable binary to copy between machines, turn `GGML_NATIVE` off:

```bash
# Portable CUDA build: larger binary, less tuned to one exact box
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DGGML_CUDA=ON \
  -DGGML_NATIVE=OFF
```

**Vulkan build (AMD, Intel GPU):**

```bash
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DGGML_VULKAN=ON \
  -DLLAMA_CURL=ON \
  -DGGML_NATIVE=ON
```

**ROCm / HIP build (AMD GPU):**

```bash
HIPCXX="$(hipconfig -l)/clang" HIP_PATH="$(hipconfig -R)" \
cmake .. \
  -DGGML_HIP=ON \
  -DCMAKE_BUILD_TYPE=Release

cmake --build . --config Release --parallel
```

Set `GPU_TARGETS` if the build system guesses wrong or you're compiling for a different AMD GPU (for example, `gfx1100` for RDNA3 desktop cards).

**Dynamic backend build:**

```bash
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DGGML_BACKEND_DL=ON \
  -DGGML_CUDA=ON \
  -DGGML_VULKAN=ON
```

This lets backends load as shared libraries at runtime, which is handy for packaged builds across mixed hardware.

### 8.3 Key Binaries

| Binary | Purpose |
| --- | --- |
| `llama-server` | OpenAI- and Anthropic-compatible HTTP inference server |
| `llama-bench` | Synthetic PP and TG benchmarking |
| `llama-fit-params` | Dry-run VRAM probe that outputs optimal `-ngl` + `-ot` flags |
| `llama-cli` | Interactive CLI prompt for quick smoke tests |
| `llama-sweep-bench` | Sweep across parameters (batch size, layer counts, etc.) |

## 9. Model Selection and Quantization

### 9.1 Dense vs MoE: Choose Your Tuning Strategy

| Dimension | Dense | MoE |
| --- | --- | --- |
| Active params/token | All weights | Small fraction (e.g. 3B–5B of 80B–176B) |
| Must fit in VRAM | Yes, for best performance | No; routed experts can live in RAM |
| Primary tuning lever | Quant level + context | Expert placement / caching + RAM bandwidth |
| TG speed driver | VRAM bandwidth | PCIe / DDR5 bandwidth + GPU expert hit rate |
| Example models | [Qwen3.8-27B](/blog/local-inference/running-qwen3-8-27b-locally/), Gemma 4 12B, Llama 3 | [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/), [Qwen3.6-35B-A3B](/blog/local-inference/running-qwen3-6-35b-a3b-locally/), [Gemma 4 26B](/blog/local-inference/running-gemma-4-26b-a4b-locally/), [gpt-oss-120b](/blog/local-inference/optimizing-gpt-oss-120b-local-inference/) |

### 9.2 Quantization Reference

{% wide %}
| Quant | Size vs FP16 | Quality | Notes |
| --- | --- | --- | --- |
| `Q2_K` | ~25% | Noticeable degradation | Use only under extreme size constraints |
| `IQ3_XXS` / `IQ3_S` / `IQ4_XS` | ~25–35% | Much better than older uniform low-bit quants | Great when shrinking a model across a hard RAM or VRAM boundary |
| `Q4_K_M` | ~35% | Good | Classic size/quality balance when no dynamic or QAT quant exists |
| `Q4_K_XL` / `UD-Q4_K_XL` | ~35–38% | Often better than plain Q4 | Keeps sensitive attention and router tensors at higher precision |
| `Q5_K_M` / `UD-Q5_K_XL` | ~40–43% | Very close to FP16 | Strong default when VRAM and RAM allow |
| `Q6_K` | ~50% | Near-lossless | High-VRAM setups or smaller dense models |
| `Q8_0` | ~65% | Effectively lossless | Ideal for small models and **NVMe-mapped PLE tables** (costs zero VRAM) |
| `FP16` | 100% | Reference | Maximum quality; maximum size |
| `MXFP4` (native) | ~35% | Better than post-training Q4 | Used by `gpt-oss` models trained natively in MXFP4 |
{% endwide %}

Unsloth Dynamic (UD) quants keep sensitive tensors at higher precision and push tolerant tensors lower. My rule of thumb: use the highest quant that fits your fast memory budget while leaving room for a real context window. Drop to Q4 or IQ3/IQ4 when needed, then check KLD and your actual workload.

### 9.3 Quantization-Aware Training (QAT)

Standard Post-Training Quantization (PTQ) rounds weights after the model is already trained. When you drop down to low bit-widths after the fact, rounding noise can hurt multi-step reasoning, formatting, and code constraints.

Quantization-Aware Training (QAT) models that low-precision rounding noise during training or fine-tuning so the weights adapt ahead of time:

- In the [Gemma 4 QAT](/blog/local-inference/running-gemma-4-mtp-locally/) builds I tested, 4-bit QAT behaved much closer to Q8 than ordinary post-training 4-bit quantization.
- A 26B MoE model in Q8 or dynamic Q5 takes roughly 18 GB, spilling heavily to system RAM on a 12 GB card. The QAT Q4 build drops to about 14.2 GB, letting nearly all active layers stay in VRAM for full GPU speed.

{% callout "warning", "Still test low-bit wins on your own workload" %}
QAT, Dynamic GGUF, and imatrix quants are different ways of spending a quality budget. None of them make low-bit files immune to workload-specific regressions.
{% endcallout %}

### 9.4 iMatrix, IQ Quants, and Dynamic GGUFs

Importance-matrix quantization (`imatrix`) calibrates the quantizer against representative text instead of treating every weight channel equally. If a weight matters more for the calibration activations, the quantizer works harder not to damage it. That's why calibration data matters: a WikiText imatrix and a code/chat imatrix don't protect the exact same pathways.

IQ quants are worth paying attention to when you're pushing below the normal Q4/Q5 comfort zone:

- Mainline llama.cpp IQ quants are the easiest to run everywhere.
- ik_llama.cpp IK quants are often where frontier CPU and hybrid MoE quant schemes appear first.
- Unsloth Dynamic GGUFs package per-tensor precision choices into standard GGUFs that run on mainline llama.cpp.

Kawrakow's comparisons are helpful because they explain the families rather than just the filenames. Non-linear formats like IQ4_XS and IQ3_S beat older uniform quants at similar bits per weight, and Unsloth's notes show the same lesson from the packaging side: expert tensors, attention tensors, and linear-attention state tensors don't all tolerate the same compression.

| Situation | What I try first |
| --- | --- |
| Trusted Unsloth Dynamic GGUF exists | Try `UD-Q4_K_XL` / `UD-Q5_K_XL` before a generic community Q4/Q5. |
| Squeezing a dense 27B model ([Qwen3.8-27B](/blog/local-inference/running-qwen3-8-27b-locally/)) into 12 GB | Try `IQ4_XS` or `UD-Q4_K_XL` so there's still room for `q8_0` KV and deep context. |
| Shrinking a giant MoE ([Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/)) to fit 64 GB RAM | Use calibrated `IQ3_S` / `Q3_K_S` for the MoE body + uncompressed `Q8_0` PLE on NVMe. |
| CPU or hybrid CPU/GPU MoE | Check `ik_llama.cpp` results; this is one of its strongest lanes. |
| The model is already QAT or native low-bit | Test the native/QAT path first. Don't stack cleverness for sport. |

The trap to watch for: a quant that wins on WikiText perplexity can still lose on real coding or long-context sessions. A quant only wins in my setup if it survives the context length and tool loops I actually run.

| Question | Why it matters |
| --- | --- |
| What calibration data was used? | Chat/code calibration and Wiki calibration preserve different behavior. |
| Is it dynamic per-layer/per-tensor, uniform, or fork-specific? | Nominal "Q4" files can have very different tensor allocations. |
| Is the quant mainline `llama.cpp` or `ik_llama.cpp`-only? | Runtime compatibility matters. |
| Does the model survive your real context length? | A short chat test says very little about a long coding session. |
| Did `q8_0` or `K8V4` KV still fit? | Weight savings that force an overly aggressive KV quant may be a wash. |
| Did TG drop vs K-quant? | IQ dequantization can trade a bit of speed for size and quality. |

### 9.5 Perplexity, KLD, and Actually Choosing a Quant

File size and decode speed are easy to measure. Quality is where things get muddy.

Perplexity (PPL) is still a good smoke test: if a quant has much worse PPL than another quant of the same size, something went wrong. Still, PPL can hide answer flips because positive and negative token shifts average out.

KL Divergence (KLD) is a sharper compression metric because it compares the quantized model's full next-token probability distribution against the original model on the same prompts, as shown in [*Accuracy is Not All You Need*](https://arxiv.org/abs/2407.09141) and Unsloth's Dynamic GGUF studies. Even when reading top-1 agreement tables, remember that top-1 is argmax-token match, not factual accuracy: when a quant matches the reference token three-quarters of the time, most of the remaining steps are synonyms, formatting choices, or high-entropy branches where the baseline wasn't strongly committed either.

{% image_cc "./src/static/img/diagrams/quant-eval-stack.png", "Diagram showing file size, perplexity, KL divergence, task evals, and workload tests as a quantization evaluation stack", "sketch-draw", "My read: PPL catches obviously damaged quants, KLD catches distribution drift, and the workload still gets the final vote." %}

| Metric | Good for | Failure mode |
| --- | --- | --- |
| File size / BPW | Fit planning | Says nothing about quality. |
| PPL | Quick regression check | Can miss answer flips and calibration overfit. |
| KLD | Distribution drift vs the original model | Depends heavily on eval/calibration data. |
| Task evals | Aider, LiveCodeBench, MMLU, tool calling | Slow and sometimes brittle to templates. |
| My workload | The real serving profile | Annoying to run, but this is the one that matters. |

When I evaluated quants for [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/), I compared an IQ3_XXS build (ISTA-DASLab GSQ-RCO) and an IQ4_XS build against my baseline by KLD and by whether they actually fit fast memory on my node. A larger quant that spills out of RAM loses immediately to a smaller one that fits cleanly; meanwhile IQ4_XS fit, but its KLD was virtually identical to the smaller baseline, so the extra footprint bought nothing.

I don't rank quants by a single number. I shortlist by size, KLD, and maintainer trust, then run the survivors at my real context length.

## 10. Layer Placement & Expert Caching: The Core Optimization for MoE

{% callout "tip", "Running a dense model that fits in VRAM?" %}
Use `-ngl 99` (or let `--fit` handle it) and skip ahead to [§11 (Context and KV Cache)](#11-context-and-kv-cache). Layer placement and expert offloading only apply when a model exceeds your GPU's VRAM.
{% endcallout %}

For hybrid MoE setups, how you divide tensors between VRAM, system RAM, and NVMe SSD is where most of your performance lives. You want attention weights, shared experts, and the KV cache on the GPU first, and then as many hot routed experts in remaining VRAM as will fit.

### 10.1 `--n-gpu-layers` (`-ngl`)

Sets how many transformer blocks load onto the GPU. Start at 99 (all layers) for dense models, or combine with `-ot` or `--fit` on MoE models.

```bash
llama-server -m model.gguf --n-gpu-layers 99    # all on GPU
llama-server -m model.gguf --n-gpu-layers 37    # 37 on GPU, rest on CPU
```

### 10.2 `--n-cpu-moe` (`-ncmoe`)

An integer shorthand that keeps the routed MoE experts of the first *N* layers on the CPU while leaving attention tensors on the GPU:

```bash
--n-cpu-moe 35   # first 35 MoE layer experts on CPU
```

{% callout "warning", "Watch your host RAM ceiling" %}
For a large MoE model, putting all expert layers on the CPU tries to allocate tens of gigabytes in system RAM. If that exceeds your physical memory without swap headroom, it will hard-crash the machine. Always run `llama-fit-params` (§10.4) to find safe values first.
{% endcallout %}

### 10.3 `--override-tensor` (`-ot`): Fine-Grained Placement

Per-tensor, per-layer placement via regular expressions. It gives you the finest manual control in llama.cpp:

```bash
# All expert projections in all layers → CPU:
--override-tensor ".ffn_(up|down|gate)_(ch|)exps=CPU"

# Layers 5+ experts → CPU; keep layers 0-4 fully on GPU:
--override-tensor "blk\.(5|[6-9]|[0-9][0-9]+)\.ffn_(up|down|gate)_(ch|)exps=CPU"

# Keep a Per-Layer Embedding (PLE) table on CPU / NVMe mmap:
--override-tensor "per_layer_token_embd\.weight=CPU"
```

Some models (like Qwen3.5/3.8 and certain gpt-oss variants) have two expert tensor families: routed experts (`ffn_{up,down,gate}_exps`) and an always-active shared expert (`ffn_{up,down,gate}_shexp`). A pattern matching only `_exps` leaves the shared expert on the GPU. When you have the VRAM headroom, keeping the shared expert on CUDA is faster because it runs on every token; when VRAM is tight, `(ch|)exps` catches both families so you don't hit CUDA OOM.

### 10.4 `--fit`: Automatic Placement

Current llama.cpp builds enable `--fit` by default whenever explicit layer-split or tensor-override flags aren't supplied. It probes free VRAM at startup and computes `-ngl` and `-ot` placement automatically while accounting for the KV cache and multimodal projector. I still write `--fit on` in my scripts so the intent is obvious:

```bash
llama-server \
  -m model.gguf \
  --fit on \
  --fit-ctx 65536 \
  --fit-target 512
```

CUDA's VMM pool grows as context fills. In my testing, a tiny headroom target survived short benchmarks and then crashed later in a long coding session, so my persistent text profiles leave at least 512 MiB of headroom (and vision profiles leave 2048 MiB).

To get a deterministic command without running the startup probe every time, do a dry run with `llama-fit-params`:

```bash
llama-fit-params \
  -m /path/to/model.gguf \
  -fitt 512 \
  -fitc 65536
# Outputs deterministic -c, -ngl, and -ot flags to paste into your launch script
```

### 10.5 Static Placement vs Dynamic Per-Expert Caching

{% wide %}
| Placement approach | `--fit on` (Startup Probe) | Hardcoded `-ngl` + `-ot` / `-ncmoe` | Dynamic Per-Expert Cache ([Strata](/blog/local-inference/strata-on-an-rtx-4070/)) |
| --- | --- | --- | --- |
| **Granularity** | Whole layers / tensor families | Whole layers / tensor families | Individual hot experts across all layers |
| **Startup** | Small probe delay | Instant | Fast (supports `--expert-profile` pre-load) |
| **Qwen3.8-Flash-Next GPU residency** | ~13 of 48 expert layers (27%) | 13 of 48 expert layers (6,656 fixed experts) | **3,086 hottest experts across all 48 layers (~74–75% lookup hit rate)** |
| **DDR5 traffic per token** | ~770 MB/token | ~770 MB/token | **< 230 MB/token** |
| **Sustained decode (128k ctx)** | ~19–21 tok/s | 27.1 tok/s (with MTP) | **74.8 tok/s** (with native MTP + `Q8_0` PLE) |
{% endwide %}

Why does static layer placement hit a ceiling on giant MoEs like [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/)? Because when you offload by whole layers (`-ncmoe 35`), the layers that fit in VRAM keep all 512 of their experts on the GPU (even the cold ones that never fire), while the remaining three-quarters of layers keep *every* expert in system RAM. On every single token, three-quarters of the model's expert lookups miss VRAM completely.

Real MoE routing is heavily skewed: across all layers, a small fraction of experts fires constantly for code and common syntax while hundreds of niche experts sit idle. **Dynamic per-expert caching** (used in [Strata](/blog/local-inference/strata-on-an-rtx-4070/) via `--expert-cache auto` and saved across restarts with `--expert-profile`) turns remaining VRAM into a frequency-tracked cache that holds the hottest individual experts across every layer in the model. Even though the cache only holds about one-eighth of the total experts, routing skew means those cached experts satisfy roughly three-quarters of all per-token expert lookups right inside GDDR6X VRAM, cutting DDR5 traffic by nearly two-thirds.

{% callout "note", "The host RAM caveat for dynamic expert caching" %}
Because dynamic per-expert caching streams cache misses to the GPU over asynchronous DMA (`cudaMemcpyAsync`), the full routed-expert arena has to live in page-locked (pinned) host RAM (`cudaHostAlloc`) rather than movable OS page cache. On my 64 GB workstation, Strata holds ~52.5 GB of resident host RAM, which fits comfortably on 64 GB DDR5 but won't fit on a 32 GB box.
{% endcallout %}

## 11. Context, Linear Attention, and KV Cache

### 11.1 `--ctx-size`: Choosing Context Length & Hybrid Linear Attention

On standard full-attention transformers, the KV cache grows linearly with context length and lives entirely in VRAM. Allocating a huge context window on my card steals VRAM directly from model layers and cached experts.

Approximate KV cache VRAM usage on a standard full-attention model:

| Context window | `f16` KV cache | `q8_0` KV cache | `K8V4` (`q8_0` / `q4_0`) |
| --- | --- | --- | --- |
| **8k** | ~0.5 GB | ~0.25 GB | ~0.18 GB |
| **32k** | ~2.0 GB | ~1.0 GB | ~0.75 GB |
| **64k** | ~4.0 GB | ~2.0 GB | ~1.5 GB |
| **128k** | ~8.0 GB | ~4.0 GB | ~3.0 GB |

Newer hybrid linear-attention architectures like [Qwen3.8-27B](/blog/local-inference/running-qwen3-8-27b-locally/), [Qwen3.6-35B-A3B](/blog/local-inference/running-qwen3-6-35b-a3b-locally/), and [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/) change that math completely by interleaving Gated-DeltaNet (linear attention) layers with standard full-attention layers in a three-to-one ratio. Only a quarter of the model's layers allocate a growing per-token KV cache, while the other three-quarters maintain a compact, fixed-size recurrent state regardless of how long the prompt gets.

That architectural shift cuts KV cache memory by three-quarters compared to a classic transformer. On my card, [Qwen3.8-27B](/blog/local-inference/running-qwen3-8-27b-locally/) holds its full native context window in VRAM with 8-bit KV while sustaining fast interactive decode:

| Architecture | Full-attention layers | Max context on 12 GB VRAM (`q8_0` / `K8V4` KV) | Sustained decode on RTX 4070 |
| --- | --- | --- | --- |
| **Classic full-attention transformer** | 100% of layers | 32k - 64k before evicting layers | Drops as layers spill to RAM |
| **[Qwen3.8-27B](/blog/local-inference/running-qwen3-8-27b-locally/) (Gated-DeltaNet 3:1)** | 16 of 64 layers (25%) | **262,144 tokens (262k)** (`q8_0` KV) | **36.7 tok/s** |
| **[Qwen3.8-Flash-Next](/blog/local-inference/strata-on-an-rtx-4070/) (Gated-DeltaNet 3:1)** | 12 of 48 layers (25%) | **131,072 tokens (128k)** (`K8V4` KV) | **74.8 tok/s** (with Strata + MTP) |

### 11.2 KV Cache Quantization (`-ctk`, `-ctv`) [CUDA]

Quantizing the KV cache cuts its VRAM footprint in half with symmetric 8-bit (`q8_0`), or by nearly two-thirds with asymmetric K8V4:

```bash
# Symmetric 8-bit KV cache (my standard text baseline):
-ctk q8_0 -ctv q8_0

# Asymmetric K8V4 cache (fits 128k context alongside cached MoE experts on 12 GB VRAM):
-ctk q8_0 -ctv q4_0
```

{% wide %}
| KV configuration | VRAM vs `f16` | Quality impact | When to use it |
| --- | --- | --- | --- |
| `f16` / `f16` | 1.0x | Reference | Validating a new model or sensitive MTP target caches (e.g. Gemma 4) |
| **`q8_0` / `q8_0`** | **~0.5x** | **Virtually indistinguishable from `f16`** | **Default recommendation for text and coding servers** |
| **`q8_0` / `q4_0` (`K8V4`)** | **~0.37x** | **Preserves key addressing while compressing values** | **Fitting 128k context on 12 GB VRAM ([Qwen3.8-Flash-Next](/blog/local-inference/strata-on-an-rtx-4070/))** |
| `q4_0` / `q4_0` | ~0.33x | Noticeable needle-retrieval drift at long context | Emergency VRAM relief only |
{% endwide %}

Quantizing the KV cache has a compounding effect on hybrid models: freeing two gigabytes of KV memory lets `--fit` keep one or two more transformer blocks (or hundreds of additional hot MoE experts) on the GPU, which directly increases decode speed. On [Qwen3-Coder-Next](/blog/local-inference/optimizing-qwen3-coder-next-local-inference/), switching to 8-bit KV at 64k unlocked two extra GPU layers and added two tokens per second to decode.

Why does asymmetric K8V4 work so well? Attention Keys determine *where* the head attends across a long window and are much more sensitive to rounding error than Values, which get averaged together after softmax. Keeping Keys at 8-bit and dropping Values to 4-bit (`-ctk q8_0 -ctv q4_0` in llama.cpp, or `--kv k8v4` in Strata) freed the exact VRAM margin I needed to hold a full 128k context window alongside my cached GPU experts.

{% callout "note", "Always benchmark KV quantization at your real context length" %}
At a synthetic short benchmark prompt, the KV cache is tiny and the VRAM difference between full precision and quantized KV is invisible. I always test at my real working context size so the true memory footprint shows up.
{% endcallout %}

### 11.3 `--parallel`: Concurrent Inference Slots

The server divides or duplicates KV allocation across `--parallel` slots. Setting four parallel slots multiplies your KV cache VRAM requirement by four:

```bash
--parallel 1   # single-user workstation: gives 100% of KV VRAM to one deep context slot
```

On [gpt-oss-120b](/blog/local-inference/optimizing-gpt-oss-120b-local-inference/), dropping from four parallel slots down to `--parallel 1` reclaimed over half a gigabyte of VRAM, which was enough to fit one more layer on the GPU and pick up an extra token per second.

### 11.4 Flash Attention (`--flash-attn` / `-fa`)

Flash Attention fuses the attention pass in SRAM and avoids materializing the quadratic attention matrix in VRAM, which is essential for long context windows and required by several quantized KV cache kernels:

```bash
--flash-attn on
```

Current llama.cpp defaults to `--flash-attn auto`. On CUDA builds compiled with `-DGGML_CUDA_FA_ALL_QUANTS=ON`, I explicitly pass `--flash-attn on`. On Vulkan or unfamiliar drivers, leave it on `auto` until you've verified stability.

## 12. Batch Sizes

### 12.1 `--batch-size` (`-b`): Logical Prefill Batch

Controls how many prompt tokens can be queued into a single logical prefill pass. Larger values improve prompt processing throughput at the cost of higher scratch buffer VRAM:

```bash
--batch-size 2048   # current upstream default; fast prefill when VRAM allows
--batch-size 1024   # balanced default on my 12 GB text profiles
--batch-size 256    # conservative peak VRAM for 12 GB vision servers
```

If your server loads cleanly but crashes with a CUDA OOM the moment you paste a large file, lower `--batch-size` and `--ubatch-size` first.

### 12.2 `--ubatch-size` (`-ub`): Physical Micro-Batch

While `--batch-size` sets the logical prefill chunk, `--ubatch-size` controls how many tokens the GPU actually crunches in one physical kernel pass (and must not exceed `--batch-size`):

```bash
--ubatch-size 512   # standard baseline
```

Don't treat the default micro-batch size as a sacred constant. Larger micro-batches improve prefill compute utilization on dense and GPU-resident layers, while smaller micro-batches cap peak scratch buffer allocation during prefill. I run a quick four-point sweep on the prompt size I actually serve:

```bash
for ub in 128 256 512 1024; do
  ./build/bin/llama-bench \
    -m /models/model.gguf \
    -p 2048 -n 128 \
    -b 1024 -ub "$ub" \
    -ngl 99 \
    -ctk q8_0 -ctv q8_0 \
    -fa on
done
```

I always re-verify the top two contenders inside `llama-server` under my real context window.

{% callout "warning", "Vision assertion trap: keep --ubatch-size >= 512" %}
A single high-resolution image tokenizes into several hundred vision patches that can't be split across micro-batches. If `--ubatch-size` is smaller than the image's token count, `llama-server` aborts with an assertion failure on the first image request. On my vision profiles, pairing a smaller logical batch with `--ubatch-size 512` keeps peak memory down while giving image patches enough room.
{% endcallout %}

## 13. Sampling Parameters & The Thinking Mode Trap

Sampling parameters reshape the logit distribution at every decode step. Always start from the model author's published generation config before inventing your own.

### 13.1 `--temp`: Greedy Decoding vs Thinking Mode Sampling

- Unwarped temperature (`--temp 1.0`) is the standard for modern reasoning and instruct models, applying no temperature warping to the raw distribution and relying on top-p, top-k, and min-p to trim the tail.
- Moderate temperature (0.6 to 0.7) is common for older non-reasoning chat and instruct checkpoints.
- Greedy argmax (`--temp 0.0`) picks the single highest-probability token at every step.

{% callout "warning", "Why greedy decoding (temp = 0) breaks reasoning models and distorts MTP benchmarks" %}
Older tuning guides (including earlier versions of this post) recommended greedy decoding for coding agents to maximize determinism. On modern reasoning models that emit long `<think>...</think>` chains (such as Qwen3.6, Qwen3.8, and Gemma 4), greedy decoding is an anti-pattern for two reasons:

1. Repetition loops inside thinking blocks: when a reasoning model hits an ambiguous step during a long chain of thought, zero temperature forces it down the exact same argmax branch every time, frequently locking the model into an infinite repetition loop until it exhausts its token budget.
2. Artificially inflated MTP acceptance: under greedy decoding, verification is a trivial argmax equality check. Under stochastic sampling (`--temp 1.0`), verification uses rejection sampling, which rejects more drafts when logits are flat. On [Strata](/blog/local-inference/strata-on-an-rtx-4070/), switching from greedy decoding to official Thinking Mode cost less than five percent in real decode speed while completely eliminating thinking-block repetition loops. Once paired with an uncompressed 8-bit PLE table, Thinking Mode acceptance climbed right back above 78%.
{% endcallout %}

Here is how greedy decoding and official Thinking Mode compare on [Strata](/blog/local-inference/strata-on-an-rtx-4070/) with Qwen3.8-Flash-Next:

| Sampling mode & PLE precision | MTP draft acceptance | Sustained decode | Reasoning behavior |
| --- | ---: | ---: | --- |
| Greedy (`temp 0.0`) + 4-bit `IQ4_NL` PLE | 68.9% | 57.3 tok/s | Prone to `<think>` repetition loops |
| Thinking Mode (`temp 1.0, top-p 0.95, top-k 20`) + 4-bit `IQ4_NL` PLE | 55.7% | 54.5 - 56.8 tok/s | Clean reasoning chains, no loops |
| **Thinking Mode (`temp 1.0, top-p 0.95, top-k 20`) + 8-bit `Q8_0` PLE** | **78.2%** | **74.8 tok/s** | **Clean reasoning + maximum MTP speedup** |

Even better, I pass my model's official sampling parameters at server startup (`--temp 1.0 --top-p 0.95 --top-k 20`) rather than relying on every editor plugin or CLI client to remember them. That way, any client that omits sampling fields in its JSON request inherits the safe Thinking Mode defaults automatically.

### 13.2 `--top-k`: Vocabulary Truncation

Truncates the candidate pool to the highest-probability tokens before nucleus sampling:

- A tight pool (20 to 64) is standard for the Qwen and Gemma families, and also speeds up CPU-side sampling by avoiding a full-vocabulary sort over 150k+ tokens.
- A wider cap (100) works well as a safe performance cap for models whose cards specify 0 (I confirmed zero quality loss on gpt-oss-120b).
- Setting 0 keeps the full vocabulary (slowest to sample).

### 13.3 `--top-p`: Nucleus Sampling

Keeps the smallest set of tokens whose cumulative probability exceeds the threshold (applied after top-k):

- 0.95 is the standard sweet spot for Qwen and Gemma coding and reasoning.
- 1.0 disables nucleus truncation (used by gpt-oss-120b and Sarvam when paired with top-k).

### 13.4 `--min-p`

Drops any token whose probability falls below `min_p * max_token_probability`, scaling dynamically with how confident the model is at the current step:

- 0.0 turns it off (the default for Qwen3.8 Thinking Mode and Gemma 4).
- 0.01 to 0.05 provides a light dynamic floor that's useful on non-thinking code models (Qwen3-Coder-Next).

### 13.5 `--repeat-penalty` and `--presence-penalty`

- `--repeat-penalty 1.0` (disabled) is strongly recommended for code. Code naturally repeats variable names, struct fields, and indentation; multiplicative repeat penalties actively damage syntax and induce bugs.
- `--presence-penalty 1.5` is recommended by Qwen's model card for Thinking Mode (when supported by the runtime) to gently discourage circular reasoning inside long thinking blocks without corrupting code syntax.

### Recommended Defaults by Model Family

{% wide %}
| Model family | `temp` | `top-k` | `top-p` | `min-p` | `repeat-penalty` | `presence-penalty` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Qwen3.8 (Thinking Mode)** | `1.0` | `20` | `0.95` | `0.0` | `1.0` | `1.5` |
| **Qwen3 / Qwen3-Coder** | `1.0` | `40` | `0.95` | `0.01` | `1.0` | `0.0` |
| **Gemma 4 (26B / 12B)** | `1.0` | `64` | `0.95` | `0.0` | `1.0` | `0.0` |
| **gpt-oss-120b** | `1.0` | `100` | `1.0` | `0.0` | `1.0` | `0.0` |
| **Sarvam** | `1.0` | `20` | `1.0` | `0.0` | `1.0` | `0.0` |
{% endwide %}

## 14. Threading and CPU Control

### 14.1 `--threads` (`-t`)

Sets the CPU thread count used during token generation (which executes CPU-offloaded MoE experts):

```bash
--threads 10   # P-core logical thread count minus 1-2 threads for OS/driver headroom
```

Spawning more decode threads than you have P-core threads hurts throughput: the extra threads fight over the same dual-channel DDR5 memory bus and force straggler barriers onto E-cores.

### 14.2 `--threads-batch` (`-tb`)

Sets the CPU thread count for prompt processing (prefill). Because prefill is a compute-heavy burst, you can safely set this to your full P-core thread count:

```bash
--threads-batch 12
```

### 14.3 `taskset`: P-Core Pinning [Linux]

The single most reliable way to keep the server off Intel E-cores on hybrid desktop CPUs:

```bash
taskset -c 0-11 llama-server ...   # pin all worker threads to P-cores (cores 0-11 on i5-12600K)
```

Check your exact P-core topology with `lscpu -e` or `lstopo`. On my i5-12600K, logical CPUs 0-11 are the six hyperthreaded P-cores and 12-15 are the four single-threaded E-cores.

### 14.4 `--poll`

Controls how aggressively CPU worker threads busy-spin (0 = sleep/yield, 100 = continuous spin) while waiting for GPU kernels. Across multiple sweeps on hybrid CPU+GPU inference, `--poll` made zero measurable difference because PCIe transfers and kernel execution dominate synchronization. I leave it at the default or drop it to 0 so my CPU idles coolly between requests.

### 14.5 `--numa`

Configures NUMA memory policy (distribute, isolate, or numactl). Skip this on single-socket desktops. Consumer boards only have one NUMA node, so enabling `--numa` adds overhead for zero gain. It only matters on multi-socket EPYC or Xeon servers with split memory controllers.

## 15. Host Memory, `mmap`, and Per-Layer Embeddings (PLE)

### 15.1 `--no-mmap` and the Critical PLE Exception

By default, llama.cpp maps GGUF files into virtual memory with `mmap()` so the Linux kernel pages weights in from disk on demand. On a standard hybrid MoE where all weights fit inside VRAM plus system RAM, cold page faults during the first few minutes of random expert routing cause noticeable decode stutter. Passing `--no-mmap` reads the entire GGUF into RAM upfront at startup, eliminating page-fault jitter:

```bash
--no-mmap   # good for standard MoEs that fit entirely in VRAM + RAM
```

{% callout "warning", "Exception: NEVER use --no-mmap or --mlock on models with Per-Layer Embeddings (PLE)" %}
Architectures like [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/) carry a massive Per-Layer Embedding (PLE) lookup table (`per_layer_token_embd.weight`) alongside the routed MoE body.

During decode, each token only looks up its own row in that PLE table, reading roughly five kilobytes per token out of the multi-dozen-gigabyte tensor. If you leave memory-mapping enabled and pin the tensor to the CPU (`-ot "per_layer_token_embd\.weight=CPU"` in llama.cpp, or `--ple-gguf` in Strata), the Linux kernel leaves the cold 99.99% of the PLE table on your NVMe SSD and faults in those tiny slices in microseconds while keeping all active MoE experts resident in your DDR5 RAM.

If you pass `--no-mmap` or `--mlock` on a 64 GB machine, you force the MoE body and the full PLE table into physical RAM at once, evicting hot MoE experts and thrashing your SSD at tens of megabytes per token. The golden rule for three-tier inference is simple: non-PLE weights must fit inside fast memory (VRAM + RAM), while the PLE table stays on NVMe via `mmap`.
{% endcallout %}

Because the external PLE file (`--ple-gguf` in [Strata](/blog/local-inference/strata-on-an-rtx-4070/)) streams directly from NVMe via memory-mapping and uses zero GPU VRAM and almost zero resident host RAM, compressing the PLE table to 4-bit saves nothing except SSD disk space. Worse, 4-bit rounding noise in those per-layer embeddings cascades across every layer and knocks the target model's logits out of alignment with the MTP draft head.

Here is what happened on my RTX 4070 when I replaced the 4-bit PLE file with an uncompressed 8-bit PLE file on NVMe using the exact same model body:

| PLE file on NVMe (`--ple-gguf`) | Disk size | GPU VRAM used | MTP acceptance (`temp 1.0`) | Sustained decode (128k ctx) |
| --- | ---: | ---: | ---: | ---: |
| 4-bit `IQ4_NL` PLE | 28.8 GB | 11,298 MiB | 55.7% | 56.8 tok/s |
| **8-bit `Q8_0` PLE (uncompressed)** | **54.4 GB** | **11,298 MiB (+0 MiB)** | **78.2% (+22.5 pts)** | **74.8 tok/s (+31.7%)** |

If your NVMe drive has the free disk space, always serve the PLE table in `Q8_0`.

### 15.2 `--mlock`

Locks model pages in physical RAM so the Linux kernel can't swap them out to ZRAM or disk when background processes allocate memory:

```bash
--mlock   # use only when non-PLE model weights fit comfortably inside physical RAM
```

It's helpful on distributions that ship aggressive ZRAM defaults, provided your model fits in RAM with room to spare and doesn't include a giant NVMe-streamed PLE table.

## 16. Process Priority, Warmup, and Model Routing (`llama-swap`)

### 16.1 `--prio`

Raises the OS scheduling priority of inference worker threads:

```bash
--prio 2   # high scheduling priority; keeps desktop background tasks from preempting decode
```

### 16.2 `--no-warmup`

Skips the dummy warmup pass at server boot and compiles or warms kernels on the first real request instead. It's useful when I'm iterating quickly on server flags; for persistent production profiles (especially vision servers), I let warmup run at startup so the first user request doesn't stall.

### 16.3 Running Multiple Engines Behind One Port with `llama-swap`

On a single-GPU workstation, you can only keep one large model in VRAM at a time, and you'll often want to mix `llama-server` profiles with custom engines like Strata. [llama-swap](https://github.com/mostlygeek/llama-swap) sits in front of all of them on a single OpenAI-compatible port and swaps processes on demand based on the model name in the API request:

- Automatic cartridge swapping: requesting my Qwen3.8-Flash-Next profile stops whatever server was loaded, launches Strata with its dynamic expert cache and 8-bit PLE flags, and proxies the request. Requesting Qwen3.8-27B or Gemma 4 26B swaps cleanly back to `llama-server`.
- Idle TTL unload (`globalTTL: 600`): automatically stops the active engine after ten idle minutes, returning VRAM and pinned host RAM to the OS.
- Zero-downtime config reload: send `kill -HUP $(pgrep '[l]lama-swap')` after editing your config file to reload model definitions without dropping active streams.
- Stop before manual VRAM sweeps: run `systemctl --user stop llama-swap.service` before running `llama-bench` or `--fit` probes so a background request doesn't spawn a server mid-benchmark.
- Smoke-testing reasoning models: always give reasoning models a generous token budget in health checks and smoke tests (`max_tokens: 256`); with a tiny limit, a reasoning model spends its entire budget inside `<think>` and returns an empty response string, which looks like a broken server when it's working as designed.

## 17. CUDA-Specific Settings & Kernel Advances [CUDA]

### 17.1 Environment Variables (`GGML_CUDA_GRAPH_OPT`)

```bash
export GGML_CUDA_GRAPH_OPT=0    # safe baseline; A/B test against 1 on long sessions
```

Note that `LLAMA_SET_ROWS` (which appeared in older community scripts) is no longer read by current llama.cpp builds and can be deleted from your environment files.

Why should you A/B test `GGML_CUDA_GRAPH_OPT`? CUDA graph capture reduces kernel launch overhead during decode, which helps small models at high token rates. On long-context sessions or hybrid MoEs where graph shapes change as context grows, graph re-capture can increase VRAM fragmentation or slightly regress throughput. Benchmark 0 against 1 across a deep-context session before keeping it.

### 17.2 Essential CMake Build Flags

{% wide %}
| CMake Flag | What it enables |
| --- | --- |
| `GGML_CUDA_GRAPHS=ON` | Compiles CUDA graph capture support into the binary |
| `GGML_CUDA_FA=ON` | Compiles native CUDA Flash Attention kernels |
| `GGML_CUDA_FA_ALL_QUANTS=ON` | Compiles Flash Attention kernels for all KV cache quant combinations (including asymmetric `K8V4`) |
| `GGML_NATIVE=ON` | Enables host CPU AVX2 / AVX-512 / FMA instruction sets for fast CPU-side MoE expert math |
| `GGML_LTO=ON` | Enables Link-Time Optimization across translation units |
{% endwide %}

### 17.3 `GGML_CUDA_FORCE_CUBLAS`: Tested and Closed

Setting `-DGGML_CUDA_FORCE_CUBLAS=ON` forces standard cuBLAS matrix multiplication instead of GGML's custom MMQ (mixed-precision matrix quantization) kernels. In my tests across multiple checkpoints on the RTX 4070, forcing cuBLAS regressed prompt processing by roughly forty-five tokens per second and provided zero decode gain. GGML's native MMQ kernels are specifically tuned for small decode batch sizes on consumer cards; leave cuBLAS forcing off.

### 17.4 Upstream Kernel Improvements Worth Rebuilding For

Rebuilding llama.cpp from current master regularly pays off even when you don't change a single CLI flag. Over my recent [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/) test cycle, upstream commits landed CUDA sparse Flash Attention, fused normalization and scale kernels, additional elementwise kernel fusions, and NVMe `madvise` row prefetching for memory-mapped tensors. That last kernel change alone tripled my cold-prefill throughput (jumping from 44 to 135 tok/s) when streaming SSD-backed PLE weights. Always re-benchmark after pulling master.

## 18. Coding Workloads: What to Measure

In an interactive coding agent (Cline, Roo Code, Aider, Claude Code, or OpenCode), raw decode speed is only one piece of latency. Coding sessions send tens of thousands of tokens of system instructions, file trees, and tool outputs on every turn, which makes prompt processing, prompt-cache reuse, and time-to-first-token (TTFT) dominate wall-clock time.

| Metric | What I check for coding agents |
| --- | --- |
| **Cold TTFT** | How long does the first turn take when opening a fresh repository? |
| **Warm TTFT (prompt-cache hit)** | After a tool call appends 300 tokens to a 40k context, does the response start in under 1-2 seconds? |
| **Prefill (PP) at 32k-64k** | Can the runtime ingest a multi-file diff without freezing the editor for a full minute? |
| **Sustained decode (TG) at 64k-128k** | Does decode stay fast once the context window is half full, or does it collapse? |
| **MTP acceptance under Thinking Mode** | Does speculative decoding still land >70% of drafts under `temp 1.0`? |
| **Multi-turn VRAM stability** | Does VRAM stay flat across a 45-minute refactoring loop without hitting a late VMM OOM? |

Here is my four-step acceptance test before I promote any model profile into daily coding use:

1. Cold repository prompt right after server startup (measures cold prefill and NVMe page-in).
2. Follow-up turn on the same prefix (verifies KV prefix cache reuse and warm TTFT).
3. Full inspect, edit, and verify tool-call loop under official Thinking Mode sampling.
4. Long-context stress probe at deep context (verifies decode stability and VRAM headroom).

To keep comparisons reproducible in the [L3MS toolkit](https://github.com/carteakey/l3ms), every recorded profile logs this exact evidence block:

```text
model:
quant:
engine / commit:
benchmark command:
context:
parallel:
batch / ubatch:
KV cache:
sampling (temp / top-p / top-k):
prompt-cache state:
PP (prefill tok/s):
TG (decode tok/s at short & long ctx):
TTFT (cold / warm):
draft acceptance:
VRAM at load / after long session:
host RAM resident:
notes:
```

## 19. Speculative Decoding & MTP (Multi-Token Prediction)

Because autoregressive decode is bottlenecked by reading active weights from memory on every single token, speculative decoding uses a fast, lightweight draft head to guess the next few tokens and lets the base model verify all of them in a single batched forward pass. When the base model accepts two or three drafted tokens at once, you generate multiple tokens for roughly the memory-bandwidth cost of one.

Models trained with native Multi-Token Prediction (MTP) heads (such as Gemma 4, Qwen3.6, and Qwen3.8-Flash-Next) pair specifically trained draft layers with the base checkpoint, delivering much higher acceptance rates than unrelated small draft models.

### 19.1 MTP Drafting Configuration Flags

In llama.cpp, companion MTP drafting is configured with four flags:

- `--spec-draft-model <path>` points to the companion MTP draft GGUF (for example, Gemma 4's compact draft file or Qwen3.8's quantized MTP head). In [Strata](/blog/local-inference/strata-on-an-rtx-4070/), native MTP weights load directly from the GGUF without a separate flag.
- `--spec-type draft-mtp` instructs the server to run native MTP draft verification.
- `--spec-draft-n-max <int>` sets the maximum number of candidate tokens drafted per step (4 works well on GPU-resident Gemma 4 12B, while 2 is the sweet spot on larger or hybrid-offloaded MoEs like Gemma 4 26B and Qwen3.8-Flash-Next).
- `--spec-draft-p-min <float>` sets the minimum draft token probability threshold before stopping the current draft step (`0.7` is my standard floor).

{% callout "warning", "Avoiding the MTP rejection spiral on offloaded MoEs" %}
On an MoE with experts offloaded to system RAM, verifying a batch of drafted tokens isn't free: each speculative token can activate a different subset of routed experts, multiplying the number of unique experts that have to stream across DDR5 and PCIe during the verification pass. If the draft head proposes four low-confidence tokens and the first one gets rejected, you just paid for four times the expert memory traffic to advance by a single token. Setting `--spec-draft-n-max 2 --spec-draft-p-min 0.7` stops the draft head from guessing out on a limb, keeping draft acceptance high and turning MTP into a consistent net win on hybrid MoEs.
{% endcallout %}

### 19.2 Target and Draft KV Cache Precision

When running companion MTP in llama.cpp, there are two separate KV caches:

- `-ctk` and `-ctv` control the target model KV cache.
- `-ctkd` and `-ctvd` control the draft model KV cache.

Treat them as independent knobs. In my [Gemma 4 MTP](/blog/local-inference/running-gemma-4-mtp-locally/) testing, quantizing the target model's KV cache to 8-bit caused subtle logit drift between the target and draft heads that drove draft acceptance down near zero. Keeping both caches in full 16-bit precision (`-ctk f16 -ctv f16 -ctkd f16 -ctvd f16`) used more VRAM, but kept draft acceptance high and more than doubled end-to-end decode speed.

By contrast, on [Qwen3.8-Flash-Next](/blog/local-inference/strata-on-an-rtx-4070/), asymmetric K8V4 KV cache preserved high draft acceptance under Thinking Mode once paired with an uncompressed 8-bit PLE table. Always record draft acceptance alongside decode speed when changing KV precision or PLE quantization.

### 19.3 Measured MTP Speedups on the RTX 4070 12 GB

Every result below was measured on {% device "yeti-cachy" %}:

{% wide %}
| Model & Engine | Plain decode baseline | With MTP enabled | Speedup | Key MTP configuration |
| --- | ---: | ---: | ---: | --- |
| **Gemma 4 12B (`QAT Q4`, `llama.cpp`)** | 60.4 tok/s | **120.8 tok/s** | **2.0x** | `--spec-draft-n-max 4`, `f16` target & draft KV |
| **Gemma 4 26B-A4B (`QAT Q4`, `llama.cpp`)** | 38.5 tok/s | **100.6 tok/s** | **2.6x** | `--spec-draft-n-max 2`, `f16` target & draft KV |
| **Qwen3.8-Flash-Next (176B, `llama.cpp` exp)** | 20.7 tok/s | **25.3 - 27.1 tok/s** | **1.31x** | `--spec-draft-n-max 2 --spec-draft-p-min 0.7`, 1.78 GB `Q4_K_M` draft |
| **Qwen3.8-Flash-Next (176B, [Strata](/blog/local-inference/strata-on-an-rtx-4070/))** | 20.7 tok/s (`llama.cpp`) | **74.8 tok/s** (at 128k) | **3.6x vs baseline** (`2.76x` vs `llama.cpp` MTP) | Dynamic GPU expert cache + native GPU MTP + `Q8_0` PLE (`78.2%` acceptance at `temp 1.0`) |
{% endwide %}

### 19.4 Draftless `n-gram` Speculative Decoding

Upstream llama.cpp also includes draftless speculative modes (`ngram-simple` and `ngram-mod`) that require zero extra VRAM and no companion draft model. Instead, they match token sequences against n-grams already present in your context window, which is a natural fit for refactoring and code edits where variable names, file paths, and boilerplate repeat verbatim.

For a persistent coding server, test `ngram-mod`:

```bash
llama-server \
  -m model.gguf \
  --spec-type ngram-mod \
  --spec-ngram-mod-n-match 24 \
  --spec-ngram-mod-n-min 48 \
  --spec-ngram-mod-n-max 64 \
  --spec-draft-n-max 64
```

For simpler single-prompt repetition tests:

```bash
llama-server \
  -m model.gguf \
  --spec-type ngram-simple \
  --spec-draft-n-max 64
```

You can even chain MTP and n-gram drafting with a comma-separated list (`--spec-type draft-mtp,ngram-mod`), though you should benchmark end-to-end tool-loop time before keeping it, since failed long n-gram drafts can waste verification bandwidth on offloaded MoEs.

## 20. Vision / Multimodal (`--mmproj`)

### 20.1 GPU vs CPU Vision Projector Placement

Multimodal GGUF models use a companion vision projector file:

```bash
--mmproj /path/to/mmproj-F16.gguf
```

By default, the vision projector loads into VRAM alongside the language model. On a 12 GB card where every megabyte of VRAM is already spoken for by hot MoE experts and a deep KV cache, you have two choices:

1. Keep the vision projector on the GPU and reserve headroom: pass `--fit-target 2048` on the server so automatic fitting leaves enough VRAM for both the projector weights and image activation scratch buffers (my standard 64k vision profile).
2. Offload the vision encoder to the CPU for zero VRAM cost: in my [Strata MTMD](/blog/local-inference/strata-on-an-rtx-4070/) vision profile, running the vision projector on the CPU consumes zero extra GPU VRAM, leaving all cached GPU experts and the 128k KV cache untouched. Just make sure your startup script warms the vision path with a small test image at boot, which cut my first-image latency from several minutes of cold page-in down to under two seconds.

### 20.2 Common Multimodal Failure Modes on 12 GB VRAM

- Startup or first-image CUDA OOM: happens when hardcoded layer or tensor placement flags were generated without `--mmproj` attached, or when `--fit-target` leaves no room for vision activation buffers. Fix it by running a current build (where `--fit` accounts for the vision projector automatically) and setting `--fit-target 2048` if the projector runs on the GPU.
- Micro-batch assertion crash (`n_ubatch >= n_tokens`): happens when an image's patch token count exceeds `--ubatch-size`. Fix it by keeping `--ubatch-size 512` (or higher for high-resolution tiling models).

### 20.3 Safe 12 GB Vision Profile (`llama-server`)

```bash
llama-server \
  -m model.gguf \
  --mmproj mmproj.gguf \
  --ctx-size 65536 \
  --fit on --fit-ctx 65536 --fit-target 2048 \
  -ctk q8_0 -ctv q8_0 \
  --flash-attn on \
  --batch-size 256 --ubatch-size 512 \
  --no-mmap --mlock \
  --parallel 1
```

## 21. Multi-GPU Primer

{% callout "note", "Upstream reference (single-GPU node here)" %}
My workstation runs a single RTX 4070, so this section summarizes upstream llama.cpp multi-GPU behavior and constraints rather than local benchmark runs.
{% endcallout %}

Upstream llama.cpp supports three multi-GPU split modes:

| Split mode | How it partitions the model | When to use it |
| --- | --- | --- |
| **`layer`** | Places contiguous ranges of transformer blocks on each GPU (pipeline split) | **Default and most compatible.** Works with `--fit` and quantized KV caches. |
| **`row`** | Legacy row-split mode across GPUs | Deprecated upstream; avoid on new setups. |
| **`tensor`** | Experimental tensor parallelism across GPUs | Worth testing only on supported dense models over fast PCIe / NVLink interconnects. |

Standard pipeline split (layer mode):

```bash
# Automatic VRAM-proportional layer split across all GPUs:
llama-server -m model.gguf --split-mode layer --n-gpu-layers all

# Manual ratio for asymmetric cards (e.g. 24 GB + 8 GB = 3:1):
llama-server -m model.gguf --split-mode layer --tensor-split 3,1
```

Experimental tensor-parallel split (tensor mode):

```bash
llama-server \
  -m model.gguf \
  --split-mode tensor \
  -ctk f16 -ctv f16 \
  --flash-attn on
```

Key multi-GPU guardrails:

- Start with `--split-mode layer`. Automatic fitting works in layer mode unless you override it with manual placement flags.
- `--split-mode tensor` is experimental: many MoE and hybrid linear-attention architectures will abort with a "not implemented" error, automatic fitting is disabled, and quantized KV caches aren't supported yet (use 16-bit KV).
- `GGML_CUDA_P2P=1` can speed up direct GPU-to-GPU transfers on motherboards and drivers that support peer-to-peer BAR mapping, though it can also hang or corrupt output on consumer chipsets. Test carefully before adding it to a service file.

## 22. Custom Inference Engines & Specialized Forks ([Strata](/blog/local-inference/strata-on-an-rtx-4070/), `ik_llama.cpp`)

For years, local LLM optimization meant one workflow: build llama.cpp, tune flags, and accept whatever throughput the general-purpose graph scheduler gave you. Today, when you hit llama.cpp's architectural ceiling on a specific model and card, there's a second tier of tools worth knowing.

### 22.1 Model-Specific ("Overfit") Inference Engines

As I explored in [The Rise of Overfit Inference Engines](/blog/local-inference/the-rise-of-overfit-inference-engines/) and [Strata on an RTX 4070](/blog/local-inference/strata-on-an-rtx-4070/), llama.cpp pays a generality tax: its memory allocator and graph scheduler must stay compatible with dozens of model families across CUDA, Metal, Vulkan, ROCm, SYCL, and CPU backends.

A model-specific ("napkin" or "overfit") engine throws away that portability and targets one model family on one hardware architecture:

{% wide %}
| Engine | Target hardware | Target model family | Why it beats general runtimes in its niche |
| --- | --- | --- | --- |
| **[Strata](https://github.com/Niko1221/Strata)** | Consumer NVIDIA RTX (12 GB+) | [Qwen3.8-Flash-Next](/blog/local-inference/strata-on-an-rtx-4070/) | Dynamic per-expert VRAM cache across all 48 layers (~74% hit rate), native GPU MTP, zero-VRAM `mmap` PLE (`75 tok/s` at 128k on RTX 4070) |
| **[ninfer](https://github.com/Neroued/ninfer)** | Single RTX 5090 / 3090 | Curated Qwen checkpoints | Scratch C++/CUDA graph with zero multi-backend abstraction overhead |
| **[DwarfStar (`ds4`)](https://github.com/antirez/ds4)** | Metal, CUDA, ROCm | DeepSeek V4, GLM 5.x, Qwen3.8-Flash-Next | Aggressive routed-expert compression and SSD-backed KV/embedding streaming |
| **[Splash](https://github.com/incoai/splash)** | Apple Silicon M3+ | Qwen family | Per-model Metal kernels and DFlash 2 speculative decoding |
| **[llamAmpere](https://github.com/JakeATX/llamAmpere)** | RTX 3090 / 3090 Ti (SM86) | Qwen3.8-27B | SM86-tuned verify kernels and TurboQuant KV compression |
| **[gufo](https://github.com/gufo-org/gufo)** | AMD Strix Halo (Ryzen AI MAX+ 395) | Curated MoEs | Custom HIP kernels and DFlash2 + MTP for unified APU memory |
{% endwide %}

### 22.2 `ik_llama.cpp` Fork

The [ikawrakow/ik_llama.cpp](https://github.com/ikawrakow/ik_llama.cpp) fork by Iwan Kawrakow (the creator of llama.cpp's original K-quants and IQ-quants) focuses on advanced quantization schemes and fused CPU and hybrid MoE kernels. It doesn't aim to merge upstream into mainline llama.cpp, making it a strong specialized option when you're heavily CPU-bound on MoE inference and want quant formats tuned specifically for CPU cache lines.

### 22.3 How to Use Specialized Engines Safely

- Keep your client layer stable with llama-swap: as long as a specialized runtime exposes `/v1/chat/completions`, put it behind llama-swap (§16.3) alongside your mainline `llama-server` fallback. If a bleeding-edge engine hits a bug on an unusual tool call, your fallback llama.cpp profile is one model name away.
- Mind the trust and supply-chain tradeoff: small, fast-moving engines ship native C++ and CUDA code that talks directly to your GPU driver without the review eyeballs of `ggml-org/llama.cpp`. Always build from source, pin a specific git commit, inspect diffs before pulling updates, and bind the server strictly to localhost or a private Tailscale interface.

## 23. Security Notes

Local inference servers are still network daemons executing complex parser and template code. Never expose your inference server or router directly to `0.0.0.0` on an untrusted network without authentication and rate limits.

Minimum safe practices:

- Bind to localhost by default, or bind exclusively to your Tailscale or WireGuard interface IP when accessing your workstation from a laptop or phone.
- Put an authenticated reverse proxy in front of any port reachable outside the host.
- Remember that prompts live in logs: system prompts, API keys pasted into chat, and file diffs can land in server stdout logs, proxy access logs, or prompt-cache files on disk.
- Verify model provenance: stick to official org uploads or trusted quant maintainers (Bartowski, Unsloth, ISTA-DASLab), and prefer GGUF or safetensors files over arbitrary Python pickle weights.

## 24. Diagnostic Checklist

Run through these ten checks whenever a new model or reboot feels slower than expected:

```bash
# 1. RAM speed - #1 culprit when hybrid MoE decode drops by 50-65%
sudo dmidecode -t memory | grep -E "Speed|Configured"
# "Configured Memory Speed" MUST match your XMP/EXPO profile (e.g. 5800 or 6000 MT/s)

# 2. CPU scaling governor
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
# Expected: performance

# 3. Intel Energy Performance Preference (governor alone is not enough on intel_pstate)
cat /sys/devices/system/cpu/cpu0/cpufreq/energy_performance_preference
# Expected: performance (NOT balance_performance or powersave)

# 4. Active tuned profile (prevents power-profiles-daemon MSR throttling across reboots)
sudo tuned-adm active
# Expected: Current active profile: throughput-performance

# 5. Actual P-core frequency under load
grep "cpu MHz" /proc/cpuinfo | sort -rn | head -6

# 6. Free VRAM before model load
nvidia-smi | grep MiB

# 7. Check for SSD page-thrashing during steady-state decode
cat /proc/$(pgrep -n 'llama-server|strata')/io | grep read_bytes
# Diff across 256 tokens: ~0 to a few MB (PLE) is healthy; tens of MB/token = RAM spill

# 8. Swap / ZRAM churn
cat /proc/vmstat | grep -E "pswpin|pswpout"

# 9. PCIe link generation and width under load [CUDA]
nvidia-smi -q | grep -A 3 "PCIe Generation"
# Expected: Current Gen = 4 (or 5), Link Width = 16x

# 10. Thermal throttling check
cat /sys/class/thermal/thermal_zone*/temp
```

### Known TG Variability & Crash Root Causes

{% wide %}
| Root cause | What the symptom looks like | Fix |
| --- | --- | --- |
| **`power-profiles-daemon` MSR throttling** | Decode varies 20-30% between reboots even though `scaling_governor` says `performance` | Replace with `tuned-ppd` and set `throughput-performance` (§7.4) |
| **XMP / EXPO reset in BIOS** | Hybrid MoE decode is stable but stuck at roughly one-third of normal speed | Re-enable XMP/EXPO profile in BIOS and verify with `dmidecode` (§6.1) |
| **E-cores included in thread pool** | Hybrid MoE decode runs 20-30% below P-core baseline | Launch with `taskset -c <p-cores-only>` and set `--threads` below P-core count (§14.3) |
| **`--no-mmap` or `--mlock` used on a PLE model** | RAM fills to 100%, SSD reads spike to tens of MB/token, decode drops by 35%+ | Keep `mmap` enabled and pin `per_layer_token_embd.weight=CPU` or use `--ple-gguf` on NVMe (§15.1) |
| **4-bit quantized PLE table hurting MTP** | Draft acceptance under `temp 1.0` sits around ~55% on Qwen3.8-Flash-Next | Swap to uncompressed `Q8_0` PLE on NVMe (0 VRAM cost, lifts acceptance to 78.2% and decode by +31.7%) (§15.1) |
| **Greedy decoding (`temp = 0`) on reasoning models** | Model gets stuck repeating sentences inside `<think>` until `max_tokens` runs out | Use official Thinking Mode sampling (`temp 1.0, top-p 0.95, top-k 20`) server-side (§13.1) |
| **MTP rejection spiral on offloaded MoE** | Enabling MTP makes an offloaded MoE slower than plain decode | Cap `--spec-draft-n-max 2` and set `--spec-draft-p-min 0.7` (§19.1) |
| **`MADV_HUGEPAGE` forced on 40 GB pinned arena** | Hard Linux kernel freeze under memory pressure on a 64 GB host | Remove explicit `MADV_HUGEPAGE` on pinned expert pools; rely on standard kernel THP `[always]` (§7.4) |
| **`--fit-target` too small** | Server passes short benchmarks, then hits CUDA OOM 20 minutes into a long coding session | Increase `--fit-target` to at least `512` MiB (`2048` MiB for GPU vision) (§10.4) |
| **Vision crash on first image** | `llama-server` aborts with a batch assertion when an image is attached | Set `--ubatch-size 512` or higher (§12.2, §20.2) |
{% endwide %}

## Changelog

| Date | Note |
| --- | --- |
| 2026-10-18 | Restored full technical explanations and callouts; added the 3-tier memory hierarchy (VRAM + DDR5 + NVMe `mmap` PLE), the uncompressed `Q8_0` PLE breakthrough (+31.7% decode at 0 MiB VRAM), custom/overfit inference engines ([Strata](/blog/local-inference/strata-on-an-rtx-4070/)) and dynamic per-expert VRAM caching (`74.8 tok/s` at 128k), hybrid linear attention (Gated-DeltaNet 262k context on 12 GB), Greedy vs Thinking Mode sampling (`temp 1.0`), MTP rejection spirals, and the retired `MADV_HUGEPAGE` pinned-memory caveat. |
| 2026-10-01 | Added initial Qwen3.8 MoE notes: benchmark hygiene and the `read_bytes` spill check, dynamic expert caching, K8V4 KV, the PLE/mmap exception, MTP on offloaded MoE, CPU vision encoder, `llama-swap` operations, and upstream kernel work. |
| 2026-08-14 | Restored the TL;DR, problem-based reading map, complete optimization checklist, glossary, and local/cloud framing while retaining corrected `llama.cpp` defaults. |
| 2026-07-17 | Added symptom-first navigation; updated current `--fit`, batch, and Flash Attention defaults; linked L3MS profile evidence and the community-run schema. |
| 2026-06-25 | Added coding-workload metrics, n-gram speculation recipes, `ubatch` sweep guidance, ROCm/HIP and dynamic backend notes, `imatrix`/IQ/Unsloth Dynamic quant guidance, GLM-5.2 PPL/KLD evaluation notes, and a multi-GPU primer. |
| 2026-06-22 | Corrected `mmproj` fitting, separated target and draft KV caches for MTP, removed `LLAMA_SET_ROWS`, and made CUDA graphs an A/B test. |
| 2026-06-21 | Added problem-based reading map, safe starting profiles, and consolidated vision, CUDA graph, hybrid CPU, and MTP guardrails. |
| 2026-06-17 | Added TL;DR, priority checklist, measurement and security sections, and updated `llama.cpp` / LM Studio guidance. |
| 2026-06-12 | Added dedicated sections for QAT quantization and MTP speculative decoding. |
| 2026-04-04 | Initial guide synthesized from L3MS scripts, benchmark runbooks, and model posts. |

## References

- [L3MS: homelab LLM toolkit (scripts, bench runbook, profile dashboard)](https://github.com/carteakey/l3ms)
- [llama.cpp](https://github.com/ggml-org/llama.cpp) ([build guide](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md), [server README](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md), [speculative decoding](https://github.com/ggml-org/llama.cpp/blob/master/docs/speculative.md), [multi-GPU guide](https://github.com/ggml-org/llama.cpp/blob/master/docs/multi-gpu.md), [quantize README](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md))
- [Strata: Qwen3.8-Flash-Next inference engine with dynamic expert caching](https://github.com/Niko1221/Strata)
- [ik_llama.cpp fork](https://github.com/ikawrakow/ik_llama.cpp) and [FOSDEM 2025: History and advances of quantization in llama.cpp](https://archive.fosdem.org/2025/schedule/event/fosdem-2025-5991-history-and-advances-of-quantization-in-llama-cpp/)
- [llama-swap: single-port model router for llama-server and custom runtimes](https://github.com/mostlygeek/llama-swap)
- [Accuracy is Not All You Need (KLD evaluation of quantized LLMs)](https://arxiv.org/abs/2407.09141)
- [Unsloth Dynamic 2.0 GGUFs](https://unsloth.ai/docs/basics/unsloth-dynamic-2.0-ggufs), [Aider Polyglot benchmarks](https://unsloth.ai/docs/basics/unsloth-dynamic-2.0-ggufs/unsloth-dynamic-ggufs-on-aider-polyglot), and [GLM-5.2 KLD discussion](https://huggingface.co/unsloth/GLM-5.2-GGUF/discussions/3)
- [Strata on an RTX 4070: 75 tok/s from a 176B Model at 128k Context](/blog/local-inference/strata-on-an-rtx-4070/)
- [The Rise of Overfit Inference Engines](/blog/local-inference/the-rise-of-overfit-inference-engines/)
- [Running Qwen3.8-Flash-Next Locally](/blog/local-inference/running-qwen3-8-flash-next-locally/)
- [Running Qwen3.8-27B Locally: 262k Context on 12 GB VRAM](/blog/local-inference/running-qwen3-8-27b-locally/)
- [Qwen3.8-27B vs Qwen3.8-Flash-Next on 12 GB VRAM](/blog/local-inference/qwen3-8-27b-vs-flash-next/)
- [Running Gemma 4 MTP Locally](/blog/local-inference/running-gemma-4-mtp-locally/)
- [Running Gemma 4 26B-A4B Locally](/blog/local-inference/running-gemma-4-26b-a4b-locally/)
- [Running Qwen3.6-35B-A3B Locally](/blog/local-inference/running-qwen3-6-35b-a3b-locally/)
- [Optimizing Qwen3-Coder-Next Local Inference](/blog/local-inference/optimizing-qwen3-coder-next-local-inference/)
- [Optimizing gpt-oss-120b Local Inference](/blog/local-inference/optimizing-gpt-oss-120b-local-inference/)

