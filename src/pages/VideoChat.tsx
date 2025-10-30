import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Video, VideoOff, Mic, MicOff, PhoneOff, MessageCircle, UserPlus, SkipForward } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { supabase } from "@/integrations/supabase/client";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { useToast } from "@/components/ui/use-toast";

const VideoChat = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ text: string; sender: "me" | "them" }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [peerName, setPeerName] = useState<string>("Stranger");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const roomId = searchParams.get('room') || '';
  const peerId = searchParams.get('peer') || '';
  
  const { localStream, remoteStream, isConnected, startCall, endCall, toggleAudio, toggleVideo, sendChatMessage } = 
    useWebRTC(roomId, userId || '', (message) => {
      setMessages(prev => [...prev, { text: message, sender: "them" }]);
    });
  const { updateStatus } = useOnlinePresence(userId || undefined);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializeChat();
    
    return () => {
      handleEndCall();
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initializeChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    setUserId(user.id);

    // Get peer profile
    if (peerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', peerId)
        .maybeSingle();

      if (profile) {
        setPeerName(profile.display_name);
      }
    }

    // Start the call with the peer
    try {
      if (peerId) {
        await startCall(peerId);
        toast({
          title: "Connecting...",
          description: "Establishing video connection",
        });
      }
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Connection Error",
        description: "Failed to start video chat",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && sendChatMessage) {
      setMessages([...messages, { text: message, sender: "me" }]);
      sendChatMessage(message);
      setMessage("");
    }
  };

  const handleEndCall = async () => {
    endCall();
    await updateStatus('online');
    navigate("/swipe");
  };

  const handleToggleAudio = () => {
    const enabled = toggleAudio();
    setIsMuted(!enabled);
  };

  const handleToggleVideo = () => {
    const enabled = toggleVideo();
    setIsVideoOn(enabled);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-4">
        {/* Video Area */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Remote Video */}
          <Card className="relative aspect-video bg-secondary/50 border-2 border-border overflow-hidden group">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-float mb-4 mx-auto">
                    <span className="text-6xl text-white font-bold">{peerName.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="text-muted-foreground">Waiting for {peerName}...</p>
                </div>
              </div>
            )}
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-sm font-medium">{peerName}</span>
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            </div>
          </Card>

          {/* Local Video */}
          <Card className="relative aspect-video bg-secondary/50 border-2 border-primary/30 overflow-hidden">
            {localStream && isVideoOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover mirror"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-muted-foreground">Camera Off</div>
              </div>
            )}
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-sm font-medium">You</span>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4 p-6 rounded-2xl bg-card/80 backdrop-blur-lg border border-border">
          <Button
            size="lg"
            variant={isMuted ? "destructive" : "outline"}
            onClick={handleToggleAudio}
            className="w-14 h-14 rounded-full"
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <Button
            size="lg"
            variant={isVideoOn ? "outline" : "destructive"}
            onClick={handleToggleVideo}
            className="w-14 h-14 rounded-full"
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90"
          >
            <PhoneOff className="w-7 h-7" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowChat(!showChat)}
            className="w-14 h-14 rounded-full"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-14 h-14 rounded-full"
          >
            <UserPlus className="w-6 h-6" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full"
          >
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <Card className="p-4 border-border backdrop-blur-lg bg-card/90 animate-slide-up">
            <div className="space-y-4 h-48 overflow-y-auto mb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl ${
                      msg.sender === "me"
                        ? "bg-gradient-to-r from-primary to-accent text-white"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" className="bg-gradient-to-r from-primary to-accent">
                Send
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VideoChat;