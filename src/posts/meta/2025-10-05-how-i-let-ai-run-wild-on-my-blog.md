---
title: How I Let AI Run Wild on My Blog (with Copilot & Codex) (draft)
description: A peek at the playbook that lets AI assistants plan, ship, and report on updates to carteakey.dev.
date: 2025-10-05
tags:
  - AI
  - Workflow
hidden: true
---

I have joked for years that my site runs on coffee and curiosity. The truth these days is that it also runs on AI copilots. This post documents how I hand over the controls to Codex, what keeps the workflow grounded, and why the human still matters.

## Why give AI the keys?

Because the backlog never ends. I keep a living TODO list in `docs/TODO.md`, a prompt for the current mission in `docs/prompt.md`, and a standing set of guardrails in `docs/instructions.md`. The trio lets me point an AI assistant at the work without losing the plot.

## The mission brief: `docs/prompt.md`

Every session starts with a compact prompt. Today’s edition (the one powering this very post) literally tells Codex to “check off each item in my TODO list… in batches of five.” That clarity keeps the agent from freelancing. Whenever priorities change—new feature, bug hunt, content push—I rewrite `docs/prompt.md` before asking the assistant to do anything.

## The house rules: `docs/instructions.md`

The instructions file is the long form manual. It spells out the stack (Eleventy 3 + Tailwind 4 + Alpine), reminds the agent to stay on the `sonnet` branch, and locks in the manual release steps: update the changelog, bump `versions.json`, test in the browser, commit cleanly. It is the safety net that keeps the AI from YOLO-ing the repo.

## The shared flow

Whether I am drafting a post, restyling a layout, or wiring a Netlify function, the rhythm stays the same:

1. **Clarify** the task and draft a lightweight plan. If something feels fuzzy, the plan flushes it out early.
2. **Build** the change with the local toolchain. Everything lives under `src/`—never `_site/`.
3. **Verify** with `npm run build` and a quick tour of `/`, `/feed/`, `/blog/`, `/now/`, and `/stats/`.
4. **Ship** by updating `docs/CHANGELOG.md`, bumping `versions.json`, committing, and pushing `sonnet`.
5. **Report back** with a summary and the option to continue the next batch.

Codex follows the same flow and I do not merge anything that skips a step.

## Humans still fly the plane

The agent can draft prose, refactor layouts, even reason about data fallbacks—but I still read everything, run npm builds locally, and sanity check the UI. That combination lets me move faster without giving up craft. When Codex finishes a batch, I review the diff, tweak any phrasing that feels off, and decide whether to press on.

## Want to adopt the setup?

1. Write down your mission each session (`docs/prompt.md`).
2. Capture the rules once (`docs/instructions.md`).
3. Keep the backlog visible (`docs/TODO.md`).
4. Automate nothing else until those three stay in sync.

That is how I let AI “run wild” on this blog without losing myself in the process.
