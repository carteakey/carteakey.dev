---
title: "Skills Radar: Mapping Where I Stand in the Data Landscape"
description: "How I built an interactive radar chart to visualize my skills across different data roles — and what it revealed."
date: 2026-02-09
tags:
  - Data
  - Career
hidden: true
---

If you work in data, you've probably noticed that the lines between Data Analyst, Data Scientist, Data Engineer, and ML Engineer are blurrier than ever. Job postings mix and match responsibilities. Your day-to-day rarely fits neatly into one box. So I built a [skills radar](/skills/) to figure out where I actually stand.

## The Idea

I came across a radar chart that maps 13 core competency areas — things like Data Pipelines, Databases, Storytelling, Experimentation, ML Ops — and overlays typical profiles for each data role. The shape of each role is distinct. Data Engineers spike hard on the left (pipelines, databases, infrastructure). Data Analysts spike on the right (storytelling, visualization, business insights). Data Scientists cluster at the bottom (inference, experimentation, modeling). ML Engineers dominate the bottom-left (deployment, MLOps).

The question was: what does *my* shape look like?

## Building It

I used [Chart.js](https://www.chartjs.org/) to build an interactive radar chart on my site. Each of the 13 axes is rated on a 0-10 scale. I plotted four reference profiles for the main data roles, then overlaid my own self-assessment.

The implementation is straightforward — a single page with Chart.js loaded via CDN, inline data, and a custom legend that lets you toggle role overlays on and off. Dark mode support, responsive canvas, and a skill bars breakdown below the chart for a more granular view.

## What My Shape Revealed

My profile leans clearly toward the right side of the radar — **Storytelling (8), Data Visualization (8), Business Insights (9), Metrics & Reporting (9)**. This tracks with my actual work: presenting to executives, building dashboards, translating data into decisions.

But it doesn't stop there. My shape extends into the upper-left — **Data Pipelines (7), Databases (8), Automation & Scripting (8)**. Years of building ETL pipelines, writing PL/SQL, and automating reporting workflows with Python libraries show up here. I'm not a pure analyst — I can build the infrastructure too.

Where it drops off sharply: **Model Deployment (2) and ML Ops (1)**. And that's honest. I've trained models (Random Forests, LLM-augmented recommendations during my masters), but I've never deployed one to production at scale. That's ML Engineering territory, and I know my limits.

## The Takeaway

If I had to describe my profile in one line: **a data analyst with strong consulting and storytelling skills who can also build pipelines and do data science work, but isn't an ML engineer.**

The nice thing about visualizing this is that it removes the ambiguity. Instead of listing skills on a resume and hoping people understand the weighting, the radar chart tells the story instantly. You can see where I'm strong, where I'm growing, and where I'm deliberately *not* trying to be.

Check out the [interactive version](/skills/) — you can toggle the role overlays to see how my profile compares.

## How to Build Your Own

If you want to make one for your site:

1. Pick your axes — I used 13 competency areas from a popular data roles framework
2. Rate yourself honestly on a 0-10 scale
3. Research typical profiles for comparison roles (make them *polarized* — each role should spike in its core area)
4. Use Chart.js radar type — it's the easiest way to get an interactive spider chart with minimal code
5. Add toggleable overlays so viewers can compare

The whole thing is about 200 lines of HTML/JS and lives in a single `.njk` file on my Eleventy site. No build step, no dependencies beyond the Chart.js CDN.
