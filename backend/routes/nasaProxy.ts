import { Router, Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import cache, { SimpleCache, cacheKeyFromUrl } from '../services/cache';

const NASA_API_URL = 'https://api.nasa.gov'

const router = Router();

function buildNasaUrl(req: Request): string {
  // Remove '/api' prefix and leading slash from the incoming URL
  const originalUrl: string = req.originalUrl.replace(/^\/api/, '').replace(/^\//, '');
  const urlObj: URL = new URL(originalUrl, NASA_API_URL);
  urlObj.searchParams.set('api_key', process.env.NASA_API_KEY || '');
  return urlObj.toString();
}

async function proxyToNasa(req: Request, res: Response, nasaUrl: string, responseType: 'stream' | 'arraybuffer') {
  const axiosConfig = {
    url: nasaUrl,
    method: req.method as any,
    headers: { ...req.headers, host: undefined },
    responseType,
    data: req.body,
  };
  const axiosResponse: AxiosResponse = await axios.request(axiosConfig);
  res.status(axiosResponse.status);
  for (const [key, value] of Object.entries(axiosResponse.headers)) {
    res.setHeader(key, value as string);
  }
  return axiosResponse;
}

router.use(async (req: Request, res: Response) => {
  const skipCache = process.env.SKIP_CACHE === 'true';
  const nasaUrl = buildNasaUrl(req);

  if (req.method === 'GET') {
    let cacheKey: string | undefined = undefined;
    if (!skipCache) {
      cacheKey = cacheKeyFromUrl(nasaUrl);
      const cached = cache.get<Buffer>(cacheKey);
      if (cached) {
        console.log('Cached response');
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json'); // Most NASA APIs return JSON
        res.send(cached);
        return;
      }
    }
    console.log(`Process request for ${nasaUrl}`);
    try {
      const axiosResponse = await proxyToNasa(req, res, nasaUrl, 'arraybuffer');
      if (!skipCache && cacheKey) {
        res.setHeader('X-Cache', 'MISS');
        cache.set(cacheKey, Buffer.from(axiosResponse.data));
      } else {
        res.setHeader('X-Cache', 'SKIP');
      }
      res.send(Buffer.from(axiosResponse.data));
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }, message?: string };
      res.status(err.response?.status || 500).json({
        error: err.message || 'Error proxying request to NASA API',
      });
    }
  } else {
    try {
      const axiosResponse = await proxyToNasa(req, res, nasaUrl, 'stream');
      axiosResponse.data.pipe(res);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }, message?: string };
      res.status(err.response?.status || 500).json({
        error: err.message || 'Error proxying request to NASA API',
      });
    }
  }
});

export default router;
