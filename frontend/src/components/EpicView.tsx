import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNasaApi } from '../hooks/useNasaApi';
import SpinnerOverlay from './SpinnerOverlay';
import Carousel from './Carousel';

const MAX_DAYS_BACK = 7;

function getEasternDateString(): string {
  const now = new Date();
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  if (eastern.getHours() === 0 && eastern.getMinutes() < 5) {
    eastern.setDate(eastern.getDate() - 1);
  }
  return eastern.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24));
}

// Set to true to enable fade/blink effect between images
const CAROUSEL_FADE = false;

const EpicView: React.FC = () => {
  const today = getEasternDateString();
  const [searchParams, setSearchParams] = useSearchParams();
  const oldestAllowed = addDays(today, -MAX_DAYS_BACK);
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const urlDate = searchParams.get('date') || today;
    return urlDate < oldestAllowed ? oldestAllowed : urlDate > today ? today : urlDate;
  });
  const { data, loading, error } = useNasaApi(`api/EPIC/api/natural/date/${currentDate}`);
  const [noRecentData, setNoRecentData] = useState(false);
  const [autoBackCount, setAutoBackCount] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    setSearchParams({ date: currentDate });
  }, [currentDate, setSearchParams]);

  // If no data for currentDate, go back a day, up to MAX_DAYS_BACK
  useEffect(() => {
    if (!loading && (!data || !Array.isArray(data) || data.length === 0) && autoBackCount < MAX_DAYS_BACK) {
      const prevDate = addDays(currentDate, -1);
      if (prevDate >= oldestAllowed) {
        setCurrentDate(prevDate);
        setAutoBackCount(c => c + 1);
        setNoRecentData(false);
      } else {
        setNoRecentData(true);
      }
    } else if (!loading && data && Array.isArray(data) && data.length > 0) {
      setAutoBackCount(0);
      setNoRecentData(false);
      setCarouselIdx(data.length - 1); // Start at most recent image
    }
  }, [data, loading, currentDate, oldestAllowed, autoBackCount]);

  // Build array of image URLs from data
  const imageUrls = data && Array.isArray(data)
    ? data.map(img => {
        const dateParts = img.date.split(' ');
        const [year, month, day] = dateParts[0].split('-');
        return `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${img.image}.png`;
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
    <div className="flex flex-col w-full overflow-hidden relative min-h-[calc(100vh-3.5rem)] items-center">
      <div className="w-full max-w-2xl flex flex-row items-center justify-center gap-4 mb-2 mt-2">
        <button
          onClick={() => setCurrentDate(addDays(currentDate, -1))}
          disabled={currentDate <= oldestAllowed}
          className="px-4 py-2 bg-gray-700/60 rounded disabled:opacity-40"
        >
          Previous Day
        </button>
        <span className="text-lg font-semibold" style={{ color: 'bisque' }}>{currentDate}</span>
        <button
          onClick={() => setCurrentDate(addDays(currentDate, 1))}
          disabled={currentDate >= today}
          className="px-4 py-2 bg-gray-700/60 rounded disabled:opacity-40"
        >
          Next Day
        </button>
      </div>
      <div className="flex flex-col items-center justify-center w-full max-w-2xl flex-1">
        <div className="relative w-full flex-1 flex items-center justify-center min-h-[60vh]">
          {imageUrls.length > 0 ? (
            <Carousel
              imageUrls={imageUrls}
              order={"desc"}
              onIndexChange={setCarouselIdx}
              autoPlay={autoPlay}
            />
          ) : (
            <SpinnerOverlay />
          )}
        </div>
        {/* Metadata always below the image, never overlaid */}
        <div className="mt-2 text-[0.75rem] text-gray-400 text-center leading-tight" style={{ opacity: 0.8, maxWidth: '420px', wordBreak: 'break-word' }}>
          <div style={{ whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>{currentImg && currentImg.caption}</div>
          <div>{currentImg && currentImg.date}</div>
          <div>Image {carouselIdx + 1} of {data.length}</div>
        </div>
      </div>
      {imageUrls.length > 1 && (
        <button
          className="mt-4 px-6 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800"
          onClick={() => setAutoPlay((p) => !p)}
        >
          {autoPlay ? '❚❚ Pause' : '▶ Play'}
        </button>
      )}
    </div>
  );
};

export default EpicView; 