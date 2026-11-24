---
title: "Optimizing Inkling 2 Mini on an RTX 4070: From 5.9 to 74.7 tok/s"
description: "Getting Thinking Machines' Inkling 2 Mini to 74.7 tok/s decode and 2,153 tok/s prefill at 256k context on 12 GB VRAM."
image: /img/blog-sketches/unique/optimizing-inkling-2-mini-on-an-rtx-4070-stamp-trim.png
imageAlt: "Transparent monochrome sketch of a dual-fan RTX 4070 GPU with a three-loop ribbon and tachometer"
date: 2026-11-24
giscusTerm: "/blog/local-inference/optimizing-inkling-2-mini-on-an-rtx-4070/"
authored_by: ai-assisted
tags:
  - AI
  - Self-Host
---

I downloaded Thinking Machines Lab's Inkling 2 Mini (the full 4-bit Unsloth Dynamic quant, 16.4 GiB plus the vision projector and DSpark drafter) onto {% device "yeti-cachy" %} expecting a quick drop-in on my 12 GB RTX 4070 and 64 GB of DDR5.

The first boot didn't even load. Unsloth's prebuilt binary only knew the older architecture name, while the Hugging Face upload had already moved to the looped layout. Switching to a fresh llama.cpp master build got past loading, immediately OOM'd because passing `-ngl 99` alongside `--fit on` silently aborts the fitter, and then crawled at **5.9 tok/s** once I fixed the flags.

After fourteen sweeps, a custom VRAM borrowing patch in llama.cpp, and a shootout across five engines, that same full 4-bit GGUF now runs on my 12 GB card at **74.7 tok/s steady decode** and **2,153 tok/s prefill** with an elastic **256k context** and CPU vision loaded. No 2-bit quant cuts and no draft model needed.

{% progression_chart {
  kicker: "Decode · Inkling 2 Mini UD-Q4_K_XL · RTX 4070 12 GB",
  title: "From 5.9 tok/s on llama.cpp master to 74.7 tok/s and 2,153 tok/s prefill on PolyStrata",
  unit: "t/s",
  points: [
    { val: 5.89, lbl: "master b12621", sub: "--fit on" },
    { val: 33.13, lbl: "Unsloth build", sub: "CUDA fusions" },
    { val: 44.08, lbl: "16 GPU layers", sub: "loop core pinned" },
    { val: 52.04, lbl: "8.2G LRU cache", sub: "dynamic MoE" },
    { val: 65.80, lbl: "+DSpark + 0.70", sub: "184 t/s pp" },
    { val: 68.66, lbl: "Elastic llama", sub: "820/727 t/s pp" },
    { val: 74.65, lbl: "PolyStrata w4a8", sub: "2,036/2,153 t/s pp", highlight: true }
  ],
  caption: "Steady-state decode (256-token greedy coding probes after warmup) on RTX 4070 12 GB + i5-12600K (performance governor)."
} %}

## Why Inkling 2 Mini breaks naive offloading

Inkling 2 Mini is a 26.4B MoE looped transformer with 24 physical blocks. The first six run once per token, the middle twelve loop three times per token, and the last six run once, so every token passes through 48 logical layers.

When I inspected the GGUF tensor table, the byte distribution was lopsided in a way standard offload completely misses:

| Group | Blocks | Passes/Token | Expert Size | Notes |
| :--- | :--- | :---: | ---: | :--- |
| Non-block | `token_embd` + `output` | - | 938.6 MiB | 469.3 MiB each (Q8_0) |
| Prelude | blk.0 - blk.5 | 1x | 3,280.8 MiB | 546.8 MiB per block |
| Looped core | blk.6 - blk.17 | 3x | 6,561.0 MiB | 75% of all MoE passes in 6.41 GiB |
| Tail (low-bit) | blk.18 - blk.19 | 1x | 1,093.6 MiB | 546.8 MiB per block |
| Tail (high-bit) | blk.20 - blk.23 | 1x | 4,131.2 MiB | 1,032.8 MiB per block |

Unsloth Dynamic keeps the last four blocks at roughly double the bit width of the rest of the model. Naive fitting doesn't know which layers loop three times and which run once, so it burns VRAM on 1 GB single-pass tail blocks while kicking the looped core out to system RAM.

## Pushing llama.cpp to 68.7 tok/s (and hitting the prefill wall)

Switching from mainline llama.cpp to Unsloth's fork with Inkling CUDA fusions (banded relative-bias flash attention, fused SiTU, depth mixing, and loop-deduplicated MoE caching) gave an instant jump to 33.1 tok/s on identical flags. Pinning the looped core on GPU got me to 44.1 tok/s, and flipping all expert layers to the dynamic GPU LRU cache pushed that to 52.0 tok/s because the card could finally cache hot experts inside those oversized tail blocks too.

Adding the DSpark draft model helped right away, and tuning `--moe-cache-cpu-share` turned out to have a sharp sweet spot. Leaving it at zero serializes every cache miss over PCIe, while setting it to one pushes every miss onto the CPU with zero PCIe overlap. Splitting misses 70% CPU and 30% PCIe peaked at 65.8 tok/s:

