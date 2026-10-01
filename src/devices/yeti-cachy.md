---
title: yeti-cachy
aka: Yeti
emoji: 🧠
kind: machine
state: active
role: GPU workstation · primary local-inference node
description: The homelab box every local-model benchmark on this site runs on. Linux for work, Windows kept around for gaming.
station: Arch-Nemesis
specs:
  - label: CPU
    value: Intel Core i5-12600K (6P + 4E, 16 threads), Performance governor
  - label: GPU
    value: NVIDIA GeForce RTX 4070 12 GB (Ada, SM89). About $500 when I bought it, not today's price
  - label: Memory
    value: 64 GB DDR5-5600, dual-channel
  - label: Storage
    value: WD Black SN770 2 TB, Gen4 NVMe
  - label: OS
    value: CachyOS Linux (Windows for gaming)
log:
  - date: "2026-08-27"
    text: Baseline for the Flash-Next runs. 6.5 t/s on stock llama.cpp with the powersave governor.
  - date: "2026-09"
    text: Named and mapped as part of the Arch-Nemesis desk on the CasaKey homelab map.
  - date: "2026-09-30"
    text: Strata brings Qwen3.8-Flash-Next to 53–63 t/s steady decode, up to 90.2 t/s burst.
---

The 12 GB card is the constraint that shapes everything here. Models either fit in VRAM (the dense 27B, about 10 GiB) or lean on the 64 GB of host RAM and the NVMe drive (the 176B Flash-Next, streamed through an expert cache).

`llama-swap` fronts the models on port 8080 and loads one at a time, since two will not fit at once. Windows is mostly for gaming now while the rest of my work moves to CachyOS.
