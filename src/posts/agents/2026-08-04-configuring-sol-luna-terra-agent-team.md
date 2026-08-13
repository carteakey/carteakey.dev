---
title: My Sol, Luna, and Terra Agent Team Is Mostly a Price Play
description: "How lower Luna and Terra prices shaped my Codex setup: Sol orchestrates, Luna Max carries the implementation volume, and Terra High handles focused support."
seoDescription: "A practical, cost-aware Codex agent setup with Sol orchestrating, Luna Max as the default workhorse, and Terra High as a read-heavy support worker."
date: 2026-08-04
authored_by: ai-assisted
tags:
  - AI
  - Agents
hidden: true
pinned: false
featured: false
---

I have already described coding agents as the smartest five-year-olds I have ever managed. The missing part was job descriptions.

Three agents running at once sounds sophisticated until all three read the same repository, invent slightly different versions of the goal, and proudly return three incompatible answers. Lots of movement. Not always much progress.

So I ended up with a very simple pecking order:

- Sol Medium keeps the full objective and acts as the orchestrator, with High available when the judgment is genuinely difficult.
- Luna Max does the default bounded implementation work.
- Terra High handles exploration and lighter support tasks.

I started this setup with Sol High. Once the roles settled, I dropped the coordinator to Medium and kept High as an escalation lane. The division of labour helps, but the honest reason Luna gets most of the work is price. I want Sol's expensive attention on ambiguity and decisions, not on every test fix. This is my own routing convention, tested on `codex-cli 0.146.0`.

## The division of labour

Sol stays in the main thread. It works out what I meant, where the dangerous decisions are, what can be split, and whether the pieces fit when they come back. If my prompt is fuzzy, Sol is the one I want noticing that before somebody edits twelve files.

Luna Max gets the bounded work packet: one feature in known files, a failing test, a focused refactor, or a specific review. I give it a destination, a fence, and a finish line. It writes the code, runs the checks, and comes back with evidence.

Terra High handles the mess before I have a clean task. It scans repositories, documentation, logs, and dependency trees, then gives Sol a useful summary. Once the work is bounded, Luna takes it. Sol decides what gets accepted.

## Why Luna became my default: the cost curve

