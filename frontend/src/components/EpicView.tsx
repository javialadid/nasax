import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNasaApi } from '../hooks/useNasaApi';
import SpinnerOverlay from './SpinnerOverlay';
import Carousel from './Carousel';
import { getEasternDateString, addDays } from '../utils/dateutil';
import { getMaxDaysBackEpic } from '../utils/env';

const MAX_DAYS_BACK = getMaxDaysBackEpic()
const EPIC_API_PATH = 'EPIC/api/natural/date/';
const EPIC_PICTURE_BASE_URL = 'https://epic.gsfc.nasa.gov/archive/natural/'

const EpicView: React.FC = () => {
  const today = getEasternDateString();
  const [searchParams, setSearchParams] = useSearchParams();
  const oldestAllowed = addDays(today, -MAX_DAYS_BACK);
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const urlDate = searchParams.get('date') || today;
    return urlDate < oldestAllowed ? oldestAllowed : urlDate > today ? today : urlDate;
  });
  const { data, loading, error } = useNasaApi(`${EPIC_API_PATH}${currentDate}`);
  const [noRecentData, setNoRecentData] = useState(false);
  const [autoBackCount, setAutoBackCount] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  // Track the last date for which we requested data to avoid skipping days before the API responds
  const lastRequestedDate = useRef<string>(currentDate);
  // Track tested dates and their results for debugging
  const [testedDates, setTestedDates] = useState<{date: string, result: 'data' | 'no-data' | 'error'}[]>([]);

  useEffect(() => {
    lastRequestedDate.current = currentDate;
  }, [currentDate]);

  useEffect(() => {
    setSearchParams({ date: currentDate });
  }, [currentDate, setSearchParams]);

  // If no data for currentDate, go back a day, up to MAX_DAYS_BACK
  useEffect(() => {
    // Log the test for this date
    if (!loading && lastRequestedDate.current === currentDate) {
      if (error) {
        setTestedDates(prev => [...prev, {date: currentDate, result: 'error'}]);
        console.log(`[EPIC TEST] ${currentDate}: error`, error);
      } else if (!data || !Array.isArray(data) || data.length === 0) {
        setTestedDates(prev => [...prev, {date: currentDate, result: 'no-data'}]);
        console.log(`[EPIC TEST] ${currentDate}: no data ###${data}###`);
      } else {
        setTestedDates(prev => [...prev, {date: currentDate, result: 'data'}]);
        console.log(`[EPIC TEST] ${currentDate}: data found`);
      }
    }
    // Pipeline: only request the next date after the previous request completes and is confirmed to have no data
    if (
      !loading &&
      lastRequestedDate.current === currentDate &&
      (!data || !Array.isArray(data) || data.length === 0) &&
      autoBackCount < MAX_DAYS_BACK
    ) {
      const prevDate = addDays(currentDate, -1);
      console.log(`Going back as there is no data yet for date ${currentDate}. Next -> ${prevDate}`)
      if (prevDate >= oldestAllowed) {
        setCurrentDate(prevDate);
        setAutoBackCount(c => c + 1);
        setNoRecentData(false);
      } else {
        setNoRecentData(true);
      }
    } else if (
      !loading &&
      lastRequestedDate.current === currentDate &&
      data &&
      Array.isArray(data) &&
      data.length > 0
    ) {
      setAutoBackCount(0);
      setNoRecentData(false);
      setCarouselIdx(data.length - 1); // Start at most recent image
    }
  }, [data, loading, currentDate, oldestAllowed, autoBackCount, error]);

  // Build array of image URLs from data
  const imageUrls = data && Array.isArray(data)
    ? data.map(img => {
        const dateParts = img.date.split(' ');
        const [year, month, day] = dateParts[0].split('-');
        return `${EPIC_PICTURE_BASE_URL}${year}/${month}/${day}/png/${img.image}.png`;
      })
    : [];
  const currentImg = data && Array.isArray(data) && data[carouselIdx];

  if (noRecentData) {
    return <div className="text-gray-400 text-center my-8">No EPIC images found for the last {MAX_DAYS_BACK} days.</div>;
  }
  if (loading && !data) {
    return <SpinnerOverlay />;
  }
  if (error) {
    return <div className="text-red-500 text-center my-8">Error: {error.message}</div>;
  }
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-gray-400 text-center my-8">No EPIC images found for this date.</div>;
  }

  return (
    <div className="flex flex-col w-full h-full min-h-0 flex-1 overflow-hidden relative items-center">
      <div className="w-full max-w-2xl flex flex-row items-center justify-center gap-4 mb-2 mt-2">
        <button
          onClick={() => setCurrentDate(addDays(currentDate, -1))}
          disabled={currentDate <= oldestAllowed}
          className="px-4 py-2 bg-gray-700/60 rounded disabled:opacity-40"
        >
          Previous Day
        </button>
        <span className="text-lg font-semibold">{currentDate}</span>
        <button
          onClick={() => setCurrentDate(addDays(currentDate, 1))}
          disabled={currentDate >= today}
          className="px-4 py-2 bg-gray-700/60 rounded disabled:opacity-40"
        >
          Next Day
        </button>
      </div>
      <div className="flex flex-col items-center justify-center w-full flex-1 min-h-0">
        <div className="relative w-full flex-1 flex items-center justify-center min-h-[50vh]">
          {imageUrls.length > 0 ? (
            <div
              className="object-contain mx-6 my-4 picture-shadow bg-gray-800/60 rounded-xl flex items-center justify-center"
              style={{ aspectRatio: '1 / 1', width: 'min(70vh, 90vw)', maxWidth: '90vw', maxHeight: '70vh' }}
            >
              <Carousel
                imageUrls={imageUrls}
                order={"desc"}
                onIndexChange={setCarouselIdx}
                autoPlay={autoPlay}
              />
            </div>
          ) : (
            <SpinnerOverlay />
          )}
        </div>
        {/* Metadata always below the image, never overlaid */}
        <div className="mt-2 text-[0.75rem] text-gray-400 text-center leading-tight" style={{ opacity: 0.8, maxWidth: '420px', wordBreak: 'break-word', overflowY: 'auto', maxHeight: '20vh' }}>
          <div style={{ whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>{currentImg && currentImg.caption}</div>
          <div>{currentImg && currentImg.date}</div>
          <div>Image {carouselIdx + 1} of {data.length}</div>
        </div>
      </div>
    </div>
  );
};

export default EpicView; 