---
title: Vipul Sharma
url: https://vipul.xyz
repo: https://github.com/vipul-sharma20/vipul.xyz
author: Vipul Sharma
date: 2026-10-20
status: active
bio: Founding engineer at Skit.ai (8.5 years, telephony, voice bots, LLMs). Homelab operator, 3D printing enthusiast, guitar player.
stack:
  framework: Next.js (App Router)
  styling: Custom SCSS
  hosting: GitHub Pages (frontend) + OVH VPS + RustFS / S3 (runtime data)
inspirations:
  - name: Grouped Gallery / Albums by Location
    route: /gallery/
    status: planned
    summary: Location- and trip-based photo albums with tags, dates, narrative intros, and polaroid grids.
    relevance: Group photos in src/gallery.njk by city/trip alongside the existing flat wall view.
  - name: Artist Ridgeline (Joyplot) & Recent Share Bar
    route: /listening/
    status: planned
    summary: Pure SVG weekly artist density waves over time plus a proportional recent listening share bar.
    relevance: Upgrade src/listening.njk using our 120k+ plays in cartebase to show listening eras.
  - name: 3D Printing & Hardware Build Log
    route: /threedee/
    status: backlog
    summary: Dedicated folio/ledger documenting Bambu Lab prints, custom keyboards, and ESP32 mods.
    relevance: Catalog physical homelab server racks, 3D prints, and electronics hacks.
  - name: Quantified-Self Deep Dives via Isolated Iframes
    route: /2025/12/22/flight-journey/
    status: backlog
    summary: 10-year personal flight history visualized with interactive maps and chord diagrams in sandboxed iframes.
    relevance: Template for deep personal data essays without polluting the site's main build.
  - name: Dedicated Career Chapter Archive
    route: /skit/
    status: idea
    summary: Archival retrospective of an 8.5-year startup era accessible via a laptop sticker QR code.
    relevance: A personal, authentic way to memorialize major career milestones.
  - name: Explicit Human-vs-AI Attribution Callouts
    route: /2026/03/28/violations-of-bengaluru/
    status: implemented
    summary: Upfront honest callouts declaring exactly what was human-authored vs. where LLMs helped.
    relevance: Aligns with our human-writer skill and frontmatter authored_by conventions.
---

# Vipul Sharma (`vipul.xyz`)

A deep dive into [vipul.xyz](https://vipul.xyz) ([source](https://github.com/vipul-sharma20/vipul.xyz)), exploring ideas, interaction patterns, and data architectures that resonate with `carteakey.dev`.

---

## 1. Profile & Alignment

* **Ethos**: Pragmatic hacker, personal data collector, self-hoster, homelab tinkerer.
* **Overlap with `carteakey.dev`**:
  * Runs local LLMs and benchmarks them across fleet hardware (MacBook, Pi, cloud GPUs).
  * Collects and visualizes personal telemetry (Spotify history, flights, hardware stats).
  * Prefers clean, content-first typography with rich interactive toys where they serve a purpose.
  * Captures real-life moments, prints physical parts, and tinkers with electronics.

---

## 2. In-Depth Feature Inspirations

### Feature 1: Location-Grouped Photo Galleries (`/gallery/`)

#### The Pattern on `vipul.xyz`
* Rather than dumping every photo into an unorganized stream, `/gallery/` categorizes photos into discrete **Albums** (e.g. *Royal Albert Dock, Liverpool*, *The Beatles Story Museum*).
* Stored in `content/albums/YYYY-MM-DD-slug.md` with frontmatter:
  ```yaml
  title: Royal Albert Dock, Liverpool
  location: Royal Albert Dock, Liverpool
  date: 2025-07-02
  tags: [liverpool, travel]
  photos:
    - image: /assets/images/photos/full/...
      caption: "Dock at dusk"
  ```
* Gallery index provides filter pills by location/tag and renders album cards with cover photos. Clicking through leads to a dedicated album page with a date pin, location pin, brief narrative intro, and a lightbox grid.

#### Adaptation for `carteakey.dev`
* `carteakey.dev` currently has a flat PhotoSwipe masonry wall on `src/gallery.njk` powered by `src/_data/photos.yaml`.
* `photos.yaml` already records `location:` fields (Toronto, Mumbai, Joshimath, Auli, Markham, Clarington).
* **Next Step**: Introduce a collection view toggle on `/gallery/` (`Wall` vs. `Locations / Trips`).
  * `Wall`: Keeps the existing dense, uncropped masonry grid.
  * `Locations`: Clusters photos by location/trip into editorial cards showing photo counts, date ranges, and a cover image.

---

### Feature 2: Artist Ridgeline (Joyplot) & Recent Share Bar (`/listening/`)

#### The Pattern on `vipul.xyz`
* Decoupled from site builds via an hourly cron updating a public JSON file on S3 (`docs/LISTENING_PAGE.md`).
* **Recent Share Bar**:
  * A single proportional horizontal stacked bar visualizing the listening share of top artists over the last 14 days.
  * Underneath is an inline dot legend with artist names and exact play counts.
* **The Joyplot (Ridgeline Plot)**:
  * Vertically stacked artist baselines with overlapping filled area charts (`ROW_OFFSET = 24px`, `RIDGE_HEIGHT = 60px`).
  * Shows weekly play counts smoothed with a moving average, illustrating when artists peaked across 2025–2026.
  * Hand-rolled responsive SVG with hover scrub lines.

#### Adaptation for `carteakey.dev`
* `carteakey.dev` already tracks 120,000+ plays in `src/_data/cartebase/listening.json` on `src/listening.njk`.
* We currently display overall rankings, monthly totals, and hour-by-weekday heatmaps, but **lack artist density across time**.
* **Next Step**:
  1. Add a **Recent Share Bar** to `/listening/` for the current month / last 30 days.
  2. Implement a `type: "ridgeline"` chart in our build-time SVG charting engine (`utils/charts.mjs`), rendering static, zero-JS SVGs in line with our "ink and dots" editorial design language.

---

### Feature 3: Hardware & 3D Printing Log (`/threedee/` or `/hardware/`)

#### The Pattern on `vipul.xyz`
* Maintains a dedicated `/threedee/` section (`content/printing/`) logging Bambu Lab prints: pen holders, cable organizers, Ikea Skadis pegboard mounts, and Raspberry Pi cases.
* Records print details, purpose, filament type, and photos/videos of the physical artifact.

#### Adaptation for `carteakey.dev`
* In `carteakey.dev`, homelab, hardware, and fleet monitoring are major themes (`/uses/`, fleet bandwidth monitoring, GPU offloading, local LLM servers).
* **Next Step**: A dedicated ledger or shelf page (e.g. `/hardware/` or `/builds/`) tracking physical homelab setups, 3D printed brackets, and electronics projects.

---

### Feature 4: Quantified-Self Long-Form Essays via Isolated Iframes

#### The Pattern on `vipul.xyz`
* *Analyzing My Flight Journey Data*: Parsed 114 flight tickets from Gmail booking PDFs since 2016.
* Visualized route networks, route chord diagrams, booking advance windows, and yearly cost curves.
* Embedded interactive D3 and Leaflet visualizations as standalone HTML pages (`assets/html/flights/`) through clean iframes.

#### Adaptation for `carteakey.dev`
* Enables rich, interactive JavaScript visualizations inside long-form essays without bloating the core bundle or risking CSS conflicts.
* A strong model for future personal data deep dives (homelab telemetry, commute logs, code commit cadences).

---

### Feature 5: Transparency & Career Retrospectives

#### The Pattern on `vipul.xyz`
* **Editorial Transparency**: Explicit callouts on posts stating whether text was written 100% by hand or where LLM assistance was used.
* **/skit**: A dedicated archival page recounting 8.5 years as Founding Engineer at Skit.ai, linked via a physical laptop QR code.

#### Adaptation for `carteakey.dev`
* Already aligned with `authored_by` frontmatter and the `human-writer` skill.
* Career chapter retrospectives provide a lasting, personal home for professional milestones.
