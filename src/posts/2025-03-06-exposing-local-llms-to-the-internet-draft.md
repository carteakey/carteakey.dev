---
title: Exposing local llm's to the internet (draft)
description: "Your very own AI-API "
date: 2025-03-06T05:14:04.467Z
updated: 2025-03-06T05:14:04.480Z
tags:
  - LLM
  - Self-Host
---
**Note:** Inspired by [arch](https://architchandra.com/articles/the-perfectionists-guide-to-deploying-a-statamic-website-to-vercel), I have decided to publish drafts even if they are not complete, makes writing less stressful.

My blog uses **\~\~AI\~\~**, no seriously! Head to my homepage and you will find that the "quote of the day" is (or used to be) powered by ChatGPT. This site refreshes daily which ended up very silently leaking my whole 5$ of OpenAI API credit, leaving my blog stuck with a fallback, ultra-generic quote. Sad times! 

![](/img/alvin.png)

Instead of throwing more money into the OpenAI pit, I decided to spin up my own local LLM and expose it safely to the web. Don't think quotes need deep research or chain of thoughts anyways.

## How I Set It Up (The Short Version)

1. **Download & Install Ollama**: <https://ollama.com/download>
2. **Allow all incoming requests:** Set OLLAMA_HOST variable to 0.0.0.0 to allow all incoming connections See <https://github.com/ollama/ollama/blob/main/docs/faq.md#how-do-i-configure-ollama-server>
3. **Select a Model**: Just run `ollama pull llama3.1` (or pick another model you prefer).
4. **Expose to the Web**: Safely route through a reverse proxy for secure access. The simplest option is Tailscale—install it and execute:

   ```bash
   tailscale funnel 11434
   ```

   Voilà, reverse proxy done! Alternatively, Cloudflare Tunnels is another easy option.

   ```bash
   tailscale funnel 11434
   Available on the internet:
   https://amelie-workstation.pango-lin.ts.net

   |-- / proxy http://127.0.0.1:11434

   Press Ctrl+C to exit.
   ```


5. **Integrate with Blog**: Minimal coding hooks my blog directly to my locally hosted API.
6. **ChatGPT-like Interaction via OpenWebUI**: With Ollama API running, add a front-end like OpenWebUI for a full-featured ChatGPT alternative (limited only by electricity bills!).

And now the blog proudly sports unique, fresh quotes daily, no longer hostage to an external API credit balance.

![](/img/mandela.png)