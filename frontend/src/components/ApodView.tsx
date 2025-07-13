import React, { useState, useEffect, useRef } from 'react';
import { useNasaApi } from '../hooks/useNasaApi';
import Explanation from './Explanation';
import { getEasternDateString, formatDateString, clampDateToRange, daysBetween, addDays } from '../utils/dateutil';
import { useSearchParams } from 'react-router-dom';
import SpinnerOverlay from './SpinnerOverlay';
import FadeTransition from './FadeTransition';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { getMaxDaysBackEpic } from '../utils/env';

const MAX_DAYS_BACK = getMaxDaysBackEpic();

const ApodView: React.FC = () => {
  const today = getEasternDateString();
  const [searchParams, setSearchParams] = useSearchParams();
  const oldestAllowed = addDays(today, -MAX_DAYS_BACK);
  const [currentDate, setCurrentDate] = useState(() =>
    clampDateToRange(searchParams.get('date') || today, oldestAllowed, today)
  );
  const { data, loading, error } = useNasaApi('planetary/apod', { date: currentDate });

  // Track how many days we've gone back to avoid infinite loops
  const [autoBackCount, setAutoBackCount] = useState(0);
  const [noRecentData, setNoRecentData] = useState(false);

  useEffect(() => {
    if (!loading && (!data || !data.url) && autoBackCount < MAX_DAYS_BACK) {
      const prevDate = addDays(currentDate, -1);
      if (prevDate >= oldestAllowed) {
        setCurrentDate(prevDate);
        setAutoBackCount(c => c + 1);
        setNoRecentData(false);
      } else {
        setNoRecentData(true);
      }
    } else if (!loading && data && data.url) {
      setAutoBackCount(0);
      setNoRecentData(false);
    }
  }, [data, loading, currentDate, oldestAllowed, autoBackCount]);

  // Spinner overlay delay state (unchanged)
  const [showSpinner, setShowSpinner] = useState(false);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (loading && data) {
      timeout = setTimeout(() => setShowSpinner(true), 300);
    } else {
      setShowSpinner(false);
    }
    return () => timeout && clearTimeout(timeout);
  }, [loading, data]);

  const [notification, setNotification] = useState<string | null>(null);
  const lastClampedRef = useRef<string | null>(null);

  // Helper to show notification only if not already shown for this clamped date
  const showClampNotification = (clamped: string) => {
    if (lastClampedRef.current !== clamped) {
      if (clamped === oldestAllowed) {
        setNotification(`Requested date is too old. Showing earliest available date (${formatDateString(clamped)}).`);
      } else if (clamped === today) {
        setNotification(`Requested date is in the future. Showing today (${formatDateString(clamped)}).`);
      }
      lastClampedRef.current = clamped;
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Initial mount: clamp and notify if needed
  useEffect(() => {
    const initial = searchParams.get('date') || today;
    const clamped = clampDateToRange(initial, oldestAllowed, today);
    if (clamped !== initial) {
      showClampNotification(clamped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep currentDate and query string in sync, always clamped
  useEffect(() => {
    const clamped = clampDateToRange(currentDate, oldestAllowed, today);
    if (clamped !== currentDate) {
      setCurrentDate(clamped);
      setSearchParams({ date: clamped });
      showClampNotification(clamped);
    } else if (clamped !== searchParams.get('date')) {
      setSearchParams({ date: clamped });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  // Respond to manual URL changes, always clamped
  useEffect(() => {
    const urlDate = searchParams.get('date');
    if (urlDate) {
      const clamped = clampDateToRange(urlDate, oldestAllowed, today);
      if (clamped !== currentDate) {
        setCurrentDate(clamped);
        showClampNotification(clamped);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handlePrev = () => setCurrentDate(prev => addDays(prev, -1));
  const handleNext = () => setCurrentDate(prev => addDays(prev, 1));

  const daysBack = daysBetween(today, currentDate);
  const canGoPrev = daysBack < MAX_DAYS_BACK;
  const canGoNext = currentDate !== today;

  const [showZoomModal, setShowZoomModal] = useState(false);

  if (loading && !data) {
    return (
      <div className="flex flex-col w-full overflow-hidden animate-pulse">
        <div className="w-full flex flex-col items-center justify-center bg-transparent px-0 pt-0 pb-0" style={{ minHeight: 0 }}>
          <div className="flex flex-row items-center justify-center w-full gap-2">
            <div className="h-8 w-2/3 sm:w-1/2 bg-gray-700/60 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-700/40 rounded ml-3" />
          </div>
        </div>
        <div className="w-full flex-shrink-0 flex items-center justify-center min-h-[50vh] relative" style={{ minHeight: '50vh' }}>
          <div className="object-contain mx-6 my-4 picture-shadow bg-gray-800/60 rounded-xl w-full h-[50vh] max-h-[50vh] flex items-center justify-center" />
        </div>
        <div className="w-full max-h-[30vh] overflow-y-auto px-4">
          <div className="h-4 w-5/6 bg-gray-700/40 rounded mb-2" />
          <div className="h-4 w-4/6 bg-gray-700/30 rounded mb-2" />
          <div className="h-4 w-3/6 bg-gray-700/20 rounded mb-2" />
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="flex items-center justify-center h-[60vh] text-red-600 text-xl">Error: {error.message}</div>;
  }
  if (noRecentData) {
    return <div className="flex items-center justify-center h-[60vh] text-xl text-gray-400">No APOD found for the last {MAX_DAYS_BACK} days.</div>;
  }
  if (!data && !loading && !error) {
    return <div className="flex items-center justify-center h-[60vh] text-xl text-gray-400">No data found.</div>;
  }
  if (!data) {
    return null;
  }
  if (!data.title || !data.url || !data.explanation) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-sm text-red-500">
        <div>Unexpected API response. Raw data:</div>
        <pre className="bg-gray-900 text-white p-4 rounded max-w-full overflow-x-auto mt-2">{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }

  // Helper to render APOD content
  const renderApodContent = (apod: any, date: string) => (
    <div className="absolute inset-0 w-full h-full flex flex-col min-h-0">
      <div className="w-full flex flex-col items-center justify-center bg-transparent px-0 pt-0 pb-0" style={{ minHeight: 0 }}>
        <div className="flex flex-row items-center w-full gap-2">
          <div className="flex-1" />
          <h2
            className="text-2xl sm:text-3xl font-bold text-center break-words m-0"            
          >
            {apod.title}
          </h2>
          <span className="flex-1 text-sm text-gray-300 ml-3 whitespace-nowrap text-left">
            {formatDateString(date)}
          </span>
        </div>
      </div>
      <div className="w-full flex-shrink-0 flex flex-col items-center justify-center min-h-0 flex-1" >
        <div className="relative w-full flex items-center justify-center" >
          <img
            src={apod.hdurl || apod.url}
            alt={apod.title}
            className={`object-contain mx-6 my-4 picture-shadow select-none${(apod.hdurl || apod.url) ? ' cursor-zoom-in' : ''}`}
            style={{ background: 'transparent', border: 'none', padding: 0, maxHeight: '60vh'}}
            draggable={false}
            onClick={() => (apod.hdurl || apod.url) && setShowZoomModal(true)}
            aria-label="View full size image"
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if ((apod.hdurl || apod.url) && (e.key === 'Enter' || e.key === ' ')) setShowZoomModal(true);
            }}
          />
        </div>
        <div className="w-full flex-1 min-h-0 overflow-y-auto p-1">
          <Explanation text={apod.explanation} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full min-h-0 flex-1 overflow-hidden relative">
      {notification && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 
          rounded shadow z-50 text-center text-xl">
          {notification}
        </div>
      )}
      {/* Spinner overlay if loading and data is present, with delay */}
      {showSpinner && loading && data && <SpinnerOverlay />}
      {/* APOD content with fade-in on date change */}
      <FadeTransition key={currentDate} durationMs={1500}>
        {renderApodContent(data, currentDate)}
      </FadeTransition>
      {/* Zoom Modal */}
      {showZoomModal && (
        <div className="fixed left-0 right-0 bottom-0 top-14 z-40 flex items-center justify-center bg-black bg-opacity-95">
          <button
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/80 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-blue-400 opacity-60 hover:opacity-100 transition-opacity z-50"
            onClick={() => setShowZoomModal(false)}
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-full h-full flex items-center justify-center">
            <TransformWrapper>
              <TransformComponent>
                <img
                  src={data.hdurl || data.url}
                  alt={data.title}
                  style={{ maxWidth: '100vw', maxHeight: '100vh', display: 'block', margin: '0 auto', boxShadow: '0 0 32px #0008' }}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>
        </div>
      )}
      {/* Navigation buttons (always on top) */}
      <div className="w-full flex-shrink-0 flex items-center justify-center min-h-[80vh] relative pointer-events-none" style={{ minHeight: '80vh' }}>
        <button
          className={`absolute left-0 top-1/2 -translate-y-1/2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-40 disabled:cursor-not-allowed
            w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center rounded-full border-2 border-gray-400 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-700 shadow-xl hover:from-blue-900 hover:to-gray-800 group pointer-events-auto`}
          onClick={handlePrev}
          disabled={!canGoPrev}
          aria-label="Previous Day"
          tabIndex={0}
        >
          <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white group-hover:text-blue-300 transition" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          className={`absolute right-0 top-1/2 -translate-y-1/2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-40 disabled:cursor-not-allowed
            w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center rounded-full border-2 border-gray-400 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-700 shadow-xl hover:from-blue-900 hover:to-gray-800 group pointer-events-auto`}
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Next Day"
          tabIndex={0}
        >
          <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white group-hover:text-blue-300 transition" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ApodView; 