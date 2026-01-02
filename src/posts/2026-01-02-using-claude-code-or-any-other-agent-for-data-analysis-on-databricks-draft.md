---
title: Using Claude Code (or any other agent) for data analysis on Databricks (draft)
description: Game-changing stuff
date: 2026-01-02T19:49:44.085Z
updated: 2026-01-02T19:49:44.089Z
tags:
  - Data
  - AI
---
TL;DR: Perform exploratory data analysis on Databricks by "volleying" with AI agents like Claude or Copilot—iterate quickly with SQL queries, and generate notebooks automatically.

The indeterministic nature of LLMs is great for looking at patterns within datasets and although it may lead to false smoking guns many times, there will be times where you'll find stuff that you didnt notice earlier. As such this is a great use case for performing EDA on datasets that you're new to, to ease into the data and how it looks. 

Databricks does provide a CLI, extensions, inbuilt agent (Genie) and MCP servers for a lot of possibilities of using AI with data. The inbuilt Genie is great for non-technical users answering questions without analysts but doesn't serve the purpose of advanced data analysis.

Using the latest and greatest AI agents like Claude Code can be of great use and it helps me day-to-day on running analysis that i would preferably be too lazy to do myselves (Who will do the PPT's man)

Therefore, i wrote this framework of sorts using AI of course (very broken, very demure) to use my copilot pro license to use Claude Sonnet models (the best imo) to connect to Databricks and run analysis and finally package it nicely into a notebook.

![](/img/thanos.png)

See [carteakey/claude-databricks-eda](https://github.com/carteakey/claude-databricks-eda) for the code and sample analysis.