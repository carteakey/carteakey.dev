# Local LLM Optimization Guide Roadmap

Status: active  
Started: 2026-06-22  
Primary guide: `src/posts/local-inference/2026-06-12-local-llm-optimization.md`

This roadmap turns the useful parts of the June 2026 LocalLLaMA feedback into scoped work. The guide is based on one consumer CUDA machine, so claims should stay close to either upstream documentation or measurements from that machine.

## Evidence labels

New and revised guidance should make its evidence level obvious:

- **Tested here:** measured on the RTX 4070 12GB / i5-12600K / 32GB DDR5-6000 L3MS node.
- **Upstream behavior:** documented or implemented by current llama.cpp.
- **Needs testing:** plausible or community-reported, but not yet promoted into a recommendation.

## Phase 1: factual cleanup and scope

- [x] Keep the established title and narrow the description/opening scope to consumer CUDA hardware.
- [x] Update vision fitting guidance after llama.cpp PR #21489 added mmproj memory to `--fit` calculations.
- [x] Reframe the 2-3x XMP result as a one-machine failure case, not a normal uplift.
- [x] Treat `GGML_CUDA_GRAPH_OPT` as an A/B test rather than a default.
- [x] Remove `LLAMA_SET_ROWS`; current upstream no longer reads the environment variable.
- [x] Separate target KV (`-ctk` / `-ctv`) from draft KV (`-ctkd` / `-ctvd`) and keep the f16 warning specific to the tested Gemma configuration.
- [x] Make q8 the default KV recommendation; describe lower precision as measured-risk territory.
- [x] Replace “zero marginal cost” with an electricity-aware statement.

## Phase 2: high-value additions

- [x] Add n-gram speculative decoding testing recipes, including MTP + n-gram combinations, without publishing speedup claims before L3MS benchmarks exist.
- [x] Add a real coding-workload section covering TTFT, PP, TG, prompt-cache hits, draft acceptance, tool calls, and long-session stability.
- [x] Add a controlled `--ubatch-size` sweep instead of a universal value.
- [x] Add a multi-GPU primer covering layer, deprecated row, and experimental tensor splitting without presenting one tensor ratio as universal.
- [x] Add ROCm/HIP and `GGML_BACKEND_DL` to the backend/build sections.
- [x] Extend CUDA architecture guidance and link upstream rather than relying on a permanently complete card table.
- [x] Add imatrix/IQ quant guidance, including the quality/context cost of fitting dense 27B-class models into 12GB.

## Phase 3: editorial pass

- [ ] Run the research/image prompt loop section by section: gather primary sources, source charts, licensing notes, and useful visual ideas; reconcile each section against the current guide; then optimize for brevity and accessibility.
- [ ] Trim generic cloud/local and glossary material that repeats common knowledge.
- [ ] Add a shorter human reading path for OOM, slow PP, slow TG, speculative decoding, and multi-GPU.
- [ ] Replace universal prescriptions with evidence labels and exact tested configurations.
- [ ] Cut repeated explanations and any prose that reads like generated connective tissue.

## Phase 4: L3MS/dashboard follow-up

- [ ] Add PP, TG, tested context, cache state, draft acceptance, llama.cpp commit, and benchmark command to each published profile.
- [ ] Add a separate community-runs schema for 24GB, dense 27B, AMD, Apple Silicon, and multi-GPU submissions.
- [ ] Never mix community results into the local RTX 4070 ranking without a hardware/source label.

## Deferred until evidence improves

- DFlash and Eagle3 recipes.
- Server-motherboard, multi-socket, and datacenter tuning.
- A larger ik_llama.cpp section.
- Universal values for ubatch, tensor split, CUDA graphs, or KV precision.

## Primary upstream references

- llama.cpp multimodal fitting: <https://github.com/ggml-org/llama.cpp/pull/21489>
- Speculative decoding: <https://github.com/ggml-org/llama.cpp/blob/master/docs/speculative.md>
- Server flags: <https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md>
- Multi-GPU: <https://github.com/ggml-org/llama.cpp/blob/master/docs/multi-gpu.md>
- Build backends: <https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md>
