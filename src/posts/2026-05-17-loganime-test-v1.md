---
title: I Tried to Ghiblify a Trailer - Loganime
description: A messy still-frame trailer experiment, and the weirdly practical lessons hiding inside it.
image: /img/loganime-test/loganime-final-contact.jpg
imageAlt: "Contact sheet from a 12fps generated-stills trailer experiment"
date: 2026-05-17
updated: 2026-05-17
authored_by: ai-assisted
draft: true
tags:
  - AI
  - Art
---

I spent the last couple of days doing the extremely normal thing where you turn a trailer into 1,290 individual frames, send the frames through image models, stitch them back together at 12fps, and then slowly realize the actual boss fight is black bars.

This is **Loganime test v1**. It is not a polished short film. It is a debugging run that accidentally became cool.

The repo behind it is [NanoGhibli](https://github.com/carteakey/nanoghibli). It started as a very simple thing: I wanted a way to batch ghiblify my own images without dragging files one-by-one through a chat UI. Then, very predictably, it stopped being simple. Photo folders became video frame extraction. Video frame extraction became model rotation, batch API jobs, manual ChatGPT fallback lanes, and eventually this 12fps still-trailer path.

<figure class="not-prose">
  <video controls muted loop playsinline preload="metadata" poster="/img/loganime-test/loganime-final-contact.jpg" class="w-full border border-gray-200 dark:border-gray-700">
    <source src="/img/loganime-test/loganime-test-v1-preview.mp4" type="video/mp4">
  </video>
  <figcaption class="font-thin italic">A short muted preview from the stitched pass. The full local render is 12fps, 1920x1080, and built from generated stills plus a few source-filled sections.</figcaption>
</figure>

The stupid thing is that it works better than I expected. There is obvious jitter. Faces swim. Some shots look like the model forgot what movie it was watching. But when it hits, it has that "wait, this came from still frames?" feeling.

The funny thing is that the repo did not start with trailers at all. It was supposed to be a little image machine. Give it a folder of photos, get back a folder of Ghibli-ish versions, reuse anything already generated, and stop paying twice for the same experiment because that is not a personality trait.

Then I tried a video.

At first the obvious path was: extract a few important frames, stylize them, and ask a video model to connect the gaps. That still makes sense. But limits are limits, and curiosity is annoying, so the fallback idea became: what if I just generate a lot more stills? Not keyframes. Actual 12fps-ish coverage. Take the trailer apart into still images, stylize the frames in batches, and stitch the whole thing back together with the original timing.

That is where the project changed shape. It stopped being "can I make this image cute?" and became "how much of the original structure can survive the machine?"

{% image_cc "./src/static/img/loganime-test/loganime-final-contact.jpg", "Contact sheet of the final Loganime test v1 render", "", "A broad pass over the final render. The best way to evaluate these experiments is not one hero frame; it is a contact sheet where the failures cannot hide." %}

## Contact sheets saved this

Do not evaluate generated video experiments by watching one cherry-picked clip. Make contact sheets.

Single frames lie in both directions. One frame can look magical and the next one can have a different face, a different sky, a random logo, or a color palette that has drifted into radioactive green. Contact sheets make the mess obvious. You can see which failures repeat, which ones are isolated, and which ones are accidentally interesting.

After a few passes I kept coming back to the same problems:

1. the model wanted to stylize black frames into fake scenery
2. the source video had inconsistent internal letterboxing
3. the generated frames changed size or crop enough to create a zoom pulse

The third one was the most annoying. I kept thinking the visual jitter was mostly temporal inconsistency from the model. Some of it was. A lot of it was just the frame geometry breathing.

## Black bars became the whole thing

I did not expect letterboxing to become the thing I cared about most.

If one generated frame includes black bars and the next one fills the whole canvas, your eyes feel it immediately. If you crop the bars inconsistently, the whole video starts doing this tiny zoom-in, zoom-out thing. It looks like bad stabilization, except I caused it with preprocessing.

The fix was low-tech:

- fit the generated frames consistently
- crop embedded bars from source fallback frames before sizing them
- overlay one fixed black matte on every final frame
- preserve true black source frames instead of filling them from neighboring generated frames

That last point matters more than it sounds. If a black transition frame gets replaced with a nearby generated still, the edit suddenly flashes imagery where the original trailer had darkness. Sometimes that looks cool. Most of the time it just looks broken.

{% image_cc "./src/static/img/loganime-test/loganime-fixed-bars-pair.jpg", "Two adjacent final frames with fixed black bars", "", "Two adjacent frames after applying the fixed matte. The content can still vary, but the frame no longer breathes because the bars stay put." %}

## I cheated with the source frames

I also ended up keeping a few sections from the source: the logo/title beat, black frames, and the tail end. That made the experiment easier to read.

When a model regenerates a logo, it often creates a fake logo-like object. That can be funny for a second, but it becomes noise when the goal is to study the rest of the pipeline. Same for the end cards. If they are source-filled and sized correctly, the generated sections get more room to be weird in the right places.

{% image_cc "./src/static/img/loganime-test/loganime-source-final-strip.jpg", "Source and final frame strip comparing logo, letterbox, and tail fixes", "", "Top row is source, bottom row is the final stitched output. The logo and tail are intentionally source-filled; the middle pair shows the fixed matte doing its quiet little job." %}

The slightly embarrassing part is that one accidental failure mode was great. Missing generated frames would sometimes flash back to real source frames. On paper that is a bug. In motion it becomes this glitch texture where the generated world tears open for a frame or two.

I probably want that as an intentional mode later.

## The audit pass did the real work

The best tooling from this experiment was not the model call. It was the audit pass around the model call.

For the current clean workflow, I want every run to produce:

- a source contact sheet
- a generated contact sheet
- a final stitched contact sheet
- a manifest of which frames were generated, filled, or source-overridden
- a small preview clip

That sounds boring, but it turns "vibes are off" into actual debugging. You can point at frame 697 and say: this one has bars. Frame 696 does not. That is why it feels dizzy. You can point at the tail and say: source frames are being contained inside the canvas instead of cropped and cover-fit. That is why the end looks like a tiny movie inside a bigger movie.

{% image_cc "./src/static/img/loganime-test/loganime-tail-audit-contact.jpg", "Tail-section contact sheet from the trailer audit pass", "", "The tail section was the canary. Once the source-filled end cards were sized wrong, the whole workflow felt less deliberate." %}

## Where this goes next

This started as a "can still images become a trailer?" test. Now it feels like the beginning of a proper image-generator battle:

- Nano Banana / Gemini image models for fast batch stills
- ChatGPT Images as a manual high-quality lane
- Veo-style video generation for motion-native comparison
- contact sheets as the judge, not just a final clip

The still-frame path is probably the control group now. It is cheap-ish, inspectable, and weirdly honest because every bad frame has a name. The other branch is Veo: true motion-native anime trailer generation. Some of the older Dune runs already had shots that felt closer to the thing I actually want, where the frame is not just changing twelve times a second, it is actually moving.

<figure class="not-prose">
  <video controls muted loop playsinline preload="metadata" poster="/img/loganime-test/dune-veo-teaser.jpg" class="w-full border border-gray-200 dark:border-gray-700">
    <source src="/img/loganime-test/dune-veo-teaser.mp4" type="video/mp4">
  </video>
  <figcaption class="font-thin italic">A tiny teaser from an older Dune/Veo run. This is the other branch of the experiment: motion-native generation instead of stitched stills.</figcaption>
</figure>

I still have a lot to clean up. The temporal consistency is not solved. The palette can drift. The prompt can inject too much fake greenery. Faces are still fragile. But I like this stage because the flaws are visible and specific.

<figure class="not-prose">
  <div style="position:relative;width:100%;aspect-ratio:16/9;border:1px solid rgba(148,163,184,.45);overflow:hidden;">
    <iframe
      src="https://www.youtube-nocookie.com/embed/3UWYlOoE1rY"
      title="Loganime test v1 full unlisted render"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
      style="position:absolute;inset:0;width:100%;height:100%;border:0;"
    ></iframe>
  </div>
  <figcaption class="font-thin italic">The full unlisted YouTube render, mostly here so the contact-sheet notes have motion context.</figcaption>
</figure>

It looks cool as hell, and now the failures are finally named.
