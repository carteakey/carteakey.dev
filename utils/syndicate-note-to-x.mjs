#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const NOTES_DIR = path.join(REPO_ROOT, 'src', 'notes')

function parseNote(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    throw new Error('Could not parse frontmatter in note')
  }
  const frontmatter = yaml.load(match[1]) || {}
  const body = match[2].trim()
  return { frontmatter, body, rawFrontmatter: match[1] }
}

function extractImages(body) {
  const imageRegex = /{% image\s+"([^"]+)"/g
  const images = []
  let match
  while ((match = imageRegex.exec(body)) !== null) {
    images.push(match[1])
  }
  return images
}

function cleanTextForTweet(body, frontmatter) {
  // Strip image shortcodes
  let text = body.replace(/{% image[\s\S]*?%}/g, '').trim()
  // Clean markdown links [text](url) -> text (url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 $2')
  // Clean blockquotes
  text = text.replace(/^>\s*/gm, '')
  // Normalize whitespace
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

function splitIntoThread(text, maxLength = 275) {
  if (text.length <= maxLength) return [text]

  const paragraphs = text.split(/\n\n+/)
  const tweets = []
  let current = ''

  for (const para of paragraphs) {
    if (!current) {
      if (para.length <= maxLength) {
        current = para
      } else {
        // Break long paragraph by sentences
        const sentences = para.split(/(?<=[.?!])\s+/)
        for (const sentence of sentences) {
          if ((current + ' ' + sentence).trim().length <= maxLength) {
            current = (current + ' ' + sentence).trim()
          } else {
            if (current) tweets.push(current)
            current = sentence
          }
        }
      }
    } else if ((current + '\n\n' + para).length <= maxLength) {
      current = current + '\n\n' + para
    } else {
      tweets.push(current)
      current = para
    }
  }

  if (current) tweets.push(current)
  return tweets.map((t, idx, arr) => (arr.length > 1 ? `(${idx + 1}/${arr.length}) ${t}` : t))
}

async function updateNoteFrontmatter(filePath, rawContent, tweetUrl) {
  const updated = rawContent.replace(
    /^---\r?\n([\s\S]*?)\r?\n---/,
    (match, fmText) => {
      if (/tweet_url:/i.test(fmText)) {
        return match.replace(/tweet_url:.*$/m, `tweet_url: "${tweetUrl}"`)
      }
      return `---\n${fmText.trim()}\ntweet_url: "${tweetUrl}"\n---`
    }
  )
  await fs.writeFile(filePath, updated, 'utf-8')
}

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const setUrlIndex = args.indexOf('--set-url')
  const manualTweetUrl = setUrlIndex !== -1 ? args[setUrlIndex + 1] : null

  let targetFile = args.find((a) => !a.startsWith('--') && a.endsWith('.md'))

  // If no file provided, find latest note
  if (!targetFile) {
    const files = (await fs.readdir(NOTES_DIR))
      .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
      .sort()
      .reverse()
    if (files.length === 0) {
      console.error('No notes found in src/notes/')
      process.exit(1)
    }
    targetFile = path.join(NOTES_DIR, files[0])
    console.log(`Using latest note: ${path.relative(REPO_ROOT, targetFile)}`)
  } else if (!path.isAbsolute(targetFile)) {
    targetFile = path.resolve(REPO_ROOT, targetFile)
  }

  const rawContent = await fs.readFile(targetFile, 'utf-8')
  const { frontmatter, body } = parseNote(rawContent)

  console.log(`\nNote: "${frontmatter.title || 'Untitled'}"`)
  console.log(`Date: ${frontmatter.date}`)

  if (manualTweetUrl) {
    await updateNoteFrontmatter(targetFile, rawContent, manualTweetUrl)
    console.log(`\nLinked note to tweet URL: ${manualTweetUrl}`)
    return
  }

  if (frontmatter.tweet_url) {
    console.log(`Already syndicated to X: ${frontmatter.tweet_url}`)
    if (!args.includes('--force')) {
      console.log('Use --force to preview or re-syndicate.')
      return
    }
  }

  const cleanText = cleanTextForTweet(body, frontmatter)
  const images = extractImages(body)
  const thread = splitIntoThread(cleanText)

  console.log(`\n--- Tweet Preview (${thread.length} tweet${thread.length > 1 ? 's' : ''}) ---`)
  thread.forEach((chunk, i) => {
    console.log(`\n[Tweet ${i + 1}/${thread.length}] (${chunk.length} chars):`)
    console.log(chunk)
  })

  if (images.length > 0) {
    console.log(`\nAttached images (${images.length}):`)
    images.forEach((img) => console.log(`- ${img}`))
  }

  const hasTwitterCreds =
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_TOKEN_SECRET

  if (!hasTwitterCreds) {
    console.log('\n[Info] Twitter API keys not configured in .env.')
    console.log('Required keys for automated posting:')
    console.log('- TWITTER_API_KEY\n- TWITTER_API_SECRET\n- TWITTER_ACCESS_TOKEN\n- TWITTER_ACCESS_TOKEN_SECRET')
    console.log('\nTo manually link a tweet after posting, run:')
    console.log(`node utils/syndicate-note-to-x.mjs "${path.relative(REPO_ROOT, targetFile)}" --set-url <tweet_url>`)
    return
  }

  if (isDryRun) {
    console.log('\n--dry-run enabled. Skipping live tweet.')
    return
  }

  console.log('\nCredentials found. Posting to Twitter/X...')
  // Placeholder for live client dispatch when creds are configured
}

main().catch((err) => {
  console.error('Syndication error:', err)
  process.exit(1)
})
