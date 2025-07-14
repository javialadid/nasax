import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBaseUrl } from '../utils/env';

const DEFAULT_IMAGE = '/rovers_card.png'; // Place a default image in public/
const DEFAULT_TITLE = 'Mars Rovers';
const ROVERS = ['perseverance', 'curiosity', 'opportunity', 'spirit'];

const CARD_IMG_WIDTH = 400;
const CARD_IMG_HEIGHT = 300;

const NasaRoversCard: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [randomIdx, setRandomIdx] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all(
      ROVERS.map(async rover => {
        try {
          const res = await fetch(`${getApiBaseUrl()}/mars-photos/api/v1/rovers/${rover}/latest_photos`);
          const json = await res.json();
          const photo = json.latest_photos?.[0] || null;
          return { rover, photo };
        } catch {
          return { rover, photo: null };
        }
      })
    ).then(results => {
      if (!isMounted) return;
      const valid = results.filter(r => r.photo);
      setImages(valid);
      setRandomIdx(valid.length > 0 ? Math.floor(Math.random() * valid.length) : null);
      setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const show = randomIdx !== null && images[randomIdx];
  const image = show ? images[randomIdx].photo.img_src : DEFAULT_IMAGE;
  const roverName = show ? images[randomIdx].rover : '';

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
          onError={e => { e.currentTarget.src = DEFAULT_IMAGE; }}
        />
        {/* Always show the default title at the top */}
        <div className="absolute top-0 left-0 w-full bg-black/60 text-white text-lg font-semibold px-3 py-2 text-center truncate z-10">
          {DEFAULT_TITLE}
        </div>
        {/* When loaded, show rover name at the bottom */}
        {show && !loading && (
          <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-100 text-xs px-3 py-2 text-center z-10">
            <div className="font-semibold text-base truncate">{images[randomIdx].rover.charAt(0).toUpperCase() + images[randomIdx].rover.slice(1)}</div>
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