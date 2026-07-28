# Font strategy

The published site currently uses two self-hosted families:

- Plus Jakarta Sans for body, display, and editorial text.
- JetBrains Mono for code and interface labels.

The normal Plus Jakarta Sans variable file is preloaded because it is used above the fold on every page. Italic and monospace files remain demand-loaded through `@font-face`, avoiding unnecessary high-priority requests.

## Trimmed font history

On 2026-07-17, commit [`7e1bd37`](https://github.com/carteakey/carteakey.dev/commit/7e1bd37a54fd7c177d493e378c335df7f532d96f) removed the following 23 locally bundled files after the site stopped using their font faces. The old Tailwind theme declarations are preserved in that commit's parent CSS snapshot.

| Family | Former role | Removed files |
| --- | --- | --- |
| Geist | Sans fallback and display utility | `Geist/Geist[wght].woff2` |
| Geist Mono | Monospace fallback utility | `GeistMono/GeistMono[wght].woff2`; `GeistMono/variable/GeistMono[wght].ttf` |
| Saira | Display/bricolage utility | `saira-v22-latin-regular.woff2`; `saira-v22-latin-700.woff2` |
| Urbanist | Sans utility | `urbanist-v18-latin-regular.woff2`; `urbanist-v18-latin-700.woff2` |
| Exo 2 | Sans utility | `exo-2-v26-latin-regular.woff2`; `exo-2-v26-latin-700.woff2` |
| Arimo | Sans utility | `arimo-v35-latin-regular.woff2` |
| Rubik | Sans utility | `rubik-v31-latin-regular.woff2` |
| Crimson Pro | Serif fallback utility | `crimson-pro-v28-latin-regular.woff2` |
| IBM Plex Mono | Monospace fallback utility | `ibm-plex-mono-v20-latin-regular.woff2`; `ibm-plex-mono-v20-latin-700.woff2` |
| Poppins | Sans utility | `poppins/Poppins-Regular.woff2`; `poppins/Poppins-Italic.woff2`; `poppins/Poppins-Bold.woff2` |
| et-book | Serif/prose face | `etbookot-roman-webfont.woff`; `etbookot-roman-webfont.woff2`; `etbookot-italic-webfont.woff`; `etbookot-italic-webfont.woff2`; `etbookot-bold-webfont.woff`; `etbookot-bold-webfont.woff2` |

These families were theme utilities or fallback candidates rather than active page-specific choices at the time of removal. Keep this inventory when changing typography so a future restoration is deliberate rather than a hunt through old assets.

## Restoring a trimmed family

Restore the exact historical files from the parent of the trimming commit, then reintroduce the matching `@font-face` declarations and theme token in `src/static/css/tailwind.css`. For example:

```sh
git restore --source=7e1bd37^ -- src/static/fonts/Geist/Geist\[wght\].woff2
```

Before restoring a family, verify the intended page usage, check its license/source, and add a focused preload only if it is needed above the fold. Do not restore the entire historical bundle for a single page.

When changing typography, verify the home page, a prose-heavy post, and a code-heavy page at narrow and wide viewports. Check that no font request returns 404 and that fallback text remains readable while fonts load.
