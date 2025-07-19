import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getEasternDateString, addDays, clampDateToRange } from '@/utils/dateutil';
import { getMaxDaysBackEpic } from '@/utils/env';
import { useNasaCardData } from '@/NasaCardDataContext';
import SpinnerOverlay from '@components/SpinnerOverlay';
import ZoomModal from '@components/ZoomModal';
import EpicImageSection from './EpicImageSection';
import EpicMetadataSection from './EpicMetadataSection';
import { useApiWithBackoff, nasaApiFetch } from '@/hooks/useNasaApi';

const MAX_DAYS_BACK = getMaxDaysBackEpic();

const EpicView: React.FC = () => {
  const today = getEasternDateString();
  const [searchParams, setSearchParams] = useSearchParams();
  const oldestAllowed = addDays(today, -MAX_DAYS_BACK);
  const urlDate = searchParams.get('date');
  const { epicByDate, setEpicDataForDate, setEpicEmptyForDate } = useNasaCardData();

  // Initialize currentDate from URL or default to today
  const [currentDate, setCurrentDate] = useState(() => {
    const initialDate = urlDate ? clampDateToRange(urlDate, oldestAllowed, today) : today;
    return initialDate;
  });
  const [notifiedOfBacktrack, setNotifiedOfBacktrack] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [showZoomModal, setShowZoomModal] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Get EPIC entry for the current date from context
  const epicEntry = epicByDate[currentDate];
  const data = epicEntry && !epicEntry.empty ? epicEntry.data : null;
  const empty = epicEntry && epicEntry.empty;

  // Fetcher that tries currentDate, then previous days up to MAX_DAYS_BACK
  const fetchEpicWithBacktrack = async () => {
    let date = currentDate;
    for (let i = 0; i <= MAX_DAYS_BACK; i++) {
      try {
        const json = await nasaApiFetch(`EPIC/api/natural/date/${date}`);
        if (Array.isArray(json) && json.length > 0) {
          return { data: json, date };
        }
      } catch (e) {
        if (i === MAX_DAYS_BACK) throw e;
      }
      date = addDays(date, -1);
    }
    throw new Error('No EPIC images found for recent days');
  };

  const { data: fetched, loading, error } = useApiWithBackoff(fetchEpicWithBacktrack, [currentDate], { delay: 1000, maxAttempts: 1, enabled: !epicEntry });

  // Update context and URL when data or error changes
  useEffect(() => {
    if (!epicEntry && fetched) {
      setEpicDataForDate(fetched.date, fetched.data);
  
      const clampedUrlDate = urlDate ? clampDateToRange(urlDate, oldestAllowed, today) : today;
      const isBacktracked = urlDate && fetched.date !== clampedUrlDate;
  
      if (isBacktracked && !notifiedOfBacktrack) {
        setNotification(`No images found for ${clampedUrlDate}. Showing images from ${fetched.date} instead.`);
        setNotifiedOfBacktrack(true);
      }
  
      if (fetched.date !== currentDate) {
        setCurrentDate(fetched.date);
        setSearchParams({ date: fetched.date }, { replace: true });
      }
    } else if (!epicEntry && error && error.message === 'No EPIC images found for recent days') {
      setEpicEmptyForDate(currentDate);
    }
  }, [
    fetched,
    error,
    epicEntry,
    setEpicDataForDate,
    setEpicEmptyForDate,
    currentDate,
    setSearchParams,
    urlDate,
    notifiedOfBacktrack,
    oldestAllowed,
    today
  ]);
  
  // Synchronize currentDate with urlDate changes
  useEffect(() => {
    const clampedUrlDate = urlDate ? clampDateToRange(urlDate, oldestAllowed, today) : today;
    if (clampedUrlDate !== currentDate) {
      setCurrentDate(clampedUrlDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDate, oldestAllowed, today]);

  // Reset carousel index when currentDate changes
  useEffect(() => {
    setCarouselIdx(0);
  }, [currentDate]);

  // Helper to clamp date
  const clampDate = (date: string) =>
    date < oldestAllowed ? oldestAllowed : date > today ? today : date;

  // Build array of image URLs from context data
  const imageUrls = data && Array.isArray(data)
    ? data.map(img => {
        const dateParts = img.date.split(' ');
        const [year, month, day] = dateParts[0].split('-');
        return `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${img.image}.png`;
      })
    : [];
  const currentImg = data && Array.isArray(data) && data[carouselIdx];

  // Early return: loading
  if (loading || (!epicEntry && !error)) {
    return (
      <div className="relative p-4 h-[calc(100vh-4rem)] flex items-center justify-center">
        <SpinnerOverlay />
      </div>
    );
  }

  // Early return: error or no images
  if (empty || (error && error.message === 'No EPIC images found for recent days') || !data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="p-4 h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-gray-400 text-center my-8 w-full">
          No EPIC images found for the last {MAX_DAYS_BACK} days.
        </div>
      </div>
    );
  }

  // Happy path: images exist
  return (
    <>
      {notification && (
        <div className="fixed top-0 left-0 w-full z-50 flex justify-center">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-b shadow-lg flex items-center mt-0">
            <span>{notification}</span>
            <button
              className="ml-4 text-white hover:text-gray-200 focus:outline-none"
              onClick={() => setNotification(null)}
              aria-label="Close notification"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    <div className="p-4 h-[calc(100vh-4rem)] flex min-h-0 min-w-0 portrait:flex-col portrait:items-stretch landscape:items-start">
      {/* Image Section */}
      <div
        className="portrait:w-full portrait:mb-4 portrait:max-h-[60vh] portrait:min-h-[60vh] portrait:flex-shrink-0           landscape:flex-shrink-0 landscape:max-w-[70vw] landscape:h-full landscape:mr-4 landscape:aspect-[4/3] "
      >
        <EpicImageSection
          imageUrls={imageUrls}
          carouselIdx={carouselIdx}
          setCarouselIdx={setCarouselIdx}
          autoPlay={autoPlay}
          setAutoPlay={setAutoPlay}
          showZoomModal={showZoomModal}
          setShowZoomModal={setShowZoomModal}
          currentImg={currentImg}
        />
      </div>
      {/* Metadata Section */}
      <EpicMetadataSection
        currentDate={currentDate}
        today={today}
        oldestAllowed={oldestAllowed}
        clampDate={clampDate}
        addDays={addDays}
        setSearchParams={setSearchParams}
        data={data}
        carouselIdx={carouselIdx}
        currentImg={currentImg}
      />
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
    </>
  );
};

export default EpicView;