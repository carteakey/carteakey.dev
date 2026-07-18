# Font strategy

The shared site uses two self-hosted variable/flexible families:

- Plus Jakarta Sans for body, display, and editorial text.
- JetBrains Mono for code and interface labels.

The normal Plus Jakarta Sans variable file is preloaded because it is used above the fold on every page. Italic and monospace files remain demand-loaded through `@font-face`, avoiding unnecessary high-priority requests.

Only fonts referenced by the shared site CSS belong in `src/static/fonts/`. Standalone experiments may declare their own page-specific fonts, but should not add those files to the shared bundle unless a site template also uses them.

When changing typography, verify the home page, a prose-heavy post, and a code-heavy page at narrow and wide viewports. Check that no font request returns 404 and that fallback text remains readable while fonts load.
