import { Request, Response } from 'express';

export async function handleRequestWithDateRules(
  req: Request,
  res: Response,
  date: string | undefined,
  cacheTtl: number,
  min404ttl?: number,
  fetcher?: () => Promise<any>
) {
  // 1. Future date check (UTC+14:00)
  if (date) {
    const { secondsUntilDateTz } = require('../services/date');
    const seconds = secondsUntilDateTz(date, 'Pacific/Kiritimati');
    if (seconds > 0) {
      res.status(422).json({ error: "The requested date is in the future (it has not started anywhere on Earth yet)." });
      return;
    }
  }

  try {
    // 2. Fetch data
    const data = fetcher ? await fetcher() : undefined;
    res.set('Cache-Control', `private, max-age=${cacheTtl}`);
    res.json(data);
  } catch (err: any) {
    // 3. 404 handling
    if (err.response?.status === 404) {
      if (min404ttl) {
        let cacheFor = min404ttl;
        if (date) {
          const { secondsUntilDateTz } = require('../services/date');
          const seconds = secondsUntilDateTz(date, 'Pacific/Kiritimati');
          if (seconds > min404ttl) cacheFor = seconds;
        }
        res.set('Cache-Control', `private, max-age=${cacheFor}`);
      }
      res.status(404).json({ error: err.message });
    } else if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: err.message });
    }
  }
}

// Helper for cache check/set
export function respondWithCache<T>(res: Response, cache: { get: <T>(key: string) => T | undefined, set: <T>(key: string, value: T, ttl?: number) => void }, cacheKey: string, ttl: number, data?: T): boolean {
  if (data !== undefined) {
    console.log(`[CACHE MISS][${cacheKey}] Caching new data with TTL: ${ttl}s`);
    cache.set(cacheKey, data, ttl);
    res.set('X-Cache', 'MISS');
    return false;
  }
  const cached = cache.get<T>(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT][${cacheKey}] Serving data from cache`);
    res.set('X-Cache', 'HIT');
    res.set('Cache-Control', `private, max-age=${ttl}`);
    res.json(cached);
    return true;
  }
  console.log(`[CACHE MISS][${cacheKey}] No cached data found`);
  return false;
}

// Helper to build a stable cache key: path + sorted relevant params
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

export const NASA_API_KEY = process.env.NASA_API_KEY || '';
export const APOD_CACHE_TTL = parseInt(process.env.APOD_CACHE_TTL || '') || 60 * 60 * 24 * 30; // 1 month
export const APOD_404_MIN_TTL = parseInt(process.env.APOD_404_MIN_TTL || '') || 60 * 60; // 1 hour
export const EPIC_CACHE_TTL = parseInt(process.env.EPIC_CACHE_TTL || '') || 60 * 60 * 24 * 30; // 1 month
export const EPIC_404_MIN_TTL = parseInt(process.env.EPIC_404_MIN_TTL || '') || 60 * 60; // 1 hour
export const DONKI_CACHE_TTL_DEFAULT = parseInt(process.env.DONKI_CACHE_TTL || '') || 60 * 60 * 24;
export const ROVERS_CACHE_TTL_DEFAULT = parseInt(process.env.DONKI_CACHE_TTL || '') || 60 * 60 * 3;
export const INSIGHT_WEATHER_CACHE_TTL = parseInt(process.env.INSIGHT_WEATHER_CACHE_TTL || '') || 60 * 60 * 24; 