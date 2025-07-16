import express, { Application } from 'express';
import corsMiddleware from './middleware/cors';
import nasaProxyRouter from './routes/nasaProxy';

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(corsMiddleware)

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