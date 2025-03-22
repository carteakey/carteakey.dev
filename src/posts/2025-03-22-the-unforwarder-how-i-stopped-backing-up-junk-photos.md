---
title: "The Unforwarder: How i stopped backing up junk photos"
description: Taming the WhatsApp chaos
date: 2025-03-22T22:20:08.060Z
updated: 2025-03-22T22:20:08.064Z
tags:
  - Self-Host
  - Local-LLM
---
I am a huge fan of self-hosting, and one of the things i use is Immich to store precious photos of me and my family. It gives me a bit of relief over paranoia of Google Photos / internet shutting down / hacked / outage stopping me from living in my nostalgia. 

A source of lot of these images are shared over messaging services e.g. WhatsApp. If you're an Indian (like me) - you'll be very aware of the influx of forwarded stuff that gets mixed in with actual photos. This includes the infamous "Good Morning messages", which has hilariously crashed Whatsapp couple times now ([Whatsapp vs Good Morning](<[https://www.indiatimes.com/technology/apps/whatsapp-freezes-because-indians-send-over-100-crore-good-morning-messages-it-just-can-t-handle-338246.html](<Whatsapp vs Good Morning>)). Other things may include screenshots, random memes and what not. 

When it comes to backing these up, it involves exporting the Whatsapp Media and painstakingly choosing the photos that i'd want to backup by hand. This is insanely tedious, and the organizational freak in me has long yearned for something that helps me separate the fluff out of the real stuff. 

## Finding Existing Solutions

Long back - I researched on finding existing machine learning models for meme classification, training something like it myself, but to no avail and gave up. 

Google seems to know this problem, and so one of the only thing that comes close to being useful is the Files by Google app, having sections for cleaning up memes and old screenshots. 

![](/img/google-feature.png)

The other helpful thing is built within WhatsApp itself, but solves only a small subset of the problem. 

![](/img/whatsapp-feature.png)


## The solution

Hope is rekindled with the plethora of LLM's and vision models that might be just the thing i needed all this time (Thanks, Google).

Thankfully my gaming addiction has got me one good thing - an NVIDIA GPU, on which i can run these fancy multi-modal models. This means all i need is a vibe-coded script, a good prompt, and some time to pass my all images to an ollama instance - make it decide for me what's worth keeping and what is not. The model being local is of paramount importance because i don't want the next generation of models to be trained on the brainrot material i will be feeding them, if i had done so. Also, personal photos - duh.

## Choosing a model

For ease of use (available out of the box for [ollama](https://ollama.com/search?c=vision)) - it boils down to 2 mainstream models that can fit in my RTX 4070 GPU with a meagre 12GB VRAM.

1. Gemma-3 (12B) by Google.
2. Llama3.2 - Vision (11B) by Meta.

I like the idea of using Meta's model against the problems it has created, so we'll go with #2. (even though the [VLM leaderboard](https://huggingface.co/spaces/opencompass/open_vlm_leaderboard) recommends otherwise). 

![](/img/potter.webp)

## Initial Tests

Trying out samples from my "collection" with a simple prompt seems to give promising results.

![](/img/tired.png)

Good night, Good Morning!

![](/img/good-night.png)

No dog photos were harmed.

![](/img/dog-test.png)

## Behold... The Unforwarder

## Next Work

All i have to do now is plug it into an n8n workflow and I can finally rest and watch the sun rise on a grateful phone storage.