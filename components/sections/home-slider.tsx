"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { useInView } from "@/hooks/use-in-view";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary/optimize";
import { cn } from "@/lib/utils";

export interface SlideContent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  backgroundImage: string;
}

/**
 * A single slide. Also used by the admin for live previews.
 * `active` (homepage only) plays the entrance animations from the About slideshow each time the
 * slide comes into view: a slow Ken Burns zoom on the background, then the text rising in one
 * line after another. Leave it undefined (admin preview) for a static slide.
 */
export function SlideView({
  slide,
  priority,
  compact,
  active,
}: {
  slide: SlideContent;
  priority?: boolean;
  compact?: boolean;
  active?: boolean;
}) {
  const external = /^https?:\/\//.test(slide.buttonUrl);
  const animated = active !== undefined;
  /** Staggered entrance; delays leave time for the slide to finish sliding in first. */
  const enter = (delayMs: number, name = "about-in-up") =>
    !animated
      ? {}
      : active
        ? { className: name, style: { animationDelay: `${delayMs}ms` } }
        : { className: "opacity-0" };
  return (
    <div
      className={cn(
        "relative isolate flex w-full items-end overflow-hidden",
        compact
          ? "aspect-[16/7] rounded-2xl"
          : "min-h-[70vh] md:min-h-[78vh] lg:min-h-[560px]",
      )}
    >
      {slide.backgroundImage && (
        <img
          src={optimizeCloudinaryUrl(slide.backgroundImage, {
            width: compact ? 1000 : 2000,
          })}
          alt=""
          loading={priority ? "eager" : "lazy"}
          className={cn("absolute inset-0 -z-10 size-full object-cover", active && "home-kenburns")}
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[oklch(0.18_0.06_265)] via-[oklch(0.18_0.06_265/0.55)] to-[oklch(0.18_0.06_265/0.1)]" />
      <div
        className={cn(
          "mx-auto w-full max-w-6xl",
          compact
            ? "p-5 sm:p-7"
            : "px-4 pt-32 pb-20 sm:px-6 md:pb-24 lg:px-14 lg:pt-24 lg:pb-20",
        )}
      >
        <div className={cn("max-w-2xl text-white", compact && "max-w-lg")}>
          {slide.subtitle && (
            <p
              style={enter(300).style}
              className={cn(
                "mb-3 font-semibold tracking-[0.2em] text-[oklch(0.82_0.14_80)] uppercase",
                compact ? "text-[10px]" : "text-xs md:text-sm",
                enter(300).className,
              )}
            >
              {slide.subtitle}
            </p>
          )}
          <h2
            style={enter(430).style}
            className={cn(
              "leading-tight font-bold tracking-tight text-balance",
              compact ? "text-xl sm:text-2xl" : "text-4xl md:text-6xl",
              enter(430).className,
            )}
          >
            {slide.title || "Slide title"}
          </h2>
          {animated && (
            <div
              style={enter(600, "about-bar").style}
              className={cn("mt-4 h-1 w-12 rounded-full bg-[oklch(0.8_0.15_80)]", enter(600, "about-bar").className)}
              aria-hidden
            />
          )}
          {slide.description && (
            <p
              style={enter(700).style}
              className={cn(
                "mt-4 leading-relaxed text-white/80",
                compact
                  ? "line-clamp-2 text-xs sm:text-sm"
                  : "text-base md:text-lg",
                enter(700).className,
              )}
            >
              {slide.description}
            </p>
          )}
          {slide.buttonText && slide.buttonUrl && (
            <div style={enter(850).style} className={enter(850).className}>
              <Link
                href={slide.buttonUrl}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className={cn(
                  "mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.8_0.15_80)] to-[oklch(0.7_0.14_70)] font-semibold text-[oklch(0.2_0.05_265)] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl",
                  compact ? "px-4 py-2 text-xs" : "px-7 py-3.5",
                )}
                tabIndex={compact ? -1 : active === false ? -1 : undefined}
              >
                {slide.buttonText} <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Time each slide stays on screen before auto-advancing. */
const SLIDE_DURATION_MS = 6000;

export function HomeSlider({ slides }: { slides: SlideContent[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: slides.length > 1 });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // user pressed pause (or prefers reduced motion)
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  // Slide text animations wait until the slider is on screen, so the first slide's entrance isn't
  // wasted while it's still below the fold.
  const { ref: sectionRef, isInView } = useInView({ threshold: 0.25 });

  const onSelect = useCallback(
    () => embla && setIndex(embla.selectedScrollSnap()),
    [embla],
  );
  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, onSelect]);

  // Respect "reduce motion" and pause while the browser tab is in the background.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const playing = slides.length > 1 && !paused && !hovering && !focusWithin && pageVisible;

  // Auto-advance. Keyed on `index`, so any slide change (auto or manual) restarts the countdown.
  useEffect(() => {
    if (!embla || !playing) return;
    const timer = setTimeout(() => embla.scrollNext(), SLIDE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [embla, index, playing]);

  if (!slides.length) return null;

  return (
    // Full-bleed on phones/tablets; a contained, rounded card on desktop.
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      aria-roledescription="carousel"
      aria-label="Featured"
      className="lg:mx-auto lg:max-w-6xl lg:px-8 lg:py-14"
    >
      <Reveal variant="zoom">
      <div
        className="relative isolate overflow-hidden lg:rounded-[2rem] lg:shadow-[0_30px_60px_-25px_rgba(15,23,42,0.55)]"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setFocusWithin(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
        }}
      >
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                className="min-w-0 shrink-0 grow-0 basis-full"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
              >
                <SlideView slide={slide} priority={i === 0} active={isInView && i === index} />
              </div>
            ))}
          </div>
        </div>
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => embla?.scrollPrev()}
              className="absolute top-1/2 left-4 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 md:flex"
              aria-label="Previous slide"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => embla?.scrollNext()}
              className="absolute top-1/2 right-4 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 md:flex"
              aria-label="Next slide"
            >
              <ChevronRight />
            </button>
            <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => embla?.scrollTo(i)}
                  className={cn(
                    "relative h-2 overflow-hidden rounded-full transition-all",
                    i === index ? "w-10 bg-white/35" : "w-2 bg-white/50 hover:bg-white/80",
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                >
                  {i === index && (
                    // Fills up while the current slide is showing; freezes when paused.
                    <span
                      key={`${index}-${paused}`}
                      className="absolute inset-y-0 left-0 rounded-full bg-[oklch(0.8_0.15_80)]"
                      style={{
                        width: paused ? "100%" : undefined,
                        animation: paused ? "none" : `home-slider-progress ${SLIDE_DURATION_MS}ms linear forwards`,
                        animationPlayState: playing ? "running" : "paused",
                      }}
                    />
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="ml-2 flex size-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30"
                aria-label={paused ? "Play slideshow" : "Pause slideshow"}
                title={paused ? "Play slideshow" : "Pause slideshow"}
              >
                {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              </button>
            </div>
          </>
        )}
      </div>
      </Reveal>
    </section>
  );
}
