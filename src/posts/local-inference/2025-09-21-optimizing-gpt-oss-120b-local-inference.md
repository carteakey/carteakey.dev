---
title: Optimizing gpt-oss-120b speed on consumer hardware
description: Squeezing every token per second
date: 2025-09-21
authored_by: human
updated: 2026-03-12
giscusTerm: /blog/optimizing%20gpt-oss-120b-local%20inference/
tags:
  - AI
pinned: true
---
{% callout "note", "Authorship note" %}
Parts of this post were drafted/refined with the help of gpt-oss-120b itself. How meta!
{% endcallout %}

## TL;DR

- **Hardware**: i5-12600K (6P + 4E), RTX 4070 (12 GB), 64 GB DDR5 RAM, Linux (CachyOS, CUDA 13.0).
- **Result**: ~~11 tokens/s~~ -> **25 tokens/s** generation, 420+ tokens/s prompt processing for 32k context.
- **Biggest win**: Enabling DDR5 XMP in BIOS. My RAM was running at 2000 MT/s instead of 6000 MT/s for **months**. 3x memory bandwidth = 3x token generation speed. See [the cautionary tale below](#check-your-ram-speed-seriously).
- **Key flags** that made it possible:
	- `--fit on` (automatic VRAM-aware layer placement - easiest starting point)
	- `--parallel 1` (single slot - reclaims KV cache VRAM for model weights)
	- `taskset -c 0-11` (P-core threads only)
	- `-fa` (flash-attention)
	- Latest llama.cpp build (significant MoE performance improvements since initial post)

**Recommended run script** - uses `--fit` to auto-place layers, works on any system without tuning (tweak paths as needed). Full script in the [l3ms repo](https://github.com/carteakey/l3ms/blob/main/run-models/run-llama-cpp-gpt-oss-120b-optimized.sh):

```bash
#!/usr/bin/env bash

export LLAMA_SET_ROWS=1
export GGML_CUDA_GRAPH_OPT=1
MODEL="/path/to/gpt-oss-120b-mxfp4-00001-of-00003.gguf"

taskset -c 0-11 $LLAMA_CPP_CUDA_PATH \
-m "$MODEL" \
--alias "ggml-org/gpt-oss-120b" \
--fit on \
--fit-ctx 32768 \
--fit-target 512 \
--no-mmap \
--parallel 1 \
--threads 10 \
--threads-batch 12 \
--flash-attn on \
--batch-size 2048 \
--ubatch-size 512 \
--no-warmup \
--temp 1.0 \
--top-k 100 \
--min-p 0.0 \
--top-p 1.0 \
--jinja \
--reasoning-format none \
--chat-template-kwargs '{"reasoning_effort":"high"}' \
--chat-template-file /path/to/chat-template.jinja \
--host 0.0.0.0 --port 8001
```

`--fit` probes free VRAM at startup and automatically computes the optimal `-ngl` + `--override-tensor` placement. No manual tuning needed. To see exactly what it would choose without running the server, use `llama-fit-params` directly - see the [n-cpu-moe / override-tensor section](#n-cpu-moe--override-tensor) below.

**Advanced:** for a deterministic, zero-startup-overhead version with the placement hardcoded, see the [optimized run script](https://github.com/carteakey/l3ms/blob/main/run-models/run-llama-cpp-gpt-oss-120b-optimized.sh) in the l3ms repo (`-ngl 37 --override-tensor ...`).


## Introduction

**gpt-oss-120b** is arguably the best **pound-for-pound** open source model right now. While OpenAI’s licensing and content‑filtering policies can be restrictive, the model is amazing for coding and agentic workloads. The MXFP4 quantization and the sparse MoE architecture are well thought-out from a consumer hardware perspective. Its little brother (or sister) **gpt-oss-20b** is great as well, and can trade blows with models much larger than it.


{% image_cc "./src/static/img/most-attractive-quadrant.png", "Most Attractive Quadrant","", "GPT-OSS-120B and Qwen-3-30B-A3B are the most attractive local models in the current landscape" %}

See https://artificialanalysis.ai/methodology/intelligence-benchmarking

However, the model is still very large (120B parameters) and requires a lot of RAM/VRAM to run. The [official recommendation](https://huggingface.co/ggml-org/gpt-oss-120b-GGUF) is an single 80GB GPU (like NVIDIA H100 or AMD MI300X). Not exactly consumer hardware.

## Motivation
As a selfhosting enthusiast, its fun to have the option of running very capable intelligence, for free (my utilities are included in my rent :P).

Having a local model is great for privacy, offline use, and avoiding vendor lock-in. No API keys, no rate limits, no "we have to change our pricing model" surprises.

While I still use paid services for most tasks, having a local model is a great fallback option (and when the AI winter comes, i'll still have something to fall back on).


# **Results**

With the magic of llama.cpp and some tinkering, I've managed to get it running on my modest setup. Here's my system specs, which should ideally have no right to be able to run a model of this calibre (i had to buy 32gb of RAM to even think about giving it a shot)

- **CPU**: i5 12600k
- **GPU**: RTX 4070 (12GB VRAM)
- **RAM**: 64 GB DDR5 (4 sticks of 16GB running with XMP at 6000 Mhz, praise the silicon lottery)

~~I can squeeze 10-11 tok/s on large outputs at 32k context length (considering decay + me being GPU poor).~~

**Update (2026-02-15):** After enabling XMP (see [the story below](#check-your-ram-speed-seriously)), I'm now getting **25+ tok/s** on gpt-oss-120b. This also applies to Qwen3-Coder-Next where I'm seeing **40 tok/s** with MXFP4. llama.cpp improvements since the original post also contribute to the speed increase.

[According to reddit](https://www.reddit.com/r/LocalLLaMA/comments/162pgx9/what_do_yall_consider_acceptable_tokens_per/), 10 tok/s is the bare minimum for general use.

{% image_cc "./src/static/img/acceptable-tps.png", "Acceptable TPS","", "7-10 tps is around the human reading speed as well" %}

7-10 tps is around the human reading speed as well

## Benchmarks

{% image_cc "./src/static/img/summary.png", "Summary","", "Sample Prompt: Summary of this article" %}

| Measure               |   Current Attempt |    GPT-OSS-20B (same settings) |
|-----------------------|----------:|---------:|
| PP (tps)              |    427.92 |  1707.81 |
| TG (tps)              |     28.00 |   107.35 |
| Prompt tokens         |       512 |      993 |
| Eval tokens           |       128 |     1023 |
| Total tokens          |       640 |     2016 |

{% callout "note", "Metric note" %}
PP and TG come from llama.cpp's performance metrics.
{% endcallout %}

- PP (tps): tokens per second during prompt evaluation (“ppNNN” tests in llama-bench).
- TG (tps): tokens per second during generation (“tgNNN” tests in llama-bench).

## Usability
Here's the famous bouncing balls prompt being one-shot by this model.

{% image_cc "./src/static/img/bouncing-balls.gif", "Bouncing Balls","", "Not as bouncy as you'd expect but still impressive!" %}

## Optimization checklist & detailed notes

Here's some notes after wandering in [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/) (some of which may not make sense) on how to get there if you're on a similar system - in the order of priority. Hugely YMMV based on your hardware.

{% callout "note", "Model files" %}
Always use the original [MXFP4 model files](https://huggingface.co/ggml-org/gpt-oss-120b-GGUF). The `gpt-oss` models are natively "quantized". I.e. they are trained in the MXFP4 format which is roughly equivalent to `ggml`'s `Q4_0`. The main difference with `Q4_0` is that the MXFP4 models get to keep their full quality. This means that no quantization in the usual sense is necessary.
{% endcallout %}


### Optimization checklist (in order of impact)

{% update "2026-04-04" %}
I've compiled all of these lessons (and much more) into a dedicated master reference: **[Local LLM Inference Optimization: The Complete Guide](/blog/local-llm-optimization/)**. That post covers everything below in full detail, plus OS choice, backend selection, KV cache, CUDA specifics, and diagnostics. The list here stays as a quick summary.
{% endupdate %}

1. **CHECK YOUR RAM SPEED** - Seriously. See [below](#check-your-ram-speed-seriously). This was a 3x improvement for me.
2. **Run on Linux** - +~20% TPS (CUDA driver + scheduler).
3. **Build llama.cpp from source with CUDA**. Keep it updated - MoE performance has improved significantly in recent builds.
4. **Use `llama-fit-params` or `--override-tensor`** to place expert layers optimally. See [below](#n-cpu-moe--override-tensor).
5. **Set `--parallel 1`** - single inference slot reclaims KV cache VRAM for model weights.
6. **Go headless** - `sudo systemctl isolate multi-user.target` stops the compositor and display manager, freeing 200–400 MB RAM and VRAM before inference starts. See [snippet](https://carteakey.dev/snippets/headless-mode-cachyos).
7. **Pin threads to P-cores** (`taskset -c 0-11` on i5-12600K).
8. **Use iGPU for display** - alternative to headless if you need the desktop; offloads rendering off the dGPU.
9. **Check your power profile** (CachyOS/KDE users) - `power-profiles-daemon` can silently degrade HWP state on some boots even when `governor` and `EPP` read "performance" in sysfs. Replace with `tuned-ppd`: `sudo pacman -S tuned-ppd && sudo systemctl enable --now tuned && sudo tuned-adm profile throughput-performance`. A clean reboot after this gave a consistent +1–2 t/s on MoE inference with zero other changes.
10. **Env vars**: `LLAMA_SET_ROWS=1` (CPU cache locality), `GGML_CUDA_GRAPH_OPT=1` (CUDA graph optimization).
11. **Others**: `-fa` (flash-attention), `--top-k 100`, `--no-mmap`.

### Check your RAM speed. Seriously.

This is the single biggest lesson from this entire optimization journey.

For **months**, I was getting 10-11 tok/s and couldn't figure out why users with nearly identical hardware (i5-13400F, similar GPU) were getting 24-26 tok/s. I tried every llama.cpp flag, every thread count, every batch size. Nothing moved the needle significantly.

Then I ran:

```bash
sudo dmidecode -t memory | grep -E "Speed|Configured"
```

And saw:

```
Speed: 4800 MT/s
Configured Memory Speed: 2000 MT/s
```

My DDR5-6000 sticks were running at **2000 MT/s**. Not 6000. Not even the JEDEC base of 4800. **Two thousand.** The DRAM frequency in my BIOS was set to "Auto" instead of the XMP profile. On my B760M Steel Legend WiFi, "Auto" apparently means "the absolute bare minimum."

For MoE models where the expert weights live in system RAM, token generation speed is directly proportional to memory bandwidth:

| RAM Speed | Theoretical BW (dual-channel) | My TG (tok/s) |
| --- | --- | --- |
| DDR5-2000 (what I had) | ~32 GB/s | ~10-11 |
| DDR5-6000 (XMP enabled) | ~96 GB/s | **~30** |

That's a **3x improvement** from a single BIOS setting. All those weeks of tuning llama.cpp flags were optimizing within a 3x handicap.

**How to check yours:**

```bash
# Linux
sudo dmidecode -t memory | grep -E "Speed|Configured"

# Look for "Configured Memory Speed" - this is what you're ACTUALLY running at.
# If it doesn't match your XMP/EXPO profile speed, go enable it in BIOS.
```

If you're running DDR5 and haven't explicitly enabled XMP/EXPO in your BIOS, **go check right now**. Especially on Intel B760/B660 boards where "Auto" doesn't mean "use the XMP profile."

### Memory Requirements

- The token generation is directly dependent on memory speed. Atleast 64GB of RAM is needed for this model to run at all. The model needs to be in RAM for best performance. If you have enough VRAM, it can stay there, but if not, RAM is the next best thing. SSD is a distant third (expect unusable speeds).

> VRAM >> Unified > DDR5 > DDR4 >>>> SSD > HDD

- If you've got enough VRAM to load this model, you may leave.

{% image_cc "./src/static/img/happy-for-you.png", "To all VRAM owners", "10vw align-center justify-center" , "To all > 64GB VRAM owners" %}

- Unified Memory, like on Apple Silicon, is the next best thing. AMD Strix Halo is one of the best options for Windows users.

- For consumer systems - DDR5 makes a ton of difference over DDR4.

### install linux

- It's time - just do it and you'll get  20% extra performance (tokens per sec aka tps), dont ask me why.
- WSL2 is not the ultimate solution; it helps but not halfway.
- Dual boot if you want to play anti-cheat games (**tip:** install linux on drives separate from windows)

### Go headless

If you're on Linux with a desktop environment, your display manager, compositor, and graphical services are sitting in RAM and consuming a slice of VRAM for display. Switching to headless mode frees all of that up before starting inference - worth 200–400 MB RAM and whatever VRAM the compositor was holding.

Full snippet and fish functions at [carteakey.dev/snippets/headless-mode-cachyos](https://carteakey.dev/snippets/headless-mode-cachyos). The short version:

```bash
# Enter headless mode (stops display manager + compositor, frees RAM/VRAM)
sudo systemctl isolate multi-user.target

# Restore GUI when done
sudo systemctl isolate graphical.target
```

For a one-shot shell alias that also drops page caches - pick your shell:

**Bash** (`~/.bashrc` or `~/.bash_aliases`):

```bash
alias headless-mode='sudo systemctl isolate multi-user.target && sudo sync && sudo sh -c "echo 3 > /proc/sys/vm/drop_caches" && free -h'
alias headless-mode-off='sudo systemctl isolate graphical.target'
```

**Fish** (`~/.config/fish/functions/headless-mode.fish`):

```fish
function headless-mode
    sudo systemctl isolate multi-user.target
    sudo sync
    sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'
    free -h
end
```

Without a display server you lose your terminal emulator - use [zellij](https://zellij.dev) in a TTY for split panes and tabs: `sudo pacman -S zellij && zellij`. Keybindings are shown on screen.

### llama.cpp instead of ollama

- ollama is great for people who dont wanna fiddle, you're not those people.
- llama.cpp comes with a host of settings that you'd need to get your hands dirty on to make it go brr for your system (instead of fixed defaults in ollama)
- [build from source](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md) so its tuned per your hardware. Here's a [sample script](https://github.com/carteakey/lllms/blob/86e316ce4a15f4fc60ab9bb422d0fd000ba228b8/build-llama-cpp.sh) for Nvidia folks
- See the [Readme](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md) for the overwhelming list of params you've unlocked.
- **Keep it updated** - MoE inference performance has improved significantly across builds. Rebuilding from latest source contributed to the speed increase alongside XMP.

### n-cpu-moe / override-tensor

There are three approaches to MoE layer placement, in increasing order of control:

**1. `--n-cpu-moe N`** (simplest)

llama.cpp [added](https://github.com/ggml-org/llama.cpp/pull/15077) this param to keep the MoE weights of the first N layers on CPU. Quick to tune - just reduce N until the model fits in VRAM. The downside is it can push all expert weights into RAM and crash a 64 GB system if N is too high.

```bash
--n-cpu-moe 31   # keep first 31 of 36 MoE layers on CPU
```

**2. `--fit on`** (recommended - just works)

Add `--fit on`, `--fit-ctx 32768`, and `--fit-target 512` to your server command and llama.cpp handles placement automatically at startup. It probes free VRAM, computes the optimal `-ngl` + layer placement, and starts serving - no manual tuning needed. This is what the [recommended run script](https://github.com/carteakey/l3ms/blob/main/run-models/run-llama-cpp-gpt-oss-120b-optimized.sh) uses.

```bash
--fit on \
--fit-ctx 32768 \    # minimum context to guarantee fits
--fit-target 512     # leave 512 MiB VRAM headroom
```

If you're curious what fit would choose before committing to a run, `llama-fit-params` prints the computed flags to stdout without starting the server:

```bash
./vendor/llama.cpp/build/bin/llama-fit-params \
  -m /path/to/gpt-oss-120b-mxfp4-00001-of-00003.gguf \
  -fitt 512 \
  -fitc 32768
# outputs: -c 32768 -ngl 37 -ot "blk\.5\.ffn_..."
```

That output is also what you'd hardcode if you want a static placement (see option 3 below). See the [l3ms bench scripts](https://github.com/carteakey/l3ms/tree/main/bench-models) for scripted examples.

**3. `--override-tensor` regex** (most control)

Fine-grained per-layer, per-projection control. More complex but lets you pack the GPU tighter than `--n-cpu-moe` can.

{% callout "warning", "Critical gotcha for models with shared experts" %}
Some models (e.g. Qwen3.5-122B, some gpt-oss variants) have *two* expert tensor families - routed experts (`_exps`) and a shared expert (`_shexp`). Patterns like `.ffn_.*_exps.=CPU` only match routed experts. The shared expert stays on GPU and silently consumes VRAM, causing CUDA OOM. Use `(ch|)exps` to match both:
{% endcallout %}

```bash
# Safe - matches both routed (_exps) and shared (_shexp) experts:
--override-tensor ".ffn_(up|down|gate)_(ch|)exps=CPU"

# Partial-CPU (best result for gpt-oss-120b on 12 GB - blk 0-4 on GPU, rest on CPU):
--override-tensor "blk\.(5|[6-9]|[0-9][0-9]|[0-9][0-9][0-9])\.ffn_(up|down|gate)_(ch|)exps=CPU"
```

The partial-CPU pattern (blk 5+ on CPU) was the bench winner for gpt-oss-120b: **pp=428 t/s, tg=28 t/s** confirmed in the server. It packs 9.7 GB of model weight into VRAM with only 12 MiB free - every available MiB goes to weights.

{% callout "warning", "RAM ceiling warning" %}
`--n-cpu-moe 36` (all experts on CPU) loads ~60 GB into RAM and will hard-crash a 64 GB system. Always use `llama-fit-params` or the partial-CPU `-ot` pattern to keep RAM under ~50 GB.
{% endcallout %}

### iGPU utilization

- Since I've got an iGPU in my chipset, I can offload a few hundred MB of VRAM of running the desktop through that.
- It lets me squeeze just 1 more layer into VRAM (so I have `--n-cpu-moe 31` now)

- Plug in the HDMI / Displayport in the motherboard port instead of GPU (this only applies to PC's)
- Switch to iGPU as the primary GPU in the BIOS

Here's my card running with 0% utilization

**Using Nvidia**
```bash
kchauhan@kpc:~$ nvidia-smi
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 580.65.06              Driver Version: 580.65.06      CUDA Version: 13.0     |
+-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA GeForce RTX 4070        Off |   00000000:01:00.0  On |                  N/A |
|  0%   35C    P8              7W /  200W |     824MiB /  12282MiB |      4%      Default |
|                                         |                        |                  N/A |
+-----------------------------------------+------------------------+----------------------+
```

**Using iGPU**
```bash
kchauhan@kpc:~$ nvidia-smi
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 580.65.06              Driver Version: 580.65.06      CUDA Version: 13.0     |
+-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA GeForce RTX 4070        Off |   00000000:01:00.0 Off |                  N/A |
|  0%   43C    P8              5W /  200W |      27MiB /  12282MiB |      0%      Default |
|                                         |                        |                  N/A |
+-----------------------------------------+------------------------+----------------------+
```

### P cores only

Intel CPU (12th gen onwards) come with a 6 performance cores and 4 efficiency (E) cores. The P-cores clock at 4.90 GHz while E-cores clock at 3.60 GHz. Running LLM inference on e-cores causes slowdowns.

Efficiency cores effect on performance has been known for a while and the standard way to avoid to avoid efficiency cores has been to leave the number of threads low.

This can be controlled using the `-t` parameter. More threads isn't really beneficial and in general, the devs recommend setting it equal to the amount of performance cores - 1 you have.

e.g. on my `Intel Core i5-12600K Desktop Processor 10 (6P+4E)` - i would be using this to strictly bind the threads to CPU cores 0-5, one thread per core.

```bash
taskset -c 0-11 ./vendor/llama.cpp/build/bin/llama-server ...
```

### Top-k
Top-K sampling is a fancy name for “keep only `K` most probable tokens” algorithm. Higher values can result in more diverse text, because there’s more tokens to choose from when generating responses. The default top-k being 0 means using the full vocabulary. Capping it to 100 seems to help with speed without much quality loss.

```bash
--top-k 100
```

## Conclusion

Overall, I'm very happy with the results. The model is usable for interactive coding tasks now and is a joy to use. I'll keep updating this post as I find more optimizations and as llama.cpp matures.

Some of the options I haven't experimented with yet but seem promising:
- KV cache quantization (preliminary tests show it worsened performance for me but YMMV)
- Vulkan backend instead of CUDA (haven't tried yet)
- ik_llama.cpp fork - tested briefly, CUDA graph compilation overhead hurt pp badly on hybrid CPU+GPU configs. Not competitive here.
- DDR5 timing tightening (tRFC, tRCD, tRP) for additional bandwidth gains
- Speculative decoding with a small draft model
- `GGML_CUDA_FORCE_CUBLAS=ON` build - tested, actually slower (~45 t/s pp regression) because the GGML MMQ mxfp4 kernel outperforms cuBLAS at decode-batch sizes. Default build wins.

All bench scripts, run scripts, and a structured runbook are maintained in the [l3ms repo](https://github.com/carteakey/l3ms).

## Post-mortem / Changelog
- 2025-09-21 - Initial draft
- 2025-09-22 - Updated threads to 10 as per Reddit suggestion. This means using 10/12 threads (only P-cores) to not choke the CPU.
- 2025-09-22 - Updated CPU pinning to use taskset instead of llama.cpp's cpu-range, thanks to [this Reddit suggestion](https://www.reddit.com/r/LocalLLaMA/comments/1nn72ji/comment/nfihoid). This better isolates the process to P-cores only.
- 2026-02-15 - **The XMP incident.** Discovered my DDR5-6000 RAM was running at 2000 MT/s because BIOS DRAM frequency was set to "Auto." Enabling XMP tripled token generation from ~10 t/s to ~30 t/s. This explains why my performance was so far behind users with similar hardware.
- 2026-02-15 - Added "Check your RAM speed" section. Shoutout to the community members who kept telling me something was off with my numbers.
- 2026-02-15 - Updated to latest llama.cpp build. MoE inference improvements in recent builds also contributed to the speed increase. Added `GGML_CUDA_GRAPH_OPT=1` env var.
- 2026-02-15 - Suggest using `fit` instead of `n-cpu-moe` going forward.
- 2026-03-12 - **Static placement wins.** Replaced `--fit` with hardcoded `-ngl 37 --override-tensor` derived from `llama-fit-params`. Faster startup, deterministic placement, no run-to-run variance. Added `--parallel 1` - dropping from default 4 slots reclaimed 540 MiB VRAM for model weights (+1 t/s tg). TG updated to 28 t/s (server observed). Full bench runbook and all scripts in [l3ms](https://github.com/carteakey/l3ms).
- 2026-03-12 - Expanded `--override-tensor` section with `llama-fit-params` workflow, shared-expert gotcha (`(ch|)exps` pattern), and RAM ceiling warning for 64 GB systems.
- 2026-03-12 - Tested `GGML_CUDA_FORCE_CUBLAS=ON` build and ik_llama.cpp - both slower than default llama.cpp on this hybrid CPU+GPU config. Closed out.
- 2026-03-13 - Found and fixed intermittent slow tg (20–30% below expected): `power-profiles-daemon` (KDE default on CachyOS) was degrading CPU HWP state on some boots despite sysfs showing `governor=performance` and `EPP=performance`. All standard diagnostics looked clean. Replaced with `tuned-ppd` + `throughput-performance` profile. Added to optimization checklist (item 9).

### Bouncing Balls Prompt

```
Write a Python program that shows 20 balls bouncing inside a spinning heptagon:
- All balls have the same radius.
- All balls have a number on it from 1 to 20.
- All balls drop from the heptagon center when starting.
- Colors are: #f8b862, #f6ad49, #f39800, #f08300, #ec6d51, #ee7948, #ed6d3d, #ec6800, #ec6800, #ee7800, #eb6238, #ea5506, #ea5506, #eb6101, #e49e61, #e45e32, #e17b34, #dd7a56, #db8449, #d66a35
- The balls should be affected by gravity and friction, and they must bounce off the rotating walls realistically. There should also be collisions between balls.
- The material of all the balls determines that their impact bounce height will not exceed the radius of the heptagon, but higher than ball radius.
- All balls rotate with friction, the numbers on the ball can be used to indicate the spin of the ball.
- The heptagon is spinning around its center, and the speed of spinning is 360 degrees per 5 seconds.
- The heptagon size should be large enough to contain all the balls.
- Do not use the pygame library; implement collision detection algorithms and collision response etc. by yourself. The following Python libraries are allowed: tkinter, math, numpy, dataclasses, typing, sys.
- All codes should be put in a single Python file.
```

### Reference Articles
- Some excellent stuff from the official big guys --> [guide : running gpt-oss with llama.cpp #15396](https://github.com/ggml-org/llama.cpp/discussions/15396)

Lots of help from the community on reddit and github discussions
- [PSA/RFC: KV Cache quantization forces excess processing onto CPU in llama.cpp](https://www.reddit.com/r/LocalLLaMA/comments/1ng0fmv/psarfc_kv_cache_quantization_forces_excess)
- [Top-k 0 vs 100 on GPT-OSS-120b](https://www.reddit.com/r/LocalLLaMA/comments/1n4pt0x/topk_0_vs_100_on_gptoss120b)
- [16→31 Tok/Sec on GPT OSS 120B](https://www.reddit.com/r/LocalLLaMA/comments/1ndit0a/1631_toksec_on_gpt_oss_120b )
- [120B runs awesome on just 8GB VRAM!](https://www.reddit.com/r/LocalLLaMA/comments/1mke7ef/120b_runs_awesome_on_just_8gb_vram)

- [guide : running gpt-oss with llama.cpp #15396](https://github.com/ggml-org/llama.cpp/discussions/15396)
- [llama.cpp: Offloading MoE layers to CPU #15077](https://github.com/ggml-org/llama.cpp/discussions/15077)
- [llama-cli CPU Control | Pin to Physical Cores #9996](https://github.com/ggml-org/llama.cpp/discussions/9996)
- [Performance 3x better when use performance core only on Intel gen 12th cpu #572 ](https://github.com/ggml-org/llama.cpp/discussions/572)


### Measuring tps incrementally

All benchmarks below use [`llama-bench`](https://github.com/ggml-org/llama.cpp) from a source build with CUDA. Scripts are maintained in the [l3ms repo](https://github.com/carteakey/l3ms/tree/main/bench-models). Run with `taskset -c 0-11` for P-core pinning.

##### Baseline (no params, pre-XMP - historical reference)

> These were run before enabling XMP with DDR5 running at 2000 MT/s instead of 6000 MT/s. Multiply tg128 by ~3x for current numbers.

| test | pp (t/s) | tg (t/s) |
|------|----------|----------|
| `--n-cpu-moe 31 -ngl 99` | 82.11 ± 3.14 | 9.72 ± 0.44 |
| `--n-cpu-moe 31 -ngl 99 -t 6` | 86.45 ± 2.03 | 9.77 ± 0.23 |

##### Current - fit-derived placement + XMP enabled

Using the bench scripts from [l3ms](https://github.com/carteakey/l3ms/tree/main/bench-models):

```bash
# from l3ms repo root
bash bench-models/bench-llama-cpp-gpt-oss-120b.sh
```

This uses `-ngl 37` + `--override-tensor` (fit-derived), `LLAMA_SET_ROWS=1`, `GGML_CUDA_GRAPH_OPT=1`, 10 threads, FA=1, no-mmap.

| KV cache | pp (t/s) | tg (t/s) | notes |
|----------|----------|----------|-------|
| f16 (default) | 429.90 ± 5.28 | 23.85 ± 2.28 | baseline |
| q8_0 | 429.65 ± 4.75 | 23.69 ± 2.40 | **free win** - half the KV VRAM, within noise |
| q4_0 | 403.97 ± 6.67 | 24.04 ± 2.48 | pp regression, no tg gain - skip |

**q8_0 is the sweet spot.** Lossless for most purposes, saves ~570 MiB VRAM at 32k context, zero measurable performance cost. Both run scripts now default to `-ctk q8_0 -ctv q8_0`.

Server observed tg (single slot, short prompt, `--parallel 1`): **~25 t/s** (stable post tuned-ppd fix).
