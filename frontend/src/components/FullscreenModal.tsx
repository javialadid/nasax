import React from 'react';

import ImageViewer from './ImageViewer';
import Explanation from './Explanation';

const FullscreenModal: React.FC<{ data: any; onClose: () => void }> = ({ data, onClose }) => (
  <div className="fixed inset-0 z-[100] bg-black/95 text-white flex items-center justify-center p-4">
    <div
      className="relative w-full max-w-2xl mx-auto rounded-xl flex flex-col shadow-2xl bg-transparent overflow-hidden"
      style={{ height: '90vh' }}
    >
      <div className="flex flex-col h-full w-full bg-gray-800/50">
        {/* Title Area (10%) */}
        <div className="relative flex items-center justify-center px-4" style={{ flexBasis: '10%' }}>
          <h2 className="text-2xl sm:text-3xl font-bold text-center w-full break-words z-10 m-0
          ">
            {data.title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-1/2 right-4 -translate-y-1/2 p-2 rounded-full bg-gray-800 hover:bg-gray-700 z-50"
          >
            X
          </button>
        </div>
        {/* Image Area (55%) */}
        <div className="flex items-center justify-center w-full" style={{ flexBasis: '55%' }}>
          <ImageViewer url={data.hdurl || data.url} alt={data.title} />
        </div>
        {/* Explanation Area (35%) */}
        <div className="w-full overflow-y-auto px-4" style={{ flexBasis: '35%' }}>
          <Explanation text={data.explanation} />
        </div>
      </div>
    </div>
  </div>
);

export default FullscreenModal;
