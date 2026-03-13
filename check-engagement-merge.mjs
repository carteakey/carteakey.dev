import 'dotenv/config'
import { Redis } from '@upstash/redis'

function getArgValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1 || index + 1 >= process.argv.length) {
    return undefined
  }
  return process.argv[index + 1]
}

function getPositionalArgs() {
  return process.argv
    .slice(2)
    .filter((arg, index, all) => !arg.startsWith('--') && all[index - 1] !== '--old' && all[index - 1] !== '--new' && all[index - 1] !== '--namespace')
}

function printUsage() {
  console.log(`
Usage:
  npm run metrics:merge-check -- --old "<old-slug>" --new "<new-slug>" [--namespace snippet]
  npm run metrics:merge-check -- "<old-slug>" "<new-slug>" [--namespace snippet]

Examples:
  npm run metrics:merge-check -- --old "optimizing gpt-oss-120b-local inference" --new "optimizing-gpt-oss-120b-local-inference"
  npm run metrics:merge-check -- "wifi guardian" "wifi-guardian" --namespace snippet
`)
}

function normalizeNamespace(rawNamespace) {
  if (!rawNamespace) {
    return ''
  }
  return rawNamespace.endsWith(':') ? rawNamespace : `${rawNamespace}:`
}

function withNamespace(namespace, slug) {
  return `${namespace}${slug}`
}

const oldFlag = getArgValue('--old')
const newFlag = getArgValue('--new')
const namespace = normalizeNamespace(getArgValue('--namespace'))
const positionals = getPositionalArgs()

const oldSlug = oldFlag || positionals[0]
const newSlug = newFlag || positionals[1]

if (process.argv.includes('--help') || process.argv.includes('-h') || !oldSlug || !newSlug) {
  printUsage()
  process.exit(oldSlug && newSlug ? 0 : 1)
}

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. Add them to your environment/.env and retry.')
  process.exit(1)
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const oldKeySlug = withNamespace(namespace, oldSlug)
const newKeySlug = withNamespace(namespace, newSlug)

const [oldUpvotes, newUpvotes, oldViews, newViews] = await Promise.all([
  redis.get(`upvotes:${oldKeySlug}`),
  redis.get(`upvotes:${newKeySlug}`),
  redis.get(`views:${oldKeySlug}`),
  redis.get(`views:${newKeySlug}`),
])

const counts = {
  namespace: namespace || 'post (default)',
  oldSlug: oldKeySlug,
  newSlug: newKeySlug,
  upvotes: {
    old: Number(oldUpvotes || 0),
    new: Number(newUpvotes || 0),
  },
  views: {
    old: Number(oldViews || 0),
    new: Number(newViews || 0),
  },
}

counts.upvotes.expectedMerged = counts.upvotes.old + counts.upvotes.new
counts.views.expectedMerged = counts.views.old + counts.views.new

console.log(`Namespace: ${counts.namespace}`)
console.log(`Old slug: ${counts.oldSlug}`)
console.log(`New slug: ${counts.newSlug}`)
console.log(`Upvotes -> old: ${counts.upvotes.old}, new: ${counts.upvotes.new}, expected merged: ${counts.upvotes.expectedMerged}`)
console.log(`Views   -> old: ${counts.views.old}, new: ${counts.views.new}, expected merged: ${counts.views.expectedMerged}`)
console.log('\nJSON:')
console.log(JSON.stringify(counts, null, 2))
