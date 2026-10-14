---
title: "Recursive Self-Improvement (Sort Of) Has Reached Small Local Models"
layout: layouts/note.njk
permalink: /notes/{{ page.fileSlug }}/
description: "Georgi Gerganov uses Qwen3.8-Flash-Next in llama.cpp to optimize llama.cpp itself."
date: 2026-10-14
authored_by: ai-assisted
tags:
  - AI
  - LLMs
---

Georgi Gerganov just merged [PR #30459](https://github.com/ggml-org/llama.cpp/pull/30459) into `llama.cpp`, adding `--spec-draft-n-ubatch` to trim down speculative draft compute buffers and leave more VRAM for target KV caches. 

Take a look at the commit footer on [a32d366](https://github.com/ggml-org/llama.cpp/pull/30459/changes/a32d36656b956698eac3f8431f21aa039bda4e19):

```text
Assisted-by: pi:llama.cpp/Qwen3.8-Flash-Next
```

{% image "./src/static/img/notes/llama-cpp-pr-30459-qwen-assisted.png", "GitHub commit a32d366 on llama.cpp showing attribution Assisted-by: pi:llama.cpp/Qwen3.8-Flash-Next", "w-full rounded border border-surface-border" %}

Gerganov is running `llama.cpp` to serve Qwen3.8-Flash-Next (via `pi`), using it to write C++ patches that improve `llama.cpp` itself. 

It isn't full runaway AGI singularity, but it is recursive self-improvement in the purest hacker sense. The inference engine is being developed with the direct assistance of the inference engine running local weights.

Inevitably, someone in the Reddit comments called it "trivial grunt work any model would perform." Adding a CLI flag and wiring batch sizes through speculative decoding buffers isn't groundbreaking algorithm design, sure. But that misses the point entirely. 

Do we really need to doubt whether Qwen3.8-Flash-Next is legit anymore? When the creator of the premier local inference framework is dogfooding it locally for actual systems programming instead of firing off API calls to a cloud model, that speaks for itself. Battletested by the GOAT himself.

I also love the attribution style. It's clean, transparent, and honest. No corporate "Co-authored-by: Claude" marketing badges, and none of the synthetic PR spam flooding open-source repos. Just a developer sitting at their workstation, pairing with a local model, and pushing solid C++ into master.
