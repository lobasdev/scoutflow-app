import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ClipboardList, 
  Trophy, 
  BarChart3, 
  FileText, 
  Mic,
  ChevronRight,
  Shield,
  Zap,
  Target
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Users,
      title: "Player Database",
      description: "Build comprehensive profiles with stats, observations, and transfer valuations"
    },
    {
      icon: ClipboardList,
      title: "Observation Tracking",
      description: "Record detailed match observations with skill ratings and notes"
    },
    {
      icon: Trophy,
      title: "Tournament Scouting",
      description: "Organize scouting trips with match schedules and player tracking"
    },
    {
      icon: BarChart3,
      title: "Team Analysis",
      description: "Build opposition reports with tactical insights and squad analysis"
    },
    {
      icon: FileText,
      title: "PDF Reports",
      description: "Generate professional scouting reports ready to share"
    },
    {
      icon: Mic,
      title: "Voice Notes",
      description: "Capture quick thoughts during matches with voice recordings"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />
        
        <div className="relative container mx-auto px-4 pt-12 pb-16">
          {/* Logo */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-primary mb-3 tracking-tight">
              ScoutFlow
            </h1>
            <p className="text-muted-foreground text-lg">
              Professional Football Scouting Platform
            </p>
          </div>

          {/* Hero Content */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              Your Complete
              <span className="text-primary"> Scouting </span>
              Toolkit
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Track players, record observations, analyze teams, and generate professional reports — all in one powerful platform built for scouts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 rounded-xl"
                onClick={() => navigate("/auth")}
              >
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 rounded-xl"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-3">Everything You Need</h3>
          <p className="text-muted-foreground">Powerful tools designed for professional scouts</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Secure Data</h4>
              <p className="text-sm text-muted-foreground">Your scouting intelligence stays private and protected</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Fast & Reliable</h4>
              <p className="text-sm text-muted-foreground">Works offline at the stadium, syncs when connected</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Built for Scouts</h4>
              <p className="text-sm text-muted-foreground">Designed by understanding real scouting workflows</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 pb-24">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Scout Smarter?</h3>
          <p className="text-muted-foreground mb-8">
            Join scouts who are already using ScoutFlow to discover and track talent.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-10 py-6 rounded-xl"
            onClick={() => navigate("/auth")}
          >
            Start Free Today
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ScoutFlow. All rights reserved.
            </div>
            <a 
              href="https://scoutflow.tech" 
              className="text-sm text-primary hover:underline"
            >
              scoutflow.tech
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
