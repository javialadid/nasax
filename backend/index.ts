import express, { Application } from 'express';
import corsMiddleware from './middleware/cors';
import nasaProxyRouter from './routes/nasaProxy';

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(corsMiddleware)

app.use('/api', nasaProxyRouter);

app.listen(PORT, (): void => {
	console.log(`Server is running on http://localhost:${PORT}`);
});