import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBaseUrl } from '@/utils/env';
import { getEasternDateString, addDays } from '@/utils/dateutil';
import { firstSentence } from '@/utils/stringutil';
import { getMaxDaysBackEpic } from '@/utils/env';
import { useNasaCardData } from '@/NasaCardDataContext';

const DEFAULT_IMAGE = '/default-apod.png'; // Place a default image in public/
const DEFAULT_TITLE = 'Astronomy Picture of the Day';

const CARD_IMG_WIDTH = 400;
const CARD_IMG_HEIGHT = 300;

const MAX_DAYS_BACK = getMaxDaysBackEpic();

const NasaCardApod: React.FC = () => {
  const { apodData, setApodData } = useNasaCardData();
  const [loading, setLoading] = useState(!apodData);
  const [noRecentData, setNoRecentData] = useState(false);

  useEffect(() => {
    if (apodData) {
      setLoading(false);
      setNoRecentData(false);
      return;
    }
    const fetchData = async (date: string, backCount: number, delay: number = 1000) => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/planetary/apod?date=${date}`);
        const json = await res.json();
        if (!json || !json.url) {
          if (backCount < MAX_DAYS_BACK) {
            const prevDate = addDays(date, -1);
            const nextDelay = Math.min(delay + 1000, 60000);
            setTimeout(() => {
              fetchData(prevDate, backCount + 1, nextDelay);
            }, delay);
          } else {
            setNoRecentData(true);
            setLoading(false);
          }
        } else {
          setApodData(json);
          setNoRecentData(false);
          setLoading(false);
        }
      } catch (e) {
        if (backCount < MAX_DAYS_BACK) {
          const prevDate = addDays(date, -1);
          const nextDelay = Math.min(delay + 1000, 60000);
          setTimeout(() => {
            fetchData(prevDate, backCount + 1, nextDelay);
          }, delay);
        } else {
          setNoRecentData(true);
          setLoading(false);
        }
      }
    };
    setLoading(true);
    setNoRecentData(false);
    fetchData(getEasternDateString(), 0); // no delay param needed, default is 1000ms
  }, [apodData, setApodData]);

  // Prefer the smallest available image for the card
  const image = apodData && apodData.url ? apodData.url : DEFAULT_IMAGE;
  const apiTitle = apodData && apodData.title ? apodData.title : '';
  const apiExplanation = apodData && apodData.explanation ? firstSentence(apodData.explanation) : '';

  return (
    <Link to="/apod" style={{ textDecoration: 'none' }}>
      <div
        className="card relative aspect-[4/3] w-full border-1 border-gray-500 rounded-xl overflow-hidden cursor-pointer shadow-lg group"
        tabIndex={0}
        role="button"
        aria-label={DEFAULT_TITLE}
        style={{ boxShadow: "-6px 7px 7px #ffffff0f" }}
      >
        <img
          src={noRecentData ? DEFAULT_IMAGE : image}
          alt={DEFAULT_TITLE}
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
        {apodData && !noRecentData && (
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
