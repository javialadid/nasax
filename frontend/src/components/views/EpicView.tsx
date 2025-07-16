import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNasaApi, nasaApiFetch } from '@/hooks/useNasaApi';
import SpinnerOverlay from '@components/SpinnerOverlay';
import Carousel from '@components/Carousel';
import { getEasternDateString, addDays } from '@/utils/dateutil';
import { getMaxDaysBackEpic } from '@/utils/env';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const MAX_DAYS_BACK = getMaxDaysBackEpic()
const EPIC_API_PATH = 'EPIC/api/natural/date/';
const EPIC_PICTURE_BASE_URL = 'https://epic.gsfc.nasa.gov/archive/natural/'
const RECENT_DAYS_TO_CHECK = 3; // Configurable number of days to check in parallel

// Loading, error, and empty state components
const EpicLoading = () => (
  <SpinnerOverlay/>
);
const EpicError = ({ message }: { message: string }) => (
  <div className="text-red-500 text-center my-8 w-full">Error Loading Data</div>
);
const EpicNoImages = ({ mostRecentWithImages, setSearchParams, setNoImagesForDate }: {
  mostRecentWithImages: string | null,
  setSearchParams: any,
  setNoImagesForDate: any,
}) => (
  <div className="text-gray-400 text-center my-8 w-full">
    No EPIC images found for this date.<br />
    {mostRecentWithImages && (
      <>
        First available date:{' '}
        <a
          href={`?date=${mostRecentWithImages}`}
          className="text-blue-400 underline"
          onClick={e => {
            e.preventDefault();
            setSearchParams({ date: mostRecentWithImages });
            setNoImagesForDate(null);
          }}
        >
          {mostRecentWithImages}
        </a>
      </>
    )}
  </div>
);

