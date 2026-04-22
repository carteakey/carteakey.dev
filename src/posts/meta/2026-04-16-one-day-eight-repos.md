---
title: "One day, eight repos, $171.55"
description: A log of what actually shipped on 2026-04-16 across my stack, what it cost, and the single line item that ate 99% of the bill.
date: 2026-04-16
authored_by: ai-assisted
tags:
  - AI
  - Agents
hidden: true
draft: true
pinned: false
featured: false
---

Occasionally I look at my `~/.claude/projects` directory and realize I have no idea what a day of Claude Code actually costs me. Today I finally wrote down the receipt.

The ledger, per [`ccusage`](https://www.npmjs.com/package/ccusage):

```
claude-opus-4-7    $169.60   (211.5M tokens, 99% cache reads)
claude-haiku-4-5     $1.88   (9.7M tokens)
claude-sonnet-4-6    $0.07
─────────────────────────
TOTAL              $171.55   across 11 sessions
```

99% of the spend was **cache reads on the 1M-context Opus model**. Every turn re-pays to read the conversation back in as it grows. If I'd been disciplined about `/clear`-ing between logical tasks instead of letting sessions balloon, the bill would probably have been half that. File that under "tomorrow's problem."

Here's what the money actually bought.

---

## What shipped

### `nanoghibli` — Batch API, cost attribution, quota-safe resume

The biggest single piece. A review of the Ghibli-stylization pipeline turned up:

- Pricing calculator was applying **Flash-Lite rates to everything**, undercounting Pro-tier runs by ~8×.
- `setpts=({dur}/4)` was hard-coded but Veo is requested at 4/6/8 seconds — the 6s and 8s segments were being time-stretched incorrectly.
- Veo billing counter incremented **before** the video downloaded (Google only charges on success).
- Stylizer cache key didn't include model tier, so flash/pro runs cache-collided.

Fixed all four. Then added:

- `--batch` opt-in routes stylization through the Gemini Batch API (50% cost, async, 24h SLO). Veo stays sync — Batch API doesn't support video.
- Quota-safe resume: `scenes.json` hot-writes per scene, `veo_progress.json` tracks per-segment Veo state, `batch_jobs.json` lets reruns skip resubmission of in-flight batches.
- `QuotaExceededError` now surfaces a clean `--session_id` resume hint instead of a traceback.

29 tests total, green. Verified end-to-end on a 30-second Dune trailer slice: 5 Veo segments, $5.06 total, per-model cost attribution matching hand calculation to the cent. Landed as PR #1.

### `cartebase` — five commits

Importer sprawl: Steam, Reddit, health metrics, Fitbit, bank. Plus a `MANIFEST` regenerator, a `blog_snapshots` exporter, and the dashboard PR merged. The Makefile runner actually makes running the importers humane for the first time.

### `clawfin` — v0.1 "brutalist"

One commit, big surface. Brutalist redesign, recurring transactions, planning, palette, snapshots. Somehow the fastest moving thing today.

### `lytte` — ambient assist, for real this time

Queue, retention policy, web UI, desktop polish. Two commits, one of them with actual documentation. The web UI means I can stop SSH'ing into things just to check state.

### `server-compose` — self-hosted discipline

Four commits:
- Weekly compose-updater CI
- Static catalog page (so the README stops being the source of truth)
- Memos server added
- A `scan-services` skill for discovering new self-hosted options

### `l3ms` — switching to llama-swap

Four commits. The punchline: replacing per-model shell scripts with llama-swap. Plus an install script with OS/arch autodetect, TUI Model Ops wiring, and post-migration cleanup (YAML bugs, stop-vs-selection semantics, telemetry, chat picker, portable systemd unit).

---

## What I took away

**The Opus 1M bill is real.** Cache reads look free on the receipt line ("it's just cache!") but at 1M context they're **not** free — they're the majority of the bill. Shorter sessions beat longer ones, even when the context feels useful. Every `/clear` is a rebate.

**Sonnet for the easy bits.** Most of today's coding — file edits, test scaffolding, README updates — would have been fine on Sonnet. Opus earns its price on the hard calls: catching the setpts bug, rewriting the cost-attribution bucket structure, untangling the batch + sync + resume state machine. Not on routine edits.

**Resumability pays off disproportionately.** The nanoghibli quota-safe-resume work looks over-engineered on paper — three state files, hot-writes, a batch registry — but it's the difference between "Veo hit its 10/day cap and I lose 40 minutes of progress" and "rerun with `--session_id X` tomorrow, done." Spending $20 today to never spend 40 minutes again tomorrow is usually the right trade.

**Importers are a tax you pay once.** `cartebase` now has Steam, Reddit, health, Fitbit, and bank importers. That's the data plumbing that enables every downstream project. Worth every hour.

---

## The day-after checklist

- [ ] Live-test nanoghibli `--batch` against real Batch API (unit tests mock the SDK).
- [ ] Live-test the quota-hit resume path — the only real integration test is a real quota hit.
- [ ] Start using `/clear` between logical tasks to keep Opus cache reads bounded.
- [ ] Decide whether the `cartebase` importers want unit tests or just trust the integration tests.

$171.55 is more than I usually spend in a week. But so is 8 shipped PRs in a day, so: fine.
