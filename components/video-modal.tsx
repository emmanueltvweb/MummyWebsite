"use client"

import { useState, useEffect, useRef } from 'react'
import { X, Facebook, Maximize2, Volume2, VolumeX, Play, Pause } from 'lucide-react'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  video: {
    id: string
    title: string
    thumbnail: string
    description?: string
    videoUrl?: string
    embedUrl?: string
    type?: 'video' | 'facebook' | 'youtube'
  }
}

export function VideoModal({ isOpen, onClose, video }: VideoModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [isEmbed, setIsEmbed] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const focusableElementsRef = useRef<HTMLElement[]>([])
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Detect if this is an embed video (Facebook, YouTube, etc.)
  useEffect(() => {
    if (!video) return
    const embedType = video.type || (video.embedUrl ? 'embed' : 'video')
    setIsEmbed(embedType !== 'video')
  }, [video])

  // Handle keyboard navigation and focus trapping
  useEffect(() => {
    if (!isOpen) return

    // Get all focusable elements in the modal
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusableElementsRef.current = Array.from(focusableElements || []) as HTMLElement[]

    // Focus the first focusable element
    const firstElement = focusableElementsRef.current[0]
    if (firstElement) {
      firstElement.focus()
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'Tab':
          e.preventDefault()
          handleTabNavigation(e)
          break
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
      }
    }

    const handleTabNavigation = (e: KeyboardEvent) => {
      const currentIndex = focusableElementsRef.current.findIndex(
        el => el === document.activeElement
      )
      
      if (e.shiftKey) {
        // Shift+Tab - go to previous element
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElementsRef.current.length - 1
        focusableElementsRef.current[prevIndex]?.focus()
      } else {
        // Tab - go to next element
        const nextIndex = currentIndex < focusableElementsRef.current.length - 1 ? currentIndex + 1 : 0
        focusableElementsRef.current[nextIndex]?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle video events
  useEffect(() => {
    if (isEmbed) return
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [isOpen, isEmbed])

  // Auto-play video when modal opens
  useEffect(() => {
    if (isEmbed) return
    if (isOpen && videoRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        videoRef.current?.play().catch(console.error)
        setIsPlaying(true)
      }, 300)
    }
  }, [isOpen, isEmbed])

  const togglePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().catch(console.error)
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return

    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (!isFullscreen) {
      videoRef.current.requestFullscreen().catch(console.error)
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(console.error)
      setIsFullscreen(false)
    }
  }

  const handleShareOnFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      window.location.href
    )}&quote=${encodeURIComponent(`Check out this inspiring sermon: ${video.title}`)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const newTime = (clickX / width) * duration
    
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      aria-describedby="video-modal-description"
    >
      <div
        ref={modalRef}
        className={`
          relative bg-background rounded-2xl shadow-2xl overflow-hidden
          transition-all duration-300 ease-out
          ${isFullscreen ? 'w-full h-full' : 'w-full max-w-4xl'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex-1">
            <h2 id="video-modal-title" className="text-lg font-semibold text-foreground">
              {video.title}
            </h2>
            <p id="video-modal-description" className="text-sm text-foreground/70">
              {video.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Facebook Share Button */}
            <button
              onClick={handleShareOnFacebook}
              className="p-2 rounded-lg bg-[#1877F2] text-white hover:bg-[#166FE5] transition-colors"
              aria-label="Share on Facebook"
              title="Share on Facebook"
            >
              <Facebook className="w-4 h-4" />
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Close video modal"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative bg-black">
          {isLoading && !isEmbed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
          )}
          
          {isEmbed ? (
            <div className="w-full aspect-video">
              <iframe
                src={video.embedUrl}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={video.title}
                aria-label={`Video: ${video.title}`}
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-auto"
              poster={video.thumbnail}
              controls={false}
              preload="metadata"
              aria-label={`Video: ${video.title}`}
            >
              <source src={video.videoUrl || '#'} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}

          {/* Custom Controls Overlay */}
          {!isEmbed && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <div 
                className="w-full bg-white/20 rounded-full h-1 cursor-pointer"
                onClick={handleProgressClick}
                role="slider"
                aria-label="Video progress"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={currentTime}
              >
                <div 
                  className="bg-accent h-full rounded-full transition-all duration-100"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/80 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayPause}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                </button>
                
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                </button>
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
              >
                <Maximize2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}