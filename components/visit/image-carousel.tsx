"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

const churchImages = [
  {
    id: 1,
    src: "/churchvisit/Church1.jpg",
    alt: "The SCOAN Church - Leadership and congregation",
    title: "Church Entrace Gate 4"
  },
  {
    id: 2,
    src: "/churchvisit/insidechurch.jpg",
    alt: "The SCOAN Church - Worship and prayer service",
    title: "Church View"
  },
  {
    id: 3,
    src: "/churchvisit/insidechurch2.jpg",
    alt: "The SCOAN Church - Worship and prayer service",
    title: "Church View"
  },
  {
    id: 4,
    src: "/churchvisit/insidechurch1.jpg",
    alt: "The SCOAN Church - Worship and prayer service",
    title: "Church View"
  },
  {
    id: 5,
    src: "/churchvisit/Church2.jpg",
    alt: "The SCOAN Church - Worship and prayer service",
    title: "Church View"
  },
]

export function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-rotation logic
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === churchImages.length - 1 ? 0 : prevIndex + 1
      )
    }, 4000) // 4-second interval

    return () => clearInterval(interval)
  }, [isAutoPlaying, churchImages.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? churchImages.length - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === churchImages.length - 1 ? 0 : currentIndex + 1)
  }

  const handleMouseEnter = () => {
    setIsAutoPlaying(false)
  }

  const handleMouseLeave = () => {
    setIsAutoPlaying(true)
  }

  return (
    <div 
      className="relative max-w-4xl mx-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label="Church Image Carousel"
    >
      {/* Main Image Container */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
        {churchImages.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              priority={index === 0}
              loading={index === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-xl font-semibold">{image.title}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Next image"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {churchImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-accent scale-125'
                : 'bg-muted-foreground/50 hover:bg-muted-foreground/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentIndex}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className="text-center mt-4 text-sm text-muted-foreground">
        {currentIndex + 1} of {churchImages.length}
      </div>
    </div>
  )
}