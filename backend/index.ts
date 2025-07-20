import express, { Application, Request, Response } from 'express';
import corsMiddleware from './middleware/cors';
import nasaProxyRouter from './routes/nasaProxy';
import donkiNotificationsMiddleware from './middleware/donkiNotifications';
import cache from './services/cache';
import nasaDirectRouter from './routes/nasaDirect';

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 3000;


app.use(corsMiddleware)

// Healthcheck endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const memoryUsage = process.memoryUsage();
  // If using node-cache, expose basic stats
  let cacheStats = {};
  if (typeof (cache as any).getStats === 'function') {
    cacheStats = (cache as any).getStats();
  }
  res.status(200).json({
    uptime: process.uptime(),
    memoryUsage,
    cacheStats
  });
});

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
	console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;