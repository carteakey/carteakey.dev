---
title: "Strata on an RTX 4070: 75 tok/s from a 176B Model at 128k Context"
description: "75 tok/s with a 128k context window on a 12 GB RTX 4070: how I run it, how the expert cache works, and what's unproven."
image: /img/blog-sketches/unique/strata-on-an-rtx-4070-stamp-trim.png
imageAlt: "Monochrome pencil sketch of a graphics card beside a tray of cached chips, a larger chip pile, a RAM stick, and a stopwatch"
date: 2026-10-03
giscusTerm: "/blog/local-inference/strata-on-an-rtx-4070/"
updated: 2026-10-18
authored_by: ai-assisted
draft: true
tags:
  - AI
  - Self-Host
---

{% update "2026-10-18", "October 2026 Update: 74.8 tok/s at 128k Context with Q8_0 PLE & DDR5-5800" %}
Since my initial 53.2 tok/s run, three changes pushed Strata to **74.8 tok/s** with a preallocated **128k context window** on this exact same 12 GB card. Upgrading Strata and clocking my dual-channel RAM to DDR5-5800 lifted steady code generation to 65.8 tok/s. Swapping the NVMe-mapped n-gram table shard from IQ4_NL to uncompressed Q8_0 cost zero extra VRAM and jumped steady decode to **74.8 tok/s on text** (and 73.3 tok/s on vision), because cleaner embeddings raised speculative draft acceptance to 78.2%. Finally, enforcing official Thinking Mode sampling server-side instead of greedy decoding costs under 5% decode speed while stopping `<think>` repetition loops.
{% endupdate %}

## Where I was

Earlier this week I thought the local inference stack on {% device "yeti-cachy" %} had hit its ceiling.

I'd squeezed [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/) (a sparse MoE paired with a giant n-gram lookup table on NVMe) up to 20.8 tok/s on upstream llama.cpp master, and 27.1 tok/s with an experimental MTP draft branch and NVMe row prefetching.

