---
title: "Why Every Technical Blog Needs a 'Copy as Markdown' Feature"
date: git Last Modified
layout: layouts/note.njk
tags:
  - notes
  - webdev
  - PKM
---
If you're reading a technical blog, there's a high chance you use some sort of personal knowledge management system—like Obsidian, Notion, or Logseq. And if you're anything like me, you frequently copy interesting snippets, setup guides, or entire articles into your own vault for future reference.

The problem? Selecting text and hitting `Ctrl+C` often grabs the rendered HTML. When you paste it into your Markdown-native PKM, the formatting breaks: code blocks lose their syntax highlighting, links get mangled, and lists become a mess of weird indentation. 

To solve this friction, I've added a **"Copy as Markdown"** and **"View Raw"** button to all technical content on this site (posts, snippets, TILs). 

{% image_cc "./src/static/img/unsloth-copy-example.png", "Copying the Unsloth local inference guide as markdown", "rounded-lg border border-gray-200 dark:border-gray-700 w-full mt-4 mb-4", "The new 'Copy as Markdown' button in action on the Unsloth Gemma 4 post." %}

This serves two crucial purposes:
1. **Frictionless PKM:** Saving tutorials (like the Unsloth example above) directly into your knowledge base without re-formatting code blocks and mangled links.
2. **LLM Context:** Quickly copying an entire guide or snippet into ChatGPT, Claude, or local LLMs to ask questions, debug setups, or request modifications.

It uses a small Eleventy template to generate a `.txt` file containing the raw, unparsed `.md` content. A simple Alpine.js component fetches that file and copies the pure Markdown directly into your clipboard. No more re-formatting text just to save a useful tutorial. 

Every technical blog that expects to be referenced by its readers should adopt this pattern. It respects the reader's time and acknowledges how developers actually consume and store knowledge today.