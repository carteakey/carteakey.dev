# UI verification

Run this after a major shared-layout, navigation, archive, or metadata change.

## Automated smoke check

Build the site, then inspect the generated output:

```sh
npm run build
npm run verify:ui
```

The smoke check verifies that:

- the three easter-egg triggers are still shipped;
- responsive post-list and grid markup remains present;
- a representative post and the home page contain valid JSON-LD;
- canonical, Open Graph, and Twitter URLs are absolute HTTPS URLs and agree;
- social images use matching Open Graph and Twitter URLs;
- first-party social images exist in the built site.

## Browser spot-check

At mobile and desktop widths:

1. Open `/blog/`, switch between list and grid, search for a post, and open a result.
2. Confirm post thumbnails do not squeeze titles or overflow their rows.
3. Enter the Konami sequence (`↑ ↑ ↓ ↓ ← → ← → B A`) on any normal page.
4. Double-click the site title and triple-click the footer to verify the other easter eggs.
5. Check the browser console for errors on `/`, `/blog/`, and the representative post.

The script intentionally checks generated files rather than source templates. That catches template/data regressions that a source-only lint would miss.
