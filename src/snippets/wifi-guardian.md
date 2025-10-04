---
title: Wifi-Guardian - Linux Wi-Fi Watchdog
description: A script to monitor and restore Wi-Fi connectivity on Linux
date: 2025-08-05T21:19:59.349Z
updated: 2025-08-05T21:19:59.355Z
slug: wifi-guardian
---

## Why These Scripts Exist

Sometimes, on Linux (especially Ubuntu/Pop!_OS), your Wi-Fi remains “connected” but the internet drops. This can happen due to DHCP lease issues, IPv6 glitches, or conflicts between internal and external Wi-Fi adapters.  
These scripts help:
- `wifi-guardian.sh` → Runs quick network resets to restore internet.
- `wifi-fix-settings.sh` → Applies permanent tweaks to reduce disconnections, and auto-disables the internal adapter when an external one is working well.

1. wifi-guardian.sh — Quick Fix Script

```bash
#!/usr/bin/env bash
# Single-adapter connectivity watchdog
# Last resort: restart NetworkManager; after 3 consecutive failures, reboot.
set -euo pipefail

# ==== CONFIG ====
IFACE="wlxb0a7b9b91244"          # External USB Wi‑Fi interface
CONN="BELL Basement 1"           # NetworkManager connection name
LOGFILE="/var/log/wifi-guardian.log"

PING_IPS=("8.8.8.8" "1.1.1.1")
PING_DOMAINS=("google.com" "cloudflare.com")
PING_COUNT=2
PING_TIMEOUT=3

FORCE_DNS="yes"
DNS_SERVERS=("8.8.8.8" "1.1.1.1")

# Failure tracking (so a timer/cron run doesn't reboot immediately)
STATE_DIR="/var/run"
[[ -w "$STATE_DIR" ]] || STATE_DIR="/tmp"
FAILCOUNT_FILE="$STATE_DIR/wifi-guardian.failcount"
MAX_FAILS_BEFORE_REBOOT=3
# =================

log() {
  local msg="$1"
  printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$msg" | tee -a "$LOGFILE"
  logger -t wifi-guardian -- "$msg" || true
}

read_failcount() {
  if [[ -f "$FAILCOUNT_FILE" ]]; then
    cat "$FAILCOUNT_FILE"
  else
    echo 0
  fi
}

write_failcount() {
  echo "$1" > "$FAILCOUNT_FILE" 2>/dev/null || true
}

reset_failcount() {
  write_failcount 0
}

bump_failcount_or_reboot() {
  local n
  n=$(read_failcount)
  n=$((n+1))
  write_failcount "$n"
  if (( n >= MAX_FAILS_BEFORE_REBOOT )); then
    log "❌ Connectivity still failing after NetworkManager restart (consecutive failures: $n) → Rebooting now."
    write_failcount 0
    sleep 5
    /usr/bin/systemctl reboot
  else
    log "⚠️  Connectivity still failing after NetworkManager restart. Will not reboot yet (failure $n/$MAX_FAILS_BEFORE_REBOOT)."
    exit 3
  fi
}

check_iface_present() { ip link show "$IFACE" >/dev/null 2>&1; }
have_ip_addr() { ip -4 addr show dev "$IFACE" | grep -q 'inet '; }
default_via_iface() { ip route show default 0.0.0.0/0 | grep -q "dev $IFACE"; }

ping_any_ip() {
  for ip in "${PING_IPS[@]}"; do
    ping -c "$PING_COUNT" -W "$PING_TIMEOUT" "$ip" >/dev/null 2>&1 && return 0
  done
  return 1
}

ping_any_domain() {
  for d in "${PING_DOMAINS[@]}"; do
    ping -c "$PING_COUNT" -W "$PING_TIMEOUT" "$d" >/dev/null 2>&1 && return 0
  done
  return 1
}

ensure_powersave_off() {
  if iw dev "$IFACE" get power_save 2>/dev/null | grep -qi ': on'; then
    log "Power save is ON for $IFACE → turning OFF"
    iw dev "$IFACE" set power_save off || true
  fi
}

ensure_only_iface_active() {
  while read -r dev type state _; do
    [[ "$dev" == "$IFACE" ]] && continue
    if [[ "$type" == "wifi" && "$state" == "connected" ]]; then
      log "Disconnecting competing interface $dev"
      nmcli device disconnect "$dev" || true
    fi
  done < <(nmcli -t -f DEVICE,TYPE,STATE device status | tr ':' ' ')
}

ensure_dns_config() {
  [[ "$FORCE_DNS" != "yes" ]] && return 0
  local dns_join
  dns_join="$(IFS=' '; echo "${DNS_SERVERS[*]}")"
  nmcli connection modify "$CONN" ipv4.ignore-auto-dns yes || true
  nmcli connection modify "$CONN" ipv4.dns "$dns_join" || true
  nmcli connection modify "$CONN" ipv6.method ignore || true
}

reconnect_connection() {
  log "Reconnecting NetworkManager connection: $CONN on $IFACE"
  nmcli device disconnect "$IFACE" || true
  sleep 2
  ensure_dns_config
  nmcli connection up "$CONN" || nmcli device connect "$IFACE" || true
  sleep 5
}

fix_routing() {
  log "Refreshing default route via $IFACE"
  while ip route show default | grep -q 'default'; do
    ip route del default || break
  done
  nmcli device reapply "$IFACE" || true
  sleep 2
  default_via_iface || {
    local gw
    gw=$(ip -4 route show dev "$IFACE" | awk '/proto dhcp/ && /default/ {print $3; exit}')
    [[ -n "${gw:-}" ]] && ip route add default via "$gw" dev "$IFACE" || true
  }
}

fix_dns() {
  log "Fixing DNS: flush caches & restart systemd-resolved"
  resolvectl flush-caches 2>/dev/null || true
  systemctl restart systemd-resolved || true
  sleep 2
}

renew_dhcp() {
  log "Renewing DHCP lease on $IFACE"
  nmcli device reapply "$IFACE" || true
  nmcli connection down "$CONN" || true
  sleep 2
  nmcli connection up "$CONN" || true
  sleep 5
}

restart_networkmanager_then_decide() {
  log "Last resort this run: restarting NetworkManager"
  systemctl restart NetworkManager
  sleep 8
  nmcli connection up "$CONN" || true
  sleep 5

  # Re-test after NM restart
  if ping_any_ip && ping_any_domain; then
    log "✅ Connectivity restored after NetworkManager restart"
    reset_failcount
    exit 0
  fi

  # If still failing, bump fail counter; reboot only after 3 consecutive failures
  bump_failcount_or_reboot
}

main() {
  mkdir -p "$(dirname "$LOGFILE")"
  touch "$LOGFILE" 2>/dev/null || true

  ensure_only_iface_active
  ensure_powersave_off

  if ! check_iface_present; then
    log "Interface $IFACE not present. Aborting."
    exit 1
  fi

  if ! have_ip_addr; then
    log "$IFACE has no IPv4 address → bringing up $CONN"
    reconnect_connection
  fi

  default_via_iface || fix_routing

  # --- Probes & remediation chain ---
  if ping_any_ip; then
    if ping_any_domain; then
      log "✅ Connectivity OK (IP + DNS)"
      reset_failcount
      exit 0
    else
      log "⚠️  DNS failure with working IP"
      fix_dns
      ping_any_domain && { log "✅ DNS restored"; reset_failcount; exit 0; }
      log "Still DNS issues → renewing DHCP"
      renew_dhcp
      fix_dns
      ping_any_domain && { log "✅ DNS restored after DHCP"; reset_failcount; exit 0; }
      # Last resort this run:
      restart_networkmanager_then_decide
    fi
  else
    log "❌ IP connectivity failure"
    renew_dhcp
    fix_routing
    if ping_any_ip; then
      ping_any_domain && log "✅ DNS OK"
      log "✅ IP restored after DHCP/route"
      reset_failcount
      exit 0
    fi

    reconnect_connection
    fix_routing
    if ping_any_ip; then
      ping_any_domain && log "✅ DNS OK"
      log "✅ IP restored after reconnect"
      reset_failcount
      exit 0
    fi

    # Last resort this run:
    restart_networkmanager_then_decide
  fi
}

main "$@"
```


