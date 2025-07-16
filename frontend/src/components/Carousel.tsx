import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import CarouselThumbnailBar from '@components/CarouselThumbnailBar';
import CarouselMain from '@components/CarouselMain';
import CarouselIndicators from '@components/CarouselIndicators';
import CarouselControls from '@components/CarouselControls';

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
  onImageError?: (event: React.SyntheticEvent<HTMLImageElement>, index: number) => void;
  showThumbnails?: boolean; // Add this line
  thumbnailsAutohideTimeout?: number;
}

const DEFAULT_CROP = 0;

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
  showIndicators = false,
  showPlayPause = true,
  onImageClick,
  currentIndex: controlledIndex, // Add this line
  onImageError,
  showThumbnails = false, // Add this line
  thumbnailsAutohideTimeout = 2000,
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

  // Fallback image (SVG data URI)
  const FALLBACK_IMAGE =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
        <rect width="100%" height="100%" fill="none"/>
        <g>
          <rect x="100" y="125" width="200" height="50" rx="12" fill="white" fill-opacity="0.7"/>
          <text x="200" y="155" text-anchor="middle" dominant-baseline="middle" fill="#444" font-size="24" font-family="sans-serif">No Image</text>
        </g>
      </svg>
    `);

  // Track which images failed
  const [errorImages, setErrorImages] = useState<{ [idx: number]: boolean }>({});

  // --- Thumbnails autohide logic ---
  // Remove handleThumbnailsMouseEnter, handleThumbnailsMouseLeave, handleThumbnailsFocus, handleThumbnailsBlur, handleThumbnailsTouchStart, handleThumbnailsTouchEnd, and related autohide logic from Carousel.tsx
  // Only keep the onThumbnailSelect handler for click events
  // ... existing code ...

  // Handlers for thumbnail bar
  const handleThumbnailSelect = (idx: number) => {
    if (typeof controlledIndex === 'number') {
      onIndexChange(idx);
    } else {
      setUncontrolledIndex(idx);
    }
  };

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
      {/* Thumbnail Mosaic */}
      {showThumbnails && totalImages > 0 && (
        <CarouselThumbnailBar
          sortedImages={sortedImages}
          sortedAlts={sortedAlts}
          currentIndex={currentIndex}
          errorImages={errorImages}
          onThumbnailSelect={handleThumbnailSelect}
          autohideTimeout={thumbnailsAutohideTimeout}
        />
      )}
      {/* On mobile, tap anywhere on the carousel to show thumbnails */}
      {showThumbnails && totalImages > 0 && (
        <div
          className="absolute left-0 top-0 w-full carousel-thumbnails-scrollbar"
          style={{
            height: 128,
            zIndex: 25,
            pointerEvents: 'auto',
            background: 'transparent',
            overflowY: 'hidden',
          }}
          onTouchStart={e => {
            e.stopPropagation();
            // Block the next click event globally to prevent ghost click
            const blockClick = (evt: MouseEvent) => {
              evt.preventDefault();
              evt.stopImmediatePropagation();
              window.removeEventListener('click', blockClick, true);
            };
            window.addEventListener('click', blockClick, true);
            // No setShowThumbnailsBar here; let the bar handle its own autohide
          }}
        />
      )}
      <CarouselMain
        sortedImages={sortedImages}
        sortedAlts={sortedAlts}
        currentIndex={currentIndex}
        cropLeft={cropLeft}
        cropRight={cropRight}
        cropTop={cropTop}
        cropBottom={cropBottom}
        imageStyle={imageStyle}
        imageFit={imageFit}
        errorImages={errorImages}
        onImageClick={onImageClick}
        onImageError={onImageError}
        setLoadedImages={setLoadedImages}
        loadedImages={loadedImages}
        imageClassName={imageClassName}
        FALLBACK_IMAGE={FALLBACK_IMAGE}
      />
      {showArrows && (
        <>
          <button
            onClick={goPrev}
            disabled={totalImages <= 1}
            className="z-250 absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-200/10 
            hover:bg-gray-200/50 disabled:opacity-30 disabled:cursor-not-allowed text-white p-2 
            rounded-full transition-all"
            aria-label="Previous image"            
          >
            <span style={{textShadow: '2px 2px 4px black'}}>{'<'}</span>
          </button>

          <button
            onClick={goNext}
            disabled={totalImages <= 1}
            className="z-250 absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-200/10 
            hover:bg-gray-200/50 disabled:opacity-30 disabled:cursor-not-allowed text-white p-2 
            rounded-full transition-all"
            aria-label="Next image"
          >
            <span style={{textShadow: '2px 2px 4px black'}}>{'>'}</span>
          </button>
        </>
      )}
      <div className="absolute bottom-8 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
        {currentIndex + 1} / {totalImages}
      </div>
      {showIndicators && (
        <CarouselIndicators
          totalImages={totalImages}
          currentIndex={currentIndex}
          onIndicatorClick={handleThumbnailSelect}
        />
      )}
      {showPlayPause && (
        <CarouselControls
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
          playbackSpeedMin={playbackSpeedMin}
          playbackSpeedMax={playbackSpeedMax}
        />
      )}
    </div>
  );
});

export default Carousel;
