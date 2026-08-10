---
title: "In Search of the Agent IDE for Data"
description: A data analyst's mostly futile quest for the perfect workflow.
image: /img/blog-sketches/unique/agent-ide-stamp-trim.png
imageAlt: Transparent monochrome sketch of an AI coding workspace
date: 2026-04-16
updated: 2026-08-09
authored_by: human
theme: editorial
sidebar:
  label: "SIDE NOTES"
  title: "On this piece"
  content: |
   A new post view, apparently blessed by the vibe-coding gods and stitched together from a long list of older ideas. First outing for this design.
tags:
  - AI
  - Agents
hidden: false
draft: false
pinned: false
featured: true
---

I thought this would take one evening.

Open repo on the left. Agent on the right. Git somewhere visible. My own API key. Done.

Instead I spent a week bouncing between editors, terminal apps, desktop wrappers, that slowly turned into me assembling an IDE out of separate tools like it was 2009 again.

---

## Update: 2026-08-09

I have a tier list now.

The custom Ghostty stack is still the best thing here, full stop. It is the only setup that gives me exactly the layout I want and lets me swap pieces without asking permission from a product team.

For a prebuilt tool, [Zed](https://zed.dev) is the best option right now. It is absurdly fast, the file tree and Git UI are good, and one focused agent chat per window keeps me from mixing projects together. Its [SSH remote-development path](https://zed.dev/docs/remote-development) is now good enough for the machines where the actual data lives.

[cmux](https://www.cmux.dev) is S tier too. It is terminal-first, like the custom setup, but turns the housekeeping into a native macOS app: vertical tabs, splits, notifications, and an embedded browser. I expected to dismiss it as another terminal wrapper. I was wrong.

The rest of the list is below. This is a ranking for my data-analysis workflow, not a universal leaderboard. If you live in a single repo and want inline completions, the order will look different.

---

## What I actually wanted

I'm a data analyst, not a software dev, so my ideal setup is slightly cursed from a normal IDE point of view.

I usually have multiple repos open at once. A pipeline in one place, a notebook or analysis repo in another, maybe a utility script somewhere else. There is always a terminal doing something stupid in the background. Usually databricks skills, some Python, maybe a query I forgot I kicked off twenty minutes ago.

I also don't use AI here as fancy autocomplete. I want Claude to actually do work. Read files, edit code, run commands, help with Databricks, help with analysis. And because some of that touches real data, I want a private API key (company's AWS bedrock). That part is {% annotate "this kills a surprising number of products", "right" %}not negotiable{% endannotate %}.

That sounds pretty reasonable until you start looking for a tool that gives you all of it at once.

---

## The tier list, as of today

{% wide %}
| Tier | Option | Verdict |
|------|--------|---------|
| **S+** | **Ghostty + Claude Code CLI + Yazi + lazygit** | Best overall. Fast, private, composable, and exactly as weird as I need it to be. |
| **S** | **Zed** | Best prebuilt option. Super fast, proper files and Git, one focused chat per window, and real SSH remote development. |
| **S** | **cmux** | The best terminal-first option. It keeps the CLI workflow but adds a very good native macOS shell around it. |
| **A** | **VS Code + Claude Code windows** | The dependable fallback: mature, extensible, and still the least surprising setup. |
| **A** | **Wave Terminal** | A strong panes-and-blocks workspace that is still finding its shape. |
| **B** | **Cursor / Windsurf** | Good integrated editors, but they feel overdressed for my analysis workflow. |
| **B** | **JetBrains Fleet** | A good workspace idea with a smaller ecosystem and more weight than I want. |
| **C** | **Superset** | Excellent if you want an agent factory. I want one workspace. |
| **C** | **Conductor** | Strong worktree and PR flow; the opposite of how I prefer to keep context. |
| **C** | **Warp** | A capable terminal, but heavy and too account-shaped for me. |
| **D** | **Claude Code Desktop** | Polished, but account-only. That removes it from my list immediately. |
{% endwide %}

### Pros and cons

{% wide %}
| Tool | Pros | Cons |
|------|------|------|
| **Ghostty stack** | Fast, open, private API key, any CLI agent, excellent tabs and splits, easy to tune | I have to assemble and maintain the whole thing; no single integrated UI |
| **Zed** | Very fast native editor, real file tree and Git UI, external agents, API-key support, SSH remote projects | The agent and project model is still moving; the ecosystem is smaller than VS Code |
| **cmux** | Native macOS app, vertical tabs, split panes, notifications, embedded browser, works with any terminal agent | Still terminal-centric; I need Yazi or an editor for a proper file view; macOS only |
| **VS Code** | Mature extensions, files, Git, notebooks, and Remote-SSH | Heavy once several windows and projects are open; context gets scattered |
| **Wave Terminal** | Good panes and blocks, file previews, built-in editing, and a useful terminal workspace | Still feels like a product I am evaluating rather than the place I want to live |
| **Cursor / Windsurf** | Integrated editor and agent, good file and Git experience, easy to start | Less natural when I want to bring my own data path and compose the workflow myself |
| **Superset / Conductor** | Parallel agents, worktrees, review and merge flows | Too much isolation and orchestration for one analyst moving between a few repos |
| **Claude Code Desktop** | Clean review flow and automatic worktrees | No API-key workflow for the way I need to use Claude |
{% endwide %}

---

## The options I kept circling back to

Every tool in the table either made the list from my own use or came up in research when I was trying to escape whatever I'd just tried.

{% wide %}
| Tier | Tool | Prebuilt | Own API Key | Multi Sessions | File Browser | Git UI | Worktrees? | SSH support | Why I moved on |
|------|------|----------|-------------|----------------|--------------|--------|------------|-------------|----------------|
| **S+** | **Ghostty + CC CLI + Yazi + lazygit** | {% feather "x", class="table-icon table-icon-no" %} modular | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} tabs + tmux | {% feather "check", class="table-icon table-icon-check" %} Yazi | {% feather "check", class="table-icon table-icon-check" %} lazygit | No | {% feather "check", class="table-icon table-icon-check" %} native terminal | Best overall. I assembled it myself. |
| **S** | **Zed** | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} one focused chat/window | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | No | {% feather "check", class="table-icon table-icon-check" %} Remote Development | Best prebuilt option; the agent/project model is still evolving. |
| **S** | **cmux** | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} via CLI agents | {% feather "check", class="table-icon table-icon-check" %} tabs + panes | {% feather "alert-triangle", class="table-icon table-icon-warn" %} terminal/Yazi | {% feather "alert-triangle", class="table-icon table-icon-warn" %} terminal/lazygit | Optional | {% feather "check", class="table-icon table-icon-check" %} terminal | S-tier terminal-first option; needs a separate file/editor layer. |
| **A** | **VS Code** | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} via extensions | {% feather "alert-triangle", class="table-icon table-icon-warn" %} multi-root is clunky | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | No | {% feather "check", class="table-icon table-icon-check" %} Remote-SSH | Too much window switching. Three workspaces and nothing is where I left it. |
| **A** | **Wave Terminal** | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} native | {% feather "check", class="table-icon table-icon-check" %} panes + blocks | {% feather "check", class="table-icon table-icon-check" %} preview + edit | {% feather "alert-triangle", class="table-icon table-icon-warn" %} add lazygit | No | {% feather "check", class="table-icon table-icon-check" %} terminal | Best panes-and-blocks alternative; still finding its shape. |
| **B** | **Cursor / Windsurf** | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | No | {% feather "alert-triangle", class="table-icon table-icon-warn" %} depends on editor | Good integrated editors, but overdressed for my workflow. |
| **B** | **JetBrains Fleet** | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | No | {% feather "check", class="table-icon table-icon-check" %} remote workspace | Good workspace concept; smaller ecosystem and heavier than I want. |
| **C** | **Superset** | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} via CC CLI | {% feather "check", class="table-icon table-icon-check" %} parallel agents | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} review/merge | Yes, core model | {% feather "alert-triangle", class="table-icon table-icon-warn" %} underlying CLI | Built for ten agents in parallel. I want one workspace. |
| **C** | **Conductor** | {% feather "check", class="table-icon table-icon-check" %} | {% feather "alert-triangle", class="table-icon table-icon-warn" %} limited | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} strong PR flow | Yes, very | {% feather "alert-triangle", class="table-icon table-icon-warn" %} underlying CLI | Same shape as Superset. Worktree-first, I'm worktree-last. |
| **C** | **Warp** | {% feather "check", class="table-icon table-icon-check" %} | {% feather "alert-triangle", class="table-icon table-icon-warn" %} some AI | {% feather "check", class="table-icon table-icon-check" %} blocks + panes | {% feather "alert-triangle", class="table-icon table-icon-warn" %} basic | {% feather "x", class="table-icon table-icon-no" %} terminal only | No | {% feather "check", class="table-icon table-icon-check" %} terminal | Heavy. Requires login. No thanks. |
| **D** | **Claude Code Desktop** | {% feather "check", class="table-icon table-icon-check" %} | {% feather "x", class="table-icon table-icon-no" %} account-only | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} | {% feather "check", class="table-icon table-icon-check" %} diff review | Yes, automatic | {% feather "x", class="table-icon table-icon-no" %} no remote workspace | No API-key support. Dead on arrival for me. |
{% endwide %}

