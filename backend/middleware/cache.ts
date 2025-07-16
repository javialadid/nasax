import { Request, Response, NextFunction } from 'express';
import cache, { cacheKeyFromUrl } from '../services/cache';

// Simple config: array of { regex, ttl } rules (ttl in seconds)
const cacheRules: { regex: RegExp; ttl: number }[] = [
  { regex: /donki\/notifications/i, ttl: 7 * 24 * 60 * 60 }, // 1 week for DONKI notifications
  // Add more rules here as needed
];
const defaultTTL = 60 * 60; // 1 hour

function getCacheTTL(url: string): number {
  for (const rule of cacheRules) {
    if (rule.regex.test(url)) return rule.ttl;
  }
  return defaultTTL;
}

export default function cacheMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    const cacheKey = cacheKeyFromUrl(req.originalUrl);
    const ttl = getCacheTTL(req.originalUrl);
    const cached = cache.get<Buffer>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Content-Type', 'application/json');
      return res.send(cached);
    }
    // Intercept res.send to cache the response
    const originalSend = res.send.bind(res);
    res.send = (body: any) => {
      cache.set(cacheKey, body, ttl);
      res.setHeader('X-Cache', 'MISS');
      return originalSend(body);
    };
    next();
  };
} 