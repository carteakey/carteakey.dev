# Blog Post Images

Every post must have a thumbnail, and it must be unique to that post (enforced by `npm run check:content`). Shared category art was useful for exploration, but it reads repetitive in the archive and feed.

For repeated work, use the local skill at `.agents/skills/sketches/` (Part A: thumbnails).

Use `image` front matter for post thumbnails, structured data, and the lead image on the post page:

```yaml
image: /img/blog-sketches/unique/agent-ide-stamp-trim.png
imageAlt: Transparent monochrome sketch of an AI coding workspace
```

Preferred workflow:

1. Create a post-specific sketch under `src/static/img/blog-sketches/unique/`.
2. Keep the asset transparent so it works on light and dark themes.
3. Trim empty padding so it reads at feed-thumbnail sizes.
4. Wire it to exactly one post with `image` and `imageAlt`.
5. Preview `/blog/`, `/feed/`, and the post page before adding more.

## Social preview convention

Keep `image` transparent for the site. Open Graph and Twitter must use an
opaque image, since social crawlers cannot apply the site's dark-mode CSS.
The shared `social_image_meta` shortcode automatically makes an uncropped
1200 × 630 PNG on paper (`#f4f3ee`) from any transparent local image. It leaves
48px of padding and emits the same URL and alt text for both platforms.

Generated previews live in `_site/img/og/`; do not commit or hand-edit them.
Their URLs include a hash of the source and rendering settings, so changing
the art produces a new URL. No extra front matter or manual generation is
needed for a new sketch. `ogImage` can select an authored card; transparent
local images still get an opaque derivative. Opaque local images keep their
original URL, and metadata reports their actual dimensions. Remote images
keep their URL and omit dimensions that the build cannot verify.

Run `npm run build` and `npm run verify`, then view the generated social image
itself as well as the post in light and dark mode. Never point social metadata
directly at a transparent sketch.

Use the project image shortcode only when you want to place a sketch manually inside post content:

```njk
{% image "./src/static/img/blog-sketches/unique/agent-ide-stamp-trim.png", "Transparent monochrome sketch of an AI coding workspace", "" %}
```
