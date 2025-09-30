---
title: GPT‑OSS vs GPT‑5 — Benchmarks on GPT‑5’s own coding prompts
description: A practical, side‑by‑side comparison of GPT‑OSS against GPT‑5 using the very prompts GPT‑5 ships in its DevHub. Includes prompts, outputs, links to runnable artifacts, and notes.
date: 2025-09-21T00:00:00.000Z
updated: 2025-09-21T00:00:00.000Z
tags:
  - LLMs
  - AI
hidden: true
---

This write‑up compares GPT‑OSS against GPT‑5 using the same lightweight “coding sample” prompts GPT‑5 showcases in its DevHub. I recreated each task locally, saved the generated artifacts to this repo, and captured screenshots for quick visual comparison.

Scope and ground rules:

- Same prompt text wherever possible (copied from GPT‑5’s examples).
- Minimal hand‑editing; only adjustments to make artifacts viewable locally (e.g., saving HTML to a file) or fixing obvious typos.
- Where available, I show screenshots for both models and link to the runnable outputs in this site.

The tasks:

1) Camping Gear Checklist (single‑file HTML app)
2) Farewell Message Board (single‑file HTML app)
3) Trivia Quiz (single‑file HTML app)
4) Bouncing Balls in a Spinning Heptagon (Python + Tkinter)

Supporting files live under `src/posts/gpt-oss-benchmarks/`.

## 1) Camping Gear Checklist

Prompt (excerpt):

```
Create a single-page app in a single HTML file with the following requirements:
- Name: Camping Gear Checklist
- Goal: Track gear for camping trips.
- Features: Checklist items, weight calculator, save lists.
- The UI should be outdoor-themed.
```

Files and screenshots:

- YAML prompt: `/posts/gpt-oss-benchmarks/camping-gear-checklist.yaml`
- GPT‑OSS output (HTML): `/posts/gpt-oss-benchmarks/camping-gear-checklist.html`
- GPT‑5 screenshot: `/posts/gpt-oss-benchmarks/camping-gear-checklist - gpt-5.png`
- GPT‑OSS screenshot: `/posts/gpt-oss-benchmarks/camping-gear-checklist - gpt-oss.png`

Visual comparison:

<table>
  <thead><tr><th style="text-align:center">GPT‑5</th><th style="text-align:center">GPT‑OSS</th></tr></thead>
  <tbody>
    <tr>
  <td style="vertical-align:top"><img src="/posts/gpt-oss-benchmarks/camping-gear-checklist%20-%20gpt-5.png" alt="Camping Gear Checklist - GPT‑5" style="max-width:100%;border:1px solid #ddd;border-radius:6px"></td>
  <td style="vertical-align:top"><img src="/posts/gpt-oss-benchmarks/camping-gear-checklist%20-%20gpt-oss.png" alt="Camping Gear Checklist - GPT‑OSS" style="max-width:100%;border:1px solid #ddd;border-radius:6px"></td>
    </tr>
  </tbody>
</table>

Notes:

- GPT‑OSS produced a more polished, modern UI with themed colors and controls, including list management and local save/load.
- Performance is instant on both, but GPT‑OSS included more UX niceties (weight totals, categories) out of the box.

## 2) Farewell Message Board

Prompt (excerpt):

```
Create a single-page app, in a single HTML file, for a farewell message board with a warm and fun feeling:
- Use the latest UI components to give the site a professional appearance.
- Display 10 pre-posted messages nicely as heartfelt cards, each with a meaningful picture.
- Include a "Write" button that allows users to add new messages.
- Add a pseudo login button at the top.
- Ensure UI design policies, such as button sizes, are consistent throughout.
```

Files:

- YAML prompt: `/posts/gpt-oss-benchmarks/farewell-message-board.yaml`
- GPT‑OSS output (HTML): `/posts/gpt-oss-benchmarks/farewell-message-board.html`
- GPT‑5 reference screenshot (remote): https://cdn.openai.com/devhub/gpt5prompts/farewell-message-board.png

