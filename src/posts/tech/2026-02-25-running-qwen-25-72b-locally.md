---
title: Running Qwen 2.5 72B Locally
description: CPU inference for a 72B open-weight model on a high-RAM Linux machine using llama.cpp — no GPU required.
date: 2026-02-25
updated: 2026-02-25
tags:
  - AI
  - Self-Host
hidden: true
pinned: false
featured: false
---

Notes on running a large open-weight model locally on a high-RAM machine without a GPU.

## Hardware

- 62GB RAM (CachyOS)
- CPU inference via llama.cpp

## Setup

### Install llama.cpp

```bash
sudo pacman -S llama-cpp
```

Or build from source for CPU-specific optimisations:

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
cmake -B build -DGGML_NATIVE=ON
cmake --build build --config Release -j$(nproc)
```

### Download the model

Use a Q4_K_M quant for the best quality/RAM tradeoff at this size:

```bash
huggingface-cli download bartowski/Qwen2.5-72B-Instruct-GGUF \
  --include "Qwen2.5-72B-Instruct-Q4_K_M*.gguf" \
  --local-dir ~/models/qwen2.5-72b
```

### Run the server

```bash
llama-server \
  -m ~/models/qwen2.5-72b/Qwen2.5-72B-Instruct-Q4_K_M.gguf \
  --ctx-size 8192 \
  --host 0.0.0.0 \
  --port 8080 \
  -ngl 0
```

`-ngl 0` forces CPU-only inference (no GPU offload).

## Free up RAM first — headless mode

Before loading a 40GB+ model, kill the GUI to free as much RAM as possible:

```bash
headless-mode
```

This runs `sudo systemctl isolate multi-user.target` which stops sddm, kwin_wayland, plasmashell and all graphical services — typically freeing 1.5–2GB. Kill your browser and electron apps on top of that for another 1–2GB.

See the [headless mode snippet](/snippets/headless-mode-cachyos) for setup.

## Performance

CPU inference is slow — expect ~1–3 tokens/second for a 72B Q4 model on a modern desktop CPU. Fine for long background tasks, not great for interactive chat.

For faster inference at this size you need:
- A GPU with 48GB+ VRAM (e.g. RTX 6000 Ada, dual 3090)
- Or quantise further (Q2_K) to trade quality for speed

## OpenAI-compatible API

llama-server exposes an OpenAI-compatible endpoint:

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

Works as a drop-in for any tool that supports custom OpenAI base URLs.
