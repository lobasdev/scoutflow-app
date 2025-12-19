import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Target,
  Check,
  Crown,
  Menu,
  X
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Temporarily disabled for preview - uncomment when done testing
  // useEffect(() => {
  //   if (!loading && user) {
  //     navigate("/dashboard", { replace: true });
  //   }
  // }, [user, loading, navigate]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

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
      {/* Sticky Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm" : "bg-transparent"
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-xl font-bold text-primary"
            >
              ScoutFlow
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection("features")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection("pricing")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </button>
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate("/auth")}>
                Start Free Trial
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border/50">
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => scrollToSection("features")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection("pricing")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Pricing
                </button>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => navigate("/auth")}>
                    Start Free Trial
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16">
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
                <Crown className="mr-2 h-5 w-5" />
                Start 7-Day Free Trial
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
      <div id="features" className="container mx-auto px-4 py-16 scroll-mt-20">
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

      {/* Pricing Section */}
      <div id="pricing" className="container mx-auto px-4 py-16 pb-24 scroll-mt-20">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-3">Simple Pricing</h3>
          <p className="text-muted-foreground">Start with a 7-day free trial.</p>
        </div>

        <Card className="max-w-md mx-auto border-primary/30">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Crown className="h-4 w-4" />
                Solo
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">€4.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                7-day free trial included
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                "Unlimited player profiles",
                "PDF report generation",
                "Voice notes & attachments",
                "Team opposition analysis",
                "Player comparison tools",
                "Tournament tracking",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              size="lg" 
              className="w-full text-lg py-6 rounded-xl"
              onClick={() => navigate("/auth")}
            >
              <Crown className="mr-2 h-5 w-5" />
              Start 7-Day Free Trial
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Cancel anytime.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ScoutFlow. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate("/terms-and-conditions")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Terms & Conditions
              </button>
              <button 
                onClick={() => navigate("/contact")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Contact
              </button>
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
    </div>
  );
};

export default Landing;
