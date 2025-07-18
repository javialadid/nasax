import express, { Application } from 'express';
import corsMiddleware from './middleware/cors';
import nasaProxyRouter from './routes/nasaProxy';
import donkiNotificationsMiddleware from './middleware/donkiNotifications';
import cache from './services/cache';

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(corsMiddleware)

// Healthcheck endpoint
app.get('/health', (req, res) => {
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

// Add DONKI notifications middleware before /api
app.use(donkiNotificationsMiddleware);

// First step we just proxy NASA API, see if it's feasible.
// enhancement options: 
// * white list paths
// * mapping exceptional requests if. 
// TBD
app.use('/api', nasaProxyRouter);

app.listen(PORT, (): void => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;