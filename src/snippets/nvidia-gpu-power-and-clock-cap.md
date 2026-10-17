---
title: Persistent NVIDIA Power and Clock Cap on Linux and Windows
description: Lock GPU power limits and boost clocks across reboots using nvidia-smi on systemd and Windows Task Scheduler.
date: 2026-10-16T00:00:00.000Z
authored_by: ai-assisted
slug: nvidia-gpu-power-and-clock-cap
tags:
  - Hardware
  - Linux
---

Capping the power limit (`-pl`) alone does not prevent an NVIDIA GPU from boosting core voltage and frequency during memory-bound workloads like LLM token decode, where average board power stays below the power ceiling. Pairing `-pl` with a maximum graphics clock lock (`-lgc`) clamps the upper boost state while keeping the low-power idle clock (`210 MHz`) intact.

## 1. Persistent systemd service on Linux

Enable `nvidia-persistenced` and create a oneshot unit so the driver retains your limits after boot and between jobs.

**`/etc/systemd/system/nvidia-tuning.service`**

```ini
[Unit]
Description=NVIDIA GPU Power & Clock Cap
After=nvidia-persistenced.service
Wants=nvidia-persistenced.service

[Service]
Type=oneshot
ExecStart=/usr/bin/nvidia-smi -pm 1
ExecStart=/usr/bin/nvidia-smi -pl 165
ExecStart=/usr/bin/nvidia-smi -lgc 210,2610
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

Enable both services:

```bash
sudo systemctl enable --now nvidia-persistenced.service nvidia-tuning.service
```

## 2. Live profile switching without password prompts

Allow passwordless `nvidia-smi` for your user:

```bash
echo "$USER ALL=(root) NOPASSWD: /usr/bin/nvidia-smi" | sudo tee /etc/sudoers.d/nvidia-smi
```

Switch profiles on the fly:

```bash
# Balanced daily cap (165 W, 2610 MHz max boost)
sudo nvidia-smi -pl 165 && sudo nvidia-smi -lgc 210,2610

# Ultra-cool inference cap (150 W, 2400 MHz max boost)
sudo nvidia-smi -pl 150 && sudo nvidia-smi -lgc 210,2400

# Reset to stock VBIOS defaults (200 W on RTX 4070)
sudo nvidia-smi -pl 200 && sudo nvidia-smi -rgc
```

## 3. Matching startup task on Windows

`nvidia-smi.exe` ships with the standard Windows display driver (`C:\Windows\System32\nvidia-smi.exe`) and accepts the same flags, so you can apply the exact same cap at boot without running MSI Afterburner or RivaTuner in the background.

Run in **PowerShell (Administrator)**:

```powershell
$action1 = New-ScheduledTaskAction -Execute "C:\Windows\System32\nvidia-smi.exe" -Argument "-pl 165"
$action2 = New-ScheduledTaskAction -Execute "C:\Windows\System32\nvidia-smi.exe" -Argument "-lgc 210,2610"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "NvidiaLongevityCap" -Action @($action1, $action2) -Trigger $trigger -Principal $principal
```
