import React, { useRef, useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { Maximize2 } from 'lucide-react';

const VideoWindow = ({ session, matchUser, userId }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    startLocalVideo();
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setLocalStream(stream);
      
      // Initialize WebRTC connection
      const socket = getSocket();
      const roomId = `session_${session.id}`;
      socket.emit('join_room', { room_id: roomId, user_id: userId });
      
      // Listen for WebRTC signaling events
      socket.on('peer_joined', handlePeerJoined);
      socket.on('offer', handleOffer);
      socket.on('answer', handleAnswer);
      socket.on('ice_candidate', handleIceCandidate);
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const handlePeerJoined = (data) => {
    console.log('Peer joined:', data);
    // In production, create RTCPeerConnection and send offer
  };

  const handleOffer = (data) => {
    console.log('Received offer:', data);
    // In production, handle WebRTC offer
  };

  const handleAnswer = (data) => {
    console.log('Received answer:', data);
    // In production, handle WebRTC answer
  };

  const handleIceCandidate = (data) => {
    console.log('Received ICE candidate:', data);
    // In production, handle ICE candidate
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative bg-black rounded-3xl overflow-hidden aspect-video" data-testid="video-window">
      {/* Remote video (main) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
        data-testid="remote-video"
      />
      
      {/* Local video (pip) */}
      <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          data-testid="local-video"
        />
      </div>

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 left-4 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
        data-testid="fullscreen-button"
      >
        <Maximize2 className="w-5 h-5" />
      </button>

      {/* Match user info */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-full">
        <p className="text-sm font-medium">{matchUser?.name}, {matchUser?.age}</p>
      </div>
    </div>
  );
};

export default VideoWindow;
