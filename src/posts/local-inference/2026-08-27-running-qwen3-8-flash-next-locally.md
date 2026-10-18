---
title: Running Qwen3.8-Flash-Next locally on a 12GB VRAM card (yes, the 176B one)
description: "The 51B n-gram table on SSD via lazy mmap: 27 tok/s with MTP and up to 96k context on an RTX 4070 + 64 GB RAM."
image: /img/blog-sketches/unique/running-qwen3-8-flash-next-locally-stamp-trim.png
imageAlt: Transparent monochrome sketch of a GPU offloading to an NVMe SSD drive next to a token speed gauge and architecture notebook
date: 2026-08-27
updated: 2026-10-18
authored_by: ai-assisted
draft: true
hidden: false
giscusTerm: "/blog/running-qwen3-8-flash-next-locally/"
tags:
  - AI
  - Self-Host
pinned: false
ogImage: /img/og/running-qwen3-8-flash-next-locally-og.png
---

{% update "2026-10-18", "October 2026 Update: 74.8 tok/s on Strata with Q8_0 PLE & DDR5-5800" %}
I originally wrote this post for **`llama.cpp`**, which topped out at 20.5 - 27.1 tok/s on my RTX 4070. Since then, I've moved my daily serving to **Strata**, whose dynamic expert cache (keeping the hottest experts in VRAM across all layers) pushed steady decode past 60 tok/s. Overclocking my RAM to DDR5-5800 and swapping the NVMe-mapped n-gram table to uncompressed Q8_0 (at zero extra VRAM cost) brought steady decode to **74.8 tok/s on text** and 73.3 tok/s on vision, with 2,013 tok/s prefill.

