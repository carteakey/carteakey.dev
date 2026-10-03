---
title: "Strata on an RTX 4070: 53 tok/s from a 176B Model at 60k Context"
description: "53.2 tok/s at 60k context on a 12 GB RTX 4070: how I measured it, how the memory works, and what's still unproven."
image: /img/blog-sketches/unique/strata-on-an-rtx-4070-stamp-trim.png
imageAlt: "Monochrome pencil sketch of a graphics card beside a tray of cached chips, a larger chip pile, a RAM stick, and a stopwatch"
date: 2026-10-03
authored_by: ai-assisted
draft: true
tags:
  - AI
  - Self-Host
---

## Where I was

Earlier this week I thought the local inference stack on {% device "yeti-cachy" %} had hit its ceiling.

I'd squeezed [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/) up to **20.8 tok/s** steady-state decode on upstream `llama.cpp` master, and **27.06 tok/s** with Daniel Han's MTP branch (#28243) plus Aman Gupta's NVMe `madvise` row prefetching (#29599). The 176B count combines a 125B-parameter MoE (about 6B active per token) with a 51B n-gram embedding table that I keep on NVMe. The roughly 4B MTP head is additional and excluded from that count.

Then I booted Strata:

```text
strata serve:
  prompt: 59787 tokens (0 reused, 59787 read)
  prefill: 29701 ms (2013.0 tok/s)
  generated: 512 tokens in 9631 ms (53.2 tok/s)
  drafts accepted: 244 of 331
  decode expert cache hit rate: 73.8%
    (174835 hits / 236824 lookups)
```

Log excerpt reformatted for readability; values are unchanged.

Same card, same box, 60k tokens of context: **53.2 tok/s decode** and **2,013 tok/s prefill**. This post is the technical write-up: how I measured it, how Strata lays out memory, and what I can and can't conclude. The broader argument about why narrow engines like this are showing up is in the companion essay, [The Rise of Overfit Inference Engines](/blog/local-inference/the-rise-of-overfit-inference-engines/).

## Test setup

{% callout "note", "Test hardware" %}
All tests ran on {% device "yeti-cachy" %}, CachyOS, CPU governor set to `performance`.
{% endcallout %}

| Component | Spec |
| --- | --- |
| CPU | Intel Core i5-12600K, 10 cores / 16 threads |
| GPU | NVIDIA RTX 4070, 12 GB GDDR6X, 504 GB/s, PCIe 4.0 x16 |
| RAM | 64 GB DDR5-5600, dual channel, ~75 GB/s theoretical |
| SSD | WD Black SN770 2 TB, PCIe 4.0, [rated 5.15 GB/s sequential read](https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/western-digital/product/internal-drives/wd-black-ssd/product-brief-wd-black-sn770-nvme-ssd.pdf) |

The SSD's rated figure is for sequential reads. The n-gram table is read in small, sparse chunks, so real throughput there is lower. I haven't measured random-read throughput on this drive yet.

### Reproducibility

| | Strata | llama.cpp baseline | llama.cpp MTP |
| --- | --- | --- | --- |
| Version / commit | engine 0.1.30, checkout [`30ec18e`](https://github.com/Niko1221/Strata/tree/30ec18ec7094550fcc594fd948220d511d80464e) + local patches | master b11241 (`1c4729414`) | b11268 (`f382a59e3`) + QSA stack (incl. #29599) + #28243 |
| Weights | [ISTA-DASLab GSQ-RCO IQ3_XXS](https://huggingface.co/ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF), 3.00 bpw average | AtomicChat AD-4.27bpw | AtomicChat AD-4.27bpw + shared-Q4_K_M MTP head |
| KV cache | k8v4, 128k preallocated | q8_0 / q8_0, 96k | q8_0 / q8_0, 16k |
| Placement | per-expert VRAM cache | `--fit on --fit-target 512` | `-ngl 99 -ncmoe 46` |

Full commands are in [Reproduction notes](#reproduction-notes) at the end. The harness, `bench_strata_long_horizon.py`, will live in the [L3MS benchmark directory](https://github.com/carteakey/l3ms/tree/main/bench-models). At this revision it and the raw Strata results are still local, so I've published a [sanitized evidence extract](/blog/local-inference/overfit-inference-evidence.json) with the saved metrics and the matching server log lines.

One thing to keep in mind for every comparison below: **Strata and llama.cpp run different quantizations of the same model**. They move different numbers of bytes per token and may not produce identical outputs. The quality section covers what I checked.

## The headline numbers

Against my best llama.cpp setup (MTP branch, 27.06 tok/s), Strata is about **2× faster** in sustained decode. Against plain master without an MTP head it's about **2.6×**. Both comparisons are fair to make, but they answer different questions, so here they are side by side.

| Strata figure | tok/s | vs master (20.8) | vs MTP branch (27.06) |
| --- | ---: | ---: | ---: |
| 60k-context run | 53.2 | 2.6× | 2.0× |
| Best sustained row (2k context) | 60.3 | 2.9× | 2.2× |
| Peak burst, repetitive code, warm drafts | 90.2 | 4.3× | 3.3× |

The 90.2 figure is a burst, not a steady state. It comes from my 2026-09-30 head-to-head notes: one 256-token generation on a repetitive code prompt, same Strata config, 97.0% draft acceptance. The retained server log records 256 tokens in 2,838 ms, with 192 of 198 drafts accepted; that line is included in the evidence extract. Don't plan around it.

**Context matters here, and it cuts in Strata's favor.** Both llama.cpp numbers come from short prompts: the MTP figure in a 16k window, master in a 64k–96k window. The 53.2 is with ~60k tokens actually in context. Short prompt against short prompt, Strata's rows run 52.7–60.3 tok/s, so the ratio is still about 2–2.2×. The MTP tier also doesn't scale to long contexts on this card: in my context ladder its decode drops below master from a 32k window up. Against llama.cpp at a filled 60k context, 2× is likely conservative.

{% diagram_card {
  src: "./src/static/img/diagrams/qwen38-flash-next-throughput-comparison.png",
  alt: "Bar chart: llama.cpp master without MTP 20.8 tok/s, llama.cpp MTP V2 27.06, Strata at 60k context 53.2, Strata best context-sweep row 60.3, Strata warm repetitive-code burst 90.2. Quantization and context settings differ.",
  kicker: "Decode · RTX 4070 12GB + 64GB DDR5",
  title: "Measured Serving Setups",
  badge: "53.2 / 27.06 = 1.97×",
  caption: "Different quants and context settings. 60.3 t/s is the best context-sweep row (1,966 prompt tokens); 90.2 t/s is a warm repetitive-code burst, not sustained throughput. Strata with speculation off remains unmeasured."
} %}

## The baseline: how llama.cpp runs this model

On a 12 GB card, llama.cpp can't hold the experts. My master setup uses `--fit on --fit-target 512`, which keeps attention, shared weights and the KV cache on the GPU, places four MoE expert layers there too, and leaves the rest of the routed experts in system RAM. The MTP setup uses `-ngl 99 -ncmoe 46`: routed experts from 46 layers on the CPU, two on the GPU.

For those CPU-resident experts, llama.cpp runs the expert matmuls on the CPU against DDR5. It doesn't copy every expert's weights to the GPU each token, but activations and synchronization still cross the CPU/GPU boundary at every layer.

### How much data moves per token

All sizes in this section are MiB/GiB.

The model has 48 layers with 512 routed experts each, 24,576 in total. Strata's cache holds 3,086 experts in 5.04 GiB, so one expert at Strata's IQ3_XXS quant averages about 1.67 MiB (the 39.97 GiB host arena ÷ 24,576 gives the same). [Qwen's model card](https://huggingface.co/Qwen/Qwen3.8-Flash-Next) routes 10 experts per layer, which gives:

- 48 layers × 10 experts = **480 expert lookups per evaluated token**
- 480 × 1.67 MiB ≈ **800 MiB of expert weights per token at Strata's quant**

That's a size estimate, not measured memory traffic. GSQ-RCO uses different quant types across layers, so the bytes touched also depend on which experts are routed. Its [3.00 bpw figure](https://huggingface.co/ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF#available-files) averages the transformer weights and excludes the n-gram table. I can't scale expert bytes by the ratio of that figure to llama.cpp's AD-4.27bpw label; I'd need the actual expert tensor sizes in both builds.

### What the bandwidth ceiling tells us

The theoretical DDR5 peak isn't a measurement of bandwidth available to these expert matmuls. Sparse accesses, memory latency and synchronization can keep effective throughput well below a sequential bandwidth test. A gap below that ceiling doesn't prove the workload isn't bandwidth-bound.

CPU matmul throughput, thread synchronization and CPU/GPU handoffs are also candidates. I haven't profiled this with `perf` or `nsys`, so I can't say which dominates. Moving fewer weights through DDR5 could help, but it doesn't by itself explain the measured speedup.

## How Strata lays out memory

Strata drops layer-granular offloading. Instead of deciding which layers live on the GPU, it decides which individual experts do, drawing from all 48 layers.

That works because MoE routing is uneven: a small resident set can cover much more than its share of lookups. My 3,086 cached experts are about 13% of the total, and the server reports hit ratios around 71–77%. There's a counting caveat below, so that isn't a measured share of all lookups or GPU compute.

### The cache policy

The policy has two parts:

1. **Seeded offline.** Residency starts from `expert-profile.bin`, a ranking of routing frequencies. The startup message "PROFILE ... no eviction" describes this initial fill only.
2. **Adapted online.** The checked-out source keeps decayed usage counts. By default, every four verification rounds it can swap up to 96 experts, replacing less-used resident experts with more-used missing ones *from the same layer*. Counts decay by 0.7 after each adaptation pass.

So it's frequency-based adaptation, not LRU, and residency does change during a session. `--adapt-every 0` turns the online part off.

### The three tiers

| Tier | Size | Bandwidth | What lives there |
| --- | --- | --- | --- |
| RTX 4070 VRAM | 12 GB (11,710 MiB used) | 504 GB/s | 3,086 hot experts (5.04 GiB), attention and dense weights, MTP head (876 MiB, Q2_0), k8v4 KV cache preallocated for 128k |
| DDR5 host RAM | 64 GB | ~75 GB/s theoretical | Expert arena, 39.97 GiB, pinned host memory |
| NVMe | 2 TB | 5.15 GB/s rated sequential | 51.2B-parameter n-gram table (~28.8 GB), read lazily via mmap at ~5 KB per token |

Between VRAM and RAM sits PCIe 4.0 x16, about 31.5 GB/s each way.

{% image_cc "./src/static/img/diagrams/overfit-memory-hierarchy-corrected.png", "Three memory tiers: RTX 4070 VRAM for cached experts and GPU state; DDR5 for the full host expert arena and CPU miss work; SN770 SSD for the mmap n-gram table. PCIe carries activations, selected miss work, and cache refills.", "sketch-draw", "Capacity and placement, not a measured bandwidth profile. The SN770's rated sequential read peak is 5.15 GB/s; sparse page faults won't achieve that rate." %}

Three notes on the RAM tier:

- **The arena holds every expert.** 24,576 experts × 1.67 MiB ≈ 40 GiB, so the 39.97 GiB arena is the full host copy in this run, not just the cold ones. The hot set in VRAM is a duplicate.
- **Headroom is thinner than it looks.** Total host RAM in use during real tool calls was 52.5 GB (see telemetry below), leaving about 11.5 GB for the OS and desktop.
- **The n-gram table isn't free.** It doesn't count against RAM directly, but the pages it touches sit in the page cache. That memory is reclaimable, not free.

The checked-out tree also carries a local `MADV_HUGEPAGE` patch in `src/core/pinned.cu`. The benchmark startup log says it fell back to 4 KB pages, and I don't have a matched page-size comparison, so I'm not crediting any of these results to huge pages.

### What the hit rate means

The reported 71–77% hit ratio is **per expert lookup, not per token**. With 480 lookups per evaluated token, a true 25% miss rate would mean about 120 misses per token on average. It wouldn't mean only one token in four encounters a miss. The logger doesn't count every lookup, though, so I can't infer the actual miss rate directly from that number.

I checked how the source counts, and two details matter:

- **Lookups aren't deduplicated, but expert jobs are grouped.** Inside a verification window, the counter ticks once per position per routed slot. Positions that route to the same expert can share a batched job and a weight fetch. Each position still needs its own matmul result; the output isn't computed once and reused. Grouping can reduce weight traffic and scheduling overhead, and batched verification can offer that benefit in other runtimes too.
- **The logged hit rate is an upper bound.** In those windows, misses sent down the PCIe path count as neither hits nor misses, so they drop out of the denominator. The 60k numbers don't fully reconcile either: ~600 evaluated positions × 480 would be ~290k lookups, against 236,824 logged. I haven't pinned down that gap.

Those accounting details stop me turning the logged hit ratio into a reliable MiB-per-generated-token figure. I'd need complete residency counters, routed expert sizes and verification-batch reuse, or a direct traffic measurement. Different quants add another variable to the llama.cpp comparison.

A miss doesn't always stream over PCIe. The source splits miss work between a CPU pool (nine expert-pool workers in this run) and a GPU path over PCIe. At startup, a PCIe probe picked a 0.14 share of missed expert work for the GPU path in this run. PCIe also carries activations and cache refills, so traffic isn't limited to misses.

### Why this is faster

My working explanation is a combination of GPU expert compute, less host weight traffic, batched expert jobs and speculation. Resident experts run on the GPU, and some missed expert work goes there too. CPU miss work remains, so the CPU/GPU handoffs haven't disappeared. The hit ratio doesn't tell me what fraction of the math runs on either device, and I can't rank these contributions without a profile and ablation.

{% image_cc "./src/static/img/local-inference/strata-qwen38-flash-next-dashboard.png", "Live Strata runtime telemetry dashboard running Qwen3.8-Flash-Next on an NVIDIA GeForce RTX 4070 with 12GB VRAM", "w-full border border-surface-border my-6", "Live Strata telemetry on the RTX 4070: 67.6 tok/s decode, 1,959 tok/s prefill, 3,086 experts cached in VRAM (5.0 GB), and 52.5 GB of host RAM in use during a real agentic session." %}

## MTP on top, and the experiment I still owe

Strata also runs the model's own multi-token prediction head as a draft model, entirely in VRAM. My configuration uses `--spec 4`, which the source defines as a verification window holding the previous accepted token plus up to three drafts. The main model verifies them in one forward pass. In the 60k run, 244 of 331 drafts were accepted (73.7%). Across the sweep, acceptance sat between 65.6% and 83.7%.

Prompt-lookup speculation is enabled too; the logs record those "suffix drafts" separately (65 of 69 accepted in the 60k run). Repeated filler text in my harness flatters it.

So at least three things changed at once: the expert cache, MTP, and prompt lookup. I can't yet tell you how much of the gain comes from each. The llama.cpp numbers don't help here: the MTP tier is 30% faster than master (20.8 → 27.06), but master already runs ngram-mod prompt lookup, and the MTP tier also differs in build, placement, context window and batch size. That 30% is a different setup, not speculation alone.

The ablation that would settle it is Strata with the cache on and all speculation off, same quant, same prompts, same warmup. **I can't run it on this build.** The native IQ pack path requires `--spec T` with `T >= 2`, and the serving path requires an MTP runtime, so `--spec 0` doesn't give a comparable run. Until there's a verified non-speculative path, the ~2× result belongs to the complete serving setup, not to the cache.

## Does it hold up at 60k tokens?

Mostly yes: decode stayed between 52.7 and 60.3 tok/s from a 462-token prompt to a 59,787-token one.

Short-prompt numbers are easy to fake, so I wrote a long-context harness. It repeats five paragraphs of synthetic technical prose, hides one passcode (`OBSIDIAN_PHOENIX_<depth>_SECURE`) near the middle, then asks the model to retrieve it and write an analysis of memory-mapped I/O and speculative decoding. It records prefill and decode speed, draft acceptance, cache hit rate, retrieval and VRAM.

**Each row below is one recorded request.** I don't have repetitions or within-row variance. With acceptance swinging between 66% and 84%, differences of a few tok/s between rows are likely noise. The harness's target-size estimator undershot badly, so rows are labeled by actual prompt tokens.

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
| 29,895 | 2,004.3 | 512 | 53.5 | 72.0% | 76.5% | Not saved | 11,710 MiB* |
| 59,787 | 2,013.0 | 512 | 53.2 | 73.7% | 73.8% | Not saved | 11,710 MiB* |
{% endwide %}

*The saved JSON records VRAM for the first seven rows. The last two readings came from the original post and weren't retained independently. `nvidia-smi` reports device-wide usage, not just the KV allocation.*

The 462-token row reused 457 tokens from the previous request and read only five. Its reported 21.0 tok/s prefill is `5 / 0.238 s`, not a cold prefill over 462 tokens, so I've excluded it.

What I take from it:

- **Decode is flat.** 53.2 tok/s at 60k against 56.8 at 462 tokens is within the row-to-row scatter.
- **Prefill speeds up with length.** Strata evaluates prompts in 8,192-token chunks, so short prompts never fill a chunk. Prefill climbs from 585 tok/s at 1k to 2,013 tok/s at 60k, which is 29.7 seconds for a ~60k-token synthetic context. I haven't run a real code repository through it yet.
- **Draft acceptance holds at 70–77%** for every prompt from 3.8k tokens up.
- **VRAM is constant because it's preallocated.** State and KV capacity are sized for 128k at startup, so usage sits at 11,710 MiB no matter how much is filled. The k8v4 quantization is what lets 128k fit; it isn't why the number is flat.
- **Retrieval is weaker evidence than it looks.** The 3,779-token row failed the needle check, and the check can't tell a retrieval miss from an output budget that ran out first. The two deepest runs' logs kept timings, not response text, so I can't verify retrieval there at all. One passcode per depth shows the context is reachable at best, not that the model reasons well across it.

The hit rate at 60k (73.8%) is slightly *below* the short row's 74.1%. My earlier guess that routing gets more predictable once a conversation's vocabulary settles doesn't hold up in this data, and repeated filler would confound it anyway.

## Is it computing the same thing?

A faster runtime only counts if the outputs match. Different quantization means different bytes moved and, potentially, different answers.

| Check | Strata | llama.cpp |
| --- | --- | --- |
| Bits per weight | IQ3_XXS, 3.00 bpw average over transformer weights; n-gram table fixed at 4.5 bpw | AD-4.27bpw |
| Perplexity on a fixed text | not measured | not measured |
| KL divergence vs a higher-precision reference | not measured | not measured |
| Greedy-token agreement over 1,000 tokens | not measured | reference |

Strata is running the lower-bit quant. Some of the speed is therefore coming from moving fewer, smaller weights, and that's a trade-off, not a free win. The GSQ-RCO label also doesn't mean every tensor is IQ3_XXS, so bpw alone isn't a matched quality measurement.

What I do have:

- **A five-question smoke test** that passed on both serving tiers, covering math, bug spotting, algorithm design, JSON and deduction. Reassuring, but it isn't perplexity or logit parity.
- **[Strata's own cache-parity experiment](https://github.com/Niko1221/Strata/blob/30ec18ec7094550fcc594fd948220d511d80464e/bench/results/2026-09-27-cache-parity/README.md)**, which compares cache on and off with Q2_0 on an RTX 5070 over 2,557 teacher-forced tokens. It reports similar perplexity and 95–98% top-1 agreement. That's upstream evidence for a different card and quant, not my IQ3_XXS run or a llama.cpp comparison.

Before calling this a like-for-like win, I need the same text through both engines with teacher-forced perplexity or KL, plus longer context and task checks.

## Greedy decoding and speculation

All my sweep numbers are at temperature 0. That flatters speculative decoding, and readers should know it.

Under greedy decoding, a draft token is accepted only if it matches the main model's top pick. That's a high bar, but drafts from the model's own MTP head clear it often.

With sampling, [exact speculative sampling](https://arxiv.org/abs/2211.17192) uses rejection sampling, which keeps the output distribution identical to running the main model alone. The cost is speed: a draft is accepted with probability tied to how much the draft and main-model distributions overlap. Sampled acceptance can come out higher or lower than greedy agreement. Temperature changes both distributions; it doesn't predict acceptance or speedup on its own. I also haven't audited whether this Strata path implements exact sampled verification.

I haven't measured Strata with sampling. That's the next row to run: the 60k prompt at the server defaults (temperature 1.0, top-p 0.95, top-k 20), reporting acceptance and decode speed.

On quality: in my runs, greedy output was coherent and never looped within 512 tokens. That's a narrow result. [Qwen's own agentic coding evaluation](https://huggingface.co/Qwen/Qwen3.8-Flash-Next) uses temperature 1.0 and top-p 0.95, and agentic sessions run thousands of tokens, where loops are more likely.

So greedy works for the short, structured generations I tested. Whether it's the right default for long agentic sessions is still open.

{% callout "note", "What this does not prove" %}
- **One machine, one model.** Nothing here says Strata is faster on other cards or other models.
- **Greedy only.** No numbers with sampling yet.
- **No ablation.** I can't split the gain between the expert cache, MTP and prompt lookup.
- **No quality A/B.** Different quants, no perplexity or KL check yet.
- **Synthetic context.** The 60k test is repeated technical prose, not a real codebase.
- **One run per row.** Row-to-row differences in the long-context table are probably noise.

What it does show: on this box, at up to 60k tokens of context, Strata decodes this model about twice as fast as the best llama.cpp configuration I could build, and that speed doesn't fall off with context length.
{% endcallout %}

## Reproduction notes

The benchmark log identifies engine **0.1.30**. The inspected Strata checkout is [`30ec18ec7094550fcc594fd948220d511d80464e`](https://github.com/Niko1221/Strata/tree/30ec18ec7094550fcc594fd948220d511d80464e), with local pinned-memory and vision-warmup patches. I didn't keep a binary hash or build manifest tying that exact commit and patch set to every run, so this is a reconstruction of the configuration, not a frozen release artifact.

From the L3MS root, the serving wrapper is:

```sh
vendor/strata/.venv/bin/python vendor/strata/serve/server.py \
  --engine strata --config vendor/strata/strata-iq3_xxs.json
```

The engine arguments in that config are below; the capitalized names stand for local artifact paths, not downloadable filenames:

```sh
engine/strata --pack PACK_IQ3_XXS --native GSQ_RCO_SHARD_1 \
  --ple-gguf GSQ_RCO_SHARD_2 --expert-profile data/expert-profile.bin \
  --expert-cache auto --prefill auto --spec 4 --spec-min-p 0.5 \
  --mtp MTP_RUNTIME_DIR --max-context 131072 --kv k8v4
```

The llama.cpp placement and decoding flags from the serving configuration:

```sh
# Master, with the model path passed through -m:
--fit on --fit-target 512 -c 98304 --parallel 1 -b 4096 -ub 2048 \
  -fa on --jinja -ctk q8_0 -ctv q8_0 -t 10 --threads-batch 12 --prio 2 \
  --lazy-mode on --spec-type ngram-mod --spec-ngram-mod-n-match 60 \
  --spec-ngram-mod-n-min 12 --spec-ngram-mod-n-max 24 --no-warmup
# MTP V2 placement/speculation; uses -b 2048 -ub 512 and the shared head:
-ngl 99 -ncmoe 46 -c 16384 --spec-type draft-mtp \
  --spec-draft-n-max 2 --spec-draft-p-min 0.7 --spec-draft-ngl 99
```

The master tier therefore has prompt-lookup speculation even though it lacks an MTP head. Server sampling defaults are temperature 1.0, top-p 0.95, top-k 20, min-p 0; the context harness overrides temperature to 0. These serving declarations aren't proof that every earlier probe used identical settings. The [Flash-Next post](/blog/local-inference/running-qwen3-8-flash-next-locally/) covers the tuning history.

## A note on trust

Strata is a young project from a solo developer that pins host memory and ships custom CUDA kernels. I build it from a local source checkout with visible patches rather than running a downloaded binary as an opaque appliance. That still isn't an audit, and my missing build manifest is a trust gap as well as a reproducibility one. If you try it, pin a source revision, keep the patch diff and build recipe, record binary hashes, and skim the diff before updating.

## Changelog

| Date | Note |
| --- | --- |
| 2026-10-03 | Split from the original post. Fixed the hit-rate framing (per expert lookup, not per token), the 60k hit rate (73.8%, not 76.5%), the 3,779-token needle failure, the reused-prefix prefill row, the SSD bandwidth, the speedup comparison, the miss path, and the VRAM and greedy explanations. Added the cache policy, setup, quality, reproduction and limits sections. Kept the Strata weight-size estimate separate from measured traffic, removed the unsupported cross-quant bandwidth calculation and GPU-compute percentage, clarified batched expert jobs and the incomplete lookup denominator, stated the llama.cpp context lengths, preserved the raw 90.2 burst log, and dropped the "speculation alone" claim. |
| 2026-10-01 | Corrected the bandwidth arithmetic and removed the double-counted cache and MTP gain. |
| 2026-09-30 | Initial post, as part of The Rise of Overfit Inference Engines. |
