import { useState } from "react";
import { 
  Heart,
  Users,
  Code,
  Globe,
  Shield,
  Zap,
  Target,
  BookOpen,
  MessageSquare,
  Calendar,
  UserCircle,
  ArrowRight,
  Sparkles,
  Star,
  ChevronRight,
  Coins,
  Database,
  Cpu,
  Brain,
  Quote,
  Sparkle,
  Crown,
  Feather,
  PenTool
} from 'lucide-react';

const AboutPage = () => {
  const [activeBlog, setActiveBlog] = useState(0);
  const [blogs, setBlogs] = useState([
    {
      id: 1,
      title: "Introducing OpenForge Coin",
      excerpt: "Our own platform cryptocurrency coming in next update",
      content: "We're excited to announce that OpenForge will soon launch its native cryptocurrency token. This token will serve as the backbone of our DAO ecosystem, enabling governance voting, staking rewards, and seamless transactions within the platform.",
      author: "Abhay Singh",
      date: "2024-04-01",
      readTime: "4 min",
      category: "Platform Update",
      color: "purple"
    },
    {
      id: 2,
      title: "DAO Governance Live",
      excerpt: "Decentralized Autonomous Organization now operational",
      content: "The OpenForge DAO is now fully operational, allowing token holders to vote on platform upgrades, funding allocations, and protocol parameters. Experience true decentralized governance.",
      author: "Abhay Singh",
      date: "2024-03-28",
      readTime: "5 min",
      category: "Governance",
      color: "blue"
    },
    {
      id: 3,
      title: "Proof-of-Build Protocol",
      excerpt: "Fund based on deliverables, not promises",
      content: "Our unique Proof-of-Build protocol ensures builders are paid only for verified, delivered work. No more upfront promises - just tangible results.",
      author: "Abhay Singh",
      date: "2024-03-25",
      readTime: "6 min",
      category: "Protocol",
      color: "green"
    }
  ]);

  const missionPoints = [
    {
      icon: <Database className="w-5 h-5" />,
      title: "Fully Decentralized",
      description: "No centralized servers, databases, or admin controls"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Proof of Build",
      description: "Fund based on verified deliverables, not promises"
    },
    {
      icon: <Coins className="w-5 h-5" />,
      title: "DAO-Driven Funding",
      description: "Community decides which projects get funded"
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "Intelligent Protocols",
      description: "Smart contracts that protect both builders and funders"
    }
  ];

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 pb-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white">OPENFORGE DAO</span>
              <p className="text-sm text-purple-400">Decentralized Open-Source Funding Protocol</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/30 border border-purple-800/50 backdrop-blur-sm mb-6">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">PROOF-OF-BUILD PROTOCOL</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Building the Future of{" "}
                <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
                  Decentralized Funding
                </span>
              </h1>
              
              <p className="text-lg text-gray-300 mb-8">
                OpenForge DAO is a decentralized protocol for funding open-source work based on proof of build, not promises. 
                No centralized servers, no admin approvals, no upfront payments. Builders get paid only for delivered, verified work.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <div className="bg-gray-900/60 backdrop-blur-sm px-4 py-3 rounded-lg border border-gray-800">
                  <div className="text-2xl font-bold text-white">MVP</div>
                  <div className="text-sm text-gray-400">Live Now</div>
                </div>
                <div className="bg-gray-900/60 backdrop-blur-sm px-4 py-3 rounded-lg border border-gray-800">
                  <div className="text-2xl font-bold text-white">0%</div>
                  <div className="text-sm text-gray-400">Upfront Payments</div>
                </div>
                <div className="bg-gray-900/60 backdrop-blur-sm px-4 py-3 rounded-lg border border-gray-800">
                  <div className="text-2xl font-bold text-white">DAO</div>
                  <div className="text-sm text-gray-400">Governance</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-gray-900/40 backdrop-blur-sm rounded-3xl p-8 border border-gray-800 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900/50 to-purple-800/30 flex items-center justify-center border border-purple-800/30">
                    <Target className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Our Vision</h3>
                    <p className="text-purple-400">Open-source funding without intermediaries</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-300">
                    We believe financial barriers should never stop innovation. OpenForge eliminates intermediaries 
                    by connecting builders directly with funders through transparent, on-chain protocols.
                  </p>
                  <div className="flex items-center gap-2 text-purple-400">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">No email, phone number, or KYC required</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mission Section */}
      <section className="relative py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Core <span className="text-purple-400">Principles</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Non-negotiable foundations of OpenForge DAO
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {missionPoints.map((point, index) => (
              <div
                key={index}
                className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-purple-800/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-900/50 to-purple-800/30 flex items-center justify-center mb-4 border border-purple-800/30">
                  <div className="text-purple-400">
                    {point.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{point.title}</h3>
                <p className="text-gray-400 text-sm">{point.description}</p>
              </div>
            ))}
          </div>

          {/* Founder Section - Elegant Design */}
          <div className="relative">
            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-0 w-32 h-32 bg-purple-900/5 rounded-full blur-3xl -translate-y-1/2" />
            <div className="absolute top-1/2 right-0 w-32 h-32 bg-purple-900/5 rounded-full blur-3xl -translate-y-1/2" />
            
            <div className="relative bg-gradient-to-br from-gray-900/40 via-black/40 to-purple-900/10 backdrop-blur-sm rounded-3xl p-12 border border-gray-800/50 overflow-hidden">
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
              </div>
              
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-purple-500/30 rounded-tl-3xl" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-purple-500/30 rounded-tr-3xl" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-purple-500/30 rounded-bl-3xl" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-purple-500/30 rounded-br-3xl" />
              
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
                  {/* Founder Avatar */}
                  <div className="relative">
                    <div className="relative w-48 h-48">
                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 rounded-full blur-xl opacity-50" />
                      
                      {/* Main Avatar */}
                      <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center">
                        {/* Inner Ring */}
                        <div className="absolute inset-4 rounded-full border-2 border-white/20" />
                        
                        {/* Initial */}
                        <span className="text-white text-7xl font-light tracking-wider">A</span>
                        
                        {/* Crown Badge */}
                        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center border-2 border-white/20">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Decorative Elements Around Avatar */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Sparkle className="w-3 h-3 text-purple-400" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Feather className="w-3 h-3 text-purple-400" />
                    </div>
                  </div>
                  
                  {/* Founder Info */}
                  <div className="flex-1 text-center lg:text-left">
                    {/* Title */}
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-black/50 border border-purple-800/50 mb-6 backdrop-blur-sm">
                      <PenTool className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">VISIONARY & ARCHITECT</span>
                    </div>
                    
                    {/* Name & Title */}
                    <h2 className="text-5xl md:text-6xl font-bold text-white mb-3">
                      Abhay <span className="text-purple-400">Singh</span>
                    </h2>
                    
                    <div className="flex items-center gap-3 justify-center lg:justify-start mb-8">
                      <div className="text-xl text-purple-300">Founder & CEO</div>
                      <div className="h-4 w-px bg-gray-700" />
                      <div className="text-gray-400">He/Him</div>
                    </div>
                    
                    {/* Quote */}
                    <div className="relative max-w-2xl">
                      <Quote className="absolute -top-6 -left-6 w-12 h-12 text-purple-500/20" />
                      
                      <div className="relative bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50">
                        <p className="text-2xl md:text-3xl leading-relaxed text-gray-200 italic font-light mb-6">
                          "We don't fund promises, we fund progress. Every line of code, every commit, 
                          every delivered milestone tells a story of dedication. Let's build a world 
                          where creators thrive on their work, not their words."
                        </p>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                          <div className="text-sm text-gray-500">OpenForge Philosophy</div>
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                        </div>
                      </div>
                      
                      <Quote className="absolute -bottom-6 -right-6 w-12 h-12 text-purple-500/20 rotate-180" />
                    </div>
                  </div>
                </div>
                
                {/* Signature */}
                <div className="mt-12 pt-8 border-t border-gray-800/50">
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-2">Signature</div>
                    <div className="text-2xl text-white font-cursive tracking-widest opacity-70">
                      Abhay Singh
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="relative py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Latest <span className="text-purple-400">Updates</span>
              </h2>
              <p className="text-gray-400">Platform announcements and protocol updates</p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/30 border border-purple-800/50 backdrop-blur-sm">
              <Coins className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">COIN COMING SOON</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Featured Blog */}
            <div 
              className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-2xl p-8 border border-gray-800 hover:border-purple-800/50 transition-all duration-300 cursor-pointer"
              onClick={() => setActiveBlog(activeBlog)}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  blogs[activeBlog].color === 'purple' ? 'bg-purple-900/30 text-purple-400 border border-purple-800/50' :
                  blogs[activeBlog].color === 'green' ? 'bg-green-900/30 text-green-400 border border-green-800/50' :
                  'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                }`}>
                  {blogs[activeBlog].category}
                </div>
                <div className="text-sm text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {blogs[activeBlog].date}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                {blogs[activeBlog].title}
              </h3>
              
              <p className="text-gray-300 mb-6">
                {blogs[activeBlog].content}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-900/50 to-purple-800/30 flex items-center justify-center border border-purple-800/30">
                    <UserCircle className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{blogs[activeBlog].author}</div>
                    <div className="text-xs text-gray-400">{blogs[activeBlog].readTime} read</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </div>
            </div>

            {/* Blog List */}
            <div className="space-y-4">
              {blogs.map((blog, index) => (
                <div
                  key={blog.id}
                  className={`bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border ${
                    index === activeBlog 
                      ? 'border-purple-800/50 bg-gradient-to-r from-gray-900/60 to-purple-900/20' 
                      : 'border-gray-800'
                  } hover:border-purple-800/50 transition-all duration-300 cursor-pointer`}
                  onClick={() => setActiveBlog(index)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-medium text-white">{blog.title}</h4>
                    <div className={`w-2 h-2 rounded-full ${
                      index === activeBlog ? 'bg-purple-500 animate-pulse' : 'bg-gray-600'
                    }`} />
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-3">{blog.excerpt}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span>{blog.author}</span>
                      <span>•</span>
                      <span>{blog.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" />
                      <span>Discuss</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-2xl p-8 md:p-12 text-center border border-gray-800 shadow-2xl backdrop-blur-sm">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-purple-800/50 mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">JOIN THE REVOLUTION</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Build With Us
            </h2>
            
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Whether you're a creator looking for funding or a supporter passionate about innovation, 
              there's a place for you in our community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center gap-3 hover:from-purple-700 hover:to-purple-900">
                <span>Start a Project</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className="border-2 border-purple-600 text-purple-400 px-8 py-4 rounded-xl text-lg font-medium hover:bg-purple-900/20 transition-all duration-300">
                Explore DAO
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 sm:px-6 bg-black border-t border-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">OPENFORGE DAO</span>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Decentralized open-source funding protocol based on proof-of-build
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 mb-8">
              <a href="#" className="hover:text-purple-400 transition-colors">About</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Documentation</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Smart Contracts</a>
              <a href="#" className="hover:text-purple-400 transition-colors">DAO Governance</a>
              <a href="#" className="hover:text-purple-400 transition-colors">GitHub</a>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>© {new Date().getFullYear()} OpenForge DAO. All rights reserved.</p>
              <p className="text-xs mt-2 flex items-center gap-1 justify-center">
                <Heart className="w-3 h-3 text-purple-500" />
                Built with vision for the open-source community
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;