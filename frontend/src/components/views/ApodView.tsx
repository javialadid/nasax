import React, { useState, useEffect } from 'react';
import { useNasaApi } from '../../hooks/useNasaApi';
import Explanation from '../Explanation';
import { getEasternDateString, formatDateString, clampDateToRange, daysBetween, addDays } from '../../utils/dateutil';
import { useSearchParams } from 'react-router-dom';
import SpinnerOverlay from '../SpinnerOverlay';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { getMaxDaysBackEpic } from '../../utils/env';

// Logging utility for debugging
const log = (message: string, data: any) => {
  console.log(`[ApodView] ${message}`, JSON.stringify(data, null, 2));
};

const MAX_DAYS_BACK = getMaxDaysBackEpic();

type ZoomModalProps = {
  imageUrl: string;
  title: string;
  onClose: () => void;
};

const ZoomModal = ({ imageUrl, title, onClose }: ZoomModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95">
    <button
      className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/80 rounded-full text-white z-50"
      onClick={onClose}
      title="Close"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
    <div className="w-full h-full flex items-center justify-center p-4">
      <TransformWrapper>
        <TransformComponent>
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-full object-contain rounded-lg"
            draggable={false}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  </div>
);

const ApodView = () => {
  const today = getEasternDateString();
  const [searchParams, setSearchParams] = useSearchParams();
  const oldestAllowed = addDays(today, -MAX_DAYS_BACK);

  // Initialize currentDate from URL or default to today
  const [currentDate, setCurrentDate] = useState(() => {
    const urlDate = searchParams.get('date');
    const initialDate = urlDate ? clampDateToRange(urlDate, oldestAllowed, today) : today;
    
    return initialDate;
  });
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  // Fetch data with useNasaApi
  const { data, loading, error } = useNasaApi('planetary/apod', { date: currentDate }, { refetchOnMount: true });

  // Log API response for debugging
  useEffect(() => {
    //log('API response', { data, loading, error, currentDate });
  }, [data, loading, error, currentDate]);

  // Auto-retry logic when no data is returned
  useEffect(() => {
    if (!loading && (!data?.url || !data?.title || !data?.explanation) && retryCount < MAX_DAYS_BACK) {
      const prevDate = addDays(currentDate, -1);
      if (prevDate >= oldestAllowed) {
        log('Retrying with previous date', { prevDate, retryCount });
        setCurrentDate(prevDate);
        setRetryCount(count => count + 1);
        setSearchParams({ date: prevDate }, { replace: true });
      }
    } else if (data?.url) {      
      setRetryCount(0);
    }
  }, [data, loading, currentDate, oldestAllowed, retryCount, setSearchParams]);

  // Sync currentDate with URL changes (e.g., back button)
  useEffect(() => {
    const urlDate = searchParams.get('date');
    const newDate = urlDate ? clampDateToRange(urlDate, oldestAllowed, today) : today;
    if (newDate !== currentDate) {
      log('Syncing currentDate with URL', { urlDate, newDate, currentDate });
      setCurrentDate(newDate);
      setRetryCount(0); // Reset retry count on manual URL change
    }
  }, [searchParams, currentDate, oldestAllowed, today]);

  // Navigation handlers
  const handlePrev = () => {
    const newDate = addDays(currentDate, -1);
    log('Navigating to previous date', { newDate });
    setCurrentDate(newDate);
    setSearchParams({ date: newDate });
  };

  const handleNext = () => {
    const newDate = addDays(currentDate, 1);
    log('Navigating to next date', { newDate });
    setCurrentDate(newDate);
    setSearchParams({ date: newDate });
  };

  const daysBack = daysBetween(today, currentDate);
  const canGoPrev = daysBack < MAX_DAYS_BACK;
  const canGoNext = currentDate !== today;

  const imageUrl = data?.hdurl || data?.url;

  // Loading and error states
  if (loading && !data) {    
    return <SpinnerOverlay />;
  }
  if (error) {    
    return <div className="text-red-500 text-center my-8">Error: {error.message}</div>;
  }
  if (retryCount >= MAX_DAYS_BACK) {
    log('Max retries reached', { retryCount, MAX_DAYS_BACK });
    return <div className="text-gray-400 text-center my-8">No APOD found for the last {MAX_DAYS_BACK} days.</div>;
  }
  if (!data?.title || !data?.url || !data?.explanation) {    
    return <div className="text-gray-400 text-center my-8">No data available.</div>;
  }

  return (
    <div className="p-4 h-[calc(100vh-4rem)] flex
    portrait:flex-col portrait:items-stretch 
    landscape:items-start">
      {/* Image Section */}
      <div
        className="
          portrait:w-full portrait:mb-4 portrait:max-h-[60vh] portrait:flex-shrink-0
          landscape:flex-shrink-0 landscape:max-w-[70vw] landscape:h-full landscape:mr-4
        "
        
      >
        <div className="relative w-full h-full flex items-start justify-center">
          <div
            className="bg-transparent rounded-xl p-2 cursor-pointer group relative flex items-start justify-center w-full h-full"
            onClick={() => setShowZoomModal(true)}
          >
            {imageLoading && <SpinnerOverlay />}
            <img
              key={imageUrl}
              src={imageUrl}
              alt={data.title}
              className="picture-shadow object-contain rounded-lg mx-auto group-hover:opacity-90 transition-opacity self-start max-h-full max-w-full"
              style={{ minHeight: 0, minWidth: 0, display: 'block' }}
              loading="eager"
              onLoad={() => {                
                setImageLoading(false);
              }}
              onError={() => {
                log('Image failed to load (onError handler)', { imageUrl, imageLoading });
                setImageLoading(false);
              }}
              onLoadStart={() => {                
                setImageLoading(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Metadata Section */}
      <div
        className="
          rounded-lg shadow-md bg-gray-900/80 p-0 
          portrait:w-full portrait:min-h-[25vh] portrait:max-h-[50vh] portrait:flex-grow
          landscape:flex-grow landscape:min-w-[35vh] landscape:max-h-[75vh] landscape:text-sm 
          landscape:md:text-base
          flex flex-col min-h-0
          text-sm smphone:text-base md:text-lg sm:p-0 md:p-2
        "
        style={{ verticalAlign: 'top' }}
      >
        {/* Navigation Buttons and Title Row */}
        <div className="flex flex-row items-center gap-2 mb-4 justify-center w-full">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="px-2 py-2 bg-gray-700/60 rounded-full disabled:opacity-40 flex items-center justify-center hover:bg-gray-600 transition"
            aria-label="Previous Day"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="flex-1 font-bold text-blue-200 text-center mx-2 whitespace-normal">{data.title}</h2>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="px-2 py-2 bg-gray-700/60 rounded-full disabled:opacity-40 flex items-center justify-center hover:bg-gray-600 transition"
            aria-label="Next Day"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        <div className="text-gray-300 mb-2 flex flex-wrap items-center gap-4 justify-center text-center">
          <div><span className="pl-2 font-semibold text-blue-200">Date:</span> {formatDateString(currentDate)}</div>
          {data.copyright && (
            <div className="flex items-center">
              <span className="font-semibold text-blue-200">©</span>
              <span
                className="ml-1 text-xs truncate max-w-[10rem] inline-block align-bottom"
                title={data.copyright}
              >
                {data.copyright.length > 20
                  ? data.copyright.slice(0, 20) + '...'
                  : data.copyright}
              </span>
            </div>
          )}
        </div>
        <div className="text-gray-200 leading-relaxed overflow-y-auto min-h-0 flex-1">
          <Explanation text={data.explanation} className="" />
        </div>
        
      </div>

      {/* Zoom Modal */}
      {showZoomModal && (
        <ZoomModal 
          imageUrl={imageUrl}
          title={data.title}
          onClose={() => setShowZoomModal(false)}
        />
      )}
    </div>
  );
};

export default ApodView;