# Performance Monitoring

The site records sampled Core Web Vitals through a small first-party browser script and a Netlify Function. It sends only the metric name, value, rating, and URL path. It does not send IP addresses, user identifiers, query strings, page content, or browser storage.

## Configuration

The function reuses the Upstash Redis credentials already required by views and upvotes:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional build variables:

- `WEB_VITALS_ENABLED=false` disables the browser collector.
- `WEB_VITALS_SAMPLE_RATE=0.1` controls the fraction of page views sampled. Values are clamped between `0` and `1`.

## Stored data

Daily metric hashes use `web-vitals:YYYY-MM-DD:LCP`, `:CLS`, and `:INP`. They contain a count, scaled sum, and rating counts. Route counts live in `web-vitals:YYYY-MM-DD:routes`. All keys expire after 120 days.

CLS sums use a scale of 100,000; LCP and INP are stored in milliseconds. Divide `sumScaled` by the scale and then by `count` to calculate the daily mean. The rating buckets are more useful than the mean for a quick health check.

Localhost is never sampled. Live verification therefore requires a Netlify deploy with the Upstash variables configured.

## Monthly synthetic audit

`.github/workflows/lighthouse.yml` runs Lighthouse CI (`lighthouserc.cjs`) against the homepage, writing archive, Now page, and the gpt-oss post on the first day of each month. It can also be started manually. Each URL gets three runs; LHCI marks the median as representative. HTML and JSON reports are retained as GitHub Actions artifacts for 90 days.

After the run, `utils/lighthouse-history.mjs` appends the representative scores, LCP, CLS, and TBT per page to `src/_data/lighthouse.json` and the workflow commits it back to `main`, so `/stats/` shows the latest run and a sparkline per category. The same script writes a digest of failing audits to the job summary: start fixes there. Failing assertions don't stop the history from being recorded.

Scores are mobile emulation with simulated throttling, so they run lower than a desktop DevTools run. The old 2025-10-04 manual figures (94/95/100/91) were desktop and aren't comparable; they were dropped.

Run the same audit locally with `pnpm audit:lighthouse`, then `node utils/lighthouse-history.mjs --source "..."` to record it. Without Chrome installed, point `CHROME_PATH` at Playwright's Chromium (`~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome`). The command audits the deployed production site, not the local build.

## Build-time Lighthouse

`.github/workflows/build.yml` also runs `lighthouserc.ci.cjs` against the built `_site/` on every pull request and push to `main`. It is warn-only: CI has no secrets, so pages render fallback data. Its budgets (JS, CSS, font and total bytes, TBT, CLS) sit just above the 2026-10-17 measurements and work as a ratchet: lower them as fixes land, never raise one to quiet a warning.
