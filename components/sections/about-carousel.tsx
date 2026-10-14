"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Reveal } from "@/components/ui/reveal"
import { useInView } from "@/hooks/use-in-view"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary/optimize"
import type { AboutPageContent, AboutSlide } from "@/lib/content/page-types"

interface AboutCarouselProps {
  content: AboutPageContent
  /** Section id / aria label for the page. */
  sectionId: string
  label: string
  /** "boxed" shows the text on a tinted card (Pastor Evelyn Joshua page). */
  variant?: "boxed" | "plain"
  autoPlayInterval?: number
}

/** Biography slideshow used by the About pages. Content is managed in Admin → Pages. */
export function AboutCarousel({ content, sectionId, label, variant = "plain", autoPlayInterval = 5000 }: AboutCarouselProps) {
  const slides = content.slides
  const { ref, isInView } = useInView({ threshold: 0.2 })
  const [currentSlide, setCurrentSlide] = useState(0)
  /** Which way we're moving, so the incoming slide enters from the matching side. */
  const [direction, setDirection] = useState<1 | -1>(1)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalSlides = slides.length

  const nextSlide = useCallback(() => {
    setDirection(1)
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])
  const prevSlide = useCallback(() => {
    setDirection(-1)
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])
  const goToSlide = (index: number) => {
    setDirection(index >= currentSlide ? 1 : -1)
    setCurrentSlide(index)
  }

  // Restart the timer on every change, so a slide you picked gets its full time on screen.
  useEffect(() => {
    if (isAutoPlaying && isInView && totalSlides > 1) {
      autoPlayRef.current = setInterval(nextSlide, autoPlayInterval)
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [isAutoPlaying, isInView, nextSlide, autoPlayInterval, totalSlides, currentSlide])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInView) return
      if (e.key === "ArrowLeft") prevSlide()
      else if (e.key === "ArrowRight") nextSlide()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isInView, nextSlide, prevSlide])

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    if (distance > 50) nextSlide()
    else if (distance < -50) prevSlide()
  }

  // Animations (see "About slideshow" in globals.css) run when a slide becomes active, so every
  // change replays them: the photo zooms in with a glowing ring, then slowly drifts (Ken Burns),
  // while the subtitle, title, underline and text rise in one after another.
  const renderImage = (slide: AboutSlide, isActive: boolean) => (
    // On mobile the photo always sits above the text, whatever side it's on for desktop.
    <div className="max-lg:order-first">
      <div className={`relative mx-auto aspect-square w-44 sm:w-56 md:w-64 lg:w-96 ${isActive ? "about-in-photo" : "opacity-0"}`}>
        {/* Soft halo + a ring that ripples outwards as the photo arrives */}
        <div className="absolute -inset-3 rounded-full bg-accent/25 blur-2xl" aria-hidden />
        {isActive && <div className="about-ring absolute inset-0 rounded-full border-2 border-accent" aria-hidden />}
        <div className="relative size-full rounded-full overflow-hidden border-4 border-white/70 shadow-2xl">
          {slide.imageUrl && (
            <img
              src={optimizeCloudinaryUrl(slide.imageUrl, { width: 800, height: 800, crop: "fill", gravity: "auto" })}
              alt={slide.imageAlt}
              loading="lazy"
              className={`absolute inset-0 w-full h-full object-cover ${isActive ? "about-kenburns" : ""}`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
        </div>
      </div>
    </div>
  )

  const boxed = variant === "boxed"

  return (
    <section id={sectionId} ref={ref} className="pt-24 pb-12 md:py-32 bg-muted relative overflow-hidden">
      <Container className="relative z-10">
        <div className="space-y-6 lg:space-y-12">
          {/* Mobile: slides are stacked in one grid cell, so the box is as tall as the tallest slide
              and nothing gets cut off. Desktop keeps the fixed-height, absolutely positioned slides. */}
          <div
            // overflow-clip (not hidden): a clip box can't be scrolled sideways by focus/scrollIntoView,
            // which would otherwise shift the slides out of view.
            className="relative overflow-clip max-lg:grid lg:min-h-[600px]"
            onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
            onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
            onTouchEnd={handleTouchEnd}
            role="region"
            aria-label={`${label} - Carousel`}
          >
            {slides.map((slide, index) => {
              const isActive = index === currentSlide
              const anim = (name: string) => (isActive ? name : "opacity-0")
              return (
                <div
                  key={slide.id}
                  className={`max-lg:[grid-area:1/1] lg:absolute lg:inset-0 ${
                    isActive ? "about-slide-in z-10" : "pointer-events-none opacity-0 transition-[opacity,transform] duration-500 ease-in"
                  }`}
                  // Entering slide comes from the side we're moving towards; the leaving one drifts the other way.
                  style={
                    isActive
                      ? ({ "--about-from": `${direction * 60}px` } as React.CSSProperties)
                      : { transform: `translateX(${-direction * 60}px) scale(0.97)` }
                  }
                  aria-hidden={!isActive}
                  role="tabpanel"
                  aria-labelledby={`slide-${slide.id}`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center lg:min-h-[400px]">
                    {slide.imagePosition === "left" && renderImage(slide, isActive)}

                    <div>
                      <div className={`text-accent font-semibold tracking-wide mb-2 ${boxed ? "drop-shadow-sm" : ""} ${anim("about-in-up about-delay-1")}`}>
                        {slide.subtitle}
                      </div>
                      <h2
                        className={`${
                          boxed
                            ? "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-primary leading-tight drop-shadow-md"
                            : "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary leading-tight"
                        } ${anim("about-in-up about-delay-2")}`}
                      >
                        {slide.title}
                      </h2>
                      <div className={`mt-2 h-1 w-12 bg-accent rounded-full ${isActive ? "about-bar about-delay-3" : "opacity-0"}`} />
                      <div className={`mt-4 sm:mt-6 max-h-[360px] sm:max-h-[400px] lg:max-h-[300px] overflow-y-auto ${anim("about-in-up about-delay-4")}`}>
                        <div className={boxed ? "bg-muted/80 backdrop-blur-sm rounded-lg p-4 border border-muted-foreground/10" : undefined}>
                          <div
                            className="about-rich text-base sm:text-lg text-foreground/70 leading-relaxed text-left lg:text-justify"
                            dangerouslySetInnerHTML={{ __html: slide.html }}
                          />
                        </div>
                      </div>
                    </div>

                    {slide.imagePosition === "right" && renderImage(slide, isActive)}
                  </div>
                </div>
              )
            })}

            {totalSlides > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="max-lg:hidden absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center group"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={nextSlide}
                  className="max-lg:hidden absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center group"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                </button>
              </>
            )}
          </div>

          {totalSlides > 1 && (
            <Reveal variant="up" delay={300} className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 mt-6 lg:mt-8">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="mr-2 lg:mr-4 px-3 py-1 text-sm rounded-full bg-primary/10 hover:bg-primary/20 transition-colors duration-300"
                aria-label={isAutoPlaying ? "Pause auto-play" : "Start auto-play"}
              >
                {isAutoPlaying ? "Pause" : "Play"}
              </button>
              {/* On mobile the arrows live here instead of over the text. */}
              <button
                onClick={prevSlide}
                className="lg:hidden flex size-9 items-center justify-center rounded-full bg-white shadow-md dark:bg-gray-800"
                aria-label="Previous slide"
              >
                <ChevronLeft className="size-5 text-primary" />
              </button>
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentSlide ? "bg-accent w-8" : "bg-primary/30 hover:bg-primary/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                  aria-current={index === currentSlide}
                  role="tab"
                  id={`slide-${slide.id}`}
                />
              ))}
              <button
                onClick={nextSlide}
                className="lg:hidden flex size-9 items-center justify-center rounded-full bg-white shadow-md dark:bg-gray-800"
                aria-label="Next slide"
              >
                <ChevronRight className="size-5 text-primary" />
              </button>
            </Reveal>
          )}

          <Reveal variant="fade" delay={400} className="text-center text-sm text-foreground/60">
            {currentSlide + 1} of {totalSlides}
          </Reveal>

          {content.readMoreLabel && content.readMoreUrl && (
            <Reveal variant="up" delay={450} className="text-center mt-4">
              <a
                href={content.readMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-accent hover:bg-accent/90 text-primary font-bold rounded-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                {content.readMoreLabel}
              </a>
            </Reveal>
          )}
        </div>
      </Container>
    </section>
  )
}
