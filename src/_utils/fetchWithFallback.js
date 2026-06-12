import fetch from "node-fetch";
import { AssetCache } from "@11ty/eleventy-fetch";

/**
 * central helper for fetching external API data with timeouts and caching.
 *
 * @param {Object} options
 * @param {string} options.cacheKey - The key to cache this data under.
 * @param {string} options.cacheDuration - Duration for which cache is valid (e.g., "15m").
 * @param {Function} options.fetchFn - Async function performing the actual fetch & mapping.
 * @param {any} options.fallbackData - Fallback data if fetch fails and cache is empty.
 * @param {number} [options.timeoutMs=5000] - Timeout limit in milliseconds.
 */
export async function fetchWithFallback({
  cacheKey,
  cacheDuration,
  fetchFn,
  fallbackData,
  timeoutMs = 5000
}) {
  const cache = new AssetCache(cacheKey);

  // Return valid cache immediately if available
  if (cache.isCacheValid(cacheDuration)) {
    try {
      const cachedValue = await cache.getCachedValue();
      if (cachedValue !== undefined && cachedValue !== null) {
        return cachedValue;
      }
    } catch (e) {
      console.warn(`[fetchWithFallback] Error reading valid cache for key: ${cacheKey}. Re-fetching.`);
    }
  }

  try {
    // Wrap fetchFn with a timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    const data = await Promise.race([fetchFn(), timeoutPromise]);

    if (data !== undefined && data !== null) {
      await cache.save(data, "json");
      return data;
    }
    throw new Error("Fetch function returned null or undefined data");
  } catch (error) {
    console.warn(`[fetchWithFallback] Failed to fetch data for key "${cacheKey}": ${error.message}. Attempting expired cache fallback.`);
    
    try {
      const cachedValue = await cache.getCachedValue();
      if (cachedValue !== undefined && cachedValue !== null) {
        return cachedValue;
      }
    } catch (cacheError) {
      // Empty/non-existent cache
    }
    
    return fallbackData;
  }
}
