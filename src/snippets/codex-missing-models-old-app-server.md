---
title: Missing Codex Models After an Update
description: Check for an old Codex app server when a model is available on another machine but missing from the local picker.
date: 2026-09-29T00:00:00.000Z
authored_by: ai-assisted
slug: codex-missing-models-old-app-server
tags:
  - Agents
---

GPT-6.1 Sol showed up on my Mac, but the same account couldn't see it on Linux. Clearing `~/.codex/models_cache.json` didn't help. Codex immediately fetched another list without it.

The running Codex app server was still on **0.155.1**, even though the installed CLI was **0.159.1**. That helper process had been running for four days and survived the desktop app update. Stopping it resolved the missing model.

The app server is a local Codex helper that handles sessions, tools, and the model list used by the interface. Updating the installed executable doesn't necessarily replace a process that's already running.

## Check the running version

```bash
codex --version
codex app-server daemon version
```

Compare `cliVersion` with `appServerVersion` in the JSON output. In my case:

```json
{
  "cliVersion": "0.159.1",
  "appServerVersion": "0.155.1"
}
```

## Restart the helper

For a server managed by the Codex daemon commands:

```bash
codex app-server daemon restart
```

Mine returned `app server is running but is not managed by codex app-server daemon`. The desktop app was using an unmanaged helper, so I had to stop that process directly.

Quit the desktop app, then find the helper:

```bash
pgrep -af 'codex.*app-server'
```

Inspect its PID before stopping it. Replace `12345` below with the PID from your machine:

```bash
ps -p 12345 -o pid,ppid,etime,args
kill -TERM 12345
```

Stopping the helper disconnects sessions attached to it. If it stays alive after a few seconds, verify it's still the same helper before forcing it to exit:

```bash
ps -p 12345 -o pid,etime,args
kill -KILL 12345
```

Reopen the desktop app and check `codex app-server daemon version` again, then open the model picker.

## About the model cache

The catalog cache on my machine was `~/.codex/models_cache.json`. You can move it aside to force a fresh fetch:

```bash
mv -n ~/.codex/models_cache.json ~/.codex/models_cache.json.bak
```

If the backup already exists, `mv -n` leaves the cache in place; use a different backup filename. In this case the old helper rebuilt it with the same model list, which was the clue to check the running version.

[OpenAI's model catalog documentation](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference) notes that Codex app-server's `model/list` can use a bundled or cached catalog. This fix worked for my stale Linux helper; it doesn't establish model access for an account that hasn't received it.
