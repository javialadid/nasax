import { useEffect, useState } from 'react';

function getEasternDateString() {
  const now = new Date();
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  if (eastern.getHours() === 0 && eastern.getMinutes() < 5) {
    eastern.setDate(eastern.getDate() - 1);
  }
  return eastern.toISOString().slice(0, 10);
}

export function useNasaApi(endpoint: string, params: Record<string, string> = {}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {    
    setLoading(true);
    setError(null);
    const baseUrl = (import.meta as unknown as ImportMeta).env.VITE_API_BASE_URL || 'http://localhost:3000';
    let url = `${baseUrl}/api/${endpoint}`;
    const searchParams = new URLSearchParams(params);
    if (endpoint === 'planetary/apod' && !params.date) {
      searchParams.set('date', getEasternDateString());
    }
    if (Array.from(searchParams).length > 0) {
      url += `?${searchParams.toString()}`;
    }
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params)]);

  return { data, loading, error };
}
