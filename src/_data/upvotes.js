import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function() {
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
      const slug = key.replace('upvotes:', '');
      posts[slug] = values[index];
    });
    
    return { posts };
  } catch (error) {
    console.error('Redis error:', error);
    return { posts: {} };
  }
} 