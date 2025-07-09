import React from 'react';

const SpinnerOverlay: React.FC = () => (
  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 pointer-events-none">
    <svg className="animate-spin h-16 w-16 text-blue-300" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  </div>
);

export default SpinnerOverlay; 