---
title: Running Qwen3.8-Flash-Next locally on a 12GB VRAM card (yes, the 176B one)
description: AtomicChat AD-4.27bpw with the 51B ngram table on SSD via lazy mmap — 180-200 tok/s prefill, 20.65 tok/s MTP, and a 64k window on an RTX 4070 + 64GB RAM
image: /img/blog-sketches/unique/running-qwen3-8-flash-next-locally-stamp-trim.png
imageAlt: Transparent monochrome sketch of a GPU offloading to an NVMe SSD drive next to a token speed gauge and architecture notebook
date: 2026-08-27
updated: 2026-09-14
authored_by: ai-assisted
draft: true
hidden: false
tags:
  - AI
  - Self-Host
pinned: false
---

Qwen3.8-Flash-Next (the `qwen4exp` preview of the Qwen4 architecture) is a 125B-A6B MoE plus a **51B n-gram lookup table**. The table is not weights in the usual sense — it is hashed 3-token lookups into a giant embedding — which means it does not need to live in RAM at all. That single property lets an 88 GB quant run on a machine with 12 GB VRAM + 64 GB RAM, decoding at **19.35 to 20.65 tok/s**.

This post covers the quant choice, the upstream master refresh (promoted to Gold), the multimodal vision tier, the compact MTP draft head that breaks 20 t/s across all tasks, and exact placement flags for a 12 GB card.

{% progression_chart {
  kicker: "Performance Evolution · RTX 4070 12GB + 64GB DDR5",
  title: "Qwen3.8-Flash-Next Decode Throughput Progression",
  badge: "6.5 → 20.65 tok/s (+218% leap)",
  caption: "<strong>Progression:</strong> Powersave baseline (6.5) → CPU performance governor (12.2) → PR #27742/#27794 lazy mmap offload (15.2) → q8_0 KV & dynamic layer fitting (18.9) → Upstream master refresh (19.35) → Compact PR #28243 MTP with -ncmoe 45 (<strong>20.65 t/s</strong>).",
  unit: "t/s",
  minY: 0,
  maxY: 25,
  points: [
    { val: 6.5, lbl: "Powersave", sub: "Aug 27 (base)", color: "#eab308" },
    { val: 12.2, lbl: "CPU Governor", sub: "+88% (4.5GHz)", color: "#f97316" },
    { val: 15.2, lbl: "Lazy SSD mmap", sub: "PR #27794", color: "#d97706" },
    { val: 18.9, lbl: "q8 KV + Fit", sub: "64k ctx GPU", color: "#0d9488" },
    { val: 19.35, lbl: "Master Refresh", sub: "Fused MoE", color: "#14b8a6" },
    { val: 20.65, lbl: "Compact MTP", sub: "TODAY · ncmoe 45", color: "#10b981", highlight: true }
  ]
} %}

## TL;DR

- **Model**: `AtomicChat/Qwen3.8-Flash-Next-GGUF` — `AD-4.27bpw-Q4_K_M-M64` (88 GiB: ~52 GiB weights + 35.8 GiB ngram table, table isolated in its own shard).
- **Stack**: upstream `llama.cpp` master (`b78a39a2f`, Gold serving baseline) + PR #28243 (`d1a92352c` on master) for MTP, CUDA, sm89.
- **Server-realistic throughput**:
  - **Gold Master Plain**: **tg 19.35 tok/s aggregate** steady-state (up to 19.64 tok/s on code, 25–26 tok/s spec-warm); **pp ~200 tok/s** @ **64k context** (q8 KV, `--fit on --fit-target 512`).
  - **Vision Tier (`qwen38-flash-next-vision`)**: **tg 18.2–18.6 tok/s** with `mmproj-F16.gguf` (-ncmoe 45, 16k ctx, 1.8 GB free VRAM headroom).
  - **MTP Tier (`qwen38-flash-next-mtp`)**: **tg 20.65 tok/s aggregate** (>20 tok/s across all tasks, up to 21.9–22.4 tok/s code/SQL) with compact `shared-Q4_K_M.gguf` (1.78 GB) + PR #28243 on master (-ncmoe 45, 16k ctx, 11.78 GB VRAM).
- **Key note**: mmap **on** (the opposite of my other posts) — lazy paging *is* the offload mechanism here. `--no-mmap --mlock` is instant death for this model on 64 GB. Initial cold-start generations pay an NVMe page-in transient (~10–14 tok/s) before converging into DRAM at steady state.

