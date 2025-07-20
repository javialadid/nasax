import React from 'react';

interface EpicMetadataSectionProps {
  currentDate: string | null;  
  setSearchParams: (params: any) => void;
  data: any[];
  carouselIdx: number;
  currentImg: any;
  allowedDates: string[];
}

const EpicMetadataSection: React.FC<EpicMetadataSectionProps> = ({
  currentDate,  
  setSearchParams,
  data,
  carouselIdx,
  currentImg,
  allowedDates = [],
}) => {
  // Sort allowedDates ascending (oldest first)
  const sortedAllowed = [...allowedDates].sort((a, b) => a.localeCompare(b));
  const idx = currentDate ? sortedAllowed.indexOf(currentDate) : -1;
  const prevDate = idx > 0 ? sortedAllowed[idx - 1] : null;
  const nextDate = idx < sortedAllowed.length - 1 ? sortedAllowed[idx + 1] : null;
  return (
    <div
      className="rounded-lg shadow-md bg-gray-900/80 p-0 portrait:w-full portrait:min-h-[25vh] portrait:max-h-[50vh] portrait:flex-grow landscape:flex-grow landscape:min-w-[35vh] landscape:max-h-[75vh] landscape:text-sm landscape:md:text-base flex flex-col min-h-0 min-w-0 text-sm smphone:text-base md:text-lg sm:p-0 md:p-2"
      style={{ verticalAlign: 'top', minWidth: 0, minHeight: 0 }}
    >
      {/* Navigation Buttons and Title Row */}
      <div className="flex flex-row items-center justify-center w-full min-w-0 mb-2 gap-2">
        <button
          onClick={() => prevDate && setSearchParams({ date: prevDate })}
          disabled={!prevDate}
          className="px-2 py-2 bg-gray-700/60 rounded-full disabled:opacity-40 flex items-center justify-center hover:bg-gray-600 transition"
          aria-label="Previous Day"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="font-bold text-blue-200 text-center mx-1 whitespace-normal text-base min-w-0 select-all" style={{lineHeight: '1.2'}}>{currentDate || 'Loading...'}</span>
        <button
          onClick={() => nextDate && setSearchParams({ date: nextDate })}
          disabled={!nextDate}
          className="px-2 py-2 bg-gray-700/60 rounded-full disabled:opacity-40 flex items-center justify-center hover:bg-gray-600 transition"
          aria-label="Next Day"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      <div className="text-gray-200 leading-relaxed overflow-y-auto  flex-1 ">
        {currentImg ? (
          <ul className="text-sm space-y-2">
            <li>
              <div className="font-semibold text-blue-200 mb-0.5">Image</div>
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className="whitespace-nowrap">{carouselIdx + 1} / {data.length}</span>
                <span className="inline-flex items-center  text-gray-400 ml-1 select-none whitespace-nowrap">
                  <svg className="w-3 h-3 mr-0.5 text-blue-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" /></svg>
                  Click image to zoom
                </span>
              </div>
            </li>
            <li>
              <div className="font-semibold text-blue-200 mb-0.5">Date</div>
              <div className="break-words">{currentImg.date}</div>
            </li>
            <li className="pt-2 border-gray-700 mt-2">
              <div className="break-words whitespace-pre-line">{currentImg.caption}</div>
            </li>
            <li>
              <div className="font-semibold text-blue-200 mb-0.5">Image Name</div>
              <div className="break-words">{currentImg.image}</div>
            </li>
            {currentImg.centroid_coordinates && (
              <li>
                <div className="font-semibold text-blue-200 mb-0.5">Centroid Coordinates</div>
                <div className="break-words">Lat: {currentImg.centroid_coordinates.lat}</div>
                <div className="break-words">Lon: {currentImg.centroid_coordinates.lon}</div>
                <a
                  href={`https://www.google.com/maps/@${currentImg.centroid_coordinates.lat},${currentImg.centroid_coordinates.lon},6z`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline mt-1 inline-block"
                >
                  View on Google Maps
                </a>
              </li>
            )}
          </ul>
        ) : (
          <div className="text-gray-400">No image selected.</div>
        )}
      </div>
    </div>
  );
};

export default EpicMetadataSection; 