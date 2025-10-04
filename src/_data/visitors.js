import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function() {
  try {
    // Get total visitor count from Redis
    const totalVisitors = await redis.get('visitors:total') || 0;
    
    return { 
      total: totalVisitors 
    };
  } catch (error) {
    console.error('Redis error fetching visitors:', error);
    return { 
      total: 0 
    };
  }
}
