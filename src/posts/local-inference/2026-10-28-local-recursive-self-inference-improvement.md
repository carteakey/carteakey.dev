---
title: "Local recursive self inference improvement: how an agent tunes the model it runs on"
description: "How an agent safely benchmarks its own GPU during a blackout, separates fake gains, and promotes real speedups."
image: /img/blog-sketches/unique/strata-on-an-rtx-4070-stamp-trim.png
imageAlt: "Monochrome pencil sketch of a graphics card beside a tray of cached chips, a larger chip pile, a RAM stick, and a stopwatch"
date: 2026-10-28
giscusTerm: "/blog/local-inference/local-recursive-self-inference-improvement/"
authored_by: ai-assisted
draft: true
hidden: false
tags:
  - AI
  - Self-Host
pinned: false
---

There is a fascinating physical paradox in running an autonomous coding agent on a single local GPU.

My agent runs on a 125B mixture-of-experts model (Qwen3.8-Flash-Next) served through Strata and llama-swap. On a 12 GB RTX 4070, that model fills 11.5 GB of VRAM. If I want the agent to help make its own inference engine faster, we run into a brick wall: the agent and the benchmark share the exact same silicon.

In the cloud, an agent can spin up parallel VMs or call hosted APIs while running profiling scripts. In a homelab, the moment the agent runs a benchmark, the server generating its next thought gets terminated.

This is the reality of Local Recursive Self Inference Improvement (LRSII). For an agent to improve its own engine locally, it has to orchestrate its own temporary blackout, survive session teardown, wake back up, and evaluate what happened without hallucinating fake speedups.

Here is the loop we built, the traps the model fell into, and how it found a genuine speedup without losing an ounce of quality.

## The Homelab Blackout Problem

The core challenge of self-tuning is surviving the test itself. 

When you test serving switches or memory allocators, you have to benchmark the engine under full load. On a single GPU, that means killing `llama-swap.service`. If the agent runs `bench.sh` directly in its shell session, the script immediately kills the server hosting the agent. The connection drops mid-token, the process hangs, and nothing gets evaluated.

To close the loop, the agent had to design a detached execution pattern:

1. **Audit and propose**: The agent inspects its own boot logs and configuration to identify candidate flags and memory levers.
2. **Arm the timer**: It packages the entire A/B ladder into a self-contained script and spawns it using `setsid nohup` with a 75-second initial delay.
3. **Graceful exit**: The agent yields control back to me and finishes its turn before the delay expires.
4. **The blackout**: The background script cleanly stops the model server, reclaims the GPU, runs the benchmark ladder with strict telemetry, logs everything to structured JSONL files, and restarts the serving unit.
5. **Wakeup and triage**: On the next turn, the agent wakes up with the server healthy, reads the logs, parses the telemetry, and grades the results.

The loop works because the agent doesn't try to watch itself sleep. It builds the test harness, steps aside, and inspects the evidence after the fact.

## The Temptation of "Cheating" Benchmarks

When an LLM explores its own engine switches, its first instinct is often to maximize raw tokens per second. But on mixture-of-experts models, raw throughput is dangerously easy to game.

In our 9-arm sweep, one candidate switch looked unbelievable on paper: `STRATA_ROUTE_PRIOR=1.5`.

When the script ran that arm, decode throughput exploded from 70.7 t/s to **102.2 t/s sustained** (peaking at 109.3 t/s). VRAM cache hit rate shot up from 57% to 93%, and PCIe bus traffic dropped to near zero. 

If this were an automated leaderboard benchmark, it would look like a 45% breakthrough. But when we inspected what the switch actually did in the engine code, the truth was ugly: it added an artificial numerical bias to the router's softmax for any expert already sitting in GPU VRAM. 

In other words, the model was cheating. It stopped routing tokens to the smartest experts for the job, and instead routed tokens to whatever happened to be cached on the graphics card. Upstream benchmarks showed that on agent coding tasks, pass rates collapsed from 56% down to 45%. At higher values, the model couldn't even generate valid Python syntax.

A self-improving loop is only as good as its quality guardrails. If you only optimize for the stopwatch, your agent will happily make itself stupider if it means answering faster. We discarded `Route Prior` immediately.

## Finding Real Headroom: The Elastic KV Cache

So where did the real, quality-preserving win come from?

The agent found it by reading its own startup log:

```text
expert cache 2583 slots, 4.24 GiB of VRAM
serve: WARNING: only 410 MiB of VRAM free at start of request
decode expert cache hit rate: 58.6%
```

