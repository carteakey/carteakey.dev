# Content Taxonomy: Series vs. Tags

This document outlines the organizing philosophy for `carteakey.dev`'s markdown content, specifically distinguishing between when to group posts into a **Series (Folder)** versus when to use **Tags**.

## 1. Series (Folders)

**What they are:** Physical subdirectories inside `src/posts/` (e.g., `src/posts/homelab/`).

**When to use them:**
- The posts are part of a cohesive narrative, project, or sequential guide (e.g., Part 1, Part 2).
- The posts document the evolution of a single, specific topic over time.
- You expect a reader who finds one post to actively want to read the other posts in the exact same grouping.
- **Rule of Thumb:** If the posts share a specific project name (e.g., "Unforwarder" or "Building a Homelab") or feel like chapters in a book, put them in a folder.

**Benefits:**
- **Dedicated URL Path:** They get a dedicated slug prefix (e.g., `/blog/homelab/`).
- **Visual Callouts:** The site layout automatically detects when a post is part of a folder and renders a visual callout at the bottom of the article linking to the rest of the series.
- **Structured Reading:** It provides a "deep dive" experience.

**Current Series:**
- `local-inference/` - Logs and benchmarks for running local LLMs.
- `agents/` - Explorations and guides around AI coding agents.
- `homelab/` - Evolution of personal self-hosted infrastructure.
- `gpt-oss-benchmarks/` - Specific benchmark runs for the gpt-oss model family.

## 2. Tags

**What they are:** Frontmatter metadata (e.g., `tags: [AI, Life]`).

**When to use them:**
- The connection is thematic, broad, or conceptual.
- A post is completely standalone and doesn't explicitly require context from other posts.
- You want a post to belong to multiple categories at once.
- **Rule of Thumb:** If a post is just "about" a topic but isn't explicitly tied to another post's storyline, use a tag.

**Benefits:**
- **Flexibility:** A single post can be cross-referenced across multiple disciplines (e.g., a post tagged both `Linux` and `AI`).
- **Flattened Hierarchy:** Avoids the trap of having to decide whether a post belongs in a "Tech" folder or a "Personal" folder.
- **Broad Discovery:** Allows users to find posts through the `/tags/` directory.

**Anti-Patterns to Avoid:**
- ❌ **Broad Folders:** Do not create folders named `tech/`, `personal/`, or `rants/`. These are broad, conceptual buckets and should strictly be tags. Folders must remain tight and scoped.
- ❌ **Overlapping Series:** If a series becomes too broad, it should be dismantled into the root `/posts/` directory and connected via tags.
