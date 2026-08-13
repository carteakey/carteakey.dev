import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { fetchPosts, renderDigest, selectDigestPosts, sendWithResend } from './newsletter-digest.mjs'

const recipient = process.argv[2] || process.env.NEWSLETTER_TEST_EMAIL
const posts = selectDigestPosts(await fetchPosts(), { test: true })
if (!posts.length) throw new Error('The feed contains no public posts to preview')

const preview = renderDigest(posts, { email: recipient, secret: process.env.NEWSLETTER_SECRET || 'local-preview-only' })
await mkdir('.cache', { recursive: true })
await writeFile('.cache/newsletter-preview.html', preview.html)

if (!recipient || !process.env.RESEND_API_KEY || !process.env.NEWSLETTER_SECRET) {
  console.log(`Previewed "${preview.subject}" at .cache/newsletter-preview.html`)
  console.log('Set NEWSLETTER_TEST_EMAIL, RESEND_API_KEY, and NEWSLETTER_SECRET to send it.')
  process.exitCode = 2
} else {
  await sendWithResend({ to: recipient, posts })
  console.log(`Sent "${preview.subject}" to ${recipient}`)
}
