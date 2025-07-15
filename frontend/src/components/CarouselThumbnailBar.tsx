import React, { useRef, useEffect, useState } from 'react';

interface CarouselThumbnailBarProps {
  sortedImages: string[];
  sortedAlts: string[];
  currentIndex: number;
  errorImages: { [idx: number]: boolean };
  onThumbnailSelect: (idx: number) => void;
  autohideTimeout: number;
}

const CarouselThumbnailBar: React.FC<CarouselThumbnailBarProps> = ({
  sortedImages,
  sortedAlts,
  currentIndex,
  errorImages,
  onThumbnailSelect,
  autohideTimeout,
}) => {
  const [showThumbnailsBar, setShowThumbnailsBar] = useState(true);
  const [isThumbnailsInteracting, setIsThumbnailsInteracting] = useState(false);
  const thumbnailsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragScrollRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    moved: false,
    lastTarget: null as null | EventTarget,
    lastIndex: null as null | number,
  });
  // Refs for each thumbnail button
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Autohide logic
  const showAndResetThumbnailsBar = () => {
    setShowThumbnailsBar(true);
    if (!isThumbnailsInteracting) {
      if (thumbnailsTimeoutRef.current) clearTimeout(thumbnailsTimeoutRef.current);
      thumbnailsTimeoutRef.current = setTimeout(() => setShowThumbnailsBar(false), autohideTimeout);
    }
  };
  const handleMouseEnter = () => {
    setIsThumbnailsInteracting(true);
    setShowThumbnailsBar(true);
    if (thumbnailsTimeoutRef.current) clearTimeout(thumbnailsTimeoutRef.current);
  };
  const handleMouseLeave = () => {
    setIsThumbnailsInteracting(false);
    if (thumbnailsTimeoutRef.current) clearTimeout(thumbnailsTimeoutRef.current);
    thumbnailsTimeoutRef.current = setTimeout(() => setShowThumbnailsBar(false), autohideTimeout);
  };
  const handleFocus = () => {
    setIsThumbnailsInteracting(true);
    setShowThumbnailsBar(true);
    if (thumbnailsTimeoutRef.current) clearTimeout(thumbnailsTimeoutRef.current);
  };
  const handleBlur = () => {
    setIsThumbnailsInteracting(false);
    if (thumbnailsTimeoutRef.current) clearTimeout(thumbnailsTimeoutRef.current);
    thumbnailsTimeoutRef.current = setTimeout(() => setShowThumbnailsBar(false), autohideTimeout);
  };
  const handleTouchStart = () => {
    setIsThumbnailsInteracting(true);
    setShowThumbnailsBar(true);
    if (thumbnailsTimeoutRef.current) clearTimeout(thumbnailsTimeoutRef.current);
  };
  const handleTouchEnd = () => {
    setIsThumbnailsInteracting(false);
    if (thumbnailsTimeoutRef.current) clearTimeout(thumbnailsTimeoutRef.current);
    thumbnailsTimeoutRef.current = setTimeout(() => setShowThumbnailsBar(false), autohideTimeout);
  };
  useEffect(() => {
    setShowThumbnailsBar(true);
    if (thumbnailsTimeoutRef.current) clearTimeout(thumbnailsTimeoutRef.current);
    thumbnailsTimeoutRef.current = setTimeout(() => setShowThumbnailsBar(false), autohideTimeout);
    return () => {
      if (thumbnailsTimeoutRef.current) clearTimeout(thumbnailsTimeoutRef.current);
    };
  }, [autohideTimeout]);

  useEffect(() => {
    const el = dragScrollRef.current;
    if (!el) return;
    const THRESHOLD = 5; // px
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // Only left mouse button
      dragState.current.isDragging = true;
      dragState.current.startX = e.clientX;
      dragState.current.startY = e.clientY;
      dragState.current.scrollLeft = el.scrollLeft;
      dragState.current.moved = false;
      // Walk up from e.target to find data-thumb-index
      let target = e.target as HTMLElement | null;
      let thumbIndex: number | null = null;
      while (target && thumbIndex === null && target !== el) {
        if (target.dataset && target.dataset.thumbIndex) {
          thumbIndex = Number(target.dataset.thumbIndex);
          break;
        }
        target = target.parentElement;
      }
      dragState.current.lastTarget = e.target;
      dragState.current.lastIndex = thumbIndex;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragState.current.isDragging) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      if (Math.sqrt(dx*dx + dy*dy) > THRESHOLD) dragState.current.moved = true;
      el.scrollLeft = dragState.current.scrollLeft - dx;
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (dragState.current.isDragging && !dragState.current.moved) {
        const thumbIndex = dragState.current.lastIndex;
        if (thumbIndex !== null) {
          onThumbnailSelect(thumbIndex);
        }
      }
      dragState.current.isDragging = false;
      dragState.current.moved = false;
      dragState.current.lastTarget = null;
      dragState.current.lastIndex = null;
      el.releasePointerCapture(e.pointerId);
      el.style.cursor = 'grab';
    };
    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerUp);
    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [onThumbnailSelect]);

  useEffect(() => {
    // Scroll the current thumbnail into view when currentIndex changes
    const btn = buttonRefs.current[currentIndex];
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex]);

  return (
    <>
      {/* Overlay to reveal thumbnails on hover/touch when hidden */}
      <div
        className="absolute left-0 top-0 w-full"
        style={{
          height: 80,
          zIndex: 29,
          pointerEvents: showThumbnailsBar ? 'none' : 'auto',
          background: 'transparent',
        }}
        onMouseEnter={() => setShowThumbnailsBar(true)}
        onTouchStart={() => setShowThumbnailsBar(true)}
      />
      <div
        ref={dragScrollRef}
        className="absolute left-0 top-0 w-full carousel-thumbnails-scrollbar drag-scroll"
        style={{
          width: '100%',
          height: 80,
          maxHeight: 80,
          overflowX: 'auto',
          overflowY: 'hidden',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: '8px 0',
          background: 'rgba(0,0,0,0.7)',
          borderBottom: '1px solid #222',
          zIndex: 30,
          opacity: showThumbnailsBar ? 1 : 0,
          pointerEvents: showThumbnailsBar ? 'auto' : 'none',
          transition: 'opacity 0.5s',
          cursor: 'grab',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
      >
        {sortedImages.map((url, i) => (
          <button
            key={i}
            ref={el => { buttonRefs.current[i] = el; }}
            data-thumb-index={i}
            style={{
              border: currentIndex === i ? '2px solid #3b82f6' : '2px solid transparent',
              borderRadius: 6,
              padding: 0,
              backgroundColor: currentIndex === i ? '#fff2' : 'transparent',
              outline: 'none',
              boxShadow: currentIndex === i ? '0 0 0 2px #3b82f6' : undefined,
              cursor: 'pointer',
              minWidth: 56,
              minHeight: 56,
              maxWidth: 64,
              maxHeight: 64,
              marginLeft: i === 0 ? 8 : 0,
              marginRight: 8,
              transition: 'border 0.2s, box-shadow 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundClip: 'padding-box',
            }}
            aria-label={`Select image ${i + 1}`}
            aria-current={currentIndex === i}
          >
            <img
              src={errorImages[i] ? '/fallback.svg' : url}
              alt={sortedAlts[i] || `Thumbnail ${i + 1}`}
              data-thumb-index={i}
              style={{
                width: 48,
                height: 48,
                maxHeight: 64,
                objectFit: 'cover',
                borderRadius: 4,
                opacity: currentIndex === i ? 1 : 0.7,
                filter: currentIndex === i ? 'none' : 'grayscale(0.3)',
                transition: 'opacity 0.2s, filter 0.2s',
                pointerEvents: 'none',
                background: '#222',
                display: 'block',
              }}
              draggable={false}
            />
          </button>
        ))}
      </div>
    </>
  );
};

export default CarouselThumbnailBar; 