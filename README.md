# NASA Explorer

## Quickstart (Development)

Open two terminals and run the following commands:

**Terminal 1: Start the backend**
```bash
cd backend && npm install && NASA_API_KEY=your_nasa_api_key npm run dev
```

**Terminal 2: Start the frontend**
```bash
cd frontend && npm install && npm run dev
```

- The backend will run on [http://localhost:3000](http://localhost:3000)
- The frontend will run on [http://localhost:5173](http://localhost:5173)

You need a NASA API key for the backend. Get one at https://api.nasa.gov/

---

## Project Structure

- [Frontend (NasaX)](frontend/README.md):
  - Modern React app (Vite, TypeScript, Tailwind CSS)
  - Focus on web performance, user experience, and maximizing NASA imagery
  - Includes a custom carousel for image navigation and fullscreen viewing

- [Backend (API Proxy)](backend/README.md):
  - Node.js/Express server
  - Proxies NASA public APIs, adds caching, CORS, and LLM-powered post-processing for DONKI notifications
  - Ready for local development and deployment

---

See each subproject's README for setup, usage, and more details.
