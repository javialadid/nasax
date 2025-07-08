import React from 'react';
import NasaCardApod from './components/NasaCardApod';
import { PhotoProvider } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import DeepSpaceBackground from './components/DeepSpaceBackground';
import NasaCard from './components/NasaCard';
const logo = '/logo-nasax2_192.png';

function App() {
  return (
    <PhotoProvider maskOpacity={0.95}>
      <DeepSpaceBackground />
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        {/* Top Pane */}
        <nav className="w-full h-14 flex items-center justify-between px-6 horizon-gradient bg-[#181c2f]/90 z-10 shadow-md" style={{backdropFilter: 'blur(2px)'}}>
          <div className="flex items-center gap-3 h-full">
          <img
            src={logo}
            alt="NasaX"
            className="h-16 object-contain"
            style={{ minWidth: 92 }}
          />
            <span className="text-xl font-bold tracking-wide">NasaX</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Dropdown menus will go here */}
            <div className="w-24 h-8 bg-gray-700/30 rounded text-sm flex items-center justify-center text-gray-300 
              cursor-pointer">
              Menu 1
            </div>
            <div className="w-24 h-8 bg-gray-700/30 rounded text-sm flex items-center justify-center text-gray-300 
              cursor-pointer">
              Menu 2
            </div>
          </div>
        </nav>
        {/* Main Content */}
        <main className="flex flex-col items-center justify-center pt-8 px-2 sm:px-6 md:px-12 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl" style={{ minHeight: '80vh' }}>
            
              <NasaCardApod/>
              <NasaCard/>
            
          </div>
        </main>
      </div>
    </PhotoProvider>
  );
}

export default App;
