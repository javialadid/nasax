import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNasaApi } from '@/hooks/useNasaApi';
import { useNasaCardData } from '@/context/NasaCardDataContext';

const DEFAULT_IMAGE = '/epic_card_hd.png';
const DEFAULT_TITLE = 'EPIC';
const DEFAULT_SUBTITLE = 'Earth Polychromatic Imaging Camera';
const DEFAULT_SECONDARY = 'Watch the earth rotating';

const NasaCardEpic: React.FC = () => {
  const { availableEpicDates, setAvailableEpicDates } = useNasaCardData();
  const shouldFetch = availableEpicDates.length === 0;
  const { data, loading, error } = useNasaApi('EPIC/api/natural/available', {}, { enabled: shouldFetch });

  useEffect(() => {
    if (shouldFetch && Array.isArray(data) && data.length > 0) {
      setAvailableEpicDates(data);
    }
  }, [shouldFetch, data, setAvailableEpicDates]);

  return (
    <Link to="/epic" style={{ textDecoration: 'none' }}>
      <div
        className="card relative aspect-[4/3] w-full border-1 border-gray-500 rounded-xl overflow-hidden cursor-pointer shadow-lg group"
        tabIndex={0}
        role="button"
        aria-label={DEFAULT_TITLE}
        style={{ boxShadow: "-6px 7px 7px #ffffff0f" }}
      >
        <img
          src={DEFAULT_IMAGE}
          alt={DEFAULT_TITLE}
          className="absolute inset-0 w-full h-full p-2 object-contain"
          loading="eager"
        />
        {/* Always show the default title at the top */}
        <h2 className="absolute top-0 left-0 w-full bg-black/60 text-white text-lg font-semibold px-3 py-2 text-center truncate z-0">
          {DEFAULT_TITLE}
        </h2>
        {/* Subtitle at the bottom, similar to NasaCardApod */}
        <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-200 px-3 py-2 text-center z-0">
          <div className="font-semibold text-base truncate">{DEFAULT_SUBTITLE}</div>
          <div className="text-xs text-gray-300 mt-1">{DEFAULT_SECONDARY}</div>
        </div>
      </div>
    </Link>
  );
};

export default NasaCardEpic; 