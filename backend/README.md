# NASA API Explorer Backend

This is the backend for the NASA API Explorer project. It acts as a proxy to the NASA public APIs, with additional features for caching, CORS, and advanced post-processing of DONKI notifications using an LLM.

Proxy API could be a way to go forward, it was used mainly to keep things open for development and reduce the effort in rapid iterations. 

## Features
- **Proxy to NASA APIs:** Forwards requests to NASA's public APIs, automatically appending your API key.
- **CORS Support:** Configurable CORS middleware for secure cross-origin requests.
- **In-memory Caching:** GET requests are cached for 24 hours by default (configurable).
- **LLM Post-processing:** Special handling for DONKI/notifications endpoint, extracting structured data and summaries using an LLM (Groq API).
- **Test Reports:** Example DONKI reports and their processed JSON outputs are included in `test_reports/`.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation
```bash
npm install
```

### Environment Variables
You can configure the backend using environment variables. These are **optional**—sensible defaults are provided for most settings. You can set them in a `.env` file, or pass them directly via the command line or your deployment environment.
You will certainly need a NASA_API_KEY passed if you want it to work, and GROQ_API_KEY if you want the DONKI reports endpoint to work.
Example `.env` file:

```
NASA_API_KEY=your_nasa_api_key
# Optional for LLM features:
GROQ_API_KEY=your_groq_api_key
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_LLM_MODEL=llama-3.1-8b-instant
CACHE_DURATION=86400 # (in seconds, default: 24h)
ORIGINS=http://localhost:3000 # (comma-separated, for CORS in production)
```

You can also run the server with environment variables set inline, for example:

```bash
NASA_API_KEY=your_nasa_api_key GROQ_API_KEY=your_groq_api_key npm run dev
```

### Running the Server
- **Development:**
  ```bash
  npm run dev
  ```
- **Production:**
  ```bash
  npm run build
  npm start
  ```

The server will start on `http://localhost:3000` by default.

## Usage
- All NASA API requests should be made to `/api/*` (e.g., `/api/planetary/apod?date=2024-07-01`).
- The backend will forward the request, append your NASA API key, and return the response.
- For DONKI notifications (`/api/DONKI/notifications`), the response will include an additional `processedMessage` field for each report, extracted by the LLM.

## Testing
- Run all tests with:
  ```bash
  npm test
  ```
- See `test_reports/` for example DONKI reports and their processed JSON outputs.

## Scripts
- `scripts/llm_structure_compare.ts`: Compares the structure of LLM-processed DONKI reports for consistency.

## Deployment
- Ready for deployment on Vercel (see `vercel.json`).
- All build output is in `dist/`.

## Notes
- CORS origins are set to `*` in development. In production, set the `ORIGINS` environment variable.
- The LLM features require a valid Groq API key and may incur costs.
- All environment variables can be set in `.env` or your deployment platform.

