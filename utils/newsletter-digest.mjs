import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const SITE_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://carteakey.dev'
const DEFAULT_FROM = 'Kartikey Chauhan <digest@newsletter.carteakey.dev>'
const DEFAULT_REPLY_TO = 'carteakey.dev@gmail.com'
const ISSUE_LOOKBACK_DAYS = 8

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
}

function stripHtml(value = '') {
  return decodeXml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function element(entry, name) {
  return decodeXml(entry.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] || '')
}

export function parseAtom(xml) {
  return [...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi)].map((match) => {
    const entry = match[1]
    const link = entry.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || ''
    const published = element(entry, 'published') || element(entry, 'updated')
    const description = stripHtml(element(entry, 'summary') || element(entry, 'content'))
    return {
      title: stripHtml(element(entry, 'title')),
      url: new URL(decodeXml(link), SITE_URL).href,
      publishedAt: new Date(published),
      description,
    }
  })
    .filter((post) => post.title && post.url && !Number.isNaN(post.publishedAt.valueOf()))
    .sort((a, b) => b.publishedAt - a.publishedAt)
}

export async function fetchPosts({ feedUrl = `${SITE_URL}/feed.xml` } = {}) {
  const response = await fetch(feedUrl, { headers: { 'user-agent': 'carteakey.dev-newsletter/1.0' } })
  if (!response.ok) throw new Error(`Feed request failed with ${response.status}`)
  return parseAtom(await response.text())
}

export function selectDigestPosts(posts, { since, now = new Date(), test = false } = {}) {
  const threshold = since
    ? new Date(since)
    : new Date(now.valueOf() - ISSUE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
  const selected = posts.filter((post) => post.publishedAt > threshold && post.publishedAt <= now).slice(0, 5)
  return selected.length || !test ? selected : posts.slice(0, 1)
}

export function createUnsubscribeToken(email, secret) {
  if (!secret) throw new Error('NEWSLETTER_SECRET is required')
  const payload = Buffer.from(email.trim().toLowerCase()).toString('base64url')
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function readUnsubscribeToken(token, secret) {
  const [payload, signature] = String(token || '').split('.')
  if (!payload || !signature || !secret) return null
  const expected = createHmac('sha256', secret).update(payload).digest()
  let supplied
  try {
    supplied = Buffer.from(signature, 'base64url')
  } catch {
    return null
  }
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null
  return Buffer.from(payload, 'base64url').toString('utf8')
}

export function subscriberKey(email) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

function postSummary(post) {
  if (!post.description) return 'Read the new post on carteakey.dev.'
  if (post.description.length <= 240) return post.description
  const excerpt = post.description.slice(0, 237)
  const wordBoundary = excerpt.lastIndexOf(' ')
  return `${excerpt.slice(0, wordBoundary > 180 ? wordBoundary : excerpt.length).trimEnd()}…`
}

export function renderDigest(posts, { email, secret, siteUrl = SITE_URL } = {}) {
  if (!posts.length) throw new Error('Cannot render a digest without posts')
  const date = new Intl.DateTimeFormat('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())
  const subject = posts.length === 1 ? `New writing: ${posts[0].title}` : `Weekly digest: ${posts.length} new posts`
  const unsubscribeUrl = email && secret
    ? `${siteUrl}/.netlify/functions/newsletter-unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(email, secret))}`
    : `${siteUrl}/newsletter/`
  const postHtml = posts.map((post) => `
    <article style="margin:0 0 28px">
      <h2 style="font:700 20px/1.3 Georgia,serif;margin:0 0 8px"><a href="${escapeHtml(post.url)}" style="color:#111827">${escapeHtml(post.title)}</a></h2>
      <p style="color:#4b5563;font:15px/1.6 system-ui,sans-serif;margin:0 0 8px">${escapeHtml(postSummary(post))}</p>
      <a href="${escapeHtml(post.url)}" style="color:#2563eb;font:600 14px system-ui,sans-serif">Read the post →</a>
    </article>`).join('')
  const html = `<!doctype html><html><body style="background:#f3f4f6;margin:0;padding:24px 12px"><main style="background:#fff;border:1px solid #d1d5db;margin:auto;max-width:620px;padding:32px"><p style="color:#6b7280;font:12px/1.4 ui-monospace,monospace;margin:0 0 8px;text-transform:uppercase">carteakey.dev · ${escapeHtml(date)}</p><h1 style="font:700 28px/1.2 Georgia,serif;margin:0 0 12px">New writing, sent when it is ready.</h1><p style="color:#4b5563;font:15px/1.6 system-ui,sans-serif;margin:0 0 30px">A quiet digest of what I published recently. No filler and no email when there is nothing new.</p>${postHtml}<footer style="border-top:1px solid #e5e7eb;color:#6b7280;font:12px/1.6 system-ui,sans-serif;margin-top:32px;padding-top:18px">You subscribed at carteakey.dev. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#4b5563">Unsubscribe</a> · <a href="${siteUrl}/feed.xml" style="color:#4b5563">RSS</a></footer></main></body></html>`
  const text = [`carteakey.dev — ${date}`, '', 'New writing, sent when it is ready.', '', ...posts.flatMap((post) => [post.title, postSummary(post), post.url, '']), `Unsubscribe: ${unsubscribeUrl}`].join('\n')
  return { subject, html, text }
}

export async function sendWithResend({ to, posts, secret = process.env.NEWSLETTER_SECRET }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is required to send email')
  const recipients = Array.isArray(to) ? to : [to]
  const messages = recipients.map((email) => {
    const issue = renderDigest(posts, { email, secret })
    return {
      from: process.env.NEWSLETTER_FROM || DEFAULT_FROM,
      to: [email],
      reply_to: process.env.NEWSLETTER_REPLY_TO || DEFAULT_REPLY_TO,
      subject: issue.subject,
      html: issue.html,
      text: issue.text,
      headers: { 'List-Unsubscribe': `<${SITE_URL}/.netlify/functions/newsletter-unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(email, secret))}>` },
    }
  })
  const results = []
  for (let index = 0; index < messages.length; index += 100) {
    const response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(messages.slice(index, index + 100)),
    })
    const body = await response.json()
    if (!response.ok) throw new Error(`Resend rejected the digest: ${body.message || response.status}`)
    results.push(body)
  }
  return results
}

export { SITE_URL }
