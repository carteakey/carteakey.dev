---
title: "I built a tool to measure how AI-like a website writes. Then I scanned my own."
description: aidar tracks stylistic signals associated with AI-era writing across the web
date: 2026-02-26
authored_by: ai-generated
tags:
  - AI
  - Agents
featured: false
draft: false
---

A few weeks ago I came across [this post on Marginalia](https://www.marginalia.nu/weird-ai-crap/hn/) showing that new Hacker News accounts are ten times more likely to use em dashes than older ones. Not as proof of anything - just as a signal. A stylistic fingerprint that's shifted measurably since large language models became mainstream.

That felt like a project.

{% image_cc "./src/static/img/projects/aidar.png", "aidar - AI writing drift detector", "rounded-lg shadow-md" %}

## What aidar does

[aidar](https://github.com/carteakey/aidar) scans URLs and measures stylistic patterns that have become associated with AI-era writing. Not to declare something "AI-generated" - that framing is a trap - but to build a comparable, queryable dataset of how writing style is drifting across the web.

The patterns it looks for fall into two tiers.

**Structural and tonal tropes** - the patterns that are uniquely, embarrassingly AI. Sourced largely from [tropes.fyi](https://tropes.fyi/directory):

- **Negative parallelism** - "It's not X - it's Y." The single most identified AI writing tell. One in a piece is fine; ten is an insult to the reader
- **Em dash addiction** - AI uses 10–20+ per 1000 words; human prose uses 2–3
- **Bold-first bullets** - every list item opens with a **bolded phrase**. Almost nobody writes this way by hand
- **Rhetorical Q&A** - "The result? Devastating." The model poses a question nobody asked, then answers it
- **Tricolon abuse** - "Products impress people; platforms empower them; participants thrive." Three-part parallel structures stacked back-to-back
- **"Here's the kicker"** - false suspense transitions before unremarkable observations
- **"Let's break this down"** - the pedagogical voice, even for expert audiences
- **Signposted conclusions** - "In conclusion..." Competent writing doesn't announce itself
- **Grandiose stakes inflation** - a blog post about API pricing becomes a meditation on the fate of civilization
- **Vague attributions** - "experts argue", "studies suggest", "many observers" - without naming anyone
- **Listicle in a trench coat** - "The first wall is... The second wall is..." - a numbered list disguised as prose
- **"Despite its challenges"** - the rigid formula: acknowledge → dismiss → optimism
- **AI section headers** - "The Takeaway", "Why This Matters", "Key Takeaways", "Moving Forward", "What's Next". Detected in raw HTML heading tags so it fires even when the page is rendered by a JavaScript-heavy CMS
- **Second-person direct address** - "We've all been there", "You might be wondering", "Picture this", "Let me walk you through", and the entire **"Here's how it actually went"** family - the reveal formula pasted into every AI-assisted dev.to and LinkedIn post
- **"And honestly?"** - the dramatic-pause reveal. "And honestly? I lost all motivation." Flagged in the HN discussion on tropes.fyi as a Claude-specific emerging tell

**Word and phrase signals** - vocabulary that has statistically shifted since LLMs:

- **Em dash frequency** - 0–2 per 1000 words in human prose; 6–12+ in AI output
- **Hedging phrases** - "it's worth noting", "to be honest", "certainly", "genuinely"
- **"Delve" and friends** - delve, utilize, leverage, robust, streamline, harness, seamlessly, cutting-edge, actionable insights
- **"Tapestry" and "landscape"** - ornate nouns where simpler words would do: tapestry, paradigm shift, ecosystem, cornerstone, at the intersection of
- **Magic adverbs** - quietly, deeply, fundamentally, remarkably - used to make mundane descriptions feel weighty
- **The "serves as" dodge** - replacing "is" with "serves as a reminder", "stands as a testament", "represents a fundamental"
- **Bullet point density** - AI defaults to lists regardless of whether content warrants it
- **Sentence burstiness** - humans mix short and long sentences; AI outputs uniform medium-length ones
- **Question avoidance** - AI almost never asks questions; it answers them
- **Type-token ratio** - a lightweight proxy for lexical diversity
- **Transition overload** - "furthermore", "moreover", "consequently" in clusters

Each pattern produces a normalized 0–1 score. These aggregate into a per-category breakdown and a final **Stylistic Index** from 0–100.

## Scanning my own site

I ran it against all 96 pages on this blog:

```
aidar discover carteakey.dev -o urls.txt
aidar scan --batch urls.txt
```

Results on **carteakey.dev** (current):
- **Max score: 19/100** (the changelog - 8,500 words of dense list structure)
- All 96 pages labeled **LIKELY HUMAN**
- The tropes detectors - negative parallelism, bold-first bullets, tricolon abuse - scored 0.00 across every page

Then I scanned an older build that had more AI-assisted posts. Top result: **36/100 LIKELY AI** on `/blog/tech/when-computers-finally-speak-human/`. That page fired four trope detectors simultaneously: em-dash addiction (10.6 per 1000 words), bold-first bullets (9.3/1000), tricolon abuse, and 13 writing trope matches. That's real. I wrote that post with heavy AI assistance and it shows.

The highest-scoring page on the current site is the changelog - which scores high purely on structural signals (bullet density, semicolons) rather than AI vocabulary or tropes. That's a meaningful distinction the tool can make.

## How the scoring works

Patterns are YAML files in a `patterns/` directory. Adding a new signal means writing a config file - no Python required. Each pattern has:

- **Calibrated thresholds** (`threshold_low`, `threshold_high`) - the range over which the score goes from 0 to 1
- **A version number** - bump it when you recalibrate, so old scans get flagged as stale
- **A detection type** - `frequency`, `regex`, `html_regex`, `structural`, or `linguistic`

The `html_regex` type is worth noting: it runs patterns against the raw HTML source rather than extracted text. This is how bold-first bullet detection works - trafilatura strips `<strong>` tags from the extracted text, but `<li><strong>Keyword</strong>` is detectable in the HTML itself.

The aggregate score is a weighted sum of category scores. The tropes category carries the highest weight (0.40) since structural writing habits are the strongest and least gaming-prone signal.

One comment from the HN thread on tropes.fyi nailed the calibration philosophy: *"Those tropes are things humans do too. But like once or twice in an article. Not every single freaking paragraph."* That's the whole point of threshold-based frequency scoring rather than binary detection.

## The irony

This tool was built by Claude. The codebase has em dashes in the comments. If you scanned the commit messages, the hedging detector would fire.

I find this funny.

## What's coming

The leaderboard site (aidar.lol) will show stylistic drift over time. Once there's enough historical data - using the article publish date that trafilatura extracts from each page - you can plot a domain's stylistic drift as a time series.

The TODO has things like:
- Dead Metaphor, One-Point Dilution, and Content Duplication detectors (the three that need NLP/semantic analysis rather than regex)
- Real perplexity scoring via GPT-2
- Wayback Machine integration for pre-AI baselines
- An embed badge for your site

If you want to contribute patterns or calibration data, the [GitHub repo](https://github.com/carteakey/aidar) is open.

## Running it yourself

```bash
pip install git+https://github.com/carteakey/aidar.git

# Analyze a single page
aidar analyze https://yourblog.com/some-post

# Or analyze raw text directly
aidar analyze --text "paste your article here"

# Discover and bulk scan a whole site
aidar discover yourblog.com -o urls.txt
aidar scan --batch urls.txt --min-words 50
```

The scan takes a few seconds per page. Results go into `aidar.db` (SQLite).

---

**References**
- ["Wikipedia: Signs of AI writing"](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) - 2023–present
- ["Tropes - AI Writing Pattern Directory"](https://tropes.fyi/), Ossama Chaib - 2026
- [New HN accounts ten times more likely to use em-dashes](https://www.marginalia.nu/weird-ai-crap/hn/), Marginalia
- [LLM writing style: empirical stylometric research](https://arxiv.org/abs/2410.16107) (PNAS 2025) - found GPT-4o's second-most-overused word is "tapestry"; present participles alone are a near-sufficient stylometric classifier
- [LLM writing style resources](https://www.refsmmat.com/notebooks/llm-style.html), Alex Reinhart - curated research notebook on this topic

---

*Yes, this post was written with AI assistance. The em dashes are real. I checked.*
