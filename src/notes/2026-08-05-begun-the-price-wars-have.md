---
title: "Begun, the Price Wars Have"
layout: layouts/note.njk
permalink: /notes/{{ page.fileSlug }}/
description: Muse and DeepSeek are fighting over API prices while Luna gets bundled into increasingly ridiculous subscriptions.
date: 2026-08-05
authored_by: ai-assisted
tags:
  - AI
  - Agents
---

AI coding prices got stupid this week.

{% image "./src/static/img/notes/ai-coding-price-wars.png", "A person sweating while choosing between three large red buttons labelled Muse, Luna, and DeepSeek V4 Flash", "w-full rounded-lg border border-gray-200 dark:border-gray-700" %}

| Model | Input | Output |
| --- | ---: | ---: |
| [Muse Spark 1.2 Contributor](https://developer.meta.com/ai/models/muse-spark/) | $0.10 | $0.20 |
| [DeepSeek V4 Flash](https://api-docs.deepseek.com/quick_start/pricing/) | $0.14 | $0.28 |
| [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) | $0.20 | $1.20 |
| [Luna via OpenRouter](https://openrouter.ai/openai/gpt-5.6-luna) (50% off) | $0.10 | $0.60 |

Prices are per million tokens.

Muse Contributor is the cheapest of the bunch. Ten million input tokens and two million output tokens cost $1.40. The trade is permission for Meta to train on your prompts and completions, so I would keep work code far away from it.

DeepSeek V4 Flash is nearly as cheap without needing a special contributor tier, and its cached input price is a frankly stupid $0.0028 per million tokens.

Luna then went from cheap to silly. OpenAI dropped the direct API price to $0.20/$1.20, and OpenRouter is temporarily selling it at another 50% off ($0.10/$0.60).

Subscriptions are getting dragged into the fight too. [OpenCode Go](https://opencode.ai/go) is $5 for the first month and $10/month after that, with Luna currently getting 2x usage limits.

Luna is still king for me, though.

By my rough usage-limit math, Luna Max on the $20 ChatGPT Plus plan works out to around 1.5 billion tokens a week. The exact number depends on how credits are counted, but the allowance is large enough that I have stopped thinking about individual requests. Max reasoning when I need it, fast mode almost everywhere else.

This is basically [TPS over Quality](/notes/tps-over-quality/) again, except the cheap fast model is now also very good.

ChatGPT Plus. Luna Max. Fast mode. That is all I need.

Begun, the price wars have.
