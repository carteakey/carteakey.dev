import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

exports.handler = async function(event, context) {
  try {
    let slug;
    
    // Handle GET requests to fetch count
    if (event.httpMethod === "GET") {
      slug = event.queryStringParameters?.slug;
      if (!slug) {
        return { statusCode: 400, body: "Post slug is required" };
      }
      // Get current count without incrementing
      const count = await redis.get(`upvotes:${slug}`) || 0;
      return {
        statusCode: 200,
        body: JSON.stringify({ count })
      };
    }
    
    // Handle POST requests to increment count
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body);
      slug = body.slug;
      
      if (!slug) {
        return { statusCode: 400, body: "Post slug is required" };
      }
      
      // Increment count using Redis INCR
      const count = await redis.incr(`upvotes:${slug}`);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ count })
      };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (error) {
    console.error('Redis error:', error);
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
};
