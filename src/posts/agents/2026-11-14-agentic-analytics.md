---
title: "Agentic Analytics: Running a Data Practice with AI Agents"
description: How a small analytics team runs on 72 agent skills, 6 scheduled agents and 20+ data jobs, and what it saves.
date: 2026-11-14
giscusTerm: "/blog/agents/agentic-analytics/"
# TODO before publishing: the thumbnail below is a blank transparent placeholder so the
# content check passes. Generate the real stamp with the sketches skill (Part A), keep
# the same filename, and update imageAlt to describe it.
image: /img/blog-sketches/unique/agentic-analytics-stamp-trim.png
imageAlt: Placeholder thumbnail, sketch not generated yet
authored_by: ai-assisted
tags:
  - Agents
  - Data
hidden: true
---

I'm a data analyst on a small team that covers more than its headcount can run by hand: recurring finance reporting plus company-wide analysis programs. So since early 2026 most of my build and analysis work has gone through AI coding agents: Claude Code, Claude desktop scheduled tasks and Copilot CLI, on top of Databricks, Python/SQL and Power BI.

Company, people, partner and product names are left out, and so are business figures. Repo and skill names are generalized.

## At a glance

| | |
|---|---|
| Agent skills | 72 reusable skills I wrote |
| Scheduled agents | 6 running unattended, and 2 earlier versions retired |
| Data jobs | 20+ Databricks jobs across 4 pipelines |
| Repositories | 20 that I authored or co-authored (12 active) |
| Commits | 2,801 in total. 63% carry an AI co-author tag |
| Agent sessions | 538 in 14 weeks (Aug–Nov 2026) |
| Dated analysis sessions | 7 in 2025, 392 in 2026 |
| Onboarding | A new analyst ran production data refreshes on day 4 |
| Estimated time saved | ~400–700 hours a year, about 20–35% of one analyst's year |

## Architecture

The agents sit between the sources and the outputs. The sources are the data warehouse, Excel and CSV drops (partner and CRM exports), chat, email and calendar transcripts, and the ticket tracker. The outputs are 20+ scheduled data jobs that write back to the warehouse, dashboards, decks and exec one-pagers, and meeting notes, tasks and tickets. A coding agent works inside each repo and builds the jobs and reports. Scheduled agents run from the desktop app and handle the notes and tickets. Both read from the same knowledge layer: the skills, a `CLAUDE.md` in every repo, and the definitions, facts and learnings files.

The design choices behind it:

- Skills live in one place. There's a single master copy of every skill in a toolkit repo. It's symlinked into each agent's skill folder and pushed to the desktop app. A weekly read-only agent reports any drift between copies.
- Each repo carries its own operating manual (`CLAUDE.md`, 90–390 lines). It covers who owns what, table catalogs, "never inline this" rules, notebooks that must change together, version-control recipes, and folders that must never be committed.
- Numbers travel with their definitions. Every analysis folder has a definitions file and a learnings file. A `facts.json` carries each figure into decks together with its definition and source query. Corrections are logged rather than overwritten.
- Scheduled agents default to read-only or draft. They never publish or push to git, and when they run unattended they write down the assumptions they made.

## Skill library

A skill is a Markdown runbook, sometimes with scripts, that an agent loads when a task matches. Mine fall into these groups:

{% wide %}
| Group | Skills | Examples | What it encodes |
|---|---|---|---|
| Data refresh runbooks | 11 | `refresh-<source>` (one per source), `load-csv` | Converting files, uploading, running jobs in order, validation gates, committing with a changelog. It stops and asks when an input looks wrong |
| Review and reconciliation | 8 | `review-<report>` (one per report), `pipeline-catchup` | Diffs against the previous version or the official source, with delta tables and a written verdict |
| Domain "intel" primers | 9 | `intel-<metric>` (one per metric) | Definitions, known traps and past corrections. Loaded before quoting a number so mistakes aren't repeated |
| Recurring reports | 7 | `weekly-reach-report`, `funnel-refresh` | End-to-end weekly or monthly report builds |
| Data platform | 8 | `databricks-eda`, `databricks-job`, `table-recover`, `cost-review` | Environment setup, query-cost rules, job creation and monitoring, recovering overwritten tables, a monthly cost loop |
| Communication and visuals | 9 | `exec-one-pager`, `issue-tree`, `chart-recipes` | House styles for exec reports, issue trees, decks and charts |
| Meetings and work management | 9 | `meeting-minutes`, `action-items`, `ticket-conventions` | Turning conversations into notes, tasks and tickets |
| Agent operations | 11 | `config-audit`, `skill-sync`, `usage-cost`, `security-audit` | Keeping the agent setup itself healthy, cheap and secure |
{% endwide %}

What makes them work:

