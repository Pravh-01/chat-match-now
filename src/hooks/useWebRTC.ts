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
  const iceCandidateQueue = useRef<RTCIceCandidate[]>([]);
  const currentPeerId = useRef<string | null>(null);

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
    console.log('=== CREATING PEER CONNECTION ===');
    const pc = new RTCPeerConnection(configuration);

    // Add local stream tracks to peer connection
    console.log('Adding local tracks:', stream.getTracks().length);
    stream.getTracks().forEach((track) => {
      console.log('Adding track:', track.kind, track.label);
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('=== RECEIVED REMOTE TRACK ===');
      console.log('Track kind:', event.track.kind);
      console.log('Track label:', event.track.label);
      console.log('Streams:', event.streams.length);
      
      if (event.streams[0]) {
        console.log('Setting remote stream with tracks:', event.streams[0].getTracks().length);
        event.streams[0].getTracks().forEach(track => {
          console.log('Remote track:', track.kind, track.enabled, track.readyState);
        });
        setRemoteStream(event.streams[0]);
        console.log('✓ Remote stream set');
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('=== NEW ICE CANDIDATE ===');
        console.log('Candidate:', event.candidate.candidate);
        console.log('Target peer:', currentPeerId.current);
        
        if (signalChannel.current && currentPeerId.current) {
          signalChannel.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'ice-candidate',
              data: event.candidate,
              from: userId,
              to: currentPeerId.current,
            },
          });
          console.log('✓ ICE candidate sent');
        } else {
          console.log('⚠️ Cannot send ICE candidate - channel or peer ID not ready');
        }
      } else {
        console.log('ICE gathering complete (null candidate)');
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('=== CONNECTION STATE CHANGE ===');
      console.log('State:', pc.connectionState);
      setIsConnected(pc.connectionState === 'connected');
      
      if (pc.connectionState === 'failed') {
        console.error('❌ Connection failed');
      } else if (pc.connectionState === 'disconnected') {
        console.warn('⚠️ Connection disconnected');
      }
    };
    
    // Additional handlers for debugging
    pc.oniceconnectionstatechange = () => {
      console.log('=== ICE CONNECTION STATE ===');
      console.log('State:', pc.iceConnectionState);
    };
    
    pc.onicegatheringstatechange = () => {
      console.log('=== ICE GATHERING STATE ===');
      console.log('State:', pc.iceGatheringState);
    };
    
    pc.onsignalingstatechange = () => {
      console.log('=== SIGNALING STATE ===');
      console.log('State:', pc.signalingState);
    };

    peerConnection.current = pc;
    console.log('✓ Peer connection created');
    return pc;
  }, [userId]);

  const setupSignaling = useCallback(() => {
    console.log('=== SETTING UP SIGNALING ===');
    console.log('Room ID:', roomId);
    console.log('User ID:', userId);
    
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'signal' }, async (payload: any) => {
        const signal = payload.payload as SignalData;
        
        console.log('=== RECEIVED SIGNAL ===');
        console.log('Signal Type:', signal.type);
        console.log('From:', signal.from);
        console.log('To:', signal.to);
        console.log('Current User:', userId);
        
        // Only process signals meant for this user
        if (signal.to !== userId) {
          console.log('⚠️ Signal not for me, ignoring');
          return;
        }

        console.log('✓ Signal is for me, processing...');

        if (!peerConnection.current) {
          console.error('❌ No peer connection available');
          return;
        }
        
        console.log('Peer Connection State:', peerConnection.current.signalingState);
        console.log('ICE Connection State:', peerConnection.current.iceConnectionState);
        console.log('ICE Gathering State:', peerConnection.current.iceGatheringState);

        try {
          if (signal.type === 'offer') {
            console.log('=== PROCESSING OFFER ===');
            setPeerId(signal.from);
            currentPeerId.current = signal.from;
            
            console.log('Setting remote description (offer)...');
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(signal.data)
            );
            console.log('✓ Remote description set');
            
            // Process any queued ICE candidates
            console.log(`Processing ${iceCandidateQueue.current.length} queued ICE candidates`);
            while (iceCandidateQueue.current.length > 0) {
              const candidate = iceCandidateQueue.current.shift()!;
              console.log('Adding queued ICE candidate:', candidate.candidate);
              await peerConnection.current.addIceCandidate(candidate);
            }
            
            console.log('Creating answer...');
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            console.log('✓ Answer created and set as local description');
            
            console.log('=== SENDING ANSWER ===');
            console.log('To:', signal.from);
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
            console.log('✓ Answer sent');
            
          } else if (signal.type === 'answer') {
            console.log('=== PROCESSING ANSWER ===');
            console.log('Current signaling state:', peerConnection.current.signalingState);
            
            if (peerConnection.current.signalingState !== "stable") {
              console.log('Setting remote description (answer)...');
              await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(signal.data)
              );
              console.log('✓ Remote description set');
              
              // Process any queued ICE candidates
              console.log(`Processing ${iceCandidateQueue.current.length} queued ICE candidates`);
              while (iceCandidateQueue.current.length > 0) {
                const candidate = iceCandidateQueue.current.shift()!;
                console.log('Adding queued ICE candidate:', candidate.candidate);
                await peerConnection.current.addIceCandidate(candidate);
              }
            } else {
              console.log('⚠️ Already in stable state, ignoring answer');
            }
            
          } else if (signal.type === 'ice-candidate') {
            console.log('=== PROCESSING ICE CANDIDATE ===');
            console.log('Candidate:', signal.data.candidate);
            const candidate = new RTCIceCandidate(signal.data);
            
            if (peerConnection.current.remoteDescription) {
              console.log('Adding ICE candidate immediately');
              await peerConnection.current.addIceCandidate(candidate);
              console.log('✓ ICE candidate added');
            } else {
              console.log('⚠️ Queueing ICE candidate (no remote description yet)');
              iceCandidateQueue.current.push(candidate);
              console.log('Queue length:', iceCandidateQueue.current.length);
            }
          }
        } catch (error) {
          console.error('❌ Error handling signal:', error);
        }
      })
      .on('broadcast', { event: 'chat' }, (payload: any) => {
        if (payload.payload.from !== userId && onChatMessage) {
          console.log('=== RECEIVED CHAT MESSAGE ===');
          console.log('Message:', payload.payload.message);
          onChatMessage(payload.payload.message);
        }
      })
      .subscribe((status) => {
        console.log('=== CHANNEL SUBSCRIPTION STATUS ===');
        console.log('Status:', status);
        console.log('Room:', roomId);
        if (status === 'SUBSCRIBED') {
          console.log('✓ Successfully subscribed to room');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel subscription error');
        }
      });

    signalChannel.current = channel;
    return channel;
  }, [roomId, userId, onChatMessage]);

  const startCall = useCallback(async (targetPeerId: string) => {
    try {
      console.log('========================================');
      console.log('=== STARTING CALL (INITIATOR ROLE) ===');
      console.log('========================================');
      console.log('Target Peer ID:', targetPeerId);
      console.log('My User ID:', userId);
      console.log('Room ID:', roomId);
      
      setPeerId(targetPeerId);
      currentPeerId.current = targetPeerId;
      
      console.log('Step 1: Initializing media...');
      const stream = await initializeMedia();
      console.log('✓ Media initialized:', stream.getTracks().length, 'tracks');
      
      console.log('Step 2: Creating peer connection...');
      const pc = createPeerConnection(stream);
      
      console.log('Step 3: Setting up signaling channel...');
      const channel = setupSignaling();
      
      console.log('Step 4: Waiting for channel subscription...');
      await new Promise<void>((resolve) => {
        const unsubscribe = channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✓ Channel ready');
            resolve();
          }
        });
      });

      console.log('Step 5: Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('✓ Offer created and set as local description');
      console.log('Offer SDP:', offer.sdp?.substring(0, 100) + '...');

      console.log('=== SENDING OFFER ===');
      console.log('To:', targetPeerId);
      channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'offer',
          data: offer,
          from: userId,
          to: targetPeerId,
        },
      });
      console.log('✓ Offer sent successfully');
      console.log('========================================');
    } catch (error) {
      console.error('❌ ERROR STARTING CALL:', error);
      throw error;
    }
  }, [initializeMedia, createPeerConnection, setupSignaling, userId, roomId]);

  const joinCall = useCallback(async () => {
    try {
      console.log('========================================');
      console.log('=== JOINING CALL (ANSWERER ROLE) ===');
      console.log('========================================');
      console.log('My User ID:', userId);
      console.log('Room ID:', roomId);
      
      console.log('Step 1: Initializing media...');
      const stream = await initializeMedia();
      console.log('✓ Media initialized:', stream.getTracks().length, 'tracks');
      
      console.log('Step 2: Creating peer connection...');
      const pc = createPeerConnection(stream);
      
      console.log('Step 3: Setting up signaling channel...');
      const channel = setupSignaling();
      
      console.log('Step 4: Waiting for channel subscription...');
      await new Promise<void>((resolve) => {
        const unsubscribe = channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✓ Channel ready');
            resolve();
          }
        });
      });
      
      console.log('✓ Ready to receive offer');
      console.log('========================================');
    } catch (error) {
      console.error('❌ ERROR JOINING CALL:', error);
      throw error;
    }
  }, [initializeMedia, createPeerConnection, setupSignaling, userId, roomId]);

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