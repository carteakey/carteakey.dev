---
title: "I turned every telemetry setting off. Then I read the firmware."
description: "26 hours of kernel logs, a Fluentd collector, 447 DNS-over-HTTPS attempts, and the config file that explains all of it."
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

## The settings screen is a UI state

I turned off every privacy and telemetry toggle in my TV's own menus. Then I added one iptables rule that logs every new outbound connection to the kernel log, plus an hourly collector, and left it alone for 26 hours.

1,153 lines. Two of them matter.

The TV tried to reach `8.8.8.8:443` **447 times** in 26 hours. That's the address behind `dns.google`, and it wasn't asking my network to resolve anything. It was dialling DNS-over-HTTPS itself.

It also opened **14 connections** to `ter-jrnl-na.vidaahub.com`, which resolves to a service called `data-tenant-fluentd`. Fluentd is what servers use to ship logs somewhere. My TV, mostly idle, with collection switched off, was shipping logs.

I didn't have to guess at any of this, because the TV ships a config file that names its own telemetry infrastructure. That's the part I want to write down.

## How I could see any of this

Root, briefly. The chain is in the [first post](/blog/alvidaa/alvidaa/) and it isn't the interesting part here. What matters is that root gave me two things nothing else could: the ability to read the firmware's own files, and the ability to watch connections at the kernel layer instead of trusting a settings screen.

No payload capture. No TLS interception. Destinations and frequency only, deliberately.

## The firmware documents its own telemetry

`/APPS/domain/domain_list.json` is the TV's runtime endpoint map, fetched from `domain.vidaahub.com`. It ships this:

```
dohServers: ["dns.google/dns-query"]
dohDomains: ["vidaahub.com"]
```

Read that twice. The TV carries its own DNS-over-HTTPS client config, and it marks its own telemetry domain as a DoH domain. Those lookups are *designed* to skip whatever resolver your network provides. Every guide that says "block the ads with Pi-hole" is answering a question the TV never asked.

The same file names the rest of the stack: `rsc-ads` for monetization, `evt` for the event sink, `dvcstatus-dataretrv` for device status, `file-ul` for uploads, with per-region variants (`-na`, `-eu`) and an md5 stamp.

That's not inference from traffic patterns. That's the vendor's own map, sitting on a writable partition.

## What the kernel log proved

The 26-hour baseline, with every switch off:

| Destination | Hits | What it is |
| --- | --- | --- |
| `8.8.8.8:443` | 447 | DoH bootstrap, the escape hatch |
| `ter-jrnl-na.vidaahub.com` | 14 | `data-tenant-fluentd`, a log collector |
| `file-ul` / account hosts | 12 | uploads |
| `dvcstatus-dataretrv.vidaahub.com` | 2 | device status |
| `rsc-ads.vidaahub.com` | n/a | monetization |
| CloudFront, Google, cdn77 | n/a | content delivery, left alone |

The Fluentd line is the one I keep coming back to. A log collector is not a heartbeat. It's a destination for structured events, and the TV was reaching it while sitting on a home screen with everything disabled.

The CDNs are in the table for honesty. They're UI and content delivery, they're not the ads feed, and I left them unblocked.

## The switches are a file

`/APPS/euladpp/` is the consent plane: a tarball plus a `current/` directory holding `eula_dpp_status.ini` and seven consent sections, `pn1_hbbtv` through `pn7_registration`. Root-run boot scripts repair and upgrade it from the tarball on every boot.

So "off" is a value in a file that a boot script can rewrite. It isn't a contract, and it isn't enforced anywhere I could find. That's not a conspiracy, it's just what a settings toggle is when the settings UI and the data pipeline are owned by the same vendor.

I don't have the other half of this yet. The next experiment flips those seven sections on for 48 hours, captures the delta, and flips them back. That's the measurement that says what the switches actually control. Until it runs, I can tell you what the TV does with them off. I can't tell you what turning them on adds.

## The firmware is more legible than it should be

The telemetry is one layer. The layers under it are the reason any of this was possible, and they're worth writing down because they're the same in every model we've tested.

**The file bridge has no path logic.** `fileRead` and `fileWrite` resolve against a mode-indexed list of eight mounts, and the implementation is `full_path = path_list[mode] + params.path`. Plain concatenation. The `../` escape people write about wasn't a bug in a sanitiser, because there was no sanitiser. One of those modes is `/OAD`, the OTA staging partition, which is why the project's ground rules say hands off.

**The bridge's auth token is decorative.** The `Hisense_*` functions on `window` are shims that POST to `localhost:9009/service/hiutils` with an `identifier` header that rotates per request. Call the endpoint directly and the `phoenix` Node backend doesn't check it, and answers with `Access-Control-Allow-Origin: *`. The backend runs as uid 314 and its source lives on the writable `/APPS` partition.

