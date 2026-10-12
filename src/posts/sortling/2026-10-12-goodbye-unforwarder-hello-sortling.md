---
title: "Goodbye Unforwarder, Hello Sortling"
description: The meme classifier I asked for finally showed up, so my WhatsApp script grew into a wizard that sorts any folder.
seoDescription: "Replacing a slow yes/no vision-LLM prompt with local decision models that sort screenshots, downloads, documents and photos in under a second each, with real confidence scores."
image: /img/blog-sketches/unique/goodbye-unforwarder-hello-sortling-stamp-trim.png
imageAlt: "Monochrome sketch of the Sortling mascot, a round chibi creature in an oversized star wizard hat and cape, magically sorting files into boxes with a wand"
date: 2026-10-12T00:00:00.000Z
authored_by: ai-assisted
updated: 2026-10-12T00:00:00.000Z
hidden: true
tags:
  - Self-Host
  - VLM
---

In the [first Unforwarder post](/blog/sortling/the-unforwarder-how-i-stopped-backing-up-junk-photos/) I asked if anyone knew of a decent meme-classification model. Nobody did, so I did what everyone did in 2025: asked a vision model a yes/no question for every image and parsed whatever text came back. [v2](/blog/sortling/unforwarder-v2-kill-the-noise-save-the-memories/) wrapped that in a WhatsApp cleanup pipeline, and I wrote "Simple still wins."

It worked, but it was slow. Every image meant the model generating an answer, one at a time, so a WhatsApp dump was something I'd start and come back to later. {# TODO: your real per-image time for the old script #} And the answer was only ever "yes" or "no". You can't tell a confident answer from a coin toss, so I still ended up checking the borderline ones by hand.

## The model I actually wanted

What I really wanted was a model that doesn't try to have a conversation. That's what decision models are. You give them a file and a list of possible answers, and they give you back a probability for each one in a single pass. There's no text to generate and nothing to parse.

That single pass is the whole difference. On the same 12GB card, a decision model answers everything I ask about an image in half a second to two seconds. A chat model asked the same questions took about half a minute a file in my tests (model loading included). A folder that used to be a "leave it running" job is now done while I watch.

The probabilities are the other half. "Is this junk?" coming back at 91% is something you can act on. Coming back at 46% means it's borderline, so the tool sets it aside instead of guessing.

## From WhatsApp to everything

Once an image took a second or two and came with a real confidence score, keeping it to WhatsApp felt silly. My Downloads and Screenshots folders are in far worse shape than any family group chat.

So the Unforwarder grew into **sortling**, a single Python file with no dependencies that tidies any folder you point it at. It shows you the full plan before moving anything, and every run ends with an undo command, because I don't trust anything with my files - me included.

{% image_cc "./src/static/img/sortling/sortling-sorting.png", "Pixel-art wizard dropping colored cubes into document, image and leaf bins", "w-full max-w-md mx-auto", "The intended workflow" %}

The rules are built around how I actually hoard files:

- A screenshot of a receipt or a boarding pass is a record, so it goes into the documents folder next to the PDFs, whatever format it came in.
- Other screenshots get grouped by topic, like chats, code, reading and shopping.
- Memes get quarantined in their own folder, where you can browse them or bin them later. Only real junk (blurry, accidental, pitch-black photos) gets staged for deletion, and only when the model is over 85% sure.
- Photos get a few broad groups like people, food and pets, since Immich already does faces and places better than I ever will.

The screenshot rule wasn't the plan. The first time I pointed it at my real screenshots, every single one went to the review pile, because I'd only given it document categories. The model was right to be unsure, since most screenshots aren't documents. They got their own folders after that, and now most of them land somewhere sensible.

{# TODO: add a real terminal screenshot of a run here (the plan, or the "all sorted!" face) #}

## Does it work?

I made a small test set of receipts, a scanned lab report, stock photos of dogs and food, a caption meme, a "share with 10 friends" quote card and, of course, a Good Morning card. Both models I tried got 45 of 47 right. The miss was a photo I'd darkened to look like a pocket shot: it only scored 46% on junk, so it got filed as a photo instead of staged for deletion. The Good Morning card went straight to memes on both. Some things are universal.

If you only have a regular chat model, there's a slower mode that uses one and explains every file in a sentence, though its confidence is just whatever the model claims. The way I like to run it is both. The fast model sorts everything, and only the handful of files it's unsure about get a second look from the chat model, so you pay the slow price on a few files instead of all of them.

## The little wizard

I couldn't resist giving it some personality. While it works, a little pixel wizard sits beside the progress bar and reacts to what it finds, Doom-guy style - sunglasses for memes, heart eyes for pet photos, a confused look when a document goes to review. It falls asleep while the model loads.

{% image_cc "./src/static/img/sortling/sortling-sleeping.png", "Pixel-art wizard asleep against a pile of boxes", "w-full max-w-sm mx-auto", "Waiting for a model to load" %}

## What happens to the Unforwarder

It's next in line for retirement. The WhatsApp pipeline is switching to sortling's photos mode, so the memes folder takes over from the old review-and-delete pile, and real photos carry on to Immich like before. The scripts that delete forwards and spam links inside WhatsApp itself stay, since sortling only sorts files.

{# TODO: once wa-suite has switched, rewrite this section in the past tense #}

If you know of a meme-classification model, I don't need it anymore. The code's at [carteakey/sortling](https://github.com/carteakey/sortling) if your Downloads folder needs an intervention.
