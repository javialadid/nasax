import React from 'react';

const ChartContainer: React.FC<{ children: React.ReactNode; title: string; icon?: string }> = ({ children, title, icon }) => (
  <div
    className="w-full rounded-2xl shadow-xl p-2 sm:p-4 relative flex flex-col justify-between"
    style={{
      background: 'linear-gradient(135deg, #2d1a13 0%, #6e2e1e 100%)',
      border: '2px solid #b97a56',
      boxShadow: '0 4px 32px #ff4e1d22',
      overflow: 'hidden',
      minHeight: '300px', 
      maxHeight: '600px', 
      height: '35vh',
      margin: '0',
      padding: '0',
    }}
  >
    <div className="flex items-center gap-2 px-1 ml-1">
      {icon && <img src={icon} alt="icon" className="w-6 h-6 sm:w-7 sm:h-7" style={{ filter: 'drop-shadow(0 0 4px #ff4e1d)' }} />}
      <span className="text-base sm:text-lg font-bold tracking-wide text-orange-200 drop-shadow-md px-1" style={{ letterSpacing: 1 }}> {title} </span>
    </div>
    <div className="flex-1 min-h-0">{children}</div>
    <div className="absolute bottom-2 right-4 text-xs sm:text-xs text-orange-100/60 font-mono select-none pointer-events-none">Mars Weather</div>
  </div>
);

export default ChartContainer; 