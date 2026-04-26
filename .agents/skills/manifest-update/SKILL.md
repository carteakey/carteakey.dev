---
name: manifest-update
description: Workflow for maintaining the inbox/manifest.yaml file. Use this to describe new files in the inbox and classify them before ingestion.
---

# Manifest Update Skill

This skill defines how to keep `inbox/manifest.yaml` up-to-date and how to handle the initial classification of files in the `inbox/` directory.

## Workflow

1. **Scan the Inbox:**
   - List files in `inbox/` root (non-recursive, excluding `.DS_Store`, `manifest.yaml`, and the `_ignore/` folder).
2. **Identify Untracked Files:**
   - Compare the current file list with the entries in `inbox/manifest.yaml`.
   - Any file in `inbox/` root that is NOT in the manifest needs processing.
3. **Classify and Describe:**
   - For each untracked file:
     - Use `view_file` (or appropriate tool) to understand its content.
     - Determine a `suggested_target` (e.g., `posts`, `notes`, `photography`, `vibes`, `ai-memes`, or `ignore`).
     - Write a concise `description`.
4. **Update Manifest or Ignore:**
   - If `suggested_target` is `ignore`:
     - Move the file to `inbox/_ignore/`.
     - Do NOT add it to the manifest.
   - For all other targets:
     - Append the entry to `inbox/manifest.yaml`.
5. **Batching:**
   - If there are many files, process them in batches (e.g., 10 at a time) to ensure accuracy and avoid token limits.

## Manifest Schema

```yaml
- path: inbox/filename.ext
  description: Concise description of the content.
  suggested_target: [posts|notes|photography|vibes|ai-memes]
  type: [text/markdown|image/png|image/jpeg|...]
```

## Anti-Patterns

- Do NOT track files in the `inbox/_ignore/` folder in the manifest.
- Avoid verbose or generic AI-sounding descriptions.
- Do NOT move files to their final destinations in this skill; this is for classification only.
