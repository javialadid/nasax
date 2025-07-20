import { Router, Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import cache, { cacheKeyFromUrl } from '../services/cache';

const ALLOWED_NASA_PATHS = [
  /^\/planetary\//,
  /^\/donki\/notifications$/,
  /^\/mars-photos\/api\/v1\//,
  
];

function sanitizeNasaUrl(path: string): string | null {
  // Only allow whitelisted NASA API paths
  for (const regex of ALLOWED_NASA_PATHS) {
    if (regex.test(path)) return path;
  }
  return null;
}

const router = Router();

function sanitizeNasaDomain(domain: string | undefined): string {
  if (!domain) return 'api.nasa.gov';
  // Only allow domains ending with .nasa.gov (no protocol, no slashes)
  if (/^[a-zA-Z0-9.-]+\.nasa\.gov$/.test(domain)) {
    return domain;
  }
  return 'api.nasa.gov';
}

function buildNasaUrl(req: Request): string {
  const domainParam = req.query.domain as string | undefined;
  const nasaDomain = sanitizeNasaDomain(domainParam);
  // Remove '/api' prefix and leading slash from the incoming URL
  const originalUrl: string = req.originalUrl.replace(/^\/api/, '').replace(/^\//, '');
  // Remove the domain param from the path/query
  const urlObj = new URL(originalUrl, `https://${nasaDomain}`);
  urlObj.searchParams.set('api_key', process.env.NASA_API_KEY || '');
  urlObj.searchParams.delete('domain'); // Remove domain param from proxied request
  // Only restrict paths if RESTRICT_PATHS env is true
  if (process.env.RESTRICT_PATHS === 'true') {
    const sanitizedPath = sanitizeNasaUrl(urlObj.pathname);
    if (!sanitizedPath) {
      throw new Error('Requested NASA API path is not allowed.');
    }
    urlObj.pathname = sanitizedPath;
  }
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
  let nasaUrl: string;
  try {
    nasaUrl = buildNasaUrl(req);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Forbidden NASA API path.' });
    return;
  }
  if (req.method === 'GET') {
    let cacheKey: string | undefined = undefined;
    if (!skipCache) {
      cacheKey = cacheKeyFromUrl(nasaUrl);
      const cached = cache.get<Buffer>(cacheKey);
      if (cached) {
        console.debug('Cached response');
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        res.send(cached);
        return;
      }
    }
    console.debug(`Process request for ${nasaUrl}`);
    try {
      const axiosResponse = await proxyToNasa(req, res, nasaUrl, 'arraybuffer');
      let responseData = Buffer.from(axiosResponse.data);
      let contentType = axiosResponse.headers['content-type'] || '';      
      if (!skipCache && cacheKey) {
        res.setHeader('X-Cache', 'MISS');
        cache.set(cacheKey, responseData);
      } else {
        res.setHeader('X-Cache', 'SKIP');
      }
      res.setHeader('Content-Type', contentType || 'application/json');
      res.send(responseData);
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
