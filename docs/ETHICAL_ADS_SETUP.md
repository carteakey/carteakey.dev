# EthicalAds Setup

These steps assume you already have the repository checked out locally.

## 1. Create and configure an EthicalAds account

1. Sign up for an [EthicalAds](https://www.ethicalads.io/) publisher account.
2. Once approved, note your **publisher slug** (for example, `your-site-name`).
3. Decide which ad unit type you want to serve (`image`, `text`, or `hybrid`).

## 2. Wire the credentials into the site

The layouts for posts and snippets automatically render an ad slot when EthicalAds
metadata is present. Update `src/_data/metadata.yaml` with your values:

```yaml
...
ethicalAds:
  publisher: your-publisher-slug
  type: image # or text / hybrid
```

No additional templates need to be touched. When the metadata exists:

- A left-aligned, sticky ad panel appears on posts and snippets for large screens.
- The EthicalAds loader script is already included once globally (`layouts/base.njk`).

To temporarily disable ads, delete or comment out the `ethicalAds` block in the
metadata file.

## 3. Local verification checklist

1. Run `npm run start` (or `npm run build` in CI) to rebuild the site.
2. Visit a blog post or snippet at `http://localhost:8080`.
3. Confirm that an "Ads by EthicalAds" module appears on the left and stays fixed
   while scrolling.
4. Check the browser console for any EthicalAds warnings—missing publisher or
   blocked scripts will surface there.

## 4. Optional tuning

- The ad container width, border, and spacing are controlled in
  `src/_includes/components/ethical-ads.njk`. Tailor the styling there if the
  default 220 px sidebar does not suit your layout.
- EthicalAds supports custom targeting via data attributes. Add additional
  attributes to the `<div data-ea-publisher=...>` element inside the component
  if you want to segment ads by page type, tag, or locale.

That’s it—once deployed, EthicalAds will begin serving privacy-friendly ads
without any further code changes.
