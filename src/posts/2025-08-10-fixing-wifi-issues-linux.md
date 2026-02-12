---
title: Fixing Wi-Fi Issues on Linux (draft)
description: A practical, battle‑tested guide 
date: 2025-08-10T09:00:00.000Z
updated: 2025-08-10T09:00:00.000Z
tags:
  - Linux
  - Networking
hidden: true
---

# Step 1
Buy a good USB Wi-Fi adapter. Done. Bye. 

# Step 2 (optional)
If you're still here, you probably have a laptop with an internal Wi-Fi card that you want to keep using. 

## TL;DR
- Prefer **MediaTek/ath9k_htc** chipsets for USB; **avoid Realtek** if you value stability and in‑kernel drivers.
- Keep **only one Wi‑Fi interface active**. If you must keep both, prefer the external by metrics/dispatcher rules.
- Apply permanent fixes: disable Wi‑Fi power‑save, tame IPv6, pin reliable DNS, and **disable USB autosuspend** for the adapter.
- Add a lightweight watchdog (**Wi‑Fi Guardian**) to auto‑repair DNS/route/DHCP and, if needed, restart NetworkManager. After repeated failures, reboot.

---

## 1) Identify what you actually own
First figure out the chipsets and interface names.

```bash
# Interfaces
ip -br a | grep -E 'wl|en'

# PCIe (internal) Wi‑Fi
lspci -k | grep -A3 -i network

# USB (external) Wi‑Fi
lsusbxq
# Example output for a TP‑Link nano:
# Bus 001 Device 009: ID 2357:011e TP-Link AC600 ... RTL8811AU

# Active drivers / modules
sudo dmesg | grep -Ei 'rtw|mt7|ath9k|wifi'
```
Why this matters: Linux Wi‑Fi reliability is primarily a driver story. In‑kernel drivers maintained upstream (e.g., mt76 for MediaTek, ath9k_htc for older Atheros USB) are usually steadier than out‑of‑tree Realtek DKMS modules.

⸻

2) Buying advice (so you don’t end up fighting drivers)
	•	Best bet (USB): Adapters using MediaTek chipsets supported by the mt76 driver family (e.g., mt76x2u, newer mt79xx).
	•	Still OK (older): Atheros AR9271 class using ath9k_htc (2.4 GHz 802.11n only, but rock‑solid).
	•	Avoid when you can: Realtek (8811/8812/8814/8821/8822/…) — many require out‑of‑tree DKMS, regress after kernel updates, and have power‑management quirks.

Before buying, search the product’s USB VID:PID and confirm it maps to mt76/ath9k_htc. If you already own a Realtek: it can be made to work, but expect extra steps.

⸻

3) Getting a USB adapter working on Ubuntu/Pop!_OS
	1.	Plug it in and confirm it enumerates:

lsusb | grep -i -E 'mediatek|ralink|realtek|tp-link|netgear|alfa'
dmesg | tail -n 80


	2.	If it’s MediaTek: you should see the mt76xx driver binding automatically — connect with NetworkManager.
	3.	If it’s Atheros AR9271: install the firmware once (most distros ship it), then connect.
	4.	If it’s Realtek: you may need a DKMS driver specific to your chipset (8812au/8814au/8821au/etc.). Install from a trusted maintainer, then sudo dkms status and reconnect. (If your distro ships a rtl88xxau-dkms or rtl8821ce-dkms, prefer that package to random forks.)

Tip: after any driver install, reboot once to ensure the right module loads and blacklist files are honored.

⸻

4) Auto‑disable the internal Wi‑Fi when the USB adapter connects

You want the external up, the internal out of the way — but only when the external is present.

Option A — NetworkManager dispatcher (dynamic, recommended)

Create /etc/NetworkManager/dispatcher.d/80-wifi-external-prefer:

#!/usr/bin/env bash
# Disable internal Wi‑Fi when the external USB adapter is up
# Adjust these to your system
EXT_IF="wlxb0a7b9b91244"   # external USB
INT_IF="wlp3s0"            # internal PCIe

IFACE="$1"
STATE="$2"

log(){ logger -t nm-dispatcher "$*"; }

if [[ "$IFACE" == "$EXT_IF" && "$STATE" == "up" ]]; then
  log "External Wi‑Fi ($EXT_IF) is up → disconnecting internal ($INT_IF)"
  nmcli device disconnect "$INT_IF" || true
fi

# If external goes down, you could re-enable the internal automatically:
if [[ "$IFACE" == "$EXT_IF" && "$STATE" == "down" ]]; then
  log "External Wi‑Fi ($EXT_IF) went down → attempting to bring up internal ($INT_IF)"
  nmcli device connect "$INT_IF" || true
fi

sudo chmod +x /etc/NetworkManager/dispatcher.d/80-wifi-external-prefer

