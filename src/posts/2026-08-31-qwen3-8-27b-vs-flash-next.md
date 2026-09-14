---
title: Qwen3.8-27B vs Qwen3.8-Flash-Next — which one to run locally
description: Head-to-head on an RTX 4070 + 64 GB box — measured throughput, a benchmark-anchored intelligence index (~90 vs ~74), and a quant-agnostic decision tree for dense-vs-MoE local models
date: 2026-08-31
updated: 2026-08-31
authored_by: ai-assisted
draft: false
tags:
  - AI
  - Self-Host
hidden: false
pinned: false
---

I run both Qwen3.8 siblings on the same box — the [27B dense hybrid](/blog/running-qwen3-8-27b-locally/) (10.17 GiB, fully in VRAM) and the [Flash-Next 176B MoE](/blog/running-qwen3-8-flash-next-locally/) (88 GiB file, ngram table on SSD). They cost the same electricity and cannot be resident at the same time, so only one earns the default slot. This post is the measured comparison, an attempt at an honest intelligence index, and the decision matrix that came out of it.

## TL;DR

- **Speed**: the 27B is ~1.8× faster on novel-content decode (36.7 vs ~20 t/s) and ~6× on prefill — but Flash-Next matches it on repeat-heavy output once the ngram pool warms (35.9 t/s).
- **Intelligence**: indexed at Flash-Next BF16 = 100, the serving quants land at **~90 (Flash-Next AD-4.27bpw) vs ~74 (27B UD-IQ3_XXS)** — built from published benchmarks plus KLD quant curves, ±3 points.
- **Verdict on this box**: both, behind [llama-swap](https://github.com/mostlygeek/llama-swap), routed by task. Flash-Next MTP as the quality default; the 27B for long-context (>64k), memory-pressured sessions, and latency-critical agent loops.

## The contenders

- **Qwen3.8-27B** — 27B dense hybrid (48 Gated-DeltaNet + 16 attention layers), served as `unsloth/Qwen3.8-27B-UD-IQ3_XXS` (3.06 bpw). Setup and flags: [27B local](/blog/running-qwen3-8-27b-locally/).
- **Qwen3.8-Flash-Next** — 125B-A6B MoE + 51B ngram lookup table + 4B MTP head, served as AtomicChat `AD-4.27bpw-Q4_K_M-M64` (88 GiB). Setup, dual-PR build, and the SSD-tier trick: [Flash-Next local](/blog/running-qwen3-8-flash-next-locally/).

## Measured head-to-head (RTX 4070 12 GB, Ryzen 9 7900, 64 GB DDR5-5000)

| | 27B UD-IQ3_XXS (10.17 GiB) | Flash-Next AD-4.27bpw (88 GiB) |
| --- | --- | --- |
| Prefill (pp) | **~1160 t/s** (pp4096, full VRAM) | ~200 t/s warm (64k) |
| Decode (novel content) | **36.7 t/s**, flat 32k→262k | ~20 t/s (fit-on 64k), 12.2 with base config |
| Decode (best case) | 39.6 (Q2_K_XL sibling quant) | 24 peak w/ gated MTP (code); **35.9 warm ngram pool** on repeat content |
| Max context | **262k native**, in VRAM | 64k (131k CUDA-OOMs) |
| Resident footprint | 10.2 GiB VRAM, nothing on host | ~50 GiB RSS + 10 GiB VRAM — zero slack on 64 GB |
| Concurrent with other work | yes | risky (swap-pressure dips documented in the Flash-Next post) |

## Intelligence index

Anchored to published data, not vibes: LLM Stats scores Flash-Next **49.7** (#15 overall) and it wins 15/15 shared benchmarks vs Qwen3.7-Plus (43.0) — GPQA 91.7 vs 90.3, LiveCodeBench v6 91.9 vs 89.6, plus SWE-bench Pro, NL2Repo, HLE, CoWorkBench, IFBench. The 27B is benchmark-parity with Qwen3.7-Plus on shared rows (mixed ±3), so the base-model gap is ~13–15%.

Compose that with quant retention (top-1% agreement vs BF16 self) from the published KLD curves, indexed at Flash-Next BF16 = 100:

| | Base | Retention | **Index** |
| --- | --- | --- | --- |
| Flash-Next BF16 | 100 | — | 100 |
| **Flash-Next AD-4.27bpw** | 100 | ~90% (between UD-Q3_K_XL 88.3% and UD-Q4_K_XL 92.3%) | **~90** |
| 27B BF16 | ~87 | — | ~87 |
| **27B UD-IQ3_XXS** | ~87 | ~85–87% (3.06 bpw, dense — extrapolated) | **~74** |

So the premium is real but moderate: **~90 vs ~74**, roughly 45 vs 37 in LLM Stats terms. Caveat: top-1% KLD agreement is not exactly benchmark-score retention — the MoE+PLE arch degrades more gracefully than the number implies, dense 3-bit slightly worse. Treat ±3 points.

## Decision matrix

Work through in order; first hit wins:

1. **RAM + VRAM ≥ 64 GB total?** No → **27B** (or smaller models entirely). Flash-Next's ~54.5 GiB backbone + KV + desktop won't fit; on exactly 64 GB (this box) it runs but with zero slack — zram is mandatory, and a memory-churny desktop costs measurable tg.
2. **≥ 96 GB RAM/unified memory, no or weak GPU?** Yes → **Flash-Next**, and consider a fatter quant (AD-5.00bpw / UD-Q4_K_XL). The MoE's 6B active params make unified-memory decode genuinely good — this is the Mac Studio / DGX Spark sweet spot, and it needs no discrete VRAM at all.
3. **12 GB VRAM + ≥ 64 GB RAM (this box)?** Both fit. Split by task (below).
4. **12 GB VRAM + 40–63 GB RAM?** → **27B**. Flash-Next will page-thrash; the ngram-table-on-SSD trick does not rescue the host experts.
5. **< 12 GB VRAM, < 40 GB RAM?** → neither; drop to a sub-10B class or 27B Q2 with heavy offload and expect <5 t/s.

And the task split when both fit:

| Task | Pick | Why |
| --- | --- | --- |
| Agentic coding loops, tool calls, fast turnaround | **27B** (36.7 t/s) | latency floor; 3-bit dense is fine for mechanical edits |
| >64k context work | **27B** | 262k native vs Flash-Next's 64k cap |
| Hard reasoning, long-form writing, nuanced review | **Flash-Next** (~20 t/s) | the 15-point index premium is most visible exactly here |
| Repetitive/template output, code iteration on same files | **Flash-Next** | warm ngram pool hits 35.9 t/s — matches the 27B while being smarter |
| Box under memory pressure / something else running | **27B** | 10 GiB VRAM-only vs 50 GiB RSS competing with everything else |

## Generic chooser (quant-agnostic)

The same logic works for any *compact dense* (7–32B) vs any *large MoE* (≥100B total, ≤10B active) pair — swap in your own file sizes and tok/s. The load-bearing facts underneath the tree: **dense models need their weights in VRAM** (CPU offload costs ~5–10× tg, since every parameter is touched every token), while **a small-active MoE runs acceptably straight out of RAM** and can even park lookup tables on SSD.

```
START: compact dense (7-32B)  vs  large MoE (>=100B total, <=10B active)

  Q1. MoE resident size <= 0.8 x (RAM + VRAM)?
      (resident = file minus cacheable/SSD-tier parts; leave headroom
       for KV, OS, desktop)
   |
   +-- NO --> Q1a. Dense file + KV <= 0.9 x VRAM?
   |            +-- YES --> DENSE, fully in VRAM  (fast + simple)
   |            +-- NO  --> dense CPU-offload or a smaller model
   |                         (MoE is out; dense offload crawls)
   |
   +-- YES --> Q2. Discrete GPU >= ~12 GB present?
                |
                +-- NO (RAM/unified only) --> MoE  <-- wins by default:
                |                             small-active MoE decodes
                |                             fine from RAM; dense
                |                             offload does not
                +-- YES --> Q3. Any of these true?
                              - need context beyond what the MoE's
                                VRAM+RAM budget can hold KV for
                              - box is shared / memory-pressured
                              - latency-critical agent loops
                           |
                           +-- YES --> DENSE
                           +-- NO  --> Q4. Task quality-sensitive?
                                       (reasoning, writing, nuanced
                                        review, repeat-heavy output)
                                    +-- YES --> MoE
                                    +-- NO  --> DENSE (speed floor)
```

Rules of thumb the tree compresses:

- **Fit check first, always.** The MoE only wins anywhere if it fits in fast memory with ~20% headroom; paging to NVMe for expert weights destroys it (the ngram/lookup-table tier on SSD is fine — random small reads, not weight streams).
- **No GPU changes the winner.** Dense-offload is the worst case in local inference; small-active MoE is the *best* case for RAM-only boxes.
- **With a GPU, dense gets the speed floor, MoE gets the quality ceiling** — route by task, not by spec sheet.
- **Context is a KV-budget question**, not an architecture claim: whichever model's KV actually fits your free memory holds the longer window.

## References

- [LLM Stats — Qwen3.7-Plus vs Qwen3.8-Flash-Next](https://llm-stats.com/models/compare/qwen3.7-plus-vs-qwen3.8-flash-next) (49.7 vs 43.0, 15/15 shared wins, retrieved 2026-08-31)
- [OpenLM — Qwen3.8 family benchmarks](https://openlm.ai/qwen3.8/) (27B table)
- [unsloth/Qwen3.8-Flash-Next-GGUF](https://huggingface.co/unsloth/Qwen3.8-Flash-Next-GGUF) and [unsloth/Qwen3.8-27B-GGUF](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF) (KLD/top-1% quant curves)
- Sibling posts: [27B local](/blog/running-qwen3-8-27b-locally/) · [Flash-Next local](/blog/running-qwen3-8-flash-next-locally/)
