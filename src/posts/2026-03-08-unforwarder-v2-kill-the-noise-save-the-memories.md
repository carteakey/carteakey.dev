---
title: "Unforwarder v2: Kill the Noise, Save the Memories"
description: From one script to a two-tool WhatsApp hygiene system - destroy the junk, preserve what matters.
date: 2026-03-08T00:00:00.000Z
authored_by: ai-assisted
updated: 2026-03-08T00:00:00.000Z
hidden: true
tags:
  - Self-Host
  - VLM
  - WhatsApp
---

About a year ago I wrote about [The Unforwarder](./2025-03-22-the-unforwarder-how-i-stopped-backing-up-junk-photos.md) - a 60-line Python script that used a local vision model to sort WhatsApp images into "real photos worth keeping" and "junk to delete". It worked. I was happy.

Then I kept using WhatsApp.

The junk doesn't stop at photos. There are YouTube Shorts links. Facebook links. Forwarded memes sent directly as media files. Good morning messages with embedded images. Uncle groups forwarding the same WhatsApp channel posts seventeen times. The noise is relentless, and it lives everywhere - not just in your camera roll backup, but in your chat history itself.

So I went deeper.

## The Problem Gets Bigger

The original unforwarder only solved half the problem: it cleaned up images *after* you'd already exported them from your phone. The source - WhatsApp itself - was still full of junk. Every time you scrolled through a chat, there it was. Every time WhatsApp backed something up to iCloud or Google Photos, there it went.

I wanted to clean at the source.

Turns out WhatsApp Web has an unofficial but well-maintained Node.js library called [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) that hooks into the same protocol as the browser client. You authenticate via QR code like any other linked device, and then you have programmatic access to your entire chat history - read messages, download media, and yes, delete messages.

Delete *for me*. Which, it turns out, syncs across all your linked devices. Tested. Confirmed.

## Two Tools, One Purpose

The project split naturally into two repos along a single axis: **destroy vs preserve**.

{% callout "aside", "The Hindu mythology callout" %}
In the Trimurti, Shiva destroys, Vishnu preserves, and Brahma creates and orchestrates the whole thing. So: `unforwarder` is Shiva, `memento` is Vishnu, and `wa-suite` - the parent repo that runs the pipeline - is Brahma. This parallel was noticed mid-build and could not be ignored.
{% endcallout %}

### [unforwarder](https://github.com/carteakey/wa-suite/tree/main/unforwarder) - the destroyer

Kills the noise:

- **`delete-junk-links.js`** - deletes YouTube Shorts and Facebook links. Extensible - add any pattern to the list.
- **`delete-forwarded-media.js`** - deletes forwarded images and videos using WhatsApp's own `forwardingScore`. Default threshold is **≥ 5**, exactly what WhatsApp labels "Forwarded many times".
- **`delete-patterns.js`** - deletes messages matching a custom regex list in `patterns.txt`. Ships with patterns for good morning/night, motivational spam, religious chain forwards, and "please share in 10 groups". Add your own.
- **`unforwarder.py`** - the original. Ollama vision model classifies a folder of images: memes go to `review-n-delete/`, real photos go to `save/`.

### [memento](https://github.com/carteakey/wa-suite/tree/main/memento) - the preserver

Preserves what matters:

- **`download-media.js`** - downloads personal photos and videos from WhatsApp to `~/Pictures/WhatsApp/YYYY-MM/` with original timestamps intact. Skips forwarded media by default. Checkpoint file ensures reruns don't re-download.
- **`export-chat.js`** - exports any chat to a markdown file, grouped by day. Useful before leaving a group or archiving an important conversation.

The output of memento feeds directly into unforwarder's Python classifier - download everything, classify locally, keep the real stuff, bin the rest.

## The Pipeline

Both tools live under [wa-suite](https://github.com/carteakey/wa-suite), a parent repo with a single `pipeline.sh` that runs the full flow. One command, dry run by default.

```
WhatsApp chats
    ├─ delete-junk-links.js        → Shorts + Facebook links, gone
    ├─ delete-forwarded-media.js   → viral meme images/videos, gone
    ├─ delete-patterns.js          → good morning spam, chains, gone
    │
    └─ download-media.js           → ~/Pictures/WhatsApp/incoming/
              │
              └─ unforwarder.py    → real photos → ~/Pictures/WhatsApp/
                                     memes       → review-n-delete/
```

```bash
DRY_RUN=false ./pipeline.sh
```

All local. All running on my own machine. No cloud, no API key, no third party seeing my family photos or my dad's extensive collection of WhatsApp forwards.

## A Note on the Model

The v1 script used `llama3.2-vision`. This one runs `qwen3-vl:8b`. Qwen's vision models have become the go-to community recommendation for local image classification - [this thread](https://www.reddit.com/r/LocalLLaMA/comments/1p5retd/best_local_vlms_november_2025/) has a good breakdown if you want to pick your own. The accuracy improvement is real, particularly on edge cases: a real photo of someone at a wedding with a "Blessings from the Almighty" caption overlaid is junk. A blurry photo of your kid's first steps is not. The old model got confused. This one doesn't.

The prompt hasn't changed much:

> *"Is this image one of: social media texts, screenshots, good morning messages, super blurry images, memes, or any other forwarded content? Just answer yes or no."*

Simple still wins.

## What's Next

The obvious missing piece is scheduling - right now you run the pipeline manually. A `launchd` job that fires it weekly, silently, in the background is the next thing on the list. Set it and forget it.

After that: video classification. The meme video problem is completely unsolved. My uncle groups are prolific video producers and `unforwarder.py` only handles images. Extending the Ollama classifier to short video clips is the natural next step, though sampling frames and running them through the vision model is probably enough to get 90% of the way there.

And `starred-sync.js` - a local markdown dump of all your starred messages - because WhatsApp starred is not an archive, it's a suggestion.

The junk will keep coming. At least now it has somewhere to go.

Full code: [wa-suite](https://github.com/carteakey/wa-suite)
