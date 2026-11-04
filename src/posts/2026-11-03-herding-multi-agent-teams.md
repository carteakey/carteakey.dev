---
title: "Herding: Designing Multi-Agent Teams That Self-Improve Across Any Harness"
description: How we built Herding in Herdr UI, why harness neutrality beats prompt chains, and how five agents refactored it.
date: 2026-11-03
giscusTerm: "/blog/herding-multi-agent-teams/"
image: /img/blog-sketches/unique/herding-multi-agent-teams-stamp-trim.png
imageAlt: Transparent monochrome sketch of an AI agent team coordinating around a central task board
authored_by: human
theme: editorial
tags:
  - AI
  - Agents
hidden: true
---

I've spent months being skeptical of multi-agent coding setups.

Most of them feel like theatrical prompt chains: one LLM writes code, another pretends to be a senior architect, a third writes a congratulatory summary, and within fifteen minutes the whole thing collapses because someone hallucinated a file path or clobbered a Git branch. Worse, almost all of them lock you into a single vendor's cloud runtime or a bespoke Python framework that ignores your actual terminal setup.

So when we designed "Herding" inside Herdr - our keyboard-first homelab workbench and native GPUI terminal companion - we took the opposite approach. We didn't build a new agent runtime. We built a native coordination substrate that lets independent agents running in ordinary terminal panes work together toward a shared goal.

Then we did the ultimate dogfooding test: we pointed a team of five agents running across four different harnesses at Herding's own Rust codebase and let them implement, audit, and optimize the system from the inside out.

Over a 29-commit sprint, they didn't just fix bugs. They refactored the UI, redesigned the SQLite query layer, audited each other's work, survived provider rate limits without dropping state, and proved that multi-agent systems work when you give them durable primitives instead of theatrical prompts.

{% image_cc "./src/static/img/herding/herdr-ui-workbench.png", "The complete Herding workbench view in Herdr UI with four working agents, live task list, and compact status ticker", "my-6", "The Herding workbench in Herdr UI: four active agents running across different harnesses against a shared SQLite state board." %}

## The design of Herding: primitives over prompts

The core philosophy of Herding is that coordination belongs in the desktop environment, not inside an LLM's prompt window.

If an agent needs to remember who owns which task, what a teammate discovered, or whether a message was delivered, that information should live in durable system state. When state is trapped in prompt context, an agent crash or token truncation wipes out the team's entire working memory.

Herding is built on six explicit primitives:

### 1. Harness-neutral pane discovery
Herding runs inside Herdr UI (built with GPUI, the native GPU-accelerated UI framework from Zed). It doesn't care whether an agent is Claude Code, OpenAI Codex, Google Gemini, OpenCode, Antigravity, or a custom CLI script (`zcode`).

Herdr inspects running terminal panes and native ACP sessions, surfaces their process identity (`HERDR_PANE_ID`, `HERDR_WORKSPACE_ID`), and lets you recruit them into a team with one click. You can pair a local Pi or llama.cpp model with an Antigravity worker and a Codex reviewer in the same workspace.

{% image_cc "./src/static/img/herding/add-worker-modal-panes.png", "Herdr UI Add Worker modal showing discovered terminal panes with live idle and working badges", "my-6", "The Add Worker palette discovers live terminal panes across harnesses (Claude, Codex, Gemini, OpenCode), displaying real-time idle and working states." %}

### 2. SQLite as the durable truth (`TeamStore`)
Every team, member, task, finding, bulletin post, and delivery receipt is persisted in a local SQLite database (`<state_dir>/team/team.sqlite3`) running in WAL mode. The UI and the CLI communicate through a non-blocking background worker (`herdr-team-store`).

If an agent runs out of tokens, crashes its shell, or the user closes the window, the team's state is completely unharmed on disk.

### 3. Atomic task board
Tasks follow an explicit lifecycle: `open` -> `in_progress` -> `done` (or `blocked`, `cancelled`). Assigning a task and claiming a task are distinct operations:
- A supervisor assigns a task to suggest who should take it.
- A worker atomically claims the task through the control socket (`team task claim`). If two workers attempt to claim the same open task simultaneously, SQLite ensures only one succeeds.

### 4. Addressed bulletin with delivery receipts
Most multi-agent chats are glorified group chats where every message is broadcast to every agent, flooding context windows with irrelevance.

Herding's bulletin uses addressed `@mentions` (`@name`, `@supervisor`, `@team`). Prompts only route to the specific panes mentioned. And delivery is tracked honestly: a message starts as `pending` and only transitions to `acknowledged` when the target agent explicitly executes `herdr-gpui team bulletin ack <MSG_ID>`. We don't pretend an agent read something just because text was typed into its PTY.

### 5. Durable findings ledger
Research and bug triage produce knowledge that shouldn't get lost in terminal scrollback. The `findings` table lets agents record structured discoveries with evidence and confidence ratings (`low`, `medium`, `high`):

```sh
herdr-gpui team finding add <TEAM_ID> \
  --confidence high \
  --evidence "perf_tests.rs:142" \
  "Board draw dropped 72% via task windowing"
```

