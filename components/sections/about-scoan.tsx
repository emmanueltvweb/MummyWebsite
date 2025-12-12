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

interface AboutSCOANProps {
  autoPlayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  infiniteLoop?: boolean
}

const carouselSlides: CarouselSlide[] = [
  {
    id: 1,
    title: "Introduction",
    subtitle: "The Synagogue, Church of All Nations (SCOAN)",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        The Synagogue, Church of All Nations (SCOAN) is a charismatic Christian megachurch located in Lagos, Nigeria. Founded by Prophet T.B. Joshua in 1991, SCOAN has grown to become one of the most influential churches in Africa and a major destination for Christian pilgrims from around the world, known for its healing ministry, prophetic declarations, and humanitarian works.
      </div>
    ),
    image: {
      src: "/scoan-building.jpg",
      alt: "The Synagogue, Church of All Nations",
      position: "right"
    }
  },
  {
    id: 2,
    title: "Founding and Early Days",
    subtitle: "The Synagogue, Church of All Nations (SCOAN)",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          SCOAN was founded by Prophet T.B. Joshua in 1991, starting as a small gathering in a humble structure in the swampy area of Ikotun-Egbe, Lagos State. The name was divinely inspired, reflecting the church's global calling to be a "Synagogue" for "All Nations."
        </div>
        <div className="mt-5">
          In its early days, the church faced numerous challenges and persecutions, but through divine grace and the manifestation of God's power, it grew rapidly as people witnessed healings, deliverances, and accurate prophecies.
        </div>
      </div>
    ),
    image: {
      src: "/scoan-early.jpg",
      alt: "Early SCOAN Building",
      position: "left"
    }
  },
  {
    id: 3,
    title: "Global Recognition",
    subtitle: "The Synagogue, Church of All Nations (SCOAN)",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          SCOAN gained international recognition as a place where God's power is evidently at work. The church became a major destination for Christian pilgrims from all over the world, with visitors coming to witness healing, deliverance, and receive prophetic guidance.
        </div>
        <div className="mt-5">
          According to official figures from the Nigeria Immigration Service, by 2018, "Six out of every ten foreign travellers coming into Nigeria are bound for The Synagogue, Church of All Nations," making it the biggest attraction for foreign visitors to Nigeria.
        </div>
      </div>
    ),
    image: {
      src: "/scoan-global.jpg",
      alt: "International Visitors at SCOAN",
      position: "right"
    }
  },
  {
    id: 4,
    title: "Ministry and Services",
    subtitle: "The Synagogue, Church of All Nations (SCOAN)",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          SCOAN is renowned for its healing ministry, where countless people have testified to receiving healing from various ailments, diseases, and conditions through prayer and the anointing of God. The church also conducts deliverance sessions, freeing people from spiritual bondages and demonic oppression.
        </div>
        <div className="mt-5">
          The church holds regular services, including Sunday services, Tuesday healing and deliverance services, and Friday all-night vigils. These services are characterized by powerful worship, prophetic ministrations, and the manifestation of the Holy Spirit.
        </div>
      </div>
    ),
    image: {
      src: "/scoan-service.jpg",
      alt: "SCOAN Worship Service",
      position: "left"
    }
  },
  {
    id: 5,
    title: "Humanitarian Works",
    subtitle: "The Synagogue, Church of All Nations (SCOAN)",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Through the Emmanuel Global Network, SCOAN has been involved in extensive humanitarian works, providing scholarships to thousands of students, supporting widows and orphans, building schools and hospitals, and providing relief materials during natural disasters.
        </div>
        <div className="mt-5">
          The church's charitable efforts extend to over 50 countries, where it provides humanitarian aid, medical assistance, educational support, and community development programs, embodying the Christian principle of love and service to humanity.
        </div>
      </div>
    ),
    image: {
      src: "/scoan-charity.jpg",
      alt: "SCOAN Humanitarian Work",
      position: "right"
    }
  },
  {
    id: 6,
    title: "New Leadership Era",
    subtitle: "The Synagogue, Church of All Nations (SCOAN)",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Following the glorious home call of Prophet T.B. Joshua on June 5, 2021, the mantle of leadership fell on his wife, Pastor Evelyn Joshua, according to God's divine mandate and plan. Under her leadership, SCOAN continues to thrive and expand its global reach.
        </div>
        <div className="mt-5">
          Under Pastor Evelyn Joshua's guidance, SCOAN maintains its commitment to spreading the gospel, demonstrating God's power through healing and deliverance, and continuing the humanitarian legacy established by her late husband. The church continues to be a beacon of hope and transformation for people worldwide.
        </div>
      </div>
    ),
    image: {
      src: "/scoan-leadership.jpg",
      alt: "Pastor Evelyn Joshua at SCOAN",
      position: "left"
    }
  }
]

export function AboutSCOANSection({ 
  autoPlayInterval = 5000, 
  showDots = true, 
  showArrows = true, 
  infiniteLoop = true 
}: AboutSCOANProps) {
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
            The Synagogue, Church of All Nations
          </h2>
          <p className="text-lg sm:text-xl text-foreground/60 max-w-3xl mx-auto">
            A global center for healing, deliverance, and the manifestation of God's power
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