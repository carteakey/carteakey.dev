#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const NOTES_DIR = path.join(REPO_ROOT, 'src', 'notes')
const IMAGES_DIR = path.join(REPO_ROOT, 'src', 'static', 'img', 'notes')

function extractTweetId(input) {
  const match = input.match(/status\/(\d+)/i) || input.match(/^(\d+)$/)
  return match ? match[1] : null
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
    .replace(/-+$/, '')
}

async function downloadFile(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`)
  }
  const buffer = await res.arrayBuffer()
  await fs.writeFile(destPath, Buffer.from(buffer))
}

async function main() {
  const args = process.argv.slice(2)
  const urlArg = args.find((a) => !a.startsWith('--'))

  if (!urlArg) {
    console.error('Usage: node utils/ingest-tweet.mjs <tweet-url-or-id> [--title "Optional Title"] [--tags Tag1,Tag2]')
    process.exit(1)
  }

  const tweetId = extractTweetId(urlArg)
  if (!tweetId) {
    console.error(`Error: Could not extract tweet ID from "${urlArg}"`)
    process.exit(1)
  }

  console.log(`Fetching tweet ${tweetId} via fxtwitter API...`)
  const apiRes = await fetch(`https://api.fxtwitter.com/status/${tweetId}`)
  if (!apiRes.ok) {
    throw new Error(`fxtwitter returned ${apiRes.status}: ${apiRes.statusText}`)
  }

  const data = await apiRes.json()
  if (data.code !== 200 || !data.tweet) {
    throw new Error(`Failed to retrieve tweet: ${data.message || 'Unknown error'}`)
  }

  const tweet = data.tweet
  const tweetText = tweet.text || ''
  const authorName = tweet.author?.name || 'carteakey'
  const authorHandle = tweet.author?.screen_name || 'carteakey'
  const tweetUrl = `https://x.com/${authorHandle}/status/${tweet.id}`

  // Parse date
  const tweetDate = tweet.created_timestamp
    ? new Date(tweet.created_timestamp * 1000)
    : new Date()
  const dateStr = tweetDate.toISOString().slice(0, 10)

  // Title & slug
  const titleArgIndex = args.indexOf('--title')
  let title = titleArgIndex !== -1 ? args[titleArgIndex + 1] : ''
  if (!title) {
    const firstLine = tweetText.split('\n')[0].replace(/https?:\/\/\S+/g, '').trim()
    title = firstLine.slice(0, 60) || `Note from ${dateStr}`
  }

  const baseSlug = slugify(title) || `tweet-${tweetId}`
  const noteSlug = `${dateStr}-${baseSlug}`
  const noteFilename = `${noteSlug}.md`
  const noteFilePath = path.join(NOTES_DIR, noteFilename)

  // Tags
  const tagsArgIndex = args.indexOf('--tags')
  let tags = ['AI']
  if (tagsArgIndex !== -1 && args[tagsArgIndex + 1]) {
    tags = args[tagsArgIndex + 1].split(',').map((t) => t.trim()).slice(0, 2)
  }

  // Handle photos/media
  await fs.mkdir(IMAGES_DIR, { recursive: true })
  const photos = tweet.media?.photos || []
  const imageShortcodes = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const ext = photo.url.includes('.png') ? 'png' : 'jpg'
    const imageName = `${baseSlug}-${i + 1}.${ext}`
    const imagePath = path.join(IMAGES_DIR, imageName)
    const relativeImagePath = `./src/static/img/notes/${imageName}`

    console.log(`Downloading media ${i + 1}/${photos.length} -> ${relativeImagePath}`)
    await downloadFile(photo.url, imagePath)

    const altText = photo.alt_text || title
    imageShortcodes.push(
      `{% image "${relativeImagePath}", "${altText.replace(/"/g, '\\"')}", "w-full rounded-lg border border-surface-border" %}`
    )
  }

  // Clean description for frontmatter
  const cleanDescription = tweetText
    .replace(/\n+/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .slice(0, 160)
    .trim()

  // Format note content
  let bodyContent = tweetText
    // Remove standalone t.co links that were for media
    .replace(/https:\/\/t\.co\/\w+/g, '')
    .trim()

  if (imageShortcodes.length > 0) {
    bodyContent = `${bodyContent}\n\n${imageShortcodes.join('\n\n')}`
  }

  const frontmatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    'layout: layouts/note.njk',
    'permalink: /notes/{{ page.fileSlug }}/',
    `description: "${cleanDescription.replace(/"/g, '\\"')}"`,
    `date: ${dateStr}`,
    'authored_by: human',
    `tweet_url: "${tweetUrl}"`,
    'tags:',
    ...tags.map((t) => `  - ${t}`),
    '---',
    '',
    bodyContent,
    ''
  ].join('\n')

  await fs.writeFile(noteFilePath, frontmatter, 'utf-8')
  console.log(`\nSuccessfully ingested note:`)
  console.log(`- File: ${path.relative(REPO_ROOT, noteFilePath)}`)
  console.log(`- Tweet: ${tweetUrl}`)
  console.log(`- Date: ${dateStr}`)
  if (photos.length > 0) {
    console.log(`- Media: ${photos.length} image(s) downloaded to src/static/img/notes/`)
  }
}

main().catch((err) => {
  console.error('Ingest failed:', err)
  process.exit(1)
})
