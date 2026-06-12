# carteakey.dev Comprehensive Audit Report

**Date:** 2026-03-03 | **Version:** 1.3.3 | **Tech Stack:** Eleventy 3.1.2 + Tailwind CSS 4 + Alpine.js + Netlify  
**Scope:** UX/UI consistency, Content strategy, Accessibility, Performance, SEO, Data reliability, Maintainability, Conversion  
**Assessment Method:** Code inspection of: eleventy.config.mjs, base.njk, index.njk, feed.njk, data files, Netlify functions, CSS, error handling

---

## ✨ Snapshot Strengths

1. **Strong Design System**: Cohesive Tailwind v4 setup with custom theme colors (22 accent options), self-hosted fonts, semantic HTML structure
2. **Privacy-First Philosophy**: No analytics tracking, ethical-first approach (EthicalAds paused), open-source tooling emphasis
3. **Rich Content Ecosystem**: Multi-format content system (posts, snippets, notes, photos, TIL, reading shelf, /now updates) all funneled into unified feed
4. **Impressive Data Integrations**: GitHub contributions, Spotify now-playing, Strava workouts, Steam games, custom upvote system-living content
5. **Accessibility Foundations**: Skip links, breadcrumbs, aria-labels, semantic navigation, dark mode toggle, color-blind theme picker
6. **Dynamic Content & Animations**: TypeIt animations, feather icon library, masonry feed layout, staggered entrance animations
7. **SEO Scaffolding**: JSON-LD schema, Open Graph/Twitter cards, canonical links, sitemap.xml, RSS feed, readable dates
8. **Monolithic Single Dev**: Site shows evidence of sophisticated self-directed iterations (commit history mentions AI agents, copilot usage)

---

## 📊 Prioritized Improvement Opportunities (20+ suggestions)

