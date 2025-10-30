import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Music, Gamepad2, Palette, Plane, Book, Coffee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const INTERESTS = [
  { id: "music", label: "Music", icon: Music },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "art", label: "Art", icon: Palette },
  { id: "travel", label: "Travel", icon: Plane },
  { id: "books", label: "Books", icon: Book },
  { id: "coffee", label: "Coffee", icon: Coffee },
];

const ProfileSetup = () => {
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
    }
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleContinue = async () => {
    if (!displayName || !age || selectedInterests.length === 0) {
      toast({
        title: "Almost there!",
        description: "Please fill in all fields and select at least one interest.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        display_name: displayName,
        age: parseInt(age),
        interests: selectedInterests,
      });

      if (error) throw error;

      toast({
        title: "Profile created!",
        description: "Welcome to ChatFlow",
      });

      navigate("/swipe");
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary p-6">
      <Card className="w-full max-w-2xl border-border backdrop-blur-lg bg-card/80 animate-scale-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">Complete Your Profile</CardTitle>
          <CardDescription>Tell us a bit about yourself to find better matches</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-lg">What's your name?</Label>
            <Input
              id="name"
              type="text"
              placeholder="Alex"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age" className="text-lg">How old are you?</Label>
            <Input
              id="age"
              type="number"
              placeholder="18"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="18"
              max="100"
              className="text-lg"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-lg">What are your interests?</Label>
            <p className="text-sm text-muted-foreground">Select all that apply</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INTERESTS.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant="outline"
                  onClick={() => toggleInterest(id)}
                  className={`h-auto py-4 flex flex-col gap-2 ${
                    selectedInterests.includes(id)
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span>{label}</span>
                </Button>
              ))}
            </div>
            {selectedInterests.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedInterests.map(id => (
                  <Badge key={id} variant="secondary" className="bg-primary/20">
                    {INTERESTS.find(i => i.id === id)?.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-primary to-accent text-lg py-6"
            disabled={isLoading}
          >
            {isLoading ? "Creating Profile..." : "Start Matching"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;