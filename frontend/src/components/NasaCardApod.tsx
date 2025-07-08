import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../utils/env';
import { getEasternDateString } from '../utils/dateutil'; // extracted helper
import Card from './Card';
import FullscreenModal from './FullscreenModal';

const NasaCardApod: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const date = getEasternDateString();
      const res = await fetch(`${getApiBaseUrl()}/api/planetary/apod?date=${date}`);
      const json = await res.json();
      setData(json);
    };
    fetchData();
  }, []);

  if (!data) {
    return (
      <div className="aspect-[4/3] w-full flex items-center justify-center bg-white/10 rounded-xl text-2xl">
        Loading...
      </div>
    );
  }

  return (
    <>
      {!isOpen && <Card data={data} onClick={() => setIsOpen(true)} /> }
      {isOpen && <FullscreenModal data={data} onClose={() => setIsOpen(false)} />}
    </>
  );
};

export default NasaCardApod;
