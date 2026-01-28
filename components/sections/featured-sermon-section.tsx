"use client"

import { Container } from "@/components/layout/container"
import { Calendar, Clock, User } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function FeaturedSermonSection() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [showFacebookVideo, setShowFacebookVideo] = useState(false)

  const handleWatchNow = () => {
    setIsLoadingVideo(true)
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setIsLoadingVideo(false)
      // Open video in new tab to avoid CORS issues
      window.open('https://www.stream.emmanuel.tv/title/divine-healing-%7C-pastor-evelyn-joshua-sermon/en?id=693371d660b2170ab47749e6&type=vod&isFromTabLayout=true', '_blank', 'noopener,noreferrer')
    }, 1000)
  }
  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-primary/5 to-transparent">
      <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center animate-scale-up">
          {/* Featured Image */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-xl hover-lift group">
              {!showFacebookVideo ? (
                <>
                  <Image
                    src="/sermonpix/grateful.jpeg"
                    alt="Featured sermon"
                    width={1280}
                    height={720}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <button 
                      onClick={() => setShowFacebookVideo(true)}
                      className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-lg"
                      aria-label="Play Facebook video"
                    >
                      <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="relative w-full bg-black aspect-video">
                  <iframe
                    width="560"
                    height="315"
                    src="https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2FSCOANLegacy%2Fvideos%2F1416204296919341%2F&show_text=false&width=560&t=0"
                    title="Facebook video player"
                    style={{ border: 'none', overflow: 'hidden' }}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="w-full h-full"
                  />
                  <button
                    onClick={() => setShowFacebookVideo(false)}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                    aria-label="Close video"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sermon Details */}
          <div className="order-1 lg:order-2 space-y-6 animate-slide-in-right">
            {/* Category Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full border border-accent/20">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Latest Sermon</span>
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-3xl font-extrabold text-primary leading-tight">
              A Grateful Steward’s Account | Thanksgiving Message 2025<span className="text-accent"></span> 
            </h2>

            {/* Meta Information */}
            <div className="space-y-3 text-foreground/70">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-accent" />
                <span className="text-sm sm:text-base">December 09, 2025</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-accent" />
                <span className="text-sm sm:text-base">6 minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <User size={20} className="text-accent" />
                <span className="text-sm sm:text-base">Pastor Evelyn Joshua Sermon</span>
              </div>
            </div>

            {/* Summary */}
            <div className="text-base sm:text-lg text-foreground/80 leading-relaxed text-justify">
              In this special Thanksgiving presentation, Pastor Evelyn Joshua delivers a Grateful Steward’s Account — a heartfelt reflection on God’s faithfulness, mercy, and guidance throughout the year 2025. Speaking as a true steward of God’s kingdom, she reminds the global SCOAN family that every steward must give an account of their work, not to men, but to God who rewards faithfulness.

              <p className="mt-4">In her own words:

                “A steward is worthy to give accounts of his works, knowing there is a reward that awaits him or her. I am not giving account to men but to God who has been there for us — our Helper, our Comforter, our All. To Him alone be the glory, honour, and praise. Hallelujah, Amen.”"</p>

              <p className="mt-4">Watch, be blessed, and share your own testimony of gratitude. </p>

            </div>

            {/* Key Points */}
            <div className="space-y-2">
              <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Key Topics</h3>
              <div className="flex flex-wrap gap-2">
                {["Trust in God", "Faith", "Perseverance", "Divine Plan"].map((topic, index) => (
                  <span
                    key={`featured-${topic}-${index}`}
                    className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button 
                onClick={handleWatchNow}
                disabled={isLoadingVideo}
                className={`px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLoadingVideo ? 'animate-pulse' : ''
                }`}
              >
                {isLoadingVideo ? 'Loading Video...' : 'Watch Now'}
              </button>
              <button 
                onClick={() => window.open('https://emmanuel.tv/download/', '_blank', 'noopener,noreferrer')}
                className="px-8 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-all duration-300"
              >
                Download App
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