**SELinux is permissive on purpose.** `/sys/fs/selinux/enforce` is 0, and `rcS.utopia.linux` calls `setenforce 0` when the policy binary is present. Read-only partitions are protected by dm-verity, which is why verified boot stays green through all of this. Everything that matters lives on a partition the OS treats as expendable.

**The package manager is the newest door.** On newer SoCs, `superwatch_server` is a root Unix socket at `/var/run/superwatch_socket`. One of its commands runs `opkg --force-reinstall install <path>`, and opkg runs post-install scripts as uid 0. The result file gets chowned `314:314`, the same uid the browser bridge runs as, which is the clearest possible statement of who the socket was built for. The package feed is plain HTTP and `opkg.conf` carries no signature-check option.

**Persistence doesn't need a binary.** On the build with no Dropbear to hijack, the boot hook is a two-file service dropped into an already-writable vendor package plus one line in that package's `serviceList.json`. The vendor's own service manager starts it on every boot as uid 314. Proven across a real power cycle with a marker file. Nothing shipped, nothing flashed, rollback is a full overwrite.

And the counter-example, because there is always one: on the 09.60 firmware generation, writing the app registry is refused with `client request permission check error, please check appconfig` while reads of the same path succeed. That's a per-app identity gate at the API layer, not file permissions. It closes the launcher's self-install on that generation, and no amount of path work gets around it. Four units now, one of them reported independently this week.

**The gate has a hole, and the shape of the hole is the lesson.** A Novatek unit added this week calls the same gated services from *inside* the phoenix process, and the identity check sees `origintype='service'` and returns true. The identifier gate is real, but it only guards the HTTP path. Anything executing in the bridge's own process is already past it. That is the difference between a lock and a lock on one door, and no amount of HTTP-layer hardening closes it.

**The vendor's debug framework is a root door.** The same unit ships a PFM debug framework: a `DebugPowerup` gate flag makes `start-kilby` run `pfm-manager.sh` as root, which `eval`s each line of `/var/local/pfmParse/PFMCheck` at every boot. A file on a writable partition, evaluated as root, by the vendor's own code. The way in is a forged `checkAccessCode` (md5 of the device code plus HMAC-SHA1) to security level 9, then `setDebugPort(1)`.

The family keeps growing in the same shape: MTK9602, MTK9603, MTK9618, MT9655, MT53xx, MTK9900, and now Novatek NT72690 on aarch64. Seven roots, seven different chips, thirteen catalogued methods. The five-lock Dropbear gauntlet transferred from the MediaTek write-up to the Novatek unit one-for-one, which is the strongest evidence yet that it is a platform property rather than a quirk of one chip.

## The fix, in layers

DNS blocking alone was never going to work, because the TV doesn't ask my resolver for the domains it cares about. So:

1. **Kernel REJECT of the DoH bootstrap.** `8.8.8.8` and `8.8.4.4` on 443, TCP and UDP. The TV fell back to my LAN resolver immediately, verified with a lookup from the TV itself.
2. **Per-client resolver rules** for the telemetry and ad hosts. Now they actually bind, because the TV can't route around them anymore.
3. **Boot-time IP rejects** that re-resolve the telemetry hosts every boot, so a DNS answer that changes doesn't reopen the hole.

Each layer alone leaks. The combination holds.

Layer three had been dead the whole time, and I only found out by listing the chain instead of trusting the script. The boot hook sources the policy before the `iptables` binary exists on its path, so every rule in it failed silently and the output chain came back empty. The same script resolves its host list at boot, which is the one moment DNS is least reliable, so the second half would have no-opped even if the first had worked.

That is the part worth taking away. A shell script that cannot find a command does not complain loudly enough to notice. Every layer I trusted without checking was a layer that could have been off, and the ones I verified with a packet or a chain listing are the only ones I can tell you were doing work.

## What this doesn't prove

One TV, one region (a North American build), mostly idle for 26 hours. Destinations and frequency, not payload contents. The baseline is a floor, not a total: with collection switched off, this is what remained.

And the switches themselves are still unmeasured. The ON window is the missing half, and it's running next.

## Close

The thing I keep coming back to isn't the telemetry. It's that the TV told me about it. The endpoint map, the DoH config, the consent sections, the root socket that chowns its result file to the web bridge's uid: none of that was hidden, and none of it was hard to read once I owned the hardware.

The settings screen is a UI state. The kernel log is a contract. The only reason I can tell the difference is that I got root on a TV I bought.

- Repo and per-model guides: [github.com/carteakey/alvidaa](https://github.com/carteakey/alvidaa)
- Generated docs site: [carteakey.github.io/alvidaa](https://carteakey.github.io/alvidaa/)
