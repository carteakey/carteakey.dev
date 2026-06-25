---
title: "L3MS: The Stack Behind My 12GB Local LLM Workbench"
description: "How I download, benchmark, tune, serve, and track local LLMs with L3MS on an RTX 4070."
image: /img/blog-sketches/unique/the-12gb-vram-miracle-l3ms-stack-stamp-trim.png
imageAlt: Transparent monochrome sketch of a massive server rack warping and shrinking to plug directly into a small desktop computer tower
date: 2026-06-12
updated: 2026-06-24
authored_by: ai-generated
draft: false
hidden: true
tags:
  - AI
  - Self-Host
pinned: false
---

I kept accumulating local LLM scripts.

One script downloaded a model from Hugging Face. Another built a particular `llama.cpp` pull request because the model was too new for mainline. Then I had separate run scripts, benchmark scripts, notes about which tensors belonged on the GPU, and a systemd service that I would forget about until it broke something.

The experiments were useful. The pile around them was not.

[L3MS](https://github.com/carteakey/l3ms) is the toolkit I built to turn that pile into a repeatable workflow. The name stands for **Local Large Language Model System**. It is a keyboard-first, script-first workbench for downloading GGUFs, inspecting them, building the runtimes they need, benchmarking CPU/GPU splits, serving the winners, and keeping a record of what worked.

I run it on an RTX 4070 12GB, an i5-12600K, and 32GB of DDR5-6000. That machine has served a 120B MoE at 23.4 t/s, an 80B.A3B coding model at 39.6 t/s, and Gemma 4 MTP profiles above 100 t/s. Those numbers are the fun part, but they are outputs of the stack. L3MS is the work that makes them reproducible.

My current served profiles, commands, and measured results are tracked at [l3ms.carteakey.dev](https://l3ms.carteakey.dev/).

---

## What L3MS actually does

L3MS is not a new inference engine. It sits around `llama.cpp`, `ik_llama.cpp`, and [`llama-swap`](https://github.com/mostlygeek/llama-swap) and gives me one place to operate them.

The repo has a Textual TUI, an interactive CLI, model download configs, build and maintenance scripts, benchmark runners, and the serving configuration. Most of the real decisions remain plain files. I prefer that because the flags that make a model fit are worth keeping in Git, not hiding behind a form.

The basic loop looks like this:

1. Add a model download profile and pull the GGUF files.
2. Build the right `llama.cpp` runtime, including a PR build or `ik_llama.cpp` when mainline is not enough.
3. Benchmark several CPU/GPU placement strategies.
4. Move the winning flags into `llama-swap.yaml`.
5. Load the model through the shared OpenAI-compatible endpoint.
6. Publish the measured profile and its portable command to the dashboard.

This sounds obvious written down. It took a surprising amount of shell archaeology to get there.

## Downloading and inspecting models

The downloader uses a JSON config with the Hugging Face repo, file patterns, destination, revision, and concurrency settings for each model. It preserves existing files by default and can update models already on disk without starting every download in the config.

The TUI puts a usable layer over that file: load, validate, edit, snapshot, restore, and download. There is also a model browser that scans local directories for GGUFs and reads their metadata, including architecture, parameter count, quantization, size, and tensor count.

This matters more than I expected. Model folders get messy quickly when one release has Q4, Q6, vision projectors, MTP assistants, and split shards sitting beside one another. Being able to inspect the actual file instead of trusting my filename memory has saved a few silly benchmark runs.

## Building the inference runtime

New model support often lands in `llama.cpp` while I am still testing it. Sometimes it is in mainline. Sometimes it is sitting in a pull request. Some MoE models still run better through `ik_llama.cpp` for a specific experiment.

L3MS keeps those builds separate. The maintenance scripts can build mainline CUDA, Vulkan, cuBLAS variants, `ik_llama.cpp`, or a temporary `llama.cpp` tree with a selected pull request merged into it. That lets an experimental Sarvam or gpt-oss build exist beside the stable server instead of replacing it.

There is a preflight check and an updater as well. The updater snapshots the current binaries and build metadata, updates `llama-swap`, rebuilds mainline `llama.cpp`, validates the serving config, and only restarts the service if it was already running. I wanted boring updates. Boring is good when a local API has clients depending on it.

## Benching before serving

The benchmark folder is the part of L3MS I use most. Each model can have a baseline script, a strategy sweep, and a fit-based script. Shared runners handle logging and make the same environment overrides work across models.

For a large MoE, the useful question is rarely “does it fit in 12GB?” The useful question is which tensors should live in VRAM and which experts can run on the CPU without wrecking token generation.

I test that rather than guess it. `llama-fit-params` gives me a placement that fits a chosen context and memory margin. Strategy scripts then compare full or partial expert offload patterns. Once a split wins consistently, I turn it into static `-ngl` and `--override-tensor` flags for serving.

L3MS records prompt processing and token generation separately. Prompt processing tells me how the machine handles a large prompt or RAG context. Token generation is the number I notice while reading the answer. A configuration can be excellent at one and mediocre at the other, especially when CPU-offloaded experts are involved.

The repo also keeps the less glamorous discoveries: CPU power profiles changing results between boots, an E-core range hurting a workload, CUDA graph capture running out of headroom, or a vision projector needing a more conservative batch size. These notes are part of the stack because a fast command is not very useful if I cannot reproduce why it was fast.

## One endpoint, many model profiles

Every model I actively serve lives in `llama-swap.yaml`. It is the single source of truth for model IDs, binaries, model paths, context sizes, CPU/GPU placement, sampling defaults, aliases, and reasoning variants.

`llama-swap` exposes one OpenAI-compatible endpoint on port 8080. When a client asks for a model that is not loaded, it starts the matching `llama-server` command and routes the request to it. Idle models unload after ten minutes, while the default Gemma profile is preloaded at startup.

I do not pretend the 120B, 80B, and Gemma profiles fit in VRAM together. They do not even run together. The useful bit is that clients see one API and a stable list of model IDs. I can point a coding client at Qwen3-Coder-Next, use a fast Gemma profile elsewhere, and call gpt-oss for reasoning without maintaining a small zoo of ports and services.

The TUI talks to the same gateway. Its Model Ops view lists the available profiles, loads or unloads them, shows the active model, and tracks CPU, RAM, and GPU use. There is a small chat client for testing, plus job history and retry controls for longer runs. The CLI covers the same common path when opening a full TUI feels excessive:

```sh
python3 l3ms.py --list all
python3 l3ms.py --run
python3 l3ms.py --bench qwen
```

## Where the “12GB miracle” came from

There is no single 12GB trick hiding in the repo. The larger results came from combining a few model-specific techniques and then measuring them properly.

Large MoEs have many total parameters but activate only part of them for each token. That makes CPU/GPU expert splitting surprisingly usable on the right model. Qwen3-Coder-Next is an 80B.A3B model, so its active compute per token is much smaller than its total weight count suggests. My served profile uses a static split derived from the benchmark scripts and reaches 39.6 t/s at a 64k context.

gpt-oss 120B uses a different static expert split and reaches 23.4 t/s at 32k. It is slower, obviously, but still useful enough that “120B on a 4070” stopped feeling like a stunt.

The triple-digit Gemma results come from another path: quantization-aware-trained weights plus native Multi-Token Prediction. The target model verifies several draft tokens at once, so good draft acceptance can raise generation speed sharply. On this machine, Gemma 4 12B QAT + MTP measured 120.8 t/s, while the 26B profile measured 100.6 t/s. The non-MTP controls are much slower, which is why I keep both profiles around.

These are measured profile results on my machine, not promises for every 4070. Context size, prompt shape, power state, build commit, quant, KV cache, and even the task can move the number. The [L3MS dashboard](https://l3ms.carteakey.dev/) keeps the current values beside the exact serving profiles, and separates profile-level throughput from task-level benchmark runs.

## The dashboard is part of the record

The website is the public end of the same workflow, not a second hand-maintained model list.

Active profiles and portable `llama-server` commands are generated from `llama-swap.yaml`. Benchmark-only metadata and retirement notes live in a separate dashboard data file. The site shows what I currently serve, the hardware it was measured on, where the benchmark came from, and why an older profile was replaced.

That last part is important to me. Local inference advice ages badly. A model gets a better quant, MTP lands in mainline, or a once-required PR becomes obsolete. Keeping retired profiles visible makes the experiments useful without presenting every old command as current advice.

L3MS is still Python-first because I am changing the workflow faster than I want to stabilize an API. A Rust port can wait. Right now I would rather have the next weird model go through the same download, inspect, build, bench, serve, and publish loop without creating five more mystery scripts.
