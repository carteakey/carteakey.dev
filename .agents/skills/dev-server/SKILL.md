---
name: dev-server
description: Start, check, restart, and stop the carteakey.dev local dev server (Eleventy plus the Tailwind watcher) without breaking llama-swap or other sessions, and test-build safely. Use when asked to "run the local server", "start dev", report the local URL, when pages 404 or CSS does not update, or before running a build.
---

# Dev server

**Status: draft.** Every command here was run during the 2026-10-01 session;
the failure modes are ones that actually happened.

## Start

```sh
cd /home/kchauhan/repos/carteakey.dev
(nohup npm run start > $SCRATCHPAD/dev.log 2>&1 &)
```

`npm run start` runs Eleventy (`--serve`) and the Tailwind watcher in parallel.
Wait for `Server at http://localhost:<port>/` in the log, then **always report
the Tailscale URL too** (AGENTS.md): `tailscale ip -4`, then
`http://<that-ip>:<port>/`. Both URLs, every time.

### Port: 8080 vs 8081

`llama-swap` listens on **:8080** (`LLAMA_SWAP_LISTEN`). Eleventy defaults to
8080 and falls to 8081 only if 8080 is already taken. So:

- Start `llama-swap` **before** the dev server, and the site lands on 8081.
- If the dev server grabbed 8080 while `llama-swap` was stopped, `llama-swap`
  cannot start: it crash-loops (`start-limit-hit`) and leaves orphan
  `llama-server` processes. Fix: see `gpu-handoff` ("Recovery").

### The Tailwind watcher dies in the background

Tailwind v4's `--watch` exits when its stdin closes, which is what happens when
the server is started detached. Symptom: new CSS classes never appear and
`_site/css/tailwind.css` has an old timestamp. Fix by holding stdin open:

```sh
(nohup sh -c 'tail -f /dev/null | npx tailwindcss -i ./src/static/css/tailwind.css -o ./_site/css/tailwind.css --watch --postcss' > $SCRATCHPAD/css.log 2>&1 &)
```

Verify: `touch src/static/css/tailwind.css` then `grep -c <new-class> _site/css/tailwind.css`.

## Check it is healthy

```sh
curl -s -o /dev/null -w "%{http_code}\n" -m 10 http://localhost:8081/
grep -i -E 'error|ENOENT' $SCRATCHPAD/dev.log | tail -5
ss -ltnp | grep -E ':808[01]'
```

A 404 on a page that exists usually means a build or restructure is in flight
(see "Two builds, one `_site`").

## Restart

After a `git pull`, a rebase, or a mass file move, Eleventy's watcher can throw
`Cannot read properties of undefined (reading 'add')` and stop reacting. Restart.

Find processes by port or pid, **never `pkill -f <pattern>`**: the pattern also
matches your own shell command and kills the shell (exit 144).

```sh
for p in $(ss -ltnp 2>/dev/null | grep ':8081' | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u); do kill $p; done
```

Then start again as above.

## Two builds, one `_site`

`npm run build` runs `prebuild`, which runs `clean-build.mjs` and wipes `_site/`.
If a dev server (yours or another session's) is writing there you get `ENOENT`
errors and 404s. Rules:

- Never run `npm run build` while a dev server is up.
- To verify a build safely, write elsewhere (tested, 352 files, ~4 s):

  ```sh
  npx eleventy --output=$SCRATCHPAD/site-test --quiet
  ls $SCRATCHPAD/site-test/blog/<slug>/index.html
  ```
- Check `ps -eo pid,etimes,args | grep -E 'eleventy|pnpm run build'` before
  assuming a 404 is your bug: another session may be building.

## Stop

Kill by pid from `ss -ltnp` (above), and the Tailwind watcher via its `sh -c`
parent. Do not leave a dev server holding :8080 when `llama-swap` needs it.
