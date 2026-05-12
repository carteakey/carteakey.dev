---
title: Site Sucker Alias (ss)
description: A powerful wget alias to mirror websites locally, bypassing robots.txt and excluding media files.
date: 2026-05-03T00:00:00.000Z
authored_by: kchauhan
updated: 2026-05-03T00:00:00.000Z
slug: site-sucker-wget-alias
---

This `wget` alias (named `ss` for "Site Sucker") allows you to recursively download an entire website for offline viewing. It converts links for local browsing, ignores `robots.txt`, and excludes heavy media files to save space.

Add this to your `~/.bashrc` or `~/.zshrc`:

```bash
alias ss="wget --recursive --convert-links --continue --page-requisites --mirror --verbose --reject 'm4a,mpv,mp4,m4v,ogg' --html-extension --progress=bar --user-agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' --execute robots=off -P ~/Internet"
```

### Breakdown of flags:

- `--recursive`: Follow links to download the whole site.
- `--convert-links`: Make links point to local files for offline browsing.
- `--continue`: Resume partially downloaded files.
- `--page-requisites`: Download images, CSS, etc., needed to display the page correctly.
- `--mirror`: Shortcut for infinite recursion and timestamping.
- `--reject`: Don't download specific file types (m4a, mp4, etc).
- `--execute robots=off`: Ignore `robots.txt` restrictions.
- `-P ~/Internet`: Save files to the `~/Internet` directory.
