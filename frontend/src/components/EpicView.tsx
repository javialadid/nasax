import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNasaApi, nasaApiFetch } from '../hooks/useNasaApi';
import SpinnerOverlay from './SpinnerOverlay';
import Carousel from './Carousel';
import { getEasternDateString, addDays } from '../utils/dateutil';
import { getMaxDaysBackEpic } from '../utils/env';

const MAX_DAYS_BACK = getMaxDaysBackEpic()
const EPIC_API_PATH = 'EPIC/api/natural/date/';
const EPIC_PICTURE_BASE_URL = 'https://epic.gsfc.nasa.gov/archive/natural/'
const RECENT_DAYS_TO_CHECK = 3; // Configurable number of days to check in parallel

const EpicView: React.FC = () => {
  const today = getEasternDateString();
  const [searchParams, setSearchParams] = useSearchParams();
  const oldestAllowed = addDays(today, -MAX_DAYS_BACK);
  const urlDate = searchParams.get('date');
  const [searchingForRecent, setSearchingForRecent] = useState(false);
  const [mostRecentWithImages, setMostRecentWithImages] = useState<string | null>(null);
  const [noImagesForDate, setNoImagesForDate] = useState<string | null>(null);

  // Derive currentDate from urlDate or mostRecentWithImages
  const currentDate = urlDate || mostRecentWithImages;

  // Helper to clamp date
  const clampDate = (date: string) =>
    date < oldestAllowed ? oldestAllowed : date > today ? today : date;

  // Find the most recent date with images (from today backwards, up to MAX_DAYS_BACK, in batches of RECENT_DAYS_TO_CHECK)
  useEffect(() => {
    // Only search for most recent if there is no date param
    if (!urlDate) {
      setSearchingForRecent(true);
      let batchStart = 0;
      let found = false;
      const tryBatch = async () => {
        while (batchStart < MAX_DAYS_BACK && !found) {
          const daysToCheck: string[] = [];
          for (let i = 0; i < RECENT_DAYS_TO_CHECK; i++) {
            const offset = batchStart + i;
            if (offset < MAX_DAYS_BACK) {
              daysToCheck.push(addDays(today, -offset));
            }
          }
          const results = await Promise.all(
            daysToCheck.map(date =>
              nasaApiFetch(`EPIC/api/natural/date/${date}`)
                .then(json => ({ date, images: Array.isArray(json) ? json : [] }))
                .catch(() => ({ date, images: [] }))
            )
          );
          const foundResult = results.find(r => r.images.length > 0);
          if (foundResult) {
            setMostRecentWithImages(foundResult.date);
            setSearchParams({ date: foundResult.date }, { replace: true }); // Use replace for auto-search
            found = true;
            break;
          }
          batchStart += RECENT_DAYS_TO_CHECK;
        }
        setSearchingForRecent(false);
      };
      tryBatch();
    } else {
      setMostRecentWithImages(null); // Reset if urlDate is present
    }
  }, [urlDate, today, setSearchParams]);

  // If a date param is present, check if it has images
  useEffect(() => {
    if (urlDate) {
      let cancelled = false;
      const check = async () => {
        try {
          const json = await nasaApiFetch(`EPIC/api/natural/date/${urlDate}`);
          if (!cancelled) {
            if (!Array.isArray(json) || json.length === 0) {
              setNoImagesForDate(urlDate);
              // Find the most recent date with images
              let checkDate = today;
              let tries = 0;
              let found = false;
              while (tries < MAX_DAYS_BACK && !found) {
                try {
                  const json2 = await nasaApiFetch(`EPIC/api/natural/date/${checkDate}`);
                  if (Array.isArray(json2) && json2.length > 0) {
                    setMostRecentWithImages(checkDate);
                    setSearchParams({ date: checkDate }, { replace: true }); // Use replace for auto-search
                    found = true;
                    break;
                  }
                } catch {}
                checkDate = addDays(checkDate, -1);
                tries++;
              }
            } else {
              setNoImagesForDate(null);
            }
          }
        } catch {}
      };
      check();
      return () => { cancelled = true; };
    }
  }, [urlDate, today, setSearchParams]);

  // Only fetch images if we have a valid currentDate and not searching
  const { data, loading, error } = useNasaApi(currentDate ? `${EPIC_API_PATH}${currentDate}` : '', {});
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const lastRequestedDate = useRef<string | null>(currentDate);
  // New: state for aspect ratio
  const [imgAspectRatio, setImgAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    lastRequestedDate.current = currentDate;
    setImgAspectRatio(null); // Reset aspect ratio when date changes
  }, [currentDate]);

  // Build array of image URLs from data
  const imageUrls = data && Array.isArray(data)
    ? data.map(img => {
        const dateParts = img.date.split(' ');
        const [year, month, day] = dateParts[0].split('-');
        return `${EPIC_PICTURE_BASE_URL}${year}/${month}/${day}/png/${img.image}.png`;
      })
    : [];
  const currentImg = data && Array.isArray(data) && data[carouselIdx];

  // New: handler for image load to get aspect ratio
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setImgAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  // New: get orientation
  const [isPortrait, setIsPortrait] = useState(true);
  useEffect(() => {
    const updateOrientation = () => {
      setIsPortrait(window.innerHeight >= window.innerWidth);
    };
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  // UI logic
  let imageAreaContent: React.ReactNode = null;
  if (searchingForRecent || (loading && !data)) {
    imageAreaContent = <div className="text-gray-400 text-center my-8 w-full">loading</div>;
  } else if (error) {
    imageAreaContent = <div className="text-red-500 text-center my-8 w-full">Error: {error.message}</div>;
  } else if (!data || !Array.isArray(data) || data.length === 0) {
    // No images for this date
    if (noImagesForDate && mostRecentWithImages) {
      imageAreaContent = (
        <div className="text-gray-400 text-center my-8 w-full">
          No EPIC images found for this date.<br />
          First available date:{' '}
          <a
            href={`?date=${mostRecentWithImages}`}
            className="text-blue-400 underline"
            onClick={e => {
              e.preventDefault();
              setSearchParams({ date: mostRecentWithImages }); // User click: push to history
              setNoImagesForDate(null);
            }}
          >
            {mostRecentWithImages}
          </a>
        </div>
      );
    } else {
      imageAreaContent = <div className="text-gray-400 text-center my-8 w-full">No EPIC images found for this date.</div>;
    }
  } else {
    // Images exist
    // New: dynamic style for Carousel
    let carouselStyle: React.CSSProperties = {};
    if (imgAspectRatio) {
      if (isPortrait) {
        // Use width, set height based on aspect ratio
        carouselStyle = {
          width: '100%',
          maxWidth: '100%',
          height: `auto`,
          aspectRatio: `${imgAspectRatio}`,
        };
      } else {
        // Use height, set width based on aspect ratio
        carouselStyle = {
          height: '100%',
          maxHeight: '100%',
          width: `auto`,
          aspectRatio: `${imgAspectRatio}`,
        };
      }
    } else {
      // Fallback: fill available space
      carouselStyle = {
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
      };
    }
    imageAreaContent = (
      <div
        className="object-contain  bg-transparent rounded-xl flex items-center justify-center w-full h-full max-w-full max-h-full m-0"
      >
        {/* Custom image loader to get aspect ratio, then pass to Carousel */}
        {currentImg && (
          <img
            src={imageUrls[carouselIdx]}
            alt={currentImg.caption || 'EPIC image'}
            className="object-contain picture-shadow max-w-full max-h-full rounded-xl"
            style={{ display: 'none' }}
            onLoad={handleImageLoad}
          />
        )}
        <Carousel
          imageUrls={imageUrls}
          order={"desc"}
          onIndexChange={setCarouselIdx}
          autoPlay={autoPlay}
          className="picture-shadow"
          style={carouselStyle}
          imageClassName=" object-contain  max-w-full max-h-full rounded-xl"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full min-h-0 flex-1 overflow-hidden relative items-center p-0 pb-1 pl-1 pr-1">
      <div className="w-full max-w-2xl flex flex-row items-center justify-center gap-4 mb-2 mt-2 sm:landscape:gap-1 sm:landscape:mb-1 sm:landscape:mt-1">
        <button
          onClick={() => {
            const newDate = addDays(currentDate || today, -1);
            setSearchParams({ date: newDate }); // User click: push to history
          }}
          disabled={currentDate === null || currentDate === oldestAllowed}
          className="px-2 py-2 bg-gray-700/60 rounded-full disabled:opacity-40 flex items-center justify-center hover:bg-gray-600 transition"
          aria-label="Previous Day"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-lg font-semibold sm:landscape:text-base">{currentDate || 'Loading...'}</span>
        <button
          onClick={() => {
            const newDate = addDays(currentDate || today, 1);
            setSearchParams({ date: newDate }); // User click: push to history
          }}
          disabled={currentDate === null || currentDate === today}
          className="px-2 py-2 bg-gray-700/60 rounded-full disabled:opacity-40 flex items-center justify-center hover:bg-gray-600 transition"
          aria-label="Next Day"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      <div className="flex flex-col landscape:flex-row items-stretch justify-center w-full flex-1 min-h-0 gap-4">
        {/* Image Area */}
        <div className="flex-1 flex items-center justify-center min-h-0 h-full w-full">
          {imageAreaContent}
        </div>
        {/* Metadata Sidebar - like NasaRoversView */}
        <div className="w-full landscape:w-[22ch] landscape:mt-0 flex-shrink-0 bg-gray-900 bg-opacity-90 rounded-xl 
          p-2 landscape:p-3 text-gray-200 shadow-lg overflow-y-auto landscape:h-full mt-1 landscape:mt-0">
          <div className="mb-1">
            {currentImg ? (
              <ul className="text-sm space-y-2">
                <li>
                  <div className="font-semibold text-blue-200 mb-0.5">Image</div>
                  <div className="break-words">{carouselIdx + 1} / {data.length}</div>
                </li>
                <li className="pt-2 border-gray-700 mt-2">
                  <div className="break-words whitespace-pre-line">{currentImg.caption}</div>
                </li>
                <li>
                  <div className="font-semibold text-blue-200 mb-0.5">Date</div>
                  <div className="break-words">{currentImg.date}</div>
                </li>
                <li>
                  <div className="font-semibold text-blue-200 mb-0.5">Image Name</div>
                  <div className="break-words">{currentImg.image}</div>
                </li>
                {currentImg.centroid_coordinates && (
                  <li>
                    <div className="font-semibold text-blue-200 mb-0.5">Centroid Coordinates</div>
                    <div className="break-words">Lat: {currentImg.centroid_coordinates.lat}</div>
                    <div className="break-words">Lon: {currentImg.centroid_coordinates.lon}</div>
                    <a
                      href={`https://www.google.com/maps/`+
                      `@${currentImg.centroid_coordinates.lat},${currentImg.centroid_coordinates.lon},6z`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline mt-1 inline-block"
                    >
                      View on Google Maps
                    </a>
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