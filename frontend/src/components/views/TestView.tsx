import React from 'react';

const ImageWithMetadata: React.FC = () => {
  return (
    <div className="p-4 h-[calc(100vh-4rem)] portrait:flex portrait:flex-col portrait:items-stretch landscape:flex landscape:items-start">
      {/* Image Section */}
      <div
        className="
          portrait:w-full portrait:mb-4 portrait:max-h-[60vh] portrait:flex-shrink-0
          landscape:flex-shrink-0 landscape:max-w-[75vw] landscape:h-full landscape:mr-4
        "
        style={{ verticalAlign: 'top' }}
      >
        <img
          src="https://apod.nasa.gov/apod/image/2507/LDN1251gualco2048.JPG"
          alt="NGC 2685 Galaxy"
          className="object-contain picture-shadow rounded-lg shadow-md max-h-full max-w-full mx-auto"
          style={{ display: 'block' }}
        />
      </div>

      {/* Metadata Section */}
      <div
        className="
          rounded-lg shadow-md bg-gray-900/80 p-4 overflow-y-auto
          portrait:w-full portrait:min-h-[25vh] portrait:max-h-[35vh] portrait:flex-grow
          landscape:flex-grow landscape:min-w-[25vh] landscape:max-h-[75vh]
        "
        style={{ verticalAlign: 'top' }}
      >
        <h2 className="text-2xl font-bold text-gray-600 mb-4">NGC 2685: The Helix Galaxy</h2>
        <div className="text-gray-500">
          <p><strong>Date:</strong> July 2025</p>
          <p><strong>Source:</strong> NASA APOD</p>
          <p><strong>Description:</strong> NGC 2685, also known as the Helix Galaxy, is a polar-ring galaxy located in the constellation Ursa Major. Its unique structure features a ring of stars, gas, and dust orbiting perpendicular to the main disk.</p>
        </div>
      </div>
    </div>
  );
};

export default ImageWithMetadata;