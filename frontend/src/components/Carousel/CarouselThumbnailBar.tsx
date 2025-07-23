import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';

// Transition duration constant
const THUMBNAIL_TRANSITION_DURATION = 500; // ms

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
  const [isUserInteracting, setIsUserInteracting] = useState(false);
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
  const prevShowThumbnailsBar = useRef(showThumbnailsBar);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track if a user-initiated scroll is happening (for touch devices)
  const userScrollActive = useRef(false);

  // Memoize isTouchDevice
  const isTouchDevice = useMemo(() => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0), []);

  const startAutohideTimer = () => {
    if (thumbnailsTimeoutRef.current) clearTimeout(thumbnailsTimeoutRef.current);
    thumbnailsTimeoutRef.current = setTimeout(() => {
      setShowThumbnailsBar(false);
      setIsUserInteracting(false);
      userScrollActive.current = false;
    }, autohideTimeout);
  };
  const handleUserInteractionStart = (source = 'unknown') => {
    setIsUserInteracting(true);
    setShowThumbnailsBar(true);
    startAutohideTimer();
    userScrollActive.current = true;
  };
  const handleUserInteractionEnd = (source = 'unknown') => {
    startAutohideTimer();
    userScrollActive.current = false;
  };
  const handleMouseEnter = () => handleUserInteractionStart('mouseenter');
  const handleMouseLeave = () => handleUserInteractionEnd('mouseleave');
  const handleFocus = () => handleUserInteractionStart('focus');
  const handleBlur = () => handleUserInteractionEnd('blur');
  const handleTouchStart = () => handleUserInteractionStart('touchstart');
  const handleTouchEnd = () => handleUserInteractionEnd('touchend');
  const handlePointerDown = () => handleUserInteractionStart('pointerdown');

  // Always run autohide timer when bar is visible and user is not interacting
  useEffect(() => {
    if (showThumbnailsBar && !isUserInteracting) {
      startAutohideTimer();
    }
    return () => {
      if (thumbnailsTimeoutRef.current) clearTimeout(thumbnailsTimeoutRef.current);
    };
  }, [showThumbnailsBar, isUserInteracting, autohideTimeout]);

  // Clear autohide timer on unmount
  useEffect(() => {
    return () => {
      if (thumbnailsTimeoutRef.current) clearTimeout(thumbnailsTimeoutRef.current);
    };
  }, []);

  // Only show bar on mount
  useEffect(() => {
    setShowThumbnailsBar(true);
  }, []);

  // Utility to detect touch device
  // const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  useEffect(() => {
    if (isTouchDevice) return; // Only attach pointer drag for non-touch devices
    const el = dragScrollRef.current;
    if (!el) return;
    const THRESHOLD = 5; // px
    const handlePointerDownEvent = (e: PointerEvent) => {
      if (e.button !== 0) return; // Only left mouse button
      handlePointerDown();
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
      handleUserInteractionEnd('pointerup');
    };
    el.addEventListener('pointerdown', handlePointerDownEvent);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerUp);
    return () => {
      el.removeEventListener('pointerdown', handlePointerDownEvent);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [onThumbnailSelect, isTouchDevice]);

  // For touch devices, ensure autohide is triggered by scroll/touch, but only if user-initiated
  useEffect(() => {
    if (!isTouchDevice) return;
    const el = dragScrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (userScrollActive.current) {
        handleUserInteractionStart('scroll');
        // After a short delay, reset userScrollActive
        setTimeout(() => { userScrollActive.current = false; }, 100);
      } else {
        // Ignore programmatic scrolls
      }
    };
    el.addEventListener('scroll', handleScroll);
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [autohideTimeout, isTouchDevice]);

  // Callback ref for buttons
  const setButtonRef = useCallback((el: HTMLButtonElement | null, i: number) => {
    if (el) buttonRefs.current[i] = el;
  }, []);

  useEffect(() => {
    // When the bar collapses (showThumbnailsBar goes from true to false), scroll to current index
    if (prevShowThumbnailsBar.current && !showThumbnailsBar) {
      // Wait for the opacity transition to finish
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        const btn = buttonRefs.current[currentIndex];
        if (btn) {
          btn.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
        }
      }, THUMBNAIL_TRANSITION_DURATION);
    }
    prevShowThumbnailsBar.current = showThumbnailsBar;
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [showThumbnailsBar, currentIndex]);

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
          transition: `opacity ${THUMBNAIL_TRANSITION_DURATION}ms`,
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
            ref={el => setButtonRef(el, i)}
            data-thumb-index={i}
            onClick={isTouchDevice ? () => onThumbnailSelect(i) : undefined}
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
              src={errorImages[i] ? '/fallback.svg' : (url || undefined)}
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
              onError={() => onThumbnailSelect(i)}
            />
          </button>
        ))}
      </div>
    </>
  );
};

export default CarouselThumbnailBar; 