// ZoomModal reused from ApodView, now with prev/next
const ZoomModal = ({ imageUrl, title, onClose, onPrev, onNext, canPrev, canNext }: {
  imageUrl: string;
  title: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 max-h-screen max-h-[100vh]">
    <button
      className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/80 rounded-full text-white z-50"
      onClick={onClose}
      title="Close"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
    <button
      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/80 rounded-full text-white z-50 text-3xl disabled:opacity-40"
      onClick={onPrev}
      disabled={!canPrev}
      aria-label="Previous image"
    >
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>
    <button
      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/80 rounded-full text-white z-50 text-3xl disabled:opacity-40"
      onClick={onNext}
      disabled={!canNext}
      aria-label="Next image"
    >
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
    <div className="w-full h-full flex items-center justify-center p-4 max-h-screen max-h-[100vh]">
      <TransformWrapper>
        <TransformComponent>
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-full object-contain rounded-lg"
            draggable={false}
            style={{ maxHeight: '100vh' }}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  </div>
);

const EpicView: React.FC = () => {
  const today = getEasternDateString();
  const [searchParams, setSearchParams] = useSearchParams();
  const oldestAllowed = addDays(today, -MAX_DAYS_BACK);
  const urlDate = searchParams.get('date');
  const [searchingForRecent, setSearchingForRecent] = useState(false);
  const [mostRecentWithImages, setMostRecentWithImages] = useState<string | null>(null);
  const [noImagesForDate, setNoImagesForDate] = useState<string | null>(null);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const isUserNavigating = useRef(false); // NEW

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
          console.log('[EpicView] useEffect check images for urlDate', { urlDate, json });
          if (!cancelled) {
            if (!Array.isArray(json) || json.length === 0) {
              setNoImagesForDate(urlDate);
              // Only auto-redirect if this is the first load (not user navigation)
              if (!isUserNavigating.current && !mostRecentWithImages) {
                let checkDate = today;
                let tries = 0;
                let found = false;
                while (tries < MAX_DAYS_BACK && !found) {
                  try {
                    const json2 = await nasaApiFetch(`EPIC/api/natural/date/${checkDate}`);
                    console.log('[EpicView] Searching for most recent with images', { checkDate, json2 });
                    if (Array.isArray(json2) && json2.length > 0) {
                      setMostRecentWithImages(checkDate);
                      setSearchParams({ date: checkDate }, { replace: true });
                      found = true;
                      break;
                    }
                  } catch (err) {
                    console.log('[EpicView] Error searching for most recent with images', { checkDate, err });
                  }
                  checkDate = addDays(checkDate, -1);
                  tries++;
                }
              }
            } else {
              setNoImagesForDate(null);
            }
          }
        } catch (err) {
          console.log('[EpicView] Error fetching images for urlDate', { urlDate, err });
        } finally {
          isUserNavigating.current = false; // Reset after check
        }
      };
      check();
      return () => { cancelled = true; };
    }
  }, [urlDate, today, setSearchParams, mostRecentWithImages]);

  // Only fetch images if we have a valid currentDate and not searching
  const { data, loading, error } = useNasaApi(currentDate ? `${EPIC_API_PATH}${currentDate}` : '', {});
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const lastRequestedDate = useRef<string | null>(currentDate);

  useEffect(() => {
    lastRequestedDate.current = currentDate;
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

  // Early return: loading
  if (searchingForRecent || (loading && !data)) {
    return (
      <div className="relative p-4 h-[calc(100vh-4rem)] flex items-center justify-center">
        <EpicLoading />
      </div>
    );
  }

  // Early return: error
  if (error) {
    return (
      <div className="p-4 h-[calc(100vh-4rem)] flex items-center justify-center">
        <EpicError message={error.message} />
      </div>
    );
  }

  // Early return: no images
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="p-4 h-[calc(100vh-4rem)] flex min-h-0 min-w-0 portrait:flex-col portrait:items-stretch landscape:items-start">
        {/* Image Section: show No Images message */}
        <div
          className="portrait:w-full portrait:mb-4 portrait:max-h-[60vh] portrait:min-h-[60vh] portrait:flex-shrink-0           landscape:flex-shrink-0 landscape:max-w-[70vw] landscape:h-full landscape:mr-4  landscape:aspect-[4/3] "
        >
          <div className="w-full h-full flex items-center justify-center flex-shrink-0">
            <EpicNoImages
              mostRecentWithImages={noImagesForDate && mostRecentWithImages ? mostRecentWithImages : null}
              setSearchParams={setSearchParams}
              setNoImagesForDate={setNoImagesForDate}
            />
          </div>
        </div>
        {/* Metadata Section: always show navigation and metadata, but with no image info */}
        <div
          className="rounded-lg shadow-md bg-gray-900/80 p-0  portrait:w-full portrait:min-h-[25vh] portrait:max-h-[50vh] portrait:flex-grow landscape:flex-grow landscape:min-w-[35vh] landscape:max-h-[75vh] landscape:text-sm  landscape:md:text-base flex flex-col min-h-0 min-w-0 text-sm smphone:text-base md:text-lg sm:p-0 md:p-2"
          style={{ verticalAlign: 'top', minWidth: 0, minHeight: 0 }}
        >
          {/* Navigation Buttons and Title Row */}
          <div className="flex flex-row items-center justify-center w-full min-w-0 mb-2 gap-2">
            <button
              onClick={() => {
                const newDate = clampDate(addDays(currentDate || today, -1));
                console.log('[EpicView] Prev button clicked:', { currentDate, newDate, oldestAllowed, today });
                isUserNavigating.current = true;
                setSearchParams({ date: newDate });
              }}
              disabled={currentDate === null || currentDate === oldestAllowed}
              className="px-2 py-2 bg-gray-700/60 rounded-full disabled:opacity-40 flex items-center justify-center hover:bg-gray-600 transition"
              aria-label="Previous Day"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="font-bold text-blue-200 text-center mx-1 whitespace-normal text-base min-w-0 select-all" style={{lineHeight: '1.2'}}>{currentDate || 'Loading...'}</span>
            <button
              onClick={() => {
                const newDate = clampDate(addDays(currentDate || today, 1));
                console.log('[EpicView] Next button clicked:', { currentDate, newDate, oldestAllowed, today });
                isUserNavigating.current = true;
                setSearchParams({ date: newDate });
              }}
              disabled={currentDate === null || currentDate === today}
              className="px-2 py-2 bg-gray-700/60 rounded-full disabled:opacity-40 flex items-center justify-center hover:bg-gray-600 transition"
              aria-label="Next Day"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
          <div className="text-gray-400 flex-1 flex items-center justify-center">No image selected.</div>
        </div>
      </div>
    );
  }

  // Happy path: images exist
  return (
    <div className="p-4 h-[calc(100vh-4rem)] flex min-h-0 min-w-0
      portrait:flex-col portrait:items-stretch 
      landscape:items-start">
      {/* Image Section */}
      <div
        className="
          portrait:w-full portrait:mb-4 portrait:max-h-[60vh] portrait:min-h-[60vh] portrait:flex-shrink-0           
          landscape:flex-shrink-0 landscape:max-w-[70vw] landscape:h-full landscape:mr-4 
          landscape:aspect-[4/3] 
        "
        
      >
        <div className="w-full h-full flex items-center justify-center  flex-shrink-0">
          <Carousel
            showThumbnails={true}
            imageUrls={imageUrls}
            order={"desc"}
            onIndexChange={setCarouselIdx}
            currentIndex={carouselIdx}
            autoPlay={autoPlay}
            cropLeft={0.09}
            cropRight={0.09}
            cropTop={0.09}
            cropBottom={0.09}
            imageFit="contain"
            className="picture-shadow "
            imageClassName="picture-shadow w-full h-full object-contain rounded-lg mx-auto 
              group-hover:opacity-90 transition-opacity self-start max-h-full max-w-full"
            onImageClick={() => setShowZoomModal(true)}
            showArrows={!showZoomModal}
          />
        </div>
      </div>

      {/* Metadata Section */}
      <div
        className="
          rounded-lg shadow-md bg-gray-900/80 p-0 
          portrait:w-full portrait:min-h-[25vh] portrait:max-h-[50vh] portrait:flex-grow
          landscape:flex-grow landscape:min-w-[35vh] landscape:max-h-[75vh] landscape:text-sm 
          landscape:md:text-base
          flex flex-col min-h-0 min-w-0
          text-sm smphone:text-base md:text-lg sm:p-0 md:p-2
        "
        style={{ verticalAlign: 'top', minWidth: 0, minHeight: 0 }}
      >
        {/* Navigation Buttons and Title Row */}
        <div className="flex flex-row items-center justify-center w-full min-w-0 mb-2 gap-2">
          <button
            onClick={() => {
              const newDate = clampDate(addDays(currentDate || today, -1));
              console.log('[EpicView] Prev button clicked:', { currentDate, newDate, oldestAllowed, today });
              isUserNavigating.current = true; // NEW
              setSearchParams({ date: newDate });
            }}
            disabled={currentDate === null || currentDate === oldestAllowed}
            className="px-2 py-2 bg-gray-700/60 rounded-full disabled:opacity-40 flex items-center justify-center hover:bg-gray-600 transition"
            aria-label="Previous Day"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="font-bold text-blue-200 text-center mx-1 whitespace-normal text-base min-w-0 select-all" style={{lineHeight: '1.2'}}>{currentDate || 'Loading...'}</span>
          <button
            onClick={() => {
              const newDate = clampDate(addDays(currentDate || today, 1));
              console.log('[EpicView] Next button clicked:', { currentDate, newDate, oldestAllowed, today });
              isUserNavigating.current = true; // NEW
              setSearchParams({ date: newDate });
            }}
            disabled={currentDate === null || currentDate === today}
            className="px-2 py-2 bg-gray-700/60 rounded-full disabled:opacity-40 flex items-center justify-center hover:bg-gray-600 transition"
            aria-label="Next Day"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        
        <div className="text-gray-200 leading-relaxed overflow-y-auto  flex-1 ">
          {currentImg ? (
            <ul className="text-sm space-y-2">
              <li>
                <div className="font-semibold text-blue-200 mb-0.5">Image</div>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="whitespace-nowrap">{carouselIdx + 1} / {data.length}</span>
                  <span className="inline-flex items-center text-[10px] text-gray-400 ml-1 select-none whitespace-nowrap">
                    <svg className="w-3 h-3 mr-0.5 text-blue-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" /></svg>
                    Click image to zoom
                  </span>
                </div>
              </li>
              <li>
                <div className="font-semibold text-blue-200 mb-0.5">Date</div>
                <div className="break-words">{currentImg.date}</div>
              </li>
              <li className="pt-2 border-gray-700 mt-2">
                <div className="break-words whitespace-pre-line">{currentImg.caption}</div>
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
                    href={`https://www.google.com/maps/@${currentImg.centroid_coordinates.lat},${currentImg.centroid_coordinates.lon},6z`}
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
      {showZoomModal && currentImg && (
        <ZoomModal
          imageUrl={imageUrls[carouselIdx]}
          title={currentImg.caption || currentImg.image}
          onClose={() => setShowZoomModal(false)}
          onPrev={() => setCarouselIdx(idx => Math.max(0, idx - 1))}
          onNext={() => setCarouselIdx(idx => Math.min(imageUrls.length - 1, idx + 1))}
          canPrev={carouselIdx > 0}
          canNext={carouselIdx < imageUrls.length - 1}
        />
      )}
    </div>
  );
};

export default EpicView;