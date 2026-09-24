---
name: cross-platform-distribution
description: Transforms carteakey.dev blog posts and technical notes into native, high-impact drafts for X/Twitter, Substack, and Medium to expand audience reach and touchpoints while preserving canonical attribution.
---

# Cross-Platform Distribution Skill

Use this skill whenever the author wants to amplify, distribute, or cross-post content from `carteakey.dev` to external audience touchpoints (Twitter/X, Substack, Medium).

## Philosophy
- **Site is Canonical**: All primary writing lives first on `carteakey.dev`.
- **Medium & Substack = Verbatim Cross-Posting**: The content is long-form and technical; both platforms excel at verbatim republishing with canonical attribution.
- **Twitter/X = High-Signal Thread Only**: Verbatim fails on X. Condense the piece into a 4–5 tweet punchy thread focused on the counterintuitive finding, the mechanism, the numbers, and the link.
- **Strictly No AI Slop**: Adhere to `human-writer` rules. No filler phrases, no synthetic transitions, no performative hooks.

---

## Platform Playbooks

### 1. Medium (Verbatim Cross-Posting via Import)
Medium is built specifically for verbatim syndication:
- **Recommended Path**: Use Medium's official **Import Tool** at `https://medium.com/p/import` and paste the post's canonical URL (e.g. `https://carteakey.dev/blog/running-qwen3-8-flash-next-locally/`).
- **SEO Guarantee**: Medium automatically inserts the `<link rel="canonical" href="...">` tag pointing to `carteakey.dev`, ensuring Google attributes 100% of the SEO search ranking to the personal site.
- **Checklist**:
  1. Paste URL into `medium.com/p/import`.
  2. Verify code block highlighting and inline formatting.
  3. Add 5 relevant topic tags (e.g., `Artificial Intelligence`, `Machine Learning`, `Open Source`, `Self Hosting`, `LlamaCpp`).
  4. Publish.

### 2. Substack (Verbatim with Short Opener)
Substack subscribers want the full technical post directly in their reader/inbox:
- **Opener**: Prepend a 1-2 sentence personal context note (*"From the workbench: I spent the last few weeks testing..."*).
- **Eleventy Shortcode Swap**:
  - Replace `{% image "./src/static/img/..." %}` with the direct image.
  - Replace `{% progression_chart %}` with a clean markdown table or progression snapshot.
- **Email Clipping Guard**:
  - If the post is under ~3,000 words: Paste verbatim.
  - If the post is over ~3,500 words: Post the first ~1,500 words (the problem, architecture, and benchmark results) and add a clear button link: *"Read the complete reproduction recipe and exact build flags on carteakey.dev →"* to prevent Gmail's 102KB email clipping.

### 3. Twitter / X (4–5 Tweet Thread)
Twitter requires an extracted, high-density thread:
- **Tweet 1 (The Hook)**: The counterintuitive benchmark or result. State it directly without throat-clearing.
- **Tweet 2 (The Mechanism)**: What architectural detail makes this possible (e.g. sparse n-gram SSD lookup vs. active weights in RAM).
- **Tweet 3 (The Concrete Numbers)**: The memory tier allocation (VRAM, RAM, SSD), parameter counts, or throughput.
- **Tweet 4 (The Tuning / Progression)**: Baseline vs. optimized numbers (+218% leap, key flags like `-ncmoe 45`).
- **Tweet 5 (Attribution & Links)**: Canonical link to the post on `carteakey.dev` and any open-source GitHub repo/harness.
- **Media**: Attach the primary post sketch or chart to Tweet 1.

---

## Invocation Output

When the author asks to distribute or cross-post a blog post:
1. Provide the **X / Twitter 4–5 Tweet Thread** ready to copy/publish.
2. Provide the **Substack Package** (Subject Line, Subtitle, Opener, and Shortcode-Cleaned Markdown).
3. Provide the **Medium Import URL and 5 Tags** for 30-second verbatim publishing.
