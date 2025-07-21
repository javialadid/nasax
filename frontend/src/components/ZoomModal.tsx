import React, { useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export type ZoomModalProps = {
  imageUrl: string;
  title?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
};

const ZoomModal: React.FC<ZoomModalProps> = ({
  imageUrl,
  title,
  onClose,
  onPrev,
  onNext,
  canPrev,
  canNext,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black bg-opacity-95 max-h-screen max-h-[100vh]">
      <button
        className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/80 rounded-full text-white z-[3000]"
        onClick={onClose}
        title="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {onPrev && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/80 rounded-full text-white z-[3000] text-3xl disabled:opacity-40"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous image"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}
      {onNext && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/80 rounded-full text-white z-[3000] text-3xl disabled:opacity-40"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next image"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}
      <div className="w-full h-full flex items-center justify-center p-4 max-h-screen max-h-[100vh]">
        <TransformWrapper>
          <TransformComponent>
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-full object-contain rounded-lg"
              draggable={false}
              style={{ maxHeight: '100vh', minHeight: '100vh' }}
            />
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
};

export default ZoomModal; 