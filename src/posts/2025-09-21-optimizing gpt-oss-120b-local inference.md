---
title: Optimizing gpt-oss-120b local inference speed on consumer hardware
description: Squeezing every token per second 
date: 2025-09-21
updated: 2025-09-21
tags:
  - LLMs
  - AI

---
> **Note:** Parts of this post were drafted/refined with the help of gpt‑oss‑120b itself. How meta!

## **TL;DR** 

- **Hardware**: i5‑12600K (6P + 4E), RTX 4070 (12 GB), 64 GB DDR5 RAM, Linux (Ubuntu 24.04, CUDA 13.0).
- **Result**: 190 tokens/s prompt processing, 11 tokens/s generation for 32k context → usable for interactive coding tasks.
- **Key flags** that made it possible:
  - `--n-cpu-moe 31` (keep most MoE layers on CPU)
  - `--n-gpu-layers 99` (only 5 layers on GPU)
  - `--cpu-range 0‑5` (P‑core only)
  - `-fa` (flash‑attention)


Final run script (save as `run-gpt-oss-120b.sh`, and tweak paths as needed):

```bash
#!/usr/bin/env bash

export LLAMA_SET_ROWS=1
MODEL="/home/carteakey/lllms/models/ggml-org/gpt-oss-120b-GGUF/gpt-oss-120b-mxfp4-00001-of-00003.gguf"

./vendor/llama.cpp/build/bin/llama-server \
  -m "$MODEL" \
  --n-cpu-moe 31 \
  --n-gpu-layers 99 \
  --ctx-size 24576 \
  --no-mmap \
  --no-warmup \
  -b 2048 \
  -ub 2048 \
  --threads 14 \
  --cpu-range 0-5 \
  --cpu-strict 1 \
  --temp 1.0 \
  --top-k 100 \
  --min-p 0.0 \
  --top-p 1.0 \
  -fa on \
  --jinja \
  --reasoning-format none \
  --chat-template-kwargs '{"reasoning_effort":"high"}' \
  --chat-template-file /home/carteakey/lllms/chat-template.jinja \
  --host 0.0.0.0 --port 8502 \
  --api-key "dummy"


# Notes:
# LLAMA_SET_ROWS=1: 1 row per thread for better CPU cache locality.
# --n-cpu-moe 31: keep first 31 MoE layers on CPU (model has 36 → ~5 left for GPU).
# --n-gpu-layers 99: offload as many non-CPU-forced layers as possible to GPU.
# --ctx-size 24576: 24K context sized for 12 GB VRAM.
# --no-mmap: faster prompt processing when the model sits in RAM.
# --no-warmup: skip initial warm-up pass.
# -b 2048 / -ub 2048: batch sizes for eval/compute; tune per VRAM.
# --threads 14: higher thread count helped on this setup; YMMV.
# --cpu-range 0-5 and --cpu-strict 1: pin to P-cores only on i5-12600K.
# --temp, --top-k, --top-p, --min-p: sampling controls; top-k=100 gives a small speed boost.
# -fa: enable flash-attention CUDA kernels.
# --jinja and --chat-template-file: enable/use Jinja chat template and tools.
# --reasoning-format none + --chat-template-kwargs: select reasoning via template (reasoning_effort=high).
# --host/--port and --api-key: bind server and require a trivial API key.

```



<br/>

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

