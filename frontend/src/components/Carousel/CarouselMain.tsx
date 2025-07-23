import React from 'react';

interface CarouselMainProps {
  sortedImages: string[];
  sortedAlts: string[];
  currentIndex: number;
  cropLeft: number;
  cropRight: number;
  cropTop: number;
  cropBottom: number;
  imageStyle: React.CSSProperties;
  imageFit: React.CSSProperties['objectFit'];
  errorImages: { [idx: number]: boolean };
  onImageClick?: (idx: number) => void;
  onImageError?: (event: React.SyntheticEvent<HTMLImageElement>, index: number) => void;
  setLoadedImages: React.Dispatch<React.SetStateAction<{ [url: string]: boolean }>>;
  loadedImages: { [url: string]: boolean };
  imageClassName?: string;
  FALLBACK_IMAGE?: string;
}

const CarouselMain: React.FC<CarouselMainProps> = ({
  sortedImages,
  sortedAlts,
  currentIndex,
  cropLeft,
  cropRight,
  cropTop,
  cropBottom,
  imageStyle,
  imageFit,
  errorImages,
  onImageClick,
  onImageError,
  setLoadedImages,
  loadedImages,
  imageClassName = '',
  FALLBACK_IMAGE = '',
}) => {
  const totalImages = sortedImages.length;
  return (
    <div className="relative w-full h-full">
      {sortedImages.map((url, i) => {
        // Calculate cropping
        const left = cropLeft || 0;
        const right = cropRight || 0;
        const top = cropTop || 0;
        const bottom = cropBottom || 0;
        const visibleWidth = 1 - left - right;
        const visibleHeight = 1 - top - bottom;
        // Styles for cropping
        const cropContainerStyle: React.CSSProperties = {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: currentIndex === i ? 'auto' : 'none',
          zIndex: currentIndex === i ? 20 : 10,
          opacity: currentIndex === i ? 1 : 0,
          transition: 'opacity 0.7s',
        };
        // The image is scaled up so that only the visible area is shown
        const cropImageStyle: React.CSSProperties = {
          ...imageStyle,
          objectFit: imageFit,
          cursor: typeof onImageClick === 'function' ? 'zoom-in' : undefined,
          width: `${100 / visibleWidth}%`,
          height: `${100 / visibleHeight}%`,
          maxWidth: 'none',
          maxHeight: 'none',
          position: 'absolute',
          left: `-${(left / visibleWidth) * 100}%`,
          top: `-${(top / visibleHeight) * 100}%`,
        };
        return (
          <div
            key={i}
            style={cropContainerStyle}
            aria-hidden={currentIndex !== i}
            role="group"
            aria-roledescription="slide"
            aria-label={`Image ${i + 1} of ${totalImages}`}
          >
            {(errorImages[i] || url) && (
              <img
                src={errorImages[i] ? FALLBACK_IMAGE : url}
                alt={sortedAlts[i] || `Image ${i + 1}`}
                className={`object-${imageFit} ${imageClassName}`}
                style={cropImageStyle}
                draggable={false}
                onLoad={() => {
                  setLoadedImages(prev => ({ ...prev, [url]: true }));
                }}
                onClick={e => {
                  if (typeof onImageClick === 'function') onImageClick(i);
                }}
                onError={e => {
                  if (onImageError) {
                    onImageError(e, i);
                  } else {
                    // fallback: do nothing, errorImages should be managed by parent
                  }
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CarouselMain; 