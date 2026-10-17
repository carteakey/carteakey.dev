---
title: glowdesk
aka: Glowdesk
emoji: 🕹️
kind: machine
state: active
role: Batocera retro arcade console · ex-homelab NAS
description: An HP ProDesk 600 G1 SFF under the TV. Retired from NAS duty, fitted with a low-profile Quadro P600, and turned into a dedicated Batocera box.
station: Living Room
specs:
  - label: Model
    value: HP ProDesk 600 G1 SFF (240W OEM 80 PLUS Platinum PSU)
  - label: CPU
    value: Intel Core i5-4570 @ 3.20 GHz (4C/4T, Haswell)
  - label: GPU
    value: NVIDIA Quadro P600 2 GB GDDR5 (Low Profile, Pascal GP107, Driver 580.126.09)
  - label: Memory
    value: 8 GB DDR3
  - label: Storage
    value: Samsung MZ7LN256 256 GB 2.5" SATA SSD (ext4 /userdata, 181 GB free)
  - label: OS
    value: Batocera Linux v43.1 x86_64 (Linux kernel 6.18)
  - label: Power
    value: ~2.8 W CPU package idle · ~18–22 W wall idle · ~25–35 W active emulation
log:
  - date: "2024–2026"
    text: Primary homelab NAS running MergerFS across three spinning drives, hosting Copyparty, Nextcloud, and Restic backups.
  - date: "2026-09"
    text: Evacuated external drive (hdd4) to serve as permanent USB 3.0 boot drive for Raspberry Pi 4 after an SD card failure.
  - date: "2026-10-07"
    text: Evacuated remaining NAS data to FX505 and pulled all three degraded mechanical drives. Decommissioned NAS services.
  - date: "2026-10-10"
    text: Installed low-profile NVIDIA Quadro P600 and a 256 GB Samsung SSD. Flashed Batocera Linux v43.1 x86_64.
  - date: "2026-10-14"
    text: Wrote gamelist_linker.py in crt-cabinet to automate EmulationStation box art matching and XML generation across 2,000+ curated titles.
  - date: "2026-10-16"
    text: Moved under the living-room TV as a permanent retro box with locked 60 FPS GameCube/Wii at 2x/3x Vulkan and full PS2 catalog support.
---

For years Glowdesk was the precarious center of my homelab storage: an HP ProDesk SFF running MergerFS over three aging laptop drives. One drive had accumulated 880 reallocated sectors and was mounted strictly read-only to avoid total loss; another was an NTFS drive salvaged from an old external enclosure. It ran Copyparty, Nextcloud, and Restic backups while humming quietly in a corner. In October 2026, after moving the primary storage pools to FX505 and external media, the spinning drives were finally pulled and the NAS role retired.

Instead of e-wasting the ProDesk, it found a second life under the TV. The Haswell i5-4570 is over a decade old, but the OEM 240W Platinum power supply idles at ~18–22 W from the wall. The real upgrade was dropping in a low-profile NVIDIA Quadro P600 (Pascal GP107, 2 GB GDDR5, 30W TDP) and a fresh 256 GB Samsung SSD. The Quadro's dedicated memory bandwidth (64 GB/s) and official proprietary NVIDIA Vulkan driver transformed emulation: Dolphin runs GameCube and Wii titles at 2x to 3x native resolution locked at 60 FPS, and PCSX2 handles the PlayStation 2 catalog at 720p without breaking a sweat.

It runs Batocera Linux v43.1 x86_64 with a curated library of about 2,000 retro games (filtered down from *tiny-best-set-go* to strip bloat and broken multi-disc files). Handheld ROM sets store box art in `Imgs/`, which EmulationStation ignores without explicit `<image>` and `<thumbnail>` tags in `gamelist.xml`. To fix the blank posters without hand-editing thousands of XML nodes, I wrote `gamelist_linker.py` (now tracked in `crt-cabinet`), which merges image directories, fuzzy-matches covers to ROM names, and reloads EmulationStation via SSH.

It boots straight to the controller interface, connects over Tailscale for remote maintenance, and gives a decommissioned office PC a quiet, permanent home under the TV.