Option B — Blacklist internal driver (permanent, simple)

If you never want the internal card:

echo "blacklist rtw88_8821ce" | sudo tee /etc/modprobe.d/blacklist-rtl8821ce.conf
sudo update-initramfs -u
sudo reboot


⸻

5) Permanent fixes for improved stability

These are the small things that make a big difference on laptops.

5.1 Disable Wi‑Fi power save globally

echo -e "[connection]\nwifi.powersave = 2" | \
sudo tee /etc/NetworkManager/conf.d/wifi-powersave-off.conf
sudo systemctl restart NetworkManager

5.2 Harden each connection (external + internal)

Replace connection names as needed:

EXT_CONN="BELL Basement 1"
INT_CONN="BELL Basement"

# Disable per‑connection Wi‑Fi power save and MAC randomization
nmcli connection modify "$EXT_CONN" 802-11-wireless.powersave 2
nmcli connection modify "$EXT_CONN" 802-11-wireless.mac-address-randomization never

nmcli connection modify "$INT_CONN" 802-11-wireless.powersave 2
nmcli connection modify "$INT_CONN" 802-11-wireless.mac-address-randomization never

# Optional: IPv6 off (helps with flaky drivers or APs)
nmcli connection modify "$EXT_CONN" ipv6.method ignore
nmcli connection modify "$INT_CONN" ipv6.method ignore

# Pin reliable DNS and ignore DHCP‑supplied DNS
nmcli connection modify "$EXT_CONN" ipv4.ignore-auto-dns yes
nmcli connection modify "$EXT_CONN" ipv4.dns "8.8.8.8 1.1.1.1"

5.3 Disable USB autosuspend for the external adapter

Find its USB ID (example: 2357:011e), then:

sudo tee /etc/udev/rules.d/50-usb-wifi-nosuspend.rules >/dev/null <<'RULES'
ACTION=="add", SUBSYSTEM=="usb", ATTR{idVendor}=="2357", ATTR{idProduct}=="011e", TEST=="power/control", ATTR{power/control}="on"
RULES

sudo udevadm control --reload && sudo udevadm trigger

This prevents the kernel from putting the dongle to sleep mid‑transfer.

5.4 Prefer the external by route metric (if you keep both)

# Lower metric = preferred
nmcli connection modify "$EXT_CONN" ipv4.route-metric 50
nmcli connection modify "$INT_CONN" ipv4.route-metric 600


⸻

6) Add a self‑healing watchdog (Wi‑Fi Guardian)

A tiny script can auto‑repair the common failure modes (DNS cache stuck, bad default route, stale DHCP lease).
Placeholder link: Wi‑Fi Guardian script

Install

# Put the script somewhere tidy
sudo install -m 0755 wifi-guardian.sh /usr/local/sbin/wifi-guardian

Run it automatically with systemd (every 2 minutes)

/etc/systemd/system/wifi-guardian.service

[Unit]
Description=Wi‑Fi guardian (connectivity watchdog)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/wifi-guardian

/etc/systemd/system/wifi-guardian.timer

[Unit]
Description=Run Wi‑Fi guardian every 2 minutes

[Timer]
OnBootSec=30s
OnUnitActiveSec=2min
AccuracySec=15s
Persistent=true

[Install]
WantedBy=timers.target

Enable it:

sudo systemctl daemon-reload
sudo systemctl enable --now wifi-guardian.timer

Behavior (recommended logic):
	•	Probe IP reachability vs DNS separately.
	•	Auto‑fix in order: flush DNS → renew DHCP → rebuild default route → reconnect.
	•	Last resort per run: restart NetworkManager.
	•	Keep a small consecutive‑failure counter; after 3 failed runs → reboot.

⸻

7) Troubleshooting checklist (when things still go weird)

# Who owns the default route?
ip route show default

# Live logs when associating/roaming
sudo journalctl -fu NetworkManager

# Driver/firmware errors
sudo dmesg | grep -Ei 'rtw|rtl|mt7|ath9k|firmware|queue|timeout'

# Link health & power-save state
iw dev wlxb0a7b9b91244 link
iw dev wlxb0a7b9b91244 get power_save

# DNS state
resolvectl status

Red flags to search for: “disassociated”, “authentication timeout”, “TX queue stuck”, “firmware hang”, “USB suspend”.

⸻

8) Wrap‑up
	•	Picking the right chipset saves days of your life.
	•	Keep one Wi‑Fi path active to avoid routing chaos.
	•	Apply the handful of permanent fixes once, and forget about them.
	•	Let Wi‑Fi Guardian do the 2 am babysitting.

If you want a copy‑paste wifi-fix-settings.sh that applies most hardening in one go (IPv6 off, power‑save off, no MAC randomization, no USB autosuspend, NetworkManager restart), drop it in your dotfiles and run it whenever you set up a new machine.

