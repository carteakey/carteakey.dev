import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const LEGACY_SLUG_ALIASES = {
  'optimizing-gpt-oss-120b-local-inference': ['optimizing gpt-oss-120b-local inference'],
  'why-one-should-self-host-in-2025': ['why-one-should-self-host-in-2024-draft'],
  'exposing-local-llms-to-the-internet': ['exposing-local-llms-to-the-internet-draft'],
  'mounting-additional-drives-in-wsl2': ['mounting-additional-drives-in-wsl2-draft'],
  'guide-to-forcing-or-blocking-windows-updates': ['guide-to-forcing-or-blocking-windows-updates-draft'],
  'remoting-into-wsl2-externally-the-easy-way': ['remoting-into-wsl2-externally-the-simple-way'],
}

const CANONICAL_BY_ALIAS = Object.entries(LEGACY_SLUG_ALIASES).reduce((acc, [canonicalSlug, aliases]) => {
  aliases.forEach((aliasSlug) => {
    acc[aliasSlug] = canonicalSlug
  })
  return acc
}, {})

function splitSlugNamespace(slug) {
  const parts = slug.split(':')
  if (parts.length < 2) {
    return { namespace: '', baseSlug: slug }
  }

  const namespace = `${parts.shift()}:`
  return { namespace, baseSlug: parts.join(':') }
}

function withNamespace(namespace, slug) {
  return `${namespace}${slug}`
}

function toHyphenSlug(slug) {
  return slug.trim().replace(/\s+/g, '-')
}

function resolveCanonicalSlug(slug) {
  const { namespace, baseSlug } = splitSlugNamespace(slug)
  const canonicalBaseSlug = CANONICAL_BY_ALIAS[baseSlug] || (baseSlug.includes(' ') ? toHyphenSlug(baseSlug) : baseSlug)
  return withNamespace(namespace, canonicalBaseSlug)
}

function getAliasCandidates(canonicalSlug) {
  const { namespace, baseSlug } = splitSlugNamespace(canonicalSlug)
  const explicitAliases = LEGACY_SLUG_ALIASES[baseSlug] || []
  const aliases = [...explicitAliases]

  if (baseSlug.includes('-')) {
    const spaceVariant = baseSlug.replace(/-/g, ' ')
    if (spaceVariant !== baseSlug) {
      aliases.push(spaceVariant)
    }
  }

  return [...new Set(aliases)].map((aliasBaseSlug) => withNamespace(namespace, aliasBaseSlug))
}

async function mergeLegacyCounters(canonicalSlug, counterName) {
  const aliasSlugs = getAliasCandidates(canonicalSlug)
  if (!aliasSlugs.length) {
    return
  }

  const canonicalKey = `${counterName}:${canonicalSlug}`
  const aliasKeys = aliasSlugs.map((aliasSlug) => `${counterName}:${aliasSlug}`)
  const keys = [canonicalKey, ...aliasKeys]
  const values = await Promise.all(keys.map((key) => redis.get(key)))
  const numericValues = values.map((value) => Number(value || 0))
  const mergedCount = numericValues.reduce((sum, value) => sum + value, 0)

  if (mergedCount !== numericValues[0]) {
    await redis.set(canonicalKey, mergedCount)
  }

  const aliasDeleteTasks = aliasKeys
    .map((key, index) => ({ key, value: numericValues[index + 1] }))
    .filter((entry) => entry.value > 0)
    .map((entry) => redis.del(entry.key))

  if (aliasDeleteTasks.length) {
    await Promise.all(aliasDeleteTasks)
  }
}

exports.handler = async function(event, context) {
  try {
    let slug;
    
    // Handle GET requests to fetch count and increment view
    if (event.httpMethod === "GET") {
      slug = event.queryStringParameters?.slug;
      const trackView = event.queryStringParameters?.trackView === 'true';
      
      if (!slug) {
        return { statusCode: 400, body: "Post slug is required" };
      }

      const canonicalSlug = resolveCanonicalSlug(slug);
      await mergeLegacyCounters(canonicalSlug, 'upvotes');
      await mergeLegacyCounters(canonicalSlug, 'views');
      
      // Get current upvote count
      const count = await redis.get(`upvotes:${canonicalSlug}`) || 0;
      
      // Get current view count
      let views = await redis.get(`views:${canonicalSlug}`) || 0;
      
      // Increment view count if tracking is requested (only once per page load)
      if (trackView) {
        views = await redis.incr(`views:${canonicalSlug}`);
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ count, views })
      };
    }
    
    // Handle POST requests to increment upvote count
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body);
      slug = body.slug;
      
      if (!slug) {
        return { statusCode: 400, body: "Post slug is required" };
      }

      const canonicalSlug = resolveCanonicalSlug(slug);
      await mergeLegacyCounters(canonicalSlug, 'upvotes');
      await mergeLegacyCounters(canonicalSlug, 'views');
      
      // Increment upvote count using Redis INCR
      const count = await redis.incr(`upvotes:${canonicalSlug}`);
      
      // Get current view count (don't increment)
      const views = await redis.get(`views:${canonicalSlug}`) || 0;
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count, views })
      };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (error) {
    console.error('Redis error:', error);
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
};
