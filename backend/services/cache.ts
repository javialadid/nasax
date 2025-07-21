import { createClient, RedisClientType } from 'redis';
import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';

const cacheTTL = parseInt(process.env.CACHE_DURATION || '', 10) || (24 * 60 * 60);
const redisUrl = process.env.REDIS_URL;
const redisDb = parseInt(process.env.REDIS_DB || '0', 10);

export interface SimpleCache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  getStats?: () => any;
}

let cache: SimpleCache;

// This is here to help other parts of code to learn if redis is ready.
// Like the cache middleware to wait for redis connection to be ready on cold starts (serverless)
let redisReadyPromise: Promise<void> | undefined = undefined;

function logWithTime(msg: string) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 23);
  console.log(`[${now}] ${msg}`);
}

if (redisUrl) {
  logWithTime('[CACHE] REDIS_URL detected, initializing Redis cache.');
  let client: RedisClientType | undefined;
  let isConnected = false;
  
  const clientOptions: any = {
    url: redisUrl,
    socket: {
      tls: true,
      rejectUnauthorized: false
    },
    database: redisDb, // Add database selection
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        logWithTime('[CACHE] Too many retries, Redis connection terminated.');
        return new Error('Too many retries.');
      }
      return Math.min(retries * 50, 500);
    }
  };

  client = createClient(clientOptions);

  client.on('connect', () => logWithTime('[CACHE] Connecting to Redis...'));
  redisReadyPromise = new Promise<void>((resolve) => {
    client!.on('ready', () => {
      isConnected = true;
      resolve();
      logWithTime('[CACHE] Redis connected.');
    });
  });
  client.on('end', () => {
    isConnected = false;
    logWithTime('[CACHE] Redis connection closed.');
  });
  client.on('error', (err) => logWithTime(`[CACHE] Redis Client Error: ${err}`));

  client.connect().catch(console.error);

  cache = {
    async get<T>(key: string): Promise<T | undefined> {
      if (!client || !isConnected) return undefined;
      try {
        const value = await client.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
        return undefined;
      } catch (err) {
        console.error(`[CACHE] Error getting key ${key} from Redis`, err);
        return undefined;
      }
    },
    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
      if (!client || !isConnected) return;
      try {
        const stringValue = JSON.stringify(value);
        await client.set(key, stringValue, {
          EX: ttl ?? cacheTTL,
        });
      } catch (err) {
        console.error(`[CACHE] Error setting key ${key} in Redis`, err);
      }
    },
    getStats: () => {
      if (!client) return {};
      return client.info();
    },
  };
} else {
  console.warn('[CACHE] REDIS_URL not set, falling back to in-memory cache.');
  const memoryCache = new NodeCache({ stdTTL: cacheTTL });

  cache = {
    async get<T>(key: string): Promise<T | undefined> {
      return memoryCache.get(key) as T | undefined;
    },
    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
      memoryCache.set(key, value, ttl ?? cacheTTL);
    },
    getStats: () => memoryCache.getStats(),
  };
}

export function buildCacheKey(req: Request, relevantParams: string[]): string {
  const base = req.path;
  const params: Record<string, string> = {};
  for (const key of relevantParams) {
    const value = (req.query[key] || (req.params && req.params[key])) as string | undefined;
    if (value) params[key] = value;
  }
  const paramString = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return paramString ? `${base}?${paramString}` : base;
}

export function cacheKeyFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url, 'http://localhost'); // Base URL doesn't matter for parsing
    const path = parsedUrl.pathname;
    const params: Record<string, string> = {};
    
    // Sort and normalize query parameters
    parsedUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    const paramString = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');
      
    return paramString ? `${path}?${paramString}` : path;
  } catch (err) {
    // Fallback to raw URL if parsing fails
    return url;
  }
}

function redisReadyMiddleware(timeoutMs?: number) {
  const ms = timeoutMs ?? (parseInt(process.env.REDIS_READY_TIMEOUT_MS || '', 10) || 1000);
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redisReadyPromise) return next();
    let timedOut = false;
    await Promise.race([
      redisReadyPromise,
      new Promise((resolve) => setTimeout(() => { timedOut = true; resolve(undefined); }, ms))
    ]);
    if (timedOut) {
      console.warn(`[CACHE] Redis not ready after ${ms}ms, proceeding with request.`);
    }
    next();
  };
}

export default cache;
export { redisReadyPromise, redisReadyMiddleware };
