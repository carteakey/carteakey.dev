---
title: "Four Phases of a Builder"
description: "A retrospective on going from Kaggle notebooks to AI pipelines - and what changed along the way."
date: 2026-04-17
authored_by: ai-assisted
hidden: true
draft: false
tags:
  - Personal
  - Meta
---

I was cleaning up my GitHub recently - archiving old repos, moving things to `_archive`, deleting the ones that served no purpose other than proof that I once started something I never finished. At some point in the process, I stopped and actually looked at what was there. The whole archaeological record, going back maybe five or six years.

It's uncomfortable to look at your own early work. But it's also clarifying. You can see the shape of how you got here.

I think I've gone through four distinct phases as a builder. Not neat phases with clean edges - they blur, they overlap, they sometimes feel like regression. But the arc is visible if you squint.

## Phase 1: Early Stupid

This phase has one defining characteristic: you're building to learn, not to ship.

My repos from this period are a catalog of textbook exercises. Keras tutorials. MNIST classifiers. A ResNet18 crack detection model (PyTorch, because I read a Medium post and thought "I should try this"). A loan classifier in scikit-learn. A weather EDA notebook. Kaggle stuff.

None of it was original. All of it was valuable.

This phase gets unfairly maligned. People look back at their early work and cringe, and the cringe is real - I'm not going to pretend that `pytorch-MNIST-models` was a contribution to the field. But the point of Phase 1 is to internalize how things work. You can't skip it. The people who try to skip it usually end up copy-pasting from Stack Overflow for years without ever developing taste, because they never went through the slow part.

The mark of Phase 1 ending: you finish a tutorial and immediately want to modify it. You're no longer following the recipe; you're asking what happens if you change an ingredient.

## Phase 2: Products Emerging

This is the dangerous phase, because it looks like progress but is mostly ambition outpacing execution.

You've learned enough to start real things. You have opinions about what should exist. You start projects that have actual scope - a movie recommender with a real UI, a hotel management system that handles bookings and invoices, a hospitality website featured in Chakra UI's showcase.

The problem is that finishing is a different skill than starting, and you haven't learned it yet.

My Phase 2 repos are scattered with things that almost work. Recomovi had real promise - it was doing NLP-based movie recommendation before that was a normal thing to do. vizima.in got shipped and looked good. spendalyzr was the first version of something I'd spend years trying to build right (it eventually became clawfin). But there's also a graveyard: half-finished tools, repos with a single commit, projects that stalled at the 80% mark because the last 20% was just not as fun as the first 80%.

The thing Phase 2 teaches you, eventually, is that the last 20% is where the actual product is.

There's also something else happening in this phase: you're building for hypothetical users. You imagine someone who wants what you're making. But you don't really know if they exist, and you're not one of them yet. The work is still more about proving you can build than about actually solving a problem you feel.

## Phase 3: Shipping

Something shifted. I'm not sure exactly when.

The best marker I have is carteakey.dev - this website. Not because it's technically impressive. It's an Eleventy site with Tailwind CSS, nothing groundbreaking. But the act of building it, maintaining it, adding to it over years, pointing people at it - that's a different relationship to work than anything I'd had before. It's mine in a way that a Kaggle notebook isn't.

Around the same time: cinemattr.ca launched and actually worked. server-compose quietly accumulated 179 GitHub stars, which is the kind of thing that happens when you build something you personally needed and turns out other people needed it too. 

The defining feature of Phase 3 is that you have users. Even if the only user is you. Especially if the only user is you. Building for yourself is the most honest form of product development - there's no way to lie to yourself about whether it actually solves the problem.

Phase 3 is also when taste develops. You've seen enough bad software to know what makes software bad. You've maintained enough of your own code to know what makes it painful. You start making different choices - simpler architectures, less magic, more control. You stop adding features because they're fun to build and start only adding them when you actually need them.

The other thing Phase 3 teaches: finishing is a habit, not a talent. The projects that ship are the ones you show up for every day even when they're not interesting. The graveyard from Phase 2 starts to feel less like failure and more like evidence of a skill you hadn't built yet.

## Phase 4: AI-Native

This one is still in progress, so I'll be less definitive.

The difference between someone who uses AI in their projects and someone who is AI-native isn't the technology - it's the framing. In Phase 3, you might add an AI feature to an app. In Phase 4, the problem you're solving is intrinsically an AI problem. The AI isn't a feature; it's the whole point.

Look at what I've been building lately: truthshield is a fact-checking extension that works on any webpage in real time - that's only possible with modern LLMs. nanoghibli transforms video footage into Studio Ghibli-style anime using Gemini and Veo - you couldn't have made that two years ago. chirptype is offline, on-device voice transcription that drops text into any input field on macOS - the model is the product. muninn is a personal AI copilot that knows my context and lives locally.

These aren't "apps with AI." They're things that didn't exist as a category before the last few years.

There's also a change in how I approach building. The iteration speed is different. Tools like Claude Code have collapsed the time between "I wonder if..." and "okay, that works." The bottleneck has shifted from implementation to taste - the question is less "can I build this" and more "should I build this, and what's the right shape for it."

What Phase 4 has in common with Phase 1 is that feeling of being slightly lost in a landscape that's changing faster than you can map it. In Phase 1, you were learning the fundamentals. In Phase 4, nobody has fully worked out the fundamentals yet. The difference is that you've got enough experience to make useful progress even without a complete map.

---

I don't know what Phase 5 looks like yet. Maybe the phases don't work as a metaphor past a certain point - maybe it's just "building" from here, without the scaffold of learning stages.

But when I look at the arc from those sklearn classifiers to real-time AI pipelines, I don't feel embarrassed about the early stuff. I feel grateful for it. The slow part was the only path to here.

The graveyard is evidence you tried. The ones that shipped are evidence you learned.