Open the generated app: <a href="/posts/gpt-oss-benchmarks/farewell-message-board.html">/posts/gpt-oss-benchmarks/farewell-message-board.html</a>

Notes:

- GPT‑OSS used Bootstrap 5 and produced consistent, professional components with modals, cards, and a clear writing flow.
- Content safety and sanitization were considered (basic HTML escaping when creating new posts).

## 3) Trivia Quiz (U.S. basics)

Prompt (excerpt):

```
Create a single-page app in a single HTML file that hosts a themed trivia quiz.
- Inputs: question text, multiple-choice answers, correct answer.
- Show one question at a time with card-style layout, large readable text, and animated feedback (green check or red X).
- Include a progress bar at the top and final score display at the end.
- Create 10 built-in quiz and display them randomly; the quiz must be basic level for US citizens
```

Files:

- YAML prompt: `/posts/gpt-oss-benchmarks/trivia-quiz-game.yaml`
- GPT‑OSS output (HTML): `/posts/gpt-oss-benchmarks/trivia-quiz.html`

Visual (GPT‑OSS):

Open the generated app: <a href="/posts/gpt-oss-benchmarks/trivia-quiz.html">/posts/gpt-oss-benchmarks/trivia-quiz.html</a>

Notes:

- Smooth animated feedback and a simple progress bar. The questions are randomized on load. Accessibility reads well.

## 4) Physics demo: 20 balls in a spinning heptagon (Tkinter)

Prompt (summary): Build a small desktop physics simulation in standard Python (no external graphics libs) showing 20 numbered balls bouncing inside a rotating heptagon, with gravity and friction. Draw with Tkinter and implement collision response from scratch.

Files:

- `src/posts/gpt-oss-benchmarks/bouncing-balls.py` (baseline)
- `src/posts/gpt-oss-benchmarks/bouncing-balls-v2.py` (improved collision handling and spin)
- `/posts/gpt-oss-benchmarks/bouncing-balls.gif` (capture)

<p><img src="/posts/gpt-oss-benchmarks/bouncing-balls.gif" alt="Bouncing balls inside a spinning heptagon" style="max-width:100%;border:1px solid #ddd;border-radius:6px"></p>

Run locally (macOS):

```zsh
# requires Python with tkinter available
python3 src/posts/gpt-oss-benchmarks/bouncing-balls-v2.py
```

Notes:

- The v2 script adds impulse‑based ball‑ball and ball‑wall collisions with frictional spin transfer and basic positional correction to prevent overlap.
- Stable at ~60 FPS on a modest laptop; results are deterministic enough for visual comparison.

## Model context: parameters vs. “intelligence”

For broader context, here’s the “Intelligence vs. Active Parameters” chart that’s been going around. It’s a useful visual to think about trade‑offs when you can’t fully saturate a large model locally.

<p><img src="/posts/gpt-oss-benchmarks/most-attractive-quadrant.jpeg" alt="Intelligence vs Active Parameters" style="max-width:100%;border:1px solid #ddd;border-radius:6px"></p>

## Quick summary

- Single‑file web apps: GPT‑OSS outputs were at least on par visually and often nicer (more theming, better micro‑interactions) while staying self‑contained.
- Desktop physics demo: GPT‑OSS produced a tidy Tkinter simulation with proper collision math and a readable structure.
- The main difference I noticed wasn’t “can it do it?” (both can) but “how polished is the first attempt?” On these examples, GPT‑OSS tended to include finishing touches (icons, modals, structured prompts) without additional coaching.

## Try them yourself

- Camping Checklist: <a href="/posts/gpt-oss-benchmarks/camping-gear-checklist.html">/posts/gpt-oss-benchmarks/camping-gear-checklist.html</a>
- Farewell Board: <a href="/posts/gpt-oss-benchmarks/farewell-message-board.html">/posts/gpt-oss-benchmarks/farewell-message-board.html</a>
- Trivia Quiz: <a href="/posts/gpt-oss-benchmarks/trivia-quiz.html">/posts/gpt-oss-benchmarks/trivia-quiz.html</a>
- Physics (Python): run `bouncing-balls-v2.py` as shown above.
