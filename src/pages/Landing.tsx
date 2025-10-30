import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Video, Users, Sparkles, MessageCircle } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Landing = () => {
  const navigate = useNavigate();

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
          <Button 
            variant="outline" 
            onClick={() => navigate("/auth")}
            className="border-primary/50 hover:bg-primary/10"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slide-up">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Meet New
                <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-float">
                  People Instantly
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                Connect with strangers worldwide through random video chats. Swipe, match, and start conversations in seconds.
              </p>
              <div className="flex gap-4 pt-4">
                <Button 
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="text-lg px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  Start Chatting
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 border-primary/50"
                >
                  How It Works
                </Button>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-3xl opacity-30 animate-glow" />
              <img 
                src={heroImage} 
                alt="Video chat experience" 
                className="relative rounded-3xl shadow-2xl border border-border"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">
            Why Choose ChatFlow?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Video className="w-8 h-8" />}
              title="Instant Video Matching"
              description="Get connected with random people in seconds. No waiting, just instant conversations."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8" />}
              title="Interest-Based Pairing"
              description="Match with people who share your interests. Music, art, gaming, and more."
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8" />}
              title="Smart Swipe Interface"
              description="Swipe right to connect, left to skip. Find your vibe with intuitive controls."
            />
            <FeatureCard 
              icon={<MessageCircle className="w-8 h-8" />}
              title="Text & Video Chat"
              description="Switch between video and text seamlessly during your conversations."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8" />}
              title="Add Friends"
              description="Had a great chat? Add them as friends and reconnect anytime."
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8" />}
              title="Safe & Secure"
              description="Advanced moderation and privacy features keep your experience safe."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Make New Friends?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of people connecting every day
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 ChatFlow. Connect with the world.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <div className="text-white">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Landing;