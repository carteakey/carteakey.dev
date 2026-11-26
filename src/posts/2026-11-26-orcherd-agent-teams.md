---
title: "Orcherd: Coordination as a Binary, Not a Desktop App"
description: "Herding kept the team board in a GUI. Orcherd moves it into a small Rust binary any harness can call."
date: 2026-11-26
giscusTerm: "/blog/orcherd-agent-teams/"
# TODO before publishing:
# - Thumbnail is a blank transparent placeholder so the content check passes. Generate the
#   real stamp with the sketches skill (Part A), keep the filename, and update imageAlt.
# - Cross-link the Herding post once both are live (hidden: true, so the URL is not built in
#   production yet).
# - Confirm the binary size and the v0.1 status at publish time.
image: /img/blog-sketches/unique/orcherd-agent-teams-stamp-trim.png
imageAlt: Placeholder thumbnail, sketch not generated yet
authored_by: ai-assisted
tags:
  - AI
  - Agents
hidden: true
---

My Herding write-up ended with a roadmap: supervisor succession when the lead hits a quota wall, teams spanning remote machines, and workers routed by verified identity instead of local PTYs. All three are shipped now, and none of them survived contact with the original design. Herding put the coordination layer in the desktop app. Orcherd puts it in a binary and lets the app be a view.

That difference is the whole post. Herding's board was durable — SQLite on disk, safe from a crash or a closed window — but *access* to it was not. An agent could only join a team if it ran in a pane the app could see, on my machine, in a window I had open. The state was portable and the workers were not.

## One binary, one transaction per call

Orcherd is a single Rust binary, roughly 7 MB, over a SQLite store. Agents call it from their own terminals:

```sh
orcherd inbox                    # read your assignments and gate answers
orcherd ask --question "..."     # block, then end your turn
orcherd done --result-file out.md
orcherd verdict <task> --verdict pass|fix|escalate --body-file review.md
```

Every call is one transaction, so the team's state survives a shell crash, a restart, or a closed window, and nothing about the protocol depends on a GUI being open. Herdr is still where the seats live, but it went from coordinator to workbench.

The long-lived state is the point. When team state lives inside an LLM's context window, a compaction event or a dead shell wipes the team's working memory. When it lives in a store the agents call into, the worst case is that one seat has to re-read its brief.

## Who is allowed to do what

The parts I got wrong the first time were the ones about authority, not storage. Three rules carry most of the weight:

- **The reviewer cannot review its own work.** A `vicesuper` or `gauntlet` seat gets its own verdict command, and enforcement lives in the tool rather than in a prompt. Three failed rounds escalates to me instead of looping.
- **Supervisors do not build.** Same rule as Herding, now enforced by the task board rather than by convention.
- **Claiming is not assigning.** A supervisor suggests an owner; the worker atomically claims. Two workers cannot take the same task, even if they both read the board at the same instant.

## Decision gates beat waiting

A worker that needs a decision runs `orcherd ask`, then ends its turn. It is not spinning, not retrying, not burning tokens to stay warm: it is a row in a table waiting for an answer. The supervisor replies with `orcherd reply <gate_id>`, and Orcherd wakes the worker.

The emergency stop follows the same logic. `orcherd freeze --reason` interrupts seats mid-turn, refuses new spawns and claims, and notifies everyone. A bulletin post would sit unread behind whatever the busy seat was already doing.

## One worktree per seat, without paying for it

`--worktree new-child` creates a child worktree and symlinks the bootstrap set — `.env`, `.venv`, `node_modules` — from the workspace root. Parallel builders in the same repo stop colliding over the same files, and no seat pays for a fresh dependency install or a cold Cargo target to get there. Worktrees were a roadmap item; the symlinks are what made them usable.

## A roster, not a pool

`--seat neon1` binds work to a named seat. If that seat has a warm terminal on `herdr-core`, spawning reuses the running signed-in process and rings its doorbell when the current turn ends. The OAuth session, the model selection, and the accumulated context all survive between tasks. A worker pool starts cold every time; a roster does not.

| | Claude Code agent teams | Session managers | orcherd |
| :--- | :--- | :--- | :--- |
| Agents | Claude Code only | Several CLIs, side by side | Any terminal agent, mixed in one team |
| Coordination | Shared task list and messages | You coordinate them | Task DAG, inbox, decision gates, bulletin |
| Review | Plan approval by the lead | You review diffs | A reviewer seat that cannot review its own work |
| Worktrees | Not built in | One per session | One per seat, with dependencies linked in |
| Other machines | Local only | Local only | Seats on any `hc` machine over SSH |

Mixing vendors in one team is not a gimmick, it is the failure model: Opus supervises, DeepSeek through Vibe takes the builds, ZCode seats take the grunt work, and pi on the local model picks up whatever is left when a hosted quota runs dry. When one provider rate-limits, the shape of the team does not change.

## What is still rough

- **Do not poll.** Let the daemon wake you on `worker_done`, `question`, `verdict`, or `escalation`. Looping `inbox` wastes tokens and races the delivery receipt.
- **A seat can refuse its doorbell.** After a minute of unread items, Orcherd escalates; `orcherd seat read <seat> --lines 40` shows why, usually a dialog or a harness that died.
- **`blocked` usually means a human is needed.** It is an OAuth or permission screen in that terminal. Spawning a second worker just hits the same screen.
- **It is v0.1.** Headless seats (`--no-ui`) and seats on remote machines are the least-travelled paths.

The Herding post stays up as the record of the shape that did not generalise: coordination at the app layer works beautifully right up until you want a worker that is not on your desk. Orcherd keeps the primitives — durable state, an atomic board, roles that cannot self-approve — and drops the assumption that a window has to be open. Source is at [carteakey/orcherd](https://github.com/carteakey/orcherd).