2. wifi-fix-settings.sh — Permanent Tweaks Script

```bash
#!/bin/bash
# wifi-fix-settings.sh
# Applies persistent settings for a more stable connection.

EXTERNAL_WIFI="wlp3s0"   # External Wi-Fi adapter interface name
INTERNAL_WIFI="wlp2s0"   # Internal Wi-Fi adapter interface name
CONNECTION_NAME="MyWiFi" # Your saved Wi-Fi connection name

echo "[1/5] Disabling IPv6..."
sudo nmcli connection modify "$CONNECTION_NAME" ipv6.method ignore

echo "[2/5] Setting static DNS (Google + Cloudflare)..."
sudo nmcli connection modify "$CONNECTION_NAME" ipv4.ignore-auto-dns yes
sudo nmcli connection modify "$CONNECTION_NAME" ipv4.dns "8.8.8.8 1.1.1.1"

echo "[3/5] Setting MTU to 1400 for stability..."
sudo nmcli connection modify "$CONNECTION_NAME" 802-11-wireless.mtu 1400

echo "[4/5] Switching off internal adapter if external is working..."
if ping -I "$EXTERNAL_WIFI" -c 2 8.8.8.8 >/dev/null 2>&1; then
    echo "External Wi-Fi is fine, disabling internal..."
    sudo nmcli radio wifi off ifname "$INTERNAL_WIFI"
else
    echo "External Wi-Fi not responding, keeping internal enabled."
fi

echo "[5/5] Restarting NetworkManager..."
sudo systemctl restart NetworkManager

echo "✅ Settings applied."
```


You can run it manually or via a systemd timer (templates below).

Make it executable & run
```bash
sudo install -m 755 wifi-guardian.sh /usr/local/sbin/wifi-guardian
sudo /usr/local/sbin/wifi-guardian
```


(Optional) systemd service + timer

/etc/systemd/system/wifi-guardian.service
```bash
[Unit]
Description=Wi-Fi guardian (single-adapter watchdog)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/wifi-guardian
```

/etc/systemd/system/wifi-guardian.timer

```bash
[Unit]
Description=Run Wi-Fi guardian every 2 minutes

[Timer]
OnBootSec=30s
OnUnitActiveSec=2min
AccuracySec=15s
Persistent=true

[Install]
WantedBy=timers.target
```

Enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wifi-guardian.timer
```