{% chart {
  type: "bars",
  data: [
    { share: "0.00 (default)", tps: 58.22 },
    { share: "0.35", tps: 62.52 },
    { share: "0.50", tps: 63.09 },
    { share: "0.70", tps: 65.80 },
    { share: "1.00 (CPU only)", tps: 40.98 }
  ],
  x: "share",
  y: "tps",
  highlight: ["0.70"],
  kicker: "MoE Cache Miss Split · llama.cpp on RTX 4070 + i5-12600K",
  title: "Splitting misses 70% CPU / 30% PCIe peaks at 65.8 tok/s before falling off a cliff at 1.0",
  source: "7,500 MiB LRU cache + DSpark n=3 @ 32k Q8_0 KV",
  n: 5,
  range: "cpu-share 0.00 to 1.00",
  xLabel: "--moe-cache-cpu-share",
  yLabel: "tok/s",
  unit: "t/s",
  digits: 1
} %}

The catch was brutal: prefill sat at 184 tok/s. I originally assumed llama.cpp was evaluating prompts on the CPU, so I swept `-ub` to check. Turns out CUDA was already streaming host experts over PCIe for prompt batches, and prefill jumped straight toward 900 tok/s as soon as `-ub` grew from 256 to 2048. It just couldn't fit alongside a statically reserved 7.5 GiB MoE cache (and DSpark was inheriting `-ub 2048` and trying to allocate 3 GiB of scratch on startup).

So I built a lean Ada fork of llama.cpp with three fixes: a smaller draft ubatch (`--spec-draft-n-ubatch 256`), visit-weighted cache budgeting so the looped core doesn't get starved by the 1 GB tail blocks, and an elastic cache hook that temporarily releases the MoE cache during large prompt ubatches and reclaims it before decode starts. With Unsloth's CUDA MoE prompt kernels merged in, llama.cpp climbed to **68.7 tok/s decode** and **820 / 727 tok/s prefill** at 32k context.

## Five-engine shootout: why PolyStrata won

Even at 727 tok/s on an 8k prompt, Inkling 2 Mini was still running at roughly half the prefill speed of my much larger Qwen3.8-Flash-Next Strata setup. I wasn't willing to leave it there, so I tested four more engines on the exact same GGUF.

Basalt hard-aborts on anything older than Blackwell. Upstream Strata jumped a lot between v0.2.20 and v0.2.21 (25.7 to 46.8 tok/s plain, and 833 tok/s prefill), and official DSpark now loads cleanly, though DSpark actually slowed down 12 GB decode because it evicted GPU experts. Project Maya's new INT8 streaming-KV + Quest sparse branch (PR #1208, which I had to patch locally just to read Unsloth's newer looped GGUF headers) came in a respectable second: its host-streamed KV kept post-20k decode strong at 64.9 tok/s with DSpark, but prefill trailed by 36-60% and pushing its tighter 512-token chunk config hung the engine at 11.9 GiB VRAM.

PolyStrata (`strata-poly`) was the clear winner on Ada. It reads the exact same GGUF natively, runs prompt batches on Ada's INT8 tensor cores with 2 GiB of borrowed staging, pins offloaded experts in RAM on AVX-VNNI, and manages a single CUDA virtual-memory `--vram-pool` that grows FP8 KV on demand in 2 MiB chunks. I built it in its own isolated vendor tree (leaving my lean Qwen3.8-Flash-Next Strata fork untouched), merged a set of bit-exact Inkling 2 PRs (including streaming tool-call headers and CUDA graph OOM retries), and compiled its pure-CPU vision encoder so image inputs cost zero VRAM.

One thing genuinely surprised me across every engine on 12 GB: running **without a draft model** beat DSpark on both PolyStrata and Strata v0.2.21. Loading a drafter and its KV cache evicted hundreds of resident GPU experts, slowing down both decode and prefill while tripling cold boot time. Keeping ~1,800 hot experts resident in 8.1 GiB of VRAM (around a 95% hit rate) beat speculative decoding cleanly.

