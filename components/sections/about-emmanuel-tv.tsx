"use client"

import { Container } from "@/components/layout/container"
import { useInView } from "@/hooks/use-in-view"
import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselSlide {
  id: number
  title: string
  subtitle: string
  content: React.ReactNode
  image: {
    src: string
    alt: string
    position: 'left' | 'right'
  }
}

interface AboutCarouselProps {
  autoPlayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  infiniteLoop?: boolean
}

const carouselSlides: CarouselSlide[] = [
  {
    id: 1,
    title: "Spreading Messages of Love, Hope and Salvation through the Gospel of Jesus Christ",
    subtitle: "Emmanuel TV",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
       <a href="https://emmanuel.tv/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">Emmanuel TV</a> was Founded by <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">Prophet TB Joshua</a> by the inspiration of the Holy Spirit with the main aim of ensuring that the Word of God and the manifestations of His loving-kindness reach every corner of the world, <a href="https://emmanuel.tv/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">Emmanuel TV</a> has maintained its God-given reputation as the most widely watched Christian station of the 21st century.
         <div className="mt-5">
          Its impact in Changing Lives, Changing Nations and Changing the World can be felt as multitudes from different nations of the world have been led to salvation through the finished works of our Lord and Saviour Jesus Christ.
        </div>
         <div className="mt-5">
          All through the 18 impactful years of its existence, <a href="https://emmanuel.tv/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">Emmanuel TV</a> has continued to be a medium of change and transformation, with its influence breaking the barriers of race, age, gender and religion all over the world.
        </div>
      </div>
    ),
    image: {
      src: "/emmanueltv/logo.png",
      alt: "Emmanuel TV Logo",
      position: "right"
    }
  },
 ]

export function AboutEmmanuelTVSection({ 
  autoPlayInterval = 5000, 
  showDots = true, 
  showArrows = true, 
  infiniteLoop = true 
}: AboutCarouselProps) {
  const { ref, isInView } = useInView({ threshold: 0.2 })
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  const totalSlides = carouselSlides.length

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => 
      infiniteLoop ? (prev + 1) % totalSlides : Math.min(prev + 1, totalSlides - 1)
    )
  }, [totalSlides, infiniteLoop])

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => 
      infiniteLoop ? (prev - 1 + totalSlides) % totalSlides : Math.max(prev - 1, 0)
    )
  }, [totalSlides, infiniteLoop])

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && isInView) {
      autoPlayRef.current = setInterval(nextSlide, autoPlayInterval)
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlaying, isInView, nextSlide, autoPlayInterval])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInView) return
      
      switch (e.key) {
        case 'ArrowLeft':
          prevSlide()
          break
        case 'ArrowRight':
          nextSlide()
          break
        case ' ':
          e.preventDefault()
          setIsAutoPlaying(prev => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isInView, nextSlide, prevSlide])

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
  }

  const renderSlide = (slide: CarouselSlide, index: number) => {
    const isActive = index === currentSlide
    const isPrev = index === (currentSlide - 1 + totalSlides) % totalSlides
    const isNext = index === (currentSlide + 1) % totalSlides

    return (
      <div
        key={slide.id}
        className={`absolute inset-0 transition-all duration-700 ease-in-out ${
          isActive ? 'opacity-100 translate-x-0 z-10' : 
          isPrev ? 'opacity-0 -translate-x-full pointer-events-none' : 
          isNext ? 'opacity-0 translate-x-full pointer-events-none' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isActive}
        role="tabpanel"
        aria-labelledby={`slide-${slide.id}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start min-h-[500px] lg:min-h-[400px]">
          {slide.image.position === 'left' && (
            <div className={`transition-all duration-700 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <div className="relative mx-auto aspect-square w-56 sm:w-64 md:w-80 lg:w-96 rounded-full overflow-hidden border group mb-6 lg:mb-0">
                <img
                  src={slide.image.src}
                  alt={slide.image.alt}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
              </div>
            </div>
          )}
          
          <div className={`transition-all duration-700 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-accent font-semibold tracking-wide mb-2">{slide.subtitle}</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary leading-tight">
              {slide.title}
            </h2>
            <div className="mt-2 h-1 w-12 bg-accent rounded-full" />
            <div className="mt-4 sm:mt-6 max-h-[400px] lg:max-h-[300px] overflow-y-auto">
              {slide.content}
            </div>
          </div>
          
          {slide.image.position === 'right' && (
            <div className={`transition-all duration-700 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <div className="relative mx-auto aspect-square w-56 sm:w-64 md:w-80 lg:w-96 rounded-full overflow-hidden border group mb-6 lg:mb-0">
                <img
                  src={slide.image.src}
                  alt={slide.image.alt}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <section id="about-emmanuel-tv" ref={ref} className="py-20 md:py-32 bg-muted">
      <Container>
        <div className="space-y-12">
          {/* Carousel Container */}
          <div 
            className="relative min-h-[700px] lg:min-h-[600px] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="region"
            aria-label="About Emmanuel TV - Carousel"
          >
            {carouselSlides.map((slide, index) => renderSlide(slide, index))}
            
            {/* Navigation Arrows */}
            {showArrows && totalSlides > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous slide"
                  disabled={!infiniteLoop && currentSlide === 0}
                >
                  <ChevronLeft className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                </button>
                
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next slide"
                  disabled={!infiniteLoop && currentSlide === totalSlides - 1}
                >
                  <ChevronRight className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                </button>
              </>
            )}
          </div>

          {/* Dot Indicators */}
          {showDots && totalSlides > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="mr-4 px-3 py-1 text-sm rounded-full bg-primary/10 hover:bg-primary/20 transition-colors duration-300"
                aria-label={isAutoPlaying ? "Pause auto-play" : "Start auto-play"}
              >
                {isAutoPlaying ? 'Pause' : 'Play'}
              </button>
              
              {carouselSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? "bg-accent w-8" 
                      : "bg-primary/30 hover:bg-primary/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                  aria-current={index === currentSlide}
                  role="tab"
                  id={`slide-${slide.id}`}
                />
              ))}
            </div>
          )}

          {/* Slide Counter */}
          <div className="text-center text-sm text-foreground/60">
            {currentSlide + 1} of {totalSlides}
          </div>
          
          {/* Read More Button */}
          <div className="text-center mt-4">
            <a
              href="https://emmanuel.tv/emmanuel-tv/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-accent hover:bg-accent/90 text-primary font-bold rounded-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              aria-label="Read more about Emmanuel TV"
            >
              Know More About Emmanuel TV
            </a>
          </div>
        </div>
      </Container>
    </section>
  )
}