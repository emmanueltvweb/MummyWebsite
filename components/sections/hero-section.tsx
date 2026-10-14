"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Container } from "@/components/layout/container"
import { ArrowRight, Calendar, User } from "lucide-react"
import Link from "next/link"
import CloudinaryImage from "@/components/cloudinary-image"
import { useSiteContent } from "@/components/content/site-content-provider"

import { Reveal } from "@/components/ui/reveal"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"

export function HeroSection() {
  const { content } = useSiteContent()
  const { hero } = content.home
  const [isLoaded, setIsLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  
  const phrases = hero.phrases

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (videoRef.current && isLoaded) {
      const video = videoRef.current
      console.log('Video element found, attempting to load and play...')
      video.load()
      video.play().then(() => {
        console.log('Video playback started successfully')
      }).catch(error => {
        console.log('Video autoplay failed:', error)
      })
    }
  }, [isLoaded])

  useEffect(() => {
    if (!isLoaded) return

    const animationInterval = setInterval(() => {
      // Start fade out
      setIsFading(true)
      
      // Wait for fade out to complete, then change phrase and fade in
      setTimeout(() => {
        setCurrentPhraseIndex(prev => (prev + 1) % phrases.length)
        setIsFading(false)
      }, 500) // Half second for fade out
      
    }, 3000) // Change phrase every 3 seconds

    return () => clearInterval(animationInterval)
  }, [isLoaded, phrases.length])

  const [heroPaused, setHeroPaused] = useState(false)
  const [heroIndex, setHeroIndex] = useState(0)

  // Track the visible hero photo so it gets the slow Ken Burns zoom.
  useEffect(() => {
    if (!api) return
    const onSelect = () => setHeroIndex(api.selectedScrollSnap())
    onSelect()
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  // Auto-advance 1 → 2 → 3 → 1…; pauses while hovered/focused or when the tab is hidden.
  useEffect(() => {
    if (!api || heroPaused) return
    const id = setInterval(() => {
      if (!document.hidden) api.scrollNext()
    }, 4000)
    return () => clearInterval(id)
  }, [api, heroPaused])

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Video with Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Video (fills the area) */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-100"
          key="hero-background-video"
        >
          <source src={hero.backgroundVideoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-10 w-60 h-60 bg-secondary/10 rounded-full blur-3xl" />

      <Container className="relative z-10 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center px-4">
          <div className="max-w-4xl mx-auto text-center lg:text-left">
            <h1
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary leading-tight mb-6 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ 
                transitionDuration: "1000ms", 
                transitionProperty: "opacity, transform",
                transitionDelay: isLoaded ? "0ms" : "0ms"
              }}
            >
              {hero.title}{" "}
              <span className={`text-transparent text-5xl bg-clip-text bg-gradient-to-r from-accent via-accent to-secondary transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                {phrases[currentPhraseIndex]}
              </span>
            </h1>
            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-stretch sm:items-center transition-opacity transition-transform ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: isLoaded ? "300ms" : "0ms" }}
            >
             
              {hero.buttons.map((button) => (
                <Link key={button.label} href={button.href} target={button.href.startsWith("http") ? "_blank" : undefined} rel={button.href.startsWith("http") ? "noopener noreferrer" : undefined} className="w-full sm:w-auto">
                  <button
                    className={
                      button.variant === "primary"
                        ? "group w-full px-6 sm:px-8 py-3 sm:py-4 bg-accent text-accent-foreground rounded-lg font-semibold text-base sm:text-lg hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-1 flex items-center justify-center gap-2"
                        : "w-full px-6 sm:px-8 py-3 sm:py-4 border-2 bg-white border-white text-primary rounded-lg font-semibold text-base sm:text-lg hover:bg-primary/10"
                    }
                    style={{ transitionDuration: "300ms", transitionProperty: "all" }}
                  >
                    {button.label}
                    {button.variant === "primary" && (
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex justify-center lg:justify-end">
            <Reveal variant="right" delay={250} className="relative">
              <Carousel
                setApi={setApi}
                opts={{ loop: true }}
                className="w-[320px] sm:w-[360px] md:w-[400px]"
                onMouseEnter={() => setHeroPaused(true)}
                onMouseLeave={() => setHeroPaused(false)}
                onFocusCapture={() => setHeroPaused(true)}
                onBlurCapture={() => setHeroPaused(false)}
              >
                <CarouselContent>
                  {hero.carouselImages.map((slide, index) => (
                  // No CSS transition on slides: Embla positions them with transforms while looping,
                  // and animating that makes slides fly backwards across the carousel.
                  <CarouselItem key={`${slide.publicId ?? slide.url}-${index}`}>
                    <div className="w-[300px] sm:w-[340px] md:w-[380px] h-[440px] sm:h-[500px] md:h-[540px] rounded-[32px] border bg-card overflow-hidden">
                      <div className="relative w-full h-full">
                        {slide.publicId ? (
                         <CloudinaryImage
                          publicId={slide.publicId}
                          alt={slide.alt}
                          width={380}
                          height={540}
                          className={`absolute inset-0 w-full h-full object-cover rounded-[32px] ${index === heroIndex ? "about-kenburns" : ""}`}
                        />
                        ) : slide.url ? (
                          <Image
                            src={slide.url}
                            alt={slide.alt}
                            width={380}
                            height={540}
                            className={`absolute inset-0 w-full h-full object-cover rounded-[32px] ${index === heroIndex ? "about-kenburns" : ""}`}
                          />
                        ) : null}
                        <div className="absolute inset-0  "></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
      
      {/* Legacy About Section */}
      <div className="relative -mt-20 md:-mt-32">
        <LegacyAboutSection />
      </div>

      {/* Latest Sermon Section */}
      <LatestSermonSection />
    </>
  )
}

export function LegacyAboutSection() {
  const { content } = useSiteContent()
  const { about } = content.home
  const [aboutApi, setAboutApi] = useState<CarouselApi | null>(null)
  const [paused, setPaused] = useState(false)
  const [aboutIndex, setAboutIndex] = useState(0)

  // Track the visible photo so it gets the slow Ken Burns zoom (replays on every slide).
  useEffect(() => {
    if (!aboutApi) return
    const onSelect = () => setAboutIndex(aboutApi.selectedScrollSnap())
    onSelect()
    aboutApi.on("select", onSelect)
    return () => {
      aboutApi.off("select", onSelect)
    }
  }, [aboutApi])

  // Auto-slide on every screen size; pauses while hovered/focused or when the tab is hidden.
  useEffect(() => {
    if (!aboutApi || paused || about.carouselImages.length < 2) return
    const id = setInterval(() => {
      if (!document.hidden) aboutApi.scrollNext()
    }, 5000)
    return () => clearInterval(id)
  }, [aboutApi, paused, about.carouselImages.length])

  return (
    <section id="about-legacy" className="py-20 md:py-32 bg-muted relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-1/4 right-10 w-60 h-60 bg-primary/10 rounded-full blur-3xl opacity-30" />
      </div>

      <Container className="relative z-10 ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <Reveal variant="left" className="relative">
          {/* Soft gold halo behind the photos, like the About page slideshow */}
          <div className="absolute -inset-3 rounded-2xl bg-accent/20 blur-2xl" aria-hidden />
          <div className="relative h-96 rounded-xl overflow-hidden border-4 border-white/70 shadow-2xl">
            <Carousel
              setApi={setAboutApi}
              className="w-full h-full"
              opts={{
                loop: true,
              }}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocusCapture={() => setPaused(true)}
              onBlurCapture={() => setPaused(false)}
            >
              <CarouselContent className="h-full">
                {about.carouselImages.map((slide, index) => (
                <CarouselItem key={`${slide.publicId ?? slide.url}-${index}`} className="h-full overflow-hidden">
                  {slide.publicId ? (
                  <CloudinaryImage
                    publicId={slide.publicId}
                    alt={slide.alt}
                    className={`w-full h-full object-cover ${index === aboutIndex ? "about-kenburns" : ""}`}
                  />
                  ) : slide.url ? (
                  <Image
                    src={slide.url}
                    alt={slide.alt}
                    width={800}
                    height={600}
                    className={`w-full h-full object-cover ${index === aboutIndex ? "about-kenburns" : ""}`}
                  />
                  ) : null}
                </CarouselItem>
                ))}
              </CarouselContent>
              <div className="absolute inset-0 'bg-gradient-to-t' from-primary/30 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <CarouselPrevious className="bg-white/20 hover:bg-white/30 border-none" />
                <CarouselNext className="bg-white/20 hover:bg-white/30 border-none" />
              </div>
            </Carousel>
          </div>
          </Reveal>
          <div>
            <Reveal as="h2" variant="up" delay={150} className="text-4xl font-bold text-primary mb-6">
              {about.title} <span className="gold-accent font-bold">{about.highlightText}</span>
            </Reveal>
            <Reveal variant="fade" delay={300}>
              <div className="mt-3 h-1 w-16 bg-accent rounded-full mb-6" />
            </Reveal>
            <Reveal as="p" variant="up" delay={400} className="text-lg text-foreground/70 leading-relaxed mb-6 text-justify">
              {about.content}
            </Reveal>
             <Reveal variant="up" delay={550} className="mt-8">
                <Link
                  href={about.learnMoreHref} 
                  className="inline-flex items-center px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-1"
                  style={{ transition: "all 300ms ease-out" }}
                >
                  Learn More
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}

function LatestSermonSection() {
  const { content } = useSiteContent()
  const sermon = content.home.sermon
  const [showFacebookVideo, setShowFacebookVideo] = useState(false)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)

  const handleWatchNow = () => {
    setIsLoadingVideo(true)
    setShowFacebookVideo(true)
    setTimeout(() => {
      setIsLoadingVideo(false)
    }, 1000)
  }

  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-primary/5 to-transparent">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Featured Image */}
          <Reveal variant="left" className="order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-xl hover-lift group">
              {!showFacebookVideo ? (
                <>
                  <Image
                    src={sermon.featuredImageUrl}
                    alt="Featured sermon"
                    width={1280}
                    height={720}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 transition-all duration-300 flex items-center justify-center">
                    <button 
                      onClick={() => setShowFacebookVideo(true)}
                      className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-lg"
                      aria-label="Play Facebook video"
                    >
                      <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="relative w-full bg-black aspect-video">
                  <iframe
                    src={sermon.facebookVideoEmbedUrl}
                    width="560"
                    height="314"
                    style={{ border: 'none', overflow: 'hidden' }}
                    scrolling="no"
                    frameBorder="0"
                    allowFullScreen={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    className="w-full h-full"
                  />
                  <button
                    onClick={() => setShowFacebookVideo(false)}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                    aria-label="Close video"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </Reveal>

          {/* Sermon Details. On mobile this wrapper "dissolves" (display: contents) so its parts
              join the grid and the image/video sits between the description and the buttons.
              Each part rises in on scroll, one after another. */}
          <div className="contents lg:order-2 lg:block lg:space-y-6">
            <div className="order-1 space-y-6">
            {/* Category Badge */}
            <Reveal variant="up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full border border-accent/20">
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">{sermon.badge}</span>
              </div>
            </Reveal>

            {/* Title */}
            <Reveal as="h2" variant="up" delay={120} className="text-3xl sm:text-4xl lg:text-4xl font-extrabold text-primary leading-tight">
              {sermon.title}
            </Reveal>

            {/* Meta Information */}
            <Reveal variant="up" delay={220} className="space-y-3 text-foreground/70">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-accent"/>
                <span className="text-sm sm:text-base">{sermon.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <User size={20} className="text-accent"/>
                <span className="text-sm sm:text-base">{sermon.speaker}</span>
              </div>
            </Reveal>

            {/* Summary */}
            <Reveal variant="up" delay={320} className="text-base sm:text-lg text-foreground/80 leading-relaxed text-justify">
              {sermon.summaryParagraphs.map((paragraph, index) => (
                <p key={index} className={index > 0 ? "mt-4" : undefined}>{paragraph}</p>
              ))}

              {sermon.quote && <p className="mt-4">{sermon.quote}</p>}

            </Reveal>

            {/* Key Points */}
            <Reveal variant="up" delay={420} className="space-y-2">
              <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Key Topics</h3>
              <div className="flex flex-wrap gap-2">
                {sermon.keyTopics.map((topic, index) => (
                  <span
                    key={`hero-${topic}-${index}`}
                    className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </Reveal>
            </div>

            {/* Action Buttons */}
            <Reveal variant="up" delay={200} className="order-3 flex flex-col sm:flex-row gap-3 lg:pt-4">
              <button 
                onClick={() => window.open(sermon.watchNowUrl, '_blank', 'noopener,noreferrer')}
                className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sermon.watchNowLabel || "Watch Now"}
              </button>
              <button 
                onClick={() => window.open(sermon.downloadAppUrl, '_blank', 'noopener,noreferrer')}
                className="px-8 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-all duration-300"
              >
                {sermon.downloadAppLabel || "Download App"}
              </button>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}





