---
title: "MarioBench: can a model write a Mario clone worth playing?"
description: "Five generated Mario clones, inspected line by line: which run, which finish, and why none of them feel like Mario."
image: /img/blog-sketches/unique/mariobench-initial-observations-stamp-trim.png
imageAlt: "Monochrome pencil sketch of a retro CRT television showing a pixel platformer runner, with a game controller and a cartridge in front"
date: 2026-09-15
updated: 2026-10-01
authored_by: ai-assisted
draft: true
hidden: true
pinned: false
featured: false
tags:
  - AI
  - Games
---

Ask a model to make a Mario clone and you get a surprisingly useful picture of how it builds software. Can it make something that runs? Do the mechanics connect? Does it finish the game it started? And does any of it actually *feel like Mario*?

It started as **MarioBench** and became **PlumberBench**. This post covers the five Mario implementations that survived. The wider retro-arcade benchmark it grew into is the follow-up: [CRTBench](/blog/crtbench-generated-retro-games/).

The original prompt was almost offensively small:

> Write a complete, playable Super Mario clone in a single file. Include running, jumping physics, platforms, blocks, and enemies.

The results range from a basic platforming sketch to a pastel indie game to an elaborate arcade cabinet with three course definitions and a synthesizer. They're also a reminder that an impressive first screen can hide a lot of unfinished gameplay.

My current engineering winner is Astra High. The result I find particularly interesting under its generation constraints is Qwen3.8-Flash-Next, running quantized on my own machine. Those judgments can coexist.

## Why this is a useful test

A platformer makes integration failures visible. A shell can have a velocity and still never move. A level can have a victory screen and no working transition to the next one. A character can jump beautifully on one monitor and run at the wrong speed on another.

The prompt is also small enough that the model has to choose a scope. How much does it attempt, and how much of that attempt actually works? A long feature list doesn't settle that question. Neither does a clean browser console.

There is a second test hiding inside the first: interpretation. “Super Mario” carries expectations about movement, pacing, level structure, sound, and visual language. A competent modern platformer might satisfy the mechanics while missing the experience I had in mind.

That is what makes this more interesting to me than another screenshot-only coding comparison.

## The initial field

These are the labels used in my experiment notes. This is a comparison of particular outputs and generation setups, not a general leaderboard of model capability.

{% wide %}
| Run | What it attempted | What survives for inspection |
| --- | --- | --- |
| GPT-6 Astra, High | Three-stage platformer with checkpoints, power-ups, shells, and moving platforms | `runs/astra_HIGH/mario.html` |
| GPT-6 Astra, Light | “Super Meadow,” a smaller modern platform adventure | `runs/astra_light/mario.html` |
| Gemini 3.8 Flash, Full Effort | A retro World 1-1 interpretation with power-ups, Koopas, skidding, crouching, and synthesized audio | `runs/subagent_pro/mario.html`, after a startup fix |
| Gemini 3.8 Flash, Interactive | A narrower overworld slice with basic enemies and sound effects | `runs/paul_allen/mario.html` |
| Qwen3.8-Flash-Next, Gold | Arcade presentation, three course definitions, power-ups, enemies, fireballs, and music | `runs/mario_gold/mario.html` plus the preserved raw HTML |
| Gemini 2.5 Pro, Standard | An earlier minimal platforming baseline | Overwritten by the later Gemini run; excluded from the current ranking |
{% endwide %}

