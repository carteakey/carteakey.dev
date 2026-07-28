import { Redis } from '@upstash/redis'
import { logRuntimeError } from './_runtime-log.js'

const METRICS = new Set(['LCP', 'CLS', 'INP'])
const RATINGS = new Set(['good', 'needs-improvement', 'poor'])

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

function normalizeRoute(value) {
  if (typeof value !== 'string') return '/unknown'
  const route = value.split('?')[0].slice(0, 180)
  return route.startsWith('/') ? route : '/unknown'
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
    const name = String(body.name || '').toUpperCase()
    const rating = String(body.rating || '')
    const value = Number(body.value)

    if (!METRICS.has(name) || !RATINGS.has(rating) || !Number.isFinite(value) || value < 0) {
      return json(400, { error: 'Invalid metric payload' })
    }

    const day = new Date().toISOString().slice(0, 10)
    const route = normalizeRoute(body.route)
    const scale = name === 'CLS' ? 100000 : 1
    const scaledValue = Math.round(value * scale)
    const redis = new Redis({ url, token })
    const metricKey = `web-vitals:${day}:${name}`

    await Promise.all([
      redis.hincrby(metricKey, 'count', 1),
      redis.hincrby(metricKey, 'sumScaled', scaledValue),
      redis.hincrby(metricKey, rating, 1),
      redis.hincrby(`web-vitals:${day}:routes`, `${name}:${route}`, 1),
    ])
    await Promise.all([
      redis.expire(metricKey, 60 * 60 * 24 * 120),
      redis.expire(`web-vitals:${day}:routes`, 60 * 60 * 24 * 120),
    ])

    return json(200, { tracked: true })
  } catch (error) {
    logRuntimeError('function:web-vitals', error, {
      method: event.httpMethod,
    })
    return json(500, { tracked: false, error: 'Unable to record metric' })
  }
}
