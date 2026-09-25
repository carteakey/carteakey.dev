#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import * as yaml from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const OG_DIR = path.join(REPO_ROOT, 'src', 'static', 'img', 'og')

function parsePost(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) throw new Error('Could not parse frontmatter')
  const frontmatter = yaml.load(match[1]) || {}
  return { frontmatter, body: match[2], rawFm: match[1] }
}

function escapeXml(unsafe = '') {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

function wrapText(text, maxCharsPerLine = 26) {
  const words = text.split(/\s+/)
  const lines = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxCharsPerLine) {
      current = (current + ' ' + word).trim()
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 3)
}

export async function generateOgCardForPost(postPath) {
  await fs.mkdir(OG_DIR, { recursive: true })

  const raw = await fs.readFile(postPath, 'utf-8')
  const { frontmatter } = parsePost(raw)

  const slug = path.basename(postPath, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '')
  const title = frontmatter.title || 'carteakey.dev'
  const tags = (frontmatter.tags || []).filter((t) => t.toLowerCase() !== 'posts')
  const tagLabel = tags.length > 0 ? tags[0].toUpperCase() : 'BLOG'

  const titleLines = wrapText(title, 26)
  const titleTspans = titleLines
    .map((line, idx) => `<tspan x="64" dy="${idx === 0 ? 0 : 54}">${escapeXml(line)}</tspan>`)
    .join('\n')

  const descSnippet = (frontmatter.description || '')
    .slice(0, 110)
    .replace(/[^\w\s.,;:?!-]/g, '')
    .trim()
  const descLines = wrapText(descSnippet, 44)
  const descTspans = descLines
    .map((line, idx) => `<tspan x="64" dy="${idx === 0 ? 0 : 26}">${escapeXml(line)}</tspan>`)
    .join('\n')

  const svgOverlay = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="1198" height="628" fill="none" stroke="#27272a" stroke-width="2" rx="6" />

      <!-- Eyebrow / Breadcrumb -->
      <text x="64" y="80" font-family="monospace, monospace" font-size="20" font-weight="bold" fill="#60a5fa" letter-spacing="2">CARTEAKEY.DEV</text>
      <text x="250" y="80" font-family="monospace, monospace" font-size="16" fill="#71717a">/ ${escapeXml(tagLabel)}</text>

      <!-- Title -->
      <text x="64" y="210" font-family="serif, Georgia, Times" font-size="44" font-weight="bold" fill="#f4f4f5">
        ${titleTspans}
      </text>

      <!-- Description -->
      <text x="64" y="420" font-family="sans-serif, system-ui" font-size="20" fill="#a1a1aa">
        ${descTspans}
      </text>

      <!-- Footer -->
      <text x="64" y="560" font-family="sans-serif, system-ui" font-size="18" fill="#d4d4d8">Kartikey Chauhan</text>
      <text x="240" y="560" font-family="sans-serif, system-ui" font-size="18" fill="#52525b">·</text>
      <text x="260" y="560" font-family="monospace, monospace" font-size="16" fill="#71717a">carteakey.dev</text>
    </svg>
  `

  const composites = [
    { input: Buffer.from(svgOverlay), top: 0, left: 0 }
  ]

  // If the post has a sketch image, invert & composite it on the right side
  if (frontmatter.image) {
    const sketchRel = frontmatter.image.startsWith('/')
      ? frontmatter.image.slice(1)
      : frontmatter.image
    const sketchPath = path.join(REPO_ROOT, 'src', 'static', sketchRel)

    try {
      await fs.access(sketchPath)
      const sketchBuffer = await sharp(sketchPath)
        .resize(500, 500, { fit: 'inside' })
        .negate({ alpha: false }) // white lines on dark
        .toBuffer()

      composites.push({
        input: sketchBuffer,
        top: 65,
        left: 650
      })
    } catch {
      console.warn(`Could not load sketch image: ${sketchPath}`)
    }
  }

  const outFileName = `${slug}-og.png`
  const outFilePath = path.join(OG_DIR, outFileName)

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 20, g: 20, b: 20, alpha: 1 } // #141414
    }
  })
    .composite(composites)
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(outFilePath)

  console.log(`Generated OG Card: src/static/img/og/${outFileName}`)

  // Update frontmatter with ogImage if not already set
  const ogImagePath = `/img/og/${outFileName}`
  if (!frontmatter.ogImage || frontmatter.ogImage !== ogImagePath) {
    const updated = raw.replace(
      /^---\r?\n([\s\S]*?)\r?\n---/,
      (match, fmText) => {
        if (/ogImage:/i.test(fmText)) {
          return match.replace(/ogImage:.*$/m, `ogImage: ${ogImagePath}`)
        }
        return `---\n${fmText.trim()}\nogImage: ${ogImagePath}\n---`
      }
    )
    await fs.writeFile(postPath, updated, 'utf-8')
    console.log(`Updated frontmatter in ${path.relative(REPO_ROOT, postPath)}: ogImage: ${ogImagePath}`)
  }

  return ogImagePath
}

async function main() {
  const args = process.argv.slice(2)
  const target = args[0]

  if (!target) {
    console.log('Usage: node utils/generate-og-card.mjs <path-to-post-or-note.md>')
    process.exit(1)
  }

  const absPath = path.isAbsolute(target) ? target : path.resolve(REPO_ROOT, target)
  await generateOgCardForPost(absPath)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Failed to generate OG card:', err)
    process.exit(1)
  })
}
