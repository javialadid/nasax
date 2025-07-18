import { Routes, Route, Link, useLocation } from 'react-router-dom';

import DeepSpaceBackground from '@/components/DeepSpaceBackground';
import ApodView from '@/components/views/ApodView';
import EpicView from '@/components/views/EpicView';
import DonkiNotificationsView from '@/components/views/DonkiView';
import NasaRoversView from '@/components/views/RoversView';

import NasaCardApod from '@/components/NasaCardApod';
import NasaCardDonki from '@/components/NasaCardDonki';
import NasaCardEpic from '@/components/NasaCardEpic';
import NasaRoversCard from '@/components/NasaRoversCard';
import NasaCardInsight from '@/components/NasaCardInsight';

import ScrollableView from '@/components/ScrollableView';
import { NasaCardDataProvider } from '@/NasaCardDataContext';
import React, { Suspense } from 'react';
const logo = '/logo_nasax_alpha.png';

const LazyInsightView = React.lazy(() => import('@/components/views/InsightView'));

function App() {
  const location = useLocation();
  function getNavLabel(pathname: string) {
    if (pathname === '/apod') return 'Astronomy Picture of the Day';
    if (pathname === '/epic') return 'Earth Polychromatic Imaging Camera (EPIC)';
    if (pathname === '/rovers') return 'Mars Rovers: Latest Images';    
    if (pathname === '/insight') return 'Mars Weather';
    if (pathname === '/') return '';    
    return '';
  }
  return (    
    <NasaCardDataProvider>
      <DeepSpaceBackground />
      <div className="w-full text-[var(--color-text)] z-10 overflow-hidden flex flex-col h-screen min-h-0">
          {/* Top Pane */}
          <nav className="w-full h-12 sm:h-14 flex items-center justify-between px-2 sm:px-6 
          bg-transparent z-10 shadow-md relative" style={{backdropFilter: 'blur(2px)'}}>
            <div className="flex items-center gap-2 sm:gap-3 h-full">
              <Link to="/" className="flex items-center gap-2 sm:gap-3 h-full focus:outline-none lg:mt-3">
                <img
                  src={logo}
                  alt="NasaX"
                  className="h-8 sm:h-16 object-contain border border-gray-100/20 rounded landscape:h-6 sm:landscape:h-10"
                  style={{ minWidth: 64 }}
                />
                <span className="text-base sm:text-xl font-bold tracking-wide hidden lg:inline">NasaX</span>
              </Link>
            </div>
            {/* Centered navigation context */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
              <span className="text-sm sm:text-lg font-semibold text-white/90 landscape:text-xs sm:landscape:text-base">
              {getNavLabel(location.pathname)}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Dropdown menus will go here */}
              <div className="w-16 sm:w-24 h-7 sm:h-8 bg-gray-700/30 rounded text-xs sm:text-sm flex items-center justify-center text-gray-300 cursor-pointer landscape:w-12 sm:landscape:w-16 landscape:h-6 sm:landscape:h-7">
                  <Link to="/" className="flex items-center gap-2 sm:gap-3 h-full focus:outline-none">
                Home
                </Link>
              </div>            
            </div>
          </nav>
          {/* Main Content */}
          <main
            className="flex-1 flex flex-col items-center justify-between w-full overflow-hidden
            h-[calc(100vh-5rem)]"
          >
            <Routes>
              <Route path="/" element={
                <ScrollableView className="flex  justify-center">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 w-full max-w-5xl py-8">
                    <NasaCardApod/>
                    <NasaCardEpic />
                    <NasaCardDonki />
                    <NasaRoversCard />                  
                    <NasaCardInsight />                                      
                    <div className="hidden sm:block" />
                  </div>
                </ScrollableView>
              } />
              <Route path="/apod" element={<ApodView />} />
              <Route path="/epic" element={<EpicView />} />
              <Route path="/donki" element={<DonkiNotificationsView />} />
              <Route path="/rovers" element={<NasaRoversView />} />                        
              <Route path="/insight" element={
                <Suspense fallback={<div className="text-center text-lg text-gray-400">
                  Loading InSight Mars Weather...</div>}>
                  <LazyInsightView />
                </Suspense>
              } />
            </Routes>
          </main>
        </div>    
    </NasaCardDataProvider>
  );
}

export default App;
