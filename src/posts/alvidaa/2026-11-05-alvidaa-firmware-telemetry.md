---
title: "I turned every telemetry setting off. Then I read the firmware."
description: "26 hours of kernel logs, a Fluentd collector, 447 hardcoded DNS hits, and the config file that explains all of it."
seoDescription: "Kernel-level connection logging on a rooted 2024 Hisense VIDAA TV, plus the firmware internals that explain it: a mode-indexed file bridge with no path logic, a permissive SELinux policy, a root package-manager socket, and a consent plane the settings screen only pretends to control."
date: 2026-11-05T00:00:00.000Z
updated: 2026-11-05T00:00:00.000Z
image: /img/blog-sketches/unique/alvidaa-stamp-trim.png
imageAlt: "Monochrome sketch of a TV emitting log lines toward a small server"
authored_by: ai-assisted
hidden: true
giscusTerm: "/blog/alvidaa/firmware-and-telemetry/"
tags:
  - Privacy
  - Self-Host
---

{% callout "note", "Companion post" %}
The [first post](/blog/alvidaa/alvidaa/) covers how root was gained. This one covers what I did with it: read the firmware, then watch the TV run.
{% endcallout %}

## 26 hours of kernel logs with every toggle off

I turned off every privacy and telemetry toggle in my TV's menus. Then I added one iptables rule that logs every new outbound connection to the kernel log, plus an hourly collector, and left it alone for 26 hours.

1,153 lines came back. Two of them matter.

The TV tried to reach Google's DNS (`8.8.8.8`) **447 times** on port 53, bypassing my LAN resolver completely, and its runtime config also sets up DNS-over-HTTPS for its own domain.

It also opened **14 connections** to `ter-jrnl-na.vidaahub.com`, which resolves to a service called `data-tenant-fluentd`. Fluentd is what servers use to ship logs somewhere. My TV, mostly idle, with collection switched off, was shipping logs.

I didn't have to guess at any of this, because the TV ships a config file that names its own telemetry infrastructure. Root gave me two things nothing else could: the ability to read the firmware's own files, and the ability to watch connections at the kernel layer instead of trusting a settings screen (destinations and frequency only, no payload capture or TLS interception).

## The TV's own endpoint map

`/APPS/domain/domain_list.json` is the TV's runtime endpoint map, fetched from `domain.vidaahub.com`. It ships this:

```
dohServers: ["dns.google/dns-query"]
dohDomains: ["vidaahub.com"]
```

The TV carries its own DNS-over-HTTPS client config, and it marks its own telemetry domain as a DoH domain. Those lookups are *designed* to skip whatever resolver your network provides. Every guide that says "block the ads with Pi-hole" is answering a question the TV never asked.

The same file names the rest of the stack: `rsc-ads` for monetization, `evt` for the event sink, `dvcstatus-dataretrv` for device status, and `file-ul` for uploads, with per-region variants and an md5 stamp. That's not inference from traffic patterns; it's the vendor's own map, sitting on a writable partition.

## The 26-hour baseline table

| Destination | Hits | What it is |
| --- | --- | --- |
| `8.8.8.8:53` (+ DoH config on `:443`) | 447 | Hardcoded Google DNS + DoH escape hatch |
| `ter-jrnl-na.vidaahub.com` | 14 | `data-tenant-fluentd`, a log collector |
| `file-ul` / account hosts | 12 | Account and file uploads |
| `dvcstatus-dataretrv.vidaahub.com` | 2 | Device status |
| `rsc-ads.vidaahub.com` | n/a | Monetization / home-screen ads |
| CloudFront, Google, cdn77 | n/a | UI and content delivery, left unblocked |

The Fluentd line is the one I keep coming back to. A log collector isn't a heartbeat; it's a destination for structured events, and the TV was reaching it while sitting on a home screen with everything disabled. The CDNs are in the table for honesty - they're UI and content delivery, not the ads feed, and I left them unblocked.

## The consent toggles are just an INI file

`/APPS/euladpp/` holds a tarball plus a `current/` directory with `eula_dpp_status.ini` and seven consent sections (`pn1_hbbtv` through `pn7_registration`). Root-run boot scripts repair and upgrade it from the tarball on every boot.

So "off" is a value in a file that a boot script can rewrite. It isn't a contract, and it isn't enforced anywhere I could find. That's not a conspiracy, it's just what a settings toggle is when the settings UI and the data pipeline are owned by the same vendor.

I don't have the other half of this yet. The next experiment flips those seven sections on for two days, captures the delta, and flips them back. Until it runs, I can tell you what the TV does with them off; I can't tell you what turning them on adds.

## Seven firmware patterns across the tested TVs

