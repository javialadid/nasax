
import NasaCardApod from './components/NasaCardApod';
import DeepSpaceBackground from './components/DeepSpaceBackground';
import NasaCardEpic from './components/NasaCardEpic';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ApodView from './components/ApodView';
import EpicView from './components/EpicView';
import NasaCardDonki from './components/NasaCardDonki';
import DonkiNotificationsView from './components/DonkiNotificationsView';
import NasaRoversCard from './components/NasaRoversCard';
import NasaRoversView from './components/views/NasaRoversView';
import ScrollableView from './components/ScrollableView';
const logo = '/logo-nasax2_192.png';

function App() {
  const location = useLocation();
  function getNavLabel(pathname: string) {
    if (pathname === '/apod') return 'Astronomy Picture of the Day';
    if (pathname === '/epic') return 'Earth Polychromatic Imaging Camera (EPIC)';
    if (pathname === '/rovers') return 'Mars Rovers: Latest Images';
    if (pathname === '/') return '';
    // Add more routes as needed
    return '';
  }
  return (    
    <>
      <DeepSpaceBackground />
      <div className="min-h-screen h-screen w-full text-[var(--color-text)] z-10 overflow-hidden flex flex-col">
        {/* Top Pane */}
        <nav className="w-full h-12 sm:h-14 flex items-center justify-between px-2 sm:px-6 horizon-gradient bg-[#181c2f]/90 z-10 shadow-md relative" style={{backdropFilter: 'blur(2px)'}}>
          <div className="flex items-center gap-2 sm:gap-3 h-full">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 h-full focus:outline-none">
              <img
                src={logo}
                alt="NasaX"
                className="h-8 sm:h-16 object-contain hidden sm:block"
                style={{ minWidth: 92 }}
              />
              <span className="text-base sm:text-xl font-bold tracking-wide">NasaX</span>
            </Link>
          </div>
          {/* Centered navigation context */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
            <span className="text-sm sm:text-lg font-semibold text-white/90" 
            >{getNavLabel(location.pathname)}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Dropdown menus will go here */}
            <div className="w-16 sm:w-24 h-7 sm:h-8 bg-gray-700/30 rounded text-xs sm:text-sm flex items-center justify-center text-gray-300 cursor-pointer">
                <Link to="/" className="flex items-center gap-2 sm:gap-3 h-full focus:outline-none">
              Home
              </Link>
            </div>            
          </div>
        </nav>
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center pt-1 px-1 sm:px-6  w-full min-h-0 overflow-hidden">
          <Routes>
            <Route path="/" element={
              <ScrollableView className="flex items-center justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 w-full max-w-5xl py-8">
                  <NasaCardApod/>
                  <NasaCardEpic />
                  <NasaCardDonki />
                  <NasaRoversCard />
                  {/* Add empty divs for 2x2 grid layout, or more cards in the future */}
                  <div className="hidden sm:block" />
                </div>
              </ScrollableView>
            } />
            <Route path="/apod" element={<ApodView />} />
            <Route path="/epic" element={<EpicView />} />
            <Route path="/donki" element={<DonkiNotificationsView />} />
            <Route path="/rovers" element={<NasaRoversView />} />
          </Routes>
        </main>
      </div>    
    </>
  );
}

export default App;
