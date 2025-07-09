import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';

interface CarouselProps {
  imageUrls: string[];
  order?: 'asc' | 'desc';
  onIndexChange?: (index: number) => void;
  autoPlay?: boolean;
  cropLeft?: number; // 0.0 to 1.0,
  cropRight?: number; // 0.0 to 1.0
  cropTop?: number; // 0.0 to 1.0 
  cropBottom?: number; // 0.0 to 1.0
  playbackSpeedMin?: number; // ms, default 1000
  playbackSpeedMax?: number; // ms, default 3000
}

const DEFAULT_CROP = 0.009
const Carousel = forwardRef<any, CarouselProps>(({ imageUrls = [], order = 'asc', 
  onIndexChange = () => {}, autoPlay = false, 
  cropLeft = DEFAULT_CROP, cropRight = DEFAULT_CROP, cropTop = DEFAULT_CROP, cropBottom = DEFAULT_CROP,
  playbackSpeedMin = 1000, playbackSpeedMax = 3000 }, ref) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const firstLoadedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [loadedImages, setLoadedImages] = useState<{ [url: string]: boolean }>({});
  const initialSpeed = useMemo(() => Math.round((playbackSpeedMin + playbackSpeedMax) / 2), [playbackSpeedMin, playbackSpeedMax]);
  const [playbackSpeed, setPlaybackSpeed] = useState(initialSpeed); // ms, default midpoint

  // Sync isPlaying with autoPlay prop
  useEffect(() => {
    setIsPlaying(autoPlay);
  }, [autoPlay]);

  // Sort images based on order
  const sortedImages = useMemo(() => order === 'desc' ? [...imageUrls].reverse() : imageUrls, [imageUrls, order]);
  const totalImages = sortedImages.length;

  // Update loadedImages when sortedImages change
  useEffect(() => {
    // Reset loadedImages only for new images
    setLoadedImages((prev) => {
      const next: { [url: string]: boolean } = {};
      for (const url of sortedImages) {
        next[url] = prev[url] || false;
      }
      return next;
    });
    console.log('sortedImages changed, ensure loadedImages keys', { sortedImages });
  }, [sortedImages]);

  // Navigation
  const goNext = useCallback(() => {
    setCurrentIndex(idx => {
      const nextIdx = (idx + 1) % totalImages;
      console.log('goNext clicked', { prevIdx: idx, nextIdx });
      return nextIdx;
    });
  }, [totalImages]);

  const goPrev = useCallback(() => {
    setCurrentIndex(idx => {
      const prevIdx = (idx - 1 + totalImages) % totalImages;
      console.log('goPrev clicked', { prevIdx: idx, nextIdx: prevIdx });
      return prevIdx;
    });
  }, [totalImages]);

  // Notify parent of index change
  useEffect(() => {
    console.log('currentIndex changed', currentIndex);
    if (onIndexChange) onIndexChange(currentIndex);
  }, [currentIndex, onIndexChange]);

  // Only allow play when all images are loaded
  const allImagesLoaded = useMemo(() => {
    const loaded = sortedImages.every(url => loadedImages[url]);
    if (loaded) {
      console.log('All images loaded');
    } else {
      const notLoaded = sortedImages.filter(url => !loadedImages[url]);
      console.log('Not all images loaded', { loadedImages, notLoaded });
    }
    return loaded;
  }, [loadedImages, sortedImages]);

  // Auto-play functionality
  useEffect(() => {
    console.log('Auto-play effect', { isPlaying, totalImages, allImagesLoaded, playbackSpeed });
    if (isPlaying && totalImages > 1 && allImagesLoaded) {
      console.log('Setting auto-play interval');
      intervalRef.current = setInterval(() => {
        setCurrentIndex(idx => {
          const nextIdx = (idx + 1) % totalImages;
          console.log('Auto-play advancing', { prevIdx: idx, nextIdx });
          return nextIdx;
        });
      }, playbackSpeed);
    } else {
      if (intervalRef.current) {
        console.log('Clearing auto-play interval');
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        console.log('Clearing auto-play interval (cleanup)');
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, totalImages, allImagesLoaded, playbackSpeed]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    next: goNext,
    prev: goPrev,
    getCurrentIndex: () => currentIndex,
    isPlaying: () => isPlaying,
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    togglePlay: () => setIsPlaying((prev: boolean) => !prev),
    getTotalImages: () => totalImages,
  }));

  if (totalImages === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg`}>
        <p className="text-gray-500">No images provided</p>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden pb-16`}>
      {/* Main image display: all images are loaded, only one is visible */}
      <div className="relative aspect-video w-full min-h-[60vh]">
        {sortedImages.map((url, i) => {
          // Calculate crop as percentage
          const cropX = cropLeft + cropRight;
          const cropY = cropTop + cropBottom;
          const scaleX = 1 / (1 - cropX);
          const scaleY = 1 / (1 - cropY);
          const translateX = ((cropLeft - cropRight) / 2) * 100 / (1 - cropX);
          const translateY = ((cropTop - cropBottom) / 2) * 100 / (1 - cropY);
          return (
            <div
              key={i}
              className="absolute top-0 left-0 w-full h-full overflow-hidden"
              style={{
                opacity: currentIndex === i ? 1 : 0,
                zIndex: currentIndex === i ? 20 : 10,
                transition: 'opacity 0.7s ease-in-out',
                pointerEvents: currentIndex === i ? 'auto' : 'none',
              }}
            >
              <img
                src={url}
                alt={`Image ${i + 1}`}
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${scaleX}, ${scaleY}) translate(${translateX}%, ${translateY}%)`,
                  transition: 'transform 0.7s ease-in-out',
                }}
                draggable={false}
                onLoad={() => {
                  console.log('onLoad fired', { index: i, url });
                  setLoadedImages(prev => {
                    const next = { ...prev, [url]: true };
                    console.log('setLoadedImages', { prev, next, setTrueUrl: url });
                    return next;
                  });
                  console.log('Image loaded', { index: i, src: url });
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Navigation buttons */}
      <button
        onClick={goPrev}
        disabled={totalImages <= 1}
        className="z-250 absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all"
      >
        {'<'}
      </button>

      <button
        onClick={goNext}
        disabled={totalImages <= 1}
        className="z-250 absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all"
      >
        {'>'}
      </button>

      {/* Play/Pause button and speed control */}
      {totalImages > 1 && (
        <div className="z-10 absolute bottom-4 right-4 flex items-center space-x-2">
          <button
            onClick={() => {
              setIsPlaying((p) => {
                const next = !p;
                console.log('Play/Pause button clicked', { prev: p, next });
                return next;
              });
            }}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          {/* Playback speed slider */}
          <div className="flex flex-col items-center text-xs text-white bg-black bg-opacity-50 rounded px-2 py-1">
            <label htmlFor="carousel-speed" className="mb-1">Speed</label>
            <input
              id="carousel-speed"
              type="range"
              min={playbackSpeedMin}
              max={playbackSpeedMax}
              step={50}
              value={playbackSpeedMax - (playbackSpeed - playbackSpeedMin)}
              onChange={e => {
                const sliderValue = Number(e.target.value);
                setPlaybackSpeed(playbackSpeedMax - (sliderValue - playbackSpeedMin));
              }}
              className="w-20"
            />
          </div>
        </div>
      )}

      {/* Image counter and thumbnails */}
      <div className="absolute bottom-8 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
        {currentIndex + 1} / {totalImages}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {sortedImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-white' 
                : 'bg-white bg-opacity-50 hover:bg-opacity-70'
            }`}
          />
        ))}
      </div>
    </div>
  );
});

export default Carousel;