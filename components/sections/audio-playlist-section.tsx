"use client"

import { useState, useEffect, useRef } from "react"
import React from "react"
import { Container } from "@/components/layout/container"
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, AlertTriangle } from 'lucide-react'
import { useRouter } from "next/navigation"

// -------------------- Helpers --------------------

// Format seconds to mm:ss
const formatDuration = (seconds: number) => {
  if (!seconds || isNaN(seconds) || seconds === Infinity) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`
}

// Accessibility helper: announce track changes to screen readers (and optionally speak them)
function announceTrackChange(track: { title?: string; artist?: string }) {
  try {
    const announcement = track?.title
      ? `Now playing: ${track.title}${track.artist ? " by " + track.artist : ""}`
      : "Track changed"

    // Prefer speechSynthesis for an audible cue (optional)
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const utter = new SpeechSynthesisUtterance(announcement)
        utter.volume = 0.6
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utter)
        return
      } catch (e) {
        // fallback to aria-live
        // eslint-disable-next-line no-console
        console.warn("speechSynthesis failed, falling back to aria-live:", e)
      }
    }

    // Fallback: update a polite aria-live region so screen readers announce the text
    const ID = "sr-announcer"
    let el = document.getElementById(ID) as HTMLElement | null
    if (!el) {
      el = document.createElement("div")
      el.id = ID
      el.setAttribute("aria-live", "polite")
      el.setAttribute("aria-atomic", "true")
      el.style.position = "absolute"
      el.style.width = "1px"
      el.style.height = "1px"
      el.style.margin = "-1px"
      el.style.overflow = "hidden"
      el.style.clip = "rect(0 0 0 0)"
      el.style.whiteSpace = "nowrap"
      el.style.border = "0"
      document.body.appendChild(el)
    }
    el.textContent = announcement

    setTimeout(() => {
      if (el) el.textContent = ""
    }, 1200)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("announceTrackChange error", err)
  }
}

// Pause and clear other audio elements on the page except optional 'except' audio element
function pauseAllOtherAudio(except?: HTMLAudioElement | null) {
  try {
    const audios = Array.from(document.querySelectorAll('audio')) as HTMLAudioElement[]
    audios.forEach(a => {
      if (except && a === except) return
      try {
        a.pause()
        // clear src to avoid continued streaming
        a.removeAttribute('src')
        // reload to ensure it is stopped
        // some browsers require load() after removing src
        a.load()
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to pause/clear audio element', e)
      }
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('pauseAllOtherAudio error', e)
  }
}

// -------------------- Types & Tracks --------------------

interface AudioTrack {
  id: number
  title: string
  artist: string
  category: string
  duration: string
  date?: string
  audioUrl?: string
  embedUrl?: string
  isEmbed?: boolean
  isPreloaded?: boolean
}

interface AudioPlayerState {
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  error: string | null
  isMuted: boolean
  isSeeking: boolean
  isBuffering: boolean
}

const audioTracks: AudioTrack[] = [
  {
    id: 1,
    title: "The Character of a True Believer",
    artist: "Pastor Evelyn Joshua",
    category: "Sermon",
    duration: "28:37",
    date: "Sept 28, 2025",
    embedUrl: "https://res.cloudinary.com/dvlcc2r5w/video/upload/v1771416823/THE_CHARACTER_OF_A_TRUE_BELIEVER_Pastor_Evelyn_Joshua_Sermon_vrnaqt.mp3",
    isEmbed: true
  },
  {
    id: 2,
    title: "THE TRUE SOLUTION",
    artist: "Pastor Evelyn Joshua",
    category: "Sermon",
    duration: "30:16",
    date: "Oct 26, 2025",
    embedUrl: "https://res.cloudinary.com/dvlcc2r5w/video/upload/v1771416830/THE_TRUE_SOLUTION_-_Pastor_Evelyn_Joshua_Sermon_lmakzi.mp3",
    isEmbed: true
  },
  {
    id: 3,
    title: "INVITING GOD'S PRESENCE AND POWER",
    artist: "Pastor Evelyn Joshua",
    category: "Sermon",
    duration: "32:53",
    date: "July 06, 2025",
    embedUrl: "https://res.cloudinary.com/dvlcc2r5w/video/upload/v1771416822/INVITING_GOD_S_PRESENCE_AND_POWER___Pastor_Evelyn_Joshua_Sermon_bbwmji.mp3",
    isEmbed: true
  },
  {
    id: 4,
    title: "DIVINE HEALING",
    artist: "Pastor Evelyn Joshua",
    category: "Sermon",
    duration: "34:14",
    date: "Dec 6, 2025",
    embedUrl: "https://res.cloudinary.com/dvlcc2r5w/video/upload/v1771416816/DIVINE_HEALING_-_Pastor_Evelyn_Joshua_Sermon_i4gfxv.mp3",
    isEmbed: true
  },
  {
    id: 5,
    title: "A SONG FOR CHRISTMAS A SONG FOR ALL SEASONS",
    artist: "SCOAN Choir",
    category: "Worship Music",
    duration: "2:56",
    date: "Dec 25, 2025",
    embedUrl: "https://res.cloudinary.com/dvlcc2r5w/video/upload/v1771416811/A_SONG_FOR_CHRISTMAS_A_SONG_FOR_ALL_SEASONS_c5vlef.mp3",
    isEmbed: true
  },
]

// -------------------- Component --------------------

export function AudioPlaylistSection() {
  const router = useRouter()
  const [currentTrack, setCurrentTrack] = useState<AudioTrack>(audioTracks[0])
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    error: null,
    isMuted: false,
    isSeeking: false,
    isBuffering: false
  })
  const [activeTab, setActiveTab] = useState("all")
  const [isNavigating, setIsNavigating] = useState(false)
  const [audioBars, setAudioBars] = useState<number[]>([])
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const animationRef = useRef<number>(0)
  const loadingTimeoutRef = useRef<any>(null)
  const progressIntervalRef = useRef<any>(null)
  const embedTimeoutRef = useRef<any>(null)

  // id to track the latest play attempt (prevents race conditions)
  const playAttemptIdRef = useRef<number>(0)

  const filteredTracks = audioTracks.filter((track) => {
    if (activeTab === "all") return true
    return track.category.toLowerCase().replace(" ", "-") === activeTab
  })

  const currentIndex = audioTracks.findIndex((t) => t.id === currentTrack.id)

  const isDirectAudioUrl = (url?: string) => {
    if (!url) return false
    const ext = url.split('.').pop()?.split(/[?#]/)[0]?.toLowerCase() || ''
    return ['mp3','m4a','wav','aac','ogg','flac'].includes(ext)
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentTrack(audioTracks[currentIndex - 1])
      setPlayerState(prev => ({ ...prev, isPlaying: false, currentTime: 0, error: null }))
      // ensure stopping any audio
      pauseAllOtherAudio(null)
    }
  }

  const handleNext = () => {
    if (currentIndex < audioTracks.length - 1) {
      setCurrentTrack(audioTracks[currentIndex + 1])
      setPlayerState(prev => ({ ...prev, isPlaying: false, currentTime: 0, error: null }))
      pauseAllOtherAudio(null)
    }
  }

  // playWithRetry: checks for attempt id to abort stale attempts
  const playWithRetry = async (audio: HTMLAudioElement | null, maxRetries: number, attemptId: number): Promise<void> => {
    if (!audio) throw new Error('Audio element not available')

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // If a new attempt started after this one, bail out
      if (attemptId !== playAttemptIdRef.current) {
        throw new Error('Play attempt aborted (stale)')
      }

      try {
        await audio.play()
        return // Success!
      } catch (error) {
        lastError = error as Error
        // eslint-disable-next-line no-console
        console.warn(`Audio play attempt ${attempt} failed:`, error)

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 500))
        }
      }
    }

    throw lastError || new Error('Audio playback failed after retries')
  }

  // Initialize audio context
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
    }
    return { ctx: audioContext, analyser, dataArray }
  }

  // Connect audio element to analyser (guard double connections)
  const connectAudioToAnalyser = async (audioElement: HTMLAudioElement) => {
    const { ctx, analyser } = await initializeAudioContext()
    if (ctx && analyser) {
      try {
        const source = ctx.createMediaElementSource(audioElement)
        source.connect(analyser)
        analyser.connect(ctx.destination)
      } catch (err) {
        // ignore double connection errors
      }
    }
  }

  // updateAudioVisualization
  const updateAudioVisualization = () => {
    if (analyser && dataArray) {
      const frequencyData = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(frequencyData)

      const barCount = 30
      const bars = Array.from({ length: barCount }).map((_, i) => {
        const index = Math.floor((i / barCount) * frequencyData.length)
        const value = frequencyData[index]
        return Math.max(10, (value / 255) * 100)
      })

      setAudioBars(bars)

      animationRef.current = requestAnimationFrame(updateAudioVisualization)
    }
  }

  // Improved track selection: handle direct audio vs true iframe embed
  const handleTrackSelect = async (track: AudioTrack) => {
    try {
      // Announce track change to screen readers
      announceTrackChange(track)

      // Clear existing intervals/timeouts
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }

      // Stop current playback and cleanup visualization
      if (audioRef.current && playerState.isPlaying) {
        audioRef.current.pause()
        cancelAnimationFrame(animationRef.current)
      }

      // Reset state
      setPlayerState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        error: null,
        isLoading: false
      }))

      // Set new track
      setCurrentTrack(track)

      // If the embedUrl is actually a direct audio (Cloudinary mp3), treat it as direct audio:
      const directUrl = track.audioUrl || (isDirectAudioUrl(track.embedUrl || '') ? track.embedUrl : undefined)

      if (directUrl && audioRef.current) {
        // Pause any other audio elements first
        pauseAllOtherAudio(audioRef.current)

        // Set src and attempt to play
        audioRef.current.src = directUrl
        audioRef.current.crossOrigin = 'anonymous'
        audioRef.current.load()

        // Initialize audio context + analyser if needed
        if (!audioContext) await initializeAudioContext()
        connectAudioToAnalyser(audioRef.current)

        // Start a new play attempt
        playAttemptIdRef.current += 1
        const attemptId = playAttemptIdRef.current

        setPlayerState(prev => ({ ...prev, isLoading: true, error: null }))

        try {
          await playWithRetry(audioRef.current, 3, attemptId)
          if (attemptId === playAttemptIdRef.current) {
            setPlayerState(prev => ({ ...prev, isPlaying: true, isLoading: false }))
            updateAudioVisualization()
          }
        } catch (err) {
          if (attemptId === playAttemptIdRef.current) {
            // eslint-disable-next-line no-console
            console.error('Playback failed after retries:', err)
            setPlayerState(prev => ({ ...prev, isPlaying: false, isLoading: false, error: 'Unable to play audio. Please try again.' }))
          }
        }

        return
      }

      // If it's a true embed that is NOT a direct audio file (e.g., archive.org embed), we rely on iframe
      if (track.isEmbed && track.embedUrl && !isDirectAudioUrl(track.embedUrl)) {
        setPlayerState(prev => ({ ...prev, isLoading: true }))
        const cleanup = loadEmbeddedContent(track)
        return cleanup
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Track selection failed:', error)
      setPlayerState(prev => ({ ...prev, error: 'Unable to select track. Please try again.', isLoading: false }))
    }
  }

  const handleNavigateToSermons = () => {
    setIsNavigating(true)
    try {
      router.push('/Sermon')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Navigation failed:', error)
      setIsNavigating(false)
      window.location.href = '/Sermon'
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPlayerState(prev => ({ ...prev, currentTime: audioRef.current!.currentTime }))
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const newDuration = audioRef.current.duration
      setPlayerState(prev => ({ ...prev, duration: newDuration }))
    }
  }

  const handleAudioError = (event: React.SyntheticEvent<HTMLAudioElement>) => {
    const audioElement = event.target as HTMLAudioElement
    const error = audioElement.error
    let errorMessage = 'Unable to load audio. Please try another track.'
    let isRecoverable = false

    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Audio loading was interrupted.'
          isRecoverable = true
          break
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error occurred while loading audio.'
          isRecoverable = true
          break
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Audio format not supported or corrupted file.'
          isRecoverable = false
          break
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Audio source not supported. Please try a different format.'
          isRecoverable = false
          break
        default:
          errorMessage = 'Unknown error occurred while loading audio.'
          isRecoverable = true
      }
    }

    // eslint-disable-next-line no-console
    console.error(`Audio error for track "${currentTrack.title}": ${error?.message} (Code: ${error?.code})`)

    setPlayerState(prev => ({
      ...prev,
      error: errorMessage,
      isPlaying: false,
      isLoading: false
    }))

    if (isRecoverable && error?.code === MediaError.MEDIA_ERR_NETWORK) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load()
          audioRef.current.play().catch(() => {
            setPlayerState(prev => ({ ...prev, error: 'Unable to recover from network error. Please try a different track.' }))
          })
        }
      }, 1000)
    }
  }

  // loadEmbeddedContent
  const loadEmbeddedContent = (track: AudioTrack) => {
    setPlayerState(prev => ({ ...prev, isLoading: true, error: null }))

    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)

    loadingTimeoutRef.current = setTimeout(() => {
      if (playerState.isLoading) {
        // eslint-disable-next-line no-console
        console.warn(`Embedded content timeout for track: ${track.title}`)
        handleEmbedError('Embedded content loading timeout')
      }
    }, 10000)

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
  }

  const handleEmbedError = (error: string) => {
    // eslint-disable-next-line no-console
    console.error(`Embedded player error: ${error}`)
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
    setPlayerState(prev => ({ ...prev, isLoading: false, error: 'Embedded player failed.' }))
  }

  const handleIframeLoad = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
    setPlayerState(prev => ({ ...prev, isLoading: false, error: null }))
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'ping' }, '*')
    } catch (e) {
      // cross-origin likely — that's expected
    }
  }

  const handleIframeError = () => {
    // eslint-disable-next-line no-console
    console.error('Iframe failed to load')
    handleEmbedError('Iframe loading failed')
  }

  // controlEmbeddedPlayer (unchanged)
  const controlEmbeddedPlayer = async (action: 'play' | 'pause') => {
    if (!iframeRef.current) return false

    try {
      const iframe = iframeRef.current

      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc) {
          const selectors = [
            'button[title*="Play"]', 'button[aria-label*="Play"]', '.play-button',
            'button[title*="Pause"]', 'button[aria-label*="Pause"]', '.pause-button',
            '.jw-play', '.jw-pause', '.mejs-play', '.mejs-pause'
          ]

          const targetSelector = action === 'play'
            ? selectors.filter(s => s.toLowerCase().includes('play'))
            : selectors.filter(s => s.toLowerCase().includes('pause'))

          for (const selector of targetSelector) {
            const button = iframeDoc.querySelector(selector) as HTMLButtonElement
            if (button) {
              button.click()
              return true
            }
          }
        }
      } catch (e) {
        // direct access failed
      }

      try {
        iframe.contentWindow?.postMessage({
          type: 'player-control',
          action: action,
          source: 'custom-player'
        }, '*')
        return true
      } catch (e) {
        // postMessage failed
      }

      try {
        const event = new KeyboardEvent('keydown', {
          key: ' ',
          code: 'Space',
          keyCode: 32,
          which: 32,
          bubbles: true
        })
        iframe.dispatchEvent(event)
        return true
      } catch (e) {
        // keyboard event failed
      }

      return false
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('All embedded player control methods failed:', error)
      return false
    }
  }

  // Central play/pause handler — improved for direct audio
  const handlePlayPause = async () => {
    if (playerState.isLoading) return // guard

    // If current track is an embed but its embedUrl is actually a direct audio file, treat it as direct audio
    const directUrl = currentTrack.audioUrl || (isDirectAudioUrl(currentTrack.embedUrl || '') ? currentTrack.embedUrl : undefined)

    if (directUrl && audioRef.current) {
      // Direct audio flow
      if (!audioContext) {
        await initializeAudioContext()
      }
      connectAudioToAnalyser(audioRef.current)

      if (playerState.isPlaying) {
        try {
          audioRef.current.pause()
          // Also pause any other audio elements just to be safe
          pauseAllOtherAudio(audioRef.current)
          cancelAnimationFrame(animationRef.current)
          setPlayerState(prev => ({ ...prev, isPlaying: false }))
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Error pausing audio:', err)
          setPlayerState(prev => ({ ...prev, isPlaying: false, error: 'Failed to pause audio.' }))
        }
        return
      }

      // Start playback with robust flow
      playAttemptIdRef.current += 1
      const attemptId = playAttemptIdRef.current
      setPlayerState(prev => ({ ...prev, isLoading: true, error: null }))

      // Ensure src is set
      if (audioRef.current.src !== directUrl) {
        // Pause other audio before switching
        pauseAllOtherAudio(audioRef.current)
        audioRef.current.src = directUrl
        audioRef.current.crossOrigin = 'anonymous'
        audioRef.current.load()
      }

      try {
        await playWithRetry(audioRef.current, 3, attemptId)
        if (attemptId === playAttemptIdRef.current) {
          setPlayerState(prev => ({ ...prev, isPlaying: true, isLoading: false }))
          updateAudioVisualization()
        }
      } catch (err) {
        if (attemptId === playAttemptIdRef.current) {
          // eslint-disable-next-line no-console
          console.error('Playback failed:', err)
          setPlayerState(prev => ({ ...prev, isPlaying: false, isLoading: false, error: 'Unable to play audio. Please try again.' }))
        }
      }

      return
    }

    // Otherwise try to control embedded iframe player (if any)
    if (currentTrack.isEmbed && iframeRef.current) {
      setPlayerState(prev => ({ ...prev, isLoading: true, error: null }))
      try {
        const success = await controlEmbeddedPlayer(playerState.isPlaying ? 'pause' : 'play')
        if (success) {
          setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
        } else {
          // couldn't control embed; flip state only as feedback
          setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error controlling embedded player:', err)
        setPlayerState(prev => ({ ...prev, isPlaying: false, error: 'Failed to control embedded player.' }))
      } finally {
        loadingTimeoutRef.current = setTimeout(() => setPlayerState(prev => ({ ...prev, isLoading: false })), 500)
      }
      return
    }

    // Fallback: nothing to play
    setPlayerState(prev => ({ ...prev, error: 'No playable audio source available.' }))
  }

  // Handle player actions (volume, seek, rate)
  const handlePlayerAction = (action: 'volume' | 'seek' | 'rate', value: number) => {
    switch (action) {
      case 'volume':
        const newVolume = Math.max(0, Math.min(1, value))
        const isMuted = newVolume === 0
        
        if (audioRef.current) {
          audioRef.current.volume = newVolume
          audioRef.current.muted = isMuted
        }
        
        setPlayerState(prev => ({
          ...prev,
          volume: newVolume,
          isMuted: isMuted
        }))
        
        // Save to localStorage
        try {
          localStorage.setItem('audioPlayerSettings', JSON.stringify({
            volume: newVolume,
            playbackRate: playerState.playbackRate
          }))
        } catch (e) {
          // Silently ignore localStorage errors
        }
        break
        
      case 'seek':
        const seekTime = Math.max(0, Math.min(playerState.duration, value))
        
        if (audioRef.current) {
          audioRef.current.currentTime = seekTime
        }
        
        setPlayerState(prev => ({
          ...prev,
          currentTime: seekTime
        }))
        break
        
      case 'rate':
        const newRate = Math.max(0.5, Math.min(2, value))
        
        if (audioRef.current) {
          audioRef.current.playbackRate = newRate
        }
        
        setPlayerState(prev => ({
          ...prev,
          playbackRate: newRate
        }))
        
        // Save to localStorage
        try {
          localStorage.setItem('audioPlayerSettings', JSON.stringify({
            volume: playerState.volume,
            playbackRate: newRate
          }))
        } catch (e) {
          // Silently ignore localStorage errors
        }
        break
    }
  }

  const formatTime = (time: number): string => {
    if (isNaN(time) || time < 0) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && playerState.duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const width = rect.width
      const percentage = Math.max(0, Math.min(1, clickX / width))
      const newTime = percentage * playerState.duration
      try {
        audioRef.current.currentTime = newTime
        setPlayerState(prev => ({ ...prev, currentTime: newTime }))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error seeking audio:', error)
        setPlayerState(prev => ({ ...prev, error: 'Unable to seek audio. Please try again.' }))
      }
    }
  }

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!audioRef.current || playerState.duration <= 0) return
    const seekStep = 5
    let newTime = playerState.currentTime
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        newTime = Math.max(0, playerState.currentTime - seekStep)
        break
      case 'ArrowRight':
      case 'ArrowUp':
        newTime = Math.min(playerState.duration, playerState.currentTime + seekStep)
        break
      case 'Home':
        newTime = 0
        break
      case 'End':
        newTime = playerState.duration
        break
      default:
        return
    }
    e.preventDefault()
    try {
      audioRef.current.currentTime = newTime
      setPlayerState(prev => ({ ...prev, currentTime: newTime }))
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error seeking audio:', error)
      setPlayerState(prev => ({ ...prev, error: 'Unable to seek audio. Please try again.' }))
    }
  }

  const updateProgress = () => {
    if (audioRef.current && playerState.isPlaying) {
      const currentTime = audioRef.current.currentTime
      const duration = audioRef.current.duration
      if (Math.abs(currentTime - playerState.currentTime) > 0.1 || Math.abs(duration - playerState.duration) > 0.1) {
        setPlayerState(prev => ({ ...prev, currentTime, duration: duration || prev.duration }))
      }
      if (playerState.isPlaying) {
        animationRef.current = requestAnimationFrame(updateProgress)
      }
    }
  }

  useEffect(() => {
    if (playerState.isPlaying && !currentTrack.isEmbed) {
      animationRef.current = requestAnimationFrame(updateProgress)
    } else {
      cancelAnimationFrame(animationRef.current)
    }
    return () => cancelAnimationFrame(animationRef.current)
  }, [playerState.isPlaying, currentTrack.isEmbed])

  useEffect(() => {
    if (audioRef.current && audioContext && analyser) connectAudioToAnalyser(audioRef.current)
  }, [audioContext, analyser])

  // Simulated progress for true embedded content (keeps previous behavior)
  useEffect(() => {
    if (currentTrack.isEmbed && !isDirectAudioUrl(currentTrack.embedUrl || '') && playerState.isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        setPlayerState(prev => {
          const newTime = prev.currentTime + 1
          const lengthSeconds = 1717
          if (newTime >= lengthSeconds) {
            setTimeout(() => setPlayerState(prev => ({ ...prev, isPlaying: false })), 0)
            return { ...prev, currentTime: lengthSeconds }
          }
          return { ...prev, currentTime: newTime }
        })
      }, 1000)
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [currentTrack.isEmbed, playerState.isPlaying])

  useEffect(() => {
    if (currentTrack.isEmbed) {
      setPlayerState(prev => ({ ...prev, duration: 1717, currentTime: 0, error: null }))
    }
  }, [currentTrack.isEmbed])

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioRef.current && playerState.isPlaying) audioRef.current.pause()
      if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(console.warn)
      // Pause all other audios on unmount
      pauseAllOtherAudio(null)
    }
  }, [])

  const cleanupAudioResources = () => {
    cancelAnimationFrame(animationRef.current)
    if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null }
    if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null }
    if (analyser) analyser.disconnect()
    if (audioContext) audioContext.close().catch(console.warn)
    if (audioRef.current) { try { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current.removeAttribute('src'); audioRef.current.load() } catch (e) {} }
    if (embedTimeoutRef.current) { clearTimeout(embedTimeoutRef.current); embedTimeoutRef.current = null }
    // ensure no other audio is playing
    pauseAllOtherAudio(null)
    // eslint-disable-next-line no-console
    console.log('Audio resources cleaned up')
  }

  const savePlayerState = (): void => {
    try {
      const stateToSave = {
        currentTrackId: currentTrack.id,
        currentTime: playerState.currentTime,
        isPlaying: playerState.isPlaying,
        volume: playerState.volume,
        playbackRate: playerState.playbackRate,
        timestamp: Date.now()
      }
      localStorage.setItem('audioPlayerState', JSON.stringify(stateToSave))
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save player state:', error)
    }
  }

  const restorePlayerState = () => {
    try {
      const savedState = localStorage.getItem('audioPlayerState')
      if (savedState) {
        const parsed = JSON.parse(savedState)
        const maxAge = 24 * 60 * 60 * 1000
        if (Date.now() - parsed.timestamp < maxAge) {
          const savedTrack = audioTracks.find(track => track.id === parsed.currentTrackId)
          if (savedTrack) {
            setCurrentTrack(savedTrack)
            setPlayerState(prev => ({ ...prev, volume: parsed.volume || 1, playbackRate: parsed.playbackRate || 1 }))
            if (audioRef.current && parsed.currentTime > 0) audioRef.current.currentTime = parsed.currentTime
          }
        } else {
          localStorage.removeItem('audioPlayerState')
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to restore player state:', error)
    }
  }

  useEffect(() => {
    const saveTimeout = setTimeout(() => savePlayerState(), 1000)
    return () => clearTimeout(saveTimeout)
  }, [currentTrack.id, playerState.currentTime, playerState.volume, playerState.playbackRate])

  const preloadAudioMetadata = async (track: AudioTrack) => {
    if (!track.audioUrl && !isDirectAudioUrl(track.embedUrl || '')) return
    try {
      const audio = new Audio()
      audio.preload = 'metadata'
      return new Promise<void>((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          const duration = formatDuration(audio.duration)
          const trackIndex = audioTracks.findIndex(t => t.id === track.id)
          if (trackIndex !== -1) audioTracks[trackIndex].duration = duration
          resolve()
        })
        audio.addEventListener('error', () => resolve())
        const src = track.audioUrl || track.embedUrl
        if (src) { audio.src = src; audio.load() } else resolve()
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Error preloading metadata for "${track.title}":`, error)
    }
  }

  const preloadNextTracks = async (currentIndex: number, count: number = 2) => {
    const tracksToPreload = audioTracks.slice(currentIndex + 1, currentIndex + 1 + count)
    if (tracksToPreload.length === 0) return
    const results = await Promise.allSettled(tracksToPreload.map(track => preloadAudioMetadata(track)))
    // eslint-disable-next-line no-console
    console.log(`Preloaded ${results.length} next tracks (some may have failed)`)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const trackId = entry.target.getAttribute('data-track-id')
          if (trackId) {
            const track = audioTracks.find(t => t.id === parseInt(trackId))
            if (track && (track.audioUrl || isDirectAudioUrl(track.embedUrl || '')) && (!track.duration || track.duration === '0:00')) {
              preloadAudioMetadata(track)
            }
          }
        }
      })
    }, { rootMargin: '50px', threshold: 0.1 })

    const trackElements = document.querySelectorAll('[data-track-id]')
    trackElements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const currentIdx = audioTracks.findIndex(track => track.id === currentTrack.id)
    if (currentIdx !== -1) preloadNextTracks(currentIdx)
  }, [currentTrack.id])

  useEffect(() => { restorePlayerState() }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') return
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          handlePlayPause()
          break
        case 'p':
          e.preventDefault()
          handlePrevious()
          break
        case 'n':
          e.preventDefault()
          handleNext()
          break
        case 'm':
          e.preventDefault()
          handlePlayerAction('volume', playerState.isMuted ? playerState.volume : 0)
          break
        case 'arrowleft':
          e.preventDefault()
          if (audioRef.current) handlePlayerAction('seek', Math.max(0, playerState.currentTime - 5))
          break
        case 'arrowright':
          e.preventDefault()
          if (audioRef.current) handlePlayerAction('seek', Math.min(playerState.duration, playerState.currentTime + 5))
          break
        case 'arrowup':
          e.preventDefault()
          handlePlayerAction('volume', Math.min(1, playerState.volume + 0.1))
          break
        case 'arrowdown':
          e.preventDefault()
          handlePlayerAction('volume', Math.max(0, playerState.volume - 0.1))
          break
        default:
          if (/[0-9]/.test(e.key)) {
            e.preventDefault()
            const percent = parseInt(e.key) * 10
            handlePlayerAction('seek', (playerState.duration * percent) / 100)
          }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [playerState.isPlaying, playerState.isMuted, playerState.volume, playerState.currentTime, playerState.duration])

  useEffect(() => {
    const bars = Array.from({ length: 30 }).map(() => Math.random() * 30 + 15)
    setAudioBars(bars)
  }, [])

  const KeyboardShortcuts = () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <div className="absolute top-4 right-4 z-10">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-accent" aria-label="Keyboard shortcuts" title="Keyboard shortcuts" type="button">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>

        {isOpen && (
          <div className="absolute top-12 right-0 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 min-w-[250px] shadow-xl animate-fade-in">
            <h3 className="text-white font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm text-white/80">
              <div className="flex justify-between"><span>Play/Pause:</span><span className="text-accent">Space</span></div>
              <div className="flex justify-between"><span>Previous Track:</span><span className="text-accent">P</span></div>
              <div className="flex justify-between"><span>Next Track:</span><span className="text-accent">N</span></div>
              <div className="flex justify-between"><span>Mute/Unmute:</span><span className="text-accent">M</span></div>
              <div className="flex justify-between"><span>Seek Backward:</span><span className="text-accent">←</span></div>
              <div className="flex justify-between"><span>Seek Forward:</span><span className="text-accent">→</span></div>
              <div className="flex justify-between"><span>Volume Up:</span><span className="text-accent">↑</span></div>
              <div className="flex justify-between"><span>Volume Down:</span><span className="text-accent">↓</span></div>
              <div className="flex justify-between"><span>Jump to 0-90%:</span><span className="text-accent">0-9</span></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="py-12 sm:py-20">
      <style jsx>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      `}</style>
      <Container>
        <KeyboardShortcuts />

        {/* Hidden Audio Element for Web Audio API (single persistent element) */}
        <audio
          ref={audioRef}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setPlayerState(prev => ({ ...prev, isPlaying: true }))}
          onPause={() => setPlayerState(prev => ({ ...prev, isPlaying: false }))}
          onError={handleAudioError}
          onLoadStart={() => setPlayerState(prev => ({ ...prev, isLoading: true }))}
          onCanPlay={() => setPlayerState(prev => ({ ...prev, isLoading: false }))}
          className="hidden"
          crossOrigin="anonymous"
        />

        {/* Render iframe only when embedUrl exists and it's NOT a direct audio file */}
        {currentTrack.isEmbed && currentTrack.embedUrl && !isDirectAudioUrl(currentTrack.embedUrl) && (
          <iframe
            ref={iframeRef}
            src={currentTrack.embedUrl}
            className="w-full h-20 border border-border rounded-lg mb-4"
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin allow-popups"
            title={`Embedded player for ${currentTrack.title}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            loading="lazy"
          />
        )}

        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <p className="text-accent font-semibold tracking-wider uppercase text-xs sm:text-sm mb-3">Audio Library</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">Sermons, Music & <span className="text-accent">Teaching Series</span></h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">Explore our collection of inspiring sermons, worship music, and daily teaching series</p>
        </div>

        {/* Audio Player UI (unchanged visually) */}
        <div className="mb-12 animate-scale-up">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 sm:p-10 text-white shadow-xl">
            <div className="mb-6">
              <p className="text-accent/80 text-sm uppercase tracking-wider font-semibold mb-2">Now Playing</p>
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">{currentTrack.title}</h3>
              <p className="text-white/80">{currentTrack.artist}</p>
            </div>

            {/* Visualization */}
            <div className="mb-6 flex items-end gap-1 h-20 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              {currentTrack.isEmbed && !isDirectAudioUrl(currentTrack.embedUrl || '') ? (
                Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${playerState.isPlaying ? 'bg-accent' : 'bg-white/40'}`} style={{ height: `${playerState.isPlaying ? Math.random() * 60 + 20 : 30}%`, transform: playerState.isPlaying ? 'scaleY(1)' : 'scaleY(0.3)', transformOrigin: 'bottom', animation: playerState.isPlaying ? `pulse ${Math.random() * 0.5 + 0.5}s ease-in-out infinite` : 'none' }} />
                ))
              ) : (
                audioBars.map((height, i) => (
                  <div key={i} className={`flex-1 rounded-full transition-all duration-75 ${playerState.isPlaying ? 'bg-accent animate-pulse' : 'bg-white/40'}`} style={{ height: `${height}%`, transform: playerState.isPlaying ? 'scaleY(1)' : 'scaleY(0.3)', transformOrigin: 'bottom' }} />
                ))
              )}
            </div>

            {/* Progress */}
            <div role="slider" aria-label="Audio progress" aria-valuemin={0} aria-valuemax={playerState.duration || 0} aria-valuenow={playerState.currentTime || 0} aria-valuetext={`${formatTime(playerState.currentTime)} of ${formatTime(playerState.duration)}`} tabIndex={0} onKeyDown={!currentTrack.isEmbed ? handleProgressKeyDown : undefined}>
              <div className={`w-full bg-white/20 rounded-full h-2 mb-3 group ${currentTrack.isEmbed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`} onClick={!currentTrack.isEmbed ? handleProgressClick : undefined}>
                <div className="bg-accent h-full rounded-full transition-all duration-300 group-hover:brightness-110" style={{ width: `${playerState.duration > 0 ? (playerState.currentTime / playerState.duration) * 100 : 0}%` }} />
              </div>
              <div className="flex justify-between text-sm text-white/80"><span aria-label="Current time">{formatTime(playerState.currentTime)}</span><span aria-label="Total duration">{formatTime(playerState.duration)}</span></div>
            </div>

            {/* Error */}
            {playerState.error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 animate-fade-in" role="alert" aria-live="assertive" aria-atomic="true">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-red-200 text-sm" aria-label="Error message">{playerState.error}</p>
                  <button onClick={() => setPlayerState(prev => ({ ...prev, error: null }))} className="text-red-300 hover:text-red-100 text-xs underline mt-1 focus:outline-none focus:ring-2 focus:ring-red-300 rounded" aria-label="Dismiss error message" type="button">Dismiss error</button>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button onClick={handlePrevious} disabled={currentIndex === 0} className="p-3 hover:bg-white/10 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent" aria-label="Previous track (Keyboard: P)" aria-disabled={currentIndex === 0} title="Previous track (Keyboard: P)" type="button"><SkipBack size={24} /></button>

              <button onClick={handlePlayPause} disabled={playerState.isLoading} className="bg-white text-primary rounded-full p-4 sm:p-5 shadow-lg hover:scale-110 transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background" aria-label={playerState.isPlaying ? 'Pause audio (Keyboard: Space)' : 'Play audio (Keyboard: Space)'} title={playerState.isPlaying ? 'Pause audio (Keyboard: Space)' : 'Play audio (Keyboard: Space)'} aria-pressed={playerState.isPlaying} type="button">
                {playerState.isLoading ? <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : playerState.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              <button onClick={handleNext} disabled={currentIndex === audioTracks.length - 1} className="p-3 hover:bg-white/10 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent" aria-label="Next track (Keyboard: N)" aria-disabled={currentIndex === audioTracks.length - 1} title="Next track (Keyboard: N)" type="button"><SkipForward size={24} /></button>

              <div className="ml-auto flex items-center gap-3" role="group" aria-label="Volume controls">
                <button onClick={() => handlePlayerAction('volume', playerState.isMuted ? playerState.volume : 0)} className="p-2 hover:bg-white/10 rounded-full transition-all" aria-label={playerState.isMuted ? 'Unmute audio' : 'Mute audio'} aria-pressed={playerState.isMuted}><Volume2 size={20} /></button>
                <div className="w-24 h-1 bg-white/20 rounded-full cursor-pointer" role="slider" aria-label={`Volume: ${Math.round(playerState.volume * 100)}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(playerState.volume * 100)} aria-orientation="horizontal" tabIndex={0} onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const percent = (e.clientX - rect.left) / rect.width; handlePlayerAction('volume', percent) }} onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); handlePlayerAction('volume', Math.max(0, playerState.volume - 0.1)) } else if (e.key === 'ArrowRight') { e.preventDefault(); handlePlayerAction('volume', Math.min(1, playerState.volume + 0.1)) } }}>
                  <div className="bg-accent h-full rounded-full transition-all duration-300" style={{ width: `${playerState.volume * 100}%` }} />
                </div>

                <div className="flex items-center gap-2 ml-4" role="group" aria-label="Playback speed controls">
                  <span className="text-xs text-white/70">Speed:</span>
                  <select value={playerState.playbackRate} onChange={(e) => handlePlayerAction('rate', parseFloat(e.target.value))} className="bg-white/10 text-white text-xs px-2 py-1 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent" aria-label={`Playback speed: ${playerState.playbackRate}x`}>
                    <option value={0.5} aria-label="Half speed">0.5x</option>
                    <option value={0.75} aria-label="Three quarters speed">0.75x</option>
                    <option value={1} aria-label="Normal speed">1x</option>
                    <option value={1.25} aria-label="One and a quarter speed">1.25x</option>
                    <option value={1.5} aria-label="One and a half speed">1.5x</option>
                    <option value={2} aria-label="Double speed">2x</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-sm text-white/70 border-t border-white/10 pt-4">
              <span>{currentTrack.category}</span>
              <span>{currentTrack.date}</span>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3 animate-fade-in" role="tablist" aria-label="Audio categories">
          {["all", "sermon", "worship-music", "teaching-series"].map((category) => (
            <button key={category} onClick={() => setActiveTab(category)} className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base ${activeTab === category ? "bg-accent text-accent-foreground shadow-lg" : "bg-muted text-foreground hover:bg-muted/80"}`} role="tab" aria-selected={activeTab === category} aria-label={`Filter by ${category.replace("-", " ")} category`} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab(category) } }}>{category === "all" ? "All" : category.replace("-", " ").toUpperCase()}</button>
          ))}
        </div>

        <div className="space-y-3 animate-slide-in-left">
          {filteredTracks.map((track) => (
            <button key={track.id} onClick={() => handleTrackSelect(track)} className={`group w-full p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer hover-lift text-left ${ currentTrack.id === track.id ? "border-accent bg-accent/10" : "border-border hover:border-accent/50 bg-card hover:bg-muted" }`} aria-label={`Play ${track.title} by ${track.artist}`} aria-pressed={currentTrack.id === track.id} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTrackSelect(track) } }} data-track-id={track.id}>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {currentTrack.id === track.id && playerState.isLoading ? (
                    <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div></div>
                  ) : currentTrack.id === track.id && playerState.isPlaying ? (
                    <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center"><Pause size={20} /></div>
                  ) : (
                    <div className="w-12 h-12 bg-accent/20 text-accent rounded-full flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-all"><Play size={20} className="ml-1" /></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{track.title}{currentTrack.id === track.id && <span className="sr-only"> - Currently playing</span>}</h3>
                  <p className="text-sm text-foreground/60">{track.artist}</p>
                  <div className="flex items-center gap-2 text-xs text-foreground/60 mt-1">
                    <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-full" aria-label={`Category: ${track.category}`}>{track.category}</span>
                    <span aria-label={`Duration: ${track.duration}`}>{track.duration}</span>
                    <span>•</span>
                    <span aria-label={`Date: ${track.date}`}>{track.date}</span>
                    {track.isEmbed && <><span>•</span><span className="px-2 py-1 bg-yellow text-blue-800 rounded-full" aria-label="Embedded content"></span></>}
                  </div>

                  {currentTrack.id === track.id && playerState.isLoading && <div className="mt-2 flex items-center gap-2 text-accent text-sm" aria-label="Loading audio"><div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" /><span>Loading...</span></div>}
                  {currentTrack.id === track.id && playerState.isPlaying && !playerState.isLoading && <div className="mt-2 flex items-center gap-2 text-accent text-sm" aria-label="Now playing"><div className="w-2 h-2 bg-accent rounded-full animate-pulse" /><span>Now playing</span></div>}
                </div>

                <div className="flex items-center gap-2">
                  {currentTrack.id === track.id && <div className="flex items-center gap-2">{playerState.isPlaying && <div className="flex items-center gap-1"><div className="w-1 h-3 bg-accent rounded-full animate-pulse" /><div className="w-1 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} /><div className="w-1 h-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} /></div>}{playerState.isLoading && <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />}</div>}
                  <Music className="w-4 h-4 text-foreground/60 group-hover:text-accent transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>

      </Container>
    </section>
  )
}