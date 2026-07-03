import { Redis } from '@upstash/redis'
import { recordStatusEvent } from "../_utils/statusLog.js"

export default async function() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Upstash Redis credentials missing, returning 0 visitors');
    await recordStatusEvent({
      level: 'warn',
      source: 'data:visitors',
      message: 'Upstash Redis credentials missing',
      fallback: 'zero'
    })
    return { total: 0 };
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    // Get total visitor count from Redis
    const totalVisitors = await redis.get('visitors:total') || 0;
    
    return { 
      total: totalVisitors 
    };
  } catch (error) {
    console.error('Redis error fetching visitors:', error);
    await recordStatusEvent({
      level: 'error',
      source: 'data:visitors',
      message: error,
      fallback: 'zero'
    })
    return { 
      total: 0 
    };
  }
}
