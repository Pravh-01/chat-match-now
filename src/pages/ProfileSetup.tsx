import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Music, Gamepad2, Palette, Plane, Book, Coffee } from "lucide-react";

const INTERESTS = [
  { id: "music", label: "Music", icon: Music },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "art", label: "Art", icon: Palette },
  { id: "travel", label: "Travel", icon: Plane },
  { id: "books", label: "Books", icon: Book },
  { id: "coffee", label: "Coffee", icon: Coffee },
];

const ProfileSetup = () => {
  const [age, setAge] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleContinue = () => {
    if (!age || selectedInterests.length === 0) {
      toast({
        title: "Almost there!",
        description: "Please enter your age and select at least one interest.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Profile complete!",
      description: "Let's start matching...",
    });

    setTimeout(() => navigate("/swipe"), 1000);
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
          >
            Start Matching
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;