- Guardrails sit inside the runbook. On a new analyst's first sell-out refresh, the skill noticed the latest week was still in progress: a handful of units against a normal week's volume. It offered the safe option, "drop the partial week, load through last Saturday (recommended)".
- Intel skills are institutional memory. Each records how a metric is built, which rows to trust, and which mistakes have been made before. That makes the agent, or a new person, safe to quote a number.
- Skills grow out of real work. When I've done a manual process twice, it becomes a skill. When a fix is found, it goes into the skill, not into a chat transcript.

## Scheduled agents

{% wide %}
| Agent | Schedule | What it does | Guardrails |
|---|---|---|---|
| Meeting minutes watcher | Weekly (Mon) | Turns transcripts from a drop folder and from calendar meetings into structured notes (attendees, decisions, actions), puts action items in the task tracker, and archives the raw transcript | Only my action items become tasks. 34 meetings processed so far |
| Action-item sync | Daily | Reads chat, email, notes-to-self and a rough-capture scratch file, then creates or updates tasks with project and source tags and clears the processed scratch lines | Never deletes completed tasks. ~200 tasks created in the first 11 weeks, most of them by this agent |
| Weekly ticket review | Weekly (Fri) | Reads open tickets and the week's evidence (tracker, mail, chat, git), then adds progress comments, fills missing fields, updates stale dependencies and suggests next sprint | Changes a status only when the evidence clearly supports it |
| Monthly business newsletter | Monthly (1st) | Drafts an edition (front page, scoreboard, topic pages, digest) from pipeline tables and analysis folders | Draft on disk only. No publishing, no git |
| Notes-vault lint | Weekly (Mon) | Health report and proposed rule changes for the whole notes vault | Read-only on content |
| Skill drift check | Weekly (Thu) | Compares the desktop copies of skills with the master set | Read-only both sides |
{% endwide %}

I've retired two: a wiki "active work" sync and a twice-daily chat scan. Both went when task tracking moved to a dedicated tool.

Under the agents sit 20+ Databricks jobs that don't need an agent at all: daily activations, weekly bookings, retention, active subscriptions, data-quality monitors, and a weekly publish of governed tables to Finance. A jobs registry says, for each job, "reach for this when you need…", and agents and people both use it to pick the right source.

## Conventions that make agents reliable

{% wide %}
| Convention | What it is | Why it matters for agents |
|---|---|---|
| Per-repo `CLAUDE.md` | Ownership split, table catalog, "never inline" rules, notebooks that change together, git conflict recipes, confidential-folder exclusion | The agent starts every session with the rules a senior teammate would tell you |
| Dated analysis folders + `INDEX.md` | `eda/YYYY-MM-DD-topic/` with a question, queries, outputs and a summary. 392 in 2026 | Every number has an auditable home, and old work is findable and reusable |
| [Volley workflow](/blog/agents/using-claude-code-or-any-other-agent-for-data-analysis-on-databricks-draft/) | The agent writes a query script, runs it, reads the output and iterates, under cost rules (no full-table counts before writes, query timeouts) | Fast iteration without runaway warehouse cost |
| Definitions first | `DEFINITIONS.md`, learnings files, `facts.json` for deck numbers, logged corrections | Stops metric drift between analyses and decks |
| Data-quality suite | 110 automated tests, runnable outside the platform, tagged by severity | Agents run it after every pipeline change |
| Registries and release notes | Jobs registry, report registry, stakeholder release notes (14 versions in one repo, 50+ in another), changelog | Stakeholders see what changed and why, and agents know which job to run |
| Notebook standards | A header comment on every notebook, cell-format rules, a lint skill | Prevents a class of deployment errors that agents otherwise repeat |
| Ticket conventions | Story template, points, estimates, an intake template for stakeholder requests | Agent-written tickets look the same as hand-written ones |
| Cross-repo consolidation | A skill scans every repo's conventions and proposes ones to promote to the global config (the DQ suite, the analysis index, the query-cost ban) | Good patterns spread across repos instead of staying in one |
| Cost and usage guardrails | A usage archive across 3 agents (57K events), spend in the status line, a hook that warns before an expensive cache re-warm, a monthly platform cost review with a savings ledger | AI and compute spend stay visible |
{% endwide %}

## Case study: a new analyst refreshing production data in week 1

Before, the finance pipeline lived in one person's head. Refreshes meant knowing which exports to pull, how to clean them, which notebooks to run in which order, and what "looks normal" means.

I turned each manual refresh into a runbook skill with validation gates and a final review step. The repo's `CLAUDE.md` holds the rules, and the jobs registry says which job answers which question.

The new analyst's first two weeks:

