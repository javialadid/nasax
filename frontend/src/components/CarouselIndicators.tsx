import React from 'react';

interface CarouselIndicatorsProps {
  totalImages: number;
  currentIndex: number;
  onIndicatorClick: (idx: number) => void;
}

const CarouselIndicators: React.FC<CarouselIndicatorsProps> = ({
  totalImages,
  currentIndex,
  onIndicatorClick,
}) => {
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
  return (
    <div className="z-40 absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300">
      {Array.from({ length: end - start }, (_, idx) => {
        const actualIndex = start + idx;
        const isCurrent = actualIndex === currentIndex;
        return (
          <button
            key={actualIndex}
            onClick={() => onIndicatorClick(actualIndex)}
            className={`w-3 h-3 rounded-full transition-all border-2 flex items-center justify-center focus:outline-none ${
              isCurrent
                ? 'bg-white border-blue-500 ring-2 ring-blue-400'
                : 'bg-white bg-opacity-50 border-transparent hover:bg-opacity-70'
            }`}
            aria-label={`Go to image ${actualIndex + 1}`}
            aria-current={isCurrent}
            style={{ boxSizing: 'border-box' }}
          >
            {isCurrent && <span className="block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
          </button>
        );
      })}
    </div>
  );
};

export default CarouselIndicators; 