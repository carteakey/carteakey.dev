---
title: Bouncing Balls in Spinning Heptagon
description: Complex physics simulation with collision detection and rotating boundaries
date: 2026-04-03
category: Coding
difficulty: Hard
tags:
  - physics
  - simulation
  - algorithms
authored_by: human
---

Write a Python program that shows 20 balls bouncing inside a spinning heptagon:

- All balls have the same radius.
- All balls have a number on it from 1 to 20.
- All balls drop from the heptagon center when starting.
- Colors are: #f8b862, #f6ad49, #f39800, #f08300, #ec6d51, #ee7948, #ed6d3d, #ec6800, #ec6800, #ee7800, #eb6238, #ea5506, #ea5506, #eb6101, #e49e61, #e45e32, #e17b34, #dd7a56, #db8449, #d66a35
- The balls should be affected by gravity and friction, and they must bounce off the rotating walls realistically. There should also be collisions between balls.
- The material of all the balls determines that their impact bounce height will not exceed the radius of the heptagon, but higher than ball radius.
- All balls rotate with friction, the numbers on the ball can be used to indicate the spin of the ball.
- The heptagon is spinning around its center, and the speed of spinning is 360 degrees per 5 seconds.
- The heptagon size should be large enough to contain all the balls.
- Do not use the pygame library; implement collision detection algorithms and collision response etc. by yourself. The following Python libraries are allowed: tkinter, math, numpy, dataclasses, typing, sys.
- All codes should be put in a single Python file.

{% image_cc "./src/static/img/bouncing-balls-gemma.gif", "Example output from Gemma 4 showing 20 numbered balls bouncing in a spinning heptagon", "rounded-lg border border-gray-200 dark:border-gray-700", "Gemma 4 26B-A4B output" %}

## Notes

This prompt tests complex physics simulation, coordinate transformations (rotating frames), polygon collision detection, and real-time rendering. Common failure modes include balls passing through walls, unstable physics, incorrect rotation, and poor collision response.
