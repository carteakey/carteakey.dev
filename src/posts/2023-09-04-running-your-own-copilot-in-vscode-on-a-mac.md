---
title: Running your own Copilot in VSCode on a Mac.
description: With Codellama, Ollama and Continue.
date: 2023-09-04T16:39:26.330Z
updated: 2024-03-26T03:11:06.365Z
tags:
  - LLM
  - Mac
featured: true
---
Meta recently released their [CodeLlama](https://about.fb.com/news/2023/08/code-llama-ai-for-coding/) models, which are fine tuned for code completion and analysis. The best thing about them is their crazy large context (upto 100,000 tokens), which would mean that one could input way larger codebases into the prompts and the models should be able to handle it.

As such, they're a perfect drop-in replacement for Github Copilot (and even ChatGPT) for quick code snippets and completions. Moreover, M1/M2 Mac's have turned out to be excellent machines for running small LLM models, due to their unified memory and efficient architecture. 

So, we can run our codellama model locally, and integrate it with our VSCode IDE to analyze, write, refactor code seamlessly. Lets figure out how to do that. The below steps are specific to a Macbook (but similar steps can be achieved on other systems using an Ollama parallel.)

## Choosing our Model

There are three sizes (7b, 13b, 34b) as well as three flavours (base model, Python fine-tuned, and instruction tuned). 

Our choice boils down to few questions - 

* How much memory your Macbook has? 

  > 7b should run on most configs, and be fast enough. 13b model should run on systems with > 16Gb RAM, while 34B requires > 32GB RAM while also being the most capable.
* Do you develop mostly in Python? 

  > Code Llama - Python is a language-specialized variation of Code Llama further trained on Python code and should perform better in python specific scenarios.

We will use the 13b base model for our example.

## Running CodeLlama model using Ollama

If you haven't heard of it already, Ollama is the simplest way to run llama models on Macs. The steps should be simple enough.

1. Go to https://ollama.ai and download the Ollama application.
2. Run the application and it will install the CLI.
3. Open terminal and run the command. Ollama will take care of downloading the model and everything else.

```bash
ollama run codellama:13b
```

4. By default, the Ollama should already be serving the REST API, which we will use in the next step. Test it by sending a request to the API.

```bash
# Run the server, if not running already.
ollama serve
```

```bash
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "codellama:13b",
  "prompt":"Give me a bash command to find and delete a file recursively"
}'
```

## Setting up Continue in VSCode

The VSCode integration is achieved with the [Continue](https://continue.dev) extension, which provides a lot of options to integrate LLM services as a Copilot.

**2024 Update:** The extension has been updated to use a config.json instead. Just install the extension, open it in the sidebar, click on the settings icon and add the ollama config in the models prop

```json
{
      "model": "AUTODETECT",
      "title": "Ollama",
      "completionOptions": {},
      "apiBase": "http://localhost:11434",
      "provider": "ollama"
 }
```

**2023:** 

To set it up with Ollama, we will need to open the `~/.continue/config.py` file on our machine with any text editor and adding below code.

```python
#Add this line in imports
from continuedev.src.continuedev.libs.llm.ollama import Ollama
```

Modify below line.

```python
config = ContinueConfig(
    allow_anonymous_telemetry=True,
    models=Models(
        # Replace below line with your ollama model
        # default=MaybeProxyOpenAI(api_key="", model="gpt-4")
        default=Ollama(model="codellama:13b")
    ),
```

With all set and done, we should now be able to use our own little copilot to help us become that 10x developer 😛.

Below is an example.

![](/img/codellama.png)
