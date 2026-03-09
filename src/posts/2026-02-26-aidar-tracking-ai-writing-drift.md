---
title: "I built a tool to measure how AI-like a website writes. Then I scanned my own."
description: aidar tracks stylistic signals associated with AI-era writing across the web
date: 2026-02-26
authored_by: ai-generated
tags:
  - AI
  - Agents
featured: true
draft: true
---

A few weeks ago I came across [this post on Marginalia](https://www.marginalia.nu/weird-ai-crap/hn/) showing that new Hacker News accounts are ten times more likely to use em dashes than older ones. Not as proof of anything - just as a signal. A stylistic fingerprint that's shifted measurably since large language models became mainstream.

That felt like a project.

{% image_cc "./src/static/img/projects/aidar.png", "aidar - AI writing drift detector", "rounded-lg shadow-md" %}

## What aidar does

[aidar](https://github.com/carteakey/aidar) scans URLs and measures stylistic patterns that have become associated with AI-era writing. Not to declare something "AI-generated" - that framing is a trap - but to build a comparable, queryable dataset of how writing style is drifting across the web.

The patterns it looks for:

- **Em dash frequency** - 0–2 per 1000 words in human prose, 6–12+ in AI output
- **Hedging phrases** - "it's worth noting", "to be honest", "certainly", "genuinely"
- **AI vocabulary idioms** - "delve into", "deep dive", "key takeaway", "paradigm shift", "seamlessly"
- **Bullet point density** - AI defaults to lists regardless of whether content warrants it
- **Sentence burstiness** - humans mix short and long sentences; AI outputs uniform medium-length ones
- **Question avoidance** - AI almost never asks questions; it answers them
- **Type-token ratio** - a lightweight proxy for lexical diversity (low diversity = AI-like)
- **Transition overload** - "furthermore", "moreover", "consequently" appearing in clusters

Each pattern produces a normalized 0–1 score. These aggregate into a per-category breakdown and a final **Stylistic Index** from 0–100.

## Scanning my own site

I ran it against all 25 posts on this blog:

```
aidar track carteakey.dev --save
```

Results:
- **Average index: 7.6/100**
- Range: 0–22
- All 25 posts labeled LIKELY HUMAN

The highest-scoring post - the one I wrote partly with Claude Code's help on a Databricks analysis piece - scored 22. The main signal was em dash frequency: 17.2 per 1000 words. That's real. I did use em dashes a lot in that post. Whether that's me, the AI, or me editing AI output and keeping its punctuation choices is genuinely unclear.

That ambiguity is the point.

## The irony

This tool was written by Claude (an AI). The codebase has em dashes in it. If you scanned the commit messages, the hedging detector would fire.

I find this funny. 

## How the scoring works

Patterns are YAML files in a `patterns/` directory. Adding a new signal means writing a config file - no Python required. Each pattern has:

- **Calibrated thresholds** (`threshold_low`, `threshold_high`) - the range over which the score goes from 0 to 1
- **A version number** - bump it when you recalibrate, so old scans get flagged as stale
- **A detection type** - `regex`, `frequency`, `structural`, or `linguistic`

The aggregate score is a weighted sum of category scores. Weights are in `_weights.yaml` and are tuned as more scan data comes in.

Right now the thresholds are calibrated against a small corpus. The interesting question is what happens when you have thousands of domains tracked over time - does the distribution shift? Are sites that scored 7 in 2024 scoring 15 in 2026?

## What's coming

The leaderboard site (aidar.lol) will show this over time. Once there's enough historical data - using the article publish date that trafilatura extracts from each page - you can start plotting a domain's stylistic drift as a time series.

The TODO has things like:
- Real perplexity scoring 
- Wayback Machine integration for pre-AI baselines
- An embed badge you can put on your site

If you want to contribute patterns or calibration data, there's a [CONTRIBUTING.md](https://github.com/carteakey/aidar/blob/main/CONTRIBUTING.md).

## Running it yourself

```bash
pip install git+https://github.com/carteakey/aidar.git
aidar analyze https://yourblog.com/some-post
aidar track yourblog.com --save
```

The scan takes a few seconds per page. The results go into `aidar.db` (SQLite, queryable directly if you want to dig into the data).

---

*Yes, this post was written with AI assistance. The em dashes are real. I checked.*
