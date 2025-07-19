import { useEffect, useState, useRef } from 'react';
import { getApiBaseUrl } from '../utils/env';
import { getEasternDateString } from '../utils/dateutil';

export function useNasaApi(endpoint: string, params: Record<string, string> = {}, options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== undefined ? options.enabled : true;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }
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
          // Normalize error
          const normErr = (typeof err === 'object' && err && 'message' in err)
            ? err
            : { message: String(err) };
          setError(normErr);
        }
      })
      .finally(() => {
        if (requestIdRef.current === thisRequestId) {
          setLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params), enabled]);

  return { data, loading, error };
}

export async function nasaApiFetch(endpoint: string, params: Record<string, string> = {}) {
  const baseUrl = getApiBaseUrl();
  let url = `${baseUrl}/${endpoint}`;
  const searchParams = new URLSearchParams(params);
  if (endpoint === 'planetary/apod' && !params.date) {
    searchParams.set('date', getEasternDateString());
  }
  if (Array.from(searchParams).length > 0) {
    url += `?${searchParams.toString()}`;
  }
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

/**
 * useApiWithBackoff - React hook for fetching data with retry/backoff logic.
 * @param fetcher - async function that returns data (should throw on error)
 * @param deps - dependencies array for useEffect
 * @param options - { delay: initial delay ms, maxAttempts: max retries, enabled: boolean }
 * @returns { data, loading, error, attempt }
 */
export function useApiWithBackoff<T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
  options: { delay?: number; maxAttempts?: number; enabled?: boolean } = {}
) {
  const { delay = 1000, maxAttempts = 10, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      setData(null);
      setAttempt(0);
      return;
    }
    let isMounted = true;
    setLoading(true);
    setError(null);
    setData(null);
    setAttempt(0);
    let currentAttempt = 0;
    let currentDelay = delay;

    const doFetch = async () => {
      try {
        const result = await fetcher();
        if (isMounted) {
          setData(result);
          setLoading(false);
          setError(null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (currentAttempt < maxAttempts - 1) {
          currentAttempt++;
          setAttempt(currentAttempt);
          currentDelay = Math.min(currentDelay + 1000, 60000);
          timeoutRef.current = window.setTimeout(doFetch, currentDelay);
        } else {
          // Normalize error
          const normErr = (typeof err === 'object' && err && 'message' in err)
            ? err
            : { message: String(err) };
          setError(normErr);
          setLoading(false);
        }
      }
    };
    doFetch();
    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, attempt };
}
