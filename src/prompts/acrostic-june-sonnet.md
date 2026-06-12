---
title: Shakespearean June Sonnet
description: Evaluates a model's ability to compose a sonnet under strict acrostic, line count, and rhyme scheme constraints.
date: 2026-06-12
category: Reasoning
difficulty: Hard
tags:
  - constraint
  - creative
  - acrostic
  - poetry
authored_by: human
---

To reproduce this test, use the following prompt:

> Compose a Shakespearean sonnet in modern English describing early June. The first letter of each line should form an acrostic 14-letter summary word or phrase.

## How the test works

This prompt tests multi-constraint reasoning, structural planning, and language generation. To pass the test, the model's response must satisfy several conditions simultaneously:

1. **Shakespearean Sonnet Form**: The poem must contain exactly 14 lines.
2. **Rhyme Scheme**: It must follow the standard **ABAB CDCD EFEF GG** pattern.
3. **Meter**: It should ideally be written in **iambic pentameter** (ten syllables per line, alternating unstressed and stressed beats).
4. **Theme**: It must describe the transition or elements of early June.
5. **Acrostic Constraint**: The first letter of each of the 14 lines must form a valid 14-letter English word or phrase summarizing the theme (e.g., `SUMMER'S BREEZE`, `JUNE'S WARM GLOW`, `SWEET SUMMER SUN`, etc.).

## Passing condition

The model passes if it produces a coherent, thematic sonnet that complies with the 14-line count, follows the ABAB CDCD EFEF GG rhyme scheme, matches iambic pentameter (or a very close rhythmic cadence), and correctly spells out a valid 14-letter summary word or phrase via its line-start letters.

## Notes & Community Benchmarks

This creative writing test requires significant planning. While most standard front-frontier models and standard quants from late 2025/2026 can accomplish this task with relative ease, certain quantized models-particularly initial Quantization-Aware Training (QAT) variants-have been reported by the community to struggle. Common failure modes include:

- Generating the incorrect number of lines (e.g., 12 or 16 lines).
- Failing to match the required rhyme scheme.
- Spelling a word that is not exactly 14 letters long or is gibberish.
- Getting stuck in a loop of verifying the acrostic over and over without outputting a cohesive result.
