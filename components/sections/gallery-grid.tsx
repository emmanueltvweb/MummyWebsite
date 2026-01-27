"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import Image from "next/image"

interface GalleryItem {
  id: number
  title: string
  image: string
  type: "image" | "video"
  rotation?: number
  scale?: number
  zIndex?: number
}

interface GalleryGridProps {
  galleryItems: GalleryItem[]
  activeCategory: string
}

export function GalleryGrid({ galleryItems, activeCategory }: GalleryGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [isTransitioning, setIsTransitioning] = useState(false)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryItems.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length)
  }

  // Reset current index when gallery items change (category switch)
  useEffect(() => {
    setIsTransitioning(true)
    setCurrentIndex(0)
    const timer = setTimeout(() => setIsTransitioning(false), 50)
    return () => clearTimeout(timer)
  }, [galleryItems, activeCategory])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide()
      } else if (e.key === 'ArrowRight') {
        nextSlide()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!isHovered && galleryItems.length > 1) {
      const timer = setTimeout(nextSlide, 5000)
      return () => clearTimeout(timer)
    }
  }, [isHovered, currentIndex, galleryItems.length])

  if (galleryItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 sm:h-[500px] lg:h-[600px]">
        <p className="text-foreground/60 text-lg">No images available for this category</p>
      </div>
    )
  }

  return (
    <div className={`space-y-12 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Gallery Grid */}
      <div
        className="relative h-96 sm:h-[500px] lg:h-[600px] perspective isolate overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
      >
        <div 
          className="relative w-full h-full flex items-center justify-center"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: 'translateZ(0)',
          }}
        >
          {galleryItems.map((item, index) => {
            const offset = (index - currentIndex + galleryItems.length) % galleryItems.length
            const isActive = offset === 0

            let translateX = 0
            let translateY = 0
            let opacity = 0
            let scale = item.scale || 0.85

            if (offset === 0) {
              translateX = 0
              translateY = 0
              opacity = 1
              scale = 1
            } else if (offset === 1) {
              translateX = 180
              translateY = 20
              opacity = 0.7
              scale = item.scale || 0.9
            } else if (offset === galleryItems.length - 1) {
              translateX = -180
              translateY = 20
              opacity = 0.7
              scale = item.scale || 0.9
            } else {
              opacity = 0
              scale = 0.8
            }

            return (
              <div
                key={`${activeCategory}-${item.id}`}
                className={`absolute w-72 sm:w-80 lg:w-96 h-80 sm:h-96 lg:h-[480px] rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-700 ease-in-out ${
                  isActive 
                    ? "z-30 pointer-events-auto shadow-2xl" 
                    : "pointer-events-none shadow-xl"
                }`}
                style={{
                  transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${
                    isActive ? 0 : item.rotation || 0
                  }deg) scale(${scale})`,
                  opacity: opacity,
                  zIndex: isActive ? 30 : (offset === 1 || offset === galleryItems.length - 1) ? 20 : 10,
                  willChange: 'transform, opacity, filter',
                  filter: isActive ? 'none' : 'blur(0.5px)',
                  boxShadow: isActive 
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={item.title}
                  fill
                  className="object-cover w-full h-full"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                  sizes="(max-width: 640px) 18rem, (max-width: 1024px) 20rem, 24rem"
                  onError={(e) => {
                    setImageErrors(prev => new Set([...prev, item.id]));
                  }}
                  loading="lazy"
                />

                {/* Video overlay */}
                {item.type === "video" && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center group cursor-pointer">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-accent transition-colors duration-300">
                      <Play size={28} className="text-primary fill-primary" />
                    </div>
                  </div>
                )}

                {/* Title overlay */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 sm:p-6 transition-opacity duration-300">
                    <h3 className="text-white font-semibold text-lg sm:text-xl drop-shadow-lg">{item.title}</h3>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Navigation arrows */}
        
      </div>

      {/* Bottom navigation dots */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={prevSlide}
          className="w-10 h-10 rounded-full border-2 border-primary/30 text-primary/70 hover:border-accent hover:text-accent flex items-center justify-center transition-all duration-300"
          aria-label="Previous"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex gap-2">
          {galleryItems.map((item, index) => (
            <button
              key={`${activeCategory}-dot-${index}`}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-accent w-8" : "bg-primary/30 hover:bg-primary/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="w-10 h-10 rounded-full border-2 border-primary/30 text-primary/70 hover:border-accent hover:text-accent flex items-center justify-center transition-all duration-300"
          aria-label="Next"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
