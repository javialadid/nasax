import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';

/**
 * CarouselProps defines the props for the Carousel component.
 * @param imageUrls Array of image URLs to display.
 * @param altTexts Optional array of alt texts for images.
 * @param order Display order: 'asc' or 'desc'.
 * @param onIndexChange Callback when the index changes.
 * @param autoPlay Whether to auto-play the carousel.
 * @param cropLeft Crop percentage from the left.
 * @param cropRight Crop percentage from the right.
 * @param cropTop Crop percentage from the top.
 * @param cropBottom Crop percentage from the bottom.
 * @param playbackSpeedMin Minimum playback speed (ms).
 * @param playbackSpeedMax Maximum playback speed (ms).
 * @param className Custom className for the root element.
 * @param style Custom style for the root element.
 * @param imageClassName Custom className for images.
 * @param imageStyle Custom style for images.
 * @param imageFit CSS object-fit for images (cover, contain, etc.).
 * @param showArrows Show navigation arrows.
 * @param showIndicators Show dot indicators.
 * @param showPlayPause Show play/pause controls.
 * @param onImageClick Optional callback when the image is clicked. Receives the image index.
 */
interface CarouselProps {
  imageUrls: string[];
  altTexts?: string[];
  order?: 'asc' | 'desc';
  onIndexChange?: (index: number) => void;
  autoPlay?: boolean;
  cropLeft?: number;
  cropRight?: number;
  cropTop?: number;
  cropBottom?: number;
  playbackSpeedMin?: number;
  playbackSpeedMax?: number;
  className?: string;
  style?: React.CSSProperties;
  imageClassName?: string;
  imageStyle?: React.CSSProperties;
  imageFit?: React.CSSProperties['objectFit'];
  showArrows?: boolean;
  showIndicators?: boolean;
  showPlayPause?: boolean;
  onImageClick?: (index: number) => void;
  currentIndex?: number; 
}

const DEFAULT_CROP = 0.009;

