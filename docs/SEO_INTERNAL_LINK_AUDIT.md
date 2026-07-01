# SEO Internal Link Audit

Date: 2026-07-01

## Scope

Generated `_site/` and checked local `href` and `src` targets across rendered HTML after the SEO metadata pass.

## Result

- Fixed outdated internal links to the Folio launch post, the bouncing-balls prompt, and the original Unforwarder post.
- Stopped external tool labels in the feed from linking to missing taxonomy pages.
- Expanded `raw.txt` generation to cover notes, reviews, and lexicon entries that expose the copy-as-markdown control.
- Removed missing image requests from the hidden Mac draft and Radiohead archive folio placeholders.

## Command

```bash
npm run build
node - <<'NODE'
const fs = require('fs');
const path = require('path');
const root = '_site';
const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && file.endsWith('.html')) htmlFiles.push(file);
  }
}
walk(root);
const missing = [];
function existsForUrl(href) {
  const cleanRaw = href.split('#')[0].split('?')[0];
  if (!cleanRaw || !cleanRaw.startsWith('/')) return true;
  let clean = cleanRaw;
  try { clean = decodeURIComponent(cleanRaw); } catch {}
  if (/\.[a-z0-9]+$/i.test(clean)) return fs.existsSync(path.join(root, clean));
  return fs.existsSync(path.join(root, clean, 'index.html')) || fs.existsSync(path.join(root, `${clean}.html`));
}
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const links = [...html.matchAll(/\s(?:href|src)=["']([^"']+)["']/g)].map(m => m[1]);
  for (const href of links) {
    if (/^(https?:|mailto:|tel:|#|data:|javascript:)/.test(href)) continue;
    if (!existsForUrl(href)) missing.push({ file, href });
  }
}
const unique = [...new Map(missing.map(item => [`${item.file}\t${item.href}`, item])).values()];
console.log(`Checked ${htmlFiles.length} HTML files.`);
console.log(`Missing internal href/src targets: ${unique.length}`);
for (const item of unique) console.log(`${item.file}\t${item.href}`);
NODE
```
