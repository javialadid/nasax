import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useNasaCardData } from '@/context/NasaCardDataContext';
import { useApiWithBackoff, nasaApiFetch } from '@/hooks/useNasaApi';

const DEFAULT_IMAGE = '/rovers_card.png'; 
const DEFAULT_TITLE = 'Mars Rovers';
const ROVERS = ['perseverance', 'curiosity'];

const CARD_IMG_WIDTH = 400;
const CARD_IMG_HEIGHT = 300;

const NasaRoversCard: React.FC = () => {
  const { roversData, setRoversData } = useNasaCardData();

  // Fetcher for both rovers
  const fetchRovers = async () => {
    const results = await Promise.all(
      ROVERS.map(async rover => {
        const json = await nasaApiFetch(`mars-photos/api/v1/rovers/${rover}/latest_photos`);
        const photos = json.latest_photos || [];
        return { rover, photos };
      })
    );
    // Only keep valid entries
    const filtered = results.filter(r => r.photos && r.photos.length > 0 && r.photos[0].img_src);
    if (filtered.length === 0) throw new Error('No valid rover photos');
    return filtered;
  };

  const { data: fetchedRovers, loading } = useApiWithBackoff(
    fetchRovers,
    [],
    { enabled: roversData.length === 0 }
  );

  useEffect(() => {
    if (fetchedRovers && roversData.length === 0) {
      setRoversData(fetchedRovers);
    }
  }, [fetchedRovers, roversData.length, setRoversData]);

  // Pick a new random index only when roversData changes
  const randomIdx = useMemo(
    () => roversData.length > 0 ? Math.floor(Math.random() * roversData.length) : -1,
    [roversData]
  );

  const selectedEntry = randomIdx >= 0 ? roversData[randomIdx] : null;
  const show = !!(selectedEntry && Array.isArray(selectedEntry.photos) && selectedEntry.photos.length > 0);
  const image = show ? selectedEntry.photos[0].img_src : DEFAULT_IMAGE;
  const roverName = show ? selectedEntry.rover : '';

  // Remove broken images from the list
  const handleImgError = () => {
    if (show) {
      const filtered = roversData.filter((_, idx) => idx !== randomIdx);
      setRoversData(filtered);
    }
  };

  return (
    <Link to="/rovers" style={{ textDecoration: 'none' }}>
      <div
        className="card relative aspect-[4/3] w-full border-1 border-gray-500 rounded-xl overflow-hidden cursor-pointer shadow-lg group"
        tabIndex={0}
        role="button"
        aria-label={DEFAULT_TITLE}
        style={{ boxShadow: "-6px 7px 7px #ffffff0f" }}
      >
        <img
          src={loading ? DEFAULT_IMAGE : image}
          alt={DEFAULT_TITLE}
          width={CARD_IMG_WIDTH}
          height={CARD_IMG_HEIGHT}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          onError={handleImgError}
        />
        {/* Always show the default title at the top */}
        <div className="absolute top-0 left-0 w-full bg-black/60 text-white text-lg font-semibold px-3 py-2 text-center truncate z-10">
          {DEFAULT_TITLE}
        </div>
        {/* When loaded, show rover name at the bottom */}
        {show && !loading && (
          <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-100 text-xs px-3 py-2 text-center z-10">
            <div className="font-semibold text-base truncate">{roverName.charAt(0).toUpperCase() + roverName.slice(1)}</div>
            <div className="text-xs text-gray-300 mt-1">Latest Mars rover image</div>
          </div>
        )}
        {(!show && !loading) && (
          <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-100 text-xs px-3 py-2 text-center z-10">
            <div className="font-semibold text-base truncate"></div>
          </div>
        )}
        {loading && (
          <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-100 text-xs px-3 py-2 text-center z-10">
            <div className="font-semibold text-base truncate">Loading...</div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default NasaRoversCard; 