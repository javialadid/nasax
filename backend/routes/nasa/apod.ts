import { Router, Request, Response } from 'express';
import axios from 'axios';
import { query, validationResult } from 'express-validator';
import { handleRequestWithDateRules, respondWithCache, buildCacheKey, APOD_CACHE_TTL, APOD_404_MIN_TTL, NASA_API_KEY } from '../../services/nasaApiHelper';
import cache from '../../services/cache';

const router = Router();
/**
 * Route for NASA's Astronomy Picture of the Day (APOD) API. 
 *
 * Caching:
 * - Responses are cached in-memory per date for 1 month (configurable via APOD_CACHE_TTL env variable).
 * - 404 responses are cached for a minimum of 1 hour (APOD_404_MIN_TTL env variable). 
 * - Cache headers are added for the client as well
 */
router.get(
  '/apod',
  [
    query('date')
      .exists().withMessage("'date' query parameter is required.")
      .bail()
      .isString().withMessage("'date' must be a string.")
      .bail()
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("'date' must be in YYYY-MM-DD format."),
  ],
  async (req: Request, res: Response) => {
    const cacheKey = buildCacheKey(req, ['date']);
    if (respondWithCache(res, cache, cacheKey, APOD_CACHE_TTL)) return;
    const params = { date: req.query.date, api_key: NASA_API_KEY };
    const url = 'https://api.nasa.gov/planetary/apod';
    console.log(`[${new Date().toISOString()}] [APOD] NASA API request:`, url, params);
    // Validate query
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
      return;
    }
    
    const date = req.query.date as string | undefined;
    await handleRequestWithDateRules(
      req,
      res,
      date,
      APOD_CACHE_TTL, // cacheTtl: 1 month
      APOD_404_MIN_TTL, // min404ttl: env or 1 hour
      async () => {
        const { data } = await axios.get(url, { params });
        respondWithCache(res, cache, cacheKey, APOD_CACHE_TTL, data);
        return data;
      }
    );
  }
);

export default router; 