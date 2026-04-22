---
title: Claude Code is all you need?
description: I know that "all you need" is annoying but hear me out.
date: 2026-04-15
authored_by: human
draft: true
tags:
  - AI
  - Agents
hidden: false
pinned: false
featured: false
---

The hype around openclaw — and every other claw derivative — seems to be fading a bit as reality checks in. And what's interesting is the hype was never really about the product itself. It was about:

- The premise of personal agents working for you while you do other stuff
- The novelty of loosely defined specs and automations, as opposed to something structured like n8n
- Brilliant astroturfing by the folks involved
- The accessibility of the true "power/potential" of AI to people outside SF and the tech bubble
- As karpathy said, they're just a natural progression and an abstraction layer over agents (which are finally great!)

The key takeaway here is that packaging, distribution and marketing are just what makes or breaks a product. Unlike breaking bad, a good product doesn't always sell itself, and openclaw and its creators have shown how to ride the hype train well, its actually brilliant (well for a certain period of time, at least).

For actual use cases that work today — if you ask real users (outside of X/Twitter) what they're doing with it — you'll hear things like:

- **Research agents** (makes sense, but better alternatives exist)
- **Marketing leads** (makes sense, not sure better alternatives exist)
- **Running a company** (umm... ok)
- **Trading bots** (mostly scams)
- **Email organization** (umm...)
- **Note-taking / wiki agents** (exciting area — as a longtime fan of Obsidian — but it feels a bit too close to offloading thinking entirely)
- **Having fun tinkering** (most important — 🤚🏻)
- please comment if I missed any

Like before, the right posture here is to not be a luddite, but to acknowledge the potential that lies here. Agents were said to be stupid until they weren't. What happened in late 2025 surprised everyone. This too will become the norm; we're just getting there in a disorganized manner.

The worst it will ever be. Yada yada.

---

Openclaw, and all its derivatives, primarily provide:

- A relatively easy-to-run and configure agentic framework (with preloaded skills and config)
- A clean structure of **gateway + cron + model** — all alternatives (nanoclaw, zeroclaw) are built on this

But everyone just knows: it's a vibecoded **POS**. It's **bloated** beyond recognition. The CVEs are massive, and it is a security nightmare handed to the general public. I don't need to expand on this.

The secure alternatives (nemoclaw, nanoclaw) don't make much sense either — they put unnecessary guardrails on something that is supposed to be inherently open. It's like putting wheel locks on a racing car. The car is meant to race. (And cause accidents, lol.)

When you strip it all down, openclaw does five — well, six — things:

1. **Orchestration and job runs** — essentially cron
2. **Gateway** — Telegram, Discord, etc. for remote access
3. **Model** — connect to a model
4. **Memory** — the thing everyone is trying to solve in their own way: SOUL.md, MEMORY files, SQLite, you name it
5. **Skills** — preconfigured integrations for common tasks (connect to Gmail, etc.)
6. **Web UI** — configuration and monitoring

---

## It's All Skills

I tried running hermes agents for a while, which felt like a cleaner implementation — at least for my needs. It just uses skills and a simpler MEMORY file.

In all my experience with models, letting them use their intelligence instead of wrapping them in weird harnesses is almost always better. Less is more, especially here. Simply providing the AI with a document that tells it what to do works in most cases.

Within my limited experience, the only few use cases I found useful from this whole exercise were:

- **Checking for events around me and reporting every morning** — worked great
- **Linting my notes every X hours** — worked great
- **Monitoring websites for availability** (Library passes, ticket drops, etc.) — worked great

These cases held up really well. They're fun to run.

## Claude Code as an Alternative

Playing with these alternatives made something obvious: memory isn't a differentiator anymore. ChatGPT, Cursor, and Copilot all have it. Everyone is shipping scheduling features. The category boundaries from twelve months ago are gone.

What actually matters is whether context persists across sessions. Does it run on hardware you control? Can you reach the exact same agent from any device, and does it genuinely learn your workflow without you manually configuring it every week?

The market is converging: chat apps added scheduling, editors shipped cloud agents, and CLIs are getting skills. Any individual feature is already available somewhere else. The real value is having all of them in one system, running continuously, with an identity that genuinely accumulates knowledge about your stack.

When Anthropic announced that Claude Code will no longer run on other harnesses, I was skeptical but it made sense. They simply dont have the compute offerings that OpenAI have today. However, they've been steadily chipping away at each of the components through their own implementations. I find their approach much more focused on developers and actual use cases. 

When we look at the current state of things (research preview), they already have most of the components implemented for us to have a clawd (see what I did there?) like experience. And Claude Code actually handles all of this natively:

- **Skills** — Its their brainchild.
- **Model** — well, they have claude.
- **Memory** — you can have any basic memory implementation you want, its just SOUL.md, MEMORY.md etc.
- **Gateway** — They have a telegram plugin, and hooks. It takes less than a few lines of code to get running. The exact same agent that answered your Telegram message at 9am is waiting in your terminal at 2pm.
- **Orchestration** — They just introduced routines.
- **Web UI** — they already had /dispatch and claude web.

## Starting out
