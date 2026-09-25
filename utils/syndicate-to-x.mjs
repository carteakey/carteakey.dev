#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'
import { TwitterApi } from 'twitter-api-v2'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const NOTES_DIR = path.join(REPO_ROOT, 'src', 'notes')
const POSTS_DIR = path.join(REPO_ROOT, 'src', 'posts')

function parseContent(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    throw new Error('Could not parse frontmatter')
  }
  const frontmatter = yaml.load(match[1]) || {}
  const body = match[2].trim()
  return { frontmatter, body, rawFrontmatter: match[1] }
}

function getCanonicalUrl(filePath, frontmatter) {
  const relativePath = path.relative(REPO_ROOT, filePath)

  if (frontmatter.permalink) {
    let p = frontmatter.permalink
    const fileSlug = path.basename(filePath, path.extname(filePath)).replace(/^\d{4}-\d{2}-\d{2}-/, '')
    p = p.replace('{{ page.fileSlug }}', fileSlug)
    return `https://carteakey.dev${p.startsWith('/') ? p : '/' + p}`
  }

  if (relativePath.startsWith('src/notes/')) {
    const fileSlug = path.basename(filePath, path.extname(filePath)).replace(/^\d{4}-\d{2}-\d{2}-/, '')
    return `https://carteakey.dev/notes/${fileSlug}/`
  }

  if (relativePath.startsWith('src/posts/')) {
    const withoutSrc = relativePath.replace(/^src\/posts\//, '').replace(/\.md$/, '')
    const parts = withoutSrc.split('/')
    const lastPart = parts[parts.length - 1].replace(/^\d{4}-\d{2}-\d{2}-/, '')
    parts[parts.length - 1] = lastPart
    return `https://carteakey.dev/blog/${parts.join('/')}/`
  }

  return 'https://carteakey.dev/'
}

function extractImages(body, frontmatter) {
  const images = []
  if (frontmatter.image) {
    images.push(frontmatter.image.startsWith('.') ? frontmatter.image : `.${frontmatter.image}`)
  }
  const imageRegex = /{% image(?:_cc)?\s+"([^"]+)"/g
  let match
  while ((match = imageRegex.exec(body)) !== null) {
    images.push(match[1])
  }
  return [...new Set(images)]
}

