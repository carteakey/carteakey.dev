---
title: "Herding: Designing Multi-Agent Teams That Self-Improve Across Any Harness"
description: "How I built Herding in Herdr UI: SQLite state, harness-neutral terminal panes, and a 29-commit agent dogfood sprint."
date: 2026-11-03
giscusTerm: "/blog/herding-multi-agent-teams/"
image: /img/blog-sketches/unique/herding-multi-agent-teams-stamp-trim.png
imageAlt: Transparent monochrome sketch of an AI agent team coordinating around a central task board
authored_by: ai-assisted
tags:
  - AI
  - Agents
hidden: true
---

I've been skeptical of multi-agent coding setups for months. Most of them are prompt chains: one LLM writes code, another roleplays a senior architect, a third writes a summary, and within fifteen minutes the whole thing collapses because someone hallucinated a file path or clobbered a Git branch. Almost all of them also lock you into a single vendor's cloud runtime or a custom Python wrapper outside your actual terminal.

When I built **Herding** inside **Herdr** (my native GPUI terminal workbench), I put the coordination layer in the desktop app instead of the prompt window. Independent agents run in ordinary terminal panes and coordinate through a shared local SQLite database.

To test it, I pointed five agents across four different harnesses at Herding's own Rust codebase on `codex/herding-bulletin`. Over two hours and 29 commits, they refactored the UI, batched the SQLite query layer, audited each other's diffs, and handed off in-flight work when two workers hit API rate limits.

{% image_cc "./src/static/img/herding/herdr-ui-workbench.png", "The complete Herding workbench view in Herdr UI with four working agents, live task list, and compact status ticker", "my-6", "The Herding workbench in Herdr UI: four active agents running across different harnesses against a shared SQLite state board." %}

## The design of Herding: primitives over prompts

When team state lives inside an LLM context window, a shell crash or context compaction wipes out the team's working memory. Herding moves that state into six explicit primitives in Herdr UI:

### 1. Harness-neutral pane discovery
Herdr inspects running terminal panes and native ACP sessions, surfaces their process identity (`HERDR_PANE_ID`, `HERDR_WORKSPACE_ID`), and recruits them into a team regardless of harness - Claude Code, Codex, Gemini, OpenCode, Antigravity, Pi, or a local `llama.cpp` script (`zcode`).

{% image_cc "./src/static/img/herding/add-worker-modal-panes.png", "Herdr UI Add Worker modal showing discovered terminal panes with live idle and working badges", "my-6", "The Add Worker palette discovers live terminal panes across harnesses (Claude, Codex, Gemini, OpenCode), displaying real-time idle and working states." %}

### 2. SQLite as the durable truth (`TeamStore`)
Every team, member, task, finding, bulletin post, and delivery receipt lives in `<state_dir>/team/team.sqlite3` under WAL mode, accessed through a non-blocking background worker (`herdr-team-store`). If an agent crashes or the window closes, the board stays intact on disk.

### 3. Atomic task board
Tasks move through `open -> in_progress -> done` (or `blocked`, `cancelled`). Assigning and claiming are separate: a supervisor suggests an owner, and a worker atomically claims the task over the control socket (`team task claim`) so two workers cannot grab the same task simultaneously.

### 4. Addressed bulletin with delivery receipts
Instead of broadcasting every message to every pane, Herding routes prompts only to addressed `@mentions` (`@name`, `@supervisor`, `@team`). Delivery starts as `pending` and only flips to `acknowledged` when the target agent runs `herdr-gpui team bulletin ack <MSG_ID>` - typing text into a PTY does not count as read.

### 5. Durable findings ledger
Agents log structured discoveries to the append-only `findings` table with evidence paths and confidence ratings (`low`, `medium`, `high`). Superseded findings link to their replacement instead of overwriting history:

```sh
herdr-gpui team finding add <TEAM_ID> \
  --confidence high \
  --evidence "perf_tests.rs:142" \
  "Board draw dropped 72% via task windowing"
```

### 6. Strict supervisor discipline
The supervisor decomposes goals, triages tasks, reviews findings, and sequences merge windows without writing implementation code. Once a supervisor starts editing files, it stops unblocking workers.

{% image_cc "./src/static/img/herding/multi-agent-loop-running.png", "Terminal session where user notices the multi-agent loop running smoothly across four agents", "my-6", "Four agents running concurrently across terminal panes, claiming P1 bugfixes and auditing CLI help without stepping on each other." %}

## The self-improving loop: 29 commits in two hours

With the primitives working, I created a team on `codex/herding-bulletin` and assigned five workers to profile bottlenecks, audit CLI behavior, and ship fixes across Herding itself.

### 1. The usage cliff handoff ("Agent PTO")
Forty minutes in, two workers (`zcode-bee` and `zcode-bee2`) hit their API usage limits mid-task and stopped responding. Because task state and file progress were tracked in SQLite, the supervisor (`@agy2daddy`) spotted the stalled tasks and reassigned them over the bulletin:

> *"@daddy Handing off zcode workers tasks to you: zcode-bee and zcode-bee2 ran out of usage. Both 5751c6dd and 92181e9e are now reassigned to you. Their in-flight work is staged in the tree: team_store.rs... Let's keep the tree moving."*

`@daddy` (running Pi) claimed both tasks, inspected the uncommitted edits left in the working tree, caught a contradictory test assertion, and finished the batching patch:

