# Overfit inference post fact-check, 2026-10-03

Scope: the overfit inference essay and its new technical draft, `src/posts/local-inference/2026-10-03-strata-on-an-rtx-4070.md`. Detailed source corrections live in the draft; the essay retains only the observation, axioms, and essential evidence limits. The edit preserves its first-person voice, using the repo's human-writer and humanizer skills and documented post primitives. No inference service was stopped or benchmark run launched.

## Evidence checked

- Local L3MS `vendor/strata/strata-iq3_xxs.log`, especially the sweep beginning with `prompt 462 tokens = 457 reused + 5 read` and ending with `prompt 59787 tokens`.
- Local `vendor/strata/long_horizon_results.json` and `bench-models/bench_strata_long_horizon.py`.
- Local Strata configuration, `src/program/generate.cpp`, and the dirty vendor checkout at `30ec18ec7094550fcc594fd948220d511d80464e`.
- L3MS serving YAML, fitting notes, and five-question quality smoke results.
- [Official Qwen model card](https://huggingface.co/Qwen/Qwen3.8-Flash-Next), [GSQ-RCO card](https://huggingface.co/ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF), [SN770 product brief](https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/western-digital/product/internal-drives/wd-black-ssd/product-brief-wd-black-sn770-nvme-ssd.pdf), and [speculative decoding paper](https://arxiv.org/abs/2211.17192).
- All six runtime repositories linked in the post, including DwarfStar's expanded models and RDMA support.

The published sanitized evidence extract is `src/posts/local-inference/overfit-inference-evidence.json`. It contains metrics and matching server log lines, without authorization headers, credentials, or response text.

## Feedback disposition

| Claim in feedback | Finding and edit |
| --- | --- |
| Miss rate is per expert lookup | Correct. 48 layers × 10 routed experts = 480 lookups per evaluated token; 25% misses averages 120 lookups, not 25% of tokens. |
| Fewer bytes alone explains throughput | Unsupported. Changed to a hypothesis about moving expert math off the CPU and reducing coordination/latency; no counter profile claimed. |
| llama.cpp baseline may be naive layer offload | Correct concern. Actual declaration uses fitting; MTP uses `-ngl 99 -ncmoe 46`. CPU expert GEMMs are now explicit. |
| Strata misses always stream over PCIe | Also too strong. Source divides miss work between CPU and a PCIe GPU path. Startup probe chose a 0.14 share in this run. |
| Static vs dynamic residency | Both: profile-seeded, followed by per-layer frequency-based adaptation with decayed counts. Current defaults: four rounds, up to 96 swaps, counts × 0.7. Startup's no-eviction message describes initial admission. Exact binary provenance remains incomplete. |
| Cold-arena arithmetic | Original figures were GiB mislabeled GB. 39.97 GiB is the full host arena in this run, including GPU duplicates; mixed per-layer quant types make a single average expert size approximate. |
| Host headroom and mmap footprint | Corrected screenshot arithmetic; distinguished used RAM from available RAM and reclaimable file cache. |
| Flat VRAM due to K8V4 | Quantization reduces capacity; source allocates state using configured max context. Preallocation explains flatness. Last two device-wide samples weren't saved independently. |
| 21 t/s row is cold/warmup | Actual cause is prefix reuse: only five tokens read in 238 ms. Excluded from prefill comparison. |
| 76.5% hit rate at 60k | Wrong in both article and feedback: 76.5% belongs to 30k; matching 60k line reports 73.8%. Short reused row is 74.1%. |
| 100% retrieval | Saved JSON has `needle_found: false` at 3,779 prompt tokens. Deeper response text wasn't retained in the inspected artifacts. Corrected rather than interpreting a false check as a proven retrieval failure. |
| Run counts and variance | One recorded request per row, no within-row variance. Restored the omitted 10,709-token row. |
| Native MTP is the only speculation | Prompt lookup is also enabled and logged. Added this attribution confound. |
| Greedy / random seeds / ~55% | Corrected exact-sampling explanation; removed unsupported acceptance uplift and universal greedy recommendation. Qwen evaluates agentic coding with sampled settings. |
| Apples-to-apples ~2× speedup | Arithmetic is right, but comparison still isn't apples-to-apples: quants, context, draft heads, and sampling history differ. Lede says complete serving-setup comparison. |
| Run cache-only ablation | Not performed. This native IQ path explicitly rejects `--spec 0` and the serving path requires MTP. Needs a verified non-speculative path with prompt lookup disabled too. No alternate quant substituted to manufacture an ablation. |
| Quality parity | Five-question smoke coverage doesn't establish it. Upstream cache parity is Q2_0/5070, not this setup. Added explicit missing teacher-forced perplexity/KL and longer task checks. |
| THP acceleration | Dirty source contains patch, but benchmark startup reports 4 KB fallback. Removed causal credit without a matched page-size measurement. |
| Trust and versions | Added checkout, dirty patches, flags, and missing binary/build-manifest provenance. A source build is not an audit. |
| General engines as parts bin / n=1 | Incorporated. Broader runtime performance remains self-reported. |
| Prediction / Paiton / analogy / labels | Made abandonment bet checkable by April 2027; removed unsupported Paiton attribution, shortened analogy, corrected Cline name, and removed hype labels. |

## Outstanding experiments

These remain research gaps, not completed measurements: same-quant runtime quality comparison, non-speculative cache ablation, repeated independent context runs with unique prefixes, longer sampled agent tasks, multiple needle positions with retained outputs, and CPU/GPU profiling. Publishing the existing harness unchanged would also expose a hardcoded credential; the post links its intended directory and explicitly notes the incomplete public reproduction bundle.

## Editorial split

Following the author's direction, the technical sections and throughput chart now live in the new draft `2026-10-03-strata-on-an-rtx-4070.md`. The existing Qwen companion post was not edited. The essay retains the measured setup comparison, its essential caveat, the runtime survey, and the axioms.

New draft thumbnail: `src/static/img/blog-sketches/unique/strata-on-an-rtx-4070-stamp-trim.png`, generated with the built-in ImageGen tool under the repo's sketch guidance. Prompt: pure monochrome black ink/4B pencil on transparent background; consumer graphics card beside an open sorting tray containing a few cached chips and a larger chip pile, with a RAM stick and stopwatch; strong contours, tight composition, no text, logos, colors, frame, or paper backdrop. The raw generated output remains in the default generated-images directory.
