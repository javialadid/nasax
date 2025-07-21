import { Router, Request, Response } from 'express';
import axios from 'axios';
import { respondWithCache, INSIGHT_WEATHER_CACHE_TTL, NASA_API_KEY } from '../../services/nasaApiHelper';
import { buildCacheKey } from '../../services/cache';

/**
 * Route for NASA's InSight Mars Weather Service API.
 *
 * Caching:
 * - Responses are cached in-memory per date for 24 hours.
 * - Cache headers are added for the client as well.
 *
 * Environment variables:
 * - INSIGHT_WEATHER_CACHE_TTL: cache TTL (seconds, default: 86400)
 */
const router = Router();

router.get('/insight_weather', async (req: Request, res: Response) => {
  const cacheKey = buildCacheKey(req, ['date']);
  if (await respondWithCache(res, cacheKey, INSIGHT_WEATHER_CACHE_TTL)) return;
  const params = { ...req.query, api_key: NASA_API_KEY };
  const url = 'https://api.nasa.gov/insight_weather/';
  console.log(`[${new Date().toISOString()}] [INSIGHT] NASA API request:`, url, params);
  try {
    const { data } = await axios.get(url, { params });
    await respondWithCache(res, cacheKey, INSIGHT_WEATHER_CACHE_TTL, data);
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