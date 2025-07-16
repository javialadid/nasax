import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getApiBaseUrl } from '@/utils/env';
import { useNasaCardData } from '@/NasaCardDataContext';

const DEFAULT_IMAGE = '/rovers_card.png'; 
const DEFAULT_TITLE = 'Mars Rovers';
const ROVERS = ['perseverance', 'curiosity']; // Only use these two, bad pictures often in the other 2

const CARD_IMG_WIDTH = 400;
const CARD_IMG_HEIGHT = 300;

const NasaRoversCard: React.FC = () => {
  const { roversData, setRoversData } = useNasaCardData();
  const [loading, setLoading] = useState(roversData.length === 0);

  useEffect(() => {
    if (roversData.length > 0) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);
    function fetchWithBackoff(rover: string, delay = 1000, attempt = 0): Promise<{ rover: string; photo: any }> {
      return new Promise(resolve => {
        const doFetch = async () => {
          try {
            const res = await fetch(`${getApiBaseUrl()}/mars-photos/api/v1/rovers/${rover}/latest_photos`);
            const json = await res.json();
            const photo = json.latest_photos?.[0] || null;
            resolve({ rover, photo });
          } catch {
            const nextDelay = Math.min(delay + 1000, 60000);
            setTimeout(() => {
              fetchWithBackoff(rover, nextDelay, attempt + 1).then(resolve);
            }, delay);
          }
        };
        doFetch();
      });
    }
    Promise.all(
      ROVERS.map(rover => fetchWithBackoff(rover))
    ).then((results: { rover: string; photo: any }[]) => {
      if (!isMounted) return;
      const valid = results.filter((r: { rover: string; photo: any }) => r.photo && r.photo.img_src);
      setRoversData(valid);
      setLoading(false);
    });
    return () => { isMounted = false; };
  }, [roversData, setRoversData]);

  // Memoize randomIdx so it is stable for the same data
  const randomIdx = useMemo(() => {
    if (roversData.length > 0) {
      return Math.floor(Math.random() * roversData.length);
    }
    return null;
  }, [roversData]);

  const show = randomIdx !== null && roversData[randomIdx];
  const image = show ? roversData[randomIdx].photo.img_src : DEFAULT_IMAGE;
  const roverName = show ? roversData[randomIdx].rover : '';

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
            <div className="font-semibold text-base truncate">{roversData[randomIdx].rover.charAt(0).toUpperCase() + roversData[randomIdx].rover.slice(1)}</div>
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