The boring answer used to be VS Code.

VS Code can do most of this. Files are there. Git is there. Extensions are there. Claude Code is there. If you open two or three windows and treat each one like a separate workspace, it works. Kind of.

That was one of the two setups I kept coming back to: plain VS Code, plus multiple Claude Code windows. No reinvention. No terminal-file-manager side quest. Just more windows than any person should have open.

The problem is that VS Code starts feeling weird once you spread your brain across multiple repos. It technically supports it. I just never feel like I'm fully "in" the setup. Three windows in and I start losing track of what lives where.

Then there was the other extreme: the tools built specifically for agents.

Some of them are clearly made for people running a small army of agents in parallel, each in its own worktree, each working a separate branch like a little software factory. I get the appeal. It makes sense. It is also not how I work.

I don't usually want ten isolated clones of the same repo. I want one place where I can see a few active things, move between them quickly, and keep context in my own head without inventing an operating system for myself.

Claude Code Desktop would have been the obvious answer if it supported API keys. It doesn't. That knocked it out immediately.

Cursor and Windsurf were fine, but for my workflows they felt a bit overdressed. Good tools. Just not the shape of tool I wanted.

Wave is the one I haven't really given a fair shot yet, so I don't want to fake certainty there. It stayed on my list, but not in a "this is what I'm using" way.

