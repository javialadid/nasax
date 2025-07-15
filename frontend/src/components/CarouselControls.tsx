import React from 'react';

interface CarouselControlsProps {
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  playbackSpeed: number;
  setPlaybackSpeed: React.Dispatch<React.SetStateAction<number>>;
  playbackSpeedMin: number;
  playbackSpeedMax: number;
}

const CarouselControls: React.FC<CarouselControlsProps> = ({
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  playbackSpeedMin,
  playbackSpeedMax,
}) => {
  return (
    <div className="z-50 absolute bottom-4 right-4 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
      <button
        onClick={() => setIsPlaying(p => !p)}
        className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <div className="flex flex-col items-center text-xs text-white bg-black bg-opacity-50 rounded px-2 py-1">
        <label htmlFor="carousel-speed" className="mb-1">Speed</label>
        <input
          id="carousel-speed"
          type="range"
          min={playbackSpeedMin}
          max={playbackSpeedMax}
          step={50}
          value={playbackSpeedMax - (playbackSpeed - playbackSpeedMin)}
          onChange={e => {
            const sliderValue = Number(e.target.value);
            setPlaybackSpeed(playbackSpeedMax - (sliderValue - playbackSpeedMin));
          }}
          className="w-20"
          aria-label="Playback speed"
        />
      </div>
    </div>
  );
};

export default CarouselControls; 