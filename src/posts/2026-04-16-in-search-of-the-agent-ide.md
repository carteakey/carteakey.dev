---
title: "In Search of the Agent IDE"
description: A data analyst's mostly futile quest for the perfect workflow.
image: /img/blog-sketches/unique/agent-ide-stamp-trim.png
imageAlt: Transparent monochrome sketch of an AI coding workspace
date: 2026-04-16
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

Instead I spent three weeks bouncing between editors, terminal apps, desktop wrappers, and a Perplexity thread that slowly turned into me assembling an IDE out of separate tools like it was 2009 again.

---

## What I actually wanted

I'm a data analyst, not a software dev, so my ideal setup is slightly cursed from a normal IDE point of view.

I usually have multiple repos open at once. A pipeline in one place, a notebook or analysis repo in another, maybe a utility script somewhere else. There is always a terminal doing something stupid in the background. Usually `dbt run`, some Python, maybe a query I forgot I kicked off twenty minutes ago.

I also don't use AI here as fancy autocomplete. I want Claude to actually do work. Read files, edit code, run commands, help with Databricks, help with analysis. And because some of that touches real data, I want my own API key. That part is {% annotate "this kills a surprising number of products", "right" %}not negotiable{% endannotate %}.

That sounds pretty reasonable until you start looking for a tool that gives you all of it at once.

---

## The options I kept circling back to

The boring answer was always VS Code.

VS Code can do most of this. Files are there. Git is there. Extensions are there. Claude Code is there. If you open two or three windows and treat each one like a separate workspace, it works. Kind of.

That was one of the two setups I kept coming back to: plain VS Code, plus multiple Claude Code windows. No reinvention. No terminal-file-manager side quest. Just more windows than any person should have open.

The problem is that VS Code starts feeling weird once you spread your brain across multiple repos. It technically supports it. I just never feel like I'm fully "in" the setup. Three windows in and I start losing track of what lives where.

Then there was the other extreme: the tools built specifically for agents.

Some of them are clearly made for people running a small army of agents in parallel, each in its own worktree, each working a separate branch like a little software factory. I get the appeal. It makes sense. It is also not how I work.

I don't usually want ten isolated clones of the same repo. I want one place where I can see a few active things, move between them quickly, and keep context in my own head without inventing an operating system for myself.

Claude Code Desktop would have been the obvious answer if it supported API keys. It doesn't. That knocked it out immediately.

Cursor and Windsurf were fine, but for my workflows they felt a bit overdressed. Good tools. Just not the shape of tool I wanted.

Wave is the one I haven't really given a fair shot yet, so I don't want to fake certainty there. It stayed on my list, but not in a "this is what I'm using" way.

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

I basically have two answers now.

The first is the custom stack. That's the one I reach for when I want things arranged properly and don't mind that the whole setup is a little handmade.

The second is VS Code plus multiple Claude Code windows. That is still the easiest default. It works. It's boring. It gives me files, Git, an editor, and an escape hatch back to normal software when I get tired of pretending the terminal is enough.

That might be the real answer, honestly. The "agent IDE" I wanted does not fully exist yet, so I keep bouncing between a custom stack and the least annoying mainstream editor.

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

Until then, this is where I landed: either VS Code with a few Claude Code windows, or a custom Ghostty and CLI stack that no {% annotate "probably for the best", "left" %}sane product manager{% endannotate %} would ship as a single product.

---

*All tools tested on macOS. Ghostty, Yazi and lazygit are free and open-source. Claude Code CLI requires an Anthropic API key.*