Zed is what moved the prebuilt side of this list. It is the first editor I have tried that feels fast enough to disappear while still giving me the boring things I need: a proper file tree, Git, and a useful remote project over SSH. I use one focused chat per window on purpose. It keeps the agent, repo, and analysis in the same mental box.

cmux is S tier for a different reason. It does not pretend to be an IDE. It takes the terminal workflow and gives it vertical tabs, split panes, notifications, and a browser in a native macOS app. I still need Yazi or an editor for a real file view, but the shell around the agent is much better than I expected.

---

## The custom stack happened somewhat against my will

At some point during this search I had the very stupid realization that I was no longer looking for an IDE. I was building one.

That stack ended up being:

- Ghostty for terminal windows, tabs and splits
- Claude Code CLI for the actual agent
- Yazi for file browsing
- lazygit for Git

Put Yazi in one pane, Claude Code in another, lazygit in a tab, and suddenly the thing starts making sense.

Yazi is honestly excellent. Same with lazygit. Claude Code CLI, for all the chaos around agent tooling right now, is still the cleanest thing in the stack. Ghostty gives me the shell around it without feeling heavy.

The downside is obvious: I assembled it. I made the keybindings. I decided how the panes should behave. I had to want this badly enough to spend an afternoon becoming the product manager of my own terminal.

The upside is that every part is replaceable. If I get tired of Yazi, I can swap Yazi. If I want a different terminal, I can swap the terminal. The agent layer stays mine. The API key stays mine. Nothing is pretending to be more integrated than it really is.

---

## What I'm actually using

I basically have three answers now.

The custom stack remains the best overall. That's the one I reach for when I want things arranged properly and don't mind that the whole setup is a little handmade.

When I want something prebuilt, I open Zed. It is super fast, the files and Git are right there, and a single focused chat per window keeps me from mixing contexts. SSH support is the big change: I can use the same editor shape against a remote machine instead of rebuilding the whole setup in a terminal.

cmux is the terminal answer. It is close to my custom stack, but I do not have to handcraft every bit of the window management. It is also the one I would recommend to someone who wants the terminal workflow without immediately becoming the maintainer of their own tiny IDE.

VS Code plus multiple Claude Code windows is still the easiest fallback. It works. It is boring. Sometimes boring wins.

The "agent IDE" I wanted still does not fully exist, but Zed is now close enough that I can stop pretending all prebuilt tools are equally far away.

The API key part is still the main filter. I don't want the agent bundled into someone else's billing and someone else's data path. For normal coding maybe that's a convenience tradeoff. For analysis work, especially against real data, it stops being a convenience question very quickly.

---

## What I wanted, still

I still want one tool that gives me:

- proper multi-workspace support
- a real file tree
- a real Git panel
- Claude on my own API key
- no weird cloud dependency

That doesn't feel like a ridiculous ask. But here we are.

Until then, this is where I landed: the custom Ghostty stack when I want the best setup, Zed when I want a prebuilt editor, and cmux when I want the terminal version without all the assembly. VS Code is still waiting in the wings, being boring and useful.

---

## Changelog

| Date | Note |
| --- | --- |
| 2026-08-09 | Added the current tier list, pros/cons table, and SSH-support comparison. Updated the recommendation to Ghostty as the best overall setup, with Zed and cmux in S tier. |
| 2026-04-16 | Initial post. |

*All tools tested on macOS. Ghostty, Yazi and lazygit are free and open-source. Claude Code CLI requires an Anthropic API key.*
