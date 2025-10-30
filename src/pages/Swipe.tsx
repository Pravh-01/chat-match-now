import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { X, Heart, Video, MessageCircle, Settings, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMatching, Profile } from "@/hooks/useMatching";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { useToast } from "@/hooks/use-toast";

const Swipe = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { findMatches, createMatch, skipProfile } = useMatching(userId || undefined);
  const { onlineUsers, updateStatus } = useOnlinePresence(userId || undefined);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    setUserId(user.id);
    
    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      navigate('/profile-setup');
      return;
    }

    // Load matches
    await loadMatches();
    setIsLoading(false);
  };

  const loadMatches = async () => {
    const matches = await findMatches();
    setProfiles(matches);
  };

  const handleSwipe = async (swipeDirection: "left" | "right") => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    setDirection(swipeDirection);
    
    setTimeout(async () => {
      if (swipeDirection === "right") {
        const roomId = await createMatch(currentProfile.id);
        if (roomId) {
          await updateStatus('in_call');
          navigate(`/video-chat?room=${roomId}&peer=${currentProfile.id}`);
        }
      } else {
        await skipProfile(currentProfile.id);
        setDirection(null);
        if (currentIndex < profiles.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          await loadMatches();
          setCurrentIndex(0);
        }
      }
    }, 300);
  };

  const handleVideoChat = async () => {
    const currentProfile = profiles[currentIndex];
    if (currentProfile && userId) {
      const roomId = [userId, currentProfile.id].sort().join('-');
      await updateStatus('in_call');
      navigate(`/video-chat?room=${roomId}&peer=${currentProfile.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center">
        <div className="text-2xl font-bold">Loading matches...</div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ChatFlow
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Users className="w-4 h-4 mr-2 inline" />
              {onlineUsers.length} online
            </Badge>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          {currentProfile ? (
            <Card
              className={`relative overflow-hidden border-2 border-border backdrop-blur-lg bg-card/90 transition-all duration-300 ${
                direction === "left"
                  ? "animate-[slide-out-left_0.3s_ease-out] opacity-0"
                  : direction === "right"
                  ? "animate-[slide-out-right_0.3s_ease-out] opacity-0"
                  : "animate-scale-in"
              }`}
            >
              {/* Profile Image Placeholder */}
              <div className="h-96 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-6xl text-white font-bold">
                    {currentProfile.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold">
                    {currentProfile.display_name}, {currentProfile.age}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentProfile.interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant="secondary"
                      className="bg-primary/20"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <div className="text-center py-20">
              <p className="text-2xl font-bold mb-4">No more profiles!</p>
              <p className="text-muted-foreground mb-6">Check back later for new matches</p>
              <Button 
                onClick={loadMatches}
                className="bg-gradient-to-r from-primary to-accent"
              >
                Refresh Matches
              </Button>
            </div>
          )}

          {currentProfile && (
            <>
              {/* Action Buttons */}
              <div className="flex justify-center gap-6 mt-8">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleSwipe("left")}
                  className="w-16 h-16 rounded-full border-2 border-destructive/50 hover:bg-destructive/10"
                >
                  <X className="w-8 h-8 text-destructive" />
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleSwipe("right")}
                  className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <Heart className="w-10 h-10" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleVideoChat}
                  className="w-16 h-16 rounded-full border-2 border-primary/50 hover:bg-primary/10"
                >
                  <MessageCircle className="w-8 h-8 text-primary" />
                </Button>
              </div>

              <p className="text-center text-muted-foreground mt-8">
                Swipe right to connect • Left to skip
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Swipe;