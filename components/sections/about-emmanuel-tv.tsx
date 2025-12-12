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

interface AboutEmmanuelTVProps {
  autoPlayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  infiniteLoop?: boolean
}

const carouselSlides: CarouselSlide[] = [
  {
    id: 1,
    title: "Introduction",
    subtitle: "Emmanuel TV",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        Emmanuel TV is a Christian television network founded by Prophet T.B. Joshua, dedicated to broadcasting the gospel of Jesus Christ to the world. The network has become one of the most watched Christian television stations globally, reaching millions of homes across multiple continents with its unique blend of spiritual content, healing services, and humanitarian programming.
      </div>
    ),
    image: {
      src: "/emmanuel-tv-studio.jpg",
      alt: "Emmanuel TV Studio",
      position: "right"
    }
  },
  {
    id: 2,
    title: "Founding and Vision",
    subtitle: "Emmanuel TV",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Emmanuel TV was established with the divine vision to reach the world with the gospel of Jesus Christ through modern media technology. The name "Emmanuel" means "God with us," reflecting the network's mission to demonstrate God's presence and power in the lives of people.
        </div>
        <div className="mt-5">
          From its humble beginnings in Lagos, Nigeria, Emmanuel TV has grown to become a global phenomenon, broadcasting 24/7 to millions of viewers worldwide through satellite, cable, and digital platforms.
        </div>
      </div>
    ),
    image: {
      src: "/emmanuel-tv-vision.jpg",
      alt: "Emmanuel TV Broadcasting",
      position: "left"
    }
  },
  {
    id: 3,
    title: "Global Reach",
    subtitle: "Emmanuel TV",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Emmanuel TV has established itself as one of the most influential Christian television networks globally, with a presence in over 100 countries. The network's programming reaches millions of viewers daily, making it a powerful tool for evangelism and spiritual transformation.
        </div>
        <div className="mt-5">
          Through strategic partnerships with international broadcasters and digital platforms, Emmanuel TV continues to expand its reach, bringing the message of hope, healing, and deliverance to every corner of the world.
        </div>
      </div>
    ),
    image: {
      src: "/emmanuel-tv-global.jpg",
      alt: "Emmanuel TV Global Broadcast",
      position: "right"
    }
  },
  {
    id: 4,
    title: "Programming and Content",
    subtitle: "Emmanuel TV",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Emmanuel TV offers diverse programming that caters to the spiritual needs of its global audience. The network features live services from The SCOAN, including healing sessions, deliverance services, and prophetic ministrations that have transformed countless lives.
        </div>
        <div className="mt-5">
          Other popular programs include "Live from The SCOAN," "Distance is Not a Barrier," "Emmanuel TV Partners," and various humanitarian documentaries showcasing the network's charitable works around the world.
        </div>
      </div>
    ),
    image: {
      src: "/emmanuel-tv-content.jpg",
      alt: "Emmanuel TV Programming",
      position: "left"
    }
  },
  {
    id: 5,
    title: "Technology and Innovation",
    subtitle: "Emmanuel TV",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Emmanuel TV has been at the forefront of Christian broadcasting technology, utilizing state-of-the-art equipment and innovative production techniques to deliver high-quality spiritual content. The network's studios in Lagos are equipped with modern facilities that enable professional programming.
        </div>
        <div className="mt-5">
          The network has embraced digital transformation, offering streaming services, mobile applications, and social media integration to reach younger audiences and adapt to changing viewing habits in the digital age.
        </div>
      </div>
    ),
    image: {
      src: "/emmanuel-tv-tech.jpg",
      alt: "Emmanuel TV Technology",
      position: "right"
    }
  },
  {
    id: 6,
    title: "Leadership and Future",
    subtitle: "Emmanuel TV",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Following the home call of Prophet T.B. Joshua in 2021, Emmanuel TV continues under the leadership of Pastor Evelyn Joshua, who carries forward the vision and mission of the network. Under her guidance, Emmanuel TV remains committed to spreading the gospel and demonstrating God's power.
        </div>
        <div className="mt-5">
          The network continues to evolve and expand, with plans for enhanced programming, broader international coverage, and innovative digital initiatives that will ensure Emmanuel TV remains a leading voice in Christian broadcasting for generations to come.
        </div>
      </div>
    ),
    image: {
      src: "/emmanuel-tv-future.jpg",
      alt: "Emmanuel TV Future",
      position: "left"
    }
  }
]

export function AboutEmmanuelTVSection({ 
  autoPlayInterval = 5000, 
  showDots = true, 
  showArrows = true, 
  infiniteLoop = true 
}: AboutEmmanuelTVProps) {
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

  // Touch/swipe functionality
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
    }
    if (isRightSwipe) {
      prevSlide()
    }
  }

  const handleMouseEnter = () => setIsAutoPlaying(false)
  const handleMouseLeave = () => setIsAutoPlaying(true)

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-background">
      <Container className="max-w-7xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Emmanuel TV
          </h2>
          <p className="text-lg sm:text-xl text-foreground/60 max-w-3xl mx-auto">
            Spreading the gospel of Jesus Christ to the world through television
          </p>
        </div>

        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm border border-border/20">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {carouselSlides.map((slide, index) => (
                <div key={slide.id} className="w-full flex-shrink-0">
                  <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-8 lg:p-12 min-h-[500px]">
                    {slide.image.position === 'left' && (
                      <div className="relative order-1 lg:order-1">
                        <div className="aspect-[4/5] rounded-xl overflow-hidden bg-gradient-to-br from-accent/10 to-accent/20">
                          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/30 flex items-center justify-center text-accent/40">
                            <span className="text-sm">Image: {slide.image.alt}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className={`flex flex-col justify-center ${slide.image.position === 'left' ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`}>
                      <div className="mb-6">
                        <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                          {slide.title}
                        </h3>
                        <h4 className="text-lg sm:text-xl text-accent font-semibold mb-4">
                          {slide.subtitle}
                        </h4>
                      </div>
                      
                      <div className="flex-1">
                        {slide.content}
                      </div>
                    </div>

                    {slide.image.position === 'right' && (
                      <div className="relative order-1 lg:order-2">
                        <div className="aspect-[4/5] rounded-xl overflow-hidden bg-gradient-to-br from-accent/10 to-accent/20">
                          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/30 flex items-center justify-center text-accent/40">
                            <span className="text-sm">Image: {slide.image.alt}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {showArrows && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/20 flex items-center justify-center text-foreground hover:bg-background transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!infiniteLoop && currentSlide === 0}
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/20 flex items-center justify-center text-foreground hover:bg-background transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!infiniteLoop && currentSlide === totalSlides - 1}
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {showDots && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentSlide
                      ? 'bg-accent w-6'
                      : 'bg-foreground/30 hover:bg-foreground/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Slide Counter */}
        <div className="flex justify-center mt-6">
          <div className="bg-card/50 backdrop-blur-sm border border-border/20 rounded-full px-4 py-2">
            <span className="text-sm text-foreground/60">
              {currentSlide + 1} / {totalSlides}
            </span>
          </div>
        </div>
      </Container>
    </section>
  )
}