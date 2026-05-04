---
title: Wikibones, or How I Want My Agent-Maintained Wikis to Work
description: A small scaffold for local, Git-backed, LLM-maintained wikis
date: 2026-04-30
updated: 2026-05-04
authored_by: ai-assisted
tags:
  - AI
  - Agents
  - PKM
  - Homelab
hidden: true
draft: true
pinned: false
featured: false
---

I've been slowly converging on a pattern for personal wikis that is boring in exactly the way I want infrastructure to be boring.

Markdown files.
Git history.
A `raw/` folder for source material.
A `wiki/` folder for the cleaned-up pages.
An agent instruction file that tells Claude Code, Codex, or whatever agent I am using what the rules are.

That pattern is now a repo called [`wikibones`](https://github.com/carteakey/wikibones).[^demo]


The name is not subtle. It is the bones of a wiki. Not the app. Not the theme. Not the publishing platform. Just the structure and workflows I want every agent-maintained wiki to inherit.

## The problem

I do not want my notes trapped inside one app's worldview.

I like Obsidian. I like static sites. I like local tools. I like web UIs when they earn their keep. But the durable unit should be the Markdown file, not the {% define "viewer", "The app or static site layer that renders the underlying Markdown files." %}.

This matters more once {% sidenote "This is a factual aside, not a handwritten annotation: the sidenote API is meant for quiet contextual notes." %}agents are involved.{% endsidenote %}

If I hand a folder of notes to an LLM and say "clean this up," I do not want it inventing a new taxonomy every time. I want it to understand the job:

- raw source material is immutable
- wiki pages are synthesized, short, and linked
- every claim points back to a source
- every page is woven into the graph
- every ingest updates the index and log

That is the part I want pinned down.

The renderer can change later.

## What wikibones is

`wikibones` is a scaffold for LLM-maintained personal wikis, based on Andrej Karpathy's [`llm-wiki`](https://github.com/karpathy/llm-wiki) pattern.

The structure is intentionally small:

```text
my-wiki/
├── CLAUDE.md
├── AGENTS.md
├── MANIFEST.md
├── raw/
├── wiki/
│   ├── home.md
│   ├── index.md
│   └── log.md
└── .claude/
    └── skills/
```

`raw/` is where source material goes. Articles, notes, transcripts, exported Obsidian pages, documentation, screenshots, whatever. Agents can read from `raw/`, but they do not mutate it.

`wiki/` is where the maintained wiki lives. This is the part humans read.

`CLAUDE.md` is the schema and house style. `AGENTS.md` mirrors the important parts for non-Claude agents. `MANIFEST.md` tracks what has and has not been ingested.

The point is not to be clever. The point is to remove decisions from every future session.

## The homelab example

My homelab wiki is the closest real version of this pattern.

It has pages for machines, services, networking, BIOS incidents, local inference, Paperless, Immich, Tailscale, Cloudflare Tunnel, and the usual mess that accumulates when old laptops become servers.

Recently I added a `wiki/services/` folder where every running service gets a Markdown file with YAML frontmatter:

```yaml
---
title: Immich
type: service
status: running
service: Immich
machine: fx505
category: photos
tailscale_url: http://100.x.x.x:2283/photos
public_url:
health_check: false
username:
password:
docs:
github:
raw: raw/services/Immich.md
---
```

That is the kind of thing I want a personal wiki to be good at.

Essays are only part of it. Notes too. The useful bit is operational memory.

What is running? Where? Why? How do I log in? What machine owns it? What source note did this come from? What breaks if I move it?

This is where an LLM-maintained wiki starts to feel different from a normal note app. The agent helps with writing, sure, but the bigger win is the boring connective tissue I never want to maintain manually.

## The viewer problem

The awkward part of this whole setup is publishing.

Markdown and Git are great as a source of truth. They are not, by themselves, a nice reading experience.

There are a few options.

### Option 1: `serve.py`

The simplest option is now built into `wikibones`:

```bash
pip install -r requirements-viewer.txt
python serve.py
```

That starts a local wiki viewer at `http://localhost:7000`.

It is deliberately unambitious: a single Python file that renders the `wiki/` directory with wikilinks, images, SVG diagrams, frontmatter chips, search, and a sidebar. No database. No Node app. No framework ceremony.

You can also point it at another wiki:

```bash
python serve.py --wiki-path /path/to/wiki --port 8080
```

This is the right default for local reading and debugging. It keeps the system honest. If a wiki needs a 17-step publishing pipeline before it is readable, I will simply stop reading it.

### Option 2: Quartz

[Quartz](https://quartz.jzhao.xyz/) is probably the best fit when the wiki should become a real static site.

It understands the Obsidian-ish world: wikilinks, backlinks, graph view, Markdown-first authoring, frontmatter. That maps cleanly to how `wikibones` wants pages to be written.

The shape I like is:

```text
~/wikis/homelabbr/              # source wiki repo
~/services/homelabbr-quartz/    # Quartz app
```

Then symlink Quartz's `content/` directory to the wiki:

```bash
git clone https://github.com/jackyzha0/quartz.git ~/services/homelabbr-quartz
cd ~/services/homelabbr-quartz
npm i
npx quartz create
rm -rf content
ln -s ~/wikis/homelabbr/wiki content
npx quartz build --serve
```

Quartz should be tooling around the wiki, not the owner of the wiki. The source of truth stays in the `wikibones` repo.

### Option 3: MkDocs Material

[MkDocs Material](https://squidfunk.github.io/mkdocs-material/) is the boring professional docs choice.

If the wiki is really documentation, it may be the best choice. It has solid search, navigation, deployment docs, and enough users that most problems already have an answer somewhere.

The tradeoff is that the wiki has to become a little more docs-shaped. Wikilinks, backlinks, and graph-style browsing are not the native center of gravity. You can add plugins or conversion scripts, but that is already a sign that the tool wants a slightly different kind of content.

### Option 4: a real wiki app

There are also proper web apps:

- [Wiki.js](https://js.wiki/)
- [BookStack](https://www.bookstackapp.com/)
- [OtterWiki](https://otterwiki.com/)

These make sense when browser editing, users, permissions, and admin UI matter.

That is not my main use case.

My use case is agent-first, Git-backed, mostly local, and occasionally published. A full wiki app feels like a database-shaped answer to a file-shaped problem.

## Auth is not the wiki's job

This is the part I had to say out loud to myself: Quartz does not have auth because Quartz is not an app. It generates static files.

That is fine.

For a private wiki, auth belongs in the layer in front:

- Tailscale for private network access
- Tailscale Serve for exposing a local service to the tailnet
- Caddy basic auth if I want a password prompt
- Cloudflare Access if I am deliberately publishing something wider

For my homelab wiki, Tailscale is the correct default.

That wiki contains local URLs and credentials by design. It should not be on the public internet. If I want a public version, that should be a filtered export, not the live operational wiki.

## The sync model

The model I want is:

1. edit Markdown in the wiki repo
2. commit to Git
3. rebuild the viewer or static site
4. serve the output locally or on the tailnet

For Quartz, the automation can be as simple as:

```bash
cd ~/services/homelabbr-quartz
git -C ~/wikis/homelabbr pull --ff-only
npx quartz build
```

Then Caddy or Tailscale Serve exposes the generated `public/` directory.

For `serve.py`, there may not even be a build step. Point it at `wiki/` and it reads the files directly.

That difference matters.

`serve.py` is the "I want to read this now" option.
Quartz is the "I want this to feel like a real website" option.
MkDocs is the "I want this to behave like documentation" option.
Wiki.js and BookStack are the "I want a managed web app" option.

## What I want from wikibones

I want a wiki scaffold that is boring enough to survive tool churn.

If Claude Code is good this month and Codex is better next month, fine. The instructions are in the repo.

If Quartz is the viewer today and some better local Markdown browser appears tomorrow, fine. The content is just files.

If I want one wiki for homelab ops, one for LLM notes, one for health research, and one for reading notes, fine. Each gets a `CLAUDE.md` scope and the same ingest discipline.

The bet is simple:

The structure matters more than the app.

The app should be replaceable.

The wiki should not be.