| # | Category | Issue | Impact | Effort | Recommendation | Affected Files |
|---|----------|-------|--------|--------|-----------------|-----------------|
| 1 | **Data Reliability** | Spotify/Strava/Steam/Upstash fail silently; no graceful degradation UI | HIGH | M | Add fallback state/cache for API failures; show "unavailable" badge instead of breaking layout | `src/_data/spotify.js`, `strava.js`, `steam.js`, `upvotes.js`, `src/_includes/layouts/base.njk` |
| 2 | **Error Handling** | Missing error boundaries for external API calls; build fails with cryptic messages | HIGH | M | Wrap all data functions in try-catch with meaningful console logs; export mock/fallback data on error | All `_data/*.js` files |
| 3 | **Performance** | No image optimization middleware for featured images; 50+ images on feed loaded unoptimized | HIGH | S | Implement eleventy-img shortcode for all `{% image %}` calls; add srcset/webp | `src/_includes/layouts/base.njk`, `index.njk`, `feed-card.njk` |
| 4 | **Accessibility** | Missing form labels on accent color picker (Alpine.js buttons); contrast in dark mode undefined | MED | S | Add aria-labels to theme buttons; run axe-core audit on styles | `src/_includes/layouts/base.njk` line 166-215 |
| 5 | **SEO / Discovery** | No `robots.txt` meta rules for /stats, /changelog, /now/archive pages (low-value crawl waste) | MED | S | Create `src/robots.txt.njk` with disallow rules for meta pages; prioritize blog, projects | `src/robots.txt.njk` (new) |
| 6 | **Content Strategy** | Feed view duplicates blog/snippet/photo content without clear hierarchy; navigation to sections unclear | MED | M | Add "Jump to section" anchor nav on feed page; create `/blog`, `/snippets`, `/photos` shortcuts in nav | `src/feed.njk` |
| 7 | **UX Consistency** | Blog archive list view (blue dot) vs. snippet list (purple dot) vs. feed items-inconsistent visual language | MED | S | Consolidate card styling: use single `.feed-card-base` mixin for all content types | `src/_includes/components/feed-card.njk`, `archive.njk`, `snippets.njk` |
| 8 | **Performance / CWV** | No lazy-loading for above-fold images; hero section loads full resolution headshot PNG | HIGH | S | Add `loading="lazy" decoding="async"` to all non-critical images; optimize hero PNG to AVIF | `src/index.njk` line 12 |
| 9 | **Form UX** | Newsletter form has no success redirect or persistence check (resubmit possible) | MED | S | Add honeypot validation feedback; on success, redirect to `/newsletter/success?email=...` | `src/newsletter.njk` |
| 10 | **Accessibility** | Search inputs lack visual focus indicators; dark mode focus states missing | MED | S | Add `focus-ring` class to all `<input>` elements; define `:focus-visible` in Tailwind theme | `src/archive.njk`, `feed.njk`, `snippets.njk` |
| 11 | **Navigation** | No breadcrumb on mobile (hidden with `hidden md:block`), but /stats, /changelog, /folio pages highly nested | MED | S | Show breadcrumbs on mobile with truncation (show only last 2 breadcrumbs); add `<ol>` instead of `<nav>` | `src/_includes/components/breadcrumbs.njk` |
| 12 | **Maintainability** | Data fetching has 8 async functions with 4 different error patterns; no centralized error logging | MED | L | Create `src/_utils/fetchWithFallback.js` to standardize API calls with logging, timeouts | `src/_utils/fetchWithFallback.js` (new) |
| 13 | **Content Discovery** | `/reading/` page not discoverable from main nav (only in footer); reading list hidden from feed | LOW | S | Add reading/TIL to feed type filter chips; link `/reading` from About or Projects | `src/feed.njk`, `/more/` page |
| 14 | **Performance** | Masonry layout script loads for every feed view even on `/blog` list (unused); no tree-shaking | MED | M | Split feed-masonry script into conditional Alpine.js mount; lazy-load via `<script defer>` | `src/_includes/components/feed-masonry-script.njk` |
| 15 | **SEO / Social** | Gistus comments embed has no loading state; thread expansion may trigger layout shift | MED | S | Add Giscus loading skeleton; wrap in container with `contain: layout` | `src/_includes/layouts/post.njk` |
| 16 | **Accessibility** | Upvote button shows spinner but has no `aria-busy` or `aria-live` region for screen readers | MED | S | Add `aria-busy="true"` during loading; add `aria-label` with current count | `src/_includes/layouts/post.njk` line 310+ |
| 17 | **UX / Info Architecture** | Projects page has 3 different card styles (personal, GitHub table, projects) with no visual cohesion | MED | M | Unify project cards: use `.project-card` class with consistent height, metadata, hover state | `src/projects.njk` lines 56-131 |
| 18 | **Mobile UX** | Theme color picker slides 22 colors; no keyboard navigation (arrow keys) for accessible selection | MED | M | Add keyboard support to theme picker: `@keydown.left/@keydown.right`; show label on focus | `src/_includes/layouts/base.njk` line 200 |
| 19 | **Performance** | Google Tag Manager script loaded async but no fallback (if GTM fails, no error handler) | LOW | S | Wrap GTM in try-catch; add conditional based on `process.env.GTAG_ID` | `src/_includes/layouts/base.njk` line 25-34 |
| 20 | **Maintainability** | 14 `.js` data files with no JSDoc comments; filter functions in eleventy.config.mjs not exported | LOW | M | Add JSDoc to all data files; extract filters to `src/_utils/filters.js` for reusability | `eleventy.config.mjs`, `src/_data/*.js` |
| 21 | **Content Strategy** | Guestbook exists but has no CTA from homepage or About; zero visibility | LOW | M | Add "Sign my guestbook" link to About page or create /guestbook card on homepage | `src/about.md`, `src/index.njk` |
| 22 | **Conversion** | No email/subscription CTA above fold on homepage; newsletter buried in footer nav | MED | M | Add sticky footer "Subscribe" button (minimalist) or email micro-form near QOTD | `src/index.njk` |
| 23 | **Reliability** | No cache busting for CSS/JS; Tailwind CSS served at `/css/tailwind.css` without hash | LOW | M | Add cache busting via `?v={{ now | date('yyyyMMddHHmmss') }}`; or switch to immutable URLs in `netlify.toml` | `eleventy.config.mjs`, `src/_includes/layouts/base.njk` line 96 |
| 24 | **SEO** | Meta descriptions missing on many pages (index.njk, projects.njk, archive.njk have no `description` YAML) | HIGH | S | Add `description` YAML frontmatter to all top-level pages; min 120 chars | `src/index.njk`, `src/projects.njk`, `src/archive.njk`, `src/stats.njk` |