const Carousel = forwardRef<any, CarouselProps>(({
  imageUrls = [],
  altTexts = [],
  order = 'asc',
  onIndexChange = () => {},
  autoPlay = false,
  cropLeft = DEFAULT_CROP,
  cropRight = DEFAULT_CROP,
  cropTop = DEFAULT_CROP,
  cropBottom = DEFAULT_CROP,
  playbackSpeedMin = 1000,
  playbackSpeedMax = 3000,
  className = '',
  style = {},
  imageClassName = '',
  imageStyle = {},
  imageFit = 'contain',
  showArrows = true,
  showIndicators = true,
  showPlayPause = true,
  onImageClick,
  currentIndex: controlledIndex, // Add this line
}, ref) => {
  const [uncontrolledIndex, setUncontrolledIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [loadedImages, setLoadedImages] = useState<{ [url: string]: boolean }>({});
  const initialSpeed = useMemo(() => Math.round((playbackSpeedMin + playbackSpeedMax) / 2), [playbackSpeedMin, playbackSpeedMax]);
  const [playbackSpeed, setPlaybackSpeed] = useState(initialSpeed);

  useEffect(() => {
    setIsPlaying(autoPlay);
  }, [autoPlay]);

  const sortedImages = useMemo(() => order === 'desc' ? [...imageUrls].reverse() : imageUrls, [imageUrls, order]);
  const sortedAlts = useMemo(() => order === 'desc' ? [...altTexts].reverse() : altTexts, [altTexts, order]);
  const totalImages = sortedImages.length;

  useEffect(() => {
    setLoadedImages(prev => {
      const next: { [url: string]: boolean } = {};
      for (const url of sortedImages) {
        next[url] = prev[url] || false;
      }
      return next;
    });
  }, [sortedImages]);

  // Use controlled or uncontrolled index
  const currentIndex =
    typeof controlledIndex === 'number' ? controlledIndex : uncontrolledIndex;

  const goNext = useCallback(() => {
    if (typeof controlledIndex === 'number') {
      onIndexChange((controlledIndex + 1) % totalImages);
    } else {
      setUncontrolledIndex(idx => (idx + 1) % totalImages);
    }
  }, [controlledIndex, totalImages, onIndexChange]);

  const goPrev = useCallback(() => {
    if (typeof controlledIndex === 'number') {
      onIndexChange((controlledIndex - 1 + totalImages) % totalImages);
    } else {
      setUncontrolledIndex(idx => (idx - 1 + totalImages) % totalImages);
    }
  }, [controlledIndex, totalImages, onIndexChange]);

  const goToIndex = useCallback((idx: number) => {
    if (typeof controlledIndex === 'number') {
      onIndexChange(idx % totalImages);
    } else {
      setUncontrolledIndex(idx % totalImages);
    }
  }, [controlledIndex, totalImages, onIndexChange]);

  useEffect(() => {
    if (typeof controlledIndex !== 'number') {
      onIndexChange(uncontrolledIndex);
    }
  }, [uncontrolledIndex, onIndexChange, controlledIndex]);

  const allImagesLoaded = useMemo(() => {
    return sortedImages.every(url => loadedImages[url]);
  }, [loadedImages, sortedImages]);

  useEffect(() => {
    if (isPlaying && totalImages > 1 && allImagesLoaded) {
      intervalRef.current = setInterval(() => {
        if (typeof controlledIndex === 'number') {
          onIndexChange((controlledIndex + 1) % totalImages);
        } else {
          setUncontrolledIndex(idx => (idx + 1) % totalImages);
        }
      }, playbackSpeed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, totalImages, allImagesLoaded, playbackSpeed, controlledIndex, onIndexChange]);

  useImperativeHandle(ref, () => ({
    next: goNext,
    prev: goPrev,
    goToIndex,
    getCurrentIndex: () => currentIndex,
    isPlaying: () => isPlaying,
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    togglePlay: () => setIsPlaying(prev => !prev),
    getTotalImages: () => totalImages,
  }));

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        setIsPlaying(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext]);

  if (totalImages === 0) {
    return (
      <div className={`flex items-center justify-center w-full h-full bg-gray-100 rounded-lg ${className}`} style={style} aria-live="polite" aria-label="Empty carousel">
        <p className="text-gray-500">No images provided</p>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden w-full h-full ${className} group`}
      style={style}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Image carousel"
      aria-live="polite"
      role="region"
    >
      <div className="relative w-full h-full">
        {sortedImages.map((url, i) => {
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
              aria-hidden={currentIndex !== i}
              role="group"
              aria-roledescription="slide"
              aria-label={`Image ${i + 1} of ${totalImages}`}
            >
              <img
                src={url}
                alt={sortedAlts[i] || `Image ${i + 1}`}
                className={`w-full h-full object-${imageFit} ${imageClassName}`}
                style={{
                  ...imageStyle,
                  transform: `scale(${scaleX}, ${scaleY}) translate(${translateX}%, ${translateY}%)`,
                  transition: 'transform 0.7s ease-in-out',
                  objectFit: imageFit,
                  cursor: typeof onImageClick === 'function' ? 'zoom-in' : undefined,
                }}
                draggable={false}
                onLoad={() => {
                  setLoadedImages(prev => ({ ...prev, [url]: true }));
                }}
                onClick={e => {
                  if (typeof onImageClick === 'function') onImageClick(i);
                }}
              />
            </div>
          );
        })}
      </div>

      {showArrows && (
        <>
          <button
            onClick={goPrev}
            disabled={totalImages <= 1}
            className="z-250 absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all"
            aria-label="Previous image"
          >
            {'<'}
          </button>

          <button
            onClick={goNext}
            disabled={totalImages <= 1}
            className="z-250 absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all"
            aria-label="Next image"
          >
            {'>'}
          </button>
        </>
      )}

      <div className="absolute bottom-8 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
        {currentIndex + 1} / {totalImages}
      </div>

      {showIndicators && (
        <div className="z-40 absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300">
          {(() => {
            const VISIBLE_DOTS = 12;
            let start = 0;
            let end = totalImages;
            if (totalImages > VISIBLE_DOTS) {
              const half = Math.floor(VISIBLE_DOTS / 2);
              if (currentIndex <= half) {
                start = 0;
                end = VISIBLE_DOTS;
              } else if (currentIndex >= totalImages - half - 1) {
                start = totalImages - VISIBLE_DOTS;
                end = totalImages;
              } else {
                start = currentIndex - half;
                end = currentIndex + half + 1;
              }
            }
            return sortedImages.slice(start, end).map((_, idx) => {
              const actualIndex = start + idx;
              const isCurrent = actualIndex === currentIndex;
              return (
                <button
                  key={actualIndex}
                  onClick={() => {
                    if (typeof controlledIndex === 'number') {
                      onIndexChange(actualIndex);
                    } else {
                      setUncontrolledIndex(actualIndex);
                    }
                  }}
                  className={`w-3 h-3 rounded-full transition-all border-2 flex items-center justify-center focus:outline-none ${
                    isCurrent
                      ? 'bg-white border-blue-500 ring-2 ring-blue-400' // current dot: white with blue ring
                      : 'bg-white bg-opacity-50 border-transparent hover:bg-opacity-70'
                  }`}
                  aria-label={`Go to image ${actualIndex + 1}`}
                  aria-current={isCurrent}
                  style={{ boxSizing: 'border-box' }}
                >
                  {/* Optionally, add a dot inside for the ring effect */}
                  {isCurrent && <span className="block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
                </button>
              );
            });
          })()}
        </div>
      )}

      {showPlayPause && (
        <div className="z-50 absolute bottom-4 right-4 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
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
              aria-label="Playback speed"
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default Carousel;
