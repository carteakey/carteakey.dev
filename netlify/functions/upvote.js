import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { slug } = JSON.parse(event.body);
    
    if (!slug) {
      return { statusCode: 400, body: "Post slug is required" };
    }
    
    // Increment count using Redis INCR
    const count = await redis.incr(`upvotes:${slug}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ count })
    };
  } catch (error) {
    console.error('Redis error:', error);
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
}; 