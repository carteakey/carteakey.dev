---
title: "From MarioBench to CRTBench: can a model make a game worth playing?"
description: "A Mario experiment grew into CRTBench: single-file retro games, blind duels, local quantized models, and the gap between working code and good game feel."
date: 2026-09-15
updated: 2026-09-18
authored_by: ai-assisted
draft: true
hidden: true
pinned: false
featured: false
tags:
  - AI
  - Self-Host
---

Ask a model to make a Mario clone and you get a surprisingly useful picture of how it builds software. Can it make something that runs? Do the mechanics connect? Does it finish the game it started? And does any of it actually *feel like Mario*?

It started as **MarioBench**, became **PlumberBench**, and has now grown into [**CRTBench**](https://github.com/carteakey/crtbench): an experiment in generated retro games across several genres. Mario was the starting point. The broader question is whether a model can connect code, controls, sound, and presentation into something worth playing.

The original prompt was almost offensively small:

> Write a complete, playable Super Mario clone in a single file. Include running, jumping physics, platforms, blocks, and enemies.

The results range from a basic platforming sketch to a pastel indie game to an elaborate arcade cabinet with three course definitions and a synthesizer. They're also a reminder that an impressive first screen can hide a lot of unfinished gameplay.

My current engineering winner is Astra High. The result I find particularly interesting under its generation constraints is Qwen3.8-Flash-Next, running quantized on my own machine. Those judgments can coexist.

## From a plumber to a retro arcade

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

{% image_cc "./src/static/img/mariobench/raycaster.png", "Repository preview of Operation Wolf3D, a first-person retro raycaster", "w-full rounded-lg border border-surface-border", "Raycaster track: Operation Wolf3D. Spatial geometry and combat introduce a different set of failure modes." %}

{% image_cc "./src/static/img/mariobench/maze.png", "Repository preview of Neon Phantom Maze, an arcade maze game", "w-full rounded-lg border border-surface-border", "Maze track: Neon Phantom Maze. Turning and enemy behavior matter as much as the opening screen." %}

{% image_cc "./src/static/img/mariobench/blocks.png", "Repository preview of Blockfall 1989, a falling-block puzzle game", "w-full rounded-lg border border-surface-border", "Falling-block track: Blockfall 1989. Rotation, placement, and clearing have to agree about the board." %}

[Browse the arcade](https://carteakey.github.io/crtbench/) or [inspect the games and metadata](https://github.com/carteakey/crtbench). I prefer linked playable artifacts here: readers can choose a game and focus its controls, while this post stays readable without several competing canvases and soundtracks.

## What the community examples add

The two r/LocalLLaMA threads capture why this experiment is appealing. [ChopSticksPlease reports a Qwen3.8-27B run](https://www.reddit.com/r/LocalLLaMA/comments/1wbchyj/qwen38_27b_made_mario_with_a_single_prompt_o/) using a Q4_K_XL quant on an RTX 3090, roughly 100k context, and Cline in Act mode. The post supplies a prompt, server settings, and a playable demo. [Zannix reports another Q4KM run](https://www.reddit.com/r/LocalLLaMA/comments/1w4821c/qwen_38_27b_q4km_oneshot_a_super_mario_clone/) using a 12 GB RTX 4070 Ti setup with llama.cpp RPC, 64k context, and a reported 117-minute generation.

“One shot” needs a precise definition, though. In the second thread, the author says the harness used file tools and that the model wrote JavaScript tests. One user prompt can still lead to multiple tool calls and internal revisions. That is useful evidence about a workflow, but it isn't automatically equivalent to one uninterrupted, tool-free model response.

CRTBench's [submission rules](https://github.com/carteakey/crtbench/blob/main/SUBMISSIONS.md) target the stricter version: one inference turn, no agentic tools, no human edits, and a self-contained artifact. The existing gallery still needs a provenance pass against that standard. My original Qwen and Gemini Full reviews below include startup repairs; some new entries link only to the subreddit homepage; and the ChopSticks entry's normalized quant and reasoning fields differ from the linked author's setup. I am treating those as unresolved records, not certified strict-track results. A schema or syntax validator cannot establish generation history.

The distinction I want to preserve is **raw one-turn output, single-prompt agent workflow, and repaired artifact**. All three can teach us something. They need separate labels and comparisons.

## The Mario experiment that started it

The rest of these initial observations concerns the original five surviving Mario implementations. I have not extended that engineering ranking to the newer maze, puzzle, or raycaster entries.

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

The original files and experiment notes live in my [qualms repository](https://github.com/carteakey/qualms); the expanded gallery now lives in [CRTBench](https://github.com/carteakey/crtbench). The paths above identify the local artifacts used for this review; they are not a claim that every artifact has already been pushed.

The repository also contains a more detailed prompt specifying collision behavior, camera rules, and other requirements. That is a separate test specification. I don't want to quietly apply its extra requirements to runs made with the minimal prompt.

## The visual spread

These are browser captures of the five surviving implementations, taken near the beginning of their opening stages. They show the presentation and surrounding interface; they aren't evidence that later mechanics work. The Qwen and Gemini Full captures use the startup-patched versions discussed below.

### Astra High

{% image_cc "./src/static/img/mariobench/astra-high.png", "Astra High Mario tribute with a cream interface, pastel hills, floating blocks, and a wide playfield", "w-full rounded-lg border border-surface-border", "Astra High: a polished, spacious modern platformer presentation." %}

### Astra Light / Super Meadow

{% image_cc "./src/static/img/mariobench/astra-light.png", "Super Meadow with a dark teal interface, soft green scenery, golden coins, and a wide playfield", "w-full rounded-lg border border-surface-border", "Astra Light: the clearest indie-game reinterpretation of the prompt." %}

### Gemini Full

{% image_cc "./src/static/img/mariobench/gemini-full.png", "Gemini Full's tall retro playfield with blue sky, pixel HUD, green hills, and a dark arcade frame", "w-full rounded-lg border border-surface-border", "Gemini Full: a much more literal retro visual vocabulary." %}

### Gemini Interactive

{% image_cc "./src/static/img/mariobench/gemini-interactive.png", "Gemini Interactive's compact Mario game with a blue sky, orange ground, question block, and keyboard instructions", "w-full rounded-lg border border-surface-border", "Gemini Interactive: a compact, restrained overworld slice." %}

### Qwen Gold

{% image_cc "./src/static/img/mariobench/qwen-gold.png", "Qwen Gold's Super Pixel Bros arcade cabinet with a colorful marquee, scanlines, control deck, and field manual", "w-full rounded-lg border border-surface-border", "Qwen Gold: the cabinet, typography, and scanlines do a lot of the atmospheric work." %}

## What was actually checked

The first impressions were followed by a source review, browser startup and rendering checks for the five surviving implementations, and targeted JavaScript simulation tests. The latter exercised movement timing, selected recovery paths, and finish-state transitions, with additional probes for the suspicious mechanics found in the source.

Those simulations used the implementations' existing functions in a Node VM with browser drawing and audio interfaces stubbed. Some tests placed the player directly at a checkpoint or flag. They establish whether those transitions work; they don't prove that a human can traverse every route to get there. Audio quality was not scored by that harness.

This is an initial inspection, not a complete playthrough of every level, a blind study, or a repeated-seed benchmark. The reviewer had already seen the model labels. Ignoring those labels while judging the artifacts is useful, but it isn't the same as blinding them.

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

The recorded setup used an RTX 4070 with 12 GB VRAM, 64 GB system RAM, and the AtomicChat `AD-4.27bpw-Q4_K_M-M64` quant with the large lookup table offloaded to SSD. The Gold run used a 64k context window. The [local inference setup](/blog/running-qwen3-8-flash-next-locally/) has the broader configuration history.

The run summary records roughly **59 minutes**, around **71 KB of HTML**, and a reported total of **60,221 tokens**. I haven't independently normalized token accounting across the different generation setups, so I wouldn't use that figure for a precise efficiency comparison yet.

After the small startup patch, it presents a cohesive arcade game with an ambitious amount of content and sound code. The later inspection found real failures. Both facts belong in the account.

The constraints don't make the bugs disappear. They do make the ambition and aesthetic coherence noteworthy. I can rank the current artifact below Astra on reliability and still find it an impressive thing to have generated locally.

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

## Post history

| Date | Note |
| --- | --- |
| 2026-09-18 | Expanded the draft around CRTBench, its four genre tracks, local blind-duel ratings, community examples, and provenance requirements. |
| 2026-09-16 | Added browser screenshots of all five surviving implementations. |
| 2026-09-15 | Initial draft covering five surviving artifacts, the implementation review, retro feel, and the local Qwen run. |
