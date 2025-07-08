import React from 'react';
import { firstSentence } from '../utils/stringutil';

const Card: React.FC<{ data: any; onClick: () => void }> = ({ data, onClick }) => (
  <div
    className="card relative aspect-[4/3] w-full border-1 border-gray-500 rounded-xl overflow-hidden cursor-pointer shadow-lg group"
    onClick={onClick}    
    role="button"
    tabIndex={0}
    style={{ boxShadow: "-6px 7px 7px #ffffff0f"  }}
  >
    <img
      src={data.url}
      alt={data.title}
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div className="absolute top-0 left-0 w-full bg-black/60 text-white text-lg font-semibold px-3 py-2 text-center truncate z-10">
      {data.title}
    </div>
    <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-300 text-xs px-3 py-2 text-center z-10 line-clamp-2">
      {`${firstSentence(data.explanation)}..`}
    </div>
  </div>
);

export default Card;