The pricing change made this much easier to justify. On July 30, OpenAI cut the API prices for Luna and Terra. [Luna dropped by 80% and Terra by 20%](https://openai.com/index/advancing-the-price-performance-frontier-with-gpt-5-6/). Sol did not get a cut.

| Model | Input / 1M tokens | Output / 1M tokens | Change |
|---|---:|---:|---:|
| GPT-5.6 Luna | $0.20 | $1.20 | 80% lower |
| GPT-5.6 Terra | $2.00 | $12.00 | 20% lower |
| GPT-5.6 Sol | Unchanged | Unchanged | No cut |

Max is a reasoning setting rather than a separate price tier. Luna keeps the same per-token price, although it can spend more tokens and time thinking. ChatGPT and Codex subscription prices and headline quotas did not change; Luna and Terra simply consume fewer credits on eligible plans. Most of my worker jobs can run in the background. I can wait.

This is the chart that made the split click for me, although it needs a large asterisk:

{% remote_image_cc "https://cdn.sanity.io/images/6vfeftx9/articles/5b9d20f2489ad000ea4135f99f08feb6fd4ff33a-4640x2656.png?w=1200&auto=format", "Scatter plot of Artificial Analysis Intelligence Index scores against estimated cost per task for GPT-5.6 Sol, Terra, and Luna reasoning levels", "w-full", "Artificial Analysis' launch-era comparison. Its July 9 pricing predates OpenAI's July 30 Luna and Terra cuts." %}

Source: [Artificial Analysis, GPT-5.6 benchmarks across intelligence, speed, and cost](https://artificialanalysis.ai/articles/gpt-5-6-has-landed/).

Artificial Analysis scored Luna Max at 51 and estimated about $0.21 per Intelligence Index task. Sol Low scored 49 at about $0.20, while Sol Max reached 59 at about $1.04.

Read the chart literally and Luna Max is slightly smarter than Sol Low here for roughly the same task cost. It is not dramatically cheaper. The interesting bit happened after the chart was made: that Luna point still uses the old $1/$6 per-million-token rates. The July 30 cut to $0.20/$1.20 is not plotted. Keep the token use unchanged and Luna moves sharply left.

One synthetic index cannot tell me exactly what a migration, a flaky test, or a badly documented repository will cost. I care about the shape of the curve: Luna is capable and now very cheap when I can describe the work and verify the answer. Sol earns its premium when a bad assumption is the costly part.

Terra is the slightly awkward middle child. Artificial Analysis did not put it on the launch-era intelligence-versus-cost Pareto frontier. I still keep it because a benchmark does not have to read my logs, trace a dependency tree, and hand a useful summary back to Sol.

---

## Making Luna the default

The actual default is almost embarrassingly small. This is the relevant part of my `~/.codex/config.toml`:

```toml
model = "gpt-5.6-sol"
model_reasoning_effort = "medium"

[agents]
default_subagent_model = "gpt-5.6-luna"
default_subagent_reasoning_effort = "max"

[features]
default_mode_request_user_input = true
```

An untyped child now goes to Luna Max. An explicit worker still wins, so `agent_type = "terra_worker"` sends a repository scan to Terra instead. That is basically the whole routing trick.

The feature flag lets Codex ask me for an important choice in Default mode. My `0.146.0` build accepts it but labels it under development, so I will re-check it after updates.

I restart Codex after changing startup configuration or the model catalog. A fresh task is also important because an existing task can retain stale tool metadata. Config on disk is policy; the running child is the proof.

## The two custom workers

I keep one file per worker under `~/.codex/agents/`. I resisted putting my entire operating philosophy in them. Each file says who the worker is, what it may do, and where it must stop.

`luna-worker.toml` looks like this:

```toml
name = "luna_worker"
description = "High-effort worker for clear, bounded delegated tasks with a specific deliverable."
model = "gpt-5.6-luna"
model_reasoning_effort = "max"

developer_instructions = """
Work only on the delegated subtask and treat the parent agent's prompt as the scope boundary.
Do not expand into adjacent improvements or re-plan the parent task.
Inspect only the context needed, make the smallest authorized change, and validate the result with focused checks.
Preserve unrelated user changes. Do not commit, push, publish, contact external parties, or create other side effects unless the delegation explicitly authorizes them.
If required information or authority is missing, stop and report the precise blocker to the parent agent.
Return a concise summary of the outcome, evidence, files changed, validation performed, and any remaining uncertainty.
"""
```

`terra-worker.toml` is intentionally more read-heavy:

```toml
name = "terra_worker"
description = "Read-heavy explorer and lightweight implementation worker for scans, summaries, and small low-risk edits under Sol orchestration."
model = "gpt-5.6-terra"
model_reasoning_effort = "high"

developer_instructions = """
Act as a supporting worker for the Sol orchestrator. Work only on the delegated subtask and return control to Sol when it is complete or blocked.

Handle read-heavy exploration: scan large repositories, documentation, logs, dependency trees, and related evidence efficiently. Summarize findings clearly for both the user and Sol, cite concrete files, symbols, commands, or log evidence, and distinguish verified facts from inferences.

When explicitly asked to implement, handle only small, well-understood, low-risk code edits. Follow existing conventions, preserve unrelated user changes, keep the diff focused, and run targeted validation for the behavior changed.

Do not make deep architectural changes, broad refactors, major dependency or data migrations, public API redesigns, or other high-risk decisions. Identify those needs, explain the evidence and tradeoffs, and hand them back to Sol for orchestration.
"""
```

The names are mostly decoration. The useful part is the boundary: what the worker owns, what it must not decide, and what it has to bring back.

## Teaching Sol when to delegate

The worker files define behaviour. They do not teach the coordinator when to use that behaviour. I keep the routing policy in `AGENTS.md`, close to the repository where it applies:

```text
Use Sol for planning, orchestration, and reviews.

Use Luna for implementation and routine investigation. When spawning Luna with an
explicit model override, use model="gpt-5.6-luna" and fork_turns="none".

Run one luna_worker per independent, substantial subtask. Keep short jobs in the
main thread. Give every fresh-context worker a self-contained dispatch with scope,
acceptance criteria, verification, and expected output.

Parallelize read-only work. Give writing workers isolated worktrees or run them
sequentially. Check every result before combining it and re-dispatch failed work.

If only one requested worker runs, check agents.max_concurrent_threads_per_session.
```

The `fork_turns="none"` detail matters. A full-history child inherits the parent's model and effort; a fresh child can take the Luna override, but it cannot see the conversation that produced the task. That is why the dispatch must stand on its own.

[Eric Provencher's orchestration post](https://x.com/pvncher/status/2080707291603407077) and the [Codex subagent guide](https://learn.chatgpt.com/docs/agent-configuration/subagents) recommend the same basic split: the coordinator decomposes and accepts; workers get clear ownership. Subagent threads are already inspectable, although I sometimes use a separate top-level Luna task for persistent work I want sitting in the sidebar.

## Give workers an execution packet

"Use Luna to fix the customer stuff" is how I get a very impressive diff to a problem I did not have. This is the shorter packet I use instead:

```text
Objective:
[One concrete outcome.]
Owned paths:
- [Files the worker may inspect and edit.]
Do-not-touch:
- [Anything outside scope.]
Acceptance criteria:
- [Observable conditions that must be true when the work is complete.]
Verification:
- [Exact checks to run.]
Stop condition:
- [When the worker should report instead of improvising.]
Return:
- [Status, paths changed, checks run, and remaining uncertainty.]
```

The stop condition is the part I care about most. If Luna discovers that my request conflicts with a public contract, I do not want it choosing a winner. I want the conflict back in Sol's lap.

## Parallel work needs ownership

Agents have not discovered a magical cure for merge conflicts. Read-only scans can share a repository; writes get non-overlapping paths or separate Git worktrees. Before integrating anything, Sol reads the actual diff, checks the changed paths, and looks at the test output. "Tests pass" is evidence. It is not absolution.

---

## Verify the runtime, not just the task name

A task named `luna_implementation` proves only that I am good at naming things.

I learned that the annoying way. On `codex-cli 0.144.1`, I created a child with a Luna-looking task name. A child did run, so at first glance everything looked fine. The rollout told a different story: no agent role, still Sol High. Luna was just a name tag.

After updating to `0.146.0`, named `agent_type` selection appeared in my runtime. My Terra test recorded `agent_role = "terra_worker"`, `model = "gpt-5.6-terra"`, and `effort = "high"`. I used the same path for Luna Max while working on this draft.

When I verify routing, I inspect the session or rollout metadata for:

- `agent_role`;
- the actual `model`;
- the reasoning `effort`.

If the metadata still says Sol, Sol did the work. The prose can call itself Luna all day; I believe the rollout.

## The Luna v2 catalog workaround is disposable

One build-specific wrinkle made Luna look unsupported even though the worker file was correct. My stock `models_cache.json` marked Luna with `"multi_agent_version": "v1"`, while the generic Multi-Agent V2 filter exposed Sol and Terra. The workaround was to copy the stock catalog, change only Luna's marker to `"v2"`, and point the active config at the copy:

```toml
model_catalog_json = "/Users/you/.codex/models_catalog_luna_v2.json"
```

I validated both files and restarted Codex. Luna then appeared in the v2-filtered catalog.

I would not tell everybody to do this. The current official documentation explicitly lists `gpt-5.6-luna` for fast, narrowly scoped subagents and even uses it in custom-agent examples. More importantly, my named `luna_worker` already routed to Luna on `0.146.0` before I added the custom catalog. In my setup, the edit affects generic catalog filtering; it is not what makes the named worker definition valid.

The copy also goes stale. After the stock cache refreshed, my custom file differed from it in six scalar paths. Luna's marker was the one intentional change; the rest was catalog metadata and instruction drift. I now treat the file as a disposable compatibility snapshot: regenerate it from the latest stock catalog after a Codex update, or remove it when the installed build no longer needs it. Never edit the stock cache in place.
