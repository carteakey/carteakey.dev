const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Use glob to find all .njk files in specified directories
const patterns = [
  'src/*.njk',
  'src/blog/**/*.njk',
  'src/folio/**/*.njk',
  'src/_includes/layouts/**/*.njk',
  'src/_includes/components/**/*.njk'
];

let files = [];
patterns.forEach(pattern => {
  files = files.concat(glob.sync(pattern, { cwd: process.cwd() }));
});

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Rounding
  content = content.replace(/rounded-(md|lg|xl|2xl|3xl|4xl)/g, 'rounded-sm');
  content = content.replace(/rounded-full bg-gray-100/g, 'rounded-sm bg-gray-100');

  // 2. Cards -> Surface
  // Handle variations with extra classes
  content = content.replace(/\bcard card-hover card-compact\b/g, 'surface surface-compact surface-hover rounded-sm');
  content = content.replace(/\bcard card-compact card-hover\b/g, 'surface surface-compact surface-hover rounded-sm');
  content = content.replace(/\bcard card-hover h-full card-padding\b/g, 'surface surface-hover h-full surface-padding rounded-sm');
  content = content.replace(/\bcard card-padding\b/g, 'surface surface-padding rounded-sm');
  content = content.replace(/\bcard card-hover\b/g, 'surface surface-hover rounded-sm');
  content = content.replace(/\bcard card-compact\b/g, 'surface surface-compact rounded-sm');
  
  // Specific complex ones found in grep
  content = content.replace(/class="card card-hover overflow-hidden p-0"/g, 'class="surface surface-hover overflow-hidden p-0 rounded-sm"');
  content = content.replace(/class="card card-hover card-compact p-6"/g, 'class="surface surface-hover surface-compact rounded-sm p-6"');
  content = content.replace(/class="feed-card card card-compact card-hover"/g, 'class="feed-card surface surface-compact surface-hover rounded-sm"');
  
  // Naked card (only if not preceded/followed by something like twitter:card)
  content = content.replace(/class="([^"]*)\bcard\b([^"]*)"/g, (match, p1, p2) => {
    // Avoid replacing in string literals that aren't actually UI cards
    if (match.includes('twitter:card')) return match;
    // Replace 'card' with 'surface rounded-sm'
    let newClass = `${p1}surface rounded-sm${p2}`.replace(/\s+/g, ' ').trim();
    return `class="${newClass}"`;
  });

  // 3. Typography
  
  // Section labels / kickers
  content = content.replace(/text-xs\s+font-semibold\s+uppercase\s+tracking-widest\s+text-gray-400\s+(?:dark:text-gray-500\s+)?mb-2/g, 'editorial-kicker mb-2');
  content = content.replace(/text-xs\s+font-semibold\s+uppercase\s+tracking-widest\s+text-gray-400\s+dark:text-gray-500\s+py-2/g, 'editorial-kicker py-2');
  content = content.replace(/text-xs\s+uppercase\s+tracking-wide\s+font-semibold\s+text-gray-400/g, 'editorial-kicker');
  content = content.replace(/text-xs\s+uppercase\s+tracking-wide\s+text-gray-500\s+dark:text-gray-400/g, 'editorial-kicker');
  content = content.replace(/text-[0-9.]+rem\s+uppercase\s+tracking-wider/g, 'editorial-kicker');
  
  // Title links
  content = content.replace(/font-semibold\s+text-gray-900\s+dark:text-gray-100\s+title-hover/g, 'editorial-title-link title-hover');
  content = content.replace(/font-semibold\s+text-gray-900\s+dark:text-gray-100/g, 'editorial-title');
  content = content.replace(/text-base\s+font-semibold\s+m-0\s+text-gray-900\s+dark:text-gray-100/g, 'editorial-title m-0');
  content = content.replace(/text-lg\s+font-semibold\s+tracking-tight\s+m-0\s+text-gray-900\s+dark:text-gray-100/g, 'editorial-title m-0');
  content = content.replace(/text-sm\s+font-semibold\s+text-gray-900\s+dark:text-white/g, 'editorial-title-compact');
  content = content.replace(/text-sm\s+font-semibold\s+leading-snug\s+text-gray-900\s+dark:text-gray-100/g, 'editorial-title-compact');
  content = content.replace(/text-sm\s+font-semibold/g, 'editorial-title-compact');
  content = content.replace(/text-base\s+font-bold\s+text-gray-900\s+dark:text-gray-100/g, 'editorial-title');

  // Support copy
  content = content.replace(/text-sm\s+text-gray-500\s+dark:text-gray-400\s+mt-0\.5\s+m-0\s+leading-relaxed/g, 'editorial-support-compact mt-0.5 m-0');
  content = content.replace(/text-sm\s+text-gray-500\s+dark:text-gray-400/g, 'editorial-support-compact');
  content = content.replace(/text-sm\s+text-gray-600\s+dark:text-gray-300/g, 'editorial-support-compact');
  content = content.replace(/text-sm\s+text-gray-600\s+dark:text-gray-400/g, 'editorial-support-compact');
  content = content.replace(/text-xs\s+text-gray-500\s+dark:text-gray-400\s+mt-1\s+mb-3/g, 'editorial-support-compact mt-1 mb-3');
  content = content.replace(/text-xs\s+leading-relaxed\s+text-gray-500\s+dark:text-gray-400/g, 'editorial-support-compact');
  content = content.replace(/text-sm\s+leading-relaxed\s+text-gray-600\s+dark:text-gray-400/g, 'editorial-support');
  content = content.replace(/text-sm\s+leading-relaxed\s+text-gray-600\s+dark:text-gray-300/g, 'editorial-support');

  // Meta text
  content = content.replace(/text-xs\s+text-gray-400\s+dark:text-gray-500\s+hover:underline/g, 'editorial-meta-link');
  content = content.replace(/text-xs\s+text-gray-400\s+hover:text-gray-600\s+dark:hover:text-gray-300\s+transition-colors/g, 'editorial-meta-link');
  content = content.replace(/text-xs\s+text-gray-400\s+hover:underline/g, 'editorial-meta-link');
  
  // Font sans
  content = content.replace(/font-sans/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
