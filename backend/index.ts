import express, { Application, Request, Response } from 'express';
import corsMiddleware from './middleware/cors';
import nasaProxyRouter from './routes/nasaProxy';
import donkiNotificationsMiddleware from './middleware/donkiNotifications';
import cache, { redisReadyPromise, redisReadyMiddleware } from './services/cache';
import nasaDirectRouter from './routes/nasaDirect';

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 3000;


// Healthcheck endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Set default for METRICS_AUTH and warn if not set
if (!process.env.METRICS_AUTH) {
  process.env.METRICS_AUTH = 'admin:admin';
  console.warn('[WARN] METRICS_AUTH not set. Using default credentials: admin:admin');
}

// Simple Basic Auth middleware for /metrics
function metricsAuthMiddleware(req: Request, res: Response, next: Function) {
  const auth = process.env.METRICS_AUTH!; // always set above
  const [expectedUser, expectedPass] = auth.split(':');
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [user, pass] = Buffer.from(b64auth, 'base64').toString().split(':');
  if (user === expectedUser && pass === expectedPass) return next();
  res.set('WWW-Authenticate', 'Basic realm="Metrics"');
  res.status(401).json({ error: 'Authentication required' });
}

// Metrics endpoint (protected, no CORS)
app.get('/metrics', metricsAuthMiddleware, async (req, res) => {
  const memoryUsage = process.memoryUsage();
  let cacheStats: any = {};
  if (typeof (cache as any).getStats === 'function') {
    const stats = await (cache as any).getStats();
    // If Redis, stats is a string from INFO; if in-memory, it's an object
    if (typeof stats === 'string') {
      // Parse Redis INFO string into an object
      const redisInfo: Record<string, string> = {};
      stats.split('\n').forEach(line => {
        if (line && line.includes(':')) {
          const [key, value] = line.split(':');
          redisInfo[key] = value;
        }
      });
      cacheStats.redisInfo = redisInfo;
    } else {
      cacheStats = stats;
    }
  }
  const response = {
    uptime: process.uptime(),
    memoryUsage,
    cacheStats
  };
  res.status(200)
    .set('Content-Type', 'application/json')
    .send(JSON.stringify(response, null, 2));
});

// Use Redis readiness middleware (waits up to timeout, then proceeds)
app.use(redisReadyMiddleware());

// Apply CORS middleware after /health and /metrics
app.use(corsMiddleware)

app.get('/favicon.ico', (req: Request, res: Response) => {
  res.status(204).end()
});

if (process.env.USE_NASA_PROXY === 'true') {
  // Add DONKI notifications middleware before /api
  app.use(donkiNotificationsMiddleware);
  app.use('/api', nasaProxyRouter);
  console.warn(`Using NASA API proxy`)
} else {
  app.use('/api', nasaDirectRouter);  
}

app.listen(PORT, (): void => {
  console.log(`=============================================`)
	console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`=============================================`)
});

export default app;