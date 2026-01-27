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
    title: "Prophetic Birth Of TB Joshua",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        In the mid-1800s, in the rural community of Aridigi in present-day Ondo State, a certain Balogun Okoorun, who was a warrior and farmer, had prophesied that from that rustic area would emerge a man who would be powerful, famous and have a large following all over the world.
        <div className="mt-5">
          Temitope Balogun (later to be called <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">TB Joshua</a>) was born a century later on 12 June 1963. <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">TB Joshua's</a> father was Pa Kolawole Balogun from Osin Quarters, Imo, Arigidi, Akoko and his mother, Madam Folarin Aisha Adesiji Balogun, hailed from Ede, Agbaluku Quarters, both in Ondo State, Nigeria. The circumstances surrounding his birth were extraordinary.
        </div>
        <div className="mt-5">
         “Unlike other babies, I spent 15 months in my mother’s womb! Even though my mother visited some medical centres for check-ups, the baby refused to come out. My mother carried me for 15 months until she was taken to Egbe Medical Hospital where I was at last delivered.”
        </div>
      </div>
    ),
    image: {
      src: "/daddypix/dad1.jpg",
      alt: "Prophet T.B. Joshua",
      position: "right"
    }
  },
  {
    id: 2,
    title: "Naming Ceremony",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
         Eight days after <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">TB Joshua's</a> supernatural birth, a remarkable event preceded his naming ceremony.
        </div>
        <div className="mt-5">
          “On the day of the naming ceremony, people gathered with extraordinary excitement over the birth of a baby who had remained in his mother’s womb for 15 months. One would imagine the huge numbers of people that would gather for such a miraculous occasion!
        </div>
        <div className="mt-5">
          We lived close to a site where rocks were blasted for water in my community. Suddenly one of the stones flew from across the blast site, through the roof of my house and landed on the baby net where I was laid. Miraculously, something took me away from that spot, and the net on which I was lying immediately caught fire from the heat of the stone. It even threw my mother into a coma and she was suddenly rushed to hospital.
        </div>
        <div className="mt-5">
          At that moment, the visitors who came for the naming ceremony abruptly went into awe and confusion. With that shock, people started giving me various names to demonstrate their excitement and surprise over the wonder and miracle that took place.”
        </div>
        <div className="mt-5">
         When it was finally time to name the baby, Joshua’s parents chose ‘Temitope’, which means ‘What You (God) have done for me is worthy of thanks’.
        </div>
      </div>
    ),
    image: {
      src: "/daddypix/dad2.jpg",
      alt: "Young T.B. Joshua",
      position: "left"
    }
  },
  {
    id: 3,
    title: "Early Life Of TB Joshua",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        From Joshua’s early childhood years, signs of unusual spiritual gifts had become increasingly apparent.
        
        <div className="mt-5">
         “I was so little before the death of my father. Consequently, I knew nothing about my late father and the entire family burden rested squarely on my mother’s shoulders. In my dreams, I was always taught the Scriptures, which gave me an edge over my colleagues in school. I was the smallest in the class but always led the prayer during school devotions. My colleagues and teachers always called me “small pastor”. During my elementary education, at St. Stephen’s Anglican Primary School in Agbalaku, Arigidi, I was a leader of the Students’ Christian Fellowship.”
        </div>
        <div className="mt-5">
         One particular incident from those early days clearly signalled the supernatural ministry that lay ahead. A madman came to the school with a cutlass, causing pupils and teachers alike to run away in fear. However, the ‘small pastor’ confidently approached the madman and commanded him to hand over the cutlass in Jesus’ name – and the madman did.
        </div>
        <div className="mt-5">
          “I found myself in a simple and humble family background. In those early years of my life, I knew I would be blamed for whatever I gave my attention to. Consequently, I did not want my focus to be broken. I continued to choose to direct my focus on what is right and anytime I felt I was missing my focus, it became a very strong motivation to pray and be closer to God. The more I prayed, the less people would see me and the more isolated I became. This affected all of my social life. In those days, my colleagues and age-mates complained that I was not social and civilized enough like them. In this way, wrong became an incentive that drew me closer to God, instead of otherwise. If you make a mistake, don’t run from God; run to Him.”
        </div>
      </div>
    ),
    image: {
      src: "/daddypix/dad3.jpg",
      alt: "SCOAN Building",
      position: "right"
    }
  },
  {
    id: 4,
    title: "Joshua's Epileptic Education",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
         <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">TB Joshua's</a> secondary school experiences were marked by enormous challenges, despite his academic brilliance.
        </div>
        <div className="mt-5">
          “In my spiritual walk with God I have experienced both good and hard times. Who knows what would have happened if those temporary stops did not come at intervals? Consider how my education suffered epileptic fits. I attended six different colleges in less than one year, not because I was not smart in school. Today I was in school, the next day I was out, especially for want of money.
        </div>
        <div className="mt-5">
         I don’t want to call it poverty because children of destiny can never be poor, though they may experience temporary lack. Before I knew it, I had gone around six different colleges in less than one year. I enrolled for JAMB four times and on each occasion, it was either I forgot my acknowledgement card and other necessary documents or there was an accident on the way to the examination venue. People who saw what was happening to me simply attributed my predicament to either sin or non-seriousness on my part. But rather than despair and blame my situation on family background, I began to take God at His Word in order to have His way.”
        </div>
        <div className="mt-5">
         <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">TB Joshua</a> managed to gain late entry into a Muslim college known as Ansar-Ud-Deen Grammar School, Ikare, near his hometown. However, Joshua was there for only a few months before his academic ambitions again hit the rocks of disappointment because of insufficient funds.
        </div>
      </div>
    ),
    image: {
      src: "/daddypix/dad4.jpg",
      alt: "Emmanuel TV Studio",
      position: "left"
    }
  },
  {
    id: 5,
    title: "Joshua's Military Ambitions Aborted",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        <div>
          Lying on top of a cassava truck, Joshua hitchhiked a four-day ride from Ondo to Lagos. In Lagos Joshua struggled to make a living, engaging in menial jobs such as disposing of chicken dung at a nearby poultry farm. Amidst repeated disappointments in academic pursuits, he attempted to join the Nigerian military.
        </div>
        <div className="mt-5">
          “I could still remember vividly when I sat for and passed the entrance examination into the Nigerian Defence Academy, Kaduna. I was invited for the interview and I had to board the train from Lagos to Kaduna. Behold, on our journey, the train developed some serious faults that kept us in the bush in Jebba for six horrible days with little or no provision. This was how the ambition to enlist into the military was aborted by what was obviously an act of fate. Who knows what would have happened if I had successfully attended that interview? I actually felt very bitter that I had missed another chance of making it in life.”
        </div>
        <div className="mt-5">
         Returning to his village despondent and discouraged, he recounts his mother’s comforting words: “My son, do not mind the seeming appearance of things as of today. Do not be afraid of what the future holds for you. So be patient and you would see what God would do in your life. I am so sure of your future breakthrough, considering the strength of the predictions/prophecies about you even before you were born. I cannot forget so easily what I experienced when I was pregnant with you and I know God cannot lie. My son, whatever you may be going through today, just take it as a temporary setback which is meant to prepare you for the challenges ahead. Don’t forget your name is ‘Temitope’ and, by the grace of God, the whole world shall have cause to thank God for your sake.”
        </div>
      </div>
    ),
    image: {
      src: "/daddypix/dad5.jpg",
      alt: "T.B. Joshua Humanitarian Work",
      position: "right"
    }
  },
  {
    id: 6,
    title: "Divine Calling – Life After Life",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        The Holy Spirit instructed <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">TB Joshua</a> to undertake a prolonged time of seeking God's face on a prayer mountain near his hometown of Arigidi. After fasting and praying for 40 days and 40 nights, he experienced a heavenly vision.

        <div className="mt-5">
         “I was in a trance for three consecutive days. Then I saw a hand that pointed a Bible to my heart and the Bible entered my heart and my former heart seemed to immerse with the Bible immediately. Then the awareness came and I saw the apostles and prophets of old with someone whose head I could not see because He was tall to the Heaven and suspended, which I believe was our Lord, Jesus Christ, sitting in their midst. I also saw myself in their midst. After a while, I saw a hand of the same tall man; I could not behold His face, which was glittering with an unimaginable light, tall to the high Heavens and suspended in the air. But other apostles, I could see their faces, particularly Apostles Peter and Paul, Prophets Moses, Elijah and others. Their names were boldly written on their chests.
        </div>
          <div className="mt-5">
          I heard a voice saying, ‘I am your God; I am giving you a divine commission to go and carry out the work of the Heavenly Father’. At the same time, the same hand of the tall man gave me a small cross and a big Bible, bigger than the one that entered my heart, with a promise that as I keep pressing in His time and name, I would be given a bigger cross but if I failed the opposite would occur. I also heard the voice of the same tall man (I could not see His head), saying, ‘I am the Lord your God who was and who is – Jesus Christ’, giving orders to all the apostles and prophets. The same voice said to me, ‘I will show you the wonderful ways I will reveal myself through you, in teaching, preaching, miracles, signs and wonders for the salvation of souls’. Since then, I have been receiving in my vision, every year according to my faithfulness to God, a bigger cross that means to me more responsibilities.
        </div>
      </div>
      
    ),
    image: {
      src: "/daddypix/dad6.jpg",
      alt: "T.B. Joshua Legacy",
      position: "left"
    }
  },
  {
    id: 7,
    title: "Joshua's Humble Beginnings",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
       “Right from the beginning of my ministry, I have been staying close to nature. Nature enhances spirituality.” An abandoned swampy area in Agodo-Egbe, Lagos was where the young prophet with a divine commission burning in his heart spent countless days in prayer, fasting and solitude.
        <div className="mt-5">
         After returning from a visit to The Synagogue of Old in Jerusalem, Israel – where Jesus Christ ministered during His earthly ministry – <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">Prophet TB Joshua</a> was inspired by God to start a church. With just eight members, the church was prophetically named 'The Synagogue, Church Of All Nations'. Laying the foundation for the first church in 1989, he walked joyfully among the first set of members, who were seated under trees in the open air.
        </div>
        <div className="mt-5">
          “My coming to your midst is just to lay a foundation. I am here to lay a foundation, that today we start The Synagogue here! The Synagogue has started here! I have come to launch a good foundation for the church. You should know that this man always says things in proverbs.”
        </div>
      </div>
      
    ),
    image: {
      src: "/daddypix/dad7.jpg",
      alt: "T.B. Joshua Legacy",
      position: "left"
    }
  },
  {
    id: 8,
    title: "Move To Ikotun-Egbe",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
       When the first three church structures were destroyed by adverse weather and the number of worshippers began increasing exponentially, the Holy Spirit instructed <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">TB Joshua</a> to move to a new location about two miles away. Thus, in 1994, the church moved to Ikotun-Egbe, the current location of The Synagogue, Church Of All Nations!

        <div className="mt-5">
         “In the College of God, however brilliant you may be, you will not be given double promotion; you will take every course. My first church with eight children – without a roof – was blown off by a storm. That was a stage. The second church was washed away by a flood; that was another stage. The third church also collapsed; that was yet another stage. Shall we say all these happened without God’s knowledge? No. In every situation, God is still saying something, which we may not understand because of our inability to understand the things of the Spirit.”
        </div>
        
      </div>
      
    ),
    image: {
      src: "/daddypix/dad8.jpg",
      alt: "T.B. Joshua Legacy",
      position: "left"
    }
  },
  {
    id: 9,
    title: "Joshua's Divine Union",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        Like everything in the life of <a href="https://tbjoshua.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">TB Joshua</a>, meeting his wife, Evelyn, was also by divine arrangement. As news of a young prophet who "spoke the mind of God" continued to spread, people came to seek divine intervention and Heavenly counsel from him. Evelyn, a young woman from Delta State, Nigeria, was among those who came but the prophecy she received was unique indeed. In their first conversation, before any formal introduction, he wrote her name on a piece of paper. After prophetically revealing many details of her life, the remarkable 45-minute conversation ended with a marriage proposal and there was a heart agreement. It was later he told her that he had seen their divine union in a vision days before their first meeting. Evelyn has been an avid supporter of her husband's ministerial journey, accompanying him on numerous international charitable events and crusades. Their happy union of 31 years has been blessed with three beautiful daughters: Serah, Promise and Heart.

        <div className="mt-5">
         Serah Oyindamola Joshua, Esq. has a Bachelor of Laws from London School of Economics, a Master of Laws from New York University School of Law and an M.B.A. from Washington University in St. Louis. Promise graduated from London School of Economics and Political Science (LSE) with a BSc. in Politics and International Relations and studied a Dual Master of Public Administration at LSE and Columbia University, New York. Heart, the youngest daughter is still in high school.
        </div>
      </div>
      
    ),
    image: {
      src: "/daddypix/mumanddad.jpg",
      alt: "T.B. Joshua Legacy",
      position: "left"
    }
  },
  {
    id: 10,
    title: "Anointing Attracts",
    subtitle: "Prophet T.B. Joshua",
    content: (
      <div className="text-base sm:text-lg text-foreground/70 leading-relaxed text-justify">
        From the very outset, the supernatural power of God was evident in every service at The SCOAN. As the news of the miraculous move of God’s power spread, coupled with countless testimonies of divine healing, supernatural deliverance and prophetic accuracy, Ikotun-Egbe began attracting visitors from across the globe – people who were hungry to see God’s power.

        <div className="mt-5">
         True to its prophetic name, The SCOAN rose from eight members to become “Nigeria’s biggest tourist attraction.”
        </div>
          <div className="mt-5">
          Figures released by the Nigerian Immigration Service show that six out of every ten foreign travellers coming into Nigeria are bound for The SCOAN. The popularity of the church has resulted in an enormous boost for local businesses and hoteliers, as well as an increase in flight routes to Lagos from several countries.
        </div>
          <div className="mt-5">
         “In our ministry here, The SCOAN, the Word has been a living and growing force. It is not our logic; it is not our philosophy; it is not our knowledge; it is not our preaching but the Living Word. The mighty One that is in us is taken out of the Word, Jesus Christ. As we begin to do the Word, it begins to do in us and through us. He is with me in the Living Word.”
        </div>
      </div>
      
    ),
    image: {
      src: "/daddypix/dad10.jpg",
      alt: "T.B. Joshua Legacy",
      position: "left"
    }
  }
]

export function AboutTBJoshuaSection({ 
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
    <section id="about-tb-joshua" ref={ref} className="py-20 md:py-32 bg-muted">
      <Container>
        <div className="space-y-12">
          {/* Carousel Container */}
          <div 
            className="relative min-h-[700px] lg:min-h-[600px] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="region"
            aria-label="About Prophet T.B. Joshua - Carousel"
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
          <div className="text-center text-sm text-foreground/60 ">
            {currentSlide + 1} of {totalSlides}
          </div>
          
          {/* Read More Button */}
          <div className="text-center mt-4">
            <a
              href="https://www.scoan.org/tb-joshua/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-accent hover:bg-accent/90 text-primary font-bold rounded-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              aria-label="Read more about Prophet T.B. Joshua's biography"
            >
              Read More on Prophet T.B. Joshua
            </a>
          </div>
        </div>
      </Container>
      
    </section>
  )
}