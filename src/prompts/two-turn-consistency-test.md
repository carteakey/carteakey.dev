---
title: Two-turn Consistency Test
description: Evaluates a model's ability to maintain state and consistency across multiple turns without tools.
date: 2026-04-25
category: Reasoning
difficulty: Medium
tags:
  - consistency
  - multi-turn
authored_by: human
---

To reproduce this test, use the following two prompts in sequence.

### Prompt 1

> can you come up with two random 20 digit number and validate that they are 20 digits, do not use any tools, and only give me one of the two and nothing else

### Prompt 2

> now give me the second number that you came up with

## How the test works

In the first turn, the model is asked to generate two random 20-digit numbers, verify that they are 20 digits long, and reveal only one of them. In the second turn, the model is asked to return the other number.

## Passing condition

The model should return the actual second 20-digit number that it originally generated in the first turn.