The telemetry is one layer. The firmware patterns underneath it are the same across the models in our [compatibility matrix](https://github.com/carteakey/alvidaa/blob/main/docs/research/TESTED-MODELS.md):

- **The file bridge has no path logic.** File read and write resolve against a mode-indexed list of eight mounts via `full_path = path_list[mode] + params.path`. Plain concatenation. The `../` escape wasn't a bug in a sanitiser, because there was no sanitiser. One of those modes is `/OAD`, the OTA staging partition, which is why our ground rules say hands off.
- **The bridge's auth token is decorative.** The `Hisense_*` functions on `window` post to `localhost:9009/service/hiutils` with an identifier header that rotates per request. Call the endpoint directly and the phoenix Node backend doesn't check it, and answers with `Access-Control-Allow-Origin: *`.
- **SELinux is permissive on purpose.** `rcS.utopia.linux` calls `setenforce 0` at boot. Read-only partitions are protected by dm-verity, so verified boot stays green while everything that matters lives on writable partitions.
- **The package manager is a root socket for the web bridge.** On newer chips, `superwatch_server` listens on `/var/run/superwatch_socket` as root. One of its commands runs `opkg --force-reinstall install <path>` as root and chowns the result file to the same user the browser bridge runs as.
- **Persistence doesn't need a binary.** On builds without the `rc.local` hook, dropping a two-file service into a writable vendor package and adding one line to `serviceList.json` makes the vendor's own service manager start it on every boot.
- **The appconfig gate has an in-process hole.** On newer firmware, writing the app registry over HTTP fails with `client request permission check error, please check appconfig`. Yet on a Novatek unit added this week, calling the same gated service from *inside* the phoenix process sees `origintype='service'` and returns true. The gate only guards the HTTP door.
- **The vendor's debug framework evaluates a writable file as root.** That same Novatek unit ships `pfm-manager.sh`, which runs as root when `DebugPowerup` is set and evaluates each line of `/var/local/pfmParse/PFMCheck` at every boot.

The matrix now spans sixteen models across seven chip families (MediaTek and Novatek), with ten models rooted and thirteen catalogued methods in [EXPLOITS.md](https://github.com/carteakey/alvidaa/blob/main/docs/research/EXPLOITS.md). The five-lock Dropbear gauntlet transferred from MediaTek to Novatek one-for-one.

## Blocking it in layers (and three traps our own scripts hit)

DNS blocking alone wasn't going to work, because the TV doesn't ask my resolver for the domains it cares about. The fix combines three layers (`firmware/adguard-blocklist.txt` and `firmware/tvfw`), checked via `alvidaa privacy status`:

1. **Kernel reject of hardcoded DNS and DoH bootstrap:** Block outbound DNS to anything except my LAN AdGuard resolver, and block Google's resolvers on HTTPS so DoH falls back to standard DNS.
2. **Per-client AdGuard domain rules** for the telemetry and ad hosts, which now bind because the TV can't route around them.
3. **Boot-time IP rejects** for the telemetry hosts in the TV's output chain.

Building `alvidaa privacy status` to check those rules live on the TV caught three bugs I'd have missed if I'd trusted the script:

- **Silent path failure at boot:** The boot hook initially sourced `tvfw` before `/usr/local/bin/iptables` was on its path, so every rule in it failed silently and the output chain came back empty.
- **BusyBox nslookup returns a null address for blocked domains:** Once AdGuard blocked the telemetry hosts, nslookup on the TV answered `0.0.0.0` rather than failing, so our script inserted `iptables -I OUTPUT 1 -d 0.0.0.0 -j REJECT` - a rule that can never match a real destination while looking like protection.
- **Late vendor firewall flush:** Even after fixing `tvfw`, a status run hours into a boot showed the kernel output chain empty again while the AdGuard layer held all seven telemetry hosts blocked.

Every layer I trusted without checking was a layer that could have been off, and the ones I verified with a packet or a chain listing are the only ones I know were doing work.

## What this doesn't prove

One TV (a North American 50A51HUV build), mostly idle for 26 hours. Destinations and frequency, not payload contents. With collection switched off, those Fluentd connections and direct DNS queries are the floor.

The endpoint map, the DoH config, the consent sections, and the root socket that chowns its result file to the web bridge's user: none of that was hidden, and none of it was hard to read once I owned the hardware. The settings screen is a UI state. The kernel log is a contract. The only reason I can tell the difference is that I got root on a TV I bought.

- Repo and per-model guides: [github.com/carteakey/alvidaa](https://github.com/carteakey/alvidaa)
- Tested models matrix: [docs/research/TESTED-MODELS.md](https://github.com/carteakey/alvidaa/blob/main/docs/research/TESTED-MODELS.md)
- Publication and disclosure policy: [docs/DISCLOSURE.md](https://github.com/carteakey/alvidaa/blob/main/docs/DISCLOSURE.md)
