---
name: manifest-update
description: Workflow for maintaining the inbox/manifest.yaml file. Use this to describe new files in the inbox and classify them before ingestion.
---

# Manifest Update Skill

This skill defines how to keep `inbox/manifest.yaml` up-to-date and how to handle the initial classification and approval of files in the `inbox/` directory.

## Workflow

1. **Scan the Inbox:**
   - List files in `inbox/` root (non-recursive, excluding `.DS_Store`, `manifest.yaml`, and the `_ignore/` folder).
2. **Identify Untracked Files:**
   - Compare the current file list with the entries in `inbox/manifest.yaml`.
   - Any file in `inbox/` root that is NOT in the manifest needs processing.
3. **Classify and Describe:**
   - For each untracked file:
     - Use `view_file` (or appropriate tool) to understand its content.
     - Determine a `suggested_target` (e.g., `posts`, `notes`, `photography`, `vibes`, `ai-memes`).
     - Write a concise `description`.
     - Set `approved: false` by default.
4. **Update Manifest or Ignore:**
   - If a file is clearly personal or irrelevant:
     - Move the file to `inbox/_ignore/`.
     - Do NOT add it to the manifest.
   - For all other potential content:
     - Append the entry to `inbox/manifest.yaml` with `approved: false`.
5. **Execution (Approval Workflow):**
   - When the user sets `approved: true` for an entry in the manifest:
     - The corresponding ingestion skill (`draft-ingestion` or `media-import`) should be triggered to move the file to its final destination and update the site data.
     - Once moved, the entry should be removed from `manifest.yaml`.

## Manifest Schema

```yaml
- path: inbox/filename.ext
  description: Concise description of the content.
  suggested_target: [posts|notes|photography|vibes|ai-memes]
  type: [text/markdown|image/png|image/jpeg|...]
  approved: false
```

## Anti-Patterns

- Do NOT track files in the `inbox/_ignore/` folder in the manifest.
- Avoid verbose or generic AI-sounding descriptions.
- Do NOT move files to their final destinations until `approved: true`.