I can squeeze 10-11 tok/s on large outputs at 32k context length (considering decay + me being GPU poor). [According to reddit](https://www.reddit.com/r/LocalLLaMA/comments/162pgx9/what_do_yall_consider_acceptable_tokens_per/), 10 tok/s is the bare minimum for general use.

{% image_cc "./src/static/img/acceptable-tps.png", "Acceptable TPS","", "7-10 tps is around the human reading speed as well" %}


## Benchmarks

{% image_cc "./src/static/img/summary.png", "Summary","", "Sample Prompt: Summary of this article" %}

| Measure               |     First Attempt |   Current Attempt |    GPT-OSS-20B (same settings) |
|-----------------------|----------:|----------:|---------:|
| PP (tps)              |      4.40 |    191.71 |  1707.81 |
| TG (tps)              |      5.32 |     10.95 |   107.35 |
| Prompt tokens         |        69 |      5501 |      993 |
| Eval tokens           |        37 |      1968 |     1023 |
| Total tokens          |       106 |      7469 |     2016 |

> :information_source: PP and TG come from llama.cpp’s performance metrics.
- PP (tps): tokens per second during prompt evaluation (“ppNNN” tests in llama-bench).
- TG (tps): tokens per second during generation (“tgNNN” tests in llama-bench).

## Usability
Here's the famous bouncing balls prompt being one-shot by this model.

{% image_cc "./src/static/img/bouncing-balls.gif", "Bouncing Balls","", "Not as bouncy as you'd expect but still impressive!" %}

## Optimization checklist & detailed notes

Here's some notes after wandering in [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/) (some of which may not make sense) on how to get there if you're on a similar system - in the order of priority. Hugely YMMV based on your hardware.

> :information_source: Always use the original [MXFP4 model files](https://huggingface.co/ggml-org/gpt-oss-120b-GGUF). The `gpt-oss` models are natively "quantized". I.e. they are trained in the MXFP4 format which is roughly equivalent to `ggml`'s `Q4_0`. The main difference with `Q4_0` is that the MXFP4 models get to keep their full quality. This means that no quantization in the usual sense is necessary.  


### Optimization checklist (in order of impact)

1. **Run on Linux** – +≈ 20 % TPS (CUDA driver + scheduler).  
2. **Build llama.cpp with CUDA & CUBLAS** (`-DLLAMA_CUBLAS=ON`).  
3. **Offload MoE layers to CPU** (`--n-cpu-moe 31`).  
4. **Use DDR5 RAM** (vs DDR4) – +≈ 15 % TPS.
5. **Pin threads to P‑cores** (`--cpu-range 0-5 --cpu-strict 1`).  
6. **Use iGPU for display** (offload desktop rendering) – +≈ 5 % TPS.
7. **Others**: `-fa` (flash‑attention), `--top‑k 100`, `--ctx-size 24576`.


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

### llama.cpp instead of ollama 

- ollama is great for people who dont wanna fiddle, you're not those people. 
- llama.cpp comes with a host of settings that you'd need to get your hands dirty on to make it go brr for your system (instead of fixed defaults in ollama)
- [build from source](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md) so its tuned per your hardware. Here's a [sample script](https://github.com/carteakey/lllms/blob/86e316ce4a15f4fc60ab9bb422d0fd000ba228b8/build-llama-cpp.sh) for Nvidia folks 
- See the [Readme](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md) for the overwhelming list of params you've unlocked.

### n-cpu-moe

- llama.cpp [recently added](https://github.com/ggml-org/llama.cpp/pull/15077) a super helpful param to keeps the MoE weights of the first N layers in the CPU.  
- `--cpu-moe` to keep all MoE weights in the CPU
- `--n-cpu-moe N` to keep the MoE weights of the first N layers in the CPU

That means
- No more need for super-complex regular expression in the `-ot` / `--override-tensor` option 
- Just do `--cpu-moe` or `--n-cpu-moe #`and reduce the number until the model no longer fits on the GPU.

You can still fine-tune by  customize the regex in the `--override-tensor`, some examples from the unsloth 
- `-ot ".ffn_.*_exps.=CPU"` offloads all MoE layers to the CPU!
-  `-ot ".ffn_(up|down)_exps.=CPU"` This offloads up and down projection MoE layers.
- `-ot ".ffn_(up)_exps.=CPU"` offloads only up projection MoE layers.
- `-ot "\.(6|7|8|9|[0-9][0-9]|[0-9][0-9][0-9])\.ffn_(gate|up|down)_exps.=CPU"` means to offload gate, up and down MoE layers but only from the 6th layer onwards.

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
This can be controlled using the `-t` parameter. More threads isn't really beneficial and in general, the devs recommend setting it equal to the amount of performance cores - 1  you have.

Efficiency cores effect on performance has been known for a while and the standard way to avoid to avoid efficiency cores has been to leave the number of threads low.

e.g. on my `Intel Core i5-12600K Desktop Processor 10 (6P+4E)` - i would be using this to strictly bind the threads to CPU cores 0-5, one thread per core.

```bash
-t 6 --cpu-range 0-5 --cpu-strict 1
```

### Top-k
Top-K sampling is a fancy name for “keep only `K` most probable tokens” algorithm. Higher values can result in more diverse text, because there’s more tokens to choose from when generating responses. The default top-k being 0 means using the full vocabulary. Capping it to 100 seems to help with speed without much quality loss. 

```bash
--top-k 100
```

## Conclusion

Overall, I'm very happy with the results. The model is usable for interactive coding tasks now and is a joy to use. I’ll keep updating this post as I find more optimizations and as llama.cpp matures. 

{# Some of the params I haven’t experimented with yet but seem promising:
- Kv cache quantization (``)
- Fine tuned override tensor regex (`--override-tensor`) instead of `--n-cpu-moe` #}



## Appendix

### Bouncing Balls Prompt

```text
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
- Some excellent stuff from the official big guys --> https://github.com/ggml-org/llama.cpp/discussions/15396

Lots of help from the community on reddit and github discussions
- https://www.reddit.com/r/LocalLLaMA/comments/1ng0fmv/psarfc_kv_cache_quantization_forces_excess
- https://www.reddit.com/r/LocalLLaMA/comments/1n4pt0x/topk_0_vs_100_on_gptoss120b
- https://www.reddit.com/r/LocalLLaMA/comments/1ndit0a/1631_toksec_on_gpt_oss_120b 
- https://www.reddit.com/r/LocalLLaMA/comments/1mke7ef/120b_runs_awesome_on_just_8gb_vram 

- [guide : running gpt-oss with llama.cpp #15396](https://github.com/ggml-org/llama.cpp/discussions/15396)
- [llama.cpp: Offloading MoE layers to CPU #15077](https://github.com/ggml-org/llama.cpp/discussions/15077)
- [llama-cli CPU Control | Pin to Physical Cores #9996](https://github.com/ggml-org/llama.cpp/discussions/9996)
- [Performance 3x better when use performance core only on Intel gen 12th cpu #572 ](https://github.com/ggml-org/llama.cpp/discussions/572)


### Measuring tps incrementally

##### No params
```bash
./vendor/llama.cpp/build/bin/llama-bench \
    -m /home/carteakey/repos/lllms/models/ggml-org/gpt-oss-120b-GGUF/gpt-oss-120b-mxfp4-00001-of-00003.gguf
```

##### n-cpu-moe
```bash
./vendor/llama.cpp/build/bin/llama-bench \
    -m /home/carteakey/repos/lllms/models/ggml-org/gpt-oss-120b-GGUF/gpt-oss-120b-mxfp4-00001-of-00003.gguf \
    --n-cpu-moe 31 \
    --n-gpu-layers 999

kchauhan@kpc:~/Desktop/repos/lllms$ ./bench-llama-cpp.sh
ggml_cuda_init: GGML_CUDA_FORCE_MMQ:    no
ggml_cuda_init: GGML_CUDA_FORCE_CUBLAS: no
ggml_cuda_init: found 1 CUDA devices:
  Device 0: NVIDIA GeForce RTX 4070, compute capability 8.9, VMM: yes
| model                          |       size |     params | backend    | ngl |            test |                  t/s |
| ------------------------------ | ---------: | ---------: | ---------- | --: | --------------: | -------------------: |
| gpt-oss 120B MXFP4 MoE         |  59.02 GiB |   116.83 B | CUDA       |  99 |           pp512 |         82.11 ± 3.14 |
| gpt-oss 120B MXFP4 MoE         |  59.02 GiB |   116.83 B | CUDA       |  99 |           tg128 |          9.72 ± 0.44 |

build: da30ab5f (6531)
./bench-llama-cpp.sh: line 10: --n-gpu-layers: command not found
```

##### threads (cpu-range doesn't behave nicely with llama-bench for some reason)
```bash
./vendor/llama.cpp/build/bin/llama-bench \
    -m /home/carteakey/repos/lllms/models/ggml-org/gpt-oss-120b-GGUF/gpt-oss-120b-mxfp4-00001-of-00003.gguf \
    --n-cpu-moe 31 \
    --n-gpu-layers 999 \
    --threads 6 

kchauhan@kpc:~/Desktop/repos/lllms$ ./bench-llama-cpp.sh
ggml_cuda_init: GGML_CUDA_FORCE_MMQ:    no
ggml_cuda_init: GGML_CUDA_FORCE_CUBLAS: no
ggml_cuda_init: found 1 CUDA devices:
  Device 0: NVIDIA GeForce RTX 4070, compute capability 8.9, VMM: yes
| model                          |       size |     params | backend    | ngl |            test |                  t/s |
| ------------------------------ | ---------: | ---------: | ---------- | --: | --------------: | -------------------: |
| gpt-oss 120B MXFP4 MoE         |  59.02 GiB |   116.83 B | CUDA       |  99 |           pp512 |         86.45 ± 2.03 |
| gpt-oss 120B MXFP4 MoE         |  59.02 GiB |   116.83 B | CUDA       |  99 |           tg128 |          9.77 ± 0.23 |
```

