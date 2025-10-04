import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ALLOWED_REACTIONS = [
  'thumbs_up',
  'sparkles',
  'rocket',
  'lightbulb',
  'eyes',
]

const reactionKey = (slug) => `reactions:${slug}`

function createCountsObject(rawCounts = {}) {
  const counts = {}
  let total = 0

  for (const id of ALLOWED_REACTIONS) {
    const value = Number(rawCounts[id] ?? 0)
    counts[id] = value
    total += value
  }

  return { counts, total }
}

exports.handler = async function(event) {
  try {
    if (event.httpMethod === 'GET') {
      const slug = event.queryStringParameters?.slug
      if (!slug) {
        return { statusCode: 400, body: 'Post slug is required' }
      }

      const rawCounts = await redis.hgetall(reactionKey(slug))
      const payload = createCountsObject(rawCounts)
      return { statusCode: 200, body: JSON.stringify(payload) }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const slug = body.slug
      const reaction = body.reaction

      if (!slug || !reaction) {
        return { statusCode: 400, body: 'Both slug and reaction are required' }
      }

      if (!ALLOWED_REACTIONS.includes(reaction)) {
        return { statusCode: 400, body: 'Unknown reaction' }
      }

      await redis.hincrby(reactionKey(slug), reaction, 1)
      const rawCounts = await redis.hgetall(reactionKey(slug))
      const payload = createCountsObject(rawCounts)
      return { statusCode: 200, body: JSON.stringify(payload) }
    }

    return { statusCode: 405, body: 'Method Not Allowed' }
  } catch (error) {
    console.error('Redis reaction error:', error)
    return { statusCode: 500, body: `Error: ${error.message}` }
  }
}
