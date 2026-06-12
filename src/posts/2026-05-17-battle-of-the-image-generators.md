---
title: Battle of the Image Generators
description: I burned API credits comparing ChatGPT Images 2.0, Nano Banana, and Imagen on prompts designed to be annoying.
image: /img/blog-sketches/unique/battle-of-the-image-generators-stamp-trim.png
imageAlt: Transparent monochrome sketch of a scoreboard chart comparing different image models with checkmarks and cross marks
date: 2026-05-17
updated: 2026-05-17
authored_by: ai-assisted
draft: true
tags:
  - AI
  - Art
pinned: false
---

I had $300 API credits to burn and nothing else to show for it.

That is only slightly unfair. I also got a folder full of tiny watercolor kitchens, cursed market maps, inconsistent character sheets, and a better sense of which image model I should bother when I need artifacts for this site.

I have been experimenting with image generation models for blog images, visual headers, and the odd little fake artifact that makes a post feel less like a wall of text. The problem is that most model comparisons are too polite. Ask for a cozy cafe or a dramatic astronaut and everyone looks competent. You get six pretty pictures and learn almost nothing.

So I made the prompts irritating.

The benchmark had 10 prompts. Each one was built to catch a different failure mode: exact text, countable objects, maps, negative constraints, character consistency, editable whitespace, low light, and "please keep this looking like a normal phone photo instead of an ad campaign."

This was not a lab benchmark. This was closer to a junk drawer test. If I am going to use these models for my own site, I care less about leaderboard purity and more about what breaks when the prompt asks for something specific.

