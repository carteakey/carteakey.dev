---
name: dependency-audit
description: Audit and fix npm/pnpm dependency vulnerabilities for carteakey.dev (Dependabot alerts, pnpm audit), separating build-time tooling from code that runs in production, then verify the site still builds. Use when GitHub reports vulnerabilities after a push, when asked about security updates, or before a deploy-sensitive release.
---

# Dependency audit

**Status: draft.** The audit command and the findings below are real (run
2026-10-01). The fix steps are the intended workflow and have not been executed
yet; treat them as a plan and verify each upgrade.

## Why now

A push on 2026-10-01 printed: *GitHub found 4 vulnerabilities on the default
branch (3 high, 1 moderate)*. Locally, `pnpm audit --prod` reports **17**
advisories (3 low, 7 moderate, 7 high). The numbers differ because Dependabot
counts alerts and this counts advisories per path; both point at the same set.

## Snapshot (2026-10-01, `pnpm audit --prod`)

| Package | Severity | Vulnerable | Fixed in | Pulled in by |
|---|---|---|---|---|
| sharp | high | < 0.35.4 | >= 0.35.4 | `@11ty/eleventy-img` |
| js-yaml | high | 3.0.0 to < 3.15.2 | >= 3.15.2 | `@11ty/eleventy` |
| undici | high/moderate/low | 7.0.0 to < 7.29.1 | >= 7.29.1 | `eleventy-plugin-toc` (via cheerio) |
| brace-expansion | high/moderate | < 1.1.20 / < 1.1.21 | >= 1.1.21 | `@11ty/eleventy`, `npm-run-all` |
| markdown-it | moderate | < 14.3.1 | >= 14.3.1 | `@11ty/eleventy` |

Almost all of this is **build-time tooling** on a static site. What matters most
is anything that runs per request: the Netlify Functions in `netlify/functions/`
(`upvote`, `reactions`, `newsletter-*`, `web-vitals`) and their imports. Triage
those first.

## Workflow

1. **Audit.**
   ```sh
   pnpm audit --prod
   pnpm audit --prod --json | python3 -c '...'     # group by module, see fix versions and paths
   ```
   Also check Dependabot: `gh api repos/carteakey/carteakey.dev/dependabot/alerts --jq '.[] | {n:.number, pkg:.dependency.package.name, sev:.security_advisory.severity, state:.state}'`
2. **Classify** each advisory: runtime (a function imports it) vs build-time (only
   Eleventy, Tailwind, image processing, tooling). Say which in the report.
3. **Direct dependencies:** `pnpm update <pkg>` (or bump in `package.json`) and
   re-check. `sharp`/`js-yaml`/`markdown-it` are usually reached transitively, so
   look for a newer Eleventy or plugin release that already bumps them first.
4. **Transitive only:** add a `pnpm.overrides` entry in `package.json` pinning
   the patched range (e.g. `undici`: `>=7.29.1`), then `pnpm install`. Keep each
   override commented in the commit message; remove it once the parent updates.
5. **Verify, in order:**
   - `node utils/check-version.mjs && npm run check:content && npm run check:design`
   - Test build into a scratch dir (never over a running dev server):
     `npx eleventy --output=$SCRATCHPAD/site-test --quiet`, and confirm key pages built.
   - If `sharp` or `markdown-it` moved, spot-check images and rendered markdown
     with the `visual-check` skill. Image-pipeline changes are the likeliest to
     alter output.
   - Re-run `pnpm audit --prod` and compare counts.
6. **Record:** a line in `docs/CHANGELOG.md`, bump `versions.json` and
   `package.json` together, commit with `commit-batches`. `pnpm-lock.yaml` is part of
   the change.

## Rules

- Do not run `pnpm audit fix` blindly or upgrade major versions of Eleventy or
  Tailwind in a security pass; those are separate migrations.
- Never lower a security floor to make the build pass.
- If a fix is not available, say so and record the advisory and why it is
  acceptable (build-time only, not reachable) rather than hiding it.
