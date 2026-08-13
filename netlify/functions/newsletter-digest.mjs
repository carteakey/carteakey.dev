import { Redis } from '@upstash/redis'
import { fetchPosts, selectDigestPosts, sendWithResend, subscriberKey } from '../../utils/newsletter-digest.mjs'

const LAST_SENT_KEY = 'newsletter:digest:last-published-at'

async function getSubscribers() {
  const token = process.env.NETLIFY_AUTH_TOKEN
  const siteId = process.env.NETLIFY_SITE_ID
  if (!token || !siteId) throw new Error('NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID are required')
  const headers = { Authorization: `Bearer ${token}` }
  const formsResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/forms`, { headers })
  if (!formsResponse.ok) throw new Error(`Netlify forms request failed with ${formsResponse.status}`)
  const form = (await formsResponse.json()).find((item) => item.name === 'newsletter')
  if (!form) return []

  const subscribers = new Set()
  for (let page = 1; ; page += 1) {
    const response = await fetch(`https://api.netlify.com/api/v1/forms/${form.id}/submissions?per_page=100&page=${page}`, { headers })
    if (!response.ok) throw new Error(`Netlify submissions request failed with ${response.status}`)
    const submissions = await response.json()
    for (const submission of submissions) {
      const email = String(submission.data?.email || '').trim().toLowerCase()
      const consent = submission.data?.consent
      if (email && consent && !submission.data?.['bot-field']) subscribers.add(email)
    }
    if (submissions.length < 100) break
  }
  return [...subscribers]
}

export async function handler() {
  const redis = Redis.fromEnv()
  const [lastSent, posts, subscribers] = await Promise.all([
    redis.get(LAST_SENT_KEY),
    fetchPosts(),
    getSubscribers(),
  ])
  const digestPosts = selectDigestPosts(posts, { since: lastSent || undefined })
  if (!digestPosts.length) return { statusCode: 200, body: JSON.stringify({ sent: 0, reason: 'no-new-posts' }) }

  const activeSubscribers = []
  for (const email of subscribers) {
    const unsubscribed = await redis.sismember('newsletter:unsubscribed', subscriberKey(email))
    if (!unsubscribed) activeSubscribers.push(email)
  }
  if (!activeSubscribers.length) return { statusCode: 200, body: JSON.stringify({ sent: 0, reason: 'no-active-subscribers' }) }

  await sendWithResend({ to: activeSubscribers, posts: digestPosts })
  await redis.set(LAST_SENT_KEY, digestPosts[0].publishedAt.toISOString())
  return { statusCode: 200, body: JSON.stringify({ sent: activeSubscribers.length, posts: digestPosts.length }) }
}
