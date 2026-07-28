import { Redis } from '@upstash/redis'
import { logRuntimeError } from './_runtime-log.js'

const ALLOWED_SOURCES = new Set(['homepage', 'newsletter-page', 'unknown'])

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(payload),
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' })
  }

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return json(202, { tracked: false, reason: 'redis-not-configured' })
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const source = ALLOWED_SOURCES.has(body.source) ? body.source : 'unknown'
    const day = new Date().toISOString().slice(0, 10)
    const redis = new Redis({ url, token })

    await Promise.all([
      redis.incr('newsletter:submissions'),
      redis.hincrby('newsletter:submissions:source', source, 1),
      redis.incr(`newsletter:submissions:day:${day}`),
    ])

    return json(200, { tracked: true })
  } catch (error) {
    logRuntimeError('function:newsletter-event', error, {
      method: event.httpMethod,
    })
    return json(500, { tracked: false, error: 'Unable to record event' })
  }
}
