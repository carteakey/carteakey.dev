---
title: "Unforwarder v2: Cleaning WhatsApp at the Source"
description: Pruning spam links, chain forwards, and chat clutter directly inside WhatsApp before saving media.
image: /img/blog-sketches/unique/unforwarder-v2-kill-the-noise-save-the-memories-stamp-trim.png
imageAlt: "Transparent monochrome sketch of a photo stream being filtered into trash and memories"
date: 2026-03-08T00:00:00.000Z
authored_by: ai-assisted
giscusTerm: "/blog/unforwarder-v2-kill-the-noise-save-the-memories/"
updated: 2026-03-08T00:00:00.000Z
hidden: true
tags:
  - Self-Host
  - VLM
---

About a year ago I wrote about [The Unforwarder](/blog/sortling/the-unforwarder-how-i-stopped-backing-up-junk-photos/), which used a local vision model to separate actual family photos from WhatsApp junk. It worked fine for what it was, but it only handled images after I had already exported them to my computer.

The source - WhatsApp itself - remained a mess. Every time I scrolled back through family or uncle groups, I still had to wade through YouTube Shorts links, Facebook reels, forwarded memes sent as raw media files, and the eternal parade of Good Morning graphics. My phone's camera roll was still getting polluted before I could even run the cleanup script. I wanted to clean things up right inside WhatsApp instead of waiting for a manual export.

## Cleaning at the source

WhatsApp Web connects over the desktop browser protocol. Link it once with a QR code like any browser session, and you can talk to your chats directly: reading messages, downloading media, and deleting clutter.

Crucially, "delete for me" syncs across linked devices. When the script deletes a spam link or a chain forward, it vanishes from the phone too.

## Deleting vs preserving

The cleanup has two distinct jobs: clear out junk from the chats, and save clean copies of the things worth keeping.

For deleting, it makes three quick passes:
- **Junk links:** Stripping out YouTube Shorts, Facebook reels, and any spam links you add to the list.
- **Frequently forwarded media:** WhatsApp tags messages forwarded five or more times with a little flag. If something has been passed around that much in a group, it's almost certainly not a personal memory.
- **Text spam:** Matching obvious Good Morning greetings, motivational quotes, and religious chain forwards against a text list.

For preserving, another helper pulls real photos and videos into monthly folders with their original timestamps intact, skipping anything that was already flagged as forwarded. If there's a conversation worth keeping before leaving a loud group, it can also dump the full chat into readable daily notes.

Whatever survives the chat prune gets handed over to the local vision model: keep the real memories in a safe folder, and drop the rest into a review pile.

## The pipeline

Everything sits under a suite called [wa-suite](https://github.com/carteakey/wa-suite), tied together with a single runner script.

{% image_cc "./src/static/img/diagrams/unforwarder-v2-pipeline.png", "Pipeline: WhatsApp chats feed three delete passes (junk links, forwarded memes, spam chains) and a main lane of download media, then a local classifier that splits into real photos and review and delete", "sketch-draw", "The wa-suite pipeline. Deleters run on the chats first; whatever survives is downloaded and classified locally." %}

It runs in a safe dry-run mode by default, showing you what would be deleted so you don't accidentally wipe chats while tweaking patterns. Everything stays entirely local on my own machine - no cloud APIs, no external logging, and nobody else seeing personal photos or family forwards.

## Switching to Qwen VL

The first version used Llama 3.2 Vision. For this setup I switched over to Qwen 3 VL (the 8B model) running locally in Ollama. Qwen's vision models have been getting solid community praise, and on tricky images the practical difference is noticeable.

The hardest edge cases for the old model were things like a genuine family photo with a festive greeting stamped across the bottom, or an artistic photo that looked like a wallpaper. Llama 3.2 often got confused and flagged them as junk, whereas Qwen 3 VL handles the nuance much better without needing a complicated prompt:

> *"Is this image one of: social media texts, screenshots, good morning messages, super blurry images, memes, or any other forwarded content? Just answer yes or no."*

## What's next

Right now I still trigger the cleanup by hand whenever the clutter gets annoying. The next step is setting it up on a regular schedule in the background.

Video forwards are also still an unsolved nuisance. Uncle groups produce an endless stream of forwarded video clips that the script currently ignores because it only looks at photos. Pulling a few keyframes from each video and passing them to the vision model should solve most of that.

Full code: [wa-suite](https://github.com/carteakey/wa-suite)
