import React, { useState, useEffect } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

interface ImageViewerProps {
  url: string;
  alt: string;
  zoomMessage?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  url,
  alt,
  zoomMessage = 'Double click to zoom',
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    console.log(`ImageViewer: open=${open}, url=${url}, alt=${alt}`);
  }, [open, url, alt]);

  return (
    <PhotoProvider
      maskOpacity={0.95}
      onVisibleChange={(visible) => {
        console.log(`PhotoProvider: visibility changed to ${visible}`);
        setOpen(visible);
      }}
      toolbarRender={() => (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-yellow-200/50 text-black px-4 py-2 rounded-lg text-sm font-semibold shadow-lg"
          style={{ transition: 'none' }}
        >
          {zoomMessage}
        </div>
      )}
    >
      <PhotoView src={url}>
        <div
          className={
            open
              ? 'relative cursor-zoom-in rounded overflow-hidden flex justify-center mb-6'
              : 'relative cursor-zoom-in rounded overflow-hidden max-h-[70vh] w-full flex justify-center mb-6'
          }
        >
          <img src={url} alt={alt} className="object-contain w-full" />
        </div>
      </PhotoView>
    </PhotoProvider>
  );
};

export default ImageViewer;