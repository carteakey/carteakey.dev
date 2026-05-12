# carteakey.dev Audit: Quick Reference Checklist

## 🚀 DO THIS WEEK (Estimated: 6–7.5 hours)

### Day 1: API Reliability (2h)
```
[ ] src/_data/spotify.js → wrap in try-catch, export fallback
[ ] src/_data/strava.js → wrap in try-catch, export fallback
[ ] src/_data/steam.js → wrap in try-catch, export fallback
[ ] src/_data/upvotes.js → wrap in try-catch, export fallback
[ ] src/_includes/layouts/base.njk → add error state UI
```

### Day 2: SEO & Metadata (1h)
```
[ ] src/index.njk → add description: "..."
[ ] src/projects.njk → add description: "..."
[ ] src/archive.njk → add description: "..."
[ ] src/stats.njk → add description: "..."
[ ] src/robots.txt.njk → create file, disallow /stats, /changelog, /now/archive
```

### Day 3: Performance & A11y (2h)
```
[ ] src/index.njk line 12 → add loading="lazy" decoding="async" to hero image
[ ] Convert headshot PNG to AVIF with PNG fallback
[ ] src/_includes/layouts/post.njk → add aria-busy to upvote button
[ ] src/archive.njk, src/feed.njk, src/snippets.njk → add focus-ring to inputs
[ ] src/_includes/components/breadcrumbs.njk → show on mobile (truncate last 2)
```

### Day 4: Forms & Styling (1.5h)
```
[ ] src/newsletter.njk → add success redirect to /newsletter/success?email=...
[ ] src/_includes/components/feed-card.njk → extract to card-base mixin
[ ] archive.njk, snippets.njk, feed.njk → use unified card styling
```

---

## 📚 THIS MONTH (Estimated: 10–15 days)

### Week 2: Accessibility (3–5 days)
```
[ ] Run axe-core audit on all pages
[ ] Fix dark mode contrast (target 4.5:1 on all text)
[ ] Add focus-visible: outline to all interactive elements
[ ] Theme picker: add @keydown.left @keydown.right support
[ ] Add aria-label to theme picker buttons
[ ] Add aria-describedby to form errors
[ ] Audit & fix missing alt text on 50+ feed images
```

### Week 2–3: Content Discoverability (2–3 days)
```
[ ] src/feed.njk → add persistent filter sidebar (mobile-collapsible)
[ ] eleventy.config.mjs → add readingTime filter (reading-time npm pkg)
[ ] Feed type chips → show count: "Posts (42)", "Snippets (18)", etc
[ ] Add full-text search to /feed/ (native input + client-side filter or Lunr.js)
[ ] Link all content types from nav: /blog, /snippets, /til, /reading, /photos
```

### Week 3–4: Reliability & Conversion (2–3 days)
```
[ ] src/_utils/fetchWithFallback.js → create centralized API wrapper
  - 5-second timeout per call
  - Auto-fallback to cache
  - Error logging (Sentry optional)
  - "Stale data" badge
[ ] All _data/*.js → refactor to use fetchWithFallback
[ ] Create /status page (show last-fetch time per integration)
[ ] src/index.njk → add sticky "Subscribe" button + email micro-form
[ ] Create /newsletter/success page with social share CTA
```

---

## 📊 THIS QUARTER (Estimated: 20–25 days)

### Month 2: SEO & Content (2–3 days)
```
[ ] Expand JSON-LD BlogPosting schema (add articleBody, wordCount, readingTime)
[ ] Create generateTOC filter for posts > 1500 words
[ ] Add sticky TOC sidebar to post layout
[ ] Audit & rewrite meta descriptions (120–160 chars on 20+ posts)
[ ] Add "Read next" section to post.njk (related by tags)
[ ] Internal link audit: blog ↔ projects ↔ snippets cross-linking
[ ] Create /sitemap-index.xml (separate sitemaps for posts, snippets, static)
[ ] Add canonical tag logic for duplicate content
```

### Month 2: Monitoring & Polish (2–3 days)
```
[ ] Set up Core Web Vitals monitoring (PageSpeed API or web.dev API)
[ ] Add monthly Lighthouse check to GitHub Actions
[ ] Create /status dashboard (API health, build success rate, perf metrics)
[ ] Add error logging (Sentry.io free tier or LogRocket)
[ ] Newsletter tracking: Netlify Analytics or custom Redis counter
[ ] Cache busting: add ?v={{ now | date('yyyyMMddHHmmss') }} to CSS/JS
```

---

## 📈 Expected Outcomes by Timeline

| Timeframe | Metric | Current → Target |
|-----------|--------|------------------|
| Week 1 | Build reliability | 92% → 98% |
| Week 1 | SEO (meta descriptions) | Incomplete → 100% |
| Week 2 | Lighthouse Accessibility | ~89 → 95+ |
| Week 3 | Content session duration | ? → +15–25% |
| Week 4 | Newsletter sign-ups/mo | ~0 → 5–10 |
| Month 2 | Organic search traffic | ? → +20–30% |
| Month 3 | Core Web Vitals pass % | ? → 95%+ |
| Month 3 | Organic search traffic | ? → +30–50% |

---

## 🎯 Success Criteria (How to Know It Worked)

✅ **Site is Stable**
- Build failure rate < 1%
- No broken images/scripts on homepage
- API failures show graceful fallback

✅ **SEO Improved**
- Lighthouse SEO score 95+
- Meta descriptions on all pages
- robots.txt excludes low-value pages

✅ **Better UX**
- WCAG AA compliance (axe-core audit passes)
- Session duration up 15–25%
- Feed page has working filters + search

✅ **Conversions Growing**
- 10–15 newsletter sign-ups/month
- /newsletter/success page has 50%+ completion
- Click-through rate on related posts > 5%

---

## 🔧 Files to Modify (By Priority)

### Must Fix (Phase 1)
1. `src/_data/spotify.js` - add error handling
2. `src/_data/strava.js` - add error handling
3. `src/_data/steam.js` - add error handling
4. `src/_data/upvotes.js` - add error handling
5. `src/_includes/layouts/base.njk` - add fallback UI + aria labels
6. `src/index.njk` - add description + meta + image optimization
7. `src/robots.txt.njk` - create new file

### Should Fix (Phase 2)
8. `src/feed.njk` - add filters + search
9. `src/archive.njk` - unify card styling + add focus states
10. `src/snippets.njk` - unify card styling + add focus states
11. `eleventy.config.mjs` - add readingTime filter
12. `src/_includes/layouts/post.njk` - add aria-busy + JSON-LD expansion
13. `src/newsletter.njk` - add success redirect

### Nice-to-Have (Phase 3)
14. `src/_utils/fetchWithFallback.js` - create wrapper (new file)
15. `src/_includes/components/card-base.njk` - create mixin (new file)
16. Create `/status` page (new file)
17. Create `/newsletter/success` page (new file)

---

## 💡 Pro Tips

**API Error Handling Pattern:**
```javascript
// In src/_data/spotify.js
export default async function() {
  try {
    const data = await fetch(...);
    return { nowPlaying: data.track };
  } catch (error) {
    console.error('Spotify API failed:', error.message);
    return { 
      nowPlaying: null, 
      error: true, 
      fallback: 'Spotify unavailable' 
    };
  }
}
```

**Fallback UI Pattern:**
```html
<!-- In src/_includes/layouts/base.njk -->
{% if spotify.error %}
  <a ... title="Now playing (unavailable)" class="opacity-50 cursor-not-allowed">
    {% feather "music", class="w-4 h-4" %}
  </a>
{% else %}
  <!-- normal link -->
{% endif %}
```

**Meta Description Template (120–160 chars):**
```
Home page: "I'm a data analyst from Toronto who writes about AI, data science, and self-hosting. Explore my blog, snippets, and projects."

Projects: "Explore my open-source projects and side hustles. GitHub contributions, demos, and source code for all personal projects."

Blog: "Articles and tutorials on Linux, AI, data science, machine learning, and technology. Browse by topic or read my latest posts."
```

---

## 📞 Questions?

**Unclear on implementation?** Check:
- Full report: `docs/AUDIT_REPORT.md`
- Summary: `docs/AUDIT_SUMMARY.md`
- Source files referenced in each recommendation

**Need help?**
- Accessibility: Use axe DevTools extension + WAVE (WebAIM)
- SEO: Use Lighthouse CLI, Google Search Console, SEMrush
- Performance: Use DevTools Performance tab + WebPageTest
- Data: Mock failing APIs in development, test fallback UI

---

**Last Updated:** 2026-03-03  
**Status:** Ready to implement  
**Estimated Total Effort:** 40–50 hours over 2 months