If you want to run this model in Strata, see **[Strata on an RTX 4070](/blog/local-inference/strata-on-an-rtx-4070/)** (and the companion essay, [The Rise of Overfit Inference Engines](/blog/local-inference/the-rise-of-overfit-inference-engines/)). For the `Q8_0` n-gram table trick that applies to both engines, jump to the [full Q8_0 PLE section](#full-precision-q8_0-ple-faster-decode-for-zero-vram) below.
{% endupdate %}

Qwen3.8-Flash-Next (the preview of the Qwen4 architecture) is a 125B MoE with about 6B active parameters per token, paired with a **51B n-gram lookup table**. That table isn't standard transformer weights - it's hashed 3-token lookups into a giant embedding, so it doesn't need to sit in RAM at all. Because of that one property, an 88 GB model runs comfortably on my desktop with a 12 GB RTX 4070 and 64 GB of DDR5, climbing from 20.5 tok/s on stock llama.cpp up to **74.8 tok/s on Strata**.

Here's which quant to grab, how I build and run it in `llama.cpp`, where the memory actually goes, and which tuning levers mattered on my box. (For how to run it in Strata and how its dynamic expert cache works, see [Strata on an RTX 4070](/blog/local-inference/strata-on-an-rtx-4070/).)

{% diagram_card {
  src: "./src/static/img/diagrams/qwen38-flash-next-throughput-progression.png",
  alt: "Line chart of Qwen3.8-Flash-Next decode throughput on an RTX 4070 12GB in tokens per second across runtime steps: Powersave 6.5, CPU governor 12.2, SSD mmap 15.2, q8 KV plus fit 18.9, master 19.35, MTP V1 20.65, MTP V2 27.06, Strata dynamic cache 60.3, DDR5-5800 65.8, Full Q8_0 PLE 74.8",
  kicker: "Performance Evolution · RTX 4070 12GB + 64GB DDR5",
  title: "Qwen3.8-Flash-Next Decode Throughput Progression",
  badge: "6.5 → 74.8 tok/s steady (+1,050% leap)",
  caption: "<strong>Progression:</strong> Powersave (6.5) → CPU governor (12.2) → lazy mmap offload (15.2) → q8_0 KV and dynamic layer fitting (18.9) → upstream master refresh (19.35) → compact MTP (20.65) → QSA Sparsity Stack V2 MTP (27.06) → Strata dynamic cache (60.3) → DDR5-5800 tuning (65.8) → Full Q8_0 PLE (<strong>74.8 t/s</strong> steady)."
} %}

## TL;DR

I use [ISTA-DASLab's GSQ-RCO IQ3_XXS](https://huggingface.co/ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF) for Strata, and [AtomicChat's AD-4.27bpw](https://huggingface.co/AtomicChat/Qwen3.8-Flash-Next-GGUF) for llama.cpp. Both builds isolate the 51B n-gram table into Shard 2 so it can stay on NVMe.

On my RTX 4070 (12 GB) + 64 GB DDR5 box:
- **Strata** (dynamic expert cache + native MTP) hits **74.8 tok/s steady decode** with the Q8_0 PLE table (65.8 tok/s with the default IQ4_NL PLE), and over 2,000 tok/s prefill.
- **llama.cpp + MTP draft stack** reaches **27.1 tok/s** at 16k context using the compact Q4_K_M draft head and [NVMe row prefetching](https://github.com/ggml-org/llama.cpp/pull/29599).
- **llama.cpp plain master** runs at **20.5 - 22.1 tok/s** decode and up to 385 tok/s prefill, scaling cleanly to **96k context** (and 18.4 tok/s with the F16 vision projector).

One rule flips my usual advice on its head: **leave `mmap` on**. Lazy paging is the offload mechanism here. Passing `--no-mmap --mlock` on a 64 GB machine will crash immediately. Cold boots start slow on the very first prompt while hot expert pages fault into RAM, then settle into full speed.

{% callout "note", "Live Leaderboard & Reproduction Scripts" %}
My homelab leaderboard at [l3ms.carteakey.dev](https://l3ms.carteakey.dev/) tracks these setups alongside every other model I run on this machine. All serving configs and benchmark scripts live in the [l3ms repository](https://github.com/carteakey/l3ms).
{% endcallout %}

## Why this quant?

Out of the model's 176B parameters, the 51B n-gram table only reads a few kilobytes per token out of a huge address space. An NVMe SSD answers those tiny random reads in microseconds. The routed MoE experts are the opposite: each token touches hundreds of megabytes of expert weights, which is hopeless from disk.

So the model naturally splits across three storage tiers:
1. **VRAM** holds attention, shared weights, the KV cache, and as many hot experts or layers as fit.
2. **System RAM** holds the remaining routed MoE experts.
3. **NVMe SSD** holds the entire 51B n-gram table (`per_layer_token_embd.weight`).

For that split to work without eating your RAM, the n-gram table has to live in its own GGUF shard. Both ISTA-DASLab and AtomicChat put the table alone in Shard 2, so the Linux kernel can memory-map it straight from NVMe without pulling it into memory. Unsloth's quants interleave the table across weight shards, which forces the whole file into RAM unless you repack it yourself.

## Quant ladder (what fits where)

Here's how the published quants fit on a 12 GB VRAM + 64 GB RAM box, sorted by the fast-memory backbone (what actually has to sit in RAM and VRAM after leaving the n-gram shard on SSD):

| Publisher | Quant | File (GiB) | Backbone (GiB) | Fits 12GB VRAM + 64GB RAM? |
| --- | --- | ---: | ---: | --- |
| **ISTA-DASLab** | **GSQ-RCO-Coder IQ1_M** | **54.4** | **27.6** | **yes, easily (fits 262k context)** |
| unsloth | UD-IQ1_S | 67.6 | 50.7 | yes, snug |
| unsloth | UD-IQ1_M | 69.4 | 52.0 | yes, snug |
| **ISTA-DASLab** | **GSQ-RCO IQ3_XXS** | **70.6** | **43.8** | **yes - active Strata default (~43 GB RAM + 5 GB VRAM)** |
| unsloth | UD-Q2_K_XL | 73.5 | 55.1 | yes |
| unsloth | UD-IQ3_XXS | 76.3 | 57.2 | yes |
| **ISTA-DASLab** | **GSQ-RCO IQ3_S** | **77.9** | **51.0** | **yes, comfortably (near BF16 parity)** |
| unsloth | UD-Q3_K_XL | 83.8 | 62.9 | tight (paging risk) |
| AtomicChat | AD-3.84bpw-IQ4_XS-M64 | 84.9 | 45.8 | **yes, comfortably** |
| unsloth | UD-IQ4_XS | 87.2 | 65.4 | tight (paging risk) |
| **AtomicChat** | **AD-4.27bpw-Q4_K_M-M64** | **88.0** | **54.5** | **yes - llama.cpp baseline** |
| unsloth | UD-Q4_K_XL | 103.7 | 77.8 | no |
| AtomicChat | AD-5.00bpw-Q5_K_M-M64 | 110.5 | 56.1 | borderline |
| ggml-org (official) | Q8_0 (BF16→) | ~180+ | n/a | reference only |

If you're choosing between them, ISTA-DASLab's IQ3_XXS is the sweet spot for 64 GB of RAM. It assigns bit precision per layer based on gradient sensitivity, matching AtomicChat's 4.27-bit quality while shaving over 10 GB off the RAM footprint. Even better, Shard 2 (the 26.8 GiB n-gram table) is byte-for-byte identical across ISTA-DASLab's IQ3_XXS, IQ3_S, and Coder IQ1_M builds, so you can hardlink Shard 2 across variants and save 27 GB of disk space per extra model.

### Where the memory actually goes (AtomicChat 88 GiB config)

| Tier | Contents | GiB |
| --- | --- | ---: |
| File | whole AD-4.27bpw quant | 88.0 |
| VRAM | dense/attention ~4.4 + last 2 expert layers ~2.0 + q8 KV (64k) ~0.6 + compute ~1.6 | 10.0 |
| RAM (RSS) | 46 host expert layers ~44.6 + token-embd/output ~1.2 (file-backed, evictable) | 45.6 |
| SSD | 88.0 − 10.0 − 45.6 | **32.4** |

Only the n-gram embedding table stays on SSD on purpose. The 46 host expert layers sit in file-backed RAM pages that the Linux kernel will only evict if desktop apps eat your remaining memory. If generation speed suddenly halves mid-session, check `free -g` first.

## Build & Download

All architecture support, lazy tensor reads, and fused MoE reductions are in upstream llama.cpp master. A standard CUDA build works out of the box:

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
cmake -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DGGML_CUDA=ON \
  -DLLAMA_CURL=ON \
  -DBUILD_SHARED_LIBS=OFF \
  -DGGML_NATIVE=ON \
  -DGGML_CUDA_GRAPHS=ON \
  -DGGML_CUDA_FA_ALL_QUANTS=ON \
  -DCMAKE_CUDA_ARCHITECTURES=89
cmake --build build --config Release --target llama-server llama-bench --parallel
```

After downloading, you can verify that Shard 2 holds only the isolated n-gram table with a quick check:

```bash
python3 - <<'EOF'
from gguf import GGUFReader
r = GGUFReader("Qwen3.8-Flash-Next-AD-4.27bpw-Q4_K_M-M64-00002-of-00033.gguf")
print([t.name for t in r.tensors])  # -> ['per_layer_token_embd.weight']
EOF
```

> **Easier path**: In [l3ms](https://github.com/carteakey/l3ms), `cargo build --release` wires the CUDA build automatically, and the downloader handles segmented range requests when Hugging Face throttles single streams.

## Run (`llama.cpp`)

```bash
llama-server \
  -m ~/models/qwen38-flash-next/AD-4.27bpw-Q4_K_M-M64/Qwen3.8-Flash-Next-AD-4.27bpw-Q4_K_M-M64-00001-of-00033.gguf \
  --host 127.0.0.1 --port 8014 \
  --fit on --fit-target 512 \
  -c 65536 -b 4096 -ub 2048 \
  -fa on --jinja \
  -ctk q8_0 -ctv q8_0 \
  -t 10 --threads-batch 12 --prio 2 \
  --lazy-mode on \
  --spec-type ngram-mod \
  --spec-ngram-mod-n-match 60 --spec-ngram-mod-n-min 12 --spec-ngram-mod-n-max 24 \
  --temp 1.0 --top-p 0.95 --top-k 20 --min-p 0.0 --no-warmup
```

Four flags do the heavy lifting on a 12 GB card:
- `--fit on --fit-target 512` places dense/attention weights plus as many MoE layers as fit into VRAM while keeping a half-gigabyte safety buffer.
- `-b 4096 -ub 2048` is the prefill lever: a 2,048 micro-batch lets the CPU stream the host expert weights once per 2k prompt instead of twice, jumping prefill past 350 tok/s with no hit to decode.
- `--lazy-mode on` leaves the n-gram table memory-mapped on NVMe so only the rows touched by a token fault into RAM.
- `-ctk q8_0 -ctv q8_0` halves KV cache memory so a 64k window fits cleanly on the GPU. Don't pass `--no-kv-offload` here - moving KV to host RAM tanks PCIe throughput.

## Benchmarks & Tuning Levers

### 1. Upstream `llama.cpp` vs MTP Speculative Decoding

On my 6-task unique prompt suite at 16k context, plain upstream llama.cpp master already beats `ik_llama`, so I dropped `ik_llama` from my setup.

Adding speculative decoding via [Daniel Han's MTP draft-head PR](https://github.com/ggml-org/llama.cpp/pull/28243) and the QSA sparsity stack ([pooled-key indexer cache](https://github.com/ggml-org/llama.cpp/pull/28699), [gather sparse decode](https://github.com/ggml-org/llama.cpp/pull/28213), and [Aman Gupta's NVMe `madvise` row prefetch](https://github.com/ggml-org/llama.cpp/pull/29599)) pushed llama.cpp to **27.1 tok/s**:

| Configuration | Context | MoE on GPU | Draft Head | VRAM Used | Free Headroom | Measured Decode |
|---|---:|---:|---|---:|---:|---:|
| Plain Master (`-ncmoe 46`) | 64k | 2 layers | None | 8,458 MiB | 3,824 MiB | 19.35 t/s |
| Plain Dynamic Fit (`--fit on`) | 64k | 4 layers | None | 10,714 MiB | 512 MiB | 20.50 t/s |
| Vision Master (`mmproj-F16`) | 16k | 3 layers | None | 10,460 MiB | 1,822 MiB | 18.40 t/s |
| MTP `shared-Q8_0` | 16k | 2 layers | 2.60 GB | 11,518 MiB | 764 MiB | 19.65 t/s |
| MTP `shared-Q4_K_M` (V1) | 16k | 3 layers | 1.78 GB | 11,786 MiB | 496 MiB | 20.65 t/s |
| **QSA Stack V2 + MTP `Q4_K_M`** | **16k** | **2 layers** | **1.78 GB** | **11,025 MiB** | **1,257 MiB** | **25.32 - 27.06 t/s** |

Shrinking the draft head from Q8_0 to Q4_K_M freed nearly a gigabyte of VRAM while keeping 98% draft acceptance on code and SQL, leaving enough headroom that desktop Wayland sessions don't trigger OOMs. And asynchronous `madvise` row prefetching eliminated NVMe stalls during cold prompt processing, tripling cold prefill to 135 tok/s.

### 2. The Context Crossover: Why Plain Master Wins Past 16k

While MTP wins on short contexts, sweeping the context window from 16k to 96k on a 12 GB card shows a sharp crossover:

| Context Window | MTP VRAM | MTP Headroom | **MTP Decode (tg)** | **llama.cpp Plain Decode (tg)** | Winner |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **16k** (`-c 16384`) | 11,025 MiB | 1,257 MiB | **25.32 - 27.06 t/s** | 19.68 t/s | **MTP (+33%)** |
| **32k** (`-c 32768`) | 11,380 MiB | 902 MiB | 18.15 - 19.31 t/s | **20.10 t/s** | **Plain (+5%)** |
| **48k** (`-c 49152`) | 11,264 MiB | 934 MiB | 15.88 - 16.77 t/s | **20.65 t/s** | **Plain (+25%)** |
| **64k** (`-c 65536`) | 11,654 MiB | 544 MiB | 17.35 - 19.96 t/s | **20.95 t/s (up to 22.1)** | **Plain (+15%)** |
| **96k** (`-c 98304`) | OOM risk | - | - | **20.5 t/s (11,302 MiB)** | **Plain (Solo)** |

Why does MTP fall behind past 16k? Right now llama.cpp ties `-c` to both the main model and the draft head, so at 48k and 64k the draft head has to attend across the entire wide context window, doubling draft latency. Meanwhile, plain master doesn't carry the draft head at all, so `--fit on` packs four MoE layers into VRAM instead of two and holds a steady 21 tok/s all the way to 96k context.

### 3. Prefill Scaling (`-ub 2048` and P-Core Threads)

Because 45 GiB of CPU-resident expert weights have to stream through RAM once per micro-batch, raising `-ub` from 1024 to 2048 processes a 2k prompt in a single pass instead of two:

| Configuration | ~512 tok (t/s) | ~1024 tok (t/s) | ~2048 tok (t/s) | Mean PP (t/s) | VRAM (MiB) |
|---|---:|---:|---:|---:|---:|
| Master `-ncmoe 46`, ub 1024, tb 12 | 205.7 | 241.1 | 285.8 | 244.2 | 9,052 |
| Master `--fit on`, ub 1024, tb 12 | 217.6 | 250.3 | 282.3 | 250.1 | 11,508 |
| **Master `-ncmoe 45`, ub 2048, tb 12** | **201.4** | **303.1** | **356.8** | **287.1** | **10,798** |
| Master `-ncmoe 45`, ub 1024, tb 16 (all cores) | 220.6 | 240.3 | 272.0 | 244.3 | 10,190 |

Keep `--threads-batch 12` to match the six P-cores (12 hyperthreads) on the i5-12600K. Spilling batch threads onto the four slower E-cores slows prefill down from synchronization jitter.

### 4. The CPU Governor & DDR5 Clock Speed

The single biggest llama.cpp decode jump wasn't a model flag. Under Linux's default `powersave` governor, my P-cores sat around 81% clock and decode crawled at 6.5 tok/s. Switching to `performance` (`powerprofilesctl set performance`) with `-t 10` nearly doubled decode to 12.2 tok/s before I touched anything else.

Host memory bandwidth shows up just as directly on Strata. Pushing my dual-channel DDR5 from 5600 to 5800 MT/s lifted my steady-state decode floor above 65 tok/s on real code:

| Memory Clock | Steady Decode (tg) | Probe Range | 8k Prefill (pp) | 16k Prefill (pp) | Stability |
| :--- | :---: | :---: | :---: | :---: | :---: |
| DDR5-5600 Baseline | 62.20 t/s | 59.6 - 64.8 t/s | 996 - 1,012 t/s | 1,992 t/s | Pass |
| **DDR5-5800** | **65.80 t/s** | **65.1 - 66.5 t/s** | 926 - 947 t/s | 1,885 t/s | Pass |

## Full-precision Q8_0 PLE: Faster decode for zero VRAM

In the standard community quants, the 51.2B Per-Layer Embedding (PLE) n-gram table ships quantized to IQ4_NL (28.8 GB), which introduces noticeable reconstruction error in the early layers.

I swapped Shard 2 for the uncompressed **Q8_0 PLE table (54.4 GB)** alongside the IQ3_XXS expert backbone. Because that shard stays memory-mapped on NVMe, it costs zero extra GPU VRAM. I expected a slight slowdown from reading larger rows off SSD, but it ran **31.7% faster** instead:

| Benchmark Dimension | Shipped Baseline (`IQ4_NL` PLE) | Full-Precision (`Q8_0` PLE) | Impact |
| :--- | :---: | :---: | :--- |
| PLE Table Size (Shard 2) | 28.8 GB | 54.4 GB | +25.6 GB NVMe disk space |
| GPU VRAM Overhead | 0 MiB | 0 MiB | Zero VRAM cost |
| Strata Text Decode (Steady) | 56.8 tok/s | **74.8 tok/s** | **+31.7% speedup** |
| Strata Multimodal Vision Decode | 68.0 tok/s | **73.3 tok/s** | +7.8% speedup |
| MTP Draft Acceptance | 72.1% | **78.2%** | +6.1% higher draft acceptance |
| llama.cpp Master Decode | 8.45 tok/s (cold) | **20.54 tok/s** | 2.43× faster once cached |
| Generated CDN Links / Three.js | Broken 404 URLs | Working URLs + full bloom pass | Eliminates mangled URLs |

Two things explain why a larger file runs faster here. First, cleaner embeddings sharpen the draft logits, lifting MTP draft acceptance from 72% to 78% so more tokens pass verification on each step. Second, IQ4_NL requires non-linear 16-entry lookup tables on the CPU, whereas Q8_0 unpacks with a single linear AVX2 multiply-scale at memory line rate.

## Next tier: IQ3_S, and 27B vs Flash-Next

With Strata running at 65 - 75 tok/s on IQ3_XXS, I also keep ISTA-DASLab's IQ3_S build (with a hardlinked Shard 2) on local SSD when I want to trade a bit of DDR5 miss bandwidth for near-BF16 routing precision.

If you're deciding between this model and its smaller dense sibling, I broke out the head-to-head benchmarks, memory trade-offs, and decision tree into a separate post: [Qwen3.8-27B vs Qwen3.8-Flash-Next - Which One to Run Locally?](/blog/local-inference/qwen3-8-27b-vs-flash-next/).

## What did NOT help (and why)

- **Manual `-ot 'exps=CPU'` overrides**: fights `-ncmoe` so zero expert layers land on the GPU, dropping decode to 4 tok/s. Let `--fit` or `-ncmoe` handle placement.
- **`-ngl 99` by itself**: tries to allocate all 52 GiB of experts onto the 12 GB GPU and crashes immediately with `cudaMalloc failed`.
- **Turning off lazy mode**: faults the entire 36 GiB n-gram table into RAM up front, thrashing against the host experts.
- **`--no-mmap --mlock`**: my default reflex on smaller models, and a guaranteed crash when the file is 88 GiB and you only have 64 GB of RAM.
- **128k context on stock llama.cpp**: only fits by moving the KV cache to host RAM, which craters decode down to 5.8 tok/s. Use Strata if you need 128k.

## Changelog

| Date | Note |
| --- | --- |
| 2026-10-18 | Added DDR5-5800 scaling (65.8 tok/s) and uncompressed Q8_0 PLE on NVMe (74.8 tok/s text, 73.3 tok/s vision, 0 MiB extra VRAM). |
| 2026-10-14 | Updated Strata to v0.1.44.1 (62.2 tok/s steady) and added ISTA-DASLab GSQ-RCO quants to the quant ladder. |
| 2026-10-07 | Benchmarked upstream llama.cpp native MTP, MoE LRU cache, and Strata v0.1.40.2. |
| 2026-09-29 | Added QSA Sparsity Stack V2 results (27.1 tok/s MTP at 16k, 135 tok/s cold prefill) and the context crossover table. |
| 2026-09-14 | Added multimodal vision config and compact Q4_K_M MTP draft head benchmarks. |
| 2026-08-31 | Split the 27B vs Flash-Next head-to-head comparison into its own post. |
| 2026-08-27 | Initial post: AtomicChat AD-4.27bpw, Shard 2 NVMe mmap offload, power governor fix, and `-ub 2048` prefill tuning. |

## References

- [ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF](https://huggingface.co/ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF) (IQ3_XXS, IQ3_S, Coder IQ1_M)
- [AtomicChat/Qwen3.8-Flash-Next-GGUF](https://huggingface.co/AtomicChat/Qwen3.8-Flash-Next-GGUF) (AD-4.27bpw-Q4_K_M-M64)
- [Qwen/Qwen3.8-Flash-Next](https://huggingface.co/Qwen/Qwen3.8-Flash-Next) (base model card)
- [Strata inference engine](https://github.com/Niko1221/Strata) & [The Rise of Overfit Inference Engines](/blog/local-inference/the-rise-of-overfit-inference-engines/)
- llama.cpp PRs: [#27742 (qwen4exp)](https://github.com/ggml-org/llama.cpp/pull/27742), [#27794 (lazy tensor reads)](https://github.com/ggml-org/llama.cpp/pull/27794), [#28243 (MTP shared draft head)](https://github.com/ggml-org/llama.cpp/pull/28243), [#29599 (NVMe PLE madvise prefetch)](https://github.com/ggml-org/llama.cpp/pull/29599), [#29887 (MoE LRU cache)](https://github.com/ggml-org/llama.cpp/pull/29887)
- [l3ms.carteakey.dev](https://l3ms.carteakey.dev/) & [carteakey/l3ms repository](https://github.com/carteakey/l3ms)
