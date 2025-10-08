import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';

const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameId = useRef<number | undefined>(undefined);
  const [, setTime] = useState(0);

  useEffect(() => {
    const animate = () => {
      setTime(performance.now());
      animationFrameId.current = requestAnimationFrame(animate);
    };
    animationFrameId.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-700 flex items-center gap-4">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-sky-500 hover:bg-sky-600 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-gray-800"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className="flex-1">
        <p className="font-semibold text-sky-200">Tesla Coherence Emitter</p>
        <p className="text-xs text-gray-400">Broadcasting Schumann (7.83Hz) & Solfeggio (528Hz)</p>
        <div className="mt-2 flex items-center gap-1 h-6">
            {Array.from({ length: 30 }).map((_, i) => (
                <div 
                    key={i}
                    className="w-1 bg-sky-800 rounded-full transition-all duration-100"
                    style={{ 
                      height: `${Math.sin(i * 0.4 + (performance.now() / (isPlaying ? 200 : 800))) * (isPlaying ? 50 : 20) + (isPlaying ? 50 : 30)}%` 
                    }}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
