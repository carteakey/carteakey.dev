---
title: GPT‑OSS vs GPT‑5 on GPT‑5’s example prompts
description: A side‑by‑side benchmark on web dev tasks
date: 2025-10-04T00:00:00.000Z 
updated: 2025-10-04T00:00:00.000Z
tags:
  - LLMs
  - AI
# hidden: true
---

Just out of curiosity, I wanted to see how well GPT‑OSS (the 120B variant) performs on the same coding‑related prompts that GPT‑5 highlights in its [Demo](https://gpt5-coding-examples.vercel.app). 

Scope and ground rules:
- Same prompt text wherever possible (copied from GPT‑5’s examples).
- Zero-shot - What you see is what you get, no follow-up prompting or corrections.
- Unquantized 120B running on my measly RTX 4070. See my [previous post](https://carteakey.dev/optimizing%20gpt-oss-120b-local%20inference/) for details on how I got it running.


The tasks (all single‑file web apps):
1) Camping Gear Checklist 
2) Farewell Message Board 
3) Trivia Quiz 

## Camping Gear Checklist

Prompt:

```text
Create a single-page app in a single HTML file with the following requirements:
- Name: Camping Gear Checklist
- Goal: Track gear for camping trips.
- Features: Checklist items, weight calculator, save lists.
- The UI should be outdoor-themed.
```

<table>
  <thead><tr><th style="text-align:center">GPT‑5</th><th style="text-align:center">GPT‑OSS</th></tr></thead>
  <tbody>
    <tr>
  <td style="vertical-align:top"><img src="/posts/GPT-OSS-benchmarks/camping-gear-checklist%20-%20gpt-5.png" alt="Camping Gear Checklist - GPT‑5" style="max-width:100%;border:1px solid #ddd;border-radius:6px"></td>
  <td style="vertical-align:top"><img src="/posts/GPT-OSS-benchmarks/camping-gear-checklist%20-%20gpt-oss.png" alt="Camping Gear Checklist - GPT‑OSS" style="max-width:100%;border:1px solid #ddd;border-radius:6px"></td>
    </tr>
  </tbody>
</table>

- GPT‑OSS output (HTML): [camping-gear-checklist.html ](/posts/GPT-OSS-benchmarks/camping-gear-checklist.html)
- GPT‑OSS produced a working checklist, however GPT-5 blows it away in polish and UX.
- GPT-5 also includes a bunch of extra features. 

## Farewell Message Board

Prompt:

```text
Create a single-page app, in a single HTML file, for a farewell message board with a warm and fun feeling:
- Use the latest UI components to give the site a professional appearance.
- Display 10 pre-posted messages nicely as heartfelt cards, each with a meaningful picture.
- Include a "Write" button that allows users to add new messages.
- Add a pseudo login button at the top.
- Ensure UI design policies, such as button sizes, are consistent throughout.
```


<table>
  <thead><tr><th style="text-align:center">GPT‑5</th><th style="text-align:center">GPT‑OSS</th></tr></thead>
  <tbody>
    <tr>
  <td style="vertical-align:top"><img src="/posts/GPT-OSS-benchmarks/farewell-message-board-gpt-5.png" alt="Farewell Message Board - GPT‑5" style="max-width:100%;border:1px solid #ddd;border-radius:6px"></td>
  <td style="vertical-align:top"><img src="/posts/GPT-OSS-benchmarks/farewell-message-board-gpt-oss.png" alt="Farewell Message Board - GPT‑OSS" style="max-width:100%;border:1px solid #ddd;border-radius:6px"></td>
    </tr>
  </tbody>
</table>

- GPT‑OSS output (HTML): [farewell-message-board.html](/posts/GPT-OSS-benchmarks/farewell-message-board.html)
- GPT‑OSS used Bootstrap 5 for styling and yet again produced a functional app with modals and cards.
- GPT-5 has a distinct colorful style, which may or may not be to everyone’s taste, but it’s certainly more visually engaging.

## Trivia Quiz (U.S. basics)

Prompt:

```text
Create a single-page app in a single HTML file that hosts a themed trivia quiz.
- Inputs: question text, multiple-choice answers, correct answer.
- Show one question at a time with card-style layout, large readable text, and animated feedback (green check or red X).
- Include a progress bar at the top and final score display at the end.
- Create 10 built-in quiz and display them randomly; the quiz must be basic level for US citizens
```




<table>
  <thead><tr><th style="text-align:center">GPT‑5</th><th style="text-align:center">GPT‑OSS</th></tr></thead>
  <tbody>
    <tr>
  <td style="vertical-align:top"><img src="/posts/GPT-OSS-benchmarks/trivia-quiz-game-gpt-5.png" alt="Trivia Quiz - GPT‑5" style="max-width:100%;border:1px solid #ddd;border-radius:6px"></td>
  <td style="vertical-align:top"><img src="/posts/GPT-OSS-benchmarks/trivia-quiz-game-gpt-oss.png" alt="Trivia Quiz - GPT‑OSS" style="max-width:100%;border:1px solid #ddd;border-radius:6px"></td>
    </tr>
  </tbody>
</table>

- GPT‑OSS output (HTML): [trivia-quiz.html](/posts/GPT-OSS-benchmarks/trivia-quiz.html)
- Smooth animated feedback and a simple progress bar. The questions are randomized on load. Accessibility reads well.
- GPT‑OSS again produced a functional quiz with a progress bar and score display. The design is clean but less engaging than GPT-5’s version.

## Quick summary

- Single‑file web apps: GPT‑OSS outputs were at least on par functionally, but GPT-5’s styling and polish were consistently superior.

- GPT‑5’s outputs were consistently more visually appealing and polished, but some are too flashy for my taste.

- GPT‑OSS is impressive for an open‑source model, especially given it’s running on modest hardware. The results value functional correctness over aesthetics.

- These demos are clearly handpicked to show off GPT-5’s strengths in web development tasks so its not a fair fight.

However, it still lags behind GPT‑5 in terms of design finesse and user experience. Of course.