import cors, {CorsOptions} from 'cors';

const allowedOrigins = process.env.NODE_ENV === "production"
	? process.env.ORIGINS?.split(',') || ['*']
	: ['*']

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
