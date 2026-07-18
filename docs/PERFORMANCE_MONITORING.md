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

`.github/workflows/lighthouse.yml` runs Lighthouse CI against the homepage, writing archive, and Now page on the first day of each month. It can also be started manually. HTML and JSON reports are retained as GitHub Actions artifacts for 90 days.

Run the same audit locally with `pnpm audit:lighthouse`. The command audits the deployed production site, not the local build.
