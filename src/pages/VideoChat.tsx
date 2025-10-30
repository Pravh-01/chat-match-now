import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Video, VideoOff, Mic, MicOff, PhoneOff, MessageCircle, UserPlus, SkipForward } from "lucide-react";

const VideoChat = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ text: string; sender: "me" | "them" }[]>([
    { text: "Hey! Nice to meet you!", sender: "them" },
  ]);
  const navigate = useNavigate();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      setMessages([...messages, { text: message, sender: "me" }]);
      setMessage("");
    }
  };

  const handleEndCall = () => {
    navigate("/swipe");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-4">
        {/* Video Area */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Remote Video */}
          <Card className="relative aspect-video bg-secondary/50 border-2 border-border overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-float">
                <span className="text-6xl text-white font-bold">A</span>
              </div>
            </div>
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-sm font-medium">Alex, 24</span>
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            </div>
          </Card>

          {/* Local Video */}
          <Card className="relative aspect-video bg-secondary/50 border-2 border-primary/30 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              {isVideoOn ? (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <span className="text-5xl text-white font-bold">You</span>
                </div>
              ) : (
                <div className="text-muted-foreground">Camera Off</div>
              )}
            </div>
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
            onClick={() => setIsMuted(!isMuted)}
            className="w-14 h-14 rounded-full"
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <Button
            size="lg"
            variant={isVideoOn ? "outline" : "destructive"}
            onClick={() => setIsVideoOn(!isVideoOn)}
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