> *"I fixed the one red test zcode-bee2 left: snapshot_batches_statuses_and_drops_departed_members asserted a departed member's acknowledged receipt survives, which contradicts abb045ee (remove_member deletes that member's mentions AND acknowledgements); it now asserts the surviving member's dated receipt... Measurements: statements per worker refresh 408 -> 9 at 200 posts and 1215 -> 16 at the 1000-post scan cap."*

No human step was needed: one worker died, another picked up its dirty tree and passed all 4,772 tests.

### 2. Autonomous peer review during idle time
While `@worker` (running OpenCode) waited for its next assignment, it audited the CLI help output against the parser implementation:

> *"Worker status: still idle (no claimable tasks; 8b3f49f1/915060d9/b87e9a8d are agy/reviewer's). While idle I verified two things. (1) The review P1 'bootstrap instructions executable' is FIXED at 66ef5749. (2) NEW BUG found: 'team finding add' help is not executable - it documents --description but the parser takes the description as trailing words and rejects --description (exit 2). Evidence in finding dcb65cb7. Reassign to worker or authorize, and I will implement with tests."*

`@agy2daddy` authorized the task, and `@worker` landed the fix with regression tests in `6a40d6e2`.

### 3. Calling out broken builds before commits
Because all five agents shared a single Rust working tree, an in-flight edit in one pane could break `cargo test` for everyone else. Workers called out compiler errors directly on the bulletin:

> *"Heads-up: your in-progress team/view.rs edit (task 915060d9) currently breaks the herdr-gpui build. cargo test -p herdr-gpui fails with E0425: cannot find value 'name' in this scope at crates/herdr-gpui/src/team/view.rs:672... I have NOT touched view.rs/prompts.rs/team.ftl. My work is in team_store (mentions.rs/tasks.rs), cli/control/team.rs, help.rs, docs/cli.md. Ping me when the crate compiles and I will run the CLI tests."*

`@agyolo2` cleared an `E0283` trait ambiguity blocking Clippy in `view_tests.rs:110`, and `@daddy` requested explicit commit sequencing before touching Git:

> *"Three decisions I need from you, @agy2daddy: (1) my 5751c6dd work is verified but uncommitted - authorize one commit of exactly those files and a push, or tell me to wait until worker lands 92181e9e so the commits do not cross."*

{% image_cc "./src/static/img/herding/testing-pause-dynamics.png", "Herdr UI with user testing the pause button and creating a task questioning pause behavior", "my-6", "When I paused the team to test queue bounds, the workers flagged the paused state in their status checks and filed a task to tighten pause-queue behavior." %}

## What the agents actually shipped

| Commit | Subsystem | What changed | Measured impact |
| :--- | :--- | :--- | :--- |
| `3d4e79d1` | UI Virtualization | Windowed task boards and findings to 16 rows; bounded expanded bulletin to 30 posts | Board draw **24.03ms -> 6.74ms** (-72%); bulletin draw **33.83ms -> 4.43ms** (-87%) |
| `b0b62058` | SQLite Batching | Replaced double N+1 query loop with 500-ID batch lookups; indexed `mentions_recipient_idx` | Refresh queries **408 -> 9** at 200 posts (-97.8%); **1,215 -> 16** at 1,000-post cap (-98.7%) |
| `b3c83a15` | Snapshot Read | Replaced 1,000-post scan window with direct newest-first query | Cut 10 SQLite page scans (~5.4ms) per background refresh |
| `1fef43d1` | Bridge Projection | Replaced $O(N^2)$ reply-author scan with single-pass hash map | Threading projection **144.9µs -> 92.6µs** on 200 posts |
| `88e2d768` | UI Density | Replaced text buttons with compact SVG icon toolbars across team header and cards | Fits narrow sidebar widths without horizontal clipping |
| `db160671` | Bulletin Ergonomics | Wired `Enter` to submit (`Shift+Enter` for newline); enforced `team bulletin ack` prompts | Eliminates accidental multi-line submissions and unacknowledged prompts |
| `641b76c1` | Live-Stream Bulletin | Auto-scrolling live feed pinned to newest messages | Keeps active multi-agent handoffs visible without manual scrolling |
| `e5e4d631` | Pause Safeguards | Bounded pause queue to 64 prompts per team; blocked cross-team flush | Prevents paused prompts from leaking across teams or growing unbounded |
| `8078b559` | Safety Controls | Added 2-step team delete confirmation; restricted prompts to resolved `@mention` targets | Stops accidental team deletion and prompt broadcasts to uninvolved panes |
| `52e4c49a` | Workspace Isolation | Documented shared tree vs. opt-in Git worktree rules for parallel Rust compiles | Lets agents share Cargo's `target/` cache when safe or isolate in worktrees |

## The roadmap: where Herding goes next

Running five agents against a shared Rust tree exposed four gaps I'm building next:

1. **Role presets and automatic review handoffs**: Formalizing `Supervisor`, `Architect`, `Implementer`, `Reviewer`, and `Debugger` contracts so completing an implementation task automatically dispatches a verification prompt to the `Reviewer` before the task can close.
2. **Supervisor succession ("Supervisor PTO")**: Because `TeamStore::resolve_recipients` dynamically resolves `@supervisor` to whichever member holds the role, Herdr can promote a standby `Reviewer` or `Architect` on a different provider when the active supervisor hits `QuotaExhausted`.
3. **Remote teams over SSH**: Herdr UI already mounts remote SSH panes; forwarding the Herding control socket over SSH lets agents on a remote build server claim tasks and post findings against the local SQLite board.
4. **Cross-host fleet teams**: Combining local desktop supervision with workers across my RTX 4070 Linux box and Apple Silicon Mac, routed by verified session identity rather than local PTYs.

