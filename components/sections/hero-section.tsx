"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Container } from "@/components/layout/container"
import { ArrowRight, X, Circle, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import CloudinaryImage from "@/components/cloudinary-image"

import { useInView } from "@/hooks/use-in-view"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const [showFacebookVideo, setShowFacebookVideo] = useState(false)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  
  const phrases = ["And Win Today", "Win Tomorrow", "And Win Forever"]

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
  }, [isLoaded])

  useEffect(() => {
    if (!api) return
    const id = setInterval(() => {
      api.scrollNext()
    }, 4000)
    return () => clearInterval(id)
  }, [api])

  const handleWatchNow = () => {
    setIsLoadingVideo(true)
    setShowFacebookVideo(true)
    setTimeout(() => {
      setIsLoadingVideo(false)
    }, 1000)
  }

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
          <source src="https://res.cloudinary.com/dvlcc2r5w/video/upload/v1771257266/HEADER_2026_HD_jltk79.mp4" type="video/mp4" />
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
              Good Morning,{" "}
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
             
              <Link href="https://www.scoan.org/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <button className="group w-full px-6 sm:px-8 py-3 sm:py-4 bg-accent text-accent-foreground rounded-lg font-semibold text-base sm:text-lg hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-1 flex items-center justify-center gap-2"
                  style={{ transitionDuration: "300ms", transitionProperty: "all" }}>
                  Visit SCOAN
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="https://emmanuel.tv/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <button className="w-full px-6 sm:px-8 py-3 sm:py-4 border-2 bg-white border-white text-primary rounded-lg font-semibold text-base sm:text-lg hover:bg-primary/10"
                  style={{ transitionDuration: "300ms", transitionProperty: "all" }}>
                  Visit Emmanuel TV
                </button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex justify-center lg:justify-end">
            <div className="relative">
              <Carousel 
                setApi={setApi} 
                opts={{ loop: true }} 
                className="w-[320px] sm:w-[360px] md:w-[400px]"
              >
                <CarouselContent>
                  <CarouselItem className="ease-out data-[active]:scale-100 data-[active]:opacity-100 data-[inactive]:scale-95 data-[inactive]:opacity-70"
                    style={{ transitionDuration: "500ms", transitionProperty: "all" }}>
                    <div className="w-[300px] sm:w-[340px] md:w-[380px] h-[440px] sm:h-[500px] md:h-[540px] rounded-[32px] border bg-card overflow-hidden">
                      <div className="relative w-full h-full">
                         <CloudinaryImage
                          publicId="1_x7bruj"
                          alt="Slide visual"
                          width={380}
                          height={540}
                          className="absolute inset-0 w-full h-full object-cover rounded-[32px]"
                        />
                        <div className="absolute inset-0  "></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                  <CarouselItem className="ease-out data-[active]:scale-100 data-[active]:opacity-100 data-[inactive]:scale-95 data-[inactive]:opacity-70"
                    style={{ transitionDuration: "500ms", transitionProperty: "all" }}>
                    <div className="w-[300px] sm:w-[340px] md:w-[380px] h-[440px] sm:h-[500px] md:h-[540px] rounded-[32px] border bg-card shadow-2xl overflow-hidden">
                     
                      <div className="relative w-full h-full">
                        <CloudinaryImage
                          publicId="9_kx36sj"
                          alt="Slide visual"
                          width={380}
                          height={540}
                          className="absolute inset-0 w-full h-full object-cover rounded-[32px]"
                        />
                        <div className="absolute inset-0  rounded-[32px]"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        </div>
                      </div>
                
                    </div>
                  </CarouselItem>
                  <CarouselItem className="ease-out data-[active]:scale-100 data-[active]:opacity-100 'data-[inactive]:scale-95 data-[inactive]:opacity-70'"
                    style={{ transitionDuration: "500ms", transitionProperty: "all" }}>
                    <div className="w-[300px] sm:w-[340px] md:w-[380px] h-[440px] sm:h-[500px] md:h-[540px] rounded-[32px] border bg-card overflow-hidden">
                      <div className="relative w-full h-full">
                        <CloudinaryImage
                          publicId="4_mzjoik"
                          alt="Slide visual"
                          width={380}
                          height={540}
                          className="absolute inset-0 w-full h-full object-cover rounded-[32px]"
                        />
                        <div className="absolute inset-0 'bg-gradient-to-t' from-black/60 via-transparent to-transparent rounded-[32px]"></div>
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious aria-label="Previous" />
                <CarouselNext aria-label="Next" />
              </Carousel>
            </div>
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
  const { ref, isInView } = useInView({ threshold: 0.2 })

  return (
    <section id="about-legacy" ref={ref} className="py-20 md:py-32 bg-muted relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-1/4 right-10 w-60 h-60 bg-primary/10 rounded-full blur-3xl opacity-30" />
      </div>
      
      <Container className="relative z-10 ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div
            className={`relative h-96 rounded-xl overflow-hidden ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
            style={{ transitionDuration: "1000ms", transitionProperty: "opacity, transform" }}
          >
            <Carousel 
              className="w-full h-full"
              plugins={[
               
              ]}
              opts={{
                loop: true,
              }}
            >
              <CarouselContent className="h-full">
                <CarouselItem className="h-full">
                  <CloudinaryImage
                    publicId="mum4_zmw7iw"
                    alt="Pastor Evelyn Joshua"
                    className="w-full h-full object-cover hover:scale-105"
                    style={{ transitionDuration: "500ms", transitionProperty: "transform" }}
                  />
                </CarouselItem>
                <CarouselItem className="h-full">
                  <CloudinaryImage
                    publicId="mummy_uoj32n"
                    alt="Pastor Evelyn Joshua Ministry"
                    className="w-full h-full object-cover hover:scale-105"
                    style={{ transitionDuration: "500ms", transitionProperty: "transform" }}
                  />
                </CarouselItem>
                <CarouselItem className="h-full">
                  <CloudinaryImage
                    publicId="mum3_gf7bo7"
                    alt="Pastor Evelyn Joshua Service"
                    className="w-full h-full object-cover hover:scale-105"
                    style={{ transitionDuration: "500ms", transitionProperty: "transform" }}
                  />
                </CarouselItem>
              </CarouselContent>
              <div className="absolute inset-0 'bg-gradient-to-t' from-primary/30 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <CarouselPrevious className="bg-white/20 hover:bg-white/30 border-none" />
                <CarouselNext className="bg-white/20 hover:bg-white/30 border-none" />
              </div>
            </Carousel>
          </div>
          <div
            className={`${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
            style={{ 
              transitionDuration: "1000ms", 
              transitionDelay: isInView ? "300ms" : "0ms",
              transitionProperty: "opacity, transform"
            }}
          >
            <h2 className="text-4xl font-bold text-primary mb-6 bg">
              About <span className="gold-accent font-bold">Pastor Evelyn Joshua</span>
            </h2>
            <div className="mt-3 h-1 w-16 bg-accent rounded-full mb-6" />
            <p className="text-lg text-foreground/70 leading-relaxed mb-6 text-justify">
              Pastor Evelyn Joshua is a Nigerian minister of God, pastor, preacher and tele-evangelist. She is
              the Senior Pastor and Leader of world renowned charismatic Christian ministry, The Synagogue, Church of
              All Nations (The SCOAN). Evelyn is also the President of Emmanuel Global Network (Owner of Emmanuel TV).
            </p>
             <div className="mt-8">
                <Link 
                  href="/about" 
                  className="inline-flex items-center px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-1"
                  style={{ transition: "all 300ms ease-out" }}
                >
                  Learn More
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

function LatestSermonSection() {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center animate-scale-up">
          {/* Featured Image */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-xl hover-lift group">
              {!showFacebookVideo ? (
                <>
                  <Image
                    src="https://res.cloudinary.com/dvlcc2r5w/image/upload/v1773053310/EMMANUEL_TV_-_20_YEARS_OF_GOD_S_GLORY_-_Pastor_Evelyn_Joshua_Sermon_Landscape_co6hnh.png"
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
                    src="https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1429301158950052%2F&show_text=false&width=560&t=0"
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
          </div>

          {/* Sermon Details */}
          <div className="order-1 lg:order-2 space-y-6 animate-slide-in-right">
            {/* Category Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full border border-accent/20">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Latest Sermon</span>
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-4xl font-extrabold text-primary leading-tight">
              EMMANUEL TV - 20 YEARS OF GOD'S GLORY<span className="text-accent"></span> 
            </h2>

            {/* Meta Information */}
            <div className="space-y-3 text-foreground/70">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-accent"/>
                <span className="text-sm sm:text-base">March 08, 2026</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-accent"/>
                <span className="text-sm sm:text-base">22 minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <User size={20} className="text-accent"/>
                <span className="text-sm sm:text-base">Pastor Evelyn Joshua Sermon</span>
              </div>
            </div>

            {/* Summary */}
            <div className="text-base sm:text-lg text-foreground/80 leading-relaxed text-justify">
              In her address during The Emmanuel TV 20th Anniversary, Pastor Evelyn Joshua gives a message on love, faith and standing firm during trials.

              <p className="mt-4">Reading from James 1:2-8, The SCOAN Leader enjoins us to persevere in faith, love and the rendering of service to fellow humans - in the manner taught by Prophet TB Joshua via the example of Emmanuel TV.</p>



              <p className="mt-4">"Your faith will not grow until you are placed in a situation that requires more than you have ever had." - Pastor Evelyn Joshua.</p>

            </div>

            {/* Key Points */}
            <div className="space-y-2">
              <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Key Topics</h3>
              <div className="flex flex-wrap gap-2">
                {["Trust in God", "Faith", "Perseverance", "Joyful Life"].map((topic, index) => (
                  <span
                    key={`hero-${topic}-${index}`}
                    className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button 
                onClick={() => window.open('https://www.stream.emmanuel.tv/title/conquering-with-faith-and-love-%7C-pastor-evelyn-joshua-sermon/en?id=69adfbcde4b064133a2afdd4&type=vod&isFromTabLayout=true', '_blank', 'noopener,noreferrer')}
                className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Watch Now
              </button>
              <button 
                onClick={() => window.open('https://emmanuel.tv/download/', '_blank', 'noopener,noreferrer')}
                className="px-8 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-all duration-300"
              >
                Download App
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}





