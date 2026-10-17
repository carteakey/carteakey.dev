---
title: "Taking Care of the Silicon You Already Own"
layout: layouts/note.njk
permalink: /notes/{{ page.fileSlug }}/
description: "Why a power limit alone doesn't stop GPU boost spikes during local LLM decode, and how locking the core clock fixes it."
date: 2026-10-16
authored_by: ai-assisted
tags:
  - Hardware
  - LLMs
---

I was reading an [`r/RTX5080` thread](https://reddit.com/r/RTX5080/comments/1x5l236/) where people were panicking about 5090 wafer cannibalization, $250 per-pin power monitors, and denied RMAs. Half the comments sounded like prepper checklists - undervolting, turning off overclocks, running Noctua fans higher ("fans are expendable, silicon is not"), and buying backup cards just in case.

My RTX 4070 on {% device "yeti-cachy" %} uses a standard 8-pin PCIe cable and pulls 200 W max, so I don't have to worry about 600 W 12VHPWR plugs melting. Still, if consumer GPUs keep getting squeezed by enterprise AI allocations, I'd like this $500 card to last as long as possible.

So I logged 1 Hz NVML telemetry while running `llama-bench` (`Gemma 4 12B Q6_K`) and [Qwen3.8-Flash-Next](/blog/local-inference/running-qwen3-8-flash-next-locally/) on `Strata (dynamic expert cache)` across five power and clock profiles.

The stock 200 W log showed something I hadn't noticed before. During compute-heavy prefill (`pp2048`), the core sits around 2595-2610 MHz. But during token generation (`tg256`), because decode is gated by GDDR6X memory bandwidth (`10251 MHz`), the shaders spend most of their time waiting on VRAM. The boost algorithm sees power headroom and cranks core voltage and clocks all the way up to **2760-2835 MHz** just to wait on memory fetches.

Because `Strata` averages ~125 W during decode, simply setting a 165 W power cap (`nvidia-smi -pl 165`) barely changes anything (`125.1 W` avg vs `126.0 W` stock, still boosting to 2820 MHz). The card never hits the 165 W ceiling during decode, so it still rides the steep end of the voltage curve.

Locking the upper graphics clock (`nvidia-smi -lgc 210,2610` or `210,2400`) alongside the power cap fixes it immediately:

| Profile | Decode | Prefill | Peak | Avg | Clock | Temp |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Stock (`200 W`)** | 62.5 t/s | 926.0 t/s | 187.2 W | 126.0 W | 2835 MHz | 57 °C |
| **`165 W` cap only** | 60.0 t/s | 921.2 t/s | 154.3 W | 125.1 W | 2820 MHz | 54 °C |
| **`165 W` + `2610 MHz`** | 60.9 t/s | 914.0 t/s | 150.2 W | 107.4 W | 2610 MHz | 51 °C |
| **`150 W` + `2610 MHz`** | 65.2 t/s | 918.3 t/s | 146.2 W | 109.5 W | 2610 MHz | 52 °C |
| **`150 W` + `2400 MHz`** | 61.9 t/s | 915.0 t/s | 129.2 W | 92.3 W | 2400 MHz | 49 °C |

At `150 W` with a `2400 MHz` ceiling, peak power drops by **58 W**, average load power drops **27%** (down to 92.3 W), and the GPU stays under **49 °C** while keeping ~99% of stock decode and prefill speed. Even the milder `165 W + 2610 MHz` cap shaves ~37 W off the peaks and 6 °C off the core.

I locked it in across reboots on both CachyOS (`systemd` oneshot) and Windows (`nvidia-smi.exe` startup task) without needing MSI Afterburner in the tray - full setup in [nvidia-gpu-power-and-clock-cap](/snippets/nvidia-gpu-power-and-clock-cap.html). Next up on the hardware preservation list is a pure sine wave UPS.