| Working day | What happened |
|---|---|
| 1 | Got repo access and started exploring. Asked if there were rules for changes made by agents; the answer was the repo's `CLAUDE.md` |
| 2 | Read the wiki pages and runbooks, and planned a first sample run |
| 4 | Ran three production refreshes (sell-out, sales, rebates) and pushed the changes. This is the run where the skill caught the partial week. Added a review skill as a step in their own process doc |
| 9 | Ran the sell-in refresh on two new source files |
| 10 | Ran the CRM refresh end to end (a 7-task job: load, marketing funds, rebates, three views, wide P&L) and committed it with a changelog entry |

My manager runs work this way too. Instead of queuing a refresh or a reconciliation for an analyst, it's "just git pull and point Claude to it", and my manager has started writing skills on the same pattern.

## Time saved (estimates)

No stopwatch data exists, so every figure here is an estimate, built as runs per year × (manual time − time with the agent). Run counts come from schedules, git history and trackers. Manual times are my own judgment of the task before automation.

{% wide %}
| Workflow | Runs / yr | Manual | With agent | Hours saved / yr | Basis for run count |
|---|---|---|---|---|---|
| Guided data refreshes (11 runbooks) | ~110 | 1.5–2.5 h | 15–30 min | 140–220 | Weekly sell-out; monthly sell-in, CRM and SKU syncs; quarterly expenses and pricebook; ad hoc loads |
| Reviews and reconciliations | ~70 | 2–3 h | 30–45 min | 90–170 | 36 versioned P&L reviews in 6 months, plus monthly rebate and retention reconciliations |
| Meeting notes + action items | ~300 | 15–20 min | 3–5 min review | 50–85 | ~6 transcribed meetings a week |
| Daily action-item capture | ~250 | 15–25 min | ~5 min review | 40–85 | Daily schedule |
| Weekly ticket hygiene | 50 | 60–90 min | ~15 min | 35–60 | Weekly schedule |
| Workspace hygiene (lint, drift, repo sweep, memory, config) | ~150 | 10–15 min | ~2 min | 20–30 | Weekly agents and on-demand skills |
| Stakeholder self-serve | ~24 | 1–2 h of analyst time | 0 | 25–50 | Refresh, review and primer skills that stakeholders run themselves |
| **Total** | | | | **~400–700 h** | About 10–17 working weeks; central estimate ~550 h |
{% endwide %}

Not in the total:

- Monthly newsletter draft: its first scheduled run is Dec 2026. Projected saving: 36–60 h/yr.
- Onboarding: a new analyst was productive on production refreshes on day 4, against an assumed 3–4 weeks of shadowing before. That's roughly 2–3 weeks of ramp saved per hire, plus most of the senior time spent shadowing.
- Throughput: dated analysis sessions went from 7 (2025) to 392 (2026). Commits went from ~15 a month before agents to ~300 a month from March 2026 (peak 497 in June), about 70% of them AI co-authored. That's more output, not hours saved, and commits are a rough proxy.

These ones are measured, from logs and release notes:

| Change | Before | After |
|---|---|---|
| Renewal-program dashboard pipeline runtime | ~30 min | ~3 min (−90%) |
| Trial-dashboard refresh group | 3.5 h | 1.2 h |
| Activations job compute per run | | −41% (task-seconds, 3 runs) |
| Over-scheduled dashboard refreshes | 168 a week | 5 a week |
| Platform spend on my workloads | | An estimated 35–43% cut (pending billing confirmation) |
| Quarterly P&L refresh, ticket open to close | 4 weeks (2025) | ~1 day (2026, larger scope). Ticket timestamps, not effort |

## Lessons

1. Write knowledge into skills, not chat. A fix that lives in a transcript is lost; a fix in a skill is reused by every agent and every new teammate.
2. Put guardrails where the judgment is. The most valuable lines in a runbook are the "stop and ask if…" checks. They're what let a day-4 analyst run production refreshes safely.
3. Unattended means read-only or draft. Scheduled agents report, draft and propose; a person publishes.
4. Definitions before numbers. Agents make it cheap to produce figures, so the bottleneck becomes whether two figures mean the same thing. Definitions files and facts files close that gap.
5. Measure the agents too. Usage archives, cost hooks and drift checks caught problems: a 2× cost overstatement and a 7× overcount in the usage dashboard itself, and an hourly dashboard schedule nobody needed.
6. Expect resurfacing bugs. With several people and agents editing the same notebooks, old fixes came back. The fix was a written version-control recipe and "change these together" lists, not more care.

## How I counted

- Git: author-filtered across all branches, merges excluded, Nov 2026 snapshot. Repos where I'm not an author are excluded. In shared repos only my commits are counted.
- AI co-authorship: counted by `Co-authored-by` trailers naming the agent. This understates AI involvement, since many agent-assisted commits carry no trailer.
- Agent sessions: taken from a local usage archive that covers Aug 10 – Nov 13, 2026 only. Earlier 2026 usage wasn't archived.
- Time saved: estimates only. No hours were tracked before or after automation.
