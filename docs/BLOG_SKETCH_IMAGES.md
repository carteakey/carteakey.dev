# Blog Post Images

Treat post images as optional and unique per post. Shared category art was useful for exploration, but it reads repetitive in the archive and feed.

For repeated work, use the local skill at `.agents/skills/blog-sketches/`.

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

Use the project image shortcode only when you want to place a sketch manually inside post content:

```njk
{% image "./src/static/img/blog-sketches/unique/agent-ide-stamp-trim.png", "Transparent monochrome sketch of an AI coding workspace", "" %}
```
