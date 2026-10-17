# Font strategy

The published site uses five families:

- **Iosevka Aile** (self-hosted) for body, card and list titles, and editorial text. It is the quasi-proportional cut of Iosevka, so it shares letterforms with the mono labels.
- **Ioskeley Mono** (self-hosted) for code, labels, dates, and other metadata.
- **Fraunces** (Google Fonts) for page titles, post titles, and post `h2`/`h3` headings.
- **Press Start 2P** (Google Fonts) for the pixel name on the homepage.
- **Caveat** (self-hosted) for handwritten editorial annotations.

The Iosevka Aile 400 file is preloaded because it is used above the fold on every page. Other weights, italics, monospace, and Caveat stay demand-loaded through `@font-face`.

### Iosevka Aile subsetting

Upstream Iosevka files are about 1.2 MB per weight even in the Fontsource "latin" subset, because of the glyph count, OpenType variant tables, and hinting. The files in `src/static/fonts/iosevka-aile/` are subset to about 33 KB each from `@fontsource/iosevka-aile@5.3.0` (SIL OFL 1.1, `LICENSE` alongside) with:

```sh
pyftsubset iosevka-aile-latin-400-normal.woff2 \
  --unicodes="U+0000-017F,U+0192,U+02B0-02FF,U+0300-036F,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212,U+2248,U+2260,U+2264-2265,U+221E,U+2605,U+2713,U+2715,U+2717,U+25CF,U+2E3B" \
  --flavor=woff2 --layout-features="kern,liga,calt,locl,ccmp,mark,mkmk" \
  --no-hinting --desubroutinize --output-file=iosevka-aile-400-normal.woff2
```

Characters outside these ranges (CJK, emoji, box drawing in prose) fall back to the system stack. Re-run this when adding a weight, or widen the ranges if a post needs them.

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

On 2026-10-16 (2.7.39) the site switched its body face to Iosevka Aile and removed `plus-jakarta-sans/PlusJakartaSans[wght].woff2` and `plus-jakarta-sans/PlusJakartaSans-Italic[wght].woff2`. Restore them from the parent of the commit that removed them; the font lab keeps a `jakarta` variant for comparison.

These families were theme utilities or fallback candidates rather than active page-specific choices at the time of removal. Keep this inventory when changing typography so a future restoration is deliberate rather than a hunt through old assets.

## Restoring a trimmed family

Restore the exact historical files from the parent of the trimming commit, then reintroduce the matching `@font-face` declarations and theme token in `src/static/css/tailwind.css`. For example:

```sh
git restore --source=7e1bd37^ -- src/static/fonts/Geist/Geist\[wght\].woff2
```

Before restoring a family, verify the intended page usage, check its license/source, and add a focused preload only if it is needed above the fold. Do not restore the entire historical bundle for a single page.

When changing typography, verify the home page, a prose-heavy post, and a code-heavy page at narrow and wide viewports. Check that no font request returns 404 and that fallback text remains readable while fonts load.

## Font lab

`/lab/fonts/` (hidden, noindex, excluded from collections) previews alternative type directions on real pages via `?font=<id>`; `?font=off` resets. Variants live in `src/_data/fontLab.yaml` and build to `/lab/fonts/<id>.css`. Their fonts (Iosevka Etoile, the previous Plus Jakarta Sans, and others) load from jsDelivr only while a variant is active in that tab, so they are not a production dependency.
