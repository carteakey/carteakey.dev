---
name: draft-ingestion
description: Ingests raw text, threads, or notes from the inbox/ directory, refines the tone, and formats them into standard markdown posts or notes.
---

# Draft Ingestion

This skill defines the workflow for turning raw text files (like Perplexity threads, raw ideas, or markdown dumps) in the `inbox/` directory into published content.

## Workflow

1. **Check the Manifest:**
   - Before processing, consult `inbox/manifest.yaml`.
   - If a file is not in the manifest, run the `manifest-update` skill first.
   - Files in `inbox/_ignore/` are automatically skipped and not tracked.
   - Use the `description` and `suggested_target` from the manifest to guide the ingestion.
2. **Read the Raw Dump:** 
   - Locate the raw text file in the `inbox/` directory. Read its contents.
3. **Apply Persona (Human Writer):**
   - Refine the text using the principles from the `human-writer` skill to ensure the tone matches the site's authentic, direct style. Strip out overly enthusiastic AI tropes, robotic transitions, and unnecessary boilerplate.
4. **Structure and Format:**
   - Decide if the content is a short-form `note` (goes in `src/notes/`) or a long-form `post` (goes in `src/posts/`).
   - Add standard frontmatter (`title`, `description`, `date`, `tags`, `authored_by`).
   - If third-party attribution is needed, use `author`, `source`, `authorUrl`, `sourceUrl` frontmatter instead of hardcoded HTML callouts.
5. **Cleanup:**
   - Delete the raw file from the `inbox/` directory once successfully ingested.
6. **Assets:**
   - If the new content would benefit from an illustration, prompt the user if you should run the `blog-sketches` skill.
