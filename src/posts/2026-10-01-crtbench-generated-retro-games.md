---
title: "CRTBench: a retro arcade of generated games"
description: "MarioBench grew into CRTBench: single-file retro games across four genres, blind duels, local quantized models, and what counts as one-shot."
image: /img/blog-sketches/unique/crtbench-generated-retro-games-stamp-trim.png
imageAlt: "Monochrome pencil sketch of an arcade cabinet with a CRT screen showing falling blocks, a joystick, and a stack of cartridges"
date: 2026-10-01
authored_by: ai-assisted
draft: true
hidden: true
pinned: false
featured: false
tags:
  - AI
  - Games
---

[MarioBench](/blog/mariobench-initial-observations/) started with one prompt: write a complete, playable Super Mario clone in a single file. It has since grown into [**CRTBench**](https://github.com/carteakey/crtbench): an experiment in generated retro games across several genres. Mario was the starting point. The broader question is whether a model can connect code, controls, sound, and presentation into something worth playing.

## Four genres, fourteen games

The [current repository](https://github.com/carteakey/crtbench/tree/c4d20a9) contains 16 recorded entries, with **14 active browser games across four tracks** and two archived entries. That is the snapshot reviewed on September 18, 2026, not a claim to cover every retro genre yet.

{% wide %}
| Track | Active entries | What makes it an interesting test |
| --- | ---: | --- |
| 2D platformers | 8 | Momentum, jump timing, collisions, camera movement, death, and progression |
| 2.5D raycasters | 2 | Spatial projection, wall collision, sprite occlusion, navigation, and combat feedback |
| Arcade mazes | 2 | Grid movement, buffered turns, enemy states, collectible logic, and readable threats |
| Falling blocks | 2 | Rotation, placement, clearing, scoring, increasing speed, and restart behavior |
{% endwide %}

This is a useful expansion because each genre puts pressure on different parts of an implementation. A good jump arc says little about whether a raycaster sorts enemies behind walls correctly. A convincing maze screenshot doesn't tell me whether a turn registers at an intersection. A falling-block game has to keep its board consistent through rotations and line clears.

The gallery lets visitors play the artifacts, inspect their recorded prompts and setups, and compare pairs in a **Blind Vibe Arena**. Matchmaking pairs games within the same genre. The surrounding arena hides model metadata until a vote, then reveals the contenders and adjusts their Elo ratings. There is also a submission form, a CLI submission helper, and a validator for metadata, file presence, selected external dependencies, and JavaScript syntax.

The current Elo system is a **personal browser-local ranking**: votes and rating changes live in `localStorage`. The checked-in active entries all start at 1200 with zero matches. This is not yet an aggregated community leaderboard, and the separate hand-entered vibe scores are not duel results. Hiding labels can reduce brand cues, but distinctive games or text inside them can still give identities away; I wouldn't describe this as a controlled double-blind study.

### Beyond Mario, in pictures

These three images come from the repository's preview gallery. They illustrate the expanded scope; they are not evidence of completed playthroughs or verified model provenance.

{% gallery [
  { src: "./src/static/img/mariobench/raycaster.png", alt: "Repository preview of Operation Wolf3D, a first-person retro raycaster", caption: "Raycaster track: Operation Wolf3D. Spatial geometry and combat introduce a different set of failure modes." },
  { src: "./src/static/img/mariobench/maze.png", alt: "Repository preview of Neon Phantom Maze, an arcade maze game", caption: "Maze track: Neon Phantom Maze. Turning and enemy behavior matter as much as the opening screen." },
  { src: "./src/static/img/mariobench/blocks.png", alt: "Repository preview of Blockfall 1989, a falling-block puzzle game", caption: "Falling-block track: Blockfall 1989. Rotation, placement, and clearing have to agree about the board." }
] %}

[Browse the arcade](https://carteakey.github.io/crtbench/) or [inspect the games and metadata](https://github.com/carteakey/crtbench). I prefer linked playable artifacts here: readers can choose a game and focus its controls, while this post stays readable without several competing canvases and soundtracks.

## What the community examples add

The two r/LocalLLaMA threads capture why this experiment is appealing. [ChopSticksPlease reports a Qwen3.8-27B run](https://www.reddit.com/r/LocalLLaMA/comments/1wbchyj/qwen38_27b_made_mario_with_a_single_prompt_o/) using a Q4_K_XL quant on an RTX 3090, roughly 100k context, and Cline in Act mode. The post supplies a prompt, server settings, and a playable demo. [Zannix reports another Q4KM run](https://www.reddit.com/r/LocalLLaMA/comments/1w4821c/qwen_38_27b_q4km_oneshot_a_super_mario_clone/) using a 12 GB RTX 4070 Ti setup with llama.cpp RPC, 64k context, and a reported 117-minute generation.

“One shot” needs a precise definition, though. In the second thread, the author says the harness used file tools and that the model wrote JavaScript tests. One user prompt can still lead to multiple tool calls and internal revisions. That is useful evidence about a workflow, but it isn't automatically equivalent to one uninterrupted, tool-free model response.

CRTBench's [submission rules](https://github.com/carteakey/crtbench/blob/main/SUBMISSIONS.md) target the stricter version: one inference turn, no agentic tools, no human edits, and a self-contained artifact.

{% callout "warning", "Provenance is still unresolved" %}
The existing gallery still needs a provenance pass against that standard. My original Qwen and Gemini Full reviews below include startup repairs; some new entries link only to the subreddit homepage; and the ChopSticks entry's normalized quant and reasoning fields differ from the linked author's setup. I am treating those as unresolved records, not certified strict-track results. A schema or syntax validator cannot establish generation history.
{% endcallout %}

The distinction I want to preserve is **raw one-turn output, single-prompt agent workflow, and repaired artifact**. All three can teach us something. They need separate labels and comparisons.

## What I want CRTBench to measure next

The next version needs a repeatable protocol and a profile of results, rather than one number that mixes everything together.

{% wide %}
| Dimension | What I want to measure |
| --- | --- |
| Raw output success | Does the untouched file parse, start, and respond to input? |
| Gameplay correctness | Do collisions, blocks, enemies, power-ups, death, restart, and completion work? |
| Timing and controls | Does speed remain consistent across refresh rates? Do jump release, input buffering, pause, and focus loss behave sensibly? |
| Reachable content | Can the player actually reach and complete the advertised stages and mechanics? |
| Reference fidelity | How do controls, pacing, sound, art, and genre-specific mechanics compare with the intended reference? |
| Generation constraints | What hardware, quantization, prompt, reasoning setting, elapsed time, and repair budget produced the artifact? |
{% endwide %}

I want repeated runs with the same prompt, preserved originals, and explicit repair logs. The minimal prompt and the detailed specification should have separate result sets. Every output needs a unique path; overwriting the Gemini baseline already cost this comparison a piece of evidence.

Each track needs its own input scripts and completion checks. Platformers need jump and recovery tests; raycasters need navigation and occlusion checks; mazes need turning and enemy-state checks; falling-block games need rotation and board-state checks. Actual playthroughs establish reachability and expose awkward design. Human duels address another part: whether the game feels good to play. Neither approach replaces the other.

That is the appeal of this benchmark for me. Within a few minutes of playing, a generated game starts revealing how well its author connected the pieces. Then, even after the pieces work, there's still the harder question of whether it made the right game.

## Changelog

| Date | Note |
| --- | --- |
| 2026-10-01 | Initial post, split out of the MarioBench draft. |
