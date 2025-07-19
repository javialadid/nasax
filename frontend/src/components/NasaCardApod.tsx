import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEasternDateString, addDays } from '@/utils/dateutil';
import { firstSentence } from '@/utils/stringutil';
import { getMaxDaysBackEpic } from '@/utils/env';
import { useNasaCardData } from '@/NasaCardDataContext';
import { useApiWithBackoff, nasaApiFetch } from '@/hooks/useNasaApi';

const DEFAULT_IMAGE = '/default-apod.png'; // Place a default image in public/
const DEFAULT_TITLE = 'Astronomy Picture of the Day';

const CARD_IMG_WIDTH = 400;
const CARD_IMG_HEIGHT = 300;

const MAX_DAYS_BACK = getMaxDaysBackEpic();

const NasaCardApod: React.FC = () => {
  const today = getEasternDateString();
  const { apodByDate, setApodDataForDate, setApodEmptyForDate } = useNasaCardData();
  const apodEntry = apodByDate[today];
  const MAX_DAYS_BACK = getMaxDaysBackEpic();

  // Fetcher that tries today, then previous days up to MAX_DAYS_BACK
  const fetchApodWithBacktrack = async () => {
    let date = today;
    for (let i = 0; i <= MAX_DAYS_BACK; i++) {
      try {
        const data = await nasaApiFetch('planetary/apod', { date });
        if (data && data.url) {
          return data;
        }
      } catch (e) {
        // Only try previous day if not last attempt
        if (i === MAX_DAYS_BACK) throw e;
      }
      date = addDays(date, -1);
    }
    // If none found, throw a custom error
    throw new Error('No APOD found for recent days');
  };

  const { data, loading, error } = useApiWithBackoff(fetchApodWithBacktrack, [today], { delay: 1000, maxAttempts: 1, enabled: !apodEntry });

  // Update context when data or error changes
  useEffect(() => {
    if (!apodEntry && data) {
      setApodDataForDate(today, data);
    } else if (!apodEntry && error && error.message === 'No APOD found for recent days') {
      setApodEmptyForDate(today);
    }
  }, [data, error, apodEntry, setApodDataForDate, setApodEmptyForDate, today]);

  const noRecentData = apodEntry ? apodEntry.empty : (error && error.message === 'No APOD found for recent days');
  // Prefer the smallest available image for the card
  const image = apodEntry && apodEntry.data && apodEntry.data.url ? apodEntry.data.url : DEFAULT_IMAGE;
  const apiTitle = apodEntry && apodEntry.data && apodEntry.data.title ? apodEntry.data.title : '';
  const apiExplanation = apodEntry && apodEntry.data && apodEntry.data.explanation ? firstSentence(apodEntry.data.explanation) : '';
  const ariaLabel = apiTitle || DEFAULT_TITLE;

  return (
    <Link to="/apod" style={{ textDecoration: 'none' }}>
      <div
        className="card relative aspect-[4/3] w-full border-1 border-gray-500 rounded-xl overflow-hidden cursor-pointer shadow-lg group"
        tabIndex={0}
        role="button"
        aria-label={ariaLabel}
        style={{ boxShadow: "-6px 7px 7px #ffffff0f" }}
      >
        {/* Tiny spinner in the top-right corner when loading */}
        {loading && (
          <div className="absolute top-2 right-2 z-20">
            <span className="inline-block w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" aria-label="Loading" />
          </div>
        )}
        <img
          src={noRecentData ? DEFAULT_IMAGE : image}
          alt={ariaLabel}
          width={CARD_IMG_WIDTH}
          height={CARD_IMG_HEIGHT}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Always show the default title at the top */}
        <div className="absolute top-0 left-0 w-full bg-black/60 text-white text-lg font-semibold px-3 py-2 text-center truncate z-10">
          {DEFAULT_TITLE}
        </div>
        {/* When data is loaded, show API title and first sentence at the bottom */}
        {apodEntry && apodEntry.data && !noRecentData && (
          <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-100 text-xs px-3 py-2 text-center z-10">
            <div className="font-semibold text-base truncate">{apiTitle}</div>
            <div className="text-xs text-gray-300 mt-1">{apiExplanation}</div>
          </div>
        )}
        {noRecentData && (
          <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-100 text-xs px-3 py-2 text-center z-10">
            <div className="font-semibold text-base truncate">No APOD found for the last {MAX_DAYS_BACK} days.</div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default NasaCardApod;
