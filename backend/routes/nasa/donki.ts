import { Router, Request, Response } from 'express';
import axios from 'axios';
import { processDonkiNotificationsResponse } from '../../services/donkiNotifications';
import { respondWithCache, buildCacheKey, DONKI_CACHE_TTL_DEFAULT, NASA_API_KEY } from '../../services/nasaApiHelper';
import cache from '../../services/cache';

/**
 * Route for NASA's DONKI notifications API.
 * Uses an LLM to process the report which is not well formatted 
 * Caching:
 * - Responses are cached in-memory for up to 6 days after the latest report.
 * - Default TTL is 1 day, but dynamically extended if newer reports are found.
 * - Cache headers are added for the client as well.
 *
 * Environment variables:
 * - DONKI_CACHE_TTL: default cache TTL (seconds, default: 86400)
 */
const router = Router();
const SIX_DAYS_SECONDS = 6 * 24 * 60 * 60 * 1000
const MIN_DONKI_CACHE_TTL = 60*60

router.get('/notifications', async (req: Request, res: Response) => {
  
  const cacheKey = buildCacheKey(req, []); // No relevant query params for DONKI
  if (respondWithCache(res, cache, cacheKey, DONKI_CACHE_TTL_DEFAULT)) return;
  const params = { ...req.query, api_key: NASA_API_KEY };
  const url = 'https://api.nasa.gov/DONKI/notifications';
  console.log(`[${new Date().toISOString()}] [DONKI] NASA API request:`, url, params);
  try {    
    const { data } = await axios.get(url, { params, responseType: 'text' });
    const processed: any[] = await processDonkiNotificationsResponse(data);
    let cacheSeconds = DONKI_CACHE_TTL_DEFAULT;
    let logDetails: { found: boolean, reportDate?: string, expireDate?: string, secondsUntilExpire?: number } = { found: false };
    let hasLLMResponse = false;
    if (Array.isArray(processed)) {
      const reports = processed.filter((item: any) => item.messageType === 'Report' && item.messageIssueTime);
      hasLLMResponse = processed.some((item: any) => item.processedMessage);
      if (reports.length > 0) {
        const latest = reports.reduce((a: any, b: any) => {
          return new Date(a.messageIssueTime) > new Date(b.messageIssueTime) ? a : b;
        });
        const reportDate = new Date(latest.messageIssueTime);
        const expireDate = new Date(reportDate.getTime() + SIX_DAYS_SECONDS);
        const { secondsUntilIsoDateTime } = require('../../services/date');
        const seconds = secondsUntilIsoDateTime(expireDate.toISOString());
        logDetails = {
          found: true,
          reportDate: reportDate.toISOString(),
          expireDate: expireDate.toISOString(),
          secondsUntilExpire: seconds,
        };
        if (seconds > MIN_DONKI_CACHE_TTL) {
          cacheSeconds = seconds;
        }
      }
    }
    console.log(`[${new Date().toISOString()}] [DONKI] Cache TTL calculation:`, logDetails, 'Final TTL set:', cacheSeconds, 'seconds', 'LLM response found:', hasLLMResponse);
    if (hasLLMResponse) {
      respondWithCache(res, cache, cacheKey, cacheSeconds, processed);
    }
    res.json(processed);
  } catch (err: any) {    
    if (err.response) {      
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router; 