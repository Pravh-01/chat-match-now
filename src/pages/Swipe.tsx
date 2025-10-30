import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { X, Heart, Video, MessageCircle, Settings } from "lucide-react";

const MOCK_PROFILES = [
  {
    id: 1,
    name: "Alex",
    age: 24,
    interests: ["Music", "Travel", "Art"],
    bio: "Love exploring new places and meeting interesting people!",
  },
  {
    id: 2,
    name: "Sam",
    age: 22,
    interests: ["Gaming", "Coffee", "Books"],
    bio: "Gamer by night, coffee enthusiast by day ☕",
  },
  {
    id: 3,
    name: "Jordan",
    age: 26,
    interests: ["Art", "Music", "Travel"],
    bio: "Artist looking to connect with creative minds",
  },
];

const Swipe = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const navigate = useNavigate();

  const currentProfile = MOCK_PROFILES[currentIndex];

  const handleSwipe = (swipeDirection: "left" | "right") => {
    setDirection(swipeDirection);
    setTimeout(() => {
      if (swipeDirection === "right") {
        // Simulate match - go to video chat
        navigate("/video-chat");
      } else {
        setDirection(null);
        if (currentIndex < MOCK_PROFILES.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setCurrentIndex(0);
        }
      }
    }, 300);
  };

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
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          {currentProfile && (
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
                    {currentProfile.name.charAt(0)}
                  </span>
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold">
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  <p className="text-muted-foreground mt-2">{currentProfile.bio}</p>
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
          )}

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
              onClick={() => navigate("/video-chat")}
              className="w-16 h-16 rounded-full border-2 border-primary/50 hover:bg-primary/10"
            >
              <MessageCircle className="w-8 h-8 text-primary" />
            </Button>
          </div>

          <p className="text-center text-muted-foreground mt-8">
            Swipe right to connect • Left to skip
          </p>
        </div>
      </div>
    </div>
  );
};

export default Swipe;