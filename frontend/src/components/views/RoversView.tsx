import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNasaApi } from '@/hooks/useNasaApi';
import SpinnerOverlay from '@components/SpinnerOverlay';
import Carousel from '@components/Carousel';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const ROVERS = ['perseverance', 'curiosity', 'opportunity', 'spirit'];

const NasaRoversView: React.FC = () => {
  const [selectedRover, setSelectedRover] = useState(0);
  const rover = ROVERS[selectedRover];
  const { data, loading, error } = useNasaApi(`mars-photos/api/v1/rovers/${rover}/latest_photos`);

  const solGroups = useMemo(() => {
    if (!data?.latest_photos) return [];
    const groups: Record<string, any[]> = {};
    data.latest_photos.forEach((img: any) => {
      if (!groups[img.sol]) groups[img.sol] = [];
      groups[img.sol].push(img);
    });
    const sortedSols = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
    return sortedSols.map(sol => ({ sol, images: groups[sol] }));
  }, [data]);

  const solTabs = solGroups.slice(0, 5);
  const [selectedSolIdx, setSelectedSolIdx] = useState(0);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  useEffect(() => {
    setSelectedSolIdx(0);
  }, [selectedRover, solGroups.length]);

  // Reset camera when sol or rover changes
  useEffect(() => {
    setSelectedCamera('');
  }, [selectedSolIdx, selectedRover]);

  const currentSol = solTabs[selectedSolIdx]?.sol;
  const currentImages = solTabs[selectedSolIdx]?.images || [];

  // Extract unique cameras for dropdown
  const cameraOptions = useMemo(() => {
    const cameras = Array.from(
      new Set(currentImages.map(img => img.camera?.name))
    ).filter(Boolean);
    return cameras.map(name => {
      const img = currentImages.find(img => img.camera?.name === name);
      return { name, full_name: img?.camera?.full_name || name };
    });
  }, [currentImages]);

  // Filter images by selected camera
  const filteredImages = useMemo(() => {
    if (!selectedCamera) return currentImages;
    return currentImages.filter(img => img.camera?.name === selectedCamera);
  }, [currentImages, selectedCamera]);

  const [imageIndices, setImageIndices] = useState<{ [key: string]: number }>({});
  const currentTabKey = `${rover}-${currentSol}-${selectedCamera}`;
  const currentImageIdx = imageIndices[currentTabKey] || 0;
  const currentImage = filteredImages[currentImageIdx] || null;

  const handleIndexChange = (idx: number) => {
    setImageIndices(prev => ({ ...prev, [currentTabKey]: idx }));
  };

  const [showFullscreen, setShowFullscreen] = useState(false);
  const transformRef = useRef<any>(null);

  useEffect(() => {
    if (!showFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFullscreen(false);
      if (e.key === 'ArrowLeft') handleIndexChange(Math.max(0, currentImageIdx - 1));
      if (e.key === 'ArrowRight') handleIndexChange(Math.min(filteredImages.length - 1, currentImageIdx + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showFullscreen, currentImageIdx, filteredImages.length]);

  useEffect(() => {
    transformRef.current?.resetTransform();
  }, [currentImageIdx, showFullscreen]);

  return (
    <div className="flex flex-col h-full w-full text-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 px-2 py-1 shadow-md ">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex gap-2">
            {ROVERS.map((r, idx) => (
              <button
                key={r}
                className={`px-1 py-1 sm:px-3 text-sm sm:text-base landscape:text-sm landscape:sm:text-base rounded-md font-semibold text-sm transition-colors duration-200 
                  ${selectedRover === idx ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-blue-500'}`}
                onClick={() => setSelectedRover(idx)}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          {solTabs.length > 1 && (
            <div className="flex gap-2 border-l border-gray-600 pl-2">
              {solTabs.map((group, idx) => (
                <button
                  key={group.sol}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors duration-200 ${selectedSolIdx === idx ? 'bg-blue-500 text-white' : 'bg-gray-600 hover:bg-blue-400'}`}
                  onClick={() => setSelectedSolIdx(idx)}
                >
                  Sol {group.sol}
                </button>
              ))}
            </div>
          )}
          {/* Camera Dropdown */}
          {cameraOptions.length > 1 && (
            <div className="flex items-center gap-2 border-l border-gray-600 pl-2">
              <label htmlFor="camera-select" className="text-xs font-semibold text-gray-400">Camera:</label>
              <select
                id="camera-select"
                className="bg-gray-700 text-white rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                value={selectedCamera}
                onChange={e => {
                  setSelectedCamera(e.target.value);
                  setImageIndices(prev => ({ ...prev, [currentTabKey]: 0 }));
                }}
              >
                <option value="">All</option>
                {cameraOptions.map(cam => (
                  <option key={cam.name} value={cam.name}>{cam.full_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}      
      <div className="flex-1 flex flex-col landscape:flex-row min-h-0 p-2 gap-2">
        {/* Image Display Area */}
        <div
          className="flex-1 flex items-center justify-center min-h-0 h-full w-full bg-black rounded-lg"
        >
          {loading && <SpinnerOverlay />}
          {error && <div className="text-red-400">Error Loading Data</div>}
          {!loading && !error && !filteredImages.length && (
            <div className="flex items-center justify-center text-gray-400">
              No images found for {rover}{selectedCamera ? ` (${cameraOptions.find(c => c.name === selectedCamera)?.full_name || selectedCamera})` : ''}.
            </div>
          )}
          {!loading && !error && filteredImages.length > 0 && (
            <Carousel
              showThumbnails={true}
              imageUrls={filteredImages.map(img => img.img_src)}
              altTexts={filteredImages.map(img => img.earth_date || rover)}
              className=""
              imageClassName="object-contain max-w-full max-h-full"
              onIndexChange={handleIndexChange}
              onImageClick={() => setShowFullscreen(true)}
              currentIndex={currentImageIdx}
              showArrows={!showFullscreen}
            />
          )}
        </div>

        {/* Metadata Sidebar */}
        <div className="h-fit w-full landscape:w-[22ch] landscape:h-full flex-shrink-0 bg-gray-800/30 rounded-lg p-3 overflow-y-auto">
          {currentImage ? (
            <>
              <h2 className="text-lg font-bold text-blue-300 mb-2 border-b border-gray-600 pb-1">
                {currentImage.rover?.name || rover}
              </h2>
              <ul className="text-sm space-y-2">
                <li><strong>Image:</strong> {currentImageIdx + 1} / {filteredImages.length}</li>
                <li><strong>Status:</strong> {currentImage.rover?.status}</li>
                <li><strong>Sol:</strong> {currentImage.sol}</li>
                <li><strong>Earth Date:</strong> {currentImage.earth_date}</li>
                <li><strong>Camera:</strong> {currentImage.camera?.full_name}</li>
                <li><strong>Image ID:</strong> {currentImage.id}</li>
              </ul>
            </>
          ) : (
            <div className="text-gray-400">No image data.</div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && currentImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <TransformWrapper ref={transformRef}>
            <TransformComponent>
              <img
                src={currentImage.img_src}
                alt={currentImage.camera?.full_name}
                className="max-w-screen-xl max-h-screen-xl object-contain"
              />
            </TransformComponent>
          </TransformWrapper>
          <button onClick={() => setShowFullscreen(false)} className="absolute top-4 right-4 text-white text-2xl">&times;</button>
          <button onClick={() => handleIndexChange(currentImageIdx - 1)} disabled={currentImageIdx === 0} className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl disabled:opacity-50">&lt;</button>
          <button onClick={() => handleIndexChange(currentImageIdx + 1)} disabled={currentImageIdx === filteredImages.length - 1} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl disabled:opacity-50">&gt;</button>
        </div>
      )}
    </div>
  );
};

export default NasaRoversView;