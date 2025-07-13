import { useEffect, useState, useRef } from 'react';
import { getApiBaseUrl } from '../utils/env';
import { getEasternDateString } from '../utils/dateutil';


export function useNasaApi(endpoint: string, params: Record<string, string> = {}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {    
    setLoading(true);
    setError(null);
    const baseUrl = getApiBaseUrl();
    let url = `${baseUrl}/${endpoint}`;
    const searchParams = new URLSearchParams(params);
    if (endpoint === 'planetary/apod' && !params.date) {
      searchParams.set('date', getEasternDateString());
    }
    if (Array.from(searchParams).length > 0) {
      url += `?${searchParams.toString()}`;
    }
    const thisRequestId = ++requestIdRef.current;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(result => {
        if (requestIdRef.current === thisRequestId) {
          setData(result);
        }
      })
      .catch(err => {
        if (requestIdRef.current === thisRequestId) {
          setError(err);
        }
      })
      .finally(() => {
        if (requestIdRef.current === thisRequestId) {
          setLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params)]);

  return { data, loading, error };
}