| Engine & Config | Context | Steady Decode | Prefill (5k / 20k) | Post-20k Decode | Peak VRAM |
| :--- | :---: | ---: | ---: | ---: | ---: |
| **PolyStrata (`w4a8` + `FAST_CTRL`, no draft)** | **256k elastic** | **71.6 - 74.7 tok/s** | **2,036 / 2,153 tok/s** *(8k/20k)* | **55.8 tok/s** | **11,622 MiB** |
| PolyStrata (default FP16 NVFP4, no draft) | 256k elastic | 69.0 - 71.9 tok/s | 1,135 / 1,234 tok/s *(8k/20k)* | 49.5 - 59.2 tok/s | 11,612 MiB |
| Project Maya PR #1208 (INT8 stream + Quest, plain) | 256k | 63.8 tok/s | 874 / 824 tok/s *(5k/20k)* | 60.0 tok/s | 10,942 MiB |
| Project Maya PR #1208 (c2048 + DSpark) | 128k | 60.9 tok/s | 873 / 822 tok/s *(5k/20k)* | 64.9 tok/s | 10,978 MiB |
| Upstream Strata v0.2.21 (plain) | 128k | 46.8 tok/s | 833 / 818 tok/s *(5k/20k)* | 43.4 tok/s | 11,702 MiB |
| Upstream Strata v0.2.21 (+ DSpark) | 128k | 42.9 tok/s | 796 / 757 tok/s *(5k/20k)* | 28.5 tok/s | 11,710 MiB |
| Elastic llama.cpp + DSpark (32k) | 32k | 68.7 tok/s | 820 / 727 tok/s *(2k/8k)* | 65.4 tok/s *(8k)* | 11,650 MiB |

The last jump was hiding right inside PolyStrata's own prompt kernel dispatch. Layers 0 through 19 (44 of the 48 visits) use 4-bit NVFP4 weights, and on Ada they were defaulting to FP16 halves (60.5 TFLOPS) instead of Ada's INT8 tensor cores. Setting `STRATA_PREFILL_NVFP4=w4a8` and `STRATA_INK_FAST_CTRL=1` (exact NVFP4 weights times per-32 INT8 activations, matching llama.cpp MMQ) nearly doubled prefill across the board: 2k prompts went from ~700 to **1,483 tok/s**, 8k hit **2,036 tok/s**, and 20k hit **2,153 tok/s** - finally passing Qwen3.8-Flash-Next's prefill speed on the same card with zero decode or VRAM cost.

## How close is this to the hardware ceiling?

Before chasing any more kernel tweaks, I measured my box's real silicon bandwidth with an idle GPU: **455.8 GB/s** VRAM copy, **25.0 GB/s** pinned PCIe Gen4 H2D, **60.0 GB/s** 12-thread DDR5 read, and **60.5 TFLOPS** FP16 GEMM.

Counting every active tensor across all 48 visits, Inkling 2 Mini reads **3.92 GB per token** with BF16 loop controllers. Even in an impossible fantasy where all 16.4 GiB somehow fit inside 12 GB VRAM with zero misses and zero launch overhead, 455.8 GB/s caps plain decode at **114 tok/s** at 4k context (and 74 tok/s at 128k). Once you factor in the 5% of expert misses coming off 60 GB/s DDR5 and real launch overhead, the physical 12 GB plain-decode ceiling is **~83-95 tok/s**. Sitting at ~75 tok/s decode and 2,153 tok/s prefill (84% of the practical 2,562 tok/s FP16 compute ceiling, even while streaming 6.9 GiB of uncached experts over 25 GB/s PCIe) means PolyStrata is already grabbing almost everything this card can physically deliver on full Q4.

That byte math also explains why my ~180B Qwen3.8-Flash-Next setup decodes just as fast (~73 tok/s) on the exact same machine: its 2-bit experts only read **~2.2-2.3 GB per token** (almost half of Inkling's 3.92 GB) and pair with native MTP speculative decoding.

## 256k today, and where it fits in my stack

Because Inkling 2 Mini is natively trained for 1M context with only 8 full-attention KV slots across all 48 visits (the other 40 are fixed 1,024-token sliding windows), its FP8 KV cache only costs about 16.5 KiB per token. Under PolyStrata's elastic `--vram-pool`, bumping `--max-context` from 128k to **256k** only adds ~13 MiB of static score buffer at boot - short chats keep the full ~1,800-expert pool, and a completely full 256k session still fits inside 12 GB (~4.1 GiB KV plus ~4.1 GiB left for GPU experts). Reaching 512k or native 1M will just take host-RAM KV streaming (`--kv-resident`), which PolyStrata already has for Qwen3.5 and hasn't wired to Inkling 2 yet.

I'm honest with myself about where this sits in my stack. On a 64 GB RAM box, Qwen3.8-Flash-Next stays my default daily driver because a 180B-class model at ~73 tok/s is hard to beat. Inkling 2 Mini earns its slot right next to it in Pi when I want faster 2,000+ tok/s long-prompt ingest, fast CPU vision without a speed drop, clean 4-bit weights with 256k headroom, or ~40 GB of system RAM back for heavy local builds.

Here are the exact engine flags I'm serving through `llama-swap.yaml`:

```bash
STRATA_PREFILL_NVFP4=w4a8 STRATA_INK_FAST_CTRL=1 STRATA_INK_PRESTAGE=0 \
taskset -c 0-11 vendor/polystrata/build/strata-poly \
  --model /mnt/media/models/unsloth/Inkling-2-Mini-GGUF/Inkling-2-Mini-UD-Q4_K_XL.gguf \
  --max-context 262144 --kv fp8 --vram-pool --loop-bf16 \
  --prompt-batch 2048 --lock-experts --threads 12 \
  --conversation-cache-mib 3072 --conversation-cache-slots 4
```
