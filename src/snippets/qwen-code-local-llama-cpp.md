---
title: Connect Qwen Code to a Local llama.cpp Server
description: Configure Qwen Code to use a local llama-server as an OpenAI-compatible model provider instead of a cloud API.
date: 2026-02-28T00:00:00.000Z
updated: 2026-02-28T00:00:00.000Z
slug: qwen-code-local-llama-cpp
---

llama.cpp's `llama-server` exposes an OpenAI-compatible API. Qwen Code can target it directly via `modelProviders`.

## 1. Start llama-server

Launch with an `--alias` and a fixed `--port`:

```bash
llama-server \
  -m /path/to/model.gguf \
  --alias "my-model-alias" \
  --host 0.0.0.0 \
  --port 8001 \
  --ctx-size 131072
```

Note the alias — it becomes the model ID sent to the API.

## 2. Configure ~/.qwen/settings.json

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "my-model-alias",
        "name": "my-model-alias",
        "baseUrl": "http://localhost:8001/v1",
        "description": "Local model via llama.cpp",
        "envKey": "LOCAL_LLAMA_API_KEY"
      }
    ]
  },
  "env": {
    "LOCAL_LLAMA_API_KEY": "local"
  },
  "security": {
    "auth": {
      "selectedType": "openai"
    }
  },
  "model": {
    "name": "my-model-alias",
    "generationConfig": {
      "contextWindowSize": 131072
    }
  }
}
```

Replace `my-model-alias` with your `--alias` value, and set `contextWindowSize` to match `--ctx-size`.

## Key fields

| Field | Purpose |
|---|---|
| `modelProviders.openai[].baseUrl` | Points to local llama-server |
| `modelProviders.openai[].envKey` | Required — names the env var holding the API key |
| `env.<KEY>` | Supplies a dummy key value (llama.cpp doesn't validate it) |
| `security.auth.selectedType` | Must be `"openai"` for OpenAI-compatible providers |
| `model.generationConfig.contextWindowSize` | Should match `--ctx-size` in llama-server |

## Pitfalls

- `envKey` is **required** even for local servers — omitting it causes a "Missing credentials" error.
- `security.auth` must only contain `selectedType` — extra fields like `apiKey` break auth detection.
- `contextWindowSize` overrides Qwen Code's built-in model defaults; set it explicitly for local models.
