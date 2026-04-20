---
title: Using Claude Code (or any other agent) for data analysis on Databricks
description: A lazy person's guide to exploratory data analysis that actually produces something at the end
date: 2026-01-02T19:49:44.085Z
authored_by: ai-assisted
updated: 2026-02-25T00:00:00.000Z
giscusTerm: "/blog/using-claude-code-or-any-other-agent-for-data-analysis-on-databricks-draft/"
tags:
  - Data
  - AI
---
TL;DR: Perform exploratory data analysis on Databricks by "volleying" with AI agents like Claude or Copilot - iterate quickly with SQL queries, and generate notebooks automatically.

The indeterministic nature of LLMs is great for looking at patterns within datasets and although it may lead to false smoking guns many times, there will be times where you'll find stuff that you didn't notice earlier. As such this is a great use case for performing EDA on datasets that you're new to, to ease into the data and how it looks.

Databricks does provide a CLI, extensions, inbuilt agent (Genie) and MCP servers for a lot of possibilities of using AI with data. The inbuilt Genie is great for non-technical users answering questions without analysts but doesn't serve the purpose of advanced data analysis.

Using the latest and greatest AI agents like Claude Code can be of great use and it helps me day-to-day on running analysis that i would preferably be too lazy to do myselves (Who will do the PPT's man)

Therefore, i wrote this framework of sorts using AI of course (very broken, very demure) to use Claude Sonnet models (the best imo) to connect to Databricks and run analysis and finally package it nicely into a notebook.

![](/img/thanos.png)

## Getting started (skip if you have the attention span of a goldfish)

> *note: the bits below were written by claude sonnet 4.6, who - funnily enough - also built most of the framework it's describing. i was too lazy to explain my own methodology. very on brand.*

Clone the [repo](https://github.com/carteakey/claude-databricks-eda), copy `.env.template` to `.env`, fill in your Databricks credentials. Run `uv sync`. Run `databricks-eda-setup --test-connection`. If it prints ✅ you're in.

Under the hood it's a small Python package (`databricks_eda`) that handles auth and a read-only SQL safety net - it refuses anything that isn't a SELECT. No accidental `DROP TABLE` moments at 11pm.

## The volleying bit

The name is borrowed from tennis. You and the agent keep hitting the ball back.

You drop a `CLAUDE.md` in your project - the agent's job description. Not generic system stuff, actual context for *this* dataset. What schema to look at. Where to save code. It's the difference between "go analyse stuff" and actually briefing someone.

Then you say: **"volley on [dataset]."**

The agent queries Databricks, forms a view on what came back, and tells you what it found. You react - "go deeper on delays", "why are there nulls here?" - and it goes again. No upfront query plan. Just iteration. The agent saves each exploration as a numbered temp file as it goes, building a trail of the whole thought process, dead ends included.

This is where the indeterminism helps rather than hurts. The agent notices things you weren't specifically looking for. You're not writing queries with a hypothesis, you're poking at data and seeing what bites back.

## Punch it

When you've seen enough, you say **"punch it."** The agent looks back over everything - temp files, conversation, findings - and writes a proper `.ipynb` notebook. Code blocks followed by actual prose explaining what was found and why it matters. Not `# query 2` comments. Something a normal human can read without having been in the room.

That's the deliverable. Exploratory work that ends in an artifact you can share or re-run.

## This vs. just using an MCP server

MCP is faster for one-offs: "what tables are in this schema", "show me 10 rows." Claude calls the tool, you get your answer, nothing is saved. The volleying workflow leaves a notebook. So: MCP for "what's in this table", volleying for "i need to present findings by Friday."

## A real example (1.24 billion rows, because why not)

Pointed it at a public airline performance dataset - 1.24 billion flight records, 1987–2008, 29 carriers. First volley confirmed the shape of the data. By the fifth exchange the agent had surfaced that Southwest's best-in-class on-time rate was partly a route effect (short domestic hops where delays compound less), and that data completeness improved dramatically post-2000 - which actually matters if you're doing trend comparisons.

None of that was what I asked for. It just came out of the back-and-forth.

The whole thing became [a notebook](https://github.com/carteakey/claude-databricks-eda/tree/main/samples/airline-dataset-eda) - documented, reproducible, shareable. Not bad for an afternoon of lazy iteration.

---

See [carteakey/claude-databricks-eda](https://github.com/carteakey/claude-databricks-eda) for the code, the package, and the airline sample.