Then I booted [Strata](https://github.com/Niko1221/Strata):

```text
strata serve:
  prompt: 59787 tokens (0 reused, 59787 read)
  prefill: 29701 ms (2013.0 tok/s)
  generated: 512 tokens in 9631 ms (53.2 tok/s)
  drafts accepted: 244 of 331
  decode expert cache hit rate: 73.8%
    (174835 hits / 236824 lookups)
```

Same card, same box, with a 128k KV cache preallocated and a 60k-token prompt loaded: **53.2 tok/s decode** and **2,013 tok/s prefill** out of the box, climbing to **74.8 tok/s** on regular coding sessions after my October tuning. Here's how I run it in Strata, how its per-expert memory cache works, how greedy decoding compares against real Thinking Mode sampling, and what I still can't conclude. The broader argument about why single-model engines like this are showing up is in the companion essay, [The Rise of Overfit Inference Engines](/blog/local-inference/the-rise-of-overfit-inference-engines/).

## The headline numbers

Against my best llama.cpp setup, Strata is **more than twice as fast** in sustained decode out of the box, and **nearly 3.6× faster** once the n-gram table is swapped to full precision:

| Strata setup (128k KV preallocated) | Decode (tok/s) | vs llama.cpp master (20.8) | vs llama.cpp MTP (27.06) |
| --- | ---: | ---: | ---: |
| 60k-context sweep (IQ4_NL PLE) | 53.2 | 2.6× | 2.0× |
| Sustained code (DDR5-5600, IQ4_NL PLE) | 62.2 | 3.0× | 2.3× |
| Sustained code (DDR5-5800, IQ4_NL PLE) | 65.8 | 3.2× | 2.4× |
| **Full Q8_0 PLE (DDR5-5800)** | **74.8** | **3.6×** | **2.8×** |

Context length makes that gap even wider in practice. Both llama.cpp baselines were recorded on short prompts, and the llama.cpp MTP setup drops below plain master once you widen the context window past 16k. Strata preallocates the full 128k `k8v4` KV cache in VRAM at startup, and its 53.2 tok/s sweep run had nearly sixty thousand tokens actively sitting in context.

One important caveat to keep in mind throughout this post: **Strata and llama.cpp aren't running the same quantization**. Strata runs ISTA-DASLab's 3-bit IQ3_XXS build while my llama.cpp baseline uses AtomicChat's 4.27-bit build, so they don't move the same number of bytes per token and won't produce identical outputs. This is a comparison of two complete serving setups, not a single-variable test.

{% diagram_card {
  src: "./src/static/img/diagrams/qwen38-flash-next-throughput-comparison.png",
  alt: "Bar chart of decode throughput on an RTX 4070 12GB: llama.cpp master 20.8 tok/s, llama.cpp MTP V2 27.06, Strata at 60k context 53.2, DDR5-5800 65.8, Full Q8_0 PLE 74.8, 4070-main-lite fork on stable DDR5-5200 at 69.6, and --kv-grow on stable DDR5-5200 at 73.5 tok/s.",
  kicker: "Decode · RTX 4070 12GB + 64GB DDR5",
  title: "Measured Serving Setups",
  badge: "20.8 → 74.8 tok/s",
  caption: "Comparing serving setups and fork checkpoints. After reverting from DDR5-5800 to stock DDR5-5200 for stability, the lean 4070 fork reaches 69.6 t/s with the calibrated sm_89 MMVQ table, and --kv-grow reaches 73.5 t/s with a 3,277-slot cache."
} %}

## How to run it in Strata

All tests ran on {% device "yeti-cachy" %} under CachyOS with the CPU governor set to `performance`.

| Setting | Strata | llama.cpp baseline | llama.cpp MTP |
| --- | --- | --- | --- |
| Engine version | Strata (`30ec18e` through v0.1.44.1) | master (`b11241`) | QSA Stack V2 (`b11268` + #28243) |
| Weights | [ISTA-DASLab GSQ-RCO IQ3_XXS](https://huggingface.co/ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF) (3.00 bpw) | AtomicChat AD-4.27bpw | AtomicChat AD-4.27bpw + shared-Q4_K_M head |
| KV cache | k8v4, 128k preallocated | q8_0 / q8_0, 96k | q8_0 / q8_0, 16k |
| Expert placement | Dynamic per-expert VRAM cache (3,086 experts) | `--fit on --fit-target 512` (4 layers) | `-ngl 99 -ncmoe 46` (2 layers) |

### 1. What files you need

Strata splits the model across three pieces:
- **Shard 1 and the packed expert cache** from [ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF](https://huggingface.co/ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF), holding the transformer backbone and routed MoE experts.
- **Shard 2**, the isolated n-gram PLE table (either the default IQ4_NL shard or the uncompressed Q8_0 shard for the 74.8 tok/s setup).
- **The MTP runtime and `expert-profile.bin`**, which provide the native multi-token prediction draft head and the initial expert routing frequency profile.

### 2. Engine command & flags

In my [l3ms](https://github.com/carteakey/l3ms) setup, the OpenAI-compatible Python wrapper starts Strata from a JSON config:

```sh
vendor/strata/.venv/bin/python vendor/strata/serve/server.py \
  --engine strata --config vendor/strata/strata-iq3_xxs.json
```

Under the hood, that launches the Strata binary with these flags:

```sh
engine/strata \
  --pack PACK_IQ3_XXS \
  --native GSQ_RCO_SHARD_1 \
  --ple-gguf GSQ_RCO_SHARD_2 \
  --expert-profile data/expert-profile.bin \
  --expert-cache auto \
  --prefill auto \
  --spec 4 --spec-min-p 0.5 \
  --mtp MTP_RUNTIME_DIR \
  --max-context 131072 \
  --kv k8v4
```

Here's what those flags actually do:
- `--expert-cache auto` and `--expert-profile` seed VRAM with the hottest experts across all layers and adapt residency online while you chat.
- `--ple-gguf` memory-maps Shard 2 straight from NVMe so the n-gram table doesn't touch GPU VRAM.
- `--kv k8v4 --max-context 131072` quantizes keys to 8-bit and values to 4-bit, preallocating a full 128k context window inside the card's VRAM budget.
- `--spec 4 --mtp` runs the model's native MTP head in VRAM to verify up to three draft tokens in a single forward pass.

Also keep in mind that Strata is a young solo-developer project that pins host RAM and runs custom CUDA kernels. I build it from a local source checkout rather than running a downloaded binary as an opaque appliance. If you try it, pin a commit hash and read the diff before updating.

## How Strata lays out memory (vs `llama.cpp`)

On a 12 GB card, llama.cpp can't fit the routed experts in VRAM, so it offloads by whole layers: it keeps attention, shared weights, the KV cache, and a couple of MoE layers on the GPU, and leaves the rest of the layers in system RAM. For those CPU layers, llama.cpp runs the expert matrix multiplications on the CPU against DDR5 and synchronizes activations across PCIe at every layer.

Instead of deciding which *layers* live on the GPU, **Strata decides which individual experts do**, drawing from all 48 layers:

| Tier | Size | Bandwidth | What lives there |
| --- | --- | --- | --- |
| RTX 4070 VRAM | 12 GB (11,710 MiB used) | 504 GB/s | 3,086 hot experts (5.04 GiB), attention/dense weights, MTP head (876 MiB), k8v4 KV cache (128k) |
| DDR5 host RAM | 64 GB | ~75 GB/s theoretical | Full 24,576-expert arena (39.97 GiB) in pinned host memory |
| NVMe SSD | 2 TB | 5.15 GB/s sequential | 51.2B n-gram table (28.8 GB IQ4_NL or 54.4 GB Q8_0), read lazily via mmap (~5 KB/token) |

{% image_cc "./src/static/img/diagrams/overfit-memory-hierarchy-corrected.png", "Three memory tiers: RTX 4070 VRAM for cached experts and GPU state; DDR5 for the full host expert arena and CPU miss work; SN770 SSD for the mmap n-gram table. PCIe carries activations, selected miss work, and cache refills.", "sketch-draw", "Capacity and placement across the three memory tiers." %}

That works because MoE routing isn't uniform. Caching just 13% of the total experts in VRAM covers **roughly three-quarters of all expert lookups**. Residency starts from the offline frequency ranking in `expert-profile.bin`, and then adapts online: every four verification rounds, Strata decays its usage counts and swaps colder resident experts for hotter missing ones from the same layer.

### What a 75% cache hit rate actually means

A common misconception is that a 75% cache hit rate means three out of four tokens run purely on the GPU. It doesn't.

Because Qwen routes ten experts per layer across all 48 layers, every single token requires **480 individual expert lookups** (roughly 800 MiB of expert weights). A 75% hit rate means about 360 of those lookups happen directly in fast VRAM, while the remaining ~120 misses fall back to host DDR5. Almost every token still touches the CPU - it just moves about a quarter of the weight bytes it used to, while Strata overlaps CPU worker threads and async PCIe streaming with GPU compute.

Watch your host RAM headroom, though. The pinned arena in DDR5 holds the full copy of every expert (the hot set in VRAM is a duplicate), and the page-cached n-gram rows bring total host memory in use to **52.5 GB** during real tool calls, leaving about 11.5 GB for the OS and desktop.

{% image_cc "./src/static/img/local-inference/strata-qwen38-flash-next-dashboard.png", "Live Strata runtime telemetry dashboard running Qwen3.8-Flash-Next on an NVIDIA GeForce RTX 4070 with 12GB VRAM", "w-full border border-surface-border my-6", "Live Strata telemetry on the RTX 4070: 67.6 tok/s decode, 1,959 tok/s prefill, 3,086 experts cached in VRAM (5.0 GB), and 52.5 GB of host RAM in use during a real agentic session." %}

## Does it hold up at 128k context?

Short-prompt benchmarks are easy to fake, so I wrote a long-context harness (saved in the [sanitized evidence extract](/blog/local-inference/overfit-inference-evidence.json)) that sweeps from a few hundred tokens up to 60k inside the preallocated 128k KV window. It repeats synthetic technical prose, hides a passcode near the middle, and asks the model to retrieve the passcode and analyze memory-mapped I/O and speculative decoding:

{% wide %}
| Prompt tokens | Prefill (tok/s) | Generated | Decode (tok/s) | Draft acceptance | Hit rate | Passcode found | VRAM |
| ---: | ---: | ---: | ---: | ---: | ---: | :--- | ---: |
| 462 (reused prefix) | excluded | 256 | 56.8 | 76.8% | 74.1% | Yes | 11,710 MiB |
| 1,060 | 585.5 | 256 | 52.7 | 65.6% | 72.8% | Yes | 11,710 MiB |
| 1,966 | 1,088.8 | 256 | 60.3 | 83.7% | 73.1% | Yes | 11,710 MiB |
| 3,779 | 1,690.9 | 256 | 53.9 | 72.7% | 74.4% | **No** | 11,710 MiB |
| 7,323 | 1,944.3 | 256 | 53.8 | 70.1% | 71.8% | Yes | 11,710 MiB |
| 10,709 | 1,809.2 | 256 | 55.5 | 76.6% | 74.1% | Yes | 11,710 MiB |
| 13,338 | 1,972.0 | 256 | 59.0 | 76.7% | 77.1% | Yes | 11,710 MiB |
| 29,895 | 2,004.3 | 512 | 53.5 | 72.0% | 76.5% | Not saved | 11,710 MiB |
| 59,787 | 2,013.0 | 512 | 53.2 | 73.7% | 73.8% | Not saved | 11,710 MiB |
{% endwide %}

Decode stays remarkably flat across the entire sweep, and VRAM never budges because the 128k KV cache is preallocated at startup. Prefill actually speeds up on longer prompts because Strata evaluates context in 8,192-token chunks, climbing to **over 2,000 tok/s** by the end of the sweep (reading the full 60k prompt in under 30 seconds).

My earlier guess that the expert cache hit rate would climb as a conversation's vocabulary settled didn't pan out here - the hit rate at 60k is slightly below the first row's.

## Greedy decoding vs Thinking Mode sampling

All of my initial context-sweep numbers above were recorded at temperature 0. That flatters speculative decoding, and it's worth understanding why before you copy a benchmark setup into daily coding use.

Under greedy decoding, a draft token is accepted only if it matches the main model's single top pick. That sounds strict, but when the drafts come from the model's own trained MTP head on deterministic code or technical prose, they match that top pick constantly.

Once you turn on non-zero temperature, [exact speculative sampling](https://arxiv.org/abs/2211.17192) uses rejection sampling to keep the output distribution mathematically identical to running the main model alone. A draft token is accepted with probability tied to how closely the draft and main-model distributions overlap. Widening the sampling distribution lowers that overlap and rejects more draft tokens, while running purely greedy on a reasoning model risks getting trapped in repetitive loops inside thinking blocks.

To measure the real cost of proper sampling, I ran a head-to-head on a standardized four-prompt coding and reasoning harness comparing greedy decoding against Qwen's official Thinking Mode sampling (temperature 1.0, top-p 0.95, top-k 20, min-p 0.0):

| Decoding Mode | Steady Decode | MTP Draft Acceptance | Reasoning Behavior |
| :--- | :---: | :---: | :--- |
| **Greedy (temp 0)** | 57.3 tok/s | 68.9% | Prone to repetition loops inside `<think>` |
| **Thinking Mode (temp 1.0, IQ4_NL PLE)** | 54.5 tok/s | 55.7% | Clean reasoning chains (-4.9% speed cost) |
| **Thinking Mode (temp 1.0, Full Q8_0 PLE)** | **74.8 tok/s** | **78.2%** | Clean reasoning + higher draft agreement |

Two takeaways stood out from that test:
1. **Proper sampling only costs ~4.9% throughput** (2.8 tok/s), caused entirely by draft acceptance dropping from 68.9% to 55.7% against the wider stochastic distribution. Because Strata defaults to greedy whenever an API client omits sampling parameters, I enforce the Thinking Mode sampling block server-side in `strata-iq3_xxs.json`.
2. **Swapping the n-gram PLE shard on NVMe from IQ4_NL to uncompressed Q8_0 more than makes up for it.** Cleaner per-layer n-gram embeddings keep the main model and the MTP draft head aligned even under temperature 1.0, pushing MTP draft acceptance up to **78.2%** and lifting steady decode to **74.8 tok/s** with zero extra VRAM.

{% callout "note", "What this does not prove yet" %}
- **Different quants:** Part of Strata's speed comes from moving 3-bit weights instead of 4.27-bit weights. Both passed my five-question coding and math smoke test, and [Strata's upstream cache-parity test](https://github.com/Niko1221/Strata/blob/30ec18ec7094550fcc594fd948220d511d80464e/bench/results/2026-09-27-cache-parity/README.md) reports high top-1 agreement on an RTX 5070, but I haven't run a matched perplexity or KL-divergence test across both engines yet.
- **No cache-only ablation:** Because Strata's packed path requires `--spec` enabled, I can't turn MTP and prompt-lookup speculation off to isolate how much of the speedup comes purely from the expert cache versus speculation.
- **Synthetic long-context harness:** Each row in the table is a single run on repeated filler text, and one mid-length row missed its passcode check.

What it does show: on this exact card, Strata serves a 176B model at 53 to 75 tok/s with a 128k context window preallocated, and doesn't fall off a cliff at 60k tokens.
{% endcallout %}

## Changelog

| Date | Note |
| --- | --- |
| 2026-10-18 | Added DDR5-5800 scaling (65.8 tok/s) and uncompressed Q8_0 PLE on NVMe (74.8 tok/s text, 73.3 tok/s vision, 0 MiB extra VRAM). |
| 2026-10-16 | Measured Thinking Mode sampling vs greedy decoding (57.3 → 54.5 tok/s, -4.9% penalty) and enforced sampling defaults server-side. |
| 2026-10-14 | Refreshed to Strata v0.1.44.1 (62.2 tok/s steady decode, 1,992 tok/s 8k prefill on IQ3_XXS). |
| 2026-10-07 | Benchmarked Strata v0.1.40.2 (56.1 tok/s) against upstream llama.cpp native MTP and MoE LRU cache (23.9 tok/s) on the same IQ3_XXS quant. |
| 2026-10-03 | Split the technical Strata benchmarks, memory layout, and 60k context sweep out from [The Rise of Overfit Inference Engines](/blog/local-inference/the-rise-of-overfit-inference-engines/). |
| 2026-09-30 | Initial measurements published in the overfit inference engines essay. |
