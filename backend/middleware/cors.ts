import cors, {CorsOptions} from 'cors';

const allowedOrigins = process.env.NODE_ENV === "production"
	? process.env.ORIGINS?.split(',') || ['*']
	: ['*']

if (process.env.NODE_ENV === 'production' && (!process.env.ORIGINS || process.env.ORIGINS === '*')) {
  console.warn('[CORS] WARNING: ORIGINS environment variable is not set or is wildcard in production. This may expose your API to all origins.');
}

console.log('[CORS] Allowed origins:', allowedOrigins);
const corsOptions: CorsOptions = {
	origin: (origin, callback) => {
		if (allowedOrigins.includes('*') ||	origin && allowedOrigins.includes(origin)){
			callback(null, true)
		}else{
			callback(new Error(`Origin '${origin}' not allowed by CORS. Valid origins: ${allowedOrigins}`))
		}
	},
	credentials: true	
}
const corsMiddleware = cors(corsOptions)

export default corsMiddleware
