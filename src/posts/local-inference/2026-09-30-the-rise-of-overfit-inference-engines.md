---
title: "The Rise of Overfit Inference Engines"
description: "Why hyper-specialized, disposable runtimes like Strata, ninfer, and Splash are running circles around llama.cpp and vLLM: measured data on a GPU I bought for $500, why AI coding makes one-off engines cheap, and a 60k-token test."
image: /img/blog-sketches/unique/the-rise-of-overfit-inference-engines-stamp-trim.png
imageAlt: "Monochrome pencil sketch of a graphics card with a small hand-built engine block bolted on, a crumpled napkin blueprint, and a wrench, beside a bulky unused universal engine"
date: 2026-09-30
updated: 2026-10-01
authored_by: ai-assisted
draft: false
giscusTerm: "/blog/the-rise-of-overfit-inference-engines/"
tags:
  - AI
  - Self-Host
pinned: true
---

Earlier this week I thought the local inference stack on {% device "yeti-cachy" %} (my main homelab node: an i5-12600K with 64 GB DDR5 and an RTX 4070 12GB, running CachyOS) had hit its ceiling.

I'd painstakingly squeezed [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/) (a ~176B parameter model: 125B MoE with 6B active per token, plus a 51B n-gram table offloaded to NVMe) up to **20.8 tok/s** steady-state decode on upstream `llama.cpp` master, and **27.06 tok/s** with Daniel Han's multi-token prediction (MTP) branch (#28243) plus Aman Gupta's NVMe `madvise` row prefetching (#29599).

For an offloaded 125B MoE on a graphics card I paid $500 for, 27 t/s felt about as good as it gets.

Then I booted **Strata**.

```text
strata serve: prompt 59787 tokens read in 29700 ms (2013.0 tok/s)
strata serve: 512 generated in 9630 ms (53.2 tok/s), drafts accepted 244 of 331
strata serve: decode expert cache hit rate: 76.5%
```

My unfiltered reaction was: *what in the fuck?*

At 60,000 tokens of context, on the same card, Strata was decoding at **53.2 tok/s**, bursting past **90 tok/s** on repetitive code, and chewing through 60k prompt context at **2,013 tok/s** prefill.

No hardware upgrades. No tensor parallelism across quad-H100 clusters. Just a single 12 GB card that mainstream wisdom says can't run frontier MoE models locally.

Strata isn't alone. Over the past three months a handful of hyper-specialized inference runtimes have shown up: Strata, ninfer, DwarfStar, Splash, llamAmpere, and gufo (all linked below).

None of them are general-purpose. Each supports a short, curated list of models and targets one hardware family (the widest, DwarfStar, spans Metal, CUDA, and ROCm but still only a handful of models). Yet in their niches they beat general runtimes like `llama.cpp`, `vLLM`, and `Ollama` by a wide margin. On my box, Strata is 2.5× to 4× faster than `llama.cpp` master.

My bet: for power users on fixed hardware, **disposable, overfit engines are about to beat general-purpose runtimes on speed**, and general runtimes will keep the portability crown.

{% diagram_card {
  src: "./src/static/img/diagrams/qwen38-flash-next-throughput-progression.png",
  alt: "Line chart of Qwen3.8-Flash-Next decode throughput on an RTX 4070 12GB in tokens per second across nine runtime steps: Powersave 6.5, CPU governor 12.2, SSD mmap 15.2, q8 KV plus fit 18.9, master 19.35, MTP V1 20.65, MTP V2 27.06, Strata dynamic cache 60.3, Strata peak 90.2",
  kicker: "Throughput Evolution · RTX 4070 12GB + 64GB DDR5",
  title: "Qwen3.8-Flash-Next Decode Throughput by Runtime",
  badge: "6.5 → 90.2 tok/s (+1,287% leap)",
  caption: "Nine measured steps on one box. <strong>Strata steady 60.3 t/s</strong>, peak warm-draft burst <strong>90.2 t/s</strong>."
} %}

## The New Breed: The Disposable Napkin Runtimes

Look across the local AI community right now and a pattern shows up. While corporate teams spend months standardizing vLLM deployments or reviewing 500-comment pull requests in `llama.cpp`, solo developers (and agent loops) are dropping narrow engines with big numbers:

- [Strata](https://github.com/Niko1221/Strata) (Niko1221): An engine for running `Qwen3.8-Flash-Next` on a single consumer NVIDIA RTX card (12 GB VRAM or more) with ISTA-DASLab GSQ-RCO quants. It discards layer offloading entirely in favor of an online dynamic expert VRAM cache and a native MTP draft head.
- [ninfer](https://github.com/Neroued/ninfer): A scratch-written C++/CUDA inference runtime for a closed list of Qwen checkpoints on a single GPU. The upstream targets one RTX 5090 on 64-bit Linux, and community forks retune it for the RTX 3090. No multi-GPU, no weight offloading, no other model families.
- [DwarfStar](https://github.com/antirez/ds4) (`ds4`, by antirez): A deliberately narrow C engine for DeepSeek V4 Flash and a short list of other curated models, with Metal, CUDA, and ROCm backends. Not a general GGUF runner, though it still borrows kernels and quant formats from `llama.cpp`/GGML.
- [Splash](https://github.com/incoai/splash): An Apple Silicon engine (M3 or newer, macOS 26.4+) built around DFlash 2 speculative decoding, specialized Metal kernels, and automatic memory planning, running Qwen-family models from GGUF and MLX weights.
- [llamAmpere](https://github.com/JakeATX/llamAmpere): A `llama.cpp` fork aimed squarely at the RTX 3090 / 3090 Ti (SM86), with a TurboQuant KV cache, an MTP drafter, and custom verification kernels, tuned mainly for Qwen3.8-27B.
- [gufo](https://github.com/gufo-org/gufo): A C++ engine for AMD Strix Halo (Ryzen AI MAX+ 395) unified-memory machines, with custom HIP kernels, DFlash2 and MTP speculation, and continuous batching.

In traditional software engineering, these projects would be dismissed as "bad software": tightly coupled, unportable, fragile, and short on architectural abstraction.

In inference they work well precisely because they dodge generality.

They pick a single model and a single hardware target, and then optimize the compute graph, memory layout, and execution kernels exclusively for that one case. They are highly "overfit" codebases.

My prediction: most of them will be abandoned within six months.

When Qwen4 or DeepSeek-V4 drops with an altered routing topology or different rotary embeddings, Strata and ninfer won't refactor. They'll die, and nobody will care, because another one-off engine will take their place within days.

## The Thesis: Why One-Off Engines Will Dominate

Why now, and why do I think this sticks? Three reasons.

### Axiom 1: Generality is a performance and velocity tax

The more general a codebase becomes, the harder it is to introduce radical, architecture-breaking optimizations.

Consider `llama.cpp`. It's one of the best pieces of open-source engineering around. It supports CUDA, ROCm, Metal, Vulkan, SYCL, OpenCL, Kompute, CPU AVX-512, NEON, and IBM POWER. It runs Llama, Mistral, Gemma, Command-R, Qwen, DeepSeek, and dozens of other model families.

Because of that breadth:
- A change to how expert weights are staged across PCIe cannot break the Metal unified memory backend.
- A CUDA graph optimization cannot violate the fallback path for Pascal GTX 1080s or Intel Arc cards.
- Adding dynamic expert VRAM caching requires threading state through tens of thousands of lines of generalized graph scheduler code (`ggml-alloc`, `ggml-backend`, `llama-context`).

Generality acts like atmospheric drag. The larger the supported surface area, the slower the vehicle moves. The smaller the codebase, the faster it iterates.

### Axiom 2: AI coding lowered the barrier to writing an engine

Two years ago, writing a high-performance CUDA inference runtime from scratch required a senior systems engineer with years of experience profiling warp occupancy and writing PTX assembly.

Today, frontier coding models equipped with agentic scaffolding can write, debug, and optimize CUDA kernels, C++ bindings, and tensor schedulers in hours. If you know the mathematical formulation of a fused RMSNorm-SwiGLU kernel or the memory layout of an IQ3_XXS quant, an agent can implement the entire pipeline in an afternoon.

My guess is that the cost of a purpose-built runtime has dropped from months of specialist salary to a weekend of API credits. I don't have hard numbers for that, and I haven't confirmed how much of Strata was agent-written.

### Axiom 3: "Make tok/s go up" is a fully specified objective

Most software projects fail to automate because their specifications are ambiguous: product managers change requirements, UI ergonomics are subjective, and edge cases are social rather than technical.

Inference engine optimization is the opposite: it's close to a fully specified engineering problem.
1. Input: A standardized weights file (GGUF or SafeTensors) and input token IDs.
2. Constraint: Output must match the reference model within a numerical tolerance (for example greedy-argmax parity on a test set, or a low KL divergence against reference logits).
3. Objective Function: Maximize `tokens_per_second` while minimizing `vram_allocated_bytes`.

There's no human bottleneck in the loop. You can point an autonomous optimization loop at a single model on your local machine, instruct it to benchmark every kernel fusion and memory staging strategy against hardware counters, and let it iterate until throughput converges.

### Putting it together

Put those together and I end up here:

1. General engines like `llama.cpp` and `vLLM` will tend to lag one-off engines in peak throughput on specific hardware.
2. None of the one-offs will keep both generality and dev velocity over time, and they shouldn't try.
3. One-off, overfit engines will multiply, take over their hardware and model niches, and become a common way power users run local models.

They are "napkin software": cheap to write, ruthlessly effective for the meal in front of you, and meant to be crumpled up and thrown in the bin when the next course arrives.

## The console vs. PC analogy

There's a precedent for this, and game developers know it well: PC versus console.

{% image_cc "./src/static/img/diagrams/overfit-console-vs-pc.png", "Two-column comparison. PC Model, Generality Tax: a stack of llama.cpp / vLLM / Ollama, Graph schedulers, Multi-OS, CUDA / ROCm / CPU and 50+ model families. Console Model, Direct-to-Metal: Strata / ninfer / Splash pointing straight at Ada SM89 / PCIe 4.0.", "sketch-draw", "The Console vs. PC Model. Left: a generalist runtime pays the generality tax of graph schedulers, multi-OS and multi-vendor support, and 50+ model families. Right: an overfit runtime is hand-tuned for one target, with static VRAM allocations and dedicated expert cache pools, and discards all non-target silicon for direct-to-metal utilization." %}


Historically, a $400 console could hold frame rates that surprised people with much pricier PCs.

Why? Because a studio like Naughty Dog didn't build for "Windows and any GPU." They targeted one exact APU, one exact memory bus width, and one exact cache hierarchy. They scheduled compute cycles to the clock tick, eliminated operating system overhead, and bypassed defensive graphics drivers.

On PC, that kind of bare-metal engine was rarely worth it. No company could justify years of engineering on an engine that *only* worked on an RTX 4070 with dual-channel DDR5-5600. PC developers were forced to pay the Generality Tax: DirectX, Vulkan, intermediate representations, and runtime shader compilation.

AI changes that math. If coding agents can write, benchmark, and debug custom CUDA kernels and memory allocators in an afternoon, targeting one exact machine gets cheap:

1. It no longer takes a $50M AAA studio. An agent loop can produce a tuned inference engine in hours.
2. Every enthusiast PC becomes its own dedicated console. Instead of waiting for a general runtime to optimize for your specific card, your agents can generate a runtime that treats your exact motherboard, CPU cache, and GPU memory bus like a closed console platform.
3. Generality flips from an asset to dead weight. When software is cheap to synthesize on demand, portability stops being a virtue and becomes friction.

## Under the hood: why Strata is fast

To see how an overfit engine gets 2.5× to 4× over a general runtime, look at the memory hierarchy of an offloaded MoE model running `Qwen3.8-Flash-Next` on a 12 GB GPU.

{% callout "note", "Test hardware" %}
All tests conducted on {% device "yeti-cachy" %}: Intel Core i5-12600K (10 cores, 16 threads, Performance governor), NVIDIA GeForce RTX 4070 (12 GB GDDR6X, PCIe 4.0 x16, 504 GB/s bandwidth), 64 GB DDR5-5600 RAM (dual-channel, ~75 GB/s bandwidth), WD Black SN770 2TB Gen 4 NVMe SSD.
{% endcallout %}

### The general approach (`llama.cpp`): layer-granular offloading

`llama.cpp` offloads layer by layer:

```text
Layer 0..3:   GPU VRAM (Attention + Dense MoE weights)
Layer 4..47:  Host DDR5 RAM (Attention + 44 layers of MoE weights)
```

During generation, for every single token:
1. The token passes through the first 4 layers in fast VRAM (504 GB/s).
2. For the remaining 44 layers, the router picks 8 to 10 active experts per layer.
3. Because those experts live in system RAM, the GPU must issue DMA copy requests across the PCIe bus or the CPU must execute the GEMM kernels directly against host DDR5 memory.
4. Each token requires fetching roughly 770 MB of expert weights across system memory channels.

At real-world dual-channel DDR5 throughput (~70-75 GB/s), the naive ceiling is easy to compute, and it's wrong:

{% callout "warning", "Correction: the naive bandwidth ceiling is not 20 tok/s" %}
`75 GB/s ÷ 0.77 GB/token` is about 97 tok/s, not 20. Measured `llama.cpp` sits at 20.8 tok/s, roughly a fifth of that ceiling. So pure DDR5 bandwidth is not the whole story: CPU-side GEMM throughput, TLB misses on 4 KB pages, and PCIe copies all eat into it.
{% endcallout %}

Layer-granular offload moves about 770 MB of expert weights per token through the slowest tier, and that tier delivers a fraction of its peak. Anything that moves less data through it, or hides its latency, helps.

### The overfit approach (Strata): a dynamic global expert cache in VRAM

Strata, on the same machine, drops layer-granular offloading, a constraint inherited from dense transformer models.

In an MoE, expert activation is very uneven. A small subset of "celebrity experts" gets most of the routing, and thousands of long-tail experts are rarely used. Here, 3,086 cached experts out of 24,576 (about 13%) serve roughly three-quarters of activations.

Instead of keeping 4 full layers on the GPU and 44 layers on the host, Strata:
1. Profiles expert routing frequencies for the target model family.
2. Allocates a contiguous 5.04 GB VRAM arena holding exactly 3,086 individual hot experts drawn from across *all 48 layers*.
3. Pins dense attention layers and the token embedding table in fast memory.
4. Keeps the remaining long-tail experts in a locked host RAM arena (`cudaHostRegister`).

{% image_cc "./src/static/img/diagrams/overfit-memory-hierarchy.png", "Three-tier memory hierarchy: VRAM 12 GB (hot experts, 504 GB/s) linked by PCIe 4.0 to DDR5 64 GB (cold experts, 70 GB/s), with mmap paging up from the NVMe SSD (n-gram table, 7 GB/s)", "sketch-draw", "The three-tier memory hierarchy on this box. Bandwidths are the peak figures for each tier; the cache-miss path crosses PCIe at 31.5 GB/s." %}

- Tier 1 (RTX 4070 VRAM · 12,282 MiB @ 504 GB/s): 3,086 dynamically cached hot experts across all 48 layers (5.04 GB), native MTP draft head (876 MiB Q2_0), and K8V4 KV cache (128k context).
- Bus 1 (PCIe 4.0 x16 · 31.5 GB/s): Traversed *only* on the rare expert cache misses (~25% of tokens).
- Tier 2 (Host DDR5-5600 · 64 GB @ ~70 GB/s): 39.97 GB long-tail cold experts arena, accelerated by 2 MB Transparent Huge Pages (`MADV_HUGEPAGE`). Leaves 16 GB of host headroom for OS and desktop tasks.
- Bus 2 (Direct NVMe Kernel Paging): Pages the 51.2B parameter hashed N-gram table (28.8 GB on SSD) lazily via sparse `mmap` at ~5 KB/token with zero RAM footprint.

When a token is evaluated:
- Cache Hit: If the routed expert is one of the 3,086 resident experts, it is executed directly on the GPU tensor cores at 504 GB/s.
- Cache Miss: If an expert is outside the cache, it is streamed across PCIe asynchronously via a pool of 9 background worker threads.

In my logs the decode expert cache hit rate stays between 71% and 77%.

Because nearly three-quarters of expert computations happen in VRAM at 504 GB/s, the host-memory traffic per token drops from about 770 MB to roughly 190–230 MB, a 3–4× reduction.

That alone doesn't explain the whole jump. I haven't run a cache-only ablation (MTP off), so I can't say how much of the 20.8 → 53 tok/s comes from the cache and how much from speculation. The next section's MTP gain stacks on top of this one.

### Layering native MTP speculative decoding

Strata doesn't stop at expert caching. It bundles a native SM89-compiled Multi-Token Prediction (MTP) draft head (`mtp-q2_0.gguf`, 876 MiB resident in VRAM).

Because the draft head executes entirely on the GPU without round-tripping to host RAM, it drafts 3 to 4 tokens ahead. The primary model verifies all drafted tokens in a single forward evaluation pass.

With an MTP draft acceptance rate averaging 72% to 84%, each step generates between 2.2 and 2.9 tokens.

Combined, the two effects take decode from 20.8 t/s to 53–63 t/s steady-state, reaching 90.2 t/s on structured boilerplate code. How the gain splits between them is untested.

### Live telemetry

Here's Strata running `Qwen3.8-Flash-Next` on the 4070 during a real agentic coding session, generating a bash tool call:

{% image_cc "./src/static/img/local-inference/strata-qwen38-flash-next-dashboard.png", "Live Strata runtime telemetry dashboard running Qwen3.8-Flash-Next on an NVIDIA GeForce RTX 4070 with 12GB VRAM", "w-full border border-surface-border my-6", "Live Strata telemetry on the RTX 4070: 67.6 tok/s decode, 1,959 tok/s prefill, 3,086 experts cached in VRAM (5.0 GB), and 52.5 GB of host RAM in use during real tool calls." %}

For the baseline setup and the `llama.cpp` master and MTP V2 numbers, see [Running Qwen3.8-Flash-Next locally on a 12GB VRAM card](/blog/local-inference/running-qwen3-8-flash-next-locally/).

## Does it hold up at 60k tokens?

I didn't trust the short-prompt numbers. Fast on a 200-token toy benchmark is easy. What happens at 16k, 32k, or 60k tokens? Does KV cache pressure blow up VRAM, does expert routing scatter across cold layers, do long generations turn into a crawl?

To find out I wrote an automated long-horizon benchmarking harness (`bench_strata_long_horizon.py`, which lives alongside my [L3MS](https://github.com/carteakey/l3ms) benchmarks).

The harness:
1. Synthesizes dense architectural prose from genuine systems documentation to test authentic attention mechanisms.
2. Injects an exact needle passcode (`OBSIDIAN_PHOENIX_<depth>_SECURE`) into the middle of the context window.
3. Issues a complex query requiring the model to extract the secret token and generate a 512-token technical analysis of memory-mapped I/O and speculative decoding.
4. Measures prompt processing throughput (`pp`), decode generation throughput (`tg`), MTP draft acceptance rates, context needle recall, and VRAM stability across scaling depths up to 60,000 tokens.

Measured on {% device "yeti-cachy" %}:

| Context Horizon | Actual Prompt Tokens | Prefill Speed (`pp`) | Generated Tokens | Decode Speed (`tg`) | MTP Draft Acceptance | Needle Recalled? | VRAM Allocated |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Short (Baseline) | 462 tok | 21.0 t/s | 256 tok | 56.8 t/s | 76.8% | Yes | 11,710 MiB |
| 1k Context | 1,060 tok | 585.5 t/s | 256 tok | 52.7 t/s | 65.6% | Yes | 11,710 MiB |
| 2k Context | 1,966 tok | 1,088.8 t/s | 256 tok | 60.3 t/s | 83.7% | Yes | 11,710 MiB |
| 4k Context | 3,779 tok | 1,690.9 t/s | 256 tok | 53.9 t/s | 72.7% | Yes | 11,710 MiB |
| 7k Context | 7,323 tok | 1,944.3 t/s | 256 tok | 53.8 t/s | 70.1% | Yes | 11,710 MiB |
| 13k Context | 13,338 tok | 1,972.0 t/s | 256 tok | 59.0 t/s | 76.7% | Yes | 11,710 MiB |
| 30k Deep Context | 29,895 tok | 2,004.3 t/s | 512 tok | 53.5 t/s | 72.0% | Yes | 11,710 MiB |
| 60k Frontier Limit | 59,787 tok | 2,013.0 t/s | 512 tok | 53.2 t/s | 73.7% | Yes | 11,710 MiB |

On this setup decode doesn't degrade with depth:

1. Decode speed stays flat: At 59,787 tokens of active prompt context, the engine generated 512 tokens at 53.2 t/s which is virtually identical to the 56.8 t/s short-prompt baseline!
2. Prefill speeds up with length: Because Strata uses 8,192-token chunked prompt evaluation and borrows expert cache slots during prefill, prompt processing accelerates from 585 t/s at 1k to 2,013.0 t/s at 60k tokens. Reading a 60,000-token code repository took just 29.7 seconds!
3. MTP draft acceptance holds up: The speculative draft acceptance rate stayed between 70% and 76% even when attending across 60,000 tokens of prior history.
4. Zero memory creep: VRAM utilization remained pinned at exactly 11,710 MiB from token 1 to token 60,000. I saw no memory creep, which fits Strata's `k8v4` quantized KV cache.
5. 100% Needle Retrieval: The model successfully extracted the hidden passphrase buried at token 30,000 and wrote a coherent technical essay.

{% callout "example", "Takeaway" %}
Deep context didn't hurt the cache here. The hit rate at 60k was 76.5%, higher than the short-context baseline. My guess is that once the conversation's vocabulary is established, expert routing gets *more* predictable, not less.
{% endcallout %}

## Does greedy decoding cause problems?

A fair question from community discussions: do these runtimes lean on greedy decoding (temperature 0, argmax) to get their very high draft acceptance, and does greedy hurt reasoning or cause repetition loops?

I checked this across the 60k suite:

1. Reasoning integrity: in my runs `Qwen3.8-Flash-Next` didn't degrade under greedy decoding. It extracted the security tokens correctly and wrote coherent code. I haven't compared quality against sampled decoding.
2. Speculative synergy: Speculative drafting (both MTP and ngram) thrives under argmax sampling. When temperature is non-zero, draft heads must sample from probability distributions, introducing rejection cascades whenever random seeds diverge. Under argmax, the target model and draft head align deterministically, pushing draft acceptance from ~55% up to 72%–84%.
3. No degeneration loops: the model never entered repetitive loops in my 512-token generation runs.

For agentic coding, refactoring, and review, greedy looks like the right default here, not a compromise.

## What survives

If the future is a churn of disposable runtimes, what sticks around? Nobody wants to relearn a CLI, a web UI, or a client SDK every time a new napkin runtime hits GitHub. My answer: the outer shell standardizes and the runtime underneath becomes a commodity.

### 1. The HTTP API is the stable part
The OpenAI Chat Completions API (`POST /v1/chat/completions`) and Anthropic Messages API (`POST /v1/messages`) are what everything speaks.

Most of these engines expose an OpenAI-compatible endpoint. As long as one does, it plugs into Cursor, Claude Dev, Open WebUI, Aider, and Antigravity.

### 2. Model routers matter more
If you run five different one-off engines tailored for five different models, you cannot manually manage background processes and port assignments.

This is why tools like [`llama-swap`](https://github.com/mostlygeek/llama-swap) and our own [`L3MS`](https://github.com/carteakey/l3ms) supervisor exist. In `llama-swap.yaml`, we define five distinct serving tiers:

- `qwen38-flash-next-plat`: Strata v0.1.30 with dynamic VRAM cache and native MTP (60+ t/s).
- `qwen38-flash-next`: llama.cpp master (Gold tier, 20.8 t/s, 96k context, stability fallback).
- `qwen38-flash-next-vision`: llama.cpp master with `mmproj-F16.gguf` for multimodal image tasks.
- `qwen38-flash-next-mtp`: Experimental Unified QSA Sparsity branch (27 t/s).
- `gemma-4-26b-qat-mtp`: Dense hybrid QAT running in full VRAM (100 t/s).

`llama-swap` sits in front on port 8080. When a client requests `qwen38-flash-next-plat`, `llama-swap` terminates whichever model was previously loaded, spawns the Strata daemon with its exact SM89 flags, proxies the connection, and reaps it after 10 minutes of inactivity.

The user interacts with a single endpoint; the underlying one-off engines swap in and out like swappable cartridge ROMs.

### 3. Hardware-specific communities might form
I'd expect hardware-specific tuning guilds, and I'm only extrapolating here. Instead of broad forums like r/LocalLLaMA, where discussion is spread across MacBooks, dual-3090 rigs, and Raspberry Pis, communities could silo around specific hardware:

- A hypothetical `r/4090And64gbRamLLM`: users hyper-optimizing 70B and 125B MoE weights across 24 GB GDDR6X + 64 GB DDR5.
- A hypothetical `r/appleM2Max32gbLLM`: users trading Metal kernel pipelines tuned for 400 GB/s unified memory busses.
- A hypothetical `r/dual3090NVLink`: the home of FP8 tensor-parallel scratch runtimes.

These guilds might distribute ready-to-run engine binaries, pre-computed expert profiling masks, and placement recipes tuned for their exact motherboard, memory speed, and GPU silicon.

## Can general engines fight back?

I don't think general engines go extinct. Three ways they could win the lead back:

### Scenario 1: The "Plugin-ified" Engine (`.inference_recipe`)
General engines could stop trying to implement monolithic compute graphs and instead adopt a micro-kernel driver model.

Imagine downloading a model: you pull `Qwen3.8-Flash-Next.gguf`, and alongside it you download `rtx4070-ddr5.inference_recipe`. 

The `.inference_recipe` contains the fused CUDA kernels, the expert VRAM allocation mask, and the speculative graph schedule specifically compiled for your card. `llama.cpp` acts merely as a thin, secure runtime host that loads and executes the recipe. As far as I know, projects like Paiton and modular vLLM extensions are experimenting with this.

### Scenario 2: Autonomous AI Maintenance of Upstream Engines
If AI coding agents can write one-off engines, they can also be deployed by upstream maintainers to maintain hundreds of specialized hardware targets inside a single repository.

An autonomous bot swarm could continuously monitor PRs in `llama.cpp`, automatically generating and verifying hardware-specialized kernel variants for every compute capability (SM75, SM80, SM86, SM89, SM90) without human maintainers having to hand-craft every permutation.

### Scenario 3: Compilers Finally Fulfill the Dream (Mojo / MLIR / Triton)
For decades, compiler theorists have promised that high-level intermediate representations (IR) would eliminate the need for hand-written assembly kernels.

If technologies like Modular's Mojo/MAX, OpenAI's Triton, or MLIR mature to the point where an optimizing compiler can inspect a high-level graph, analyze the target machine's cache line widths and memory bus latency, and synthesize mathematically optimal machine code automatically, then one-off engines will become obsolete overnight.

Until a compiler does that, a human or agent writing an overfit C++/CUDA engine for one GPU will likely keep beating compiler output.

## Don't marry your inference engine

For two years, the conventional playbook for running local LLMs was simple: install `llama.cpp` or pull a Docker container for `vLLM`, configure your context size, and offload as many layers as your VRAM could hold.

That playbook is wearing out. When a napkin runtime written for one model and one GPU takes decode from 20 t/s to 60+, prefill to 2,013 t/s, and holds those numbers flat across 60,000 tokens of context, the generality tax gets hard to justify.

Don't fall in love with your inference engine. Don't expect it to support next year's models, and don't expect it to run on your laptop if it was built for your desktop.

Treat inference engines like disposable spark plugs: screw them into your serving shell, run them at redline for six months, and toss them when the next model needs a new one.

The era of the one-off engine is here, at least for a 12 GB card and one model.

## Changelog

| Date | Note |
| --- | --- |
| 2026-10-01 | Corrected the bandwidth arithmetic and removed the double-counted cache and MTP gain, aligned the hardware specs, linked all six engines, hedged the unsourced claims, moved the IQ3_S and NAS-archive notes to the Flash-Next post, and tightened the prose. |
| 2026-09-30 | Initial post. |
