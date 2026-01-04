import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Sparkles,
  Heart,
  Users,
  Coins,
  Shield,
  CheckCircle,
  Zap,
  TrendingUp,
  Award,
  Rocket,
  Star,
  Code,
  Globe,
  Building2,
  Coffee,
  Briefcase,
  DollarSign,
  Wrench,
  Palette,
  Mic,
  Camera,
  PenTool,
  ArrowUpRight,
  ChevronRight,
  TrendingDown,
  Clock,
  Target,
  BarChart3,
  Globe2,
  Users2,
  Layers,
  Smartphone,
  BookOpen,
  Zap as ZapIcon,
  Target as TargetIcon,
  Lock,
  MessageSquare,
  Award as AwardIcon
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleAbout = () => {
    navigate('/about');
  };
  
  const handleContact = () => {
    navigate('/contact');
  };

  const handleExplore = () => {
    navigate('/Home');
  };

  const stats = [
    { value: "2,500+", label: "Active Projects", icon: <Layers className="w-5 h-5" />, change: "+12.5%" },
    { value: "$15.7M+", label: "Total Funding", icon: <DollarSign className="w-5 h-5" />, change: "+24.3%" },
    { value: "32,000+", label: "Creators", icon: <Users2 className="w-5 h-5" />, change: "+8.7%" },
    { value: "96%", label: "Success Rate", icon: <AwardIcon className="w-5 h-5" />, change: "+2.1%" }
  ];

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Smart Escrow",
      description: "Milestone-based payments with automated releases",
      gradient: "from-purple-600 to-indigo-600"
    },
    {
      icon: <ZapIcon className="w-6 h-6" />,
      title: "Instant Payments",
      description: "Get paid the moment your work is verified",
      gradient: "from-blue-600 to-cyan-500"
    },
    {
      icon: <Globe2 className="w-6 h-6" />,
      title: "Global Reach",
      description: "Connect with backers from 150+ countries",
      gradient: "from-green-600 to-emerald-500"
    },
    {
      icon: <TargetIcon className="w-6 h-6" />,
      title: "AI Matching",
      description: "Smart algorithms match projects with ideal backers",
      gradient: "from-orange-600 to-red-500"
    }
  ];

  const projectTypes = [
    {
      icon: <Code className="w-7 h-7" />,
      title: "Tech & Development",
      projects: "890+",
      color: "text-blue-400",
      bg: "bg-blue-900/20"
    },
    {
      icon: <Palette className="w-7 h-7" />,
      title: "Creative Arts",
      projects: "540+",
      color: "text-purple-400",
      bg: "bg-purple-900/20"
    },
    {
      icon: <Briefcase className="w-7 h-7" />,
      title: "Business Services",
      projects: "720+",
      color: "text-emerald-400",
      bg: "bg-emerald-900/20"
    },
    {
      icon: <Wrench className="w-7 h-7" />,
      title: "Freelance Work",
      projects: "1,200+",
      color: "text-amber-400",
      bg: "bg-amber-900/20"
    }
  ];

  const successStories = [
    {
      name: "Alex Chen",
      role: "UI/UX Designer",
      project: "Fintech Dashboard",
      funding: "$45,000",
      timeline: "2 months",
      avatar: "AC"
    },
    {
      name: "Maria Rodriguez",
      role: "Blockchain Developer",
      project: "DeFi Protocol",
      funding: "$89,500",
      timeline: "3 months",
      avatar: "MR"
    },
    {
      name: "David Park",
      role: "Indie Game Dev",
      project: "Metaverse Game",
      funding: "$62,300",
      timeline: "4 months",
      avatar: "DP"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-950 overflow-x-hidden">
      {/* Enhanced Glassmorphism Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-black/60 to-purple-900/40" />
        
        {/* Animated Glass Layers */}
        <div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 rounded-full blur-[100px] animate-float"
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          }}
        />
        <div 
          className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/5 via-transparent to-pink-500/5 rounded-full blur-[100px] animate-float-reverse"
          style={{
            transform: `translate(${-mousePosition.x * 0.7}px, ${-mousePosition.y * 0.7}px)`,
          }}
        />
        
        {/* Glass Noise Texture */}
<div className="absolute inset-0 bg-[url(`data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E`)] opacity-5" />        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Navigation - Glass Effect */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-5 px-6 backdrop-blur-xl bg-white/3 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-purple-500/30 rounded-xl blur-md" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg shadow-black/10">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent tracking-tight">
                  OPENFORGE
                </span>
                <div className="h-[1px] w-16 bg-gradient-to-r from-cyan-400/50 to-transparent mt-1" />
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleAbout}
                className="px-4 py-2 text-sm text-white/80 hover:text-white transition-all hover:bg-white/10 rounded-lg backdrop-blur-sm"
              >
                About
              </button>
              <button
                onClick={handleContact}
                className="px-4 py-2 text-sm text-white/80 hover:text-white transition-all hover:bg-white/10 rounded-lg backdrop-blur-sm"
              >
                Contact
              </button>
              <button
                onClick={handleExplore}
                className="ml-2 px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-white rounded-lg border border-white/20 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 backdrop-blur-md"
              >
                Explore
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className={`space-y-8 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} transition-all duration-700`}>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/20 backdrop-blur-xl">
                <span className="text-sm font-medium text-cyan-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  Real-time funding platform
                </span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
            </div>

            <div className="max-w-4xl">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9]">
                <span className="text-white">Build </span>
                <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  anything
                </span>
                <span className="text-white">,</span>
                <br />
                <span className="text-white">funded by</span>
                <span className="bg-gradient-to-r from-purple-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                  everyone
                </span>
              </h1>
            </div>

            <p className="text-xl text-white/80 max-w-2xl">
              The next-generation platform where creators, freelancers, and innovators 
              turn ideas into reality through decentralized community funding.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleExplore}
                className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center gap-3">
                  <span>Start Creating</span>
                  <div className="relative">
                    <ArrowUpRight className="w-5 h-5 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 blur-sm opacity-0 group-hover:opacity-70" />
                  </div>
                </div>
              </button>
              
              <button className="group border-2 border-white/20 text-white/80 px-8 py-4 rounded-xl text-lg font-medium hover:border-cyan-400/30 hover:text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-xl">
                <span className="flex items-center gap-3">
                  <PlayCircle className="w-5 h-5" />
                  <span>Watch Demo</span>
                </span>
              </button>
            </div>

            {/* Stats Grid - Glass Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl pt-12">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 p-4 rounded-xl border border-white/20 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 ${
                    isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/20">
                      <div className="text-cyan-300">
                        {stat.icon}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>{stat.change}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/20 backdrop-blur-xl mb-4">
              <Target className="w-4 h-4 text-cyan-300" />
              <span className="text-sm font-medium text-cyan-300">WHY OPENFORGE</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built for the{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                modern creator
              </span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Everything you need to bring your ideas to life, powered by decentralized funding
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/20 hover:border-cyan-400/50 transition-all duration-300 h-full hover:shadow-xl hover:shadow-cyan-500/10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-center text-cyan-300 text-sm">
                      <span>Learn more</span>
                      <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Types Section */}
      <section className="relative py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-white/20 backdrop-blur-xl mb-6">
                <Layers className="w-4 h-4 text-purple-300" />
                <span className="text-sm font-medium text-purple-300">WHAT WE SUPPORT</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                For every{" "}
                <span className="bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  type of project
                </span>
              </h2>
              
              <p className="text-lg text-white/80 mb-8">
                From code to canvas, business to art. OpenForge supports creators across 
                all disciplines with the same powerful funding infrastructure.
              </p>
              
              <div className="space-y-4">
                {projectTypes.map((type, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl backdrop-blur-xl bg-gradient-to-r from-white/10 to-transparent border border-white/20 hover:border-cyan-400/50 transition-all duration-300 group cursor-pointer hover:shadow-lg hover:shadow-cyan-500/10"
                  >
                    <div className={`p-3 rounded-lg ${type.bg} border border-white/20 group-hover:border-${type.color.split('-')[1]}-400/50`}>
                      <div className={type.color}>
                        {type.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-white">{type.title}</h4>
                      <p className="text-sm text-white/70">{type.projects} active projects</p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-white/50 group-hover:text-cyan-400 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-3xl blur-3xl" />
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Real-time Insights</h3>
                    <p className="text-cyan-300">Live project metrics</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70">Project Success Rate</span>
                      <span className="text-emerald-400 font-medium">96.4%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full w-11/12" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70">Average Funding Time</span>
                      <span className="text-cyan-400 font-medium">18.2 days</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-400 rounded-full w-3/4" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70">Creator Satisfaction</span>
                      <span className="text-purple-400 font-medium">98.7%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full w-full" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Updated in real-time</span>
                    <span className="text-cyan-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Just now
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="relative py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-white/20 backdrop-blur-xl mb-4">
              <Award className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-medium text-amber-300">SUCCESS STORIES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Creators who{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                made it big
              </span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Join thousands of creators who turned their ideas into successful projects
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((story, index) => (
              <div
                key={index}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/20 hover:border-amber-400/50 transition-all duration-300 h-full hover:shadow-xl hover:shadow-amber-500/10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold shadow-lg">
                      {story.avatar}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{story.name}</h4>
                      <p className="text-sm text-amber-300">{story.role}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-white font-medium mb-2">{story.project}</p>
                    <p className="text-sm text-white/70">Raised in {story.timeline}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">{story.funding}</div>
                      <div className="text-xs text-white/70">Total funding</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 backdrop-blur-sm">
                      <span className="text-sm text-amber-300">✓ Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-purple-500/10 rounded-3xl blur-3xl" />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 md:p-12 text-center border border-white/20 overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full blur-3xl opacity-10" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full blur-3xl opacity-10" />
              
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 border border-white/20 backdrop-blur-xl mb-6">
                  <Rocket className="w-4 h-4 text-cyan-300" />
                  <span className="text-sm font-medium text-cyan-300">READY TO LAUNCH</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Your next project starts{" "}
                  <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                    here
                  </span>
                </h2>
                
                <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                  Join 32,000+ creators who chose OpenForge to fund their dreams. 
                  No gatekeepers, no middlemen—just you and your community.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleExplore}
                    className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 backdrop-blur-sm"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center justify-center gap-3">
                      <span>Start Your Project</span>
                      <ArrowUpRight className="w-5 h-5 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </button>
                  
                  <button className="group border-2 border-white/20 text-white/80 px-8 py-4 rounded-xl text-lg font-medium hover:border-cyan-400/50 hover:text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-xl">
                    <span className="flex items-center justify-center gap-3">
                      <MessageSquare className="w-5 h-5" />
                      <span>Join Community</span>
                    </span>
                  </button>
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/20">
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-500" />
                      <span>Zero platform fees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-500" />
                      <span>24/7 creator support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                      <span>Global payments</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 sm:px-6 border-t border-white/20 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white">OPENFORGE</span>
              </div>
              <p className="text-sm text-white/70">
                The future of decentralized creator funding
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><button onClick={handleExplore} className="text-sm text-white/70 hover:text-cyan-300 transition-colors">Explore Projects</button></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-cyan-300 transition-colors">How It Works</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-cyan-300 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-cyan-300 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><button onClick={handleAbout} className="text-sm text-white/70 hover:text-purple-300 transition-colors">About</button></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-purple-300 transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-purple-300 transition-colors">Careers</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-purple-300 transition-colors">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><button onClick={handleContact} className="text-sm text-white/70 hover:text-amber-300 transition-colors">Contact</button></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-amber-300 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-amber-300 transition-colors">Community</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-amber-300 transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-white/50">
                © {new Date().getFullYear()} OpenForge. All rights reserved.
              </div>
              
              <div className="flex items-center gap-4">
                <a href="#" className="text-white/50 hover:text-cyan-300 transition-colors hover:scale-110">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-white/50 hover:text-purple-300 transition-colors hover:scale-110">
                  <GitHub className="w-5 h-5" />
                </a>
                <a href="#" className="text-white/50 hover:text-blue-300 transition-colors hover:scale-110">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-white/50 hover:text-pink-300 transition-colors hover:scale-110">
                  <Discord className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Missing icon components for the demo
const PlayCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Twitter = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
  </svg>
);

const GitHub = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const Linkedin = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const Discord = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515a.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0a12.64 12.64 0 00-.617-1.25a.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057a19.9 19.9 0 005.993 3.03a.078.078 0 00.084-.028a14.09 14.09 0 001.226-1.994a.076.076 0 00-.041-.106a13.107 13.107 0 01-1.872-.892a.077.077 0 01-.008-.128a10.2 10.2 0 00.372-.292a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127a12.299 12.299 0 01-1.873.892a.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028a19.839 19.839 0 006.002-3.03a.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export default LandingPage;