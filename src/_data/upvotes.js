import { Redis } from '@upstash/redis'



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

function getCanonicalSlug(slug) {
  const { namespace, baseSlug } = splitSlugNamespace(slug)
  const canonicalBaseSlug = CANONICAL_BY_ALIAS[baseSlug] || (baseSlug.includes(' ') ? toHyphenSlug(baseSlug) : baseSlug)
  return withNamespace(namespace, canonicalBaseSlug)
}

export default async function() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Upstash Redis credentials missing, returning empty upvotes');
    return { posts: {} };
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    const posts = {};
    
    // Get all keys
    const keys = await redis.keys('upvotes:*');
    
    // Get all values in parallel
    const values = await Promise.all(
      keys.map(key => redis.get(key))
    );
    
    // Create posts object
    keys.forEach((key, index) => {
      const slug = key.replace('upvotes:', '')
      const canonicalSlug = getCanonicalSlug(slug)
      const existingCount = Number(posts[canonicalSlug] || 0)
      const incomingCount = Number(values[index] || 0)
      posts[canonicalSlug] = existingCount + incomingCount
    });
    
    return { posts };
  } catch (error) {
    console.error('Redis error:', error);
    return { posts: {} };
  }
} 
