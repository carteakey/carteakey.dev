# Personal Site Inspirations

A collection of structured deconstructions of fellow builders' personal websites. Each file in this directory documents a site's features, interaction patterns, visual experiments, and data architectures, with frontmatter indexing each inspiration and its status.

## Directory Structure

```
docs/inspirations/
  README.md            # This index and schema guide
  vipul.xyz.md         # Entry 01: Vipul Sharma
  <domain>.md          # Future entries
```

## Frontmatter Schema

Each site document uses the following frontmatter:

```yaml
---
title: Site or Author Name
url: https://example.com
repo: https://github.com/user/repo # Optional
author: Author Name
date: YYYY-MM-DD
status: active | archived
bio: Brief 1-2 sentence background
stack:
  framework: Framework name
  styling: Styling approach
  hosting: Hosting platform
inspirations:
  - name: Feature Name
    route: /path/on/their/site/
    status: idea | backlog | planned | in-progress | implemented
    summary: Concise description of the feature
    relevance: How it fits into carteakey.dev
---
```

## Sites Indexed

| Site | Author | Key Inspirations | Status |
|---|---|---|---|
| [vipul.xyz](vipul.xyz.md) | Vipul Sharma | Grouped gallery by location, artist ridgeline chart, 3D printing log, quantified-self flight data | Active |
