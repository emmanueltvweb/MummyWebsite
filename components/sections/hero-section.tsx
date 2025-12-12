"use client"

import { useEffect, useState } from "react"
import { Container } from "@/components/layout/container"
import { ArrowRight, X, Circle } from "lucide-react"
import Link from "next/link"

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
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  
  const phrases = ["And Win Today", "Win Tomorrow", "And Win Forever"]

  useEffect(() => {
    setIsLoaded(true)
  }, [])

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

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted" />
        <img
          src="/placeholder.svg?key=vw80m&width=1920&height=1080"
          alt="Pastoral background"
          loading="lazy"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-32 left-10 w-60 h-60 bg-secondary/10 rounded-full blur-3xl opacity-30" />

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
              {/* <p
            className={`text-base sm:text-lg md:text-2xl text-foreground/70 mb-8 leading-relaxed transition-all duration-1000 delay-200 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Welcome to Pastor Evelyn Joshua Website
          </p> */}
              <Link href="https://www.scoan.org/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <button className="group w-full px-6 sm:px-8 py-3 sm:py-4 bg-accent text-accent-foreground rounded-lg font-semibold text-base sm:text-lg hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-1 flex items-center justify-center gap-2"
                  style={{ transitionDuration: "300ms", transitionProperty: "all" }}>
                  Visit SCOAN
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="https://emmanuel.tv/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <button className="w-full px-6 sm:px-8 py-3 sm:py-4 border-2 border-primary text-primary rounded-lg font-semibold text-base sm:text-lg hover:bg-primary/10"
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
                        <img
                          src="/Evelyn-Joshua3.jpg"
                          alt="Slide visual"
                          loading="lazy"
                          decoding="async"
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
                        <img
                          src="/Mummy.jpg"
                          alt="Slide visual"
                          loading="lazy"
                          decoding="async"
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
                        <img
                          src="/Evelyn-Joshua3.jpg"
                          alt="Slide visual"
                          loading="lazy"
                          decoding="async"
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

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-8 h-12 border-2 border-accent rounded-full flex items-center justify-center">
          <div className="w-1 h-2 bg-accent rounded-full animate-pulse" />
        </div>
      </div>
    </section>
      
      {/* Legacy About Section */}
      <div className="relative -mt-20 md:-mt-32">
        <LegacyAboutSection />
      </div>
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
            <img
              src="/Evelyn-Joshua3.jpg"
              alt="Pastor Evelyn Onyisi Joshua"
              className="w-full h-full object-cover hover:scale-105"
              style={{ transitionDuration: "500ms", transitionProperty: "transform" }}
            />
            <div className="absolute inset-0 'bg-gradient-to-t' from-primary/30 via-transparent to-transparent" />
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
              About <span className="gold-accent font-bold">Pastor Evelyn Onyisi Joshua</span>
            </h2>
            <div className="mt-3 h-1 w-16 bg-accent rounded-full mb-6" />
            <p className="text-lg text-foreground/70 leading-relaxed mb-6 text-justify">
              Pastor Evelyn Onyisi Joshua is a Nigerian minister of God, pastor, preacher and tele-evangelist. She is
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





