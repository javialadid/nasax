import React, { useState, useEffect } from 'react';
import { useNasaApi } from '../hooks/useNasaApi';
import Explanation from './Explanation';
import { getEasternDateString, formatDateString, clampDateToRange, daysBetween, addDays } from '../utils/dateutil';
import { useSearchParams } from 'react-router-dom';
import SpinnerOverlay from './SpinnerOverlay';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { getMaxDaysBackEpic } from '../utils/env';

const MAX_DAYS_BACK = getMaxDaysBackEpic();

// Extracted Zoom Modal Component
const ZoomModal = ({ imageUrl, title, onClose }) => (
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
  
  // Simplified state management
  const [currentDate, setCurrentDate] = useState(() =>
    clampDateToRange(searchParams.get('date') || today, oldestAllowed, today)
  );
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const { data, loading, error } = useNasaApi('planetary/apod', { date: currentDate });

  // Simplified auto-retry logic
  useEffect(() => {
    if (!loading && (!data?.url) && retryCount < MAX_DAYS_BACK) {
      const prevDate = addDays(currentDate, -1);
      if (prevDate >= oldestAllowed) {
        setCurrentDate(prevDate);
        setRetryCount(count => count + 1);
      }
    } else if (data?.url) {
      setRetryCount(0);
    }
  }, [data, loading, currentDate, oldestAllowed, retryCount]);

  // Update URL params
  useEffect(() => {
    setSearchParams({ date: currentDate });
  }, [currentDate, setSearchParams]);

  // Navigation handlers
  const handlePrev = () => setCurrentDate(prev => addDays(prev, -1));
  const handleNext = () => setCurrentDate(prev => addDays(prev, 1));
  
  const daysBack = daysBetween(today, currentDate);
  const canGoPrev = daysBack < MAX_DAYS_BACK;
  const canGoNext = currentDate !== today;

  // Loading and error states
  if (loading && !data) return <SpinnerOverlay />;
  if (error) return <div className="text-red-500 text-center my-8">Error: {error.message}</div>;
  if (retryCount >= MAX_DAYS_BACK) return <div className="text-gray-400 text-center my-8">No APOD found for the last {MAX_DAYS_BACK} days.</div>;
  if (!data?.title || !data?.url || !data?.explanation) return <div className="text-gray-400 text-center my-8">No data available.</div>;

  const imageUrl = data.hdurl || data.url;

  return (
    <div className="w-full min-h-screen px-2 py-2 mt-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded"
        >
          Previous Day
        </button>
        <h1 className="text-lg font-semibold">{formatDateString(currentDate)}</h1>
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded"
        >
          Next Day
        </button>
      </div>

      {/* Main Content Grid - Improved responsive layout */}
      <div className="grid grid-cols-1 sm:landscape:grid-cols-3 lg:grid-cols-3 gap-3">
        {/* Image Section */}
        <div className="sm:landscape:col-span-2 lg:col-span-2">
          <div 
            className="bg-gray-800 rounded-xl p-2 cursor-pointer group"
            onClick={() => setShowZoomModal(true)}
          >
            <img
              src={imageUrl}
              alt={data.title}
              className="w-full h-auto max-h-[80vh] sm:landscape:max-h-[70vh] object-contain rounded-lg mx-auto group-hover:opacity-90 transition-opacity"
            />
          </div>
        </div>

        {/* Metadata Sidebar - Better responsive behavior */}
        <div className="bg-gray-900 rounded-xl p-2 space-y-3 sm:landscape:overflow-y-auto sm:landscape:max-h-[75vh]">
          <div>
            <h2 className="text-base font-semibold text-blue-300 mb-2 flex items-center gap-2">
              <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.75 17L6 21h12l-3.75-4M12 3v14' />
              </svg>
              {data.title}
            </h2>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <div className="font-semibold text-blue-200">Date:</div>
              <div className="text-gray-300">{formatDateString(currentDate)}</div>
              {data.copyright && (
                <>
                  <span className="text-gray-400">|</span>
                  <div className="font-semibold text-blue-200">Copyright:</div>
                  <div className="text-gray-300">{data.copyright}</div>
                </>
              )}
            </div>
            <div>
              <div className="text-gray-300 leading-relaxed">
                <Explanation text={data.explanation} />
              </div>
            </div>
          </div>
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