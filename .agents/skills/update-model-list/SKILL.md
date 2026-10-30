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

Research and maintain the most relevant, current models for:

- Agentic software development and autonomous repository work
- Code generation, architecture, debugging, and multi-file refactoring
- Terminal and tool use in agent loops
- High-TPS daily drivers and rapid subagent loops (e.g. Antigravity, Gemini CLI, Claude Code, Codex)
- Long-running autonomous tasks and multi-agent coordination
- Local or open-weight inference on consumer hardware (e.g. Strata, llama.cpp, llama-swap)

Also research and audit coding services, subscriptions, and tools:

- ChatGPT and Codex (OpenAI)
- Claude Code and Claude Workspaces (Anthropic)
- Antigravity and Gemini CLI (Google DeepMind)
- Cursor, Windsurf, and Copilot
- OpenRouter and hosted open-weight providers

Do not include every available model. Include only models that are currently important, competitive, widely used, unusually good value, or serve a distinct agentic use case.

## Generational Auditing & Zero-Zombie Rules

The tier list must always reflect the **active frontier generation**. It is an authored, high-signal editorial tool, never an additive graveyard of past releases.

### 1. Generational Wave Checks (Mandatory Per Provider)
Before editing the roster, systematically audit each provider's active generation:
- **OpenAI**: Flagship line is `GPT-6` / `GPT-6.1` (`GPT-6 Astra` in S+, `GPT-6.1 Sol` in S, `GPT-6 Luna` in B). Verify exact names against the official model catalog; GPT-6.1 Terra is a distinct model (https://developers.openai.com/api/docs/models/gpt-6.1-terra). When `GPT-6` is active, immediately purge all legacy `GPT-5.x` models. Never leave previous generation variants lingering in the tiers.
- **Anthropic**: Flagship line is `Claude 5.5` (`Claude Opus 5.5`, `Claude Sonnet 5.5`, `Claude Haiku 5.5`) alongside reasoning frontier `Claude Fable 5.1`. Purge legacy `Opus 5`, `Sonnet 5`, `Haiku 4.5`, and older `Fable 5`.
- **Google DeepMind**: Flagship high-TPS line is `Gemini 3.8` (e.g. `Gemini 3.8 Flash`). Purge superseded `Gemini 3.6` and `3.5` iterations.
- **Alibaba**: Flagship line is `Qwen 3.8` (`Qwen3.8-Flash-Next`, `Qwen3.8-27B`). Purge older `Qwen 3.7` and `3.6` generations.
- **Zhipu / Z.ai**: Flagship open model is `GLM-5.3`. Purge `GLM-5.2` and older checkpoints.
- **Moonshot AI**: Flagship open frontier model is `Kimi K3`. Purge `Kimi K2.7 Code` and predecessors.
- **DeepSeek**: Flagship generation is `DeepSeek V4` (`DeepSeek V4 Pro`, `DeepSeek V4 Flash`).

### 2. Cross-Repository Ground Truth Checks
Always check the repository's own ground truth before finalizing rankings:
- Inspect `src/snippets/` for live developer tooling and catalog fixes (e.g. `codex-missing-models-old-app-server.md` tracking `GPT-6.1 Sol`).
- Inspect `src/notes/` for active author feedback on model speed, lingo, and workflow ergonomics (e.g. `tps-over-quality.md`, `opus-5-5-and-wait-what.md`, `recursive-self-improvement-in-small-models.md`).
- Inspect `src/posts/local-inference/` and `src/_data/uses.yaml` for real homelab benchmarks on consumer hardware (`yeti-cachy`: RTX 4070 12GB VRAM, DDR5 hugepages, Strata / llama-swap).

### 3. Strict Pruning Protocol
- **Immediate Predecessor Replacement**: When a point release or major generation ships (e.g. GPT-6 Luna replacing GPT-5.6 Luna; Sonnet 5.5 replacing Sonnet 5), replace it cleanly. Do not keep both unless they serve genuinely distinct, active developer tasks.
- **Eliminate Stale Previews**: Drop unreleased or non-production previews once general production models exist.
- **Prune Dead Tiers**: If a tier (e.g. Tier C or D) has no active models, remove it entirely from `tiers`. The UI should remain dense, squarish, and focused.

### 4. Triangulation Against Public Benchmarks (Artificial Analysis Intelligence Index)
Always cross-reference and calibrate the tier list against major public composite benchmarks, particularly the **Artificial Analysis Intelligence Index** (e.g. v4.3.2, 10-evaluation composite including Terminal-Bench 4.0, AA-Briefcase, GDPval, etc.):
- **Benchmark Ground Truth Check**: Check composite scores as an objective anchor:
  - `Claude Opus 5.5`: 58 (max effort with fallback)
  - `Claude Sonnet 5.5`: 56 (max effort with fallback)
  - `Claude Fable 5.1`: 53 (max effort with fallback)
  - `GPT-6 Astra`: 53 (max effort)
  - `GPT-6.1 Sol`: 52 (max effort)
  - `GLM-5.3-Flash`: 42
  - `Gemini 3.8 Flash`: 41 (high effort)
  - `Qwen3.8-Flash-Next`: 40
  - `DeepSeek V4.1 Flash`: 39
  - `Qwen3.8 27B`: 34
- **Availability Filter**: Public benchmarks test unreleased lab models (e.g. `Gemini 4 Argon` at 53 marked "Not publicly available"). Do NOT rank unreleased models until they have generally available APIs or downloadable weights.
- **Reasoning Effort & Latency Tradeoffs**: High scores on max effort (e.g. Opus 5.5 with fallback at 58) carry high latency and token cost. Daily drivers (S Tier) like Sonnet 5.5 (56) and Gemini 3.8 Flash (41) often deliver vastly superior developer velocity in interactive IDE/CLI loops than max-effort models.
- **Editorial Divergence Rationale**: When editorial ranking departs from raw composite score order (e.g., placing Gemini 3.8 Flash in S tier due to unmatched TPS and Antigravity tooling, or ranking GLM-5.3 Flash prominently in A tier), document the specific developer workflow reasoning.

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

## Personal perspective and subscription tiers

- Research the author's recent notes, posts and usage data before assigning default model and subscription tiers. Treat dated firsthand experiences as editorial evidence, not timeless facts or a substitute for current plan and price verification.
- On October 28, 2026, the author placed Google AI Pro, Claude Pro, ChatGPT Plus and OpenCode Go in S, and said ChatGPT Plus base usage had worsened but frequent resets still made it worthwhile. Reassess these opinions when newer evidence is available.
- The July 2026 [Codex value note](/notes/codex-best-value/) favors ChatGPT Plus for the author's personal coding workflow. The September 2026 [Opus 5.5 note](/notes/opus-5-5-and-wait-what/) values its more direct bug explanations. Revisit these views against newer writing and current usage before carrying them forward.
- Assign each subscription a `tier` matching the site's tier IDs (`s-plus`, `s`, `a`, `b`), separately from model rankings. Judge practical coding access, limits, price and personal fit; clearly identify provisional judgments and cite the basis. Keep pay-as-you-go services distinct from fixed-price subscriptions in their descriptions.
- Maintain the separate bang-for-the-buck board: assign `value_tier` and a concise `value_reason` to models with a verifiable listed API price. Weigh coding usefulness, cost, speed and local options; do not fabricate prices or present subjective tiers as measured benchmarks. Preserve verification dates and source links.
- Treat the board as an editable starting opinion. Never imply an unverified personal experience or present one person's ranking as a universal benchmark.

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
