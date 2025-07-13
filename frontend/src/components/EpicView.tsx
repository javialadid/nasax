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
    <div className="flex flex-col w-full h-full min-h-0 flex-1 overflow-hidden relative items-center p-1 p-2">
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
      <div className="flex flex-col lg:flex-row items-stretch justify-center w-full flex-1 min-h-0 gap-4">
        {/* Image Area */}
        <div className="flex-1 flex items-center justify-center min-h-0 h-full w-full">
          <div
            className="object-contain picture-shadow bg-gray-800/60 rounded-xl flex items-center justify-center w-full h-full max-w-full max-h-full m-0"
            style={{ aspectRatio: '1 / 1', height: '100%', width: '100%' }}
          >
            <Carousel
              imageUrls={imageUrls}
              order={"desc"}
              onIndexChange={setCarouselIdx}
              autoPlay={autoPlay}
              className="w-full h-full"
              imageClassName="object-contain w-full h-full max-w-full max-h-full rounded-xl"
            />
          </div>
        </div>
        {/* Metadata Sidebar - like NasaRoversView */}
        <div className="w-full lg:w-[22ch] lg:mt-0 flex-shrink-0 bg-gray-900 bg-opacity-90 rounded-xl p-2 lg:p-3 text-gray-200 shadow-lg overflow-y-auto lg:h-full mt-2 lg:mt-0">
          <div className="mb-1">
            <div className="font-semibold text-base lg:text-lg mb-2 border-b border-gray-700 pb-1 flex items-center gap-2">
              <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 text-blue-300' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 3v18m9-9H3' /></svg>
              EPIC Image
            </div>
            {currentImg ? (
              <ul className="text-sm space-y-2">
                <li className="pt-2 border-gray-700 mt-2">
                  <div className="font-semibold text-blue-200 mb-0.5">Caption</div>
                  <div className="break-words whitespace-pre-line">{currentImg.caption}</div>
                </li>
                <li>
                  <div className="font-semibold text-blue-200 mb-0.5">Date</div>
                  <div className="break-words">{currentImg.date}</div>
                </li>
                <li>
                  <div className="font-semibold text-blue-200 mb-0.5">Image</div>
                  <div className="break-words">{carouselIdx + 1} / {data.length}</div>
                </li>
                <li>
                  <div className="font-semibold text-blue-200 mb-0.5">Image Name</div>
                  <div className="break-words">{currentImg.image}</div>
                </li>
                {currentImg.centroid_coordinates && (
                  <li>
                    <div className="font-semibold text-blue-200 mb-0.5">Centroid Coordinates</div>
                    <div className="break-words">Lat: {currentImg.centroid_coordinates.lat}, Lon: {currentImg.centroid_coordinates.lon}</div>
                  </li>
                )}
              </ul>
            ) : (
              <div className="text-gray-400">No image selected.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpicView; 