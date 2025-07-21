import { Routes, Route, Link, useLocation } from 'react-router-dom';

import DeepSpaceBackground from '@/components/DeepSpaceBackground';
import ApodView from '@/features/apod/ApodView';
import EpicView from '@/features/epic/EpicView';
import DonkiNotificationsView from '@/features/donki/DonkiView';
import NasaRoversView from '@/features/rovers/RoversView';

import NasaCardApod from '@/features/apod/NasaCardApod';
import NasaCardDonki from '@/features/donki/NasaCardDonki';
import NasaCardEpic from '@/features/epic/NasaCardEpic';
import NasaRoversCard from '@/features/rovers/NasaRoversCard';
import NasaCardInsight from '@/features/insight/NasaCardInsight';

import ScrollableView from '@/components/ScrollableView';
import { NasaCardDataProvider } from '@/context/NasaCardDataContext';
import React, { Suspense } from 'react';

import { useEffect } from 'react';
import { getGaMeasurementId } from './utils/env';

// Declare gtag on the window object for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const logo = '/logo_nasax_alpha.png';

const GA_MEASUREMENT_ID = getGaMeasurementId();

// only if we gave GA_MEASUREMENT_ID we send events
function usePageViews() {
  const location = useLocation();
  useEffect(() => {
    if (GA_MEASUREMENT_ID && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        send_to: GA_MEASUREMENT_ID,
      });
    }
  }, [location]);
}

const LazyInsightView = React.lazy(() => import('@/features/insight/InsightView'));

function App() {
  const location = useLocation();
  usePageViews();
  function getNavLabel(pathname: string) {
    if (pathname === '/apod') return 'Astronomy Picture of the Day';
    if (pathname === '/epic') return 'Earth Polychromatic Imaging Camera (EPIC)';
    if (pathname === '/rovers') return 'Mars Rovers: Latest Images';    
    if (pathname === '/insight') return 'Mars Weather';
    if (pathname === '/') return '';    
    return '';
  }
  const [showDropdown, setShowDropdown] = React.useState(false);
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('#explore-menu-button')) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);
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
              <h1 className="text-sm sm:text-lg font-semibold text-white/90 landscape:text-xs sm:landscape:text-base">
              {getNavLabel(location.pathname)}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 z-1500">
              {/* Dropdown menu for navigation */}
              <div className="relative">
                <button
                  className="w-24 h-8 bg-gray-700/30 rounded text-xs sm:text-sm flex items-center justify-center text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onClick={() => setShowDropdown((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={showDropdown ? 'true' : 'false'}
                  id="explore-menu-button"
                  type="button"
                >
                  Explore
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded shadow-lg z-[2000]"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="explore-menu-button"
                  >
                    <Link to="/" className="block px-4 py-2 text-gray-200 hover:bg-blue-600 hover:text-white" role="menuitem" onClick={() => setShowDropdown(false)}>Home</Link>
                    <Link to="/apod" className="block px-4 py-2 text-gray-200 hover:bg-blue-600 hover:text-white" role="menuitem" onClick={() => setShowDropdown(false)}>Astronomy Picture of the Day</Link>
                    <Link to="/epic" className="block px-4 py-2 text-gray-200 hover:bg-blue-600 hover:text-white" role="menuitem" onClick={() => setShowDropdown(false)}>EPIC Earth Images</Link>
                    <Link to="/donki" className="block px-4 py-2 text-gray-200 hover:bg-blue-600 hover:text-white" role="menuitem" onClick={() => setShowDropdown(false)}>DONKI Space Weather</Link>
                    <Link to="/rovers" className="block px-4 py-2 text-gray-200 hover:bg-blue-600 hover:text-white" role="menuitem" onClick={() => setShowDropdown(false)}>Mars Rovers</Link>
                    <Link to="/insight" className="block px-4 py-2 text-gray-200 hover:bg-blue-600 hover:text-white" role="menuitem" onClick={() => setShowDropdown(false)}>InSight Mars Weather</Link>
                  </div>
                )}
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
                  <div className="w-full max-w-5xl py-8">
                    <h1 className="text-xl font-bold mb-8 text-center">Welcome to NasaX – Explore NASA API Data, Images, and Missions</h1>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                      <NasaCardApod/>
                      <NasaCardEpic />
                      <NasaCardDonki />
                      <NasaRoversCard />                  
                      <NasaCardInsight />                                      
                      <div className="hidden sm:block" />
                    </div>
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
