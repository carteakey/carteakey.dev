# Cross-Posting to Medium Guide

## Strategy
Medium is highly recommended over Substack for cross-posting content from `carteakey.dev` because it explicitly supports **Canonical URLs**. Canonical URLs prevent search engines from penalizing your main blog for duplicate content by pointing them to the original source.

**Recommended Publishing Workflow:**
1. Wait a day or two after publishing a post on `carteakey.dev` to allow search engines to crawl and index the original post.
2. Cross-post the final version to Medium. 
3. *Note: Medium does not sync edits automatically. For minor edits, you will need to edit both platforms manually. For major rewrites, delete the Medium post and re-import.*

---

## Dealing with Medium's Importer Quirks

Medium's automated **Import tool** (`Stories -> Import a story`) is theoretically convenient because it pulls in the article, backdates the post, and automatically sets the canonical URL. 

However, because Eleventy generates heavily customized HTML for this blog, the scraper often struggles to parse certain elements:

### 1. Missing Images
The blog uses custom Nunjucks/Eleventy shortcodes for images (e.g., `{% image_cc ... %}`). Eleventy renders these into modern `<figure>` HTML tags containing various sizes, formats (like AVIF and WebP), and data attributes (like `data-zoomable`). 
- **The Issue:** Medium's parser expects simple `<img>` tags and sometimes skips these complex, responsive `<figure>` blocks.

### 2. Missing Code Snippets
The blog uses `@11ty/eleventy-plugin-syntaxhighlight`. This plugin converts Markdown code blocks into nested HTML `<div>` and `<span class="token ...">` elements to apply syntax highlighting (via Prism.js).
- **The Issue:** Medium's parser expects plain `<pre><code>` blocks. When it encounters heavily nested syntax highlighting spans, it fails to interpret them and drops the code block entirely.

### 3. Lingering Header Links
The blog uses `markdown-it-anchor`, which injects anchor links directly next to all header elements (e.g., the `#` symbol next to headers).
- **The Issue:** Medium's scraper imports all text content within the DOM, meaning these literal `#` anchor characters are incorrectly stripped and copied into your Medium drafts as regular text alongside your headers.

---

## The Recommended Output Workflow (Manual Copy-Paste)

To ensure the cleanest formatting on Medium and bypass the automated scraper constraints, it is recommended to copy raw Markdown straight into Medium:

1. **Copy the Markdown:** Copy the raw text directly from your local Markdown file (e.g., `xclip` or manual copy).
2. **Paste into Medium:** Go to Medium, click **Write**, and paste the raw Markdown directly into the Medium editor. Medium natively parses Markdown headers, links, quote blocks, and standard code blocks perfectly without needing HTML translation!
3. **Manual Adjustments:**
    - Delete the YAML frontmatter (`--- title: ... ---`) at the top of the pasted text.
    - Locate any custom Nunjucks image shortcodes (`{% image ... %}` or `{% image_cc ... %}`) and drag-and-drop the actual image files from your local `src/static/img/` folder directly into the editor to replace them.
4. **Set the Canonical URL Manually (Crucial for SEO):**
   - Click the `...` (More settings menu) in the top-right corner of the Medium editor.
   - Scroll down to **Advanced Settings**.
   - Check the box for **"This story was originally published elsewhere"**.
   - Paste the absolute URL to the original post on `carteakey.dev` (e.g., `https://carteakey.dev/posts/...`).
   - Click **Save canonical link**.
5. **Publish!**