The 125B model splits its weights between GPU VRAM and host system RAM. The more MoE experts we can fit in VRAM, the fewer times the GPU has to pause and fetch weights over the slow PCIe bus.

Normally, the engine pre-allocates the entire KV cache buffer up front for the full 128,000-token context window. That reserved roughly 4 GB of VRAM, holding it empty just in case a prompt reached 128k tokens. Because that memory was tied up, the expert cache was capped at 2,583 expert slots.

The model proposed testing a switch: `--kv-grow`.

### What does `--kv-grow` actually do?

Unlike speculative decoding tweaks or routing biases, `--kv-grow` does not alter model math, weights, or token selections. It is purely a virtual memory management (CUDA VMM) allocation strategy.

Instead of locking down 4 GB of physical VRAM on boot, `--kv-grow` reserves the virtual address space once, but only maps physical GPU memory pages as actual tokens enter the context. 

All that unmapped VRAM is immediately handed over to the dynamic expert cache:

- **Expert slots on GPU**: Jumped from 2,583 to **3,277 slots** (+694 experts, +1.11 GiB of VRAM).
- **VRAM cache hit rate**: Rose from 57.4% to **62.1%**.
- **Decode speed**: Jumped from 70.7 t/s to **73.53 t/s** (peaking at 78.9 t/s).
- **Quality loss**: **Zero**.

Because the computation, weights, and expert routing decisions are 100% bit-for-bit identical, the model gets a free 2.8 t/s speedup on every generation with zero trade-offs. 

And what happens if a prompt actually reaches 32k or 64k tokens? Does the engine run out of memory? No. The expert cache is an elastic pool: as active context expands and requires more physical VRAM pages, the engine smoothly unmaps cold expert slots back to host RAM. At short-to-medium contexts you get the full 3,277 slots (73.5 t/s); at deep contexts it gracefully dials back toward the baseline (~70 t/s) without crashing or OOMing.

Furthermore, this test was conducted after stepping down from an aggressive DDR5-5800 memory overclock back to stock **DDR5-5200 for long-term system stability**. Even with slower host RAM clocks, reclaiming that VRAM allowed software architecture to beat raw hardware frequency.

{% diagram_card {
  src: "./src/static/img/diagrams/qwen38-flash-next-throughput-progression.png",
  alt: "Line chart showing decode throughput progression on an RTX 4070 up to the 4070-main-lite fork at 69.6 t/s and --kv-grow at 73.5 t/s on stable DDR5-5200.",
  kicker: "Inference Uplift · RTX 4070 12GB + 64GB DDR5",
  title: "Decode Throughput Progression to 73.5 t/s",
  badge: "6.5 → 73.5 tok/s steady",
  caption: "<strong>Uplift Progression:</strong> Early unoptimized baseline (6.5 t/s) → llama.cpp MTP (27.1 t/s) → Strata dynamic cache on DDR5-5800 (65.8 t/s) → lean 4070 fork on stable DDR5-5200 (69.6 t/s) → elastic --kv-grow cache expansion reaching <strong>73.5 t/s steady</strong> (peaking near 79 t/s) with zero quality loss."
} %}

## The Promotion Lifecycle

The final step in recursive improvement is promotion: turning a benchmark finding into production reality.

In our setup, the agent doesn't write directly to live system configs while running experiments. The workflow follows strict gates:

1. **Hypothesis and A/B Sweep**: Test candidate switches against a paired baseline control (which proved drift was under 0.9 t/s across the 20-minute run).
2. **Quality Verification**: Check needle retrieval tests and code generation samples to guarantee zero degradation.
3. **Rejection with evidence**: Flag and document why tempting options failed (like `spec 5` dropping throughput to 61 t/s due to draft rejections, or `route prior` corrupting reasoning).
4. **Configuration promotion**: Update the serving config (`strata-iq3_xxs-ple_q8.json`) with `--kv-grow` and reload `llama-swap`.

## What This Proves

When people talk about AI self-improvement, the discussion usually jumps straight to recursive self-coding superintelligence.

The reality on consumer hardware is much more grounded, but just as interesting. An agent running locally can inspect its own system constraints, write test scripts that safely handle its own temporary shutdown, navigate the trade-offs between synthetic throughput and actual reasoning quality, and promote verified architectural wins back into its daily environment.

The model made itself faster today. Not by rewriting its neural network, but by understanding its own memory footprint.
