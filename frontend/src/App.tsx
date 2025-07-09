
import NasaCardApod from './components/NasaCardApod';
import DeepSpaceBackground from './components/DeepSpaceBackground';
import NasaCard from './components/NasaCard';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ApodView from './components/ApodView';
const logo = '/logo-nasax2_192.png';

function App() {
  const location = useLocation();
  function getNavLabel(pathname: string) {
    if (pathname === '/apod') return 'Astronomy Picture of the Day';
    if (pathname === '/') return 'Home';
    // Add more routes as needed
    return '';
  }
  return (    
    <>
      <DeepSpaceBackground />
      <div className="min-h-screen  text-[var(--color-text)] z-10">
        {/* Top Pane */}
        <nav className="w-full h-14 flex items-center justify-between px-6 horizon-gradient bg-[#181c2f]/90 z-10 shadow-md relative" style={{backdropFilter: 'blur(2px)'}}>
          <div className="flex items-center gap-3 h-full">
            <Link to="/" className="flex items-center gap-3 h-full focus:outline-none">
              <img
                src={logo}
                alt="NasaX"
                className="h-16 object-contain"
                style={{ minWidth: 92 }}
              />
              <span className="text-xl font-bold tracking-wide">NasaX</span>
            </Link>
          </div>
          {/* Centered navigation context */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
            <span className="text-lg font-semibold text-white/90" style={{ color: 'bisque' }}
            >{getNavLabel(location.pathname)}</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Dropdown menus will go here */}
            <div className="w-24 h-8 bg-gray-700/30 rounded text-sm flex items-center justify-center text-gray-300 
              cursor-pointer">
                <Link to="/" className="flex items-center gap-3 h-full focus:outline-none">
              Home
              </Link>
            </div>            
          </div>
        </nav>
        {/* Main Content */}
        <main className="flex flex-col items-center justify-center pt-1 px-2 sm:px-6 md:px-12 w-full">
          <Routes>
            <Route path="/" element={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl" 
              style={{ minHeight: '90vh' }}>
                <NasaCardApod/>
                <NasaCard endpoint="" />
                
              </div>
            } />
            <Route path="/apod" element={<ApodView />} />
          </Routes>
        </main>
      </div>    
    </>
  );
}

export default App;
