import { Redis } from '@upstash/redis'
import { readUnsubscribeToken, subscriberKey } from '../../utils/newsletter-digest.mjs'

export async function handler(event) {
  const email = readUnsubscribeToken(event.queryStringParameters?.token, process.env.NEWSLETTER_SECRET)
  if (!email) return { statusCode: 400, headers: { 'Content-Type': 'text/plain' }, body: 'This unsubscribe link is invalid or expired.' }
  await Redis.fromEnv().sadd('newsletter:unsubscribed', subscriberKey(email))
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    body: '<!doctype html><html><body style="font:16px/1.6 system-ui;max-width:40rem;margin:4rem auto;padding:0 1rem"><h1>You are unsubscribed.</h1><p>No more newsletter emails will be sent to this address.</p><p><a href="/">Return to carteakey.dev</a></p></body></html>',
  }
}
