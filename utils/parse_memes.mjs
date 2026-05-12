import fs from 'fs';
import yaml from 'js-yaml';

// Since we might not have cheerio, let's use a regex based parser
const html = fs.readFileSync('src/folio/ai-memes/index.html', 'utf8');

const regex = /<div class="meme-card" data-tags="([^"]*)" data-caption="([^"]*)">\s*<span class="card-index">([^<]*)<\/span>\s*(?:<img src="([^"]*)"[^>]*>|<video src="([^"]*)"[^>]*class="meme-video"[^>]*><\/video>)\s*<div class="watermark">.*?<\/div>\s*<div class="meme-meta">\s*<p class="meme-caption">.*?<\/p>\s*<div class="meme-footer">[\s\S]*?<div class="vibe-tooltip">vibed by <span class="vibe-num">(\d+)<\/span>.*?<\/div>\s*<button.*?<\/div>\s*<div class="meme-source">\s*submitted by:\s*<span>([^<]*)<\/span>\s*·([^·]*)·\s*(?:via <a href="([^"]*)"[^>]*>([^<]*)<\/a>)?/gm;

const memes = [];
let match;
while ((match = regex.exec(html)) !== null) {
    const tags = match[1].split(',');
    const caption = match[2];
    const id = match[3];
    const imgSrc = match[4];
    const vidSrc = match[5];
    const vibes = parseInt(match[6], 10);
    const submitter = match[7];
    const time = match[8].trim();
    const sourceUrl = match[9];
    const sourceName = match[10];

    memes.push({
        id,
        image: imgSrc || vidSrc,
        alt: caption, // Using caption as alt for simplicity
        caption,
        tags,
        vibes,
        submitter,
        time,
        source: (sourceUrl && sourceName) ? { name: sourceName, url: sourceUrl } : null,
        isVideo: !!vidSrc
    });
}
console.log(`Extracted ${memes.length} memes.`);
fs.writeFileSync('src/_data/memes.yaml', yaml.dump(memes));
