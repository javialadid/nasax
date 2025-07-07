import NodeCache from 'node-cache';

// Default cache 24 horus, configurable via CACHE_DURATION env.
const cacheTTL = parseInt(process.env.CACHE_DURATION||'') || (24 * 60 * 60);
const memoryCache = new NodeCache({ stdTTL: cacheTTL });

// Abstract cache interface for future extensibility
export interface SimpleCache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
}

// In-memory cache implementation
const cache: SimpleCache = {
  get: (key) => memoryCache.get(key),
  set: (key, value) => { memoryCache.set(key, value, cacheTTL); },
};

/**
 * Normalize a URL for use as a cache key:
 * - Lowercase the host and path
 * - Sort query parameters
 * - Remove trailing slashes
 * - Remove duplicate slashes
 * - Remove default ports (80, 443)
 * Query string parameter order would generate different cache keys.
 */
export function cacheKeyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Lowercase host and pathname
    urlObj.hostname = urlObj.hostname.toLowerCase();
    urlObj.pathname = urlObj.pathname.replace(/\/+$/, '').toLowerCase().replace(/\/+/g, '/');
    // Remove default ports
    if ((urlObj.protocol === 'http:' && urlObj.port === '80') || 
		(urlObj.protocol === 'https:' && urlObj.port === '443')) {
      urlObj.port = '';
    }
    // Sort query params
    const params = Array.from(urlObj.searchParams.entries());
    params.sort(([a], [b]) => a.localeCompare(b));
    urlObj.search = '';
    for (const [key, value] of params) {
      urlObj.searchParams.append(key, value);
    }
    return urlObj.toString();
  } catch (e) {    
    return url.trim().toLowerCase();
  }
}

export default cache;
