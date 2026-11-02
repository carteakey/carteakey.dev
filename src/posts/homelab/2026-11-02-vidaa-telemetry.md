---
title: "I turned every telemetry setting off on my smart TV. The kernel log tells me what happened next."
description: "26 hours of kernel-level connection logging with every telemetry setting off — what a rooted VIDAA TV still phones home."
seoDescription: "Kernel-level iptables logging on a rooted 2024 Hisense VIDAA TV: with all telemetry settings off, the TV still connected to a Fluentd log collector 14 times and tried DNS-over-HTTPS 447 times. Evidence, method, and the layered fix."
date: 2026-11-02T00:00:00.000Z
updated: 2026-11-02T00:00:00.000Z
image: /img/blog-sketches/unique/alvidaa-stamp-trim.png
imageAlt: "Monochrome sketch of a TV emitting log lines toward a small server"
authored_by: ai-assisted
hidden: true
giscusTerm: "/blog/homelab/vidaa-telemetry/"
tags:
  - Self-Host
  - Privacy
---

{% callout "note", "Companion post" %}
This is the privacy half of the [alvidaa story](/blog/homelab/alvidaa/) — that post covers *how* root was gained; this one covers *what the TV does with it watching*. Method summary here, full mechanics in the repo's findings.
{% endcallout %}

## The setup, in one paragraph

[TODO — 3 sentences: the TV is rooted (link to part 1), so before touching any settings we added one iptables rule that logs every new outbound connection to the kernel log, plus an hourly collector. Destinations only — no payload capture, deliberately. The TV's own config was also read: it publishes its own endpoint map.]

## The baseline: everything off, 26 hours

[TODO — the settings state: every telemetry/consent toggle switched off through the TV's own EULA/privacy screens first.]

The numbers, straight from the kernel log — **1,153 lines over ~26 hours**:

| Destination | Hits | Who they are | Self-declared role |
| --- | --- | --- | --- |
| `dns.google:443` | **447** | Google | DNS-over-HTTPS bootstrap — the TV's escape hatch |
| 20.170.76.123:443 | 14 | Azure EU | `ter-jrnl-na.vidaahub.com` — "data-tenant-**fluentd**" — a log collector |
| 131.189.69.51 / .128.123:443 | 12 | VIDAA prod-eu-c | `file-ul` / account uploads |
| 20.52.196.175:443 | 2 | Azure EU | `dvcstatus-dataretrv.vidaahub.com` — device status |
| 20.113.x:443 | — | Azure EU | `rsc-ads.vidaahub.com` — **monetization-tenant-ads** |
| 89.187.x / 98.67.x / 48.201.x / 13.227.x | — | CDNs | UI/content delivery |

Two things to sit with:

1. **The Fluentd collector.** A Fluentd endpoint is where servers *ship logs*. My TV, with every telemetry setting disabled, opened 14 connections to a log-collection service across 26 hours of mostly-idle time.
2. **The 447 DoH attempts.** The TV wasn't just resolving — it was *persistently* trying to resolve via DNS-over-HTTPS, bypassing the network's DNS filter entirely.

[📷 PHOTO: the wiretap.log sample / the aggregated endpoint table on screen]

## The escape hatch is declared in the firmware's own config

[TODO — the reveal: `/APPS/domain/domain_list.json` — the TV maintains its own runtime endpoint map, fetched from `domain.vidaahub.com`. It ships `dohServers: ["dns.google/dns-query"]` and `dohDomains: ["vidaahub.com"]` — meaning vidaahub lookups are *designed* to bypass the network resolver via DoH. DNS-layer blocking (AdGuard, pi-hole) was never going to bind for these domains. The same file names the ad host `rsc-ads` and the event sink `evt` — the TV documents its own telemetry infrastructure, with per-region variants (`-na`, `-eu`) and an md5 stamp.]

[TODO — the consent plane: `/APPS/euladpp/current/` holds seven consent sections (hbbtv, account, voice, enhance, improvement, management, registration), managed by root-run boot scripts — the Settings UI writes here, and "off" is a file value the platform may reinterpret.]

## The layered fix (verified, not hypothetical)

[TODO — three layers, each verified live: 1) kernel REJECT of the DoH bootstrap (dns.google:443) — verified the TV fell back to the LAN resolver immediately; 2) AdGuard per-client domain rules for the telemetry/ad hosts — now they actually bind; 3) boot-time IP REJECTs of the telemetry hosts, re-resolved every boot. The full lists are in the repo.]

## What this does and doesn't prove

[TODO — honesty section: one TV, one region (NA build), ~26 h with the set mostly idle; destinations and frequency — not payload contents (that would need TLS interception; deliberately not done). The baseline is the *floor*: with collection switched off, this is what remains. The follow-up experiment — flip the consent switches on for 48 h and log the delta — is scheduled, and would show what the switches actually control.]

## Closing

[TODO — the thesis: the settings screen is a UI state, not a contract. The kernel log is. And the only way to read the difference was to own the hardware first.]

{% callout "todo", "Needs before publish" %}
1. The ON-window delta experiment (flip consent on 48h, capture, revert) — sharpest paragraph of the post
2. A unique sketch for this post (currently borrowing the alvidaa stamp)
3. Screenshots: wiretap.log excerpt, domain_list.json on screen, AdGuard rules
4. Decide: publish with the adguard-blocklist.txt + tvfw linked from the repo
{% endcallout %}
