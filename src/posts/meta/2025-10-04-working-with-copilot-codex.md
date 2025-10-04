---
title: Working with Copilot & Codex on carteakey.dev
description: The workflow behind using AI agents effectively
date: 2025-10-04
tags:
  - Agents
  - AI
hidden: true
---

I have been leaning heavily on the Copilot/Codex pairing lately, so it felt right to document what “working with agents” actually means for this site. The short version: everything is scripted. Each session starts with a fixed prompt, runs through an explicit set of instructions, and ends with manual validation before anything ships.

## The mission lives in `docs/prompt.md`

The current assignment for Copilot/Codex always lives in [`docs/prompt.md`](https://github.com/carteakey/carteakey.dev/blob/sonnet/docs/prompt.md). I update that file before kicking off a work session so the agent has crisp guardrails—scope, batching rules, and how to report back. Treat it as the mission briefing: when the objective changes, the prompt changes, and every downstream action follows suit.

## The playbook is captured in `docs/instructions.md`

[`docs/instructions.md`](https://github.com/carteakey/carteakey.dev/blob/sonnet/docs/instructions.md) collects the house rules: stay on `sonnet`, favour the simplest solution, keep the changelog and `versions.json` honest, and never edit `_site/` by hand. It also lists the stack and integration quirks (Eleventy 3, Tailwind 4, Alpine sprinkles, Upstash upvotes, etc.). Before any edit, I have the agent read this document so we start from the same context.

## A single flow for every task

1. Clarify the request and check the TODO backlog.
2. Draft a plan. I keep it lightweight—only detailed enough to surface hidden work.
3. Use Git + the local toolchain to make the change. For anything content-related that means working inside `src/`, never `_site/`.
4. Run the relevant build step (`npm run build` or `npm run build:11ty`) and manually spot-check the pages, even when the agent already “looks” satisfied.
5. Update `docs/CHANGELOG.md`, bump `versions.json`, clean up TODO items, and prepare a single focused commit.
6. Summarise the batch, ask whether to continue, then push `sonnet` when it’s green.

That rhythm is the glue—it keeps batches predictable and gives me confidence that every assist from Copilot or Codex is grounded in the same guardrails. If you want to adopt something similar, start by codifying your own prompt and instructions, then automate the hand-off so both human and agent read the same brief before each edit.
