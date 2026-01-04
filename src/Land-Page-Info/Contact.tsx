import { useState } from "react";
import { 
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Clock,
  Globe,
  Send,
  CheckCircle,
  AlertCircle,
  Twitter,
  Github,
  Linkedin,
  MessageCircle,
  MailCheck,
  Headphones,
  Shield,
  Sparkles,
  ArrowRight,
  Users,
  Zap,
  Heart
} from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "For general inquiries and support",
      value: "support@openforge.io",
      color: "from-purple-600 to-purple-800",
      action: "mailto:support@openforge.io"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Community Chat",
      description: "Join our Discord for real-time help",
      value: "discord.gg/openforge",
      color: "from-indigo-600 to-purple-700",
      action: "https://discord.gg/openforge"
    },
    {
      icon: <Twitter className="w-6 h-6" />,
      title: "Twitter/X",
      description: "Follow us for updates and announcements",
      value: "@OpenForgeHQ",
      color: "from-blue-500 to-purple-600",
      action: "https://twitter.com/OpenForgeHQ"
    },
    {
      icon: <Github className="w-6 h-6" />,
      title: "GitHub",
      description: "Report issues or contribute",
      value: "github.com/openforge",
      color: "from-gray-700 to-purple-800",
      action: "https://github.com/openforge"
    }
  ];

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'abuse', label: 'Report Abuse' }
  ];

  const faqs = [
    {
      question: "How quickly can I expect a response?",
      answer: "We typically respond within 24 hours. Community Discord support is usually faster."
    },
    {
      question: "Do you offer enterprise solutions?",
      answer: "Yes, we provide custom enterprise solutions for organizations. Please select 'Partnership' category."
    },
    {
      question: "Can I schedule a demo call?",
      answer: "Absolutely! Include your availability in your message and we'll schedule a call."
    },
    {
      question: "Where is your team located?",
      answer: "We're a globally distributed team with hubs in North America, Europe, and Asia."
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      });
    }, 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-900/20 rounded-full blur-3xl" />
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
              <span className="text-2xl font-bold text-white">OPENFORGE</span>
              <p className="text-sm text-purple-400">Contact Us</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/30 border border-purple-800/50 backdrop-blur-sm mb-6">
                <MessageCircle className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">GET IN TOUCH</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                We're Here to{" "}
                <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
                  Help You
                </span>
              </h1>
              
              <p className="text-lg text-gray-300 mb-8">
                Have questions about OpenForge? Need support with your project? 
                Our team is here to help you succeed. Reach out and we'll get back to you promptly.
              </p>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-400">Support hours: 24/7 via Discord</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-gray-900/40 backdrop-blur-sm rounded-3xl p-8 border border-gray-800 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900/50 to-purple-800/30 flex items-center justify-center border border-purple-800/30">
                    <Headphones className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Priority Support</h3>
                    <p className="text-purple-400">For verified projects</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Project creators with verified milestones get priority support with 
                    guaranteed 4-hour response time.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-purple-400">
                    <Shield className="w-4 h-4" />
                    <span>Secure communication for sensitive issues</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contact Form Section */}
      <section className="relative py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Send us a Message</h2>
              </div>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-900/50 to-green-800/30 flex items-center justify-center mx-auto mb-6 border border-green-800/50">
                    <MailCheck className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Message Sent!</h3>
                  <p className="text-gray-300 mb-6 max-w-md mx-auto">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="border-2 border-purple-600 text-purple-400 px-6 py-3 rounded-lg font-medium hover:bg-purple-900/20 transition-all duration-300"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors appearance-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors"
                      placeholder="What is this regarding?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors resize-none"
                      placeholder="Please provide details about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 flex items-center justify-center gap-3 hover:from-purple-700 hover:to-purple-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Contact Information</h3>
                <p className="text-gray-400 mb-8">
                  Choose the method that works best for you. We're available across multiple channels.
                </p>
              </div>

              <div className="space-y-6">
                {contactMethods.map((method, index) => (
                  <a
                    key={index}
                    href={method.action}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-purple-800/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center flex-shrink-0`}>
                        <div className="text-white">
                          {method.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-1">{method.title}</h4>
                        <p className="text-gray-400 text-sm mb-2">{method.description}</p>
                        <div className="text-purple-400 font-medium group-hover:text-purple-300 transition-colors">
                          {method.value}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                    </div>
                  </a>
                ))}
              </div>

              {/* Additional Info */}
              <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <h4 className="text-lg font-bold text-white">Response Times</h4>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between">
                    <span className="text-gray-400">General Inquiries</span>
                    <span className="text-white font-medium">24 hours</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-400">Technical Support</span>
                    <span className="text-white font-medium">12 hours</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-400">Priority Projects</span>
                    <span className="text-green-400 font-medium">4 hours</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-400">Emergency Issues</span>
                    <span className="text-red-400 font-medium">Immediate</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="relative py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently Asked{" "}
              <span className="text-purple-400">Questions</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-purple-800/50 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-900/50 to-purple-800/30 flex items-center justify-center border border-purple-800/30 flex-shrink-0">
                    <div className="text-purple-400 font-bold text-sm">{index + 1}</div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3">{faq.question}</h4>
                    <p className="text-gray-400">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Community Note */}
          <div className="mt-12 bg-gradient-to-br from-purple-900/20 to-black rounded-2xl p-8 border border-purple-800/30 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-purple-800/50 mb-6 backdrop-blur-sm">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">COMMUNITY SUPPORT</span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">
              Join Our Community
            </h3>
            
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Many questions can be answered faster by our community of creators and supporters.
              Join our Discord to connect with thousands of members.
            </p>
            
            <a
              href="https://discord.gg/openforge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-800 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Join Discord Community</span>
              <Zap className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="relative py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-purple-400" />
                <h4 className="text-lg font-bold text-white">Our Location</h4>
              </div>
              <p className="text-gray-400">
                Distributed Globally
                <br />
                <span className="text-sm text-gray-500">
                  Team members across 12+ countries
                </span>
              </p>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="w-5 h-5 text-purple-400" />
                <h4 className="text-lg font-bold text-white">Business Inquiries</h4>
              </div>
              <p className="text-gray-400">
                partnerships@openforge.io
                <br />
                <span className="text-sm text-gray-500">
                  For business and enterprise inquiries
                </span>
              </p>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-purple-400" />
                <h4 className="text-lg font-bold text-white">Legal & Security</h4>
              </div>
              <p className="text-gray-400">
                security@openforge.io
                <br />
                <span className="text-sm text-gray-500">
                  For security concerns and legal matters
                </span>
              </p>
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
              <span className="text-xl font-bold text-white">OPENFORGE</span>
            </div>
            
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              We're committed to helping creators succeed. Your success is our success.
            </p>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <a href="https://twitter.com/OpenForgeHQ" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://github.com/openforge" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/openforge" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://discord.gg/openforge" className="text-gray-400 hover:text-purple-400 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </a>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>© {new Date().getFullYear()} OpenForge. All rights reserved.</p>
              <p className="text-xs mt-2 flex items-center gap-1 justify-center">
                <Heart className="w-3 h-3 text-purple-500" />
                Built for the creator community
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;