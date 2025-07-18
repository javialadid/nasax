import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNasaApi } from '@/hooks/useNasaApi';

const DEFAULT_IMAGE = '/mars-weather.jpg';
const DEFAULT_TITLE = 'InSight Mars Weather';
const CARD_IMG_WIDTH = 400;
const CARD_IMG_HEIGHT = 300;
const API_ENDPOINT = 'insight_weather/';
const API_PARAMS = { feedtype: 'json', ver: '1.0' };

const NasaCardInsight: React.FC = () => {
  const { data, loading, error } = useNasaApi(API_ENDPOINT, API_PARAMS);
  // The API returns a sol-indexed object, get the latest sol
  let latestSol = null;
  let latestData = null;
  if (data && data.sol_keys && data.sol_keys.length > 0) {
    latestSol = data.sol_keys[data.sol_keys.length - 1];
    latestData = data[latestSol];
  }
  const cardSubtitle = latestData
    ? `Sol ${latestSol}: Temp ${latestData.AT?.av ?? '?'}°C, Wind ${latestData.HWS?.av ?? '?'} m/s, Pressure ${latestData.PRE?.av ?? '?'} Pa`
    : 'No data';
  return (
    <Link to="/insight" style={{ textDecoration: 'none' }}>
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
          width={CARD_IMG_WIDTH}
          height={CARD_IMG_HEIGHT}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute top-0 left-0 w-full bg-black/60 text-white text-lg font-semibold px-3 py-2 text-center truncate z-10">
          {DEFAULT_TITLE}
        </div>
        <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-100 text-xs px-3 py-2 text-center z-10">
          <div className="text-xs text-gray-300 mt-1">{cardSubtitle}</div>
        </div>
        {loading && (
          <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-100 text-xs px-3 py-2 text-center z-10">
            <div className="font-semibold text-base truncate">Loading...</div>
          </div>
        )}
        {error && !loading && (
          <div className="absolute bottom-0 left-0 w-full bg-black/70 text-red-400 text-xs px-3 py-2 text-center z-10">
            <div className="font-semibold text-base truncate">{typeof error === 'object' && 'message' in error ? error.message : String(error)}</div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default NasaCardInsight; 