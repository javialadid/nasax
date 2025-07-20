import { Router, Request, Response } from 'express';
import axios from 'axios';
import { respondWithCache, buildCacheKey, ROVERS_CACHE_TTL_DEFAULT, NASA_API_KEY } from '../../services/nasaApiHelper';
import cache from '../../services/cache';

/**
 * Route for NASA's Mars Rovers Photos API.
 *
 * Caching:
 * - Responses are cached in-memory per rover and date for 3 hours.
 * - Cache headers are added for the client as well.
 *
 * Environment variables:
 * - DONKI_CACHE_TTL: cache TTL (seconds, default: 10800)
 */
const router = Router();

router.get('/api/v1/rovers/:rover/latest_photos', async (req: Request, res: Response) => {
  const cacheKey = buildCacheKey(req, ['rover', 'date']);
  if (respondWithCache(res, cache, cacheKey, 300)) return;
  const params = { ...req.query, api_key: NASA_API_KEY };
  const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${req.params.rover}/latest_photos`;
  console.log(`[${new Date().toISOString()}] [MARS] NASA API request:`, url, params);
  try {
    const { data } = await axios.get(url, { params });
    respondWithCache(res, cache, cacheKey, ROVERS_CACHE_TTL_DEFAULT, data);
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