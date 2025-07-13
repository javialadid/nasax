import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNasaApi } from '../../hooks/useNasaApi';
import SpinnerOverlay from '../SpinnerOverlay';
import Carousel from '../Carousel';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const ROVERS = ['perseverance', 'curiosity', 'opportunity', 'spirit'];

const NasaRoversView: React.FC = () => {
  const [selectedRover, setSelectedRover] = useState(0);
  const rover = ROVERS[selectedRover];
  const { data, loading, error } = useNasaApi(`mars-photos/api/v1/rovers/${rover}/latest_photos`);

  // Group images by sol
  const solGroups = useMemo(() => {
    if (!data || !data.latest_photos) return [];
    const groups: Record<string, any[]> = {};
    data.latest_photos.forEach((img: any) => {
      if (!groups[img.sol]) groups[img.sol] = [];
      groups[img.sol].push(img);
    });
    // Sort sols descending (most recent first)
    const sortedSols = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
    return sortedSols.map(sol => ({ sol, images: groups[sol] }));
  }, [data]);

  // Only show the most recent 5 sols
  const solTabs = solGroups.slice(0, 5);
  const [selectedSolIdx, setSelectedSolIdx] = useState(0);

  const currentSol = solTabs[selectedSolIdx]?.sol;

  // Track current image index for each (rover, sol) tab
  const [imageIndices, setImageIndices] = useState<{ [key: string]: number }>({});

  // Compute a unique key for the current tab
  const currentTabKey = `${rover}-${currentSol}`;
  const currentImageIdx = imageIndices[currentTabKey] || 0;

  // Handler to update the image index for the current tab
  const handleIndexChange = (idx: number) => {
    setImageIndices(prev => ({
      ...prev,
      [currentTabKey]: idx,
    }));
  };

  // Reset sol tab and image index when rover or sol changes
  React.useEffect(() => {
    setSelectedSolIdx(0);
  }, [selectedRover, solGroups.length]);

  const currentImages = solTabs[selectedSolIdx]?.images || [];
  const currentImage = currentImages[currentImageIdx] || null;

  const [showFullscreen, setShowFullscreen] = useState(false);
  const transformRef = useRef<any>(null);

  // ESC and arrow keys for fullscreen modal
  useEffect(() => {
    if (!showFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFullscreen(false);
      if (e.key === 'ArrowLeft' && currentImageIdx > 0) handleIndexChange(currentImageIdx - 1);
      if (e.key === 'ArrowRight' && currentImageIdx < currentImages.length - 1) handleIndexChange(currentImageIdx + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showFullscreen, currentImageIdx, currentImages.length, handleIndexChange]);

  // Reset zoom/pan when image changes in fullscreen
  useEffect(() => {
    if (showFullscreen && transformRef.current && typeof transformRef.current.resetTransform === 'function') {
      transformRef.current.resetTransform();
    }
  }, [currentImageIdx, showFullscreen]);

  return (
    <div className="flex flex-col min-h-0 h-full w-full flex-1 overflow-hidden">
      {/* Header with tabs - compact and fixed */}
      <div className="flex-shrink-0 px-2 py-1">
        {/* Rover Tabs */}
        <div className="flex flex-row gap-2 mb-1 overflow-x-auto whitespace-nowrap -mx-2 px-2 justify-start lg:mx-0 lg:px-0 lg:justify-center lg:overflow-x-visible lg:whitespace-normal lg:w-full">
          {ROVERS.map((r, idx) => (
            <button
              key={r}
              className={`sm:px-3 px-2 py-1 rounded-t-lg font-semibold border-b-2 text-sm transition-colors duration-200 ${selectedRover === idx ? 'bg-blue-900 text-white border-blue-400' : 'bg-gray-800 text-gray-300 border-transparent hover:bg-blue-800'}`}
              onClick={() => setSelectedRover(idx)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        {/* Sol Tabs */}
        {solTabs.length > 1 && (
          <div className="flex flex-row gap-2 mb-0">
            {solTabs.map((group, idx) => (
              <button
                key={group.sol}
                className={`px-2 py-1 rounded font-semibold border-b-2 transition-colors duration-200 ${selectedSolIdx === idx ? 'bg-blue-700 text-white border-blue-300' : 'bg-gray-700 text-gray-200 border-transparent hover:bg-blue-600'}`}
                onClick={() => setSelectedSolIdx(idx)}
              >
                Sol {group.sol}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content - responsive and gap-free */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row w-full overflow-hidden">
        {/* Image + Info Group */}
        <div className="flex flex-col lg:flex-row w-full h-full min-h-0 flex-1">
          {/* Image Area */}
          <div className="flex-1 flex flex-col items-center justify-start min-h-0 overflow-hidden">
          <div className="w-full flex-1 flex items-center justify-center overflow-hidden lg:aspect-[4/3]" style={{ aspectRatio: '1 / 1' }}>

              {loading && <SpinnerOverlay />}
              {error && <div className="text-red-500 text-center">Error: {error.message}</div>}
              {!loading && !error && currentImages.length === 0 && (
                <div className="text-gray-400 text-center">No images found for {rover}.</div>
              )}
              {!loading && !error && currentImages.length > 0 && (
                !showFullscreen && (
                  <Carousel
                    imageUrls={currentImages.map((img: any) => img.img_src)}
                    altTexts={currentImages.map((img: any) => img.earth_date || rover)}
                    order="desc"
                    showArrows
                    showIndicators
                    showPlayPause
                    className="w-full h-full"
                    style={{ height: '100%' }}
                    imageClassName="object-contain w-full h-full max-w-full max-h-full rounded-xl shadow-lg"
                    onIndexChange={handleIndexChange}
                    onImageClick={() => setShowFullscreen(true)}
                    currentIndex={currentImageIdx}
                  />
                )
              )}
            </div>
            {/* Fullscreen Modal */}
            {showFullscreen && currentImage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 animate-fade-in">
                {/* Close button */}
                <button
                  className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/80 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-blue-400 opacity-60 hover:opacity-100 transition-opacity z-50"
                  onClick={() => setShowFullscreen(false)}
                  title="Close"
                  aria-label="Close fullscreen"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {/* Prev button */}
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/80 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-blue-400 opacity-70 hover:opacity-100 transition-opacity z-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => handleIndexChange(Math.max(0, currentImageIdx - 1))}
                  disabled={currentImageIdx === 0}
                  aria-label="Previous image"
                  tabIndex={0}
                >
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
                {/* Next button */}
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/80 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-blue-400 opacity-70 hover:opacity-100 transition-opacity z-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => handleIndexChange(Math.min(currentImages.length - 1, currentImageIdx + 1))}
                  disabled={currentImageIdx === currentImages.length - 1}
                  aria-label="Next image"
                  tabIndex={0}
                >
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
                <div className="w-full h-full flex items-center justify-center">
                  <TransformWrapper ref={transformRef}>
                    <TransformComponent>
                      <img
                        src={currentImage.img_src}
                        alt={currentImage.camera?.full_name || 'Mars Rover Image'}
                        className="object-contain max-w-full max-h-full rounded-xl shadow-2xl border-2 border-gray-700"
                        style={{ background: 'transparent', border: 'none', padding: 0 }}
                        draggable={false}
                      />
                    </TransformComponent>
                  </TransformWrapper>
                </div>
              </div>
            )}
          </div>
          {/* Metadata Sidebar - responsive */}
          <div className="w-full lg:w-[22ch] lg:mt-0 lg:ml-4 flex-shrink-0 bg-gray-900 bg-opacity-90 rounded-xl p-2 lg:p-3 text-gray-200 shadow-lg overflow-y-auto lg:h-full">
            <div className="mb-1">
              <div className="font-semibold text-base lg:text-lg mb-2 border-b border-gray-700 pb-1 flex items-center gap-2">
                <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 text-blue-300' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.75 17L6 21h12l-3.75-4M12 3v14' /></svg>
                {currentImage
                  ? (currentImage.rover?.name || rover.charAt(0).toUpperCase() + rover.slice(1))
                  : (rover.charAt(0).toUpperCase() + rover.slice(1))}
              </div>
              {currentImage ? (
                <ul className="text-sm space-y-2"> 
                  <li className="pt-2 mt-2">
                    <div className="font-semibold text-blue-200 mb-0.5">Image</div>
                    <div className="break-words">{currentImageIdx + 1} / {currentImages.length}</div>
                  </li>                 
                  <li>
                    <div className="font-semibold text-blue-200 mb-0.5">Status</div>
                    <div className="break-words">{currentImage.rover?.status}</div>
                  </li>
                  <li>
                    <div className="font-semibold text-blue-200 mb-0.5">Sol</div>
                    <div className="break-words">{currentImage.sol}</div>
                  </li>
                  <li>
                    <div className="font-semibold text-blue-200 mb-0.5">Earth Date</div>
                    <div className="break-words">{currentImage.earth_date}</div>
                  </li>
                  <li>
                    <div className="font-semibold text-blue-200 mb-0.5">Camera</div>
                    <div className="break-words">{currentImage.camera?.full_name || currentImage.camera?.name}</div>
                  </li>
                  {currentImage.camera?.name && (
                    <li>
                      <div className="font-semibold text-blue-200 mb-0.5">Camera Code</div>
                      <div className="break-words">{currentImage.camera.name}</div>
                    </li>
                  )}
                  <li>
                    <div className="font-semibold text-blue-200 mb-0.5">Image ID</div>
                    <div className="break-words">{currentImage.id}</div>
                  </li>
                  
                </ul>
              ) : (
                <div className="text-gray-400">No image selected.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NasaRoversView;