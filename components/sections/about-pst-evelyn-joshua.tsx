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
    title: "Introduction",
    subtitle: "Pst. Evelyn Onyisi Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        Pastor Evelyn Onyisi Joshua is a Nigerian minister of God, pastor, preacher and tele-evangelist. She is
        the Senior Pastor and Leader of world renowned charismatic Christian ministry, The Synagogue, Church of
        All Nations (The SCOAN). Evelyn is also the President of Emmanuel Global Network (Owner of Emmanuel TV).
      </div>
    ),
    image: {
      src: "/Evelyn-Joshua3.jpg",
      alt: "Pastor Evelyn Onyisi Joshua",
      position: "right"
    }
  },
  {
    id: 2,
    title: "Family Background and Education",
    subtitle: "Pastor Evelyn Onyisi Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Born on 17th December, 1968 to the humble family of Mr. & Mrs. Nicholas Akabude of Ukala Okpunor Community, Oshimili North Local Government Area of Delta State in Nigeria. She commenced her primary education at St. Emecheta Primary School, Esi Town in Delta State before relocating to Lagos State in the early 1970s to live with her big cousin, Engineer Lazarus Onwumeh, who is an Aeronautical Engineer and son to her favorite aunty, Mrs Julianah Onwumeh. Mrs. Julianah Onwumeh had nurtured the little Evelyn from cradle and she was the woman she fondly referred to as mother, back in the village.
        </div>
        <div className="mt-5">
          While in Lagos, where she also briefly lived with her brother, Mr. Patrick Akabude, Pastor Evelyn enrolled at Orile Primary School, Oshodi, Lagos State where she completed her primary education and earned her Primary School Leaving Certificate. She proceeded to State High School, Oshodi, Lagos State, Nigeria for her secondary education before subsequently proceeding to the famous Ghana Institute of Management and Public Administration where she obtained a certificate in Management Studies.
        </div>
      </div>
    ),
    image: {
      src: "/Evelyn-Joshua3.jpg",
      alt: "Congregation",
      position: "left"
    }
  },
  {
    id: 3,
    title: "Marriage",
    subtitle: "Pastor Evelyn Onyisi Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        Pastor Evelyn Joshua's marriage in 1990 to Prophet Temitope Balogun Joshua, one of the most famous ministers of God and tele-evangelists that the world has ever known, was nothing short of a pre-ordained divine arrangement. Prophet T.B. Joshua had, on their very first meeting, revealed to Pastor Evelyn in no uncertain terms that she was his God-ordained wife, life companion and ministry partner. The divinely ordained marriage which lasted for 31 years until the 5th of June, 2021 when Prophet T.B. Joshua answered the glorious home call was blessed with three amazing daughters, Serah, Promise and Heart.
      </div>
    ),
    image: {
      src: "/mumanddad.jpg",
      alt: "Pastor Evelyn Onyisi Joshua",
      position: "right"
    }
  },
  {
    id: 4,
    title: "Ministry",
    subtitle: "Pastor Evelyn Onyisi Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Shortly after their marriage, Prophet T.B. Joshua in furtherance of his uncommon ministerial calling established The Synagogue, Church of All Nations (The SCOAN) in the year 1991 in a swampy portion of land at a remote part of the outskirts of Lagos, Nigeria.
        </div>
        <div className="mt-5">
          As a dutiful wife and a dependable Kingdom partner, Pastor Evelyn pioneered and nurtured the Sunday School Department of the young church, deployed her spiritual gifts and unique talents towards supporting her husband in every area of the ministry, while also keeping the home front intact and secure while her husband dedicated his life to the full service of God.
        </div>
        <div className="mt-5">
          True to the literal meaning of the ministry's name, as revealed to Prophet T.B. Joshua by God, The SCOAN soon became a true Church of all Nations as worshippers trooped in from all parts of the world to witness God's uncommon power as evidently at work in the uncommon Ministry.
        </div>
        <div className="mt-5">
          As at 2018, The SCOAN had become the biggest attraction of foreign visitors to Nigeria. According to official figures released by the Nigeria Immigration Service, "Six out of every ten foreign travellers coming into Nigeria are bound for The Synagogue, Church of All Nations."
        </div>
        <div className="mt-5">
          The Church with very little beginnings soon became a universal arena of the manifestation of God's amazing wonders and, all through this period, Pastor Evelyn Joshua played key roles both as a dutiful wife, mother and as a minister in the vineyard of God. She was the co-coordinator (along with Prophet T.B. Joshua) of the globally acclaimed charity arm of the Ministry, the Emmanuel Global Network (EGN).
        </div>
      </div>
    ),
    image: {
      src: "/Evelyn-Joshua3.jpg",
      alt: "Pastor Evelyn Onyisi Joshua",
      position: "left"
    }
  },
  {
    id: 5,
    title: "The New Dawn and Mantle of Leadership",
    subtitle: "Pastor Evelyn Onyisi Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Upon the glorious home call of Prophet T.B. Joshua on the 5th of June, 2021 after an enthralling and fulfilled life dedicated to the service of God and humanity, the mantle of leadership of the global Church fell on Pastor Evelyn Joshua, according to God's divine mandate and plan.
        </div>
        <div className="mt-5">
          Upon assumption of office as the leader of The SCOAN and the Global President of Emmanuel Global Network (EGN), it quickly became evident that Pastor Evelyn Joshua had been divinely moulded, delicately nurtured and carefully crafted over the course of her 31 years marital journey for a period such as God and fate had eventually thrust on her as the leader of the great commission of The SCOAN and EGN. A gifted teacher, anointed Preacher and a meticulous super administrator, Pastor Evelyn Joshua fully surrendered herself to the leading of God and the direction of the Holy Spirit which has, undoubtedly, accounted for the continued rapid and explosive advancement of the Ministry under her unique leadership.
        </div>
      </div>
    ),
    image: {
      src: "/Evelyn-Joshua3.jpg",
      alt: "Pastor Evelyn Onyisi Joshua",
      position: "right"
    }
  },
  {
    id: 6,
    title: "PEJ AND THE LOVE FOR NATURE",
    subtitle: "Pastor Evelyn Onyisi Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        Just like her late husband, Prophet T.B Joshua, Pastor Evelyn's love for nature and all of God's creature is quite enthralling. In a show of this and as part of her contribution to nature conservation and environmental preservation, Pastor Evelyn Joshua collaborated with the Nairobi City Council in Kenya on its tree planting initiative by planting a whopping 20,000 trees around Nairobi. Pastor Evelyn and the Emmanuel Tv Partners also supported the initiative with the sum of $20,000

        <div className="mt-5">
          She is also a lover of agriculture.
        </div>
          <div className="mt-5">
          Always adorning her signature disarming smile, Pastor Evelyn Joshua is an epitome of Godly love and charm.
        </div>
      </div>
      
    ),
    image: {
      src: "/Evelyn-Joshua3.jpg",
      alt: "Pastor Evelyn Onyisi Joshua",
      position: "left"
    }
  }
]


export function AboutSection({ 
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
    <section id="about" ref={ref} className="py-20 md:py-32 bg-muted">
      <Container>
        <div className="space-y-12">
          {/* Carousel Container */}
          <div 
            className="relative min-h-[700px] lg:min-h-[600px] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="region"
            aria-label="About Pastor Evelyn Joshua - Carousel"
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
        </div>
        
      </Container>
    </section>
  )
}