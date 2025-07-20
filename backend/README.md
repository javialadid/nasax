# NASA API Explorer Backend

This is the backend for the NASA API Explorer project. It provides dedicated endpoints for NASA public APIs, with additional features for caching, CORS, and advanced post-processing of DONKI notifications using an LLM. 

> **Note:** The backend no longer acts as a general proxy. The simple proxy route is available only for development and rapid prototyping. For production, use the dedicated endpoints defined in [`routes/nasa/`](routes/nasa/).

## Features
- **Dedicated Endpoints for NASA APIs:** Each NASA API has its own endpoint under [`routes/nasa/`](routes/nasa/), providing structured access and caching.
- **Development Proxy (for dev only):** A simple proxy route exists for development and testing, but is not recommended for production use. Enable using USE_NASA_PROXY=true env.
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
APOD_CACHE_TTL=86400
ORIGINS=http://localhost:3000 # (comma-separated, for CORS in production)
```

You can also run the server with environment variables set inline, for example:

```bash
NASA_API_KEY=your_nasa_api_key GROQ_API_KEY=your_groq_api_key npm run dev
```
#### Cache
There are environment variables to control some of the cache TTLs parameters. See each route in [`routes/nasa/`](routes/nasa/) for implementation details.

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
- **Production:** Use the dedicated endpoints for each NASA API, e.g., `/api/planetary/apod?date=2024-07-01`. See [`routes/nasa/`](routes/nasa/) for all available endpoints and their usage.
- **Development/Testing:** The simple proxy route (`/api/*`) is available for rapid prototyping and development, but should not be used in production. Enable using USE_NASA_PROXY=true env.
- The backend will forward the request, append your NASA API key, and return the response (for proxy route only).
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
- For details on available NASA API endpoints, see [`routes/nasa/`](routes/nasa/).

