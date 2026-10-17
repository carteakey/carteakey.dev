---
title: Has My Photography Gotten Better? Asking Apple's Aesthetic Score
description: Apple Photos quietly scores every photo. Ten thousand of mine say the month matters more than the phone.
date: 2026-10-16
authored_by: ai-assisted
image: /img/blog-sketches/unique/has-my-photography-gotten-better-stamp-trim.png
imageAlt: Transparent monochrome sketch of a phone camera viewfinder over a scatter of small dots
tags:
  - Data
  - Photography
hidden: true
draft: true
pinned: false
featured: false
sources:
  - title: "osxphotos"
    author: "Rhet Turnbull"
    url: "https://github.com/RhetTbull/osxphotos"
    contribution: "Reads the Photos library database, including its computed scores, and exports originals from iCloud."
  - title: "Dogsheep"
    author: "Simon Willison"
    url: "https://dogsheep.github.io/"
    contribution: "The idea of pulling personal data into SQLite to query it, which cartebase copies."
---

{% set pa = cartebase.photo_aesthetics %}

Apple Photos scores every photo you take. It doesn't show you the number anywhere, but it's in the library database: an `overall_aesthetic_score` between 0 and 1, plus sub-scores for composition, lighting, subject, noise and so on. I pulled mine into [cartebase](https://github.com/carteakey/cartebase), my SQLite pile of personal data, and asked the obvious question. Have I gotten any better?

Short answer: no, and the first chart I made said I'd gotten a lot worse, which was also wrong.

## The score is a black box

Apple doesn't document how the score is computed or what it was trained on, so I'm treating it as one opinionated model's taste, not a measure of quality. What I can check is whether it's consistent with itself, and whether it agrees with me at all.

It does, a little. The 101 photos I've favourited average **0.485**. Everything else averages 0.426. That's not a huge gap, but it points the same way I do.

## The first pass lied

My first query took the yearly average of every scored photo. 2022 came out at 0.468 and 2026 at 0.349, a steady slide. Two things were wrong with it.

Screenshots get scored too, and they score terribly (around 0.1). I take a lot more of them than I used to, and they were dragging every recent year down. Then there's a cluster of exactly 0.5: {{ pa.placeholder_excluded | localeNumber }} photos sitting on the same value with empty sub-scores. That's Photos' placeholder for "not analysed yet", not a score. Take both out and the slide mostly goes away.

| Year | Camera photos | Screenshots | Mean, everything | Mean, camera only |
|---|---:|---:|---:|---:|
{% for y in pa.yearly %}{% if y.year >= "2022" %}| {{ y.year }} | {{ y.photos | localeNumber }} | {{ y.screenshots | localeNumber }} | {{ y.mean_with_screenshots }} | {{ y.mean }} |
{% endif %}{% endfor %}

2022 is still the high point, and I don't have a good story for it. More than half of that year's photos come from two months, March and October. 2023 through 2025 sit close together. 2026 looks bad, but that's January to April only, and that matters more than I expected.

## The month matters more than the year

{% chart {
  type: "line",
  data: pa.month_of_year,
  x: "month",
  y: "mean",
  yMin: 0.35,
  yMax: 0.48,
  digits: 3,
  count: "photos",
  countLabel: "photos",
  mark: ["Jun"],
  notes: [{ at: "Jan", text: "January and February\nare the low points", dx: 40, dy: -70 }],
  kicker: "Apple Photos · mean aesthetic score by calendar month",
  title: "The darkest months score about 0.07 below the brightest",
  source: "cartebase · photos_assets",
  n: pa.photos,
  range: "camera photos, 2022 – Apr 2026",
  xLabel: "month",
  query: pa.sql.month_of_year
} %}

Grouped by calendar month instead of by year, the pattern is hard to miss. January (0.393) and February (0.399) are the worst months, and June (0.462) and August (0.461) are the best. The lighting sub-score follows the same shape: lowest in February, highest in June. My guess is fewer daylight hours in a Toronto winter and more photos taken indoors, and the lighting sub-score backs up at least the first half of that.

So the 2026 dip is mostly that the year so far is all winter. Here's every month since 2022 with 2026 picked out:

{% chart {
  type: "line",
  data: pa.monthly,
  x: "month",
  y: "mean",
  yMin: 0.3,
  yMax: 0.55,
  digits: 3,
  count: "photos",
  countLabel: "photos",
  highlight: ["2026-01", "2026-04"],
  ref: { value: pa.mean, label: "all-time mean " ~ pa.mean },
  notes: [{ at: "2026-02", text: "Jan–Apr only", dx: -40, dy: 40 }],
  kicker: "Apple Photos · mean aesthetic score by month",
  title: "No trend, just seasons",
  source: "cartebase · photos_assets",
  n: pa.photos,
  range: "camera photos, 2022 – Apr 2026",
  xLabel: "month",
  query: pa.sql.monthly
} %}

## The new phone didn't help

I went from an iPhone 12 mini to an iPhone 16 at the start of 2025, and I assumed the bigger sensor would show up here. It doesn't.

| Camera | Photos | Mean score |
|---|---:|---:|
{% for c in pa.cameras %}| {{ c.camera }} | {{ c.photos | localeNumber }} | {{ c.mean }} |
{% endfor %}

The 12 mini actually comes out slightly ahead. Whatever the score rewards, it isn't sensor size, or I've been pointing the new phone at worse things. The Ray-Ban Meta glasses are last by a distance, which is fair. Nobody frames a shot with their face.

## What a good score looks like

{% chart {
  type: "bars",
  data: pa.histogram,
  x: "bucket",
  y: "count",
  highlight: "max",
  xTicks: 10,
  notes: [{ at: "0.65", text: "the top 1% start\nat " ~ pa.p99, dx: 60, dy: -50 }],
  kicker: "Apple Photos · score distribution",
  title: "The median photo scores " ~ pa.median,
  source: "cartebase · photos_assets",
  n: pa.photos,
  range: "camera photos, 2011 – Apr 2026",
  xLabel: "score bucket",
  yLabel: "photos"
} %}

Six in ten photos land between 0.35 and 0.55, and the top 1% start at {{ pa.p99 }}. Photos' own scene labels on the top 40 lean towards sky, water, winter and parks. I filtered out anything labelled with people or documents before looking, so that list says as much about my filter as about the model.

Here's what that looks like in practice, two from the top and two from the bottom (no people, same filter as above):

{% gallery [
  { src: "./src/static/img/cartebase/sample-high-lake-rocks.jpg", alt: "Rocky lake shore under a clear blue sky, calm water to the horizon", caption: "Score 0.728 · sky and water" },
  { src: "./src/static/img/cartebase/sample-high-autumn-canopy.jpg", alt: "Autumn forest trail with yellow maple foliage and fallen leaves", caption: "Score 0.743 · park and foliage" },
  { src: "./src/static/img/cartebase/sample-low-display-case.jpg", alt: "Electronics packaging boxes under scratched retail glass", caption: "Score 0.095 · scratched glass snapshot" },
  { src: "./src/static/img/cartebase/sample-low-pier-birds.jpg", alt: "Birds sitting on a small concrete dock under a hazy sky", caption: "Score 0.120 · washed-out pier snapshot" }
] %}

The top two are basically postcards: a clean horizon, good light, strong colour. The bottom two aren't really bad photos so much as photos I took to remember something, like a box behind scratched shop glass or birds on a dock too far away to see properly. The model can't know why I took them, so it's scoring them as if I was trying for a postcard and failed. Fair enough.

That's useful even if the score can't tell me whether I've improved. I'm using it to shortlist photos for the [gallery](/gallery/). The score proposes and I pick. The ones that make it carry their score in the caption, so you can disagree with Apple too.

## Caveats

- The data stops at the April 2026 export, so 2026 is a third of a year.
- Before 2022 there are barely a hundred scored photos in the library, so I've left those years out.
- Times are converted to the local time zone each photo was taken in, from the library's own offset.
- The score belongs to Apple. If they retrain the model and rescore my library, every number here moves.

The queries are under each chart. The exporter that builds this data is [`blog_snapshots.py`](https://github.com/carteakey/cartebase) in cartebase.