I ran it through [`nanoghibli`](https://github.com/carteakey/nanoghibli), my local image/video generation repo. The useful bit is that the benchmark is now standardized enough to reuse: prompts live in a prompt library, models go through a catalog, outputs are cached by model, and the leaderboard is generated from the same scoring pass each time. The next time a new image model shows up, I should be able to add it as another model entry and rerun the same prompt set instead of rebuilding the comparison from vibes and screenshots.

<style>
  .battle-wide {
    width: min(94vw, 1280px);
    margin: 1.5rem 0 2.25rem 50%;
    transform: translateX(-50%);
  }
  .battle-hero {
    width: 100%;
    border: 1px solid #d8d1c3;
    border-radius: 8px;
    background: #f6f1e8;
  }
  .battle-note {
    color: #5f584c;
    font-size: 0.95rem;
    margin-top: 0.55rem;
  }
  .battle-prompt {
    border: 1px solid #d8d1c3;
    border-radius: 8px;
    padding: 0.85rem 1rem 1rem;
    background: #fbf8f1;
    margin: 1.5rem 0;
  }
  .battle-prompt summary {
    cursor: pointer;
    font-weight: 700;
  }
  .battle-strip {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(320px, 480px);
    gap: 1rem;
    overflow-x: auto;
    padding: 1rem 0 0.5rem;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  .battle-card {
    display: grid;
    grid-template-rows: auto minmax(3.25rem, auto);
    scroll-snap-align: start;
    border: 1px solid #d8d1c3;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }
  .battle-card > a:first-child {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 4 / 3;
    background: #fff;
  }
  .battle-card img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .battle-card figcaption {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.65rem 0.75rem;
    font-size: 0.92rem;
    border-top: 1px solid #eee6d8;
  }
  .battle-score {
    white-space: nowrap;
    color: #5f584c;
    font-variant-numeric: tabular-nums;
  }
  .battle-open {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }
  @media (max-width: 720px) {
    .battle-strip {
      grid-auto-columns: minmax(84vw, 1fr);
    }
    .battle-card > a:first-child {
      aspect-ratio: 1 / 1;
    }
  }
</style>

---

## The models

The comparison was between the models I would realistically reach for when making visual artifacts for this site. I was not trying to crown the best image model in the abstract, because that is a fake job. I wanted to know which one I should trust with a post header, a fake map, a tiny sign, or a character sketch I might reuse later.

| Model | Why it was here |
| --- | --- |
| ChatGPT Images 2.0 | The practical default. I use it a lot, and it is usually the one I trust when the image needs to obey text, layout, or editing intent. |
| Nano Banana Pro | The premium Gemini image option in this run (`gemini-3-pro-image-preview`). This is the one I expected to be most competitive with ChatGPT Images 2.0 on instruction following. |
| Nano Banana Flash | The faster Gemini image model (`gemini-3.1-flash-image-preview`). I was curious how much quality I would lose when optimizing for iteration speed. |
| Imagen 4 Ultra | The expensive Imagen option. In theory, this should be the strongest Imagen result when quality matters more than cost. |
| Imagen 4 Standard | The middle Imagen option, mostly interesting because middle tiers are often where pricing pages get psychologically annoying. |
| Imagen 4 Fast | The cheap/fast Imagen option. I did not expect it to win, but I wanted to know when "good enough" was actually good enough. |

The setup was deliberately boring: same 10 prompts, same scoring pass, 60 total images. The point of putting this inside `nanoghibli` was to make the comparison repeatable. When I want to test the next model, I can plug it into the catalog, run the same prompt library, and get a leaderboard plus raw outputs without inventing a new ritual.

<figure class="battle-wide">
  <img class="battle-hero" src="/img/image-generator-battle/scoreboard.png" alt="Scoreboard for the image model comparison">
  <figcaption class="battle-note">Average judge score across 10 deliberately annoying prompts.</figcaption>
</figure>

| Model | Average score |
| --- | ---: |
| ChatGPT Images 2.0 | 9.6 |
| Nano Banana Pro | 8.6 |
| Nano Banana Flash | 8.3 |
| Imagen 4 Ultra | 8.1 |
| Imagen 4 Standard | 7.3 |
| Imagen 4 Fast | 7.0 |

The lazy read is "ChatGPT Images 2.0 won." The more useful read is that the gap showed up when the image had to obey something measurable: text, layout, counts, routes, consistency. On pure mood, all of these can look good. Once the prompt asks for a tiny sign with exact wording and no invented symbols, the difference becomes less polite.

---

## The comparisons

The previous version of this post had composite grids. They looked nice until you tried to actually read anything. So this version uses expandable, full-width comparison strips. Open a prompt, scroll sideways, and click any image for the raw file.

<div class="battle-wide">
  <details class="battle-prompt" open>
    <summary>Kitchen sign: exact text on a tiny object</summary>
    <p class="battle-note">Text rendering is still the easiest way to embarrass an image model. A pretty kitchen does not help if the sign is corrupted.</p>
    <div class="battle-strip">
      <figure class="battle-card"><a href="/img/image-generator-battle/images/kitchen-sign/chatgpt-images-2-0.png"><img src="/img/image-generator-battle/images/kitchen-sign/chatgpt-images-2-0.png" alt="ChatGPT Images 2.0 result for the kitchen sign prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/kitchen-sign/chatgpt-images-2-0.png">ChatGPT Images 2.0</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/kitchen-sign/nano-banana-pro.png"><img src="/img/image-generator-battle/images/kitchen-sign/nano-banana-pro.png" alt="Nano Banana Pro result for the kitchen sign prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/kitchen-sign/nano-banana-pro.png">Nano Banana Pro</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/kitchen-sign/nano-banana-flash.png"><img src="/img/image-generator-battle/images/kitchen-sign/nano-banana-flash.png" alt="Nano Banana Flash result for the kitchen sign prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/kitchen-sign/nano-banana-flash.png">Nano Banana Flash</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/kitchen-sign/imagen-4-ultra.png"><img src="/img/image-generator-battle/images/kitchen-sign/imagen-4-ultra.png" alt="Imagen 4 Ultra result for the kitchen sign prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/kitchen-sign/imagen-4-ultra.png">Imagen 4 Ultra</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/kitchen-sign/imagen-4-standard.png"><img src="/img/image-generator-battle/images/kitchen-sign/imagen-4-standard.png" alt="Imagen 4 Standard result for the kitchen sign prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/kitchen-sign/imagen-4-standard.png">Imagen 4 Standard</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/kitchen-sign/imagen-4-fast.png"><img src="/img/image-generator-battle/images/kitchen-sign/imagen-4-fast.png" alt="Imagen 4 Fast result for the kitchen sign prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/kitchen-sign/imagen-4-fast.png">Imagen 4 Fast</a><span class="battle-score">6/10</span></figcaption></figure>
    </div>
  </details>

  <details class="battle-prompt" open>
    <summary>Market map: readable labels and a route that makes sense</summary>
    <p class="battle-note">Models love the idea of a map. They are less excited about the accountability of a map.</p>
    <div class="battle-strip">
      <figure class="battle-card"><a href="/img/image-generator-battle/images/market-map/chatgpt-images-2-0.png"><img src="/img/image-generator-battle/images/market-map/chatgpt-images-2-0.png" alt="ChatGPT Images 2.0 result for the market map prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/market-map/chatgpt-images-2-0.png">ChatGPT Images 2.0</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/market-map/nano-banana-pro.png"><img src="/img/image-generator-battle/images/market-map/nano-banana-pro.png" alt="Nano Banana Pro result for the market map prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/market-map/nano-banana-pro.png">Nano Banana Pro</a><span class="battle-score">9/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/market-map/nano-banana-flash.png"><img src="/img/image-generator-battle/images/market-map/nano-banana-flash.png" alt="Nano Banana Flash result for the market map prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/market-map/nano-banana-flash.png">Nano Banana Flash</a><span class="battle-score">7/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/market-map/imagen-4-ultra.png"><img src="/img/image-generator-battle/images/market-map/imagen-4-ultra.png" alt="Imagen 4 Ultra result for the market map prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/market-map/imagen-4-ultra.png">Imagen 4 Ultra</a><span class="battle-score">6/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/market-map/imagen-4-standard.png"><img src="/img/image-generator-battle/images/market-map/imagen-4-standard.png" alt="Imagen 4 Standard result for the market map prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/market-map/imagen-4-standard.png">Imagen 4 Standard</a><span class="battle-score">5/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/market-map/imagen-4-fast.png"><img src="/img/image-generator-battle/images/market-map/imagen-4-fast.png" alt="Imagen 4 Fast result for the market map prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/market-map/imagen-4-fast.png">Imagen 4 Fast</a><span class="battle-score">8/10</span></figcaption></figure>
    </div>
  </details>

  <details class="battle-prompt">
    <summary>Character sheet: one subject, three views, same outfit</summary>
    <p class="battle-note">This is where "almost the same person" becomes a real problem. A site can reuse a character language only if the model can remember what it just drew.</p>
    <div class="battle-strip">
      <figure class="battle-card"><a href="/img/image-generator-battle/images/character-sheet/chatgpt-images-2-0.png"><img src="/img/image-generator-battle/images/character-sheet/chatgpt-images-2-0.png" alt="ChatGPT Images 2.0 result for the character sheet prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/character-sheet/chatgpt-images-2-0.png">ChatGPT Images 2.0</a><span class="battle-score">9/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/character-sheet/nano-banana-pro.png"><img src="/img/image-generator-battle/images/character-sheet/nano-banana-pro.png" alt="Nano Banana Pro result for the character sheet prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/character-sheet/nano-banana-pro.png">Nano Banana Pro</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/character-sheet/nano-banana-flash.png"><img src="/img/image-generator-battle/images/character-sheet/nano-banana-flash.png" alt="Nano Banana Flash result for the character sheet prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/character-sheet/nano-banana-flash.png">Nano Banana Flash</a><span class="battle-score">7/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/character-sheet/imagen-4-ultra.png"><img src="/img/image-generator-battle/images/character-sheet/imagen-4-ultra.png" alt="Imagen 4 Ultra result for the character sheet prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/character-sheet/imagen-4-ultra.png">Imagen 4 Ultra</a><span class="battle-score">9/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/character-sheet/imagen-4-standard.png"><img src="/img/image-generator-battle/images/character-sheet/imagen-4-standard.png" alt="Imagen 4 Standard result for the character sheet prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/character-sheet/imagen-4-standard.png">Imagen 4 Standard</a><span class="battle-score">8/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/character-sheet/imagen-4-fast.png"><img src="/img/image-generator-battle/images/character-sheet/imagen-4-fast.png" alt="Imagen 4 Fast result for the character sheet prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/character-sheet/imagen-4-fast.png">Imagen 4 Fast</a><span class="battle-score">9/10</span></figcaption></figure>
    </div>
  </details>

  <details class="battle-prompt">
    <summary>Phone photo: keep the amateur snap feeling</summary>
    <p class="battle-note">Sometimes the awkwardness is the evidence. Over-polished output can be worse than a technically messier image.</p>
    <div class="battle-strip">
      <figure class="battle-card"><a href="/img/image-generator-battle/images/phone-photo-adaptation/chatgpt-images-2-0.png"><img src="/img/image-generator-battle/images/phone-photo-adaptation/chatgpt-images-2-0.png" alt="ChatGPT Images 2.0 result for the phone photo prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/phone-photo-adaptation/chatgpt-images-2-0.png">ChatGPT Images 2.0</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/phone-photo-adaptation/nano-banana-pro.png"><img src="/img/image-generator-battle/images/phone-photo-adaptation/nano-banana-pro.png" alt="Nano Banana Pro result for the phone photo prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/phone-photo-adaptation/nano-banana-pro.png">Nano Banana Pro</a><span class="battle-score">9/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/phone-photo-adaptation/nano-banana-flash.png"><img src="/img/image-generator-battle/images/phone-photo-adaptation/nano-banana-flash.png" alt="Nano Banana Flash result for the phone photo prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/phone-photo-adaptation/nano-banana-flash.png">Nano Banana Flash</a><span class="battle-score">9/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/phone-photo-adaptation/imagen-4-ultra.png"><img src="/img/image-generator-battle/images/phone-photo-adaptation/imagen-4-ultra.png" alt="Imagen 4 Ultra result for the phone photo prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/phone-photo-adaptation/imagen-4-ultra.png">Imagen 4 Ultra</a><span class="battle-score">7/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/phone-photo-adaptation/imagen-4-standard.png"><img src="/img/image-generator-battle/images/phone-photo-adaptation/imagen-4-standard.png" alt="Imagen 4 Standard result for the phone photo prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/phone-photo-adaptation/imagen-4-standard.png">Imagen 4 Standard</a><span class="battle-score">9/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/phone-photo-adaptation/imagen-4-fast.png"><img src="/img/image-generator-battle/images/phone-photo-adaptation/imagen-4-fast.png" alt="Imagen 4 Fast result for the phone photo prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/phone-photo-adaptation/imagen-4-fast.png">Imagen 4 Fast</a><span class="battle-score">5/10</span></figcaption></figure>
    </div>
  </details>

  <details class="battle-prompt">
    <summary>Low light: warm room without orange mush</summary>
    <p class="battle-note">This is less about correctness and more about taste. Some outputs make the room warm. Some make it radioactive.</p>
    <div class="battle-strip">
      <figure class="battle-card"><a href="/img/image-generator-battle/images/low-light-room/chatgpt-images-2-0.png"><img src="/img/image-generator-battle/images/low-light-room/chatgpt-images-2-0.png" alt="ChatGPT Images 2.0 result for the low light room prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/low-light-room/chatgpt-images-2-0.png">ChatGPT Images 2.0</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/low-light-room/nano-banana-pro.png"><img src="/img/image-generator-battle/images/low-light-room/nano-banana-pro.png" alt="Nano Banana Pro result for the low light room prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/low-light-room/nano-banana-pro.png">Nano Banana Pro</a><span class="battle-score">9/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/low-light-room/nano-banana-flash.png"><img src="/img/image-generator-battle/images/low-light-room/nano-banana-flash.png" alt="Nano Banana Flash result for the low light room prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/low-light-room/nano-banana-flash.png">Nano Banana Flash</a><span class="battle-score">8/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/low-light-room/imagen-4-ultra.png"><img src="/img/image-generator-battle/images/low-light-room/imagen-4-ultra.png" alt="Imagen 4 Ultra result for the low light room prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/low-light-room/imagen-4-ultra.png">Imagen 4 Ultra</a><span class="battle-score">7/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/low-light-room/imagen-4-standard.png"><img src="/img/image-generator-battle/images/low-light-room/imagen-4-standard.png" alt="Imagen 4 Standard result for the low light room prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/low-light-room/imagen-4-standard.png">Imagen 4 Standard</a><span class="battle-score">6/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/low-light-room/imagen-4-fast.png"><img src="/img/image-generator-battle/images/low-light-room/imagen-4-fast.png" alt="Imagen 4 Fast result for the low light room prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/low-light-room/imagen-4-fast.png">Imagen 4 Fast</a><span class="battle-score">9/10</span></figcaption></figure>
    </div>
  </details>

  <details class="battle-prompt">
    <summary>Train platform: countable objects in specific places</summary>
    <p class="battle-note">A prompt for spatial obedience. The scene can look charming and still fail if the lanterns, cat, or platform details drift.</p>
    <div class="battle-strip">
      <figure class="battle-card"><a href="/img/image-generator-battle/images/train-platform/chatgpt-images-2-0.png"><img src="/img/image-generator-battle/images/train-platform/chatgpt-images-2-0.png" alt="ChatGPT Images 2.0 result for the train platform prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/train-platform/chatgpt-images-2-0.png">ChatGPT Images 2.0</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/train-platform/nano-banana-pro.png"><img src="/img/image-generator-battle/images/train-platform/nano-banana-pro.png" alt="Nano Banana Pro result for the train platform prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/train-platform/nano-banana-pro.png">Nano Banana Pro</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/train-platform/nano-banana-flash.png"><img src="/img/image-generator-battle/images/train-platform/nano-banana-flash.png" alt="Nano Banana Flash result for the train platform prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/train-platform/nano-banana-flash.png">Nano Banana Flash</a><span class="battle-score">7/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/train-platform/imagen-4-ultra.png"><img src="/img/image-generator-battle/images/train-platform/imagen-4-ultra.png" alt="Imagen 4 Ultra result for the train platform prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/train-platform/imagen-4-ultra.png">Imagen 4 Ultra</a><span class="battle-score">8/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/train-platform/imagen-4-standard.png"><img src="/img/image-generator-battle/images/train-platform/imagen-4-standard.png" alt="Imagen 4 Standard result for the train platform prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/train-platform/imagen-4-standard.png">Imagen 4 Standard</a><span class="battle-score">7/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/train-platform/imagen-4-fast.png"><img src="/img/image-generator-battle/images/train-platform/imagen-4-fast.png" alt="Imagen 4 Fast result for the train platform prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/train-platform/imagen-4-fast.png">Imagen 4 Fast</a><span class="battle-score">5/10</span></figcaption></figure>
    </div>
  </details>

  <details class="battle-prompt">
    <summary>Poster layout: useful whitespace for later editing</summary>
    <p class="battle-note">Pretty posters are easy. Posters that leave usable edit space without filling every corner are more useful.</p>
    <div class="battle-strip">
      <figure class="battle-card"><a href="/img/image-generator-battle/images/poster-layout/chatgpt-images-2-0.png"><img src="/img/image-generator-battle/images/poster-layout/chatgpt-images-2-0.png" alt="ChatGPT Images 2.0 result for the poster layout prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/poster-layout/chatgpt-images-2-0.png">ChatGPT Images 2.0</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/poster-layout/nano-banana-pro.png"><img src="/img/image-generator-battle/images/poster-layout/nano-banana-pro.png" alt="Nano Banana Pro result for the poster layout prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/poster-layout/nano-banana-pro.png">Nano Banana Pro</a><span class="battle-score">3/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/poster-layout/nano-banana-flash.png"><img src="/img/image-generator-battle/images/poster-layout/nano-banana-flash.png" alt="Nano Banana Flash result for the poster layout prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/poster-layout/nano-banana-flash.png">Nano Banana Flash</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/poster-layout/imagen-4-ultra.png"><img src="/img/image-generator-battle/images/poster-layout/imagen-4-ultra.png" alt="Imagen 4 Ultra result for the poster layout prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/poster-layout/imagen-4-ultra.png">Imagen 4 Ultra</a><span class="battle-score">5/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/poster-layout/imagen-4-standard.png"><img src="/img/image-generator-battle/images/poster-layout/imagen-4-standard.png" alt="Imagen 4 Standard result for the poster layout prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/poster-layout/imagen-4-standard.png">Imagen 4 Standard</a><span class="battle-score">7/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/poster-layout/imagen-4-fast.png"><img src="/img/image-generator-battle/images/poster-layout/imagen-4-fast.png" alt="Imagen 4 Fast result for the poster layout prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/poster-layout/imagen-4-fast.png">Imagen 4 Fast</a><span class="battle-score">6/10</span></figcaption></figure>
    </div>
  </details>

  <details class="battle-prompt">
    <summary>No extra animals: negative constraints</summary>
    <p class="battle-note">Models love adding bonus details. This prompt checks whether "do not add more animals" survives contact with style.</p>
    <div class="battle-strip">
      <figure class="battle-card"><a href="/img/image-generator-battle/images/no-extra-animals/chatgpt-images-2-0.png"><img src="/img/image-generator-battle/images/no-extra-animals/chatgpt-images-2-0.png" alt="ChatGPT Images 2.0 result for the no extra animals prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/no-extra-animals/chatgpt-images-2-0.png">ChatGPT Images 2.0</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/no-extra-animals/nano-banana-pro.png"><img src="/img/image-generator-battle/images/no-extra-animals/nano-banana-pro.png" alt="Nano Banana Pro result for the no extra animals prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/no-extra-animals/nano-banana-pro.png">Nano Banana Pro</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/no-extra-animals/nano-banana-flash.png"><img src="/img/image-generator-battle/images/no-extra-animals/nano-banana-flash.png" alt="Nano Banana Flash result for the no extra animals prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/no-extra-animals/nano-banana-flash.png">Nano Banana Flash</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/no-extra-animals/imagen-4-ultra.png"><img src="/img/image-generator-battle/images/no-extra-animals/imagen-4-ultra.png" alt="Imagen 4 Ultra result for the no extra animals prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/no-extra-animals/imagen-4-ultra.png">Imagen 4 Ultra</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/no-extra-animals/imagen-4-standard.png"><img src="/img/image-generator-battle/images/no-extra-animals/imagen-4-standard.png" alt="Imagen 4 Standard result for the no extra animals prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/no-extra-animals/imagen-4-standard.png">Imagen 4 Standard</a><span class="battle-score">8/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/no-extra-animals/imagen-4-fast.png"><img src="/img/image-generator-battle/images/no-extra-animals/imagen-4-fast.png" alt="Imagen 4 Fast result for the no extra animals prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/no-extra-animals/imagen-4-fast.png">Imagen 4 Fast</a><span class="battle-score">7/10</span></figcaption></figure>
    </div>
  </details>

  <details class="battle-prompt">
    <summary>Rainy bicycle: mood plus object discipline</summary>
    <p class="battle-note">This is closer to a normal blog-artifact prompt: mood matters, but the bicycle and rain still need to hold together.</p>
    <div class="battle-strip">
      <figure class="battle-card"><a href="/img/image-generator-battle/images/rainy-bicycle/chatgpt-images-2-0.png"><img src="/img/image-generator-battle/images/rainy-bicycle/chatgpt-images-2-0.png" alt="ChatGPT Images 2.0 result for the rainy bicycle prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/rainy-bicycle/chatgpt-images-2-0.png">ChatGPT Images 2.0</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/rainy-bicycle/nano-banana-pro.png"><img src="/img/image-generator-battle/images/rainy-bicycle/nano-banana-pro.png" alt="Nano Banana Pro result for the rainy bicycle prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/rainy-bicycle/nano-banana-pro.png">Nano Banana Pro</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/rainy-bicycle/nano-banana-flash.png"><img src="/img/image-generator-battle/images/rainy-bicycle/nano-banana-flash.png" alt="Nano Banana Flash result for the rainy bicycle prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/rainy-bicycle/nano-banana-flash.png">Nano Banana Flash</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/rainy-bicycle/imagen-4-ultra.png"><img src="/img/image-generator-battle/images/rainy-bicycle/imagen-4-ultra.png" alt="Imagen 4 Ultra result for the rainy bicycle prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/rainy-bicycle/imagen-4-ultra.png">Imagen 4 Ultra</a><span class="battle-score">9/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/rainy-bicycle/imagen-4-standard.png"><img src="/img/image-generator-battle/images/rainy-bicycle/imagen-4-standard.png" alt="Imagen 4 Standard result for the rainy bicycle prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/rainy-bicycle/imagen-4-standard.png">Imagen 4 Standard</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/rainy-bicycle/imagen-4-fast.png"><img src="/img/image-generator-battle/images/rainy-bicycle/imagen-4-fast.png" alt="Imagen 4 Fast result for the rainy bicycle prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/rainy-bicycle/imagen-4-fast.png">Imagen 4 Fast</a><span class="battle-score">10/10</span></figcaption></figure>
    </div>
  </details>

  <details class="battle-prompt">
    <summary>Tiny workshop: small tools and readable clutter</summary>
    <p class="battle-note">A clutter prompt without permission to become visual soup. Good for seeing who can keep small details organized.</p>
    <div class="battle-strip">
      <figure class="battle-card"><a href="/img/image-generator-battle/images/tiny-workshop/chatgpt-images-2-0.png"><img src="/img/image-generator-battle/images/tiny-workshop/chatgpt-images-2-0.png" alt="ChatGPT Images 2.0 result for the tiny workshop prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/tiny-workshop/chatgpt-images-2-0.png">ChatGPT Images 2.0</a><span class="battle-score">7/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/tiny-workshop/nano-banana-pro.png"><img src="/img/image-generator-battle/images/tiny-workshop/nano-banana-pro.png" alt="Nano Banana Pro result for the tiny workshop prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/tiny-workshop/nano-banana-pro.png">Nano Banana Pro</a><span class="battle-score">6/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/tiny-workshop/nano-banana-flash.png"><img src="/img/image-generator-battle/images/tiny-workshop/nano-banana-flash.png" alt="Nano Banana Flash result for the tiny workshop prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/tiny-workshop/nano-banana-flash.png">Nano Banana Flash</a><span class="battle-score">6/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/tiny-workshop/imagen-4-ultra.png"><img src="/img/image-generator-battle/images/tiny-workshop/imagen-4-ultra.png" alt="Imagen 4 Ultra result for the tiny workshop prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/tiny-workshop/imagen-4-ultra.png">Imagen 4 Ultra</a><span class="battle-score">10/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/tiny-workshop/imagen-4-standard.png"><img src="/img/image-generator-battle/images/tiny-workshop/imagen-4-standard.png" alt="Imagen 4 Standard result for the tiny workshop prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/tiny-workshop/imagen-4-standard.png">Imagen 4 Standard</a><span class="battle-score">3/10</span></figcaption></figure>
      <figure class="battle-card"><a href="/img/image-generator-battle/images/tiny-workshop/imagen-4-fast.png"><img src="/img/image-generator-battle/images/tiny-workshop/imagen-4-fast.png" alt="Imagen 4 Fast result for the tiny workshop prompt"></a><figcaption><a class="battle-open" href="/img/image-generator-battle/images/tiny-workshop/imagen-4-fast.png">Imagen 4 Fast</a><span class="battle-score">5/10</span></figcaption></figure>
    </div>
  </details>
</div>

---

## What I am taking from this

The grid is still the benchmark, but the grid has to let the images breathe. Tiny contact sheets are good for a gut check and bad for decisions. When text, labels, routes, and character details matter, the comparison needs to be large enough that the failure is visible without zooming like a detective.

For future runs I would keep the rules simple:

- Use the exact same prompt across every model.
- Add new models as catalog entries, not one-off screenshots.
- Include traps: text, counts, spatial relationships, negative constraints, and editability.
- Keep raw outputs, not only the winners.
- Score the images, but also write down the dumb failures.
- Put the outputs side by side before trusting your memory.
- Avoid vibe prompts unless vibe is the actual product.

The annoying answer is that I will probably keep using more than one model.

ChatGPT Images 2.0 won this run for the kind of site artifacts I care about. Nano Banana Pro was strong enough that I would keep it in the mix, especially when I want API-driven iteration. Nano Banana Flash is the one I would use when speed matters and the prompt is not too fussy. Imagen 4 Ultra had some strong moments, but not enough to make it the obvious default. Imagen 4 Fast is useful when price and speed matter more than obedience. Imagen 4 Standard is the awkward one: sometimes good, sometimes not different enough from the cheaper or better option to justify another decision.

Anyway, that is what $300 of credits got me: a spreadsheet, a pile of generated artifacts, and a better sense of which model to bother when I need a fake market map that does not lie to me.