The original files and experiment notes live in my [qualms repository](https://github.com/carteakey/qualms); the expanded gallery now lives in [CRTBench](https://github.com/carteakey/crtbench).

The repository also contains a more detailed prompt specifying collision behavior, camera rules, and other requirements. That is a separate test specification. I don't want to quietly apply its extra requirements to runs made with the minimal prompt.

## The visual spread

These are browser captures of the five surviving implementations, taken near the beginning of their opening stages. They show the presentation and surrounding interface; they aren't evidence that later mechanics work. The Qwen and Gemini Full captures use the startup-patched versions discussed below.

{% gallery [
  { src: "./src/static/img/mariobench/astra-high.png", alt: "Astra High Mario tribute with a cream interface, pastel hills, floating blocks, and a wide playfield", caption: "Astra High: a polished, spacious modern platformer presentation." },
  { src: "./src/static/img/mariobench/astra-light.png", alt: "Super Meadow with a dark teal interface, soft green scenery, golden coins, and a wide playfield", caption: "Astra Light: the clearest indie-game reinterpretation of the prompt." },
  { src: "./src/static/img/mariobench/gemini-full.png", alt: "Gemini Full's tall retro playfield with blue sky, pixel HUD, green hills, and a dark arcade frame", caption: "Gemini Full: a much more literal retro visual vocabulary." },
  { src: "./src/static/img/mariobench/gemini-interactive.png", alt: "Gemini Interactive's compact Mario game with a blue sky, orange ground, question block, and keyboard instructions", caption: "Gemini Interactive: a compact, restrained overworld slice." },
  { src: "./src/static/img/mariobench/qwen-gold.png", alt: "Qwen Gold's Super Pixel Bros arcade cabinet with a colorful marquee, scanlines, control deck, and field manual", caption: "Qwen Gold: the cabinet, typography, and scanlines do a lot of the atmospheric work." }
] %}

## What was actually checked

The first impressions were followed by a source review, browser startup and rendering checks for the five surviving implementations, and targeted JavaScript simulation tests. The latter exercised movement timing, selected recovery paths, and finish-state transitions, with additional probes for the suspicious mechanics found in the source.

{% callout "note", "Method and limits" %}
Those simulations used the implementations' existing functions in a Node VM with browser drawing and audio interfaces stubbed. Some tests placed the player directly at a checkpoint or flag. They establish whether those transitions work; they don't prove that a human can traverse every route to get there. Audio quality was not scored by that harness.

This is an initial inspection, not a complete playthrough of every level, a blind study, or a repeated-seed benchmark. The reviewer had already seen the model labels. Ignoring those labels while judging the artifacts is useful, but it isn't the same as blinding them.
{% endcallout %}

I am also separating the raw outputs from repaired versions. Qwen's raw HTML has a duplicate `R` declaration that prevents startup. Renaming the UI binding makes it launch. The Gemini Full artifact includes a level-map initialization repair. A patched game is worth reviewing, but a successful launch after a patch shouldn't become “the original output had no bugs.”

## The engineering order, for now

Prioritizing working mechanics and a reliable play, recover, and finish loop, this is the current order:

1. **Astra High.** The strongest integration in the inspected set. Its tested jump and landing behavior, checkpoint recovery, shell movement, and transitions through all three stages worked. Its fixed 120 Hz simulation also avoids tying game speed directly to display refresh. There is substantial shared layout between stages, so “three worlds” deserves some qualification.
2. **Astra Light.** A coherent smaller game. The tested checkpoint and finish paths worked, and its fixed-step loop is a sound foundation. It has less mechanical variety, but its smaller scope fits together well.
3. **Gemini Full.** A substantial retro interpretation whose movement has important implementation problems. The stage-clear transition worked in the targeted test, but crouching and refresh-rate dependence weaken the claim that it has the best mechanics.
4. **Gemini Interactive.** A reasonable initial slice with a serious recovery flaw: respawn and restart preserve the advanced camera while putting the player back at the beginning.
5. **Qwen Gold, patched.** The most consequential gap between the breadth of the feature list and the behavior of the inspected implementation. Several core systems exist in code but aren't connected correctly.

The bottom two are close enough that their order depends on how heavily recovery failure is weighted against broken mechanics and progression. I wouldn't put decimal scores on this yet. And “fewest demonstrated defects” is a more defensible description of Astra than “bug-free.”

### The bugs that changed the first impression

Qwen's course completion sets the state to `clear`, but its Start handler waits for `levelclear`. The finish sequence runs, the time bonus counts down, and Start leaves the game on the same screen. It defines three distinct courses; normal progression cannot reach the later two in the inspected version.

The shell issue is similarly revealing. Stomping a Koopa changes its type to `shell`, but the main update dispatcher only sends Goombas and Koopas to the walker update. In the test, the kicked shell had a velocity of `3.7` and moved **zero pixels over 30 updates**. The fireball cooldown is set to `14` and never decremented, so one shot succeeds and subsequent shots remain blocked. Enemy wall collisions zero horizontal velocity before the reversal code tries to negate it.

Gemini Full's crouch changes the hitbox height without keeping the feet anchored. On flat ground, holding Down produced heights of `18, 30, 18, 30…`, alternating between airborne and grounded states. A plausible mechanic on the feature list becomes an unstable interaction when exercised.

Both Gemini implementations also advance physics once per animation callback. In the same nominal half-second input test, Full moved approximately **52 pixels at 60 callbacks per second versus 118 at 120**; Interactive moved approximately **49 versus 115**. Those figures include acceleration and startup-frame effects, so they aren't an exact speed multiplier. They do expose dependence on callback frequency. The Astra implementations and Qwen use fixed simulation steps.

For Gemini Interactive, the recovery test was particularly simple: with the camera at `700`, death returned the player to `40` and left the camera at `700`. Full restart did the same. The player was alive, but off-screen.

These are the sorts of failures MarioBench should catch. “It runs” is the beginning of the review.

## But Astra doesn't really feel like Mario

This is where I disagree with using the engineering ranking as the whole verdict.

Astra's output feels closer to a modern indie or Flash-era platformer tribute: warm palettes, smooth motion, a forgiving rhythm, and a more relaxed atmosphere. Those can be good design choices. They aren't necessarily the choices I associate with *Super Mario Bros. (1985)*.

Qwen and Gemini Full lean much harder into the retro identity. The small tile grids, pixel presentation, synthesized sound, and arcade framing make their intent immediately recognizable. Qwen's cabinet has good vibes. That matters when the task is to recreate an experience rather than merely implement a category of software.

Still, **retro atmosphere and mechanical fidelity deserve separate judgments**. A square-wave soundtrack doesn't establish that the music reproduces the original score. Scanlines don't establish accurate jump physics. For the record, Qwen's scanlines are a CSS overlay, not the canvas shader pass described in the initial notes. I also found no functional pipe-warp path in that version.

The useful question is how much of the remembered experience each game captures. The atmosphere can be convincing even when the mechanics have bugs. The mechanics can be well engineered even when the atmosphere points somewhere else.

Astra currently wins my engineering review. It does not automatically win my Mario interpretation.

## Qwen's local run deserves its own context

Qwen wasn't a hosted model iterating through an agent repair loop. This particular Gold artifact came from **one generation pass on my machine**, using a quantized model. Other Qwen experiments exist in the run history; “one pass” describes this artifact, not an absence of earlier experiments with the model.

The recorded setup used an RTX 4070 with 12 GB VRAM, 64 GB system RAM, and the AtomicChat `AD-4.27bpw-Q4_K_M-M64` quant with the large lookup table offloaded to SSD. The Gold run used a 64k context window. The [local inference setup](/blog/local-inference/running-qwen3-8-flash-next-locally/) has the broader configuration history.

The run summary records roughly **59 minutes**, around **71 KB of HTML**, and a reported total of **60,221 tokens**. I haven't independently normalized token accounting across the different generation setups, so I wouldn't use that figure for a precise efficiency comparison yet.

After the small startup patch, it presents a cohesive arcade game with an ambitious amount of content and sound code. The later inspection found real failures. Both facts belong in the account.

The constraints don't make the bugs disappear. They do make the ambition and aesthetic coherence noteworthy. I can rank the current artifact below Astra on reliability and still find it an impressive thing to have generated locally.

## What comes next

Mario was one genre. The same question, whether a model can connect code, controls, sound, and presentation into something worth playing, now runs across platformers, raycasters, mazes, and falling-block games. That is [CRTBench](/blog/crtbench-generated-retro-games/).

## Changelog

| Date | Note |
| --- | --- |
| 2026-10-01 | Split the CRTBench material (four genre tracks, Blind Vibe Arena, community examples) into its own post. This one is now only the Mario review. |
| 2026-09-18 | Expanded the draft around CRTBench, its four genre tracks, local blind-duel ratings, community examples, and provenance requirements. |
| 2026-09-16 | Added browser screenshots of all five surviving implementations. |
| 2026-09-15 | Initial draft covering five surviving artifacts, the implementation review, retro feel, and the local Qwen run. |