{% callout "note", "Live Leaderboard & Reproduction Scripts" %}
The active profile leaderboard at [l3ms.carteakey.dev](https://l3ms.carteakey.dev/) is updated with these Qwen3.8-Flash-Next benchmark tiers alongside all other models served and benchmarked on this exact machine (RTX 4070 12GB + 64GB DDR5, including Gemma 4 26B QAT+MTP @ 100 tok/s and Qwen3.8-27B @ 36.7 tok/s). All serving configurations, placement recipes, and automated bench harnesses are published in the [l3ms repository](https://github.com/carteakey/l3ms).
{% endcallout %}

## Why this quant?

Qwen3.8-Flash-Next is 177B params: 125B MoE (6B active), 51B n-gram table, 4B MTP head. The n-gram table is read ~2.7 KB per token from a 36 GB address space — a 1-in-13-million read ratio that NVMe answers in <100 µs. The experts are the opposite: ~2.5 GB of active weights per token, hopeless from disk.

That gives three distinct storage tiers: VRAM (dense + a couple expert layers + KV), system RAM (the other 46 MoE layers), SSD (the whole n-gram table).

The AtomicChat build is the right file for this:

- **The table ships pre-isolated** in shard 2 (35.8 GiB, `per_layer_token_embd.weight` alone). On Metal this is what keeps llama.cpp from wiring the table into VRAM; on CUDA it is not strictly required, but it makes the lazy-read path clean and the file verifiable.
- **Imatrix-tuned**: KLD 0.0842, 89.5% top-1 vs bf16 — better than unsloth's Q3_K_XL *backbone* at similar resident cost, and better than the same-size IQ4_XS-style builds by a wide margin (their own A/B: KLD 0.2277 → 0.0842).
- Sized honestly: 54.5 GB resident is what the builder measured on unified memory; on a discrete-GPU box you shave the GPU layers off that.

Unsloth's quants interleave the table into weight shards, so the whole file has to be resident (or you repack — see the Quant ladder section below).

## Quant ladder (what fits where)

All published quants as of 2026-08-27, with the `size × 0.75` backbone heuristic (backbone = what must live in RAM+VRAM; the other 25% is the n-gram table):

| Publisher | Quant | File (GiB) | Backbone (GiB) | 12GB VRAM + 64GB RAM? |
| --- | --- | ---: | ---: | --- |
| unsloth | UD-IQ1_S | 67.6 | 50.7 | yes, snug |
| unsloth | UD-IQ1_M | 69.4 | 52.0 | yes, snug |
| unsloth | UD-Q2_K_XL | 73.5 | 55.1 | yes |
| unsloth | UD-IQ3_XXS | 76.3 | 57.2 | yes |
| unsloth | UD-Q3_K_XL | 83.8 | 62.9 | tight (paging risk) |
| unsloth | UD-IQ4_XS | 87.2 | 65.4 | tight (paging risk) |
| unsloth | UD-Q4_K_XL | 103.7 | 77.8 | no |
| AtomicChat | AD-3.84bpw-IQ4_XS-M64 | 84.9 | 45.8 | **yes, comfortably** |
| **AtomicChat** | **AD-4.27bpw-Q4_K_M-M64** | **88.0** | **54.5** | **yes — this post's config** |
| AtomicChat | AD-5.00bpw-Q5_K_M-M64 | 110.5 | 56.1 | borderline |
| ggml-org (official) | Q8_0 (BF16→) | ~180+ | n/a | reference only |

Notes on the table:

- The heuristic is calibrated for unified-memory Macs. On a discrete-GPU box your VRAM holding dense+KV effectively *adds* to the RAM budget: we run an 88 GiB file with 10 GiB in VRAM and ~46 GiB in RAM.
- **AtomicChat's AD-4.27bpw is the quality/size sweet spot** (KLD 0.0842, 89.5% top-1) and beats every same-size unsloth build because of the imatrix work — unsloth's low quants keep the *table* at ~4-6 bits while dropping the backbone lower, which is backwards.
- AD-3.84bpw is the "every GB counts" variant: ~9 GiB less resident, KLD 0.2277 (noticeably worse). Take it only if 64 GB-class RAM forces it.
- **Shard isolation**: AtomicChat's build isolates the n-gram table into its own shard (`per_layer_token_embd.weight`), enabling native zero-cost SSD offload via mmap. Unsloth quants interleave the table into weight shards and require repacking or re-splitting to avoid paging thrash.

### Where the memory actually goes (measured, this config)

| Tier | Contents | GiB |
| --- | --- | ---: |
| File | whole AD-4.27bpw quant | 88.0 |
| VRAM | dense/attention ~4.4 + last-2 expert layers ~2.0 + q8 KV (64k) ~0.6 + compute ~1.6 | 10.0 |
| RAM (RSS) | 46 host expert layers ~44.6 + token-embd/output ~1.2 (file-backed, evictable) | 45.6 |
| SSD | 88.0 − 10.0 − 45.6 | **32.4** |

The SSD tier is only the n-gram table (35.8 GiB minus ~3.4 GiB of rows already cached). Only `per_layer_token_embd` is *deliberately* offloaded; the host expert layers are clean file-backed pages that the kernel only evicts under RAM pressure — if tg suddenly halves mid-session, check `free -g` first. Evidence: 176k major page faults (~690 MB) during a 1455-token prefill = the table paging in on demand, exactly as designed.

## Build

All architecture support, lazy tensor reading, and fused MoE reduction kernels are merged into upstream `llama.cpp` master (`b78a39a2f`). A standard build works directly with zero patches:

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

> **Easier path**: In [l3ms](https://github.com/carteakey/l3ms), running `cargo build --release` automatically detects CUDA architecture and wires binary paths.

## Download

88 GiB across 33 shards. Plain `hf download` was throttled to <4 MB/s here and Xet stalled outright; a segmented downloader (12 concurrent range requests, ~10 MB/s) got it done in ~2.5 h.

```bash
# verify shard 2 is the isolated table after download
python3 - <<'EOF'
from gguf import GGUFReader
r = GGUFReader("Qwen3.8-Flash-Next-AD-4.27bpw-Q4_K_M-M64-00002-of-00033.gguf")
print([t.name for t in r.tensors])  # -> ['per_layer_token_embd.weight']
EOF
```

> **Easier path**: drop the repo + include glob into `model_downloader/models_config.json` in l3ms.

## Run

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

What each piece does on a 12 GB card:

- **`--fit on --fit-target 512`** — dynamic layer offload: automatically places dense/attention weights plus as many MoE expert layers as possible onto the GPU while reserving 512 MiB margin. Uses 11,074 MiB VRAM at 64k context.
- **`-b 4096 -ub 2048`** — the prefill lever: streams the ~45 GiB CPU expert weights in a single pass for prompts up to 2,048 tokens, delivering **303–385 tok/s** without degrading decode.
- **`--lazy-mode on`** — the 35.8 GiB n-gram table is mmapped on SSD but never prefetched into RAM; individual rows fault in on demand and evict freely.
- **`-ctk q8_0 -ctv q8_0`** — quantized KV cache halves memory consumption, enabling a 64k context window directly in VRAM.
- **KV on GPU** — do not use `--no-kv-offload`. QSA's KV cache is sparse-window budgeted; host placement degrades PCIe throughput.

Sampling: Qwen's thinking-mode defaults (`temp 1.0 / top-p 0.95 / top-k 20`).

> **Easier path**: the `qwen38-flash-next` entry in l3ms `llama-swap.yaml` has all of the above wired (binary macro points at the dual-PR build); llama-swap swaps it in and out of the 12 GB card automatically.

## Bench

### September 2026 Refresh: Upstream Master Promotion, Vision Tier & MTP Breakthrough

In September 2026, upstream master (`b78a39a2f`, 175 commits newer than September 1 gold `9d817213a`) brought fused CUDA MoE reductions and faster Q4_K/Q5_K unpacking with L2 prefetch. We evaluated plain master, Daniel Han's revised PR #28243 (`d1a92352c` on master), and live `ik_llama` with expert prefetch on a standardized 6-task unique-prompt corpus (1,152 generated tokens total, 192 tokens per prompt, 16k context, RTX 4070 12 GB, 5600 MT/s RAM):

#### Table A: Upstream Master Refresh vs Previous Gold vs `ik_llama`

| Task | Gold (`9d817213a`) | **Master (`b78a39a2f`)** | PR #28243 Q8 `n_max=1` | PR #28243 Q8 `n_max=2` | `ik_llama` base | `ik_llama` MTP-1 | `ik_llama` MTP-2 |
|---|---:|---:|---:|---:|---:|---:|---:|
| `code-pathlib` | 17.71 | **19.64** | 17.98 | 19.80 | 17.90 | 18.81 | 15.66 |
| `code-rust-lru` | 18.92 | **19.28** | 18.00 | 19.80 | 18.45 | 16.38 | 16.18 |
| `code-sql-batch` | 19.49 | **19.45** | 18.65 | 20.61 | 17.28 | 17.93 | 17.69 |
| `story-radio` | 18.91 | **19.09** | 16.90 | 18.65 | 18.16 | 14.87 | 15.37 |
| `story-library` | 19.35 | **19.11** | 17.98 | 18.69 | 18.16 | 14.17 | 15.71 |
| `story-orchard` | 18.91 | **19.56** | 17.84 | 20.51 | 18.09 | 14.91 | 16.49 |
| **Aggregate t/s** | **18.86** | **19.35** | **17.88** | **19.65** | **18.00** | **16.01** | **16.15** |
| **Delta vs Gold** | Baseline | **+2.6%** | -5.2% | +4.2% | -4.6% | -15.1% | -14.4% |
| **Delta vs `ik_llama` Base** | +4.8% | **+7.5%** | -0.7% | +9.2% | Baseline | -11.1% | -10.3% |
| **VRAM Allocated** | 8,510 MiB | **8,458 MiB** | 11,406 MiB | 11,518 MiB | — | — | — |

- **Master promoted to new Gold baseline:** Upstream plain decode (19.35 t/s) beats `ik_llama` base (18.00 t/s) by +7.5% and `ik_llama` MTP-2 (16.15 t/s) by +19.8%, completely eliminating the need for ik_llama on fresh traffic. Code decode jumps +10.9% on pathlib (19.64 vs 17.71).

#### Table B: Compact Shared-Q4_K_M Draft Head (PR #28243) vs Baselines

The compact 1.78 GB `shared-Q4_K_M` head saves **~870 MiB VRAM** compared to `shared-Q8_0` (2.60 GB). This reclaimed slack allows offloading an extra MoE layer (`-ncmoe 45`, 3 MoE layers on GPU) under the 12 GB VRAM envelope:

| Task | Master Plain (`ncmoe 46`) | Q8_0 `n_max=2` (`ncmoe 46`) | Q4_K_M `n_max=1` (`ncmoe 46`) | Q4_K_M `n_max=2` (`ncmoe 46`) | **Q4_K_M `n_max=2` (`ncmoe 45`)** |
|---|---:|---:|---:|---:|---:|
| `code-pathlib` | 19.64 | 19.80 | 20.76 | 20.21 | **20.83** |
| `code-rust-lru` | 19.28 | 19.80 | 20.10 | 20.39 | **20.35** |
| `code-sql-batch` | 19.45 | 20.61 | 21.05 | 22.42 | **21.88** |
| `story-radio` | 19.09 | 18.65 | 19.90 | 19.41 | **20.00** |
| `story-library` | 19.11 | 18.69 | 19.73 | 19.14 | **20.65** |
| `story-orchard` | 19.56 | 20.51 | 20.23 | 19.74 | **20.28** |
| **Aggregate t/s** | **19.35** | **19.65** | **20.28** | **20.16** | **20.65** |
| **Delta vs Master Plain** | Baseline | +1.5% | +4.8% | +4.2% | **+6.7%** |
| **Delta vs Old Gold** | +2.6% | +4.2% | +7.5% | +6.9% | **+9.5%** |
| **VRAM Used** | 8,458 MiB | 11,518 MiB | 10,536 MiB | 10,648 MiB | **11,786 MiB** |
| **VRAM Headroom** | 3,824 MiB | 764 MiB | 1,746 MiB | 1,634 MiB | **496 MiB** |
| **Draft Acceptance** | — | 79.6–90.7% | 82.7–96.1% | 79.8–96.3% | **76.9–95.7%** |

- **Breaking the 20 t/s barrier:** `shared-Q4_K_M` paired with `-ncmoe 45` delivers **20.65 t/s aggregate** (>20 t/s on every prompt, up to 21.88–22.42 t/s on SQL/code), beating plain master by +6.7% and old gold by +9.5%.

#### Table C: VRAM Allocation & Layer Fitting Geometry (RTX 4070 12,282 MiB)

Each MoE layer costs **1,138 MiB VRAM** on GPU:

| Configuration | Context | MoE on GPU | Head | VRAM Used | Free Headroom | Measured Decode |
|---|---:|---:|---|---:|---:|---:|
| Gold Plain Master | 64k | 2 (`-ncmoe 46`) | None | 8,458 MiB | 3,824 MiB | 19.35 t/s |
| Gold Plain Dynamic Fit | 64k | Dynamic (`--fit on --fit-target 512`) | None | 10,714 MiB | 512 MiB | 19.99 t/s (+0.64) |
| Vision Master (`mmproj-F16`) | 16k | 3 (`-ncmoe 45`) | None | 10,460 MiB | 1,822 MiB | 18.2–18.6 t/s |
| PR #28243 MTP Q8_0 | 16k | 2 (`-ncmoe 46`) | 2.60 GB | 11,518 MiB | 764 MiB | 19.65 t/s |
| **PR #28243 MTP Q4_K_M** | **16k** | **3 (`-ncmoe 45`)** | **1.78 GB** | **11,786 MiB** | **496 MiB** | **20.65 t/s** |

#### Cold Page-In Transient vs System State (Why Probe 1 Starts at 10–14 t/s)

On fresh server start with `--no-warmup`, the very first generation ("Count to 30") often clocks ~10.3–15.3 t/s before climbing to ~18.8 t/s on probe 2 and reaching full steady state (19.35–20.65 t/s).
- **Not a system state issue:** Host RAM is healthy (54.5 GiB available, 1.0 MiB zram swap, CPU governor pinned at performance).
- **Physical cause:** The ~45.5 GB of CPU-side MoE expert weights reside in memory-mapped (`mmap`) files on NVMe SSD. When a fresh server starts, the router gate dynamically selects experts that are not yet resident in Linux page cache. The CPU incurs synchronous major page faults in the token loop. Once ~1,000 tokens have been processed, the working set converges into physical RAM, NVMe read traffic drops to the ~5 KB/token baseline, and decode locks into its 19.35–20.65 t/s ceiling.

### Prompt processing ladder & prefill scaling (measured September 2026)

Prefill is expert-traffic-bound on the CPU side: ~45 GiB of expert weights are read once per ubatch regardless of token count. At `ub 1024`, upstream master (`b78a39a2f`) delivers a **+17.3% overall prefill gain** over previous gold (`9d817213a`), widening to **+33.7%** on 2k-token prompts (285.8 vs 213.8 tok/s) due to fused CUDA MoE reductions.

Increasing micro-batch to **`-ub 2048`** unlocks a massive prefill leap for documents and long contexts, hitting **303–385 tok/s**:

| Configuration | ~512 tok (t/s) | ~1024 tok (t/s) | ~2048 tok (t/s) | Mean PP (t/s) | VRAM (MiB) |
|---|---:|---:|---:|---:|---:|
| 1. Gold (`9d817213a`) `-ncmoe 46`, ub 1024, tb 12 | 195.9 | 214.5 | 213.8 | **208.1** | 9,104 |
| 2. Master (`b78a39a2f`) `-ncmoe 46`, ub 1024, tb 12 | 205.7 | 241.1 | 285.8 | **244.2** | 9,052 |
| 3. Master `-ncmoe 45` (+1 MoE on GPU), ub 1024, tb 12 | 220.1 | 243.6 | 280.7 | **248.2** | 10,190 |
| 4. Master `--fit on --fit-target 512`, ub 1024, tb 12 | 217.6 | 250.3 | 282.3 | **250.1** | 11,508 |
| **5. Master `-ncmoe 45`, ub 2048, tb 12** | **201.4** | **303.1** | **356.8** | **287.1** | **10,798** |
| 6. Master `-ncmoe 45`, ub 1024, tb 16 (all logical cores) | 220.6 | 240.3 | 272.0 | **244.3** | 10,190 |

**Key prefill insights:**
- **Why `ub 2048` unlocks >350 tok/s:** At `ub 1024`, a 2,048-token prompt forces the CPU to stream the ~45 GB expert pool twice. At `ub 2048`, the full 2,048 tokens are processed in a single pass over the expert weights, doubling arithmetic intensity and delivering **356.8 tok/s (up to 385.2 tok/s peak)**. VRAM increases by only 608 MiB (10,798 MiB total), leaving 1.48 GB headroom.
- **Batch threads (`--threads-batch`):** 12 threads matches the 6 P-cores (12 logical hyperthreads). Over-allocating to 16 threads onto the 4 slow E-cores degrades throughput (244.3 vs 248.2 tok/s) due to core synchronization jitter. Keep `--threads-batch 12`.

> **N-gram Speculation Note**: N-gram lookup speculation (`--spec-type ngram-mod`) costs zero VRAM and provides a +20–90% burst on repeated or highly predictable prompt structures (e.g. code boilerplate). For general novel text generation, true neural MTP via PR #28243 (Table B) provides consistent +7–10% gains across all tasks without content dependence.

### The CPU power governor is worth 2×

The single biggest decode lever was not a llama.cpp flag: under the default `powersave` governor the P-cores sit at ~81% clock and tg was **6.5 tok/s**. Switching to `performance` (P-cores pinned at 4.5 GHz) with **zero flag changes** lifted tg to **12.2 tok/s**. Thread count is a distant second — the full matrix at `-ncmoe 46`:

| threads | tg128 (tok/s) |
| ---: | ---: |
| 6 (P only) | 10.67 |
| 8 | 11.96 |
| **10** | **12.19 ± 0.17** |
| 12 | 11.29 |
| 16 (P+E) | 11.17 |

Keep `-t 10`; add `--prio 2` from the l3ms conventions. Before benchmarking anything on this box, run the power checks in `preflight-check.sh` (`tuned-adm profile throughput-performance` / `powerprofilesctl set performance`).

### Quantized KV unlocks 64k

The QSA Hadamard-rotation fix (in the PR head now — the old `self_k_rot` assert is gone) makes `-ctk q8_0 -ctv q8_0` work, halving KV size versus f16:

- **64k context on GPU KV: healthy, VRAM 10.0 GiB, tg 6.5** — double the previous 32k ceiling at identical speed.
- 131k with q8_0 KV segfaults on CUDA (`ggml-cuda.cu:107` during reserve) — the f16-KV 128k config via `--no-kv-offload` remains the only >64k option, at ~5–6 tok/s. Worth reporting upstream.

### Context guidance

- **32k is the sweet spot** — identical speed to 8k, 4× the window.
- 64k+ is *possible* but only by pushing KV to the host, which costs more than it gains here (see ladder). The Mac unified-memory crowd gets 262k at 36 tok/s; a discrete 12 GB card does not have that luxury.
- Spec decoding roughly doubles effective decode once the ngram cache warms (first runs are cold; run 2+ is the steady state). **Measured 2026-08-28 at the 64k fit-on config: cold-pool 18.9 t/s → 35.9 t/s steady on repeated identical prompts (+90%)** — the ngram-mod hash pool persists per-process and is content-keyed, so the ceiling applies to repeat/related content (code iteration, template output), not novel generation. Novel-content decode through the router is ~20 t/s.

## 27B or Flash-Next?

I also run the [Qwen3.8-27B UD-IQ3_XXS](/blog/running-qwen3-8-27b-locally/) on this box, and the full comparison — measured head-to-head, a benchmark-anchored intelligence index (~90 vs ~74), the hardware/task decision matrix, and a quant-agnostic dense-vs-MoE chooser tree — now lives in its own post: [Qwen3.8-27B vs Qwen3.8-Flash-Next — which one to run locally](/blog/qwen3-8-27b-vs-flash-next/).

## What did NOT help (and why)

- **`-ot 'exps=CPU'` overrides** — fights `-ncmoe` (explicit overrides win, so *no* expert layer lands on GPU) and produced 4 tok/s. Let `-ncmoe` or `--fit` do the split.
- **`-ngl 99` alone** — the PLE tensor is *not* GPU-offloaded by default (`LLM_TENSOR_LAYER_INPUT`), but with no `--ncmoe` or `--fit`, the 52 GiB of experts try to allocate on the 12 GB card. Instant `cudaMalloc failed: out of memory`.
- **Eager table prefetch (lazy off)** — the loader faults the full 36 GiB table into page cache; combined with ~42 GiB of host experts, the box thrashes (4–5 tok/s and falling).
- **`--no-mmap --mlock`** — the default reflex from other models. Here it's a guaranteed failure: there is no RAM to lock 88 GiB into.
- **128k context** — fits only with host-side KV, and the RSS/PCIe cost erases the win (5.8 vs 15.2 tok/s). Revisit once upstream long-context decay patches land.

## Notes

- **MTP breaks through via PR #28243**: Daniel Han's upstream PR with the compact 1.78 GB `shared-Q4_K_M.gguf` head fits fully into VRAM at 16k context, allowing `-ncmoe 45` (+1 MoE layer on GPU) to deliver **20.65 t/s aggregate** (77–96% acceptance), breaking the 20 t/s barrier across all tasks (Table B).
- **zram matters on 64 GB**: the system runs zstd swap; without it the desktop + 49 GiB working set would spill to NVMe and die. Watch `swapon --show` if you copy this config.
- The table's first-touch faults show up as a slow first generation (~10–14 t/s); subsequent generations hit DRAM page cache (19.35–20.65 t/s). Don't judge cold numbers.
- **MTP verdicts are RAM-bandwidth-dependent**: our result (20.65 t/s) is on DDR5-5600; slower RAM or PCIe configurations may see MTP overhead reduce decode. Always verify on your specific memory subsystem.
- This build's `llama-server` is the stable surface, same as with Qwen3.8-27B: `llama-bench` with these flags needs care (compute-buffer reserves), `llama-cli` was not exercised.

## Open watch items

1. **Upstream PR #28243 merge**: When Daniel Han's Qwen3.8-Flash-Next MTP PR merges into upstream master, MTP serving will run directly off plain master without maintaining a separate PR clone.
2. **Long-context decay mitigations (#27977 & #27992)**: Target decode degradation as context grows past 64k. When merged, refresh and re-bench at 128k context.
3. **QSA true attention sparsity**: Upstream currently computes full attention then masks. True sparse attention kernels will dramatically reduce prefill latency on massive contexts.

## Changelog

| Date | Note |
| --- | --- |
| 2026-08-27 | Initial post — AD-4.27bpw, dual-PR build, `-ncmoe 46` placement ladder, 32k sweet spot, ngram-mod spec results. |
| 2026-08-27 | pp fix: `-b 4096 -ub 1024` lifts prefill 15 → 180 tok/s (expert traffic amortized per ubatch); tg unchanged. Wired into llama-swap. |
| 2026-08-27 | Spec reality-check: type sweep shows all ngram variants within noise at chat settings; gain is content-dependent (6–9 typical, ~15 repetitive-prose ceiling). `-n-min/-n-max` are no-ops. q8_0 KV works → **64k ctx at full speed**; 131k q8 segfaults on CUDA (upstream report pending). Swap entry now 64k + q8 KV. |
| 2026-08-27 | **PR #27742 + graph-reuse fixes merged upstream.** Rebuilt from master: 64k config verified regression-free (tg 6.4–6.9), `graphs reused` counter now 318–605/request (was 0 on the PR branch), per-request host leak patched. 131k still CUDA-OOMs — matches the upstream indexer-buffer finding (grows context-proportionally). Serving binary = upstream master now. |
| 2026-08-27 | **Power governor: tg 6.5 → 12.2 tok/s** with `performance` (no flag changes). Thread matrix confirms `-t 10` optimal. `--prio 2` added to the swap entry; preflight power checks now part of the bench ritual. |
| 2026-08-27 | Added the full quant ladder (unsloth / AtomicChat / ggml-org official), the backbone-fits heuristic, repack guidance for interleaved-shard quants, and the measured memory ledger (VRAM 10.0 / RAM 45.6 / SSD 32.4 GiB). |
| 2026-08-28 | **MTP landed via PR #27836.** Sidecar Q4_K_M head (requantized from agentionai Q8_0, llama-quantize) in VRAM at 32k ctx (11636/12282 MiB). A/B on this box: ungated dn=2 = code +10%, prose −12..−22% (acceptance 0.61–0.69); `--spec-draft-p-min 0.7` = code **+25.7% (t0) / +15.1% (t1)**, prose −0.3% (parity), acceptance 0.81–0.97. New `qwen38-flash-next-mtp` swap entry + `bench-llama-qwen38-flash-next-mtp.sh` A/B harness. Reasoning caps (`--reasoning-effort medium --reasoning-budget 4000 --reasoning-preserve`) added to both Flash-Next entries. |
| 2026-08-28 | **Attribution 2×2 + warm-pool measurement** (`bench-llama-qwen38-flash-next-graphopt.sh`): `GGML_CUDA_GRAPH_OPT=1` is a **no-op** on current master (graphs already reused 1902/request without it; ±0.2% tg); `--fit on --fit-target 512` = +2.8% over `-ncmoe 46` (20.45 vs 19.90 median) at 64k — base swap entry switched to fit-on. Warm ngram-mod pool on repeated content: 18.9 → **35.9 t/s** (+90%); novel-content decode ~20 t/s. |
| 2026-08-28 | Thread-intel pass: tensor-type dump shows routed experts are IQ2_XS + Q2_K_S (label bpw is a weighted average) — TODO #1 gets a verify-first caveat. `ngram-mod,ngram-map-k4v` combo A/B: no effect on distinct prompts. MTP bandwidth caveat + kvarn5 watch item noted. |
| 2026-08-28 | **pp investigation** (`bench-llama-qwen38-flash-next-pp.sh`): three effects were stacked. (1) first prompt after every (re)load pays expert-page NVMe fault-in — ~45 GiB ÷ ~6 GB/s (SN770, Gen4 x4) ≈ 7.5 s; recurs with `globalTTL: 600`. (2) identical repeat prompts hit KV prefix reuse — `prompt_n` collapses and naive pp math reports garbage (~22 t/s); always print `prompt_n`, force full re-prefill with a unique prefix. (3) real warm full-prefill pp on a fresh quiet boot: **~200 t/s** (fit-on, 64k, THP=always) — above the doc's 180 reference. THP=always measured neutral-to-positive; kept on (`defrag=defer+madvise`). A mid-session dip to ~97 was desktop churn + swap pressure, resolved by reboot — the 64 GB box has zero slack against the 45.6 GiB expert set. |
| 2026-08-31 | **27B-vs-Flash-Next comparison split into its own post** ([Qwen3.8-27B vs Qwen3.8-Flash-Next](/blog/qwen3-8-27b-vs-flash-next/)): head-to-head table, intelligence index (~90 vs ~74 via LLM Stats 49.7 + KLD curves), decision matrix, and a quant-agnostic dense-vs-MoE chooser tree. Pointer section added here. |
| 2026-09-14 | **Upstream master refresh promoted to Gold; Vision tier & compact MTP 20.65 t/s breakthrough.** Refreshed upstream master (`b78a39a2f`, 175 commits newer) promoted to Gold serving baseline after delivering 19.35 t/s aggregate (+2.6% over old gold, +7.5% over ik_llama base, +10.9% on pathlib code) on unique 6-task corpus. Multimodal `qwen38-flash-next-vision` tier wired with `mmproj-F16.gguf` (-ncmoe 45, 16k ctx, 18.2–18.6 t/s). Compact `shared-Q4_K_M.gguf` (1.78 GB) with Daniel Han PR #28243 saves ~870 MiB VRAM, allowing `-ncmoe 45` (+1 MoE on GPU) to fit 11.78 GB VRAM and hit **20.65 t/s aggregate** (>20 t/s on every task). Diagnosed fresh-boot 10–14 t/s probe 1 decode as mmap NVMe cold page-in transient (not system swap). |

## References

- [AtomicChat/Qwen3.8-Flash-Next-GGUF](https://huggingface.co/AtomicChat/Qwen3.8-Flash-Next-GGUF) (quant + imatrix + metrics)
- [Qwen/Qwen3.8-Flash-Next (base)](https://huggingface.co/Qwen/Qwen3.8-Flash-Next)
- [llama.cpp PR #27742 — qwen4exp support](https://github.com/ggml-org/llama.cpp/pull/27742)
- [llama.cpp PR #27794 — lazy tensor reads](https://github.com/ggml-org/llama.cpp/pull/27794)
- [llama.cpp PR #27836 — qwen4exp MTP draft head](https://github.com/ggml-org/llama.cpp/pull/27836) + [crusaderky detached-head patch](https://github.com/crusaderky/llama.cpp/commit/a82a58a57fc307e5cec0dc68db64d143339be4f2)
- [agentionai/Qwen3.8-Flash-Next-MTP-Q8_0-GGUF](https://huggingface.co/agentionai/Qwen3.8-Flash-Next-MTP-Q8_0-GGUF) (sidecar head) · [jlkivey/Qwen3.8-Flash-Next-MTP-PR27836-GGUF](https://huggingface.co/jlkivey/Qwen3.8-Flash-Next-MTP-PR27836-GGUF) (graft head + script)
- [l3ms.carteakey.dev](https://l3ms.carteakey.dev/) (live homelab LLM leaderboard, served models, and task benchmarks)
- [carteakey/l3ms repository](https://github.com/carteakey/l3ms) (homelab LLM toolkit, build flags, serving configurations, and bench reproduction scripts)
