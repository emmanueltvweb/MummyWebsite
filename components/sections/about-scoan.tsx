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
    subtitle: "The Synagogue, Church Of All Nations",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
       The physical structure of <a href="https://www.scoan.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">The SCOAN</a> has gone through different stages. Each stage served a purpose! Before moving to our present position, <a href="https://www.scoan.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">The SCOAN</a> has had three previous locations. The roof of the first church was blown off by a storm, the second church was washed away by a flood while the third church also collapsed due to severe weather conditions. Shall we say all these happened without God's knowledge? No. In every situation, God is still saying something. Today, <a href="https://www.scoan.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">The SCOAN</a> is an architectural masterpiece located in the heart of Ikotun-Egbe, Lagos.
      </div>
    ),
    image: {
      src: "/churchvisit/Church2.jpg",
      alt: "SCOAN Building",
      position: "right"
    }
  },
  {
    id: 2,
    title: "All the Way Long",
    subtitle: "The Synagogue, Church Of All Nations",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          There is an unseen hand in the affairs of every man of faith. God is the unseen hand that brings everything to pass.
          As a Christian, whatever situation you are in, do a proper reflection. I mean sit down and reflect on life itself and you will discover that nothing happens for nothing; nothing comes by chance.
        </div>
        <div className="mt-5">
         The Synagogue, Church of All Nations did not just come by chance – it was as it should be by divine will. Right from the start, God Almighty has been the divine driver behind our fortunes and the inspiration behind the whole set up.
        </div>
      </div>
    ),
    image: {
      src: "/churchvisit/insidechurch.jpg",
      alt: "SCOAN Early Days",
      position: "left"
    }
  },
  {
    id: 3,
    title: "Everything Big Starts Little",
    subtitle: "The Synagogue, Church Of All Nations",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
       God has set a time for everything: a time to be born, a time to grow, a time to face persecution, a time to overcome and a time to show the proceeds of victory.
        
        <div className="mt-5">
          If you look at life, you would see that everything big starts little. A mighty cathedral starts with one brick. A journey of a thousand miles starts with a single step. You were once a tiny embryo in your mother’s womb, but today, see how big you have become.
        </div>
        <div className="mt-5">
         Luke 13:18 – Then Jesus asked, “What is the kingdom of God like? What shall I compare it to? It is like a mustard seed, which a man took and planted in his garden. It grew and became a tree, and the birds of the air perched in its branches.”
        </div>
        <div className="mt-5">
          A Christian home does not come by luck. It is not a thing of chance or accident. You don’t just find yourself in it; it is something you have through conscious effort or genuine willingness. So also, The Synagogue, Church Of All Nations that you see today did not just happen, it was built.
        </div>
        <div className="mt-5">
         Many years ago, a small gathering of eight members came together to hold their first meeting in a humble shelter in a squalid, swampy jungle, in the location of Agodo-Egbe in Lagos, Nigeria. For everything God created, He allotted a specific and definite purpose. The purpose and mission of the church was simple and clear – to seek and save the lost (Luke 19:10).
        </div>
        <div className="mt-5">
         As time went on, it became increasingly clear that <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">T.B. Joshua</a> was not just an ordinary pastor, preaching 'ordinary' words and doing 'ordinary things'. Right from the onset, he believed that serving God is not doing what many do but doing what the best do.
        </div>
        <div className="mt-5 font-bold">
          “Everyone has a calling. If you follow the direction of your calling, you will surprise yourself, you will astonish yourself – you will make a difference in your world.”
        </div>
        <div className="mt-5">
          Clear evidence of outstanding miraculous occurrences began to arise. The lame began to walk, hopeless cancer patients were lifted from despair, desperate situations were turned to scenes of life, joy and peace. On seeing the extraordinary power of God in the life of this man, one cannot but ask questions: ‘Can this be true in our days?’ ‘Can a human being perform such feats?’ ‘Is the Bible still true for us today?’
        </div>
        <div className="mt-5">
         Anointing does not work through plans, methods or machinery. It works through suitable men. <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">T.B. Joshua</a> was simply utilising the power that has been given to all believers (Luke 10:19). " Jesus is disappointed that men lack the necessary faith to release the power that has been given to them. "God has no hands but our hands to do His work.
        </div>
        <div className="mt-5">
          Right from day one, the focus in <a href="https://www.scoan.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">The SCOAN</a> has never been on the healing but on the Healer, whose name is Jesus Christ. As <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">T.B. Joshua</a> always said: "I am not here to introduce you to healing, but to the Healer ." The only genuine reason for receiving is salvation (Matthew 6:33).
        </div>
        <div className="mt-5">
         He said: “I am not the healer. I know the Healer. His name is Jesus Christ. It is not my work but my faith in His finished works. It is God’s strength that is made manifest in my weakness” (2 Corinthians 12:7-10).
        </div>
      </div>
    ),
    image: {
      src: "/churchvisit/insidechurch1.jpg",
      alt: "International Congregation at SCOAN",
      position: "right"
    }
  },
  {
    id: 4,
    title: "Church of All Nations",
    subtitle: "The Synagogue, Church Of All Nations",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          God had planted a vision in the heart of <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">T.B. Joshua</a>. Some would think it strange for a church of just a small number in a humble area in Lagos, Nigeria to be prophetically named a church of all nations but for the vision in the life of <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">T.B. Joshua</a>. The name given to the church is testimony to the prophetic insight given to <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">Prophet T.B. Joshua</a> and his calm and determined focus on that vision.
        </div>
        <div className="mt-5 font-bold">
         “Your future must move into you before you can move into your future.”
        </div>
        <div className="mt-5">
          This dream was known to him alone. No one else believed his dream nor even understood it. His vision was his direction. He allowed that dream to be his best influence rather than the opinions, advice and criticisms of others around him.
        </div>
        <div className="mt-5 font-bold">
          “If your mind agrees in your relationship with God, what your circumstances look like, what you see, what people say or do concerning that relationship cannot affect it.”
        </div>
        <div className="mt-5">
          <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">Prophet T.B. Joshua</a> knew that the service of the Lord is a thing of the mind, and your mind will always ask you to do something uncommon, rare and different. For you to have what you have never had before, you must do what you have never done before (Matthew 14:28-31).
        </div>
      </div>
    ),
    image: {
      src: "/churchvisit/Church1.jpg",
      alt: "Healing Service at SCOAN",
      position: "left"
    }
  },
]

export function AboutSCOANSection({ 
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
    <section id="about-scoan" ref={ref} className="py-20 md:py-32 bg-muted">
      <Container>
        <div className="space-y-12">
          {/* Carousel Container */}
          <div 
            className="relative min-h-[700px] lg:min-h-[600px] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="region"
            aria-label="About The Synagogue, Church Of All Nations - Carousel"
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
              href="https://www.scoan.org/the-scoan/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-accent hover:bg-accent/90 text-primary font-bold rounded-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              aria-label="Read more about The Synagogue, Church Of All Nations"
            >
              Read More About The SCOAN
            </a>
          </div>
        </div>
      </Container>
    </section>
  )
}