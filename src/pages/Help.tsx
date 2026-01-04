import { useState } from 'react';
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  Video, 
  MessageSquare, 
  Mail, 
  ChevronRight,
  ChevronDown,
  ExternalLink,
  FileText,
  Code,
  Database,
  Shield,
  Globe,
  Users,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Sparkles,
  Brain,
  Rocket,
  Cpu,
  Lock,
  Menu,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../component/Sidebar';

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedFaqs, setExpandedFaqs] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: Rocket, count: 8, gradient: 'from-purple-500 to-pink-500' },
    { id: 'features', label: 'Features', icon: Sparkles, count: 12, gradient: 'from-purple-500 to-blue-500' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertCircle, count: 6, gradient: 'from-purple-500 to-rose-500' },
    { id: 'api', label: 'API & Integration', icon: Cpu, count: 15, gradient: 'from-purple-500 to-cyan-500' },
    { id: 'security', label: 'Security', icon: Lock, count: 5, gradient: 'from-purple-500 to-emerald-500' },
    { id: 'billing', label: 'Billing & Plans', icon: Award, count: 7, gradient: 'from-purple-500 to-amber-500' },
  ];

  const faqs = [
    {
      id: '1',
      question: 'How do I get started with OPENFORGE?',
      answer: 'Getting started is easy! First, create an account, then follow our interactive onboarding tutorial. You can import existing projects or start from one of our templates. Our documentation provides step-by-step guides for every feature.',
      category: 'getting-started',
      tags: ['onboarding', 'basics'],
    },
    {
      id: '2',
      question: 'What are the system requirements?',
      answer: 'OPENFORGE works on any modern browser. We recommend Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+. For the best experience, ensure you have a stable internet connection and at least 4GB of RAM.',
      category: 'getting-started',
      tags: ['requirements', 'compatibility'],
    },
    {
      id: '3',
      question: 'How do I deploy my project?',
      answer: 'You can deploy directly from OPENFORGE to multiple platforms. Go to the Deploy section, select your target platform (Vercel, Netlify, AWS, etc.), configure your settings, and click Deploy. We handle the build process automatically.',
      category: 'features',
      tags: ['deployment', 'hosting'],
    },
    {
      id: '4',
      question: 'Is my data secure?',
      answer: 'Yes, security is our top priority. All data is encrypted at rest and in transit. We use industry-standard security practices and regular third-party audits. You can enable 2FA for additional security.',
      category: 'security',
      tags: ['security', 'privacy'],
    },
    {
      id: '5',
      question: 'How do I collaborate with my team?',
      answer: 'You can invite team members via email or link sharing. Each member gets appropriate permissions (view, edit, admin). Real-time collaboration features allow multiple people to work on the same project simultaneously.',
      category: 'features',
      tags: ['collaboration', 'teams'],
    },
    {
      id: '6',
      question: 'What happens if I exceed my plan limits?',
      answer: 'We\'ll notify you before you reach your limits. You can upgrade your plan at any time. For temporary overages, we provide a grace period during which you can manage your usage or upgrade.',
      category: 'billing',
      tags: ['billing', 'limits'],
    },
  ];

  const popularArticles = [
    { title: 'Setting up your first project', views: '12.5k', readTime: '5 min', trending: true },
    { title: 'API authentication guide', views: '8.2k', readTime: '8 min', trending: true },
    { title: 'Troubleshooting build errors', views: '6.7k', readTime: '6 min', trending: false },
    { title: 'Custom domain setup', views: '5.4k', readTime: '4 min', trending: true },
    { title: 'Team collaboration best practices', views: '4.9k', readTime: '7 min', trending: false },
  ];

  const quickLinks = [
    { title: 'Documentation', icon: BookOpen, link: '/docs', gradient: 'from-purple-500 to-pink-500' },
    { title: 'Video Tutorials', icon: Video, link: '/tutorials', gradient: 'from-purple-500 to-blue-500' },
    { title: 'API Reference', icon: Code, link: '/api', gradient: 'from-purple-500 to-cyan-500' },
    { title: 'Community Forum', icon: Users, link: '/community', gradient: 'from-purple-500 to-amber-500' },
    { title: 'Status Page', icon: Globe, link: '/status', gradient: 'from-purple-500 to-emerald-500' },
    { title: 'Contact Support', icon: Mail, link: '/contact', gradient: 'from-purple-500 to-rose-500' },
  ];

  const toggleFaq = (id: string) => {
    setExpandedFaqs(prev =>
      prev.includes(id) ? prev.filter(faqId => faqId !== id) : [...prev, id]
    );
  };

  const filteredFaqs = searchQuery
    ? faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : faqs.filter(faq => !activeCategory || faq.category === activeCategory);

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Sidebar />
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-300">Browse Topics</h3>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setActiveCategory(category.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                        activeCategory === category.id
                          ? 'bg-gradient-to-r from-purple-900/30 to-purple-900/10 border-purple-500/50 text-purple-300'
                          : 'border-gray-800 hover:border-purple-500/30 hover:bg-gray-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${category.gradient} bg-opacity-20`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{category.label}</span>
                      </div>
                      <span className="text-sm bg-gray-900 px-2 py-1 rounded-full">{category.count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 pt-8 border-t border-gray-800">
                <h3 className="text-lg font-semibold mb-4 text-gray-300">Popular Articles</h3>
                <div className="space-y-3">
                  {popularArticles.map((article) => (
                    <Link
                      key={article.title}
                      to="#"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block p-4 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-purple-500/30 hover:bg-gray-900/50 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium group-hover:text-purple-300 transition-colors line-clamp-2">
                          {article.title}
                        </div>
                        {article.trending && (
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {article.readTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {article.views}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full sm:w-[800px] h-[400px] sm:h-[800px] bg-purple-500/5 blur-3xl rounded-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 backdrop-blur-sm mb-6 sm:mb-8">
              <Brain className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-300 via-white to-purple-300 bg-clip-text text-transparent mb-4 sm:mb-6 px-2">
              How can we help?
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-8 sm:mb-10 px-2">
              Find instant answers, guides, and tutorials for OPENFORGE
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto px-2 sm:px-0">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask anything about OPENFORGE..."
                    className="w-full pl-10 sm:pl-12 pr-24 py-3 sm:py-4 bg-black/80 backdrop-blur-sm border border-purple-500/30 rounded-xl sm:rounded-2xl text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent placeholder-gray-500"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/20 text-sm sm:text-base">
                      Search
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mt-4 sm:mt-6">
                <span className="text-xs sm:text-sm text-gray-500">Trending:</span>
                {['Deployment', 'Authentication', 'Billing', 'API Keys', 'Teams'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-purple-500/30 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              to={link.link}
              className="group relative p-4 sm:p-6 bg-gray-900/30 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-10 rounded-xl sm:rounded-2xl transition-opacity duration-500`} />
              <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 rounded-lg sm:rounded-xl bg-gradient-to-br ${link.gradient} p-2 sm:p-3`}>
                <link.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="font-semibold text-sm sm:text-base text-center group-hover:text-purple-300 transition-colors line-clamp-2">
                {link.title}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Mobile Category Filter */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Browse Topics</h3>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-800 rounded-xl hover:border-purple-500/50 hover:bg-gray-900/50 transition-all duration-300"
              >
                <Menu className="w-4 h-4" />
                <span>All Topics</span>
              </button>
            </div>
            <div className="flex overflow-x-auto pb-4 space-x-3 -mx-4 px-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 min-w-[140px] ${
                      activeCategory === category.id
                        ? 'bg-gradient-to-r from-purple-900/30 to-purple-900/10 border-purple-500/50 text-purple-300'
                        : 'border-gray-800 hover:border-purple-500/30 hover:bg-gray-900/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${category.gradient} bg-opacity-20`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{category.label}</span>
                    <span className="text-xs bg-gray-900 px-2 py-1 rounded-full">{category.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Categories - Desktop */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="sticky top-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Browse Topics</h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group ${
                        activeCategory === category.id
                          ? 'bg-gradient-to-r from-purple-900/30 to-purple-900/10 border-purple-500/50 text-purple-300'
                          : 'border-gray-800 hover:border-purple-500/30 hover:bg-gray-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${category.gradient} bg-opacity-20`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="group-hover:text-gray-300">{category.label}</span>
                      </div>
                      <span className="text-sm bg-gray-900 px-2 py-1 rounded-full">{category.count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Popular Articles */}
              <div className="mt-8 lg:mt-12">
                <h3 className="text-lg font-semibold mb-4 text-gray-300">Popular Articles</h3>
                <div className="space-y-3">
                  {popularArticles.map((article) => (
                    <Link
                      key={article.title}
                      to="#"
                      className="block p-4 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-purple-500/30 hover:bg-gray-900/50 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium group-hover:text-purple-300 transition-colors line-clamp-2">
                          {article.title}
                        </div>
                        {article.trending && (
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {article.readTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {article.views}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-300">
                  {searchQuery ? `Search results for "${searchQuery}"` : 
                   activeCategory ? `${categories.find(c => c.id === activeCategory)?.label} FAQs` : 
                   'Frequently Asked Questions'}
                </h2>
                <p className="text-gray-400 mt-1 sm:mt-2">
                  {filteredFaqs.length} articles found
                </p>
              </div>
              <button className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-800 rounded-xl hover:border-purple-500/50 hover:bg-gray-900/50 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base">
                <Sparkles className="w-4 h-4" />
                Suggest a question
              </button>
            </div>

            {/* FAQ List */}
            <div className="space-y-3 sm:space-y-4">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-gray-900/30 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-800 hover:border-purple-500/30 transition-all duration-300 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-gray-900/20 transition-colors duration-300"
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-900/40 to-purple-900/20 text-purple-400 rounded-full border border-purple-500/30">
                          {categories.find(c => c.id === faq.category)?.label}
                        </span>
                        {faq.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 text-xs bg-black/50 text-gray-400 rounded-lg border border-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-200 pr-2">{faq.question}</h3>
                    </div>
                    <div className={`p-2 rounded-lg border ${expandedFaqs.includes(faq.id) ? 'bg-purple-900/20 border-purple-500/30' : 'border-gray-800'} flex-shrink-0`}>
                      <ChevronDown
                        className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-300 ${
                          expandedFaqs.includes(faq.id) ? 'rotate-180 text-purple-400' : ''
                        }`}
                      />
                    </div>
                  </button>
                  {expandedFaqs.includes(faq.id) && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-800 pt-4 sm:pt-6">
                      <p className="text-gray-300 mb-4 sm:mb-6 leading-relaxed">{faq.answer}</p>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <button className="flex items-center gap-2 text-xs sm:text-sm text-emerald-400 hover:text-emerald-300">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          Mark as helpful
                        </button>
                        <button className="flex items-center gap-2 text-xs sm:text-sm text-rose-400 hover:text-rose-300">
                          <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          Not helpful
                        </button>
                        <Link
                          to="#"
                          className="flex items-center gap-2 text-xs sm:text-sm text-purple-400 hover:text-purple-300 ml-auto"
                        >
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          Read full guide
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* No Results */}
            {filteredFaqs.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 flex items-center justify-center">
                  <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500/50" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-300 mb-2 sm:mb-3">No results found</h3>
                <p className="text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto px-4">
                  Try different keywords or browse our categories to find what you're looking for
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/20 text-sm sm:text-base"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Support Banner */}
            <div className="mt-8 sm:mt-12 bg-gradient-to-br from-gray-900/50 to-black rounded-xl sm:rounded-2xl border border-gray-800 p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
                <div className="text-center md:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-200">Still need help?</h3>
                      <p className="text-gray-400 mt-1">Our support team is ready to assist you</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Average response time: 2 hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>98% satisfaction rate</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                  <Link
                    to="/contact"
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20 text-sm sm:text-base"
                  >
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                    Contact Support
                  </Link>
                  <button className="px-6 sm:px-8 py-3 sm:py-4 border border-gray-800 rounded-xl hover:border-purple-500/50 hover:bg-gray-900/50 transition-all duration-300 text-sm sm:text-base">
                    Live Chat
                  </button>
                </div>
              </div>
            </div>

            {/* Documentation Links */}
            <div className="mt-8 sm:mt-12">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-300">Explore Documentation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[
                  { title: 'Getting Started Guide', icon: FileText, pages: 24, gradient: 'from-purple-500 to-pink-500' },
                  { title: 'API Reference', icon: Code, pages: 156, gradient: 'from-purple-500 to-blue-500' },
                  { title: 'Best Practices', icon: Award, pages: 42, gradient: 'from-purple-500 to-emerald-500' },
                  { title: 'Security Guide', icon: Shield, pages: 18, gradient: 'from-purple-500 to-cyan-500' },
                  { title: 'Migration Guide', icon: Database, pages: 32, gradient: 'from-purple-500 to-amber-500' },
                  { title: 'Integration Tutorials', icon: Globe, pages: 67, gradient: 'from-purple-500 to-rose-500' },
                ].map((doc) => (
                  <Link
                    key={doc.title}
                    to="#"
                    className="group relative p-4 sm:p-6 bg-gray-900/30 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${doc.gradient} opacity-0 group-hover:opacity-10 rounded-xl sm:rounded-2xl transition-opacity duration-500`} />
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${doc.gradient} bg-opacity-20`}>
                        <doc.icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500 bg-black/50 px-2 py-1 sm:px-3 sm:py-1 rounded-full">{doc.pages} pages</span>
                    </div>
                    <h4 className="font-semibold text-base sm:text-lg mb-2 text-gray-200 group-hover:text-purple-300 transition-colors line-clamp-2">
                      {doc.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 line-clamp-2">
                      Complete guide with examples and code snippets
                    </p>
                    <div className="flex items-center text-purple-400 text-xs sm:text-sm">
                      <span>Read guide</span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="border-t border-gray-900 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 mb-4 sm:mb-6">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent px-2">
              Join our developer community
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-10 text-sm sm:text-lg px-4">
              Connect with other developers, share your projects, and get help from thousands of OPENFORGE users
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <button className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-purple-500/50 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-1 text-sm sm:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Join Discord</span>
              </button>
              <button className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-purple-500/50 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-1 text-sm sm:text-base">
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>GitHub Discussions</span>
              </button>
              <button className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-purple-500/50 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-1 text-sm sm:text-base">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Community Forum</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}