function cleanMarkdown(text) {
  return text
    .replace(/{% image[\s\S]*?%}/g, '')
    .replace(/{% remote_image[\s\S]*?%}/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^>\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function buildThread(text, canonicalUrl, maxLength = 250) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  const rawTweets = []

  for (const para of paragraphs) {
    if (para.length <= maxLength) {
      rawTweets.push(para)
    } else {
      const sentences = para.split(/(?<=[.?!])\s+/).filter(Boolean)
      let cur = ''
      for (const s of sentences) {
        if (!cur) {
          cur = s
        } else if ((cur + ' ' + s).trim().length <= maxLength) {
          cur = (cur + ' ' + s).trim()
        } else {
          rawTweets.push(cur)
          cur = s
        }
      }
      if (cur) rawTweets.push(cur)
    }
  }

  if (rawTweets.length === 0) {
    return [`${canonicalUrl}`]
  }

  // Append permalink to final tweet if it fits, else append as concluding tweet
  const permalinkNotice = `\n\n${canonicalUrl}`
  const lastIdx = rawTweets.length - 1
  if ((rawTweets[lastIdx] + permalinkNotice).length <= maxLength) {
    rawTweets[lastIdx] += permalinkNotice
  } else {
    rawTweets.push(`Read more on carteakey.dev:\n${canonicalUrl}`)
  }

  if (rawTweets.length === 1) {
    return rawTweets
  }

  return rawTweets.map((t, idx, arr) => `(${idx + 1}/${arr.length}) ${t}`)
}

function buildPromoTweet(frontmatter, canonicalUrl) {
  const title = frontmatter.title || 'New post'
  const desc = frontmatter.description || frontmatter.seoDescription || ''
  const tags = (frontmatter.tags || [])
    .filter((t) => t.toLowerCase() !== 'posts')
    .map((t) => `#${t.replace(/\s+/g, '')}`)
    .join(' ')

  const parts = [title]
  if (desc) parts.push(desc)
  parts.push(canonicalUrl)
  if (tags) parts.push(tags)

  return [parts.join('\n\n')]
}

async function updateFrontmatterWithTweetUrl(filePath, rawContent, tweetUrl) {
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
  const isDryRun = args.includes('--dry-run') || args.includes('--draft')
  const force = args.includes('--force')
  const setUrlIndex = args.indexOf('--set-url')
  const manualTweetUrl = setUrlIndex !== -1 ? args[setUrlIndex + 1] : null
  const modeIndex = args.indexOf('--mode')
  const requestedMode = modeIndex !== -1 ? args[modeIndex + 1] : null

  let targetFile = args.find((a) => !a.startsWith('--') && a.endsWith('.md'))

  // Default to latest note if nothing specified
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

  const isPost = targetFile.includes('/src/posts/')
  const rawContent = await fs.readFile(targetFile, 'utf-8')
  const { frontmatter, body } = parseContent(rawContent)
  const canonicalUrl = getCanonicalUrl(targetFile, frontmatter)
  const mode = requestedMode || (isPost ? 'promo' : 'thread')

  console.log(`\n========================================`)
  console.log(`Target: ${path.relative(REPO_ROOT, targetFile)}`)
  console.log(`Type:   ${isPost ? 'Blog Post' : 'Note'}`)
  console.log(`Title:  "${frontmatter.title || 'Untitled'}"`)
  console.log(`Link:   ${canonicalUrl}`)
  console.log(`Mode:   ${mode}`)
  console.log(`========================================`)

  if (manualTweetUrl) {
    await updateFrontmatterWithTweetUrl(targetFile, rawContent, manualTweetUrl)
    console.log(`\nLinked note/post to tweet URL: ${manualTweetUrl}`)
    return
  }

  if (frontmatter.tweet_url) {
    console.log(`\nAlready syndicated to X: ${frontmatter.tweet_url}`)
    if (!force) {
      console.log('Pass --force to preview draft or re-syndicate.')
      return
    }
  }

  const images = extractImages(body, frontmatter)
  let tweets = []

  if (mode === 'promo') {
    tweets = buildPromoTweet(frontmatter, canonicalUrl)
  } else {
    const cleanText = cleanMarkdown(body)
    tweets = buildThread(cleanText, canonicalUrl)
  }

  console.log(`\nDraft for X/Twitter (${tweets.length} tweet${tweets.length > 1 ? 's' : ''}):`)
  tweets.forEach((chunk, i) => {
    console.log(`\n--- [Tweet ${i + 1}/${tweets.length}] (${chunk.length} chars) ---`)
    console.log(chunk)
  })

  if (images.length > 0) {
    console.log(`\nAttached media (${images.length}):`)
    images.forEach((img) => console.log(`- ${img}`))
  }

  const hasTwitterCreds =
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_TOKEN_SECRET

  if (!hasTwitterCreds || isDryRun) {
    console.log('\n[Status] Draft ready for review / manual publishing.')
    if (!hasTwitterCreds) {
      console.log('To enable automated 1-click posting, ensure all 4 keys are set in .env:')
      console.log('- TWITTER_API_KEY')
      console.log('- TWITTER_API_SECRET')
      console.log('- TWITTER_ACCESS_TOKEN')
      console.log('- TWITTER_ACCESS_TOKEN_SECRET')
    }
    console.log(`To link after manual posting:`)
    console.log(`node utils/syndicate-to-x.mjs "${path.relative(REPO_ROOT, targetFile)}" --set-url <tweet_url>`)
    return
  }

  console.log('\nPosting live to X...')
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  })

  // Upload media if present (up to 4 images for the first tweet)
  let mediaIds = []
  if (images.length > 0) {
    console.log(`Uploading ${Math.min(images.length, 4)} media asset(s)...`)
    for (const imgPath of images.slice(0, 4)) {
      const fullImgPath = path.resolve(REPO_ROOT, imgPath)
      try {
        const mediaId = await client.v1.uploadMedia(fullImgPath)
        mediaIds.push(mediaId)
        console.log(`  Uploaded: ${imgPath} (media ID: ${mediaId})`)
      } catch (err) {
        console.warn(`  Warning: Failed to upload media ${imgPath}:`, err.message)
      }
    }
  }

  let previousTweetId = null
  let firstTweetUrl = null

  for (let i = 0; i < tweets.length; i++) {
    const text = tweets[i]
    const payload = { text }

    if (i === 0 && mediaIds.length > 0) {
      payload.media = { media_ids: mediaIds }
    }

    if (previousTweetId) {
      payload.reply = { in_reply_to_tweet_id: previousTweetId }
    }

    console.log(`Publishing tweet ${i + 1}/${tweets.length}...`)
    const result = await client.v2.tweet(payload)
    const tweetId = result.data.id
    previousTweetId = tweetId

    if (i === 0) {
      let handle = 'krtychn'
      try {
        const me = await client.v2.me()
        if (me?.data?.username) handle = me.data.username
      } catch (_) {}
      firstTweetUrl = `https://x.com/${handle}/status/${tweetId}`
    }
  }

  console.log(`\nSuccessfully syndicated to X!`)
  console.log(`Thread URL: ${firstTweetUrl}`)
  await updateFrontmatterWithTweetUrl(targetFile, rawContent, firstTweetUrl)
  console.log(`Updated ${path.relative(REPO_ROOT, targetFile)} with tweet_url: "${firstTweetUrl}"`)
}

main().catch((err) => {
  console.error('Syndication error:', err)
  process.exit(1)
})
