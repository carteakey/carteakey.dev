# Native apps for a rooted VIDAA TV

Status: parked, not started. Written 2026-11-05 from the constraints measured on
the 50A51HUV (MTK9602) and the 09.60-generation units.

The TV is now a machine: root, a writable `/var/local`, a persistent boot hook, a
key-only Dropbear on 2222, and a Go daemon on loopback. This file is the list of
things that could run on it natively, with the build path and the reason each one
is worth the eMMC.

## The constraints that decide everything

- **armv7**, 32-bit userland. No package manager, no dynamic loader surprises.
  Every binary has to be static.
- **Three build paths already proven**: `zig cc` (Dropbear), static Go (the
  bridge, `tailscaled`), and plain Node. The FaaS worker runs **Node 20.19.4**,
  so Node tools need no cross-compile at all.
- **eMMC storage** and RAM shared with the home engine (227 MB RSS for Cobalt
  alone). Do not stack daemons.
- **Verified boot stays green.** Everything lives in `/var/local`, which a
  factory reset wipes. Nothing touches a read-only partition.
- **Supervision** is the hook or the watchdog. A daemon that dies silently is
  worse than no daemon, so anything long-running needs the same keepalive the
  bridge has.
- **No `/dev/net/tun`** on this hardware, so VPNs must be userspace
  (Tailscale's `--tun=userspace-networking` is the proven example).

## Already running

| App | What | Build |
| --- | --- | --- |
| **Tailscale** | `tailscaled` 1.104.4, userspace networking, MagicDNS name, reachable from anywhere | static Go |
| **Doom** | `doomgeneric`, 365 KB static, 1080p on `/dev/fb0`, remote mapped on `/dev/input/event3` | zig cc |
| **Dropbear** | key-only SSH on 2222, survives the iptables drop chain | zig cc |
| **alvidaa-bridge** | Go daemon, loopback HTTP + WS, MQTT session | static Go |

## The biggest three

These are the ones worth building first, in order.

### 1. Home Assistant integration (MQTT)

The bridge already speaks MQTT to the TV, so this is a bridge feature, not a new
binary. Expose the TV as a `media_player` plus a `remote` entity: source select,
app launch, key injection, power state, and the telemetry counters as sensors.

Why it is first: zero cross-compilation, it reuses everything that exists, and it
is the single most requested thing from the self-hosted audience. A TV that shows
up in Home Assistant as a first-class device is a different product from a TV you
can SSH into.

### 2. Syncthing

Static Go, armv7, runs as uid 314 with state in `/var/local`.

Why: it deletes a manual step that happens constantly. Screenshots, logs, the
bridge log, the wiretap output, and the findings dumps all currently get pulled by
hand over scp. Syncthing makes the TV a peer, so the evidence is already on the
NAS when you go looking for it.

### 3. librespot

Rust, static armv7, Spotify Connect receiver. The TV has speakers, network, and
now a shell.

Why: it is the one that makes the TV better than it was, rather than just
different. A cast target that is not trying to sell you anything is the whole
thesis of the project in one binary. It also pairs naturally with `cava` on fb0.

## Infrastructure

| App | Why | Build | Notes |
| --- | --- | --- | --- |
| **node_exporter** | CPU, thermal, network, disk into Grafana | static Go | cheap, and the TV has thermal zones worth watching |
| **mosh** | survives the Wi-Fi drops that kill SSH mid-command | zig cc | the TV's Wi-Fi is the flakiest part of the setup |
| **tmux + vim** | busybox `vi` is painful for on-device edits | zig cc | a real terminal on the TV |
| **tcpdump** | packet capture for the telemetry work | zig cc | busybox ships no `nc`, `tcpdump`, or `telnetd` on the MTK9603 build |
| **croc** | one-command file transfer, no scp flags | static Go | overlaps with `alvidaa push/pull`, lower priority |
| **restic / rclone** | back the mutable state to the NAS | static Go | overlaps with `alvidaa backup` |

## Media

| App | Why | Build |
| --- | --- | --- |
| **ffmpeg** | proper screen recording, supersedes the GIF loop | zig cc (large) |
| **cava** | audio visualizer on fb0, pairs with librespot | zig cc |
| **mpv** | play video straight to fb0 | zig cc |

## Fun, honestly

| App | Why |
| --- | --- |
| **cmatrix / pipes.sh / asciiquarium** | screensaver on fb0. Trivial, and they make the "I own this" point better than a benchmark |
| **frotz** | Z-machine. Interactive fiction on a 65-inch screen |
| **snes9x / genesis-plus-gx** | Doom proved fb0 plus `/dev/input` works, so the emulator path is open |

## Anti-recommendations

- **Any dynamic-linked binary.** The loader will not find what it wants and the
  failure mode is a silent no-start.
- **Anything that needs `/dev/net/tun`.** Not present. Userspace networking or
  nothing.
- **A second MQTT client identity.** One paired identity per TV; a second client
  kicks the first off the broker.
- **Anything writing outside `/var/local`.** Verified boot is the one guarantee
  worth keeping.
- **A package manager.** Tempting, and it turns a reversible project into a
  distribution you now have to maintain.

## How to decide what ships

Score each candidate on four things: does it remove a manual step, does it need a
cross-compile, does it need supervision, and does it survive a factory reset. The
first and last matter most. Syncthing and Home Assistant both remove manual steps
and both survive a reset, which is why they are at the top and `cmatrix` is not.
