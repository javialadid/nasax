import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getEasternDateString } from '@/utils/dateutil';
import { getMaxDaysBackEpic } from '@/utils/env';
import { useNasaCardData } from '@/context/NasaCardDataContext';
import SpinnerOverlay from '@components/SpinnerOverlay';
import ZoomModal from '@components/ZoomModal';
import EpicImageSection from './EpicImageSection';
import EpicMetadataSection from './EpicMetadataSection';
import { useApiWithBackoff, nasaApiFetch,  } from '@/hooks/useNasaApi';


const EpicView: React.FC = () => {
  const today = getEasternDateString();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDate = searchParams.get('date');
  const { epicByDate, setEpicDataForDate, setEpicEmptyForDate, availableEpicDates, setAvailableEpicDates } = useNasaCardData();

  const maxDaysBack = getMaxDaysBackEpic();

  // Fetch available dates if not present
  const shouldFetchAvailable = availableEpicDates.length === 0;
  const {
    data: fetchedAvailableDates,
    loading: loadingAvailableDates,
    error: errorAvailableDates,    
  } = useApiWithBackoff(
    () => nasaApiFetch('EPIC/api/natural/available'),
    [shouldFetchAvailable],
    { enabled: shouldFetchAvailable }
  );

  useEffect(() => {
    if (shouldFetchAvailable && Array.isArray(fetchedAvailableDates) && fetchedAvailableDates.length > 0) {
      setAvailableEpicDates(fetchedAvailableDates);
    }
  }, [shouldFetchAvailable, fetchedAvailableDates, setAvailableEpicDates]);

  // Sort available dates descending (latest first)
  const sortedAvailableDates = [...availableEpicDates].sort((a, b) => b.localeCompare(a));
  const latestAvailable = sortedAvailableDates[0] || today;

  // Initialize currentDate from URL or default to latest available
  const [currentDate, setCurrentDate] = useState(() => {
    const initial = urlDate && availableEpicDates.includes(urlDate)
      ? urlDate
      : latestAvailable;
    return initial;
  });

  // Sync currentDate with urlDate and availableEpicDates
  useEffect(() => {
    if (urlDate && availableEpicDates.includes(urlDate)) {
      setCurrentDate(urlDate);
    } else if (availableEpicDates.length > 0 && !availableEpicDates.includes(currentDate)) {
      setCurrentDate(latestAvailable);
      setSearchParams({ date: latestAvailable }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDate, availableEpicDates]);

  // Get EPIC entry for the current date from context
  const epicEntry = epicByDate[currentDate];
  const data = epicEntry && !epicEntry.empty ? epicEntry.data : null;
  const empty = epicEntry && epicEntry.empty;

  // Fetch images for the current date if not already in context
  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      if (!epicEntry && availableEpicDates.includes(currentDate)) {
        try {
          const json = await nasaApiFetch(`EPIC/api/natural/date/${currentDate}`);
          if (!ignore && Array.isArray(json) && json.length > 0) {
            setEpicDataForDate(currentDate, json);
          } else if (!ignore) {
            setEpicEmptyForDate(currentDate);
          }
        } catch (e) {
          if (!ignore) setEpicEmptyForDate(currentDate);
        }
      }
    };
    fetchData();
    return () => { ignore = true; };
  }, [currentDate, epicEntry, setEpicDataForDate, setEpicEmptyForDate, availableEpicDates]);

  // State for zoom modal and carousel
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Reset carousel index when currentDate changes
  useEffect(() => {
    setCarouselIdx(0);
  }, [currentDate]);

  // Helper to get prev/next available date
  const getPrevDate = () => {
    const idx = sortedAvailableDates.indexOf(currentDate);
    return idx < sortedAvailableDates.length - 1 ? sortedAvailableDates[idx + 1] : null;
  };
  const getNextDate = () => {
    const idx = sortedAvailableDates.indexOf(currentDate);
    return idx > 0 ? sortedAvailableDates[idx - 1] : null;
  };

  const handlePrev = () => {
    const prev = getPrevDate();
    if (prev) setSearchParams({ date: prev });
  };
  const handleNext = () => {
    const next = getNextDate();
    if (next) setSearchParams({ date: next });
  };

  // Helper to find the oldest allowed date within the allowed range
  function getOldestAllowedDate(availableEpicDates: string[], todayDate: string, maxDaysBack: number): string | undefined {
    const todayObj = new Date(todayDate);
    const sortedDates = [...availableEpicDates].sort((a, b) => a.localeCompare(b)); // oldest to newest
    for (const d of sortedDates) {
      const dObj = new Date(d);
      const diff = Math.floor((todayObj.getTime() - dObj.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= maxDaysBack) {
        return d;
      }
    }
    return undefined;
  }
  // Memoized out-of-bounds check and minAllowedDate
  const { outOfBounds, minAllowedDate } = useMemo(() => {
    if (!currentDate) return { outOfBounds: false, minAllowedDate: undefined };
    if (availableEpicDates.length === 0) return { outOfBounds: false, minAllowedDate: undefined };
    const todayDate = latestAvailable;
    const minAllowedDate = getOldestAllowedDate(availableEpicDates, todayDate, maxDaysBack);
    const minAllowedObj = minAllowedDate ? new Date(minAllowedDate) : undefined;
    const currentObj = new Date(currentDate);
    const outOfBounds = !minAllowedDate || currentObj < minAllowedObj!;
    if (!minAllowedDate) return { outOfBounds: false, minAllowedDate: undefined };
    return { outOfBounds, minAllowedDate };
  }, [currentDate, availableEpicDates, maxDaysBack, latestAvailable]);

  // Build array of image URLs from context data
  const imageUrls = data && Array.isArray(data)
    ? data.map(img => {
        const dateParts = img.date.split(' ');
        const [year, month, day] = dateParts[0].split('-');
        return `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${img.image}.png`;
      })
    : [];
  const currentImg = data && Array.isArray(data) && data[carouselIdx];

  // Compute allowedDates for navigation (dates within allowed range)
  const allowedDates = useMemo(() => {
    const todayObj = new Date(latestAvailable);
    return availableEpicDates.filter(d => {
      const dObj = new Date(d);
      const diff = Math.floor((todayObj.getTime() - dObj.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= maxDaysBack;
    }).sort((a, b) => a.localeCompare(b)); // oldest to newest
  }, [availableEpicDates, latestAvailable, maxDaysBack]);

  // Mock data for loading placeholders
  const mockEpicImage = {
    image: '',
    caption: '',
    date: '',    
  };
  const mockEpicData = [mockEpicImage, mockEpicImage];

  // Loading state
  const isLoading = availableEpicDates.length === 0 || loadingAvailableDates || (!epicEntry && !empty);

  // Early return: error loading available dates
  if (errorAvailableDates && availableEpicDates.length === 0) {
    return (
      <div className="relative p-4 h-[calc(100vh-4rem)] flex min-h-0 min-w-0 portrait:flex-col portrait:items-stretch landscape:items-start">
        <div className="text-red-400 text-center my-8 w-full">
          Failed to load available EPIC dates.<br />
          <span className="text-gray-400 text-sm">{errorAvailableDates.message || String(errorAvailableDates)}</span>
        </div>
        {/* Spinner Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <SpinnerOverlay />
        </div>
      </div>
    );
  }

  // Early return: out of bounds
  if (outOfBounds) {
    return (
      <div className="relative p-4 h-[calc(100vh-4rem)] flex min-h-0 min-w-0 portrait:flex-col portrait:items-stretch landscape:items-start">
        <div className="text-gray-400 text-center my-8 w-full">
          The date you requested is too old and not available.<br />
          <br />
          <span className="text-blue-300">You can view the oldest available date within the allowed range:</span>
          <br />
          {minAllowedDate ? (
            <a
              href="#"
              className="text-blue-400 underline mt-2 inline-block text-lg"
              onClick={e => {
                e.preventDefault();
                setSearchParams({ date: minAllowedDate });
              }}
            >
              {minAllowedDate}
            </a>
          ) : (
            <span className="text-red-400">No available date in range.</span>
          )}
        </div>
        {/* Spinner Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <SpinnerOverlay />
        </div>
      </div>
    );
  }

  // Use mock data if loading, otherwise real data
  const displayData = isLoading ? mockEpicData : data;
  const displayImageUrls = displayData && Array.isArray(displayData)
    ? displayData.map(img => {
        if (!img.date) return '';
        const dateParts = img.date.split(' ');
        const [year, month, day] = dateParts[0].split('-');
        return img.image ? `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${img.image}.png` : '';
      })
    : [];
  const displayCurrentImg = displayData && Array.isArray(displayData) && displayData[carouselIdx];

  // Always render main layout, only show 'no data' message after loading is complete
  return (
    <div className="relative p-4 h-[calc(100vh-4rem)] flex min-h-0 min-w-0 portrait:flex-col portrait:items-stretch landscape:items-start">
      {/* Image Section */}
      <div
        className="portrait:w-full portrait:mb-4 portrait:max-h-[60vh] portrait:min-h-[60vh] portrait:flex-shrink-0           landscape:flex-shrink-0 landscape:max-w-[70vw] landscape:h-full landscape:mr-4 landscape:aspect-[4/3] "
      >
        <EpicImageSection
          imageUrls={displayImageUrls}
          carouselIdx={carouselIdx}
          setCarouselIdx={setCarouselIdx}
          autoPlay={autoPlay}
          setAutoPlay={setAutoPlay}
          showZoomModal={showZoomModal}
          setShowZoomModal={setShowZoomModal}
          currentImg={displayCurrentImg}
        />
      </div>
      {/* Metadata Section */}
      <EpicMetadataSection
        currentDate={currentDate}
        setSearchParams={setSearchParams}
        data={displayData}
        carouselIdx={carouselIdx}
        currentImg={displayCurrentImg}
        allowedDates={allowedDates}
      />
      {showZoomModal && displayCurrentImg && (
        <ZoomModal
          imageUrl={displayImageUrls[carouselIdx]}
          title={displayCurrentImg.caption || displayCurrentImg.image}
          onClose={() => setShowZoomModal(false)}
          onPrev={() => setCarouselIdx(idx => Math.max(0, idx - 1))}
          onNext={() => setCarouselIdx(idx => Math.min(displayImageUrls.length - 1, idx + 1))}
          canPrev={carouselIdx > 0}
          canNext={carouselIdx < displayImageUrls.length - 1}
        />
      )}
      {/* Show spinner overlay if loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <SpinnerOverlay />
        </div>
      )}
      {/* Show 'no data' message only after loading is complete and no data */}
      {!isLoading && (empty || !data || !Array.isArray(data) || data.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-center my-8 w-full bg-white/80 dark:bg-black/80 p-4 rounded">
            No EPIC images found for this date.
          </div>
        </div>
      )}
      {/* Show 'date not available' message only after loading is complete and date is not in availableEpicDates */}
      {!isLoading && availableEpicDates && !availableEpicDates.includes(currentDate) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-center my-8 w-full bg-white/80 dark:bg-black/80 p-4 rounded">
            No EPIC images available for this date.
          </div>
        </div>
      )}
    </div>
  );
};

export default EpicView;