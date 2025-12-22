"use client"

import { useState, useEffect, useRef } from "react"
import React from "react"
import { Container } from "@/components/layout/container"
import { Play, Pause, SkipBack, SkipForward, Volume2, Music } from 'lucide-react'
import { useRouter } from "next/navigation"

interface AudioTrack {
  id: number
  title: string
  artist: string
  category: string
  duration: string
  date: string
  audioUrl?: string
}

const audioTracks: AudioTrack[] = [
  {
    id: 1,
    title: "Walking in Faith During Uncertain Times",
    artist: "Pastor Evelyn Joshua",
    category: "Sermon",
    duration: "45:30",
    date: "Nov 17, 2024",
    // audioUrl: "https://docs.google.com/uc?export=open&id=1R8YkOyCEY3mM1aLg4ifDlFzF4Rt-nXtZ", // Removed Google Drive link
  },
  {
    id: 2,
    title: "Amazing Grace - Hymn Instrumental",
    artist: "Church Choir",
    category: "Worship Music",
    duration: "4:12",
    date: "Nov 10, 2024",
  },
  {
    id: 3,
    title: "Daily Devotional - Tuesday Message",
    artist: "Pastor Evelyn Joshua",
    category: "Devotional",
    duration: "8:45",
    date: "Nov 16, 2024",
  },
  {
    id: 4,
    title: "Praise and Worship Medley",
    artist: "Church Band",
    category: "Worship Music",
    duration: "12:30",
    date: "Nov 3, 2024",
  },
  {
    id: 5,
    title: "The Power of Prayer - Part 1",
    artist: "Pastor Evelyn Joshua",
    category: "Teaching Series",
    duration: "38:15",
    date: "Oct 20, 2024",
  },
]

export function AudioPlaylistSection() {
  const router = useRouter()
  const [currentTrack, setCurrentTrack] = useState<AudioTrack>(audioTracks[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [isNavigating, setIsNavigating] = useState(false)
  const [audioBars, setAudioBars] = useState<number[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const animationRef = useRef<number>(0)

  const filteredTracks = audioTracks.filter((track) => {
    if (activeTab === "all") return true
    return track.category.toLowerCase().replace(" ", "-") === activeTab
  })

  const currentIndex = audioTracks.findIndex((t) => t.id === currentTrack.id)

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentTrack(audioTracks[currentIndex - 1])
      setIsPlaying(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < audioTracks.length - 1) {
      setCurrentTrack(audioTracks[currentIndex + 1])
      setIsPlaying(false)
    }
  }

  const handlePlayClick = async () => {
    // Initialize audio context on first user interaction
    if (!audioContext && currentTrack.audioUrl) {
      await initializeAudioContext()
    }
    
    // Use the new play/pause handler
    await handlePlayPause()
  }

  const initializeAudioContext = async () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyserNode = ctx.createAnalyser()
      analyserNode.fftSize = 256
      analyserNode.smoothingTimeConstant = 0.8
      
      const bufferLength = analyserNode.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      setAudioContext(ctx)
      setAnalyser(analyserNode)
      setDataArray(dataArray)
      
      return { ctx, analyser: analyserNode, dataArray }
    }
    return { ctx: audioContext, analyser, dataArray }
  }

  const connectAudioToAnalyser = async (audioElement: HTMLAudioElement) => {
    const { ctx, analyser } = await initializeAudioContext()
    if (ctx && analyser) {
      const source = ctx.createMediaElementSource(audioElement)
      source.connect(analyser)
      analyser.connect(ctx.destination)
    }
  }

  const updateAudioVisualization = () => {
    if (analyser && dataArray) {
      const frequencyData = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(frequencyData)
      
      // Create 30 bars from frequency data
      const barCount = 30
      const bars = Array.from({ length: barCount }).map((_, i) => {
        const index = Math.floor((i / barCount) * frequencyData.length)
        const value = frequencyData[index]
        // Normalize to 0-100 range with some minimum height
        return Math.max(10, (value / 255) * 100)
      })
      
      setAudioBars(bars)
      
      // Continue animation
      animationRef.current = requestAnimationFrame(updateAudioVisualization)
    }
  }

  const handleTrackSelect = async (track: AudioTrack) => {
    setCurrentTrack(track)
    if (track.audioUrl) {
      // Initialize audio context for direct audio files
      if (!audioContext) {
        await initializeAudioContext()
      }
    }
  }

  const handleNavigateToSermons = () => {
    setIsNavigating(true)
    try {
      router.push('/Sermon')
    } catch (error) {
      console.error('Navigation failed:', error)
      setIsNavigating(false)
      // Fallback: try direct navigation
      window.location.href = '/Sermon'
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handlePlayPause = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        cancelAnimationFrame(animationRef.current)
      } else {
        // Resume audio context if suspended
        if (audioContext && audioContext.state === 'suspended') {
          await audioContext.resume()
        }
        audioRef.current.play()
        updateAudioVisualization()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const width = rect.width
      const newTime = (clickX / width) * duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  // Connect audio element to analyser when available
  useEffect(() => {
    if (audioRef.current && audioContext && analyser) {
      connectAudioToAnalyser(audioRef.current)
    }
  }, [audioContext, analyser])

  // Generate audio bars client-side to avoid hydration mismatch
  useEffect(() => {
    // Initialize with static bars, will be replaced by dynamic ones when audio plays
    const bars = Array.from({ length: 30 }).map(() => Math.random() * 30 + 15)
    setAudioBars(bars)
  }, [])

  return (
    <section className="py-12 sm:py-20">
      <Container>
        {/* Hidden Audio Element for Web Audio API */}
        {currentTrack.audioUrl && (
          <audio
            ref={audioRef}
            src={currentTrack.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false)
              cancelAnimationFrame(animationRef.current)
            }}
            className="hidden"
          />
        )}

        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <p className="text-accent font-semibold tracking-wider uppercase text-xs sm:text-sm mb-3">
            Audio Library
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">
            Sermons, Music & <span className="text-accent">Devotionals</span>
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Explore our collection of inspiring sermons, worship music, and daily devotionals
          </p>
        </div>

        {/* Audio Player */}
        <div className="mb-12 animate-scale-up">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 sm:p-10 text-white shadow-xl">
            {/* Track Title */}
            <div className="mb-6">
              <p className="text-accent/80 text-sm uppercase tracking-wider font-semibold mb-2">
                Now Playing
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">{currentTrack.title}</h3>
              <p className="text-white/80">{currentTrack.artist}</p>
            </div>

            {/* Audio Visualization */}
            {currentTrack.audioUrl && (
              <div className="mb-6 flex items-end gap-1 h-20 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                {audioBars.map((height, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-75 ${
                      isPlaying ? 'bg-accent animate-pulse' : 'bg-white/40'
                    }`}
                    style={{
                      height: `${height}%`,
                      transform: isPlaying ? 'scaleY(1)' : 'scaleY(0.3)',
                      transformOrigin: 'bottom',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-6">
              <div 
                className="w-full bg-white/20 rounded-full h-2 mb-3 cursor-pointer group"
                onClick={handleProgressClick}
              >
                <div 
                  className="bg-accent h-full rounded-full transition-all duration-300 group-hover:brightness-110"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-white/80">
                <span>{formatTime(currentTime)}</span>
                <span>{duration ? formatTime(duration) : currentTrack.duration}</span>
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="p-3 hover:bg-white/10 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipBack size={24} />
              </button>

              <button
                onClick={handlePlayClick}
                className="w-14 h-14 bg-accent text-primary rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-lg"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === audioTracks.length - 1}
                className="p-3 hover:bg-white/10 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipForward size={24} />
              </button>

              <div className="ml-auto flex items-center gap-3">
                <Volume2 size={20} />
                <div className="w-24 h-1 bg-white/20 rounded-full">
                  <div className="bg-accent w-3/4 h-full rounded-full" />
                </div>
              </div>
            </div>

            {/* Track Info */}
            <div className="flex justify-between text-sm text-white/70 border-t border-white/10 pt-4">
              <span>{currentTrack.category}</span>
              <span>{currentTrack.date}</span>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-8 flex flex-wrap gap-3 animate-fade-in">
          {["all", "sermon", "worship-music", "devotional", "teaching-series"].map((category) => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base ${
                activeTab === category
                  ? "bg-accent text-accent-foreground shadow-lg"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {category === "all" ? "All" : category.replace("-", " ").toUpperCase()}
            </button>
          ))}
        </div>

        {/* Playlist */}
        <div className="space-y-3 animate-slide-in-left">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              onClick={() => handleTrackSelect(track)}
              className={`group p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer hover-lift ${
                currentTrack.id === track.id
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent/50 bg-card hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Play Icon */}
                <div className="flex-shrink-0">
                  {currentTrack.id === track.id && isPlaying ? (
                    <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center">
                      <Pause size={20} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-accent/20 text-accent rounded-full flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-all">
                      <Play size={20} className="ml-1" />
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{track.title}</h3>
                  <p className="text-sm text-foreground/60">{track.artist}</p>
                </div>

                {/* Category Badge */}
                <div className="hidden sm:inline-flex flex-shrink-0">
                  <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium">
                    {track.category}
                  </span>
                </div>

                {/* Duration */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-medium text-foreground text-sm">{track.duration}</p>
                  <p className="text-xs text-foreground/60">{track.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        
      </Container>
    </section>
  )
}
