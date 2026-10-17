# agentcart (`/ask/`)

A terminal on the site that answers questions about carteakey.dev from its published pages, styled after a coding-agent CLI. A block-art shopping cart with eyes is the mascot; it also lives in the header as a blinking 16px icon.

## Pieces

| File | Role |
|---|---|
| `src/ask.njk` | The page: terminal markup, welcome box, mascot |
| `src/static/js/ask-terminal.js` | Terminal behaviour: streaming, spinner, slash commands, mascot, context meter, easter eggs |
| `src/static/css/tailwind.css` (`.term-*`, `.nav-ask*`) | Styles. Always dark, one accent, square corners |
| `src/ask-corpus.njk` + `utils/ask-corpus.mjs` | Builds `/ask/corpus.json` at build time |
| `netlify/edge-functions/ask.js` | `POST /api/ask`: rate limit, queue, retrieval, model routing, NDJSON stream |
| `utils/ask-dev-server.mjs` | Local stand-in for `netlify dev` |

## How a question is answered

1. **Rate limit** (Upstash): 12 questions per IP per fixed 3-hour UTC window, 500 per day site-wide. Over the per-IP limit the page shows "You've hit your limit · resets 5pm" and pitches agentcart Max ($1,000,000/mo). Over the daily cap it fakes an `API Error: 529`.
2. **Retrieval**: BM25 over the inverted index in `/ask/corpus.json`. Small talk ("hey", "huh interesting") skips search. Questions about Kartikey always pin the About page's opening chunks, because the page never uses his name. Short follow-ups borrow the previous question's words.
3. **Queue**: at most 5 answers stream at once; later visitors see `Queue position: #n` and give up after 90 s.
4. **Routing**: hops in `ASK_ROUTE` order, each with a time-to-first-token budget, not a total budget: OpenRouter free models (7 s), NVIDIA Nemotron (8 s), then the local llama-swap box through a tunnel (30 s, since it may have to load the model). A failed hop shows struck-through in the transcript. If all fail: "Sorry, the inference you have reached is not in service."
5. **Answer**: streamed as NDJSON events (protocol in the header comment of `ask.js`), at most 900 tokens.

It is an edge function on purpose: Netlify cuts streamed serverless responses at 10 s. Edge functions count CPU time (50 ms), not time spent waiting on a model, and the stream's headers go out immediately, inside the 40 s header timeout.

## Environment

Nothing is on until a hop is configured: with no hop keys, `/api/ask` is a 404 and the page says the cart is unplugged.

| Variable | Purpose |
|---|---|
| `ASK_OPENROUTER_API_KEY` | OpenRouter key for agentcart only. Deliberately not `OPENROUTER_API_KEY`, so visitors can't spend the quota QOTD builds with |
| `ASK_OPENROUTER_MODELS` | Optional comma list; defaults to free Gemma 4 and Nemotron models |
| `ASK_NVIDIA_API_KEY` | NVIDIA API key (integrate.api.nvidia.com) |
| `ASK_NVIDIA_MODELS` | Optional; default `nvidia/nemotron-3-super-120b-a12b`. Check the id against NVIDIA's catalogue |
| `LOCAL_LLM_URL` | Public tunnel URL to llama-swap's OpenAI-compatible `/v1` |
| `LOCAL_LLM_TOKEN` | llama-swap API key (`LLAMA_SWAP_API_KEY`), so the tunnel isn't an open proxy |
| `LOCAL_LLM_MODEL` | Default `gemma-4-26b-qat-mtp` |
| `ASK_LOCAL_THINKING` | `1` keeps Gemma's thinking on (off by default: it made a 42-token answer take 30 s) |
| `ASK_ROUTE` | Hop order, default `openrouter,nvidia,local` |
| `ASK_LIMIT`, `ASK_GLOBAL_DAILY`, `ASK_MAX_PARALLEL` | Per-IP limit (12), daily cap (500), concurrent answers (5) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Already set for upvotes; without them the limit and queue are off |

The local hop can evict whatever model llama-swap has loaded (a benchmark, say). If that becomes a problem, check llama-swap's running models before routing local, or pin the model in a group.

## What the model sees

`utils/ask-corpus.mjs` indexes posts, notes, snippets, TILs, lexicon, prompts, reviews, device pages (front-matter specs included) and the About page. Hidden and future-dated pages are always excluded, even with `SHOW_HIDDEN` on. Public drafts are included.

The corpus is a public file. Anything indexed can also be quoted back verbatim by the model, so treat any new source (say, behind-the-scenes notes) as public-but-unlisted.

To add a hand-written page, add it to `SOURCE_PAGES` in `utils/ask-corpus.mjs`; keep that to prose-heavy pages, since Nunjucks tags are stripped. The query-side stopword list in `ask.js` mirrors `tokenize()` in the corpus builder; keep the two in step.

## Testing locally

```sh
npm run build:11ty && npm run build:css
ASK_ROUTE=local LOCAL_LLM_URL=http://localhost:8080/v1 \
  LOCAL_LLM_TOKEN=$LLAMA_SWAP_API_KEY PORT=8094 node utils/ask-dev-server.mjs
```

Then open `http://localhost:8094/ask/`. `?preview=limit`, `?preview=queue` and `?preview=down` show those screens without a backend.

## Commands

Listed in `/help`: `/help`, `/clear`, `/sources`, `/route`, `/model`, `/cost`, `/about`, `/compact`, `/doctor`, `/exit`. Unlisted: `/upgrade`, `/coffee`, `/tea`, `/sudo`, `/vim` (Esc is the only way out). Keys: Enter sends, Shift+Enter adds a newline, Esc interrupts, ↑↓ walk history, Ctrl+L clears, `?` toggles the shortcut hint.
