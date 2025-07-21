import { Request, Response, NextFunction } from 'express';
import cache, { cacheKeyFromUrl } from '../services/cache';

// Simple config: array of { regex, ttl } rules (ttl in seconds)
type CacheRule = { regex: RegExp; ttl: number; ttl400s?: number };
const cacheRules: CacheRule[] = [
  { regex: /donki\/notifications/i, ttl: 7 * 24 * 60 * 60, ttl400s: 24 * 60 * 60 }, // 1 week / 1day for DONKI notifications, 1 day for 400s
  { regex: /nasa\/apod/i, ttl: 24 * 60 * 60, ttl400s: 1 * 60 * 60 }, 
  { regex: /nasa\/rovers/i, ttl: 12 * 60 * 60, ttl400s: 1 * 60 * 60 }, 
  { regex: /nasa\/epic/i, ttl: 1 * 60 * 60, ttl400s: 1 * 60 * 60 }, // 1 hours for EPIC
];
const defaultTTL = 60 * 60; // 1 hour

function getCacheRule(url: string): CacheRule | undefined {
  return cacheRules.find(rule => rule.regex.test(url));
}

export default function cacheMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    const cacheKey = cacheKeyFromUrl(req.originalUrl);
    const rule = getCacheRule(req.originalUrl);
    const ttl = rule ? rule.ttl : defaultTTL;
    const cached = await cache.get<Buffer>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Content-Type', 'application/json');
      return res.send(cached);
    }
    // Intercept res.send to cache the response
    const originalSend = res.send.bind(res);
    let statusCode = 200;
    const originalStatus = res.status.bind(res);
    res.status = (code: number) => {
      statusCode = code;
      return originalStatus(code);
    };
    res.send = (body: any) => {
      // Cache if 2XX or 4XX (with ttl400s)
      if (statusCode >= 200 && statusCode < 300) {
        cache.set(cacheKey, body, ttl);
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Content-Type', 'application/json');
      } else if (statusCode >= 400 && statusCode < 500 && rule && rule.ttl400s) {
        cache.set(cacheKey, body, rule.ttl400s);
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Content-Type', 'application/json');
      }
      return originalSend(body);
    };
    next();
  };
} 