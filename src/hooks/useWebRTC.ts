import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  from: string;
  to: string;
}

export const useWebRTC = (roomId: string, userId: string, onChatMessage?: (message: string) => void) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const signalChannel = useRef<any>(null);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  const createPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(configuration);

    // Add local stream tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track');
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && signalChannel.current && peerId) {
        console.log('Sending ICE candidate to peer:', peerId);
        signalChannel.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'ice-candidate',
            data: event.candidate,
            from: userId,
            to: peerId,
          },
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      setIsConnected(pc.connectionState === 'connected');
    };

    peerConnection.current = pc;
    return pc;
  }, [userId, peerId]);

  const setupSignaling = useCallback(() => {
    const channel = supabase.channel(`room:${roomId}`);

    channel
      .on('broadcast', { event: 'signal' }, async (payload: any) => {
        const signal = payload.payload as SignalData;
        
        // Only process signals meant for this user
        if (signal.to !== userId) return;

        console.log('Received signal:', signal.type, 'from:', signal.from);

        if (!peerConnection.current) {
          console.error('No peer connection available');
          return;
        }

        try {
          if (signal.type === 'offer') {
            console.log('Processing offer...');
            setPeerId(signal.from); // Track who we're connecting with
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(signal.data)
            );
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            
            console.log('Sending answer...');
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: 'answer',
                data: answer,
                from: userId,
                to: signal.from,
              },
            });
          } else if (signal.type === 'answer') {
            console.log('Processing answer...');
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(signal.data)
            );
          } else if (signal.type === 'ice-candidate') {
            console.log('Adding ICE candidate...');
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(signal.data)
            );
          }
        } catch (error) {
          console.error('Error handling signal:', error);
        }
      })
      .on('broadcast', { event: 'chat' }, (payload: any) => {
        if (payload.payload.from !== userId && onChatMessage) {
          console.log('Received chat message:', payload.payload.message);
          onChatMessage(payload.payload.message);
        }
      })
      .subscribe((status) => {
        console.log('Channel subscription status:', status);
      });

    signalChannel.current = channel;
  }, [roomId, userId, onChatMessage]);

  const startCall = useCallback(async (targetPeerId: string) => {
    try {
      console.log('Starting call with peer:', targetPeerId);
      setPeerId(targetPeerId);
      const stream = await initializeMedia();
      const pc = createPeerConnection(stream);
      setupSignaling();

      // Wait for channel to be ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('Sending offer to peer:', targetPeerId);
      signalChannel.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'offer',
          data: offer,
          from: userId,
          to: targetPeerId,
        },
      });
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }, [initializeMedia, createPeerConnection, setupSignaling, userId]);

  const joinCall = useCallback(async () => {
    try {
      const stream = await initializeMedia();
      createPeerConnection(stream);
      setupSignaling();
    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  }, [initializeMedia, createPeerConnection, setupSignaling]);

  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (signalChannel.current) {
      supabase.removeChannel(signalChannel.current);
      signalChannel.current = null;
    }

    setRemoteStream(null);
    setIsConnected(false);
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }, [localStream]);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    localStream,
    remoteStream,
    isConnected,
    startCall,
    joinCall,
    endCall,
    toggleAudio,
    toggleVideo,
    sendChatMessage: (message: string) => {
      if (signalChannel.current) {
        signalChannel.current.send({
          type: 'broadcast',
          event: 'chat',
          payload: { message, from: userId },
        });
      }
    },
  };
};