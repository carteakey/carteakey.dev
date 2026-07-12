---
name: update-model-list
description: >
  Research the latest agentic and coding models, coding subscriptions, and API
  pricing, then generate a complete replacement `models.yaml` file for the site.
  Use this when the model landscape shifts or the user asks to update the list.
---

# Update Agentic Coding Model Tier List

Research the latest coding and agentic AI models, subscriptions, and API pricing, then generate a complete replacement `src/_data/models.yaml` file.

## When to Use

- Update the coding model tier list
- Refresh model rankings
- Add newly released models
- Update coding subscription offerings
- Update API prices
- Regenerate `data/models.yaml`
- Check whether the current model list is outdated

## Primary Output

Return one complete YAML document suitable for saving as `src/_data/models.yaml`.

Do not return a patch, diff, explanation, markdown code fence, preamble, or summary. Output YAML only.

## Research Requirements

Prefer sources in this order:

1. Official model announcement pages
2. Official API documentation
3. Official pricing pages
4. Official product or subscription pages
5. Official model cards or repositories
6. Independent benchmarks and reputable technical reporting

Use third-party sources only when official sources do not provide enough information. Never rely only on search-result snippets.

## Scope

Research the most relevant current models for:

- Agentic software development
- Autonomous repository work
- Code generation, debugging, refactoring
- Terminal and tool use
- Long-running coding tasks
- Code review
- Local or open-weight coding agents

Also research coding products and subscriptions such as:

- ChatGPT and Codex
- Claude Code
- Cursor
- GitHub Copilot
- Windsurf
- Google coding products
- OpenRouter
- Hosted open-model providers
- Other major coding-agent services

Do not include every available model. Include models that are currently important, competitive, widely used, unusually good value, or useful for a distinct coding use case.

## Editorial Ranking Rules

Assign each model to one of these tiers: `S+`, `S`, `A`, `B`, `C`.

Use practical editorial judgment. Do not calculate a weighted numerical score.

Consider:

- Real coding quality
- Ability to complete multi-step tasks
- Agent reliability
- Terminal and tool use
- Performance on existing repositories
- Debugging ability
- Quality of multi-file changes
- Context handling
- Speed
- API cost
- Availability
- Open-weight or self-hosting value
- Quality of available coding harnesses

Benchmarks are supporting evidence only. Do not rank models exclusively by any single benchmark. Recognize that the coding harness can materially affect model performance.

### Tier Guidance

| Tier | Meaning |
|------|---------|
| S+ | Best available. Frontier-level coding ability and strong long-task reliability. |
| S | Excellent daily drivers with few meaningful weaknesses. |
| A | Strong, useful models but less consistently capable than top tiers. Good value options and open-weight models belong here. |
| B | Good for budget use, subagents, routine coding, local use, or narrower tasks. |
| C | Outdated, limited, highly inconsistent, or relevant only to narrow use cases. Avoid filling this tier unless there is a useful reason to retain a model. |

## Field Rules

- `id`: lowercase kebab-case
- `name`: official public model name
- `tier`: one of `S+`, `S`, `A`, `B`, `C`
- `rank`: integer starting from `1` within each tier (no duplicates)
- `verdict`: one concise sentence stating the practical reason to choose the model
- `best_for`: 1-4 concise use cases
- `strengths`: 1-4 concise strengths
- `weaknesses`: 1-4 meaningful limitations (do not write generic weaknesses)
- `context_window`: integer from official docs; `null` when unverifiable
- `api_available`: `true` only for documented generally available APIs
- `open_weights`: `true` only when downloadable weights are officially available (API access does not count)
- `speed`: one of `very-fast`, `fast`, `medium`, `slow`, `very-slow`, `unknown`
- `price_level`: one of `free`, `very-low`, `low`, `medium`, `high`, `very-high`, `unknown`
- `api_pricing`: standard public list pricing per 1M tokens in USD. Use `null` for unavailable pricing. Do not mix batch, fine-tuning, subscription, promotional, enterprise, or third-party pricing.
- `effective_date` / `last_verified`: format `YYYY-MM-DD`
- `sources`: include at least one official source per entry. Use direct URLs, not search URLs.

### Writing Style

Keep all text concise and practical. Avoid marketing language. Do not repeat the same wording across many models. Avoid unsupported claims like "best in the world" or "state of the art."

### Handling Uncertainty

When information cannot be verified: use `null`, `unknown`, or briefly note uncertainty. Do not guess or copy unverified rumours. Distinguish announcement, preview, waitlist, and general availability.

## Service Rules

Separate models from services — a service may expose multiple models and may be good value even without the absolute best model.

- `monthly_price`: standard individual paid plan most relevant to coding. Use `null` for no fixed fee. Create separate entries for distinct tiers.
- `models`: list only models explicitly offered or documented. Do not infer.
- `usage_summary`: briefly describe practical usage allowances. Do not invent exact limits when not published.
- `interfaces`: use values like `Web`, `IDE`, `CLI`, `Desktop`, `API`
- `byok`: `true` only when users can supply their own API key
- `best_for`: one concise sentence
- `limitation`: most important practical drawback

## Pricing Rules

- Verify the official pricing page for every model and service
- Confirm prices are per million tokens
- Distinguish input, cached input, and output pricing
- Use `null` when cached-input pricing is not documented
- Record verification date
- Do not estimate monetary value of usage limits
- Use the currency displayed by the official provider

## Source Quality Rules

At least half of all sources should be official provider sources. Avoid SEO comparison pages, AI-generated summaries, unverified spreadsheets, social-media claims, Reddit comments as factual sources, and old launch articles when newer documentation exists.

## Validation Checklist

Before returning YAML:

1. YAML parses successfully
2. All required top-level keys exist
3. Every model has a valid tier
4. Rankings restart at `1` within each tier
5. Model IDs are unique
6. Service IDs are unique
7. Every URL is valid and direct
8. Every factual price has an official source
9. Dates use `YYYY-MM-DD`
10. Missing info uses `null` or `unknown`
11. No model or service is duplicated
12. Subscription prices are not in API-pricing fields
13. API prices are per 1M tokens
14. No markdown code fences
15. Response contains YAML only

## YAML Schema

Use the existing schema from `src/_data/models.yaml` with these top-level keys: `meta`, `tiers`, `providers`, `models`, `services`.

## Output Rule

Return the complete replacement YAML document and nothing else.
