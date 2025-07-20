import { Router, Request, Response } from 'express';
import axios from 'axios';
import { handleRequestWithDateRules, respondWithCache, buildCacheKey, EPIC_CACHE_TTL, EPIC_404_MIN_TTL, NASA_API_KEY } from '../../services/nasaApiHelper';
import cache from '../../services/cache';

/**
 * Routes for NASA's EPIC (Earth Polychromatic Imaging Camera) API.
 *
 * Caching:
 * - Responses for date-based endpoints are cached in-memory for 1 month.
 * - 404 responses are cached for a minimum of 1 hour.
 * - Available dates endpoint is cached for 3 hours.
 * - Cache headers are added for the client as well.
 *
 * Environment variables:
 * - EPIC_CACHE_TTL: cache TTL for date endpoints (seconds, default: 2592000)
 * - EPIC_404_MIN_TTL: min TTL for 404s (seconds, default: 3600)
 * - EPIC_AVAILABLE_CACHE_TTL: TTL for available dates (seconds, default: 10800)
 */
const router = Router();

// EPIC Natural Date
router.get('/api/natural/date/:date', async (req: Request, res: Response) => {
  const cacheKey = buildCacheKey(req, ['date']);
  if (respondWithCache(res, cache, cacheKey, EPIC_CACHE_TTL)) return;
  const params = { ...req.query, api_key: NASA_API_KEY };
  const url = `https://api.nasa.gov/EPIC/api/natural/date/${req.params.date}`;
  console.log(`[${new Date().toISOString()}] [EPIC] NASA API request:`, url, params);
  const date = req.params.date as string | undefined;
  if (!date){
    res.status(422).json({error: 'Request must have a date in the path'})
    return;
  }
  await handleRequestWithDateRules(
    req,
    res,
    date,
    EPIC_CACHE_TTL, // cacheTtl: 1 month
    EPIC_404_MIN_TTL, // min404ttl: env or 1 hour
    async () => {
      const { data } = await axios.get(url, { params });
      respondWithCache(res, cache, cacheKey, EPIC_CACHE_TTL, data);
      return data;
    }
  );
});

// EPIC Natural Available Dates
router.get('/api/natural/available', async (req: Request, res: Response) => {
  const EPIC_AVAILABLE_CACHE_TTL = parseInt(process.env.EPIC_AVAILABLE_CACHE_TTL || '') || 60 * 60 * 3; // 3 hours
  const cacheKey = buildCacheKey(req, []);
  if (respondWithCache(res, cache, cacheKey, EPIC_AVAILABLE_CACHE_TTL)) return;
  const params = { ...req.query, api_key: NASA_API_KEY };
  const url = 'https://api.nasa.gov/EPIC/api/natural/available';
  console.log(`[${new Date().toISOString()}] [EPIC] NASA API request:`, url, params);
  try {
    const { data } = await axios.get(url, { params });
    respondWithCache(res, cache, cacheKey, EPIC_AVAILABLE_CACHE_TTL, data);
    res.json(data);
  } catch (err: any) {
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router; 