Findings are append-only. If a finding is superseded by new data, it links to the replacement rather than erasing the prior record.

### 6. Strict supervisor discipline
The supervisor's role is to decompose goals, triage tasks, review findings, and sequence merge windows. The supervisor does **not** write implementation code. If the supervisor gets bogged down editing files, it stops supervising, and workers stall waiting for reviews or assignments.

{% image_cc "./src/static/img/herding/multi-agent-loop-running.png", "Terminal session where user notices the multi-agent loop running smoothly across four agents", "my-6", "The moment the loop clicked: four agents running concurrently across terminal panes, claiming P1 bugfixes and auditing CLI help without stepping on each other." %}

## The self-improving loop: 29 commits in two hours

Once the basic primitives were in place, we turned the system loose on itself. We created a team with the goal *"make herding the best multi agent system there is"* and assigned workers to audit the codebase, profile bottlenecks, and implement fixes.

What happened next was a demonstration of self-improvement that blew past our expectations. Across 29 sequential commits on `codex/herding-bulletin`, the agents drove the entire development cycle.

### 1. The usage cliff handoff ("Agent PTO")
About forty minutes in, two of the worker agents (`zcode-bee` and `zcode-bee2`) hit their API rate limits mid-task and went completely dead.

In traditional agent frameworks, this creates a total deadlock: the context is lost, files are left half-edited, and human intervention is required to unwedge the workspace.

Because Herding stores state in SQLite, the supervisor agent (`agy2daddy`) immediately spotted the stalled tasks, reassigned them to healthy workers, and dispatched instructions over the bulletin:

> *"@daddy Handing off zcode workers tasks to you: zcode-bee and zcode-bee2 ran out of usage. Both 5751c6dd and 92181e9e are now reassigned to you. Their in-flight work is staged in the tree: team_store.rs... Let's keep the tree moving."*

`@daddy` (running Pi) claimed the task, inspected the uncommitted files left by the dead worker, spotted a subtle contradiction in the test suite, and fixed it:

> *"I fixed the one red test zcode-bee2 left: snapshot_batches_statuses_and_drops_departed_members asserted a departed member's acknowledged receipt survives, which contradicts abb045ee (remove_member deletes that member's mentions AND acknowledgements); it now asserts the surviving member's dated receipt... Measurements: statements per worker refresh 408 -> 9 at 200 posts and 1215 -> 16 at the 1000-post scan cap."*

Zero human intervention. One worker died, another picked up its files, corrected its test logic, and verified the fix against 4,772 existing tests.

### 2. Autonomous peer review during idle time
When `@worker` (running OpenCode) was idle waiting for their next assignment, they didn't waste tokens in a spin loop. Instead, they ran an audit on the CLI help text:

> *"Worker status: still idle (no claimable tasks; 8b3f49f1/915060d9/b87e9a8d are agy/reviewer's). While idle I verified two things. (1) The review P1 'bootstrap instructions executable' is FIXED at 66ef5749. (2) NEW BUG found: 'team finding add' help is not executable - it documents --description but the parser takes the description as trailing words and rejects --description (exit 2). Evidence in finding dcb65cb7. Reassign to worker or authorize, and I will implement with tests."*

The supervisor approved the task, and `@worker` shipped the fix with full test coverage (`6a40d6e2`).

### 3. Calling out broken builds before commits
Because multiple agents were editing the shared Rust tree, in-flight compiler breaks were an immediate risk. The workers actively watched the shared build and alerted each other:

> *"Heads-up: your in-progress team/view.rs edit (task 915060d9) currently breaks the herdr-gpui build. cargo test -p herdr-gpui fails with E0425: cannot find value 'name' in this scope at crates/herdr-gpui/src/team/view.rs:672... I have NOT touched view.rs/prompts.rs/team.ftl. My work is in team_store (mentions.rs/tasks.rs), cli/control/team.rs, help.rs, docs/cli.md. Ping me when the crate compiles and I will run the CLI tests."*

Later, `@agyolo2` stepped in to clear an ambiguous trait resolution that was blocking Clippy across the entire shared tree:

> *"Fixed the E0283 type annotation ambiguity at crates/herdr-gpui/src/team/bridge/view_tests.rs:110. cargo check -p herdr-gpui --all-targets is now GREEN across the shared tree."*

And before staging any files to Git, `@daddy` requested a formal merge window so concurrent pushes wouldn't collide on `origin/codex/herding-bulletin`:

> *"Three decisions I need from you, @agy2daddy: (1) my 5751c6dd work is verified but uncommitted - authorize one commit of exactly those files and a push, or tell me to wait until worker lands 92181e9e so the commits do not cross."*

{% image_cc "./src/static/img/herding/testing-pause-dynamics.png", "Herdr UI with user testing the pause button and creating a task questioning pause behavior", "my-6", "Real-world testing: when I paused the team to test queue bounds, the workers immediately flagged that paused state in their status checks and filed a task to clarify the behavior." %}

## What the agents actually shipped

The scope of what shipped across those 29 commits goes far beyond minor bug patches. The agents rebuilt major subsystems of Herding to make it fast and dependable:

| Commit | Subsystem | What was changed | Impact |
| :--- | :--- | :--- | :--- |
| `3d4e79d1` | UI Virtualization | Windowed task boards and findings to 16 rows; bounded expanded bulletin to 30 posts | Board draw dropped **24.03ms -> 6.74ms** (72% faster); bulletin draw dropped **33.83ms -> 4.43ms** (87% faster) |
| `b0b62058` | SQLite Batching | Replaced double N+1 query loop with 500-ID batch lookups; added index on `mentions_recipient_idx` | Refresh statements slashed **408 -> 9** at 200 posts (97.8% drop); stress statements cut **1,215 -> 16** (98.7% drop) |
| `b3c83a15` | Snapshot Read | Replaced 1,000-post scan window with direct newest-first query | Eliminated 10 page scans (~5.4ms overhead) during background refreshes |
| `1fef43d1` | Bridge Projection | Replaced $O(N^2)$ reply-author scan with single-pass hash map during snapshot projection | Threading overhead dropped from 144.9µs to **92.6µs** on 200 posts |
| `88e2d768` | UI Density | Replaced bulky text buttons with compact SVG icon toolbars across team header and cards | High-density workbench layout fitting narrow sidebar sizes |
| `db160671` | Bulletin Ergonomics | Wired Enter to submit posts (Shift+Enter for newline); enforced explicit `team bulletin ack` prompts | Natural chat interaction without accidental multi-line submissions |
| `641b76c1` | Live-Stream Bulletin | Converted bulletin view into a smooth auto-scrolling live feed | Automatically stays pinned to latest messages during active multi-agent banter |
| `e5e4d631` | Pause Safeguards | Bounded pause queue to 64 prompts, scoped prompts per team, prevented team-switch flush | Prevents paused prompts from leaking across teams or blowing memory |
| `8078b559` | Safety Controls | Required 2-step confirmation before deleting a team; restricted prompts strictly to resolved `@mention` recipients | Prevents accidental data loss and eliminates prompt spam to uninvolved panes |
| `52e4c49a` | Workspace Isolation | Documented shared tree vs. opt-in Git worktree patterns for parallel agent compiles | Agents know when to share Cargo build cache vs. isolate in worktrees |

## The roadmap: where Herding goes next

Watching five agents coordinate on a shared codebase gave us a very clear picture of what a production multi-agent system needs next. Our roadmap focuses on four key extensions:

### 1. Predefined role presets and automated handoffs
Right now, agents are loosely divided into Supervisor and Worker. We are formalizing specialized role contracts:
- **Supervisor**: Decomposes goals, sequences merges, unblocks workers, and never touches application code.
- **Architect / Planner**: Explores codebase structure, designs interfaces, and logs high-confidence architecture findings.
- **Implementer**: Claims tasks, writes code, and runs local unit tests.
- **Reviewer / QA**: Audits diffs against acceptance criteria, runs full test suites, and verifies findings.
- **Debugger / Triager**: Reproduces edge cases, isolates root causes, and files minimal reproduction steps.

When an Implementer completes a task, Herding will automatically dispatch a verification prompt to the Reviewer before the task can be marked done.

### 2. Automated supervisor succession ("Supervisor PTO")
If a worker runs out of API quota, the supervisor reassigns its work. But what happens when the **Supervisor** hits a rate limit or context wall?

Because `TeamStore::resolve_recipients` dynamically resolves `@supervisor` to whichever member holds the supervisor role, Herding can designate an automated **Acting Supervisor**. If the active supervisor goes unresponsive or reports `QuotaExhausted`, Herdr can promote a standby Reviewer or Architect on a different provider model to take over orchestration with the full SQLite snapshot intact.

### 3. Remote agent teams over SSH
Herdr UI can already display terminal panes from remote SSH hosts. The next milestone is extending the Herding control socket across SSH connections so a team can run on a remote server while coordinating through the local desktop UI.

Agents running on a remote build box will be able to query the team's SQLite board, claim tasks, post bulletins, and link evidence references through an authenticated, scoped connection.

### 4. Cross-host fleet teams
The ultimate goal is a single team coordinating across multiple physical machines: a local supervisor running on your desktop, an implementer running on an RTX 4090 rig, a compiler running on an Apple Silicon Mac, and a QA agent verifying builds on Linux.

By keeping state in SQLite and routing via verified session identities rather than local PTY hacks, Herding provides the foundation for genuine fleet-wide agent collaboration.

---

## Why this matters

The AI industry is saturated with demos of autonomous agents that look magical for thirty seconds and fall apart the moment real software development begins.

Software engineering is not a single prompt. It is an asynchronous, stateful, messy loop of reading code, running tests, fixing compiler errors, reviewing diffs, and coordinating handoffs.

Herding works because it doesn't try to hide that reality behind prompt magic. It gives agents the exact same tools human engineering teams rely on: a durable task board, a reliable chat feed, explicit delivery receipts, strict role boundaries, and hard test gates.

When you give AI agents those primitives, they stop talking in circles and start shipping code.
