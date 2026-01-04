import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

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
      
      // Get current upvote count
      const count = await redis.get(`upvotes:${slug}`) || 0;
      
      // Get current view count
      let views = await redis.get(`views:${slug}`) || 0;
      
      // Increment view count if tracking is requested (only once per page load)
      if (trackView) {
        views = await redis.incr(`views:${slug}`);
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
      
      // Increment upvote count using Redis INCR
      const count = await redis.incr(`upvotes:${slug}`);
      
      // Get current view count (don't increment)
      const views = await redis.get(`views:${slug}`) || 0;
      
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
