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

interface AboutTBJoshuaCarouselProps {
  autoPlayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  infiniteLoop?: boolean
}

const carouselSlides: CarouselSlide[] = [
  {
    id: 1,
    title: "Introduction",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        Prophet Temitope Balogun Joshua (June 12, 1963 – June 5, 2021) was a Nigerian charismatic pastor, televangelist, and philanthropist. He was the founder and leader of The Synagogue, Church of All Nations (SCOAN), a Christian megachurch that runs the Emmanuel TV television station from Lagos, Nigeria. He was one of the most influential religious leaders in Africa and was known for his prophetic abilities, healing ministry, and charitable works.
      </div>
    ),
    image: {
      src: "/tb-joshua-portrait.jpg",
      alt: "Prophet T.B. Joshua",
      position: "right"
    }
  },
  {
    id: 2,
    title: "Early Life and Calling",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Born on June 12, 1963, in the small village of Arigidi Akoko, Ondo State, Nigeria, T.B. Joshua came from a humble background. His birth was said to be accompanied by remarkable prophecies and supernatural signs that indicated his divine calling from an early age.
        </div>
        <div className="mt-5">
          He spent 15 months in his mother's womb and was said to have started preaching and prophesying from a very young age. His early life was marked by spiritual experiences that set him apart from his peers and prepared him for his future ministry.
        </div>
      </div>
    ),
    image: {
      src: "/tb-joshua-early.jpg",
      alt: "Young Prophet T.B. Joshua",
      position: "left"
    }
  },
  {
    id: 3,
    title: "Ministry Beginnings",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          In 1987, Prophet T.B. Joshua founded The Synagogue, Church of All Nations (SCOAN) with just a handful of members. The ministry began in a small, humble structure in the swampy area of Ikotun-Egbe, Lagos State, Nigeria.
        </div>
        <div className="mt-5">
          Despite facing numerous challenges and persecutions in the early years, the ministry grew rapidly as people witnessed the manifestation of God's power through healings, deliverances, and accurate prophecies. The church's name, "Synagogue, Church of All Nations," was divinely inspired, reflecting its global calling.
        </div>
      </div>
    ),
    image: {
      src: "/tb-joshua-ministry.jpg",
      alt: "Prophet T.B. Joshua preaching",
      position: "right"
    }
  },
  {
    id: 4,
    title: "Global Impact",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Prophet T.B. Joshua's ministry became a global phenomenon, attracting visitors from all over the world to SCOAN. His Emmanuel TV became one of the most watched Christian television stations globally, reaching millions of homes across multiple continents.
        </div>
        <div className="mt-5">
          His prophetic ministry was marked by accurate predictions about global events, political developments, and natural disasters. He was sought after by world leaders, celebrities, and ordinary people alike for counsel, healing, and spiritual guidance.
        </div>
      </div>
    ),
    image: {
      src: "/tb-joshua-global.jpg",
      alt: "Prophet T.B. Joshua with international visitors",
      position: "left"
    }
  },
  {
    id: 5,
    title: "Philanthropy and Charity",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Prophet T.B. Joshua was renowned for his extensive charitable works through the Emmanuel Global Network. He provided scholarships to thousands of students, supported widows and orphans, built schools and hospitals, and provided relief materials during natural disasters.
        </div>
        <div className="mt-5">
          His philanthropic efforts extended to over 50 countries, where he provided humanitarian aid, medical assistance, and educational support. He believed strongly that "the beauty of Christianity is in giving" and lived this principle throughout his life.
        </div>
      </div>
    ),
    image: {
      src: "/tb-joshua-charity.jpg",
      alt: "Prophet T.B. Joshua helping the needy",
      position: "right"
    }
  },
  {
    id: 6,
    title: "Legacy and Home Call",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          On June 5, 2021, Prophet T.B. Joshua answered the glorious home call, leaving behind a rich legacy of faith, service, and impact. His transition marked the end of an era but the beginning of a new chapter in the ministry he founded.
        </div>
        <div className="mt-5">
          His legacy continues through the ministry he established, the countless lives he touched, and the spiritual foundation he laid. He was succeeded by his wife, Pastor Evelyn Joshua, who continues to carry the mantle of leadership at SCOAN and Emmanuel TV.
        </div>
      </div>
    ),
    image: {
      src: "/tb-joshua-legacy.jpg",
      alt: "Prophet T.B. Joshua's legacy",
      position: "left"
    }
  }
]

export function AboutTBJoshuaSection({ 
  autoPlayInterval = 5000, 
  showDots = true, 
  showArrows = true, 
  infiniteLoop = true 
}: AboutTBJoshuaCarouselProps) {
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
            Prophet T.B. Joshua
          </h2>
          <p className="text-lg sm:text-xl text-foreground/60 max-w-3xl mx-auto">
            A life dedicated to serving God and humanity
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