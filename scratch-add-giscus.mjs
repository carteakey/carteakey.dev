import fs from 'fs';

const files = [
  { path: 'src/posts/agents/2025-10-04-working-with-copilot-codex.md', term: '/blog/meta/working-with-copilot-codex/' },
  { path: 'src/posts/agents/2025-10-05-how-i-let-ai-run-wild-on-my-blog.md', term: '/blog/meta/how-i-let-ai-run-wild-on-my-blog/' },
  { path: 'src/posts/llm-benchmarks/2025-10-04-gpt-oss-vs-gpt-5-benchmarks.md', term: '/blog/gpt-oss-benchmarks/gpt-oss-vs-gpt-5-benchmarks/' }
];

for (const {path, term} of files) {
  let content = fs.readFileSync(path, 'utf8');
  if (content.includes('giscusTerm')) continue;
  if (content.includes('tags:')) {
    content = content.replace('tags:', `giscusTerm: "${term}"\ntags:`);
  } else {
    let lines = content.split('\n');
    let dashCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        dashCount++;
        if (dashCount === 2) {
          lines.splice(i, 0, `giscusTerm: "${term}"`);
          break;
        }
      }
    }
    content = lines.join('\n');
  }
  fs.writeFileSync(path, content);
  console.log(`Updated ${path}`);
}
