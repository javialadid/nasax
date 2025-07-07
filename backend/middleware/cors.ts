import cors, {CorsOptions} from 'cors';

const allowedOrigins = process.env.NODE_ENV === "production"
	? process.env.ORIGINGS?.split(',') || ['*']
	: ['*']
const corsOptions: CorsOptions = {
	origin: (origin, callback) => {
		if (allowedOrigins.includes('*') ||	origin && allowedOrigins.includes(origin)){
			callback(null, true)
		}else{
			callback(new Error(`Origin '${origin}' not allowed by CORS.`))
		}
	},
	credentials: true	
}
const corsMiddleware = cors(corsOptions)

export default corsMiddleware
