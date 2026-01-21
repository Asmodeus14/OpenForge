"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"

import {
  Shield,
  TrendingUp,
  ArrowUpRight,
  ZapIcon,
  Globe2,
  TargetIcon,
  Code,
  Palette,
  Briefcase,
  Wrench,
  Users2,
  DollarSign,
  Layers,
  AwardIcon,
  PlayCircle,
  CheckCircle,
} from "lucide-react"
import FlipWord from "../component/FlipWorld"

gsap.registerPlugin(ScrollTrigger, SplitText)

const LandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const navigate = useNavigate()

  const featuresRef = useRef(null)
  const projectsRef = useRef(null)
  const successRef = useRef(null)
  const ctaRef = useRef(null)
  const statsRef = useRef(null)
  const heroRef = useRef(null)
  const textFlipRef = useRef<HTMLElement>(null)
  const heroHeadingRef = useRef<HTMLHeadingElement>(null)
  const sectionHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100)

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    // Register SplitText plugin
    gsap.registerPlugin(SplitText)

    // Hero text character animation
    if (heroHeadingRef.current) {
      const split = new SplitText(heroHeadingRef.current, { 
        type: "chars,words,lines",
        linesClass: "line"
      })
      
      gsap.from(split.chars, {
        opacity: 0,
        y: 50,
        rotationX: -90,
        stagger: 0.02,
        duration: 0.8,
        ease: "back.out",
        scrollTrigger: {
          trigger: heroHeadingRef.current,
          start: "top 80%",
          end: "top 30%",
          toggleActions: "play none none reverse"
        }
      })
    }

    // Section headings animation
    if (sectionHeadingRef.current) {
      gsap.fromTo(
        sectionHeadingRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionHeadingRef.current,
            start: "top 85%",
            end: "top 40%",
            toggleActions: "play none none reverse"
          }
        }
      )
    }

    // Hero stagger animations
    const heroElements = gsap.utils.toArray<HTMLElement>("[data-hero-item]")
    gsap.to(heroElements, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
    })

    // Animate floating background elements with GSAP
    gsap.to(".animate-float", {
      y: -20,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    })

    // Animate stat cards with GSAP
    gsap.fromTo(
      "[data-stat-card]",
      {
        opacity: 0,
        scale: 0.8,
        y: 40,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "elastic.out(1, 0.6)",
      }
    )

    // Features cards scroll animation
    gsap.utils.toArray<HTMLElement>("[data-feature-card]").forEach((element) => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 60,
          rotateX: 10,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: element,
            start: "top 80%",
            end: "top 30%",
            scrub: 0.5,
          },
        },
      )
    })

    // Stats cards scroll animation
    gsap.utils.toArray<HTMLElement>("[data-stat-card]").forEach((element) => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          scale: 0.8,
          y: 40,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            end: "top 30%",
            scrub: 0.3,
          },
        },
      )
    })

    // Project types staggered entrance
    gsap.utils.toArray<HTMLElement>("[data-project-type]").forEach((element, index) => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          x: -50,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          delay: index * 0.1,
          scrollTrigger: {
            trigger: projectsRef.current,
            start: "top 70%",
            end: "top 10%",
            scrub: 0.4,
          },
        },
      )
    })

    // Success stories 3D rotation
    gsap.utils.toArray<HTMLElement>("[data-story-card]").forEach((element) => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 80,
          rotateY: -15,
        },
        {
          opacity: 1,
          y: 0,
          rotateY: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: element,
            start: "top 75%",
            end: "top 25%",
            scrub: 0.5,
          },
        },
      )
    })

    // Additional GSAP animations for cards
    gsap.fromTo(
      "[data-feature-card]",
      {
        opacity: 0,
        rotateX: 10,
        y: 60,
      },
      {
        opacity: 1,
        rotateX: 0,
        y: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "expo.out",
      }
    )

    gsap.fromTo(
      "[data-project-type]",
      {
        opacity: 0,
        x: -50,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "quad.out",
      }
    )

    gsap.fromTo(
      "[data-story-card]",
      {
        opacity: 0,
        y: 80,
        rotateY: -15,
      },
      {
        opacity: 1,
        y: 0,
        rotateY: 0,
        duration: 1,
        stagger: 0.15,
        ease: "expo.out",
      }
    )

    // CTA section reveal
    gsap.fromTo(
      ctaRef.current,
      {
        opacity: 0,
        scale: 0.9,
        y: 40,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1,
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 70%",
          end: "top 20%",
          scrub: 0.5,
        },
      },
    )

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [isLoaded])

  const stats = [
    { value: "2,500+", label: "Active Projects", icon: <Layers className="w-5 h-5" />, change: "+12.5%" },
    { value: "$15.7M+", label: "Total Funding", icon: <DollarSign className="w-5 h-5" />, change: "+24.3%" },
    { value: "32,000+", label: "Creators", icon: <Users2 className="w-5 h-5" />, change: "+8.7%" },
    { value: "96%", label: "Success Rate", icon: <AwardIcon className="w-5 h-5" />, change: "+2.1%" },
  ]

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Smart Escrow",
      description: "Milestone-based payments with automated releases",
      gradient: "from-purple-600 to-purple-400",
    },
    {
      icon: <ZapIcon className="w-6 h-6" />,
      title: "Instant Payments",
      description: "Get paid the moment your work is verified",
      gradient: "from-blue-600 to-cyan-400",
    },
    {
      icon: <Globe2 className="w-6 h-6" />,
      title: "Global Reach",
      description: "Connect with backers from 150+ countries",
      gradient: "from-emerald-600 to-teal-400",
    },
    {
      icon: <TargetIcon className="w-6 h-6" />,
      title: "AI Matching",
      description: "Smart algorithms match projects with ideal backers",
      gradient: "from-orange-600 to-amber-400",
    },
  ]

  const projectTypes = [
    { icon: <Code className="w-7 h-7" />, title: "Tech & Development", projects: "890+" },
    { icon: <Palette className="w-7 h-7" />, title: "Creative Arts", projects: "540+" },
    { icon: <Briefcase className="w-7 h-7" />, title: "Business Services", projects: "720+" },
    { icon: <Wrench className="w-7 h-7" />, title: "Freelance Work", projects: "1,200+" },
  ]

  const successStories = [
    {
      name: "Alex Chen",
      role: "UI/UX Designer",
      project: "Fintech Dashboard",
      funding: "$45,000",
      avatar: "AC",
    },
    {
      name: "Maria Rodriguez",
      role: "Blockchain Developer",
      project: "DeFi Protocol",
      funding: "$89,500",
      avatar: "MR",
    },
    {
      name: "David Park",
      role: "Indie Game Dev",
      project: "Metaverse Game",
      funding: "$62,300",
      avatar: "DP",
    },
  ]

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-black to-purple-950/60" />

        {/* Animated background blobs */}
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/5 rounded-full blur-3xl animate-float"
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/10 rounded-full blur-3xl animate-float"
          style={{
            transform: `translate(${-mousePosition.x * 0.6}px, ${-mousePosition.y * 0.6}px)`,
            transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />

        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 px-6 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/Home" className="flex items-center gap-3 group cursor-pointer hover:scale-105 transition-transform duration-300">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/30 to-purple-500/30 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
              <img 
                src="openforge.svg" 
                alt="Sparkles" 
                className="w-5 h-5"
                style={{
                  filter: 'brightness(0) saturate(100%) invert(76%) sepia(53%) saturate(415%) hue-rotate(139deg) brightness(94%) contrast(89%)'
                }}
              />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent font-orbitron tracking-wide">
              OpenForge
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link 
              to="/about" 
              className="px-4 py-2 text-sm text-white/80 hover:text-white transition-all rounded-lg backdrop-blur-sm hover:bg-white/10 duration-200 font-medium"
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="px-4 py-2 text-sm text-white/80 hover:text-white transition-all rounded-lg backdrop-blur-sm hover:bg-white/10 duration-200 font-medium"
            >
              Contact
            </Link>
            <Link 
              to="/Home" 
              className="ml-2 px-5 py-2 text-sm font-medium bg-gradient-to-r from-cyan-500/50 to-purple-600/50 text-white rounded-lg border border-white/20 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-4" ref={heroRef}>
        <div className="max-w-6xl mx-auto">
          <div className="space-y-8">
            {/* Badge */}
            <div
              className="flex items-center gap-3 animate-fade-in"
              data-hero-item
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/20 backdrop-blur-xl">
                <span className="text-sm font-medium text-cyan-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  The Future of Funding is Here
                </span>
              </div>
            </div>

            {/* Hero heading with unique typography effects */}
            <div
              className="max-w-4xl"
              data-hero-item
              style={{ opacity: 0, transform: "translateY(20px)" }}
              ref={textFlipRef}
            >
              <h1 
                ref={heroHeadingRef}
                className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.2] font-orbitron"
              >
                {/* First line - Build anything */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="text-white text-neon-cyan">Build</span>
                  <div className="text-gradient-primary text-neon-purple">
                    <FlipWord englishText="anything" japaneseText="何でも作ろう" />
                  </div>
                </div>
                {/* Second line - funded by everyone */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white/90">funded by</span>
                  <div className="text-gradient-primary text-neon-purple">
                    <FlipWord englishText="everyone" japaneseText="みんな" />
                  </div>
                </div>
              </h1>
            </div>

            {/* Subheading */}
            <p
              className="text-xl text-white/70 max-w-2xl leading-relaxed font-light"
              data-hero-item
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              The next-generation platform where creators, freelancers, and innovators turn ideas into reality through
              <span className="text-gradient-secondary font-medium"> decentralized community funding</span>.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 pt-6"
              data-hero-item
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              <button 
                onClick={() => navigate("/Home")}
                className="group relative overflow-hidden bg-gradient-to-r from-cyan-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 active:scale-95 font-orbitron tracking-wide"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3">
                  <span>Start Creating</span>
                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </button>

              <button 
                onClick={() => navigate("/Home")}
                className="group border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:border-cyan-400/60 hover:bg-white/10 transition-all duration-300 backdrop-blur-xl hover:scale-105 flex items-center gap-3"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-4 max-w-3xl pt-12" ref={statsRef}>
              {stats.map((stat, index) => (
                <div
                  key={index}
                  data-stat-card
                  data-hero-item
                  className="flex-1 min-w-[200px] backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 p-4 rounded-xl border border-white/20 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 hover:scale-105 group cursor-pointer"
                  style={{ opacity: 0, transform: "translateY(20px)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/20 group-hover:shadow-lg group-hover:shadow-cyan-500/30">
                      <div className="text-cyan-300">{stat.icon}</div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1 font-orbitron tracking-tight">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4" ref={featuresRef}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 
              ref={sectionHeadingRef}
              className="text-4xl md:text-5xl font-bold mb-4 font-orbitron text-gradient-primary"
            >
              Built for the modern creator
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Everything you need to bring your ideas to life, powered by 
              <span className="text-gradient-secondary font-medium"> decentralized funding</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 justify-between">
            {features.map((feature, index) => (
              <div
                key={index}
                data-feature-card
                className="flex-1 min-w-[250px] group relative"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div
                  className={`relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border transition-all duration-300 h-full ${
                    hoveredCard === index
                      ? "border-cyan-400/50 shadow-xl shadow-cyan-500/20 -translate-y-2"
                      : "border-white/20"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg text-white group-hover:scale-110 transition-transform`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 font-orbitron tracking-tight">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Types Section */}
      <section className="relative py-20 px-4" ref={projectsRef}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16 font-orbitron text-gradient-primary">
            Popular Categories
          </h2>

          <div className="flex flex-wrap gap-6 justify-between">
            {projectTypes.map((type, index) => (
              <div
                key={index}
                data-project-type
                className="flex-1 min-w-[220px] backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 p-6 rounded-xl border border-white/20 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 hover:scale-105 cursor-pointer group"
              >
                <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <div className="text-cyan-300">{type.icon}</div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-orbitron tracking-tight">{type.title}</h3>
                <p className="text-cyan-300 font-semibold">{type.projects} projects</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="relative py-20 px-4" ref={successRef}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16 font-orbitron text-gradient-primary">
            Success Stories
          </h2>

          <div className="flex flex-wrap gap-6 justify-between">
            {successStories.map((story, index) => (
              <div
                key={index}
                data-story-card
                className="flex-1 min-w-[300px] backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-2xl border border-white/20 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 hover:scale-105 cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/40 to-purple-500/40 flex items-center justify-center border border-white/20 text-white font-bold font-orbitron">
                    {story.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-white font-orbitron">{story.name}</h3>
                    <p className="text-sm text-white/60">{story.role}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-white/80 mb-2">{story.project}</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent font-orbitron">
                    {story.funding}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Successfully Funded
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4" ref={ctaRef}>
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-600/20 to-purple-600/20 border border-white/20 rounded-2xl p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-orbitron text-gradient-primary">
              Ready to bring your idea to life?
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Join thousands of creators already funding their dreams through OpenForge. 
              <span className="text-gradient-secondary font-medium"> Secure, transparent, and truly decentralized</span>.
            </p>
            <button 
              onClick={() => navigate("/Home")}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 active:scale-95 font-orbitron tracking-wide"
            >
              Start Your Project
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-white/10 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-8 mb-8 justify-between">
            <div>
              <h4 className="font-bold text-white mb-4 font-orbitron">Product</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>
                  <Link to="/Home" className="hover:text-white transition-colors cursor-pointer">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/Home" className="hover:text-white transition-colors cursor-pointer">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/Home" className="hover:text-white transition-colors cursor-pointer">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 font-orbitron">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors cursor-pointer">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/Home" className="hover:text-white transition-colors cursor-pointer">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/Home" className="hover:text-white transition-colors cursor-pointer">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 font-orbitron">Legal</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>
                  <Link to="/Home" className="hover:text-white transition-colors cursor-pointer">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/Home" className="hover:text-white transition-colors cursor-pointer">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 font-orbitron">Social</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>
                  <Link to="/Home" className="hover:text-white transition-colors cursor-pointer">
                    Twitter
                  </Link>
                </li>
                <li>
                  <Link to="/Home" className="hover:text-white transition-colors cursor-pointer">
                    Discord
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex items-center justify-between">
            <p className="text-white/60 text-sm">© 2026 OpenForge. All rights reserved.</p>
            <p className="text-white/60 text-sm">Powered by decentralized funding</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage