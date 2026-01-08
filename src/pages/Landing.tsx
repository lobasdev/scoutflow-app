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
  Shield,
  Zap,
  Target,
  Check,
  Crown,
  Menu,
  X,
  Star,
  ArrowRight,
  Sparkles
} from "lucide-react";
import heroImage from "@/assets/hero-scouting.jpg";

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
      description: "Build comprehensive profiles with stats, observations, and transfer valuations",
      gradient: "from-violet-500 to-purple-600"
    },
    {
      icon: ClipboardList,
      title: "Observation Tracking",
      description: "Record detailed match observations with skill ratings and notes",
      gradient: "from-pink-500 to-rose-600"
    },
    {
      icon: Trophy,
      title: "Tournament Scouting",
      description: "Organize scouting trips with match schedules and player tracking",
      gradient: "from-amber-500 to-orange-600"
    },
    {
      icon: BarChart3,
      title: "Team Analysis",
      description: "Build opposition reports with tactical insights and squad analysis",
      gradient: "from-cyan-500 to-blue-600"
    },
    {
      icon: FileText,
      title: "PDF Reports",
      description: "Generate professional scouting reports ready to share",
      gradient: "from-emerald-500 to-green-600"
    },
    {
      icon: Mic,
      title: "Voice Notes",
      description: "Capture quick thoughts during matches with voice recordings",
      gradient: "from-fuchsia-500 to-pink-600"
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your scouting intelligence stays protected with enterprise-grade security"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Works offline at the stadium, syncs instantly when connected"
    },
    {
      icon: Target,
      title: "Built for Scouts",
      description: "Designed by understanding real scouting workflows and needs"
    }
  ];

  const pricingFeatures = [
    "Unlimited player profiles",
    "PDF report generation",
    "Voice notes & attachments",
    "Team opposition analysis",
    "Player comparison tools",
    "Tournament tracking",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation - Always has background */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-background border-b border-border shadow-lg shadow-black/20" 
          : "bg-background/80 backdrop-blur-xl border-b border-border/30"
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ScoutFlow
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => scrollToSection("features")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection("benefits")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Why ScoutFlow
              </button>
              <button 
                onClick={() => scrollToSection("pricing")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Pricing
              </button>
              <div className="h-4 w-px bg-border" />
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="font-medium">
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate("/auth")} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-medium">
                Start Free Trial
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border bg-background">
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => scrollToSection("features")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left py-2 font-medium"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection("benefits")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left py-2 font-medium"
                >
                  Why ScoutFlow
                </button>
                <button 
                  onClick={() => scrollToSection("pricing")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left py-2 font-medium"
                >
                  Pricing
                </button>
                <div className="h-px bg-border my-2" />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-primary to-secondary" onClick={() => navigate("/auth")}>
                    Start Free Trial
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 lg:pt-28 lg:pb-24">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-secondary/5" />
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        
        <div className="relative container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Star className="h-4 w-4 fill-primary" />
                <span>Professional Scouting Platform</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
                Your Complete{" "}
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  Scouting
                </span>{" "}
                Toolkit
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Track players, record observations, analyze teams, and generate professional reports — all in one powerful platform built for modern scouts.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="text-lg px-8 h-14 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 group"
                  onClick={() => navigate("/auth")}
                >
                  <Crown className="mr-2 h-5 w-5" />
                  Start 7-Day Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 h-14 rounded-xl border-border/50 hover:bg-muted/50 transition-all"
                  onClick={() => navigate("/auth")}
                >
                  Sign In
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative order-1 lg:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-border/50">
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10" />
                <img 
                  src={heroImage} 
                  alt="Football scout analyzing player performance on tablet at stadium" 
                  className="w-full h-auto object-cover aspect-video"
                />
                {/* Floating stats card */}
                <div className="absolute bottom-4 left-4 right-4 z-20 bg-background/90 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Players Tracked</p>
                        <p className="text-lg font-bold">2,847</p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tournaments</p>
                        <p className="text-lg font-bold">156</p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-border hidden sm:block" />
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Reports</p>
                        <p className="text-lg font-bold">1,203</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 scroll-mt-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Scout</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful tools designed to streamline your scouting workflow from discovery to report
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="group bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 lg:py-28 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
              <Target className="h-3.5 w-3.5" />
              Why ScoutFlow
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built Different</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We understand the demands of professional scouting
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28 scroll-mt-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Crown className="h-3.5 w-3.5" />
              Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg">Start with a 7-day free trial.</p>
          </div>

          <Card className="max-w-md mx-auto border-primary/30 bg-gradient-to-b from-card to-card/50 overflow-hidden relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            
            <CardContent className="p-8 relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold mb-5 shadow-lg">
                  <Crown className="h-4 w-4" />
                  Solo Plan
                </div>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl font-bold">€4.99</span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  7-day free trial included
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {pricingFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                size="lg" 
                className="w-full text-lg h-14 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/25 group"
                onClick={() => navigate("/auth")}
              >
                <Crown className="mr-2 h-5 w-5" />
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-5">
                Cancel anytime. No questions asked.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Level Up Your Scouting?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Join scouts who are already using ScoutFlow to discover and track talent more efficiently.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-10 h-14 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/25 group"
              onClick={() => navigate("/auth")}
            >
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ScoutFlow
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <button 
                onClick={() => navigate("/terms-and-conditions")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms & Conditions
              </button>
              <button 
                onClick={() => navigate("/privacy-policy")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => navigate("/refund-policy")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Refund Policy
              </button>
              <button 
                onClick={() => navigate("/contact")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </button>
              <a 
                href="https://scoutflow.tech" 
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                scoutflow.tech
              </a>
            </div>

            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ScoutFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;