"use client"

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { VideoModal } from './video-modal'

interface VideoItem {
  id: string
  title: string
  thumbnail: string
  description?: string
  videoUrl?: string
  embedUrl?: string
  type?: 'video' | 'facebook' | 'youtube'
}

interface VideoGalleryProps {
  videos?: VideoItem[]
  className?: string
  title?: string
  subtitle?: string
}

/**
 * Horizontal Scrolling Video Gallery Component
 * 
 * A responsive video gallery with smooth horizontal scrolling, navigation arrows,
 * and comprehensive accessibility features. Designed to match the existing
 * website's aesthetic with consistent colors, spacing, and interactions.
 * 
 * Features:
 * - Smooth horizontal scrolling with navigation arrows
 * - Responsive design that adapts to all screen sizes
 * - Hover effects and smooth transitions
 * - Keyboard navigation support (arrow keys, Tab, Enter)
 * - ARIA labels and screen reader compatibility
 * - Video thumbnails with proper aspect ratio maintenance
 * - Fallback content for failed video loads
 * - Touch/swipe support for mobile devices
 * 
 * @component
 * @param {VideoGalleryProps} props - Component props
 * @param {VideoItem[]} [props.videos] - Array of video items to display
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.title] - Gallery section title
 * @param {string} [props.subtitle] - Gallery section subtitle
 * @returns {JSX.Element} VideoGallery component
 */
export function VideoGallery({ 
  videos = defaultVideos, 
  className = '', 
  title = "More Sermons",
  subtitle = "Discover powerful messages that will transform your life"
}: VideoGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [focusedVideoIndex, setFocusedVideoIndex] = useState<number | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Update scroll button states
  const updateScrollButtons = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }

  // Smooth scroll function
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.8 // Scroll 80% of container width
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        scroll('left')
        break
      case 'ArrowRight':
        e.preventDefault()
        scroll('right')
        break
      case 'Home':
        e.preventDefault()
        scrollContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
        break
      case 'End':
        e.preventDefault()
        const container = scrollContainerRef.current
        if (container) {
          container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' })
        }
        break
    }
  }

  // Handle video focus for accessibility
  const handleVideoFocus = (index: number) => {
    setFocusedVideoIndex(index)
  }

  // Handle video selection and modal opening
  const handleVideoSelect = (video: VideoItem) => {
    setSelectedVideo(video)
    setIsModalOpen(true)
  }

  // Handle modal closing
  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedVideo(null)
  }

  // Touch/swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const startX = touch.clientX
    const startScrollLeft = scrollContainerRef.current?.scrollLeft || 0

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const deltaX = touch.clientX - startX
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = startScrollLeft - deltaX
      }
    }

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      updateScrollButtons()
    }

    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }

  // Initialize and setup event listeners
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    updateScrollButtons()
    container.addEventListener('scroll', updateScrollButtons)
    
    // Handle window resize
    const handleResize = () => updateScrollButtons()
    window.addEventListener('resize', handleResize)

    return () => {
      container.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', handleResize)
    }
  }, [videos])

  return (
    <section className={`py-16 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary leading-tight mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Gallery Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`
              absolute left-0 top-1/2 -translate-y-1/2 z-10
              w-12 h-12 rounded-full bg-background/80 backdrop-blur-md
              border border-border shadow-lg
              flex items-center justify-center
              transition-all duration-300 hover:scale-110
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
              focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
              -translate-x-6 hover:-translate-x-8
            `}
            aria-label="Scroll left to see more videos"
            aria-hidden={!canScrollLeft}
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>

          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`
              absolute right-0 top-1/2 -translate-y-1/2 z-10
              w-12 h-12 rounded-full bg-background/80 backdrop-blur-md
              border border-border shadow-lg
              flex items-center justify-center
              transition-all duration-300 hover:scale-110
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
              focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
              translate-x-6 hover:translate-x-8
            `}
            aria-label="Scroll right to see more videos"
            aria-hidden={!canScrollRight}
          >
            <ChevronRight className="w-6 h-6 text-foreground" />
          </button>

          {/* Video Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide"
            onKeyDown={handleKeyDown}
            onTouchStart={handleTouchStart}
            role="region"
            aria-label="Video gallery"
            tabIndex={0}
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
              {videos.map((video, index) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  index={index}
                  isFocused={focusedVideoIndex === index}
                  onFocus={() => handleVideoFocus(index)}
                  onBlur={() => setFocusedVideoIndex(null)}
                  onSelect={() => handleVideoSelect(video)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicators */}
        <div className="flex justify-center mt-6 gap-2">
          {videos.map((_, index) => (
            <button
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${focusedVideoIndex === index ? 'bg-accent w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}
              `}
              aria-label={`Go to video ${index + 1}`}
              onClick={() => {
                const container = scrollContainerRef.current
                if (container) {
                  const cardWidth = 320 // Approximate card width + gap
                  container.scrollTo({
                    left: index * cardWidth,
                    behavior: 'smooth'
                  })
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Custom CSS for hiding scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Video Modal */}
      <VideoModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        video={selectedVideo!}
      />
    </section>
  )
}

interface VideoCardProps {
  video: VideoItem
  index: number
  isFocused: boolean
  onFocus: () => void
  onBlur: () => void
  onSelect: () => void
}

function VideoCard({ video, index, isFocused, onFocus, onBlur, onSelect }: VideoCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      className={`
        relative group cursor-pointer
        w-80 flex-shrink-0
        rounded-2xl overflow-hidden shadow-xl
        transition-all duration-500
        hover:shadow-2xl hover:-translate-y-2
        ${isFocused ? 'ring-2 ring-accent ring-offset-2' : ''}
      `}
      role="button"
      tabIndex={0}
      aria-label={`Watch ${video.title} `}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {!imageError ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className={`
              w-full h-full object-cover
              transition-transform duration-500
              group-hover:scale-105
            `}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-accent/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-sm text-foreground/60">Video Thumbnail</p>
            </div>
          </div>
        )}

        {/* Duration Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded-md font-medium">
         
        </div>

        {/* Play Button Overlay */}
        <div className={`
          absolute inset-0 bg-black/30 flex items-center justify-center
          transition-all duration-300
          ${isHovered ? 'bg-black/40' : ''}
        `}>
          <div className={`
            w-16 h-16 bg-accent text-accent-foreground rounded-full
            flex items-center justify-center
            transition-all duration-300
            group-hover:scale-110 group-hover:shadow-lg
            ${isHovered ? 'scale-110 shadow-lg' : ''}
          `}>
            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="p-5 bg-background">
        <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2">
          {video.title}
        </h3>
        
        <p className="text-sm text-foreground/70 mb-3 line-clamp-2">
          {video.description}
        </p>

        <div className="flex items-center justify-between text-xs text-foreground/60">
        
        </div>
      </div>

      {/* Focus Ring Animation */}
      {isFocused && (
        <div className="absolute inset-0 ring-2 ring-accent rounded-2xl pointer-events-none animate-pulse" />
      )}
    </div>
  )
}

// Default video data for demonstration - Sermon-focused content
const defaultVideos: VideoItem[] = [
  {
    id: '1',
    title: 'THE TRUE SOLUTION',
    thumbnail: '/sermonpix/sermon.jpeg',
    description: 'What is the true solution to life’s challenges?; When all that glitters fades and worldly possessions can’t fill the emptiness within, where do you turn?',
    embedUrl: 'https://www.youtube.com/embed/xCIwOK0Shx8?si=pkj7CFLmRu4kviRS',
    type: 'youtube'
  },
  {
    id: '2',
    title: 'The Character of a True Beliver',
    thumbnail: '/sermonpix/sermon2.jpeg',
    description: 'What is the character of a true believer? Is it about the words of their mouth, their outward appearance, or the paraphernalia of their Christian office?',
    embedUrl: 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D1340651834319725&show_text=0&width=560&mute=0',
    type: 'youtube'
  },
  {
    id: '3',
    title: 'WATCH AND PRAY',
    thumbnail: '/sermonpix/watchandpray.jpeg',
    description: 'In this exhortation to the Church, Pastor Evelyn Joshua reads from Numbers 21:4-9 as she speaks on faith, the promise of healing and salvation, and several other issues on how the believer can look up to Jesus in order to live.',
    embedUrl: 'https://www.youtube.com/embed/03dvo9F4zww?si=rLnfzBs4PUPwvkR6',
    type: 'youtube'
  },
  {
    id: '4',
    title: 'INVITING GOD\'S PRESENCE AND POWER',
    thumbnail: '/sermonpix/invitinggods.jpeg',
    description: 'What does it take to invite God\'s presence and power into your situation?',
    embedUrl: 'https://www.youtube.com/embed/qTM0g-OOzcs?si=ryT3efLCXy61Tis7',
    type: 'youtube'
  },
  {
    id: '5',
    title: 'A WORTHY PARTNER IN GOD\'S WORK',
    thumbnail: '/sermonpix/worthypartner.jpeg',
    description: 'What is it about a threefold cord that makes it so special, as affirmed by the Scriptures?',
    embedUrl: 'https://www.youtube.com/embed/CLRYl-eb34Y?si=HaNt6qWTctqCImwH',
    type: 'youtube'
  },
  {
    id: '6',
    title: 'THE POWER OF BELIEF',
    thumbnail: '/sermonpix/belief.jpeg',
    description: 'Reading from John 14:12, Pastor Evelyn Joshua speaks categorically about the link between faith and confession.',
    embedUrl: 'https://www.youtube.com/embed/Q6FrrncMEDM?si=aQtxYlHFjYWknqFj',
    type: 'youtube'
  },
  {
    id: '7',
    title: 'GOD\'S LOVE',
    thumbnail: '/sermonpix/Godslove.jpeg',
    description: 'As a Christian, do you know the source of power for exploits in the spiritual realm that manifest in the physical?',
    embedUrl: 'https://www.youtube.com/embed/4LpXP2Gc1bo?si=SSkRBm7yYIBA0zjp',
    type: 'youtube'
  },
]