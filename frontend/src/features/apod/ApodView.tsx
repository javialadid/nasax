import React, { useState, useEffect } from 'react';
import { useApiWithBackoff, nasaApiFetch } from '@/hooks/useNasaApi';
import Explanation from '@components/Explanation';
import { getEasternDateString, formatDateString, clampDateToRange, daysBetween, addDays } from '@/utils/dateutil';
import { useSearchParams } from 'react-router-dom';
import SpinnerOverlay from '@components/SpinnerOverlay';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { getMaxDaysBackEpic } from '@/utils/env';
import { useNasaCardData } from '@/context/NasaCardDataContext';
import { getApiBaseUrl } from '@/utils/env';
import ZoomModal from '@components/ZoomModal';

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

const ApodView = () => {
  const today = getEasternDateString();
  const [searchParams, setSearchParams] = useSearchParams();
  const oldestAllowed = addDays(today, -MAX_DAYS_BACK);

  // Context for APOD data by date
  const { apodByDate, setApodDataForDate, setApodEmptyForDate } = useNasaCardData();

  // Initialize currentDate from URL or default to today
  const [currentDate, setCurrentDate] = useState(() => {
    const urlDate = searchParams.get('date');
    const initialDate = urlDate ? clampDateToRange(urlDate, oldestAllowed, today) : today;
    return initialDate;
  });
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Get APOD entry for the current date from context
  const apodEntry = apodByDate[currentDate];

  // Fetcher that tries currentDate, then previous days up to MAX_DAYS_BACK
  const fetchApodWithBacktrack = async () => {
    let date = currentDate;
    for (let i = 0; i <= MAX_DAYS_BACK; i++) {
      try {
        const data = await nasaApiFetch('planetary/apod', { date });
        if (data && data.url) {
          return { data, date };
        }
      } catch (e) {
        if (i === MAX_DAYS_BACK) throw e;
      }
      date = addDays(date, -1);
    }
    throw new Error('No APOD found for recent days');
  };

  const { data: fetched, loading, error } = useApiWithBackoff(fetchApodWithBacktrack, [currentDate], { delay: 1000, maxAttempts: 1, enabled: !apodEntry });

  // Update context and URL when data or error changes
  useEffect(() => {
    if (!apodEntry && fetched) {
      setApodDataForDate(fetched.date, fetched.data);
      if (fetched.date !== currentDate) {
        setCurrentDate(fetched.date);
        setSearchParams({ date: fetched.date }, { replace: true });
      }
    } else if (!apodEntry && error && error.message === 'No APOD found for recent days') {
      setApodEmptyForDate(currentDate);
    }
  }, [fetched, error, apodEntry, setApodDataForDate, setApodEmptyForDate, currentDate, setSearchParams]);

  // Sync currentDate with URL changes (e.g., back button)
  useEffect(() => {
    const urlDate = searchParams.get('date');
    const newDate = urlDate ? clampDateToRange(urlDate, oldestAllowed, today) : today;
    if (newDate !== currentDate) {
      setCurrentDate(newDate);
    }
  }, [searchParams, currentDate, oldestAllowed, today]);

  // Navigation handlers
  const handlePrev = () => {
    const newDate = addDays(currentDate, -1);
    setCurrentDate(newDate);
    setSearchParams({ date: newDate });
  };

  const handleNext = () => {
    const newDate = addDays(currentDate, 1);
    setCurrentDate(newDate);
    setSearchParams({ date: newDate });
  };

  const daysBack = daysBetween(today, currentDate);
  const canGoPrev = daysBack < MAX_DAYS_BACK;
  const canGoNext = currentDate !== today;

  // Use context data if available
  const data = apodEntry && apodEntry.data ? apodEntry.data : null;
  const empty = apodEntry && apodEntry.empty;
  const imageUrl = data?.hdurl || data?.url;

  // Loading and error states
  if (loading || (!apodEntry && !error)) {
    return <SpinnerOverlay />;
  }
  if (empty || (error && error.message === 'No APOD found for recent days')) {
    return <div className="text-gray-400 text-center my-8">No APOD found for the last {MAX_DAYS_BACK} days.</div>;
  }
  if (!data?.title || !data?.url || !data?.explanation) {
    return <div className="text-gray-400 text-center my-8">No data available.</div>;
  }

  return (
    <div className="p-1 h-[calc(100vh-4rem)] flex
    portrait:flex-col portrait:items-stretch 
    landscape:items-start">
      {/* Image Section */}
      <div
        className="
          portrait:w-full portrait:mb-1 portrait:max-h-[60vh] portrait:flex-shrink-0
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
        <div className="flex flex-row items-center gap-2 justify-center w-full">
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
        <div className="text-gray-300  flex flex-wrap items-center gap-4 justify-center text-center">
          <div className="text-xs"> {formatDateString(currentDate)}</div>
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