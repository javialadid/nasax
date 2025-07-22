import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface TextToSpeechPlayerProps {
  text: string;
  className?: string;
  playButtonClassName?: string;
  stopButtonClassName?: string;
}

const TextToSpeechPlayer: React.FC<TextToSpeechPlayerProps> = ({ text, className = '', playButtonClassName, stopButtonClassName }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [rate, setRate] = useState(0.8); 
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const controlsRef = useRef<HTMLDivElement>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        
        // Try to find Google UK English Male as default
        const preferredVoice = availableVoices.findIndex(
          voice => voice.name === 'Google UK English Male' && voice.lang === 'en-GB'
        );
        
        if (preferredVoice !== -1) {
          setSelectedVoiceIndex(preferredVoice);
        } else {
          // Fall back to first English voice or just first voice
          const englishVoice = availableVoices.findIndex(voice => 
            voice.lang.startsWith('en')
          );
          setSelectedVoiceIndex(englishVoice !== -1 ? englishVoice : 0);
        }
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      if (utteranceRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (showSettings && controlsRef.current) {
      const rect = controlsRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Assume panel height ~200px
      let position: 'above' | 'below' = 'below';
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        position = 'above';
      }
      // Calculate style for fixed positioning
      const style: React.CSSProperties = {
        left: rect.left,
        width: rect.width,
        minWidth: 200,
        position: 'fixed',
        zIndex: 9999,
      };
      if (position === 'below') {
        style.top = rect.bottom;
      } else {
        style.bottom = window.innerHeight - rect.top;
      }
      setPanelStyle(style);
    }
  }, [showSettings]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        speechSynthesis.pause();
        setIsReading(false);
        setIsPaused(true);
      } else if (document.visibilityState === 'visible') {
        setIsReading(false);
        setIsPaused(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const speak = () => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsReading(true);
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    if (voices[selectedVoiceIndex]) {
      utterance.voice = voices[selectedVoiceIndex];
    }
    
    utterance.rate = rate;
    utterance.pitch = 1;
    // Volume change when playing is not supported, so just using a 
    // sensitive value here to avoid unpleasant loudness
    utterance.volume = 0.4; 

    utterance.onstart = () => {
      setIsReading(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utterance.onerror = () => {
      setIsReading(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utterance.onpause = () => {
      setIsPaused(true);
      setIsReading(false);
    };

    speechSynthesis.speak(utterance);
  };

  const pause = () => {
    speechSynthesis.pause();
    setIsPaused(true);
    setIsReading(false);
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
    utteranceRef.current = null;
  };

  const handlePlayPause = () => {
    if (isReading) {
      pause();
    } else if (isPaused) {
      speak();
    } else {
      speak();
    }
  };

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Controls Row: Play/Pause, Stop, Settings */}
      <div ref={controlsRef} className="flex flex-row items-center gap-1 mb-2">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className={
            playButtonClassName ||
            "px-1.5 py-0.5 rounded bg-blue-700 hover:bg-blue-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
          }
          aria-label={isReading ? 'Pause reading' : isPaused ? 'Resume reading' : 'Start reading'}
          disabled={!text || voices.length === 0}
        >
          {isReading ? (
            // Pause icon
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 4a1 1 0 011 1v10a1 1 0 01-2 0V5a1 1 0 011-1zM14 4a1 1 0 011 1v10a1 1 0 01-2 0V5a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          ) : (
            // Play icon
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a1 1 0 011.707-.707l8 8a1 1 0 010 1.414l-8 8A1 1 0 014 19V3z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Stop Button - always visible, compact */}
        <button
          onClick={stop}
          className={
            stopButtonClassName ||
            "px-1.5 py-0.5 rounded text-white bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
          }
          aria-label="Stop reading"
          disabled={!isReading && !isPaused}
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 4a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H6z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Settings Button - always visible, smallest */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-0.5 py-0 rounded bg-gray-600 hover:bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors flex items-center justify-center"
          aria-label="Text-to-speech settings"
          style={{ width: '20px', height: '20px', minWidth: 'unset' }}
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      {/* Place for title below this row if needed */}

      {/* Settings Panel */}
      {showSettings && controlsRef.current && ReactDOM.createPortal(
        <div
          className="bg-gray-700 border border-gray-600 rounded-lg shadow-xl p-2 min-w-[200px] text-xs"
          style={panelStyle}
        >
          <div className="mb-3">
            <label htmlFor="voices" className="block mb-1 font-semibold text-blue-200 text-xs">Voice</label>
            <select name="voices"
              className="w-full p-1 rounded bg-gray-800 text-white border border-gray-600 focus:border-blue-400 focus:outline-none text-xs"
              value={selectedVoiceIndex}
              onChange={(e) => {
                const index = parseInt(e.target.value);
                setSelectedVoiceIndex(index);                
              }}
            >
              {voices.map((voice, index) => (
                <option key={index} value={index}>
                  {voice.name} {voice.localService ? '(Local)' : '(Cloud)'}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block mb-1 font-semibold text-blue-200 text-xs">Speed</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-2"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>0.5x</span>
              <span className="font-semibold text-blue-300">{rate}x</span>
              <span>2x</span>
            </div>
          </div>

          <button
            className="w-full px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors text-xs"
            onClick={() => setShowSettings(false)}
          >
            Close Settings
          </button>
        </div>,
        document.body
      )}
      {/* Status indicator */}
    </div>
  );
};
export default TextToSpeechPlayer;
