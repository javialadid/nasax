import React, { useState, useMemo, useEffect } from 'react';
import { useApiWithBackoff, nasaApiFetch } from '@/hooks/useNasaApi';
import SpinnerOverlay from '@components/SpinnerOverlay';
import Carousel from '@/components/Carousel/Carousel';
import ZoomModal from '@components/ZoomModal';

const ROVERS = ['perseverance', 'curiosity', 'opportunity', 'spirit'];

const NasaRoversView: React.FC = () => {
  const [selectedRover, setSelectedRover] = useState<string>(ROVERS[0]);
  const [selectedSolIdx, setSelectedSolIdx] = useState(0);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Fetcher for the selected rover
  const fetchRoverPhotos = async () => {
    const json = await nasaApiFetch(`mars-photos/api/v1/rovers/${selectedRover}/latest_photos`);
    return json;
  };

  const { data: fetched, loading, error } = useApiWithBackoff(
    fetchRoverPhotos,
    [selectedRover],
    { enabled: true }
  );

  // Compute current photos from fetch only
  const currentPhotos = useMemo(() => {
    return fetched ? fetched.latest_photos || [] : [];
  }, [fetched]);

  // Group by sol
  const solGroups = useMemo(() => {
    if (!currentPhotos) return [];
    const groups: Record<string, any[]> = {};
    currentPhotos.forEach((img: any) => {
      if (!groups[img.sol]) groups[img.sol] = [];
      groups[img.sol].push(img);
    });
    const sortedSols = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
    return sortedSols.map(sol => ({ sol, images: groups[sol] }));
  }, [currentPhotos]);

  const solTabs = solGroups.slice(0, 5);

  // Reset sol index when rover changes or sol groups load/change
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

  // Reset image index when rover, sol, or camera changes
  useEffect(() => {
    setCurrentImageIdx(0);
  }, [selectedRover, selectedSolIdx, selectedCamera]);

  const currentImage = filteredImages[currentImageIdx] || null;

  useEffect(() => {
    if (!showFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFullscreen(false);
      if (e.key === 'ArrowLeft') setCurrentImageIdx(prev => Math.max(0, prev - 1));
      if (e.key === 'ArrowRight') setCurrentImageIdx(prev => Math.min(filteredImages.length - 1, prev + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showFullscreen, filteredImages.length]);

  return (
    <div className="flex flex-col h-full w-full text-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 px-2 py-1 shadow-md ">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex gap-2">
            {ROVERS.map((r) => (
              <button
                key={r}
                className={`px-1 py-1 sm:px-3 text-sm sm:text-base landscape:text-sm landscape:sm:text-base rounded-md font-semibold text-sm transition-colors duration-200 
                  ${selectedRover === r ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-blue-500'}`}
                onClick={() => setSelectedRover(r)}
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
          <div className="flex items-center gap-2 border-l border-gray-600 pl-2">
            <label htmlFor="camera-select" className="text-xs font-semibold text-gray-400">Camera:</label>
            <select
              id="camera-select"
              className="bg-gray-700 text-white rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              value={selectedCamera}
              onChange={e => setSelectedCamera(e.target.value)}
              disabled={cameraOptions.length === 0}
            >
              <option value="">All</option>
              {cameraOptions.map(cam => (
                <option key={cam.name} value={cam.name}>{cam.full_name}</option>
              ))}
            </select>
          </div>
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
          {!loading && !error && currentPhotos && !filteredImages.length && (
            <div className="flex items-center justify-center text-gray-400">
              No images found for {selectedRover}{selectedCamera ? ` (${cameraOptions.find(c => c.name === selectedCamera)?.full_name || selectedCamera})` : ''}.
            </div>
          )}
          {!loading && !error && filteredImages.length > 0 && (
            <Carousel
              showThumbnails={true}
              imageUrls={filteredImages.map(img => img.img_src)}
              altTexts={filteredImages.map(img => img.earth_date || selectedRover)}
              className=""
              imageClassName="object-contain max-w-full max-h-full"
              onIndexChange={setCurrentImageIdx}
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
                {currentImage.rover?.name || selectedRover}
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
        <ZoomModal
          imageUrl={currentImage.img_src}
          title={currentImage.camera?.full_name}
          onClose={() => setShowFullscreen(false)}
          onPrev={currentImageIdx > 0 ? () => setCurrentImageIdx(currentImageIdx - 1) : undefined}
          onNext={currentImageIdx < filteredImages.length - 1 ? () => setCurrentImageIdx(currentImageIdx + 1) : undefined}
          canPrev={currentImageIdx > 0}
          canNext={currentImageIdx < filteredImages.length - 1}
        />
      )}
    </div>
  );
};

export default NasaRoversView;