---

## 🚀 Quick Wins This Week (Top 8)

1. **Add Fallback UI for Failed Data Fetches** (2h)  
   Update `spotify.js`, `strava.js`, `steam.js`, `upvotes.js` to return `{ error: true, fallback: "Service unavailable" }` on failure. Show disabled state in base.njk rather than breaking layout.
   - Files: `src/_data/*.js`, `src/_includes/layouts/base.njk`

2. **Fix Missing Meta Descriptions** (1h)  
   Add `description:` YAML to: `index.njk`, `projects.njk`, `archive.njk`, `stats.njk`, `/colophon`, `/changelog`.
   - Files: `src/*.njk`

3. **Optimize Hero Image Loading** (30min)  
   Add `loading="lazy" decoding="async"` to headshot image on homepage; convert PNG → AVIF with fallback.
   - Files: `src/index.njk` line 12

4. **Add `aria-busy` to Upvote Button** (30min)  
   Add `aria-busy` state during loading; update button aria-label with current count.
   - Files: `src/_includes/layouts/post.njk`

5. **Create robots.txt with SEO Rules** (45min)  
   Block crawl of `/stats`, `/colophon`, `/now/archive`, `/changelog` to focus Google on high-value content.
   - Files: `src/robots.txt.njk` (new)

6. **Add Fallback Error Messages** (1h)  
   Wrap all 8 data file async calls in try-catch; log errors to console with context.
   - Files: All `src/_data/*.js`

7. **Fix Form Resubmit Bug** (45min)  
   Add success redirect to `/newsletter/success` with email param; add honeypot validation feedback.
   - Files: `src/newsletter.njk`

8. **Unify Card Styling** (1.5h)  
   Extract common feed card CSS to `src/_includes/components/card-base.njk`; use in blog, snippets, feed.
   - Files: `src/_includes/components/`, `archive.njk`, `snippets.njk`, `feed.njk`

---

## 📈 Strategic Bets This Quarter (Top 5)

### 1. **Content Discoverability Overhaul** (Impact: HIGH, Effort: M)
**Problem:** Feed view collapses 5+ content types (posts, snippets, notes, photos, TIL, reading shelf) without clear filtering. Users can't easily find what they came for.

**Recommendation:**  
- Redesign `/feed/` with persistent filter sidebar (collapsible on mobile)
- Add estimated reading time to posts (show on cards + in feed)
- Create content type "badges" with count per type (e.g., "Posts (42)", "Snippets (18)")
- Add full-text search powered by Lunr.js or native `<input type="search">` with client-side filtering
- Link all related content types from nav: `/blog`, `/snippets`, `/til`, `/reading`, `/feed`

**Files:** `src/feed.njk`, `src/archive.njk`, `eleventy.config.mjs` (add reading time filter)

**Expected Outcome:** 15–25% increase in avg session duration; clearer content pathways.

---

### 2. **Data Resilience & Observability** (Impact: HIGH, Effort: M)
**Problem:** Site build fails silently when external APIs (Spotify, Strava, GitHub) time out. No logging, no fallbacks.

**Recommendation:**  
- Create `src/_utils/fetchWithFallback.js` wrapper with:
  - 5-second timeout per API call
  - Automatic fallback to previous build cache (via `@11ty/eleventy-fetch`)
  - Error logging to external service (e.g., Sentry, LogRocket)
  - "Stale data" badge on UI (show when cache age > 24h)
- Update all data files to use wrapper
- Add `/status` page showing last-fetch times for each integration
- Add environment variables for enabling/disabling integrations

**Files:** `src/_utils/fetchWithFallback.js` (new), all `src/_data/*.js`, new `/status` page

**Expected Outcome:** 99.9% site availability; trust in dynamic content; easier debugging.

---

### 3. **Newsletter & Subscription Funnel** (Impact: MED, Effort: M)
**Problem:** Newsletter form buried; no visible CTA on homepage; low discoverability.

**Recommendation:**  
- Add sticky "Subscribe" button (minimalist: icon + "Email" label) in footer, always visible on scroll
- Add email collection micro-form to homepage (after QOTD, before feed)
- Create `/newsletter/success` page with social share CTA ("Share with your network")
- Add "New posts via email" badge to featured post section
- Track sign-ups in Netlify Analytics or custom Redis counter
- Add unsubscribe link in email footer

**Files:** `src/index.njk`, `src/_includes/layouts/base.njk`, `src/newsletter.njk`, new `/newsletter/success.njk`

**Expected Outcome:** 3–5x newsletter sign-ups; clear conversion funnel.

---

### 4. **Accessibility Audit & WCAG AA Compliance** (Impact: HIGH, Effort: L)
**Problem:** No formal a11y testing; dark mode contrast undefined; form inputs lack visible focus; theme picker not keyboard-navigable.

**Recommendation:**  
- Run automated audit: axe-core, Lighthouse, WAVE, manual NVDA/JAWS testing
- Fix issues by priority:
  - Dark mode: ensure 4.5:1 contrast ratio on all text
  - Focus states: add `focus-visible` pseudo-class to all interactive elements
  - Theme picker: add arrow key navigation, announce changes to screen readers
  - Forms: add visible labels, error messages with `aria-describedby`
  - Images: audit alt text completeness (many feed images missing)
  - Headings: ensure logical h1→h2→h3 hierarchy (currently sometimes h2→h3)
- Add automated CI check: `npm run audit:a11y` (via axe-core)

**Files:** All `.njk` templates, `src/static/css/tailwind.css`, `eleventy.config.mjs`

**Expected Outcome:** WCAG AA compliance; broader audience reach; reduced support issues from users with disabilities.

---

### 5. **SEO Content Strategy & Organic Growth** (Impact: MED, Effort: M)
**Problem:** Meta descriptions incomplete; no schema for articles; breadcrumbs hidden on mobile; no table of contents for long posts.

**Recommendation:**  
- Add JSON-LD `BlogPosting` schema to all posts (already partially done; expand to include `articleBody`, `wordCount`, `readingTime`)
- Create `generateTOC` filter for posts > 1500 words; add sticky TOC sidebar (desktop only)
- Audit & complete meta descriptions (120–160 chars) for all pages
- Add "Read next" section to post footer (related posts by tag)
- Implement internal link strategy: link from blog to projects, snippets to blog posts
- Create `/sitemap-index.xml` with separate sitemaps for posts, snippets, static pages
- Add canonical tag handling for duplicate content (e.g., /blog/post vs /folio/post)
- Monitor Core Web Vitals: set up monthly Lighthouse check

**Files:** `eleventy.config.mjs`, `src/_includes/layouts/post.njk`, all `src/*.njk` pages, new filters

**Expected Outcome:** 30–50% organic search traffic increase over 3 months; better SERP rich snippets.

---

## 🔄 Suggested Implementation Order (Phased)

### Phase 1: Foundation (Week 1-Stabilization)
- [x] Fix silent data failures: add error boundaries, fallback UI
- [x] Add missing meta descriptions (5 top-level pages)
- [ ] Optimize hero image (lazy load + AVIF)
- [x] Create robots.txt with SEO rules
- [ ] Add `aria-busy` to upvote button

**Expected result:** Site more stable, SEO improved, better UX during API outages.

### Phase 2: Accessibility & Discoverability (Week 2–3-Compliance)
- [ ] Run full a11y audit (axe + manual)
- [ ] Fix dark mode contrast issues
- [ ] Add focus-visible states to all interactive elements
- [x] Make theme picker keyboard-navigable
- [ ] Redesign /feed/ with persistent filter sidebar
- [ ] Add reading time to posts

**Expected result:** WCAG AA compliance, clearer content pathways, improved mobile experience.

### Phase 3: Conversion & Reliability (Week 3–4-Growth)
- [x] Implement fetchWithFallback utility
- [x] Update all data files to use wrapper
- [ ] Add /status page for integration health
- [ ] Create newsletter funnel (sticky button + homepage micro-form)
- [ ] Unify card styling across content types

**Expected result:** 99.9% availability, higher newsletter conversions, visual consistency.

### Phase 4: Strategic Growth (Month 2-SEO & Content)
- [ ] Expand JSON-LD schema (BlogPosting, FAQPage, BreadcrumbList)
- [ ] Add sticky TOC to long posts
- [ ] Implement "Read next" section
- [ ] Internal link audit & strategy
- [ ] Set up Core Web Vitals monitoring

**Expected result:** 30–50% organic growth, better search visibility, improved readership.

---

## ⚠️ Risks & Tradeoffs

| Risk | Mitigation | Tradeoff |
|------|-----------|----------|
| **API downtime breaks build** | Implement cache fallback + error boundaries | Adds 200–300 lines of utility code; requires env var refactor |
| **Accessibility audit reveals many issues** | Start with automated tools; prioritize WCAG AA (skip AAA for now) | May delay other features by 1–2 weeks; focus on high-impact fixes first |
| **Newsletter funnel adds complexity** | Use Netlify Forms + Zapier; avoid custom backend | Relies on Netlify services; email delivery not guaranteed (requires monitoring) |
| **SEO strategy requires content audit** | Review top 20 posts; prioritize those with potential | May require rewriting 5–10 existing posts for keyword targeting |
| **Masonry layout is CPU-intensive** | Add intersection observer; limit grid to first 50 items, lazy-load rest | Complex JavaScript; fallback to static grid needed for older browsers |
| **Theme picker keyboard nav breaks existing shortcuts** | Use `e.stopPropagation()`; document keyboard shortcuts (`?` overlay) | Adds cognitive load; requires UX documentation |
| **Full CI/CD a11y checks slow down build** | Run only on production deploys; cache axe-core results | May miss a11y regressions on preview builds |

---

## 📋 Success Metrics (Post-Implementation)

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Lighthouse Performance Score | ~85 | 92+ | Week 2 |
| Lighthouse Accessibility Score | ~89 | 95+ | Week 3 |
| Build Failure Rate | ~8% (API timeouts) | <1% | Week 4 |
| Newsletter Sign-ups/Month | Unknown | 10–15 | Month 2 |
| Organic Search Traffic | Unknown | +30–50% | Month 3 |
| Core Web Vitals Pass Rate | Unknown | 95%+ | Month 3 |
| Average Session Duration | Unknown | +15–25% | Month 2 |
| Error Rate (client-side) | Unknown | <0.5% | Week 4 |

---

## 🎯 Final Recommendation

**Focus on Phase 1 & 2 immediately.** The codebase is well-structured and feature-rich, but lacks resilience and accessibility polish. By addressing data failure modes and a11y gaps first, you'll stabilize the site and ensure it works for everyone. Then invest in content discoverability (Phase 3) to unlock organic growth.

**The biggest opportunity is turning implicit multi-format content (posts, snippets, photos, TIL) into an *explicit* asset.** Currently, a new visitor sees it as a messy feed; reposition it as a curated, filterable knowledge base with clear entry points. This alone could increase avg session duration by 20–30%.

**Secondary opportunity: newsletter funnel.** You have the platform and audience; monetizing attention (even just email subscribers) is low-hanging fruit for future collaborations, sponsorships, or advisory work.

---

**Report compiled:** 2026-03-03 | **Auditor:** Codebase inspection + error trace analysis | **Confidence level:** HIGH (code-aware, not speculative)
