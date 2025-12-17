import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, Volume2, VolumeX } from 'lucide-react';

const VideoChatSimulator = ({ matchUser, onTimeEnd }) => {
  const videoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Use a sample video for simulation
    // In production, this would be replaced with actual WebRTC
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log('Auto-play prevented:', e));
    }
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-3xl overflow-hidden aspect-video shadow-2xl"
      data-testid="video-simulator"
    >
      {/* Simulated Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        loop
        muted={isMuted}
        playsInline
      >
        <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
      </video>

      {/* Overlay with avatar and info */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#E056FD] flex items-center justify-center text-white text-5xl font-bold mb-4 shadow-2xl animate-pulse">
            {matchUser?.name?.[0]}
          </div>
          <p className="text-white text-2xl font-semibold">{matchUser?.name}, {matchUser?.age}</p>
          <p className="text-white/70">{matchUser?.city}</p>
        </div>
      </div>

      {/* Local video (pip) */}
      <div className="absolute bottom-4 right-4 w-32 h-24 rounded-xl overflow-hidden border-2 border-white/30 bg-gradient-to-br from-[#2C2C54] to-[#474787] shadow-xl">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1A73E8] to-[#6A9EFF] flex items-center justify-center text-white text-2xl font-bold">
            Вы
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 flex gap-3">
        <button
          onClick={toggleFullscreen}
          className="bg-black/50 hover:bg-black/75 text-white p-3 rounded-full transition-all backdrop-blur-sm"
          data-testid="fullscreen-button"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
        
        <button
          onClick={toggleMute}
          className="bg-black/50 hover:bg-black/75 text-white p-3 rounded-full transition-all backdrop-blur-sm"
          data-testid="mute-button"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Match user info */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full">
        <p className="text-sm font-medium">Видеочат с {matchUser?.name}</p>
      </div>

      {/* Connection status */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        Подключено
      </div>
    </div>
  );
};

export default VideoChatSimulator;
