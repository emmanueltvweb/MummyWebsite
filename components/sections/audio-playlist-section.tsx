"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  Loader2,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RotateCcw,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react"

import { Container } from "@/components/layout/container"
import { Reveal } from "@/components/ui/reveal"
import type { SermonAudioTrack } from "@/lib/content/page-types"
import { cn } from "@/lib/utils"

/* ============================================================================
   Audio library player for the Sermon page. Tracks are managed in
   Admin → Pages → Sermon → Audio playlist.
   ========================================================================== */

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]
const BAR_COUNT = 64
const SKIP_SECONDS = 15
const PREFS_KEY = "sermon-player:prefs"

type RepeatMode = "off" | "all" | "one"

function formatTime(seconds: number) {
  const s = Number.isFinite(seconds) && seconds > 0 ? seconds : 0
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`
}

function readPrefs(): { volume: number; muted: boolean; rate: number } {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}")
    return {
      volume: typeof parsed.volume === "number" ? Math.min(1, Math.max(0, parsed.volume)) : 0.85,
      muted: Boolean(parsed.muted),
      rate: SPEEDS.includes(parsed.rate) ? parsed.rate : 1,
    }
  } catch {
    return { volume: 0.85, muted: false, rate: 1 }
  }
}

/* ------------------------------------------------------------------ Web Audio graph */

interface AudioGraph {
  ctx: AudioContext
  analyser: AnalyserNode
  gain: GainNode
}

/**
 * Routes the <audio> element through an analyser (for the live waves) and a gain node (volume).
 * Created on the first play, because browsers only allow audio contexts after a user gesture.
 */
function useAudioGraph(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const graphRef = useRef<AudioGraph | null>(null)
  const unavailable = useRef(false)
  const [ready, setReady] = useState(false)

  const ensure = useCallback(() => {
    const audio = audioRef.current
    if (graphRef.current || unavailable.current || !audio) return graphRef.current
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) throw new Error("Web Audio not supported")
      const ctx = new Ctx()
      const source = ctx.createMediaElementSource(audio)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.72
      const gain = ctx.createGain()
      // Analyse before the volume, so the waves keep moving even when the volume is low.
      source.connect(analyser)
      analyser.connect(gain)
      gain.connect(ctx.destination)
      graphRef.current = { ctx, analyser, gain }
      setReady(true)
    } catch {
      unavailable.current = true
    }
    return graphRef.current
  }, [audioRef])

  /** Call when a track can't be used with the analyser (no CORS): never build the graph. */
  const disable = useCallback(() => {
    if (!graphRef.current) unavailable.current = true
  }, [])

  useEffect(
    () => () => {
      graphRef.current?.ctx.close().catch(() => {})
    },
    []
  )

  return { graphRef, ready, ensure, disable }
}

/* ------------------------------------------------------------------ Visualizer */

/** Mirrored frequency bars drawn on a canvas; bass in the middle, treble at the edges. */
function Visualizer({
  analyser,
  playing,
  progress,
  pulseRef,
}: {
  analyser: AnalyserNode | null
  playing: boolean
  progress: number
  pulseRef: React.RefObject<HTMLDivElement | null>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const state = useRef({ analyser, playing, progress })
  state.current = { analyser, playing, progress }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const levels = new Float32Array(BAR_COUNT)
    let data = new Uint8Array(256)
    let frame = 0
    let width = 0
    let height = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const accent = getComputedStyle(canvas).getPropertyValue("--player-accent").trim() || "#f5a524"

    const draw = (time: number) => {
      const { analyser, playing, progress } = state.current
      const half = BAR_COUNT / 2
      let bass = 0

      if (analyser && playing) {
        if (data.length !== analyser.frequencyBinCount) data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        // Voices and music live mostly in the lower ~40% of the spectrum.
        const usable = Math.floor(data.length * 0.42)
        for (let i = 0; i < half; i++) {
          // Logarithmic spread: more bars for the low/mid range where speech is.
          const start = Math.floor(Math.pow(i / half, 1.7) * usable)
          const end = Math.max(start + 1, Math.floor(Math.pow((i + 1) / half, 1.7) * usable))
          let sum = 0
          for (let b = start; b < end; b++) sum += data[b]
          const v = Math.pow(sum / (end - start) / 255, 1.35)
          const target = Math.min(1, v * 1.15)
          const left = half - 1 - i
          const right = half + i
          for (const idx of [left, right]) {
            levels[idx] += (target - levels[idx]) * (target > levels[idx] ? 0.55 : 0.18)
          }
        }
        for (let b = 0; b < 6; b++) bass += data[b]
        bass = bass / 6 / 255
      } else {
        // Idle: a calm breathing wave (or a lively one if audio plays without the analyser).
        for (let i = 0; i < BAR_COUNT; i++) {
          const d = Math.abs(i - BAR_COUNT / 2 + 0.5) / (BAR_COUNT / 2)
          const t = reduceMotion ? 0 : time / 1000
          const target = playing
            ? 0.18 + 0.32 * (1 - d) * (0.6 + 0.4 * Math.sin(t * 6 + i * 0.7)) * (0.7 + 0.3 * Math.sin(t * 2.3 + i))
            : 0.05 + 0.04 * (1 - d) * (1 + Math.sin(t * 1.6 + i * 0.35))
          levels[i] += (target - levels[i]) * 0.08
        }
      }

      if (pulseRef.current) {
        pulseRef.current.style.setProperty("--pulse", String(playing ? Math.min(1, bass * 1.4) : 0))
      }

      ctx.clearRect(0, 0, width, height)
      const slot = width / BAR_COUNT
      const barWidth = Math.max(2, slot * 0.56)
      const mid = height / 2
      const playedUpTo = progress * BAR_COUNT

      for (let i = 0; i < BAR_COUNT; i++) {
        const h = Math.max(3, levels[i] * (height - 6))
        const x = i * slot + (slot - barWidth) / 2
        const played = i < playedUpTo
        ctx.globalAlpha = played ? 1 : 0.38
        ctx.fillStyle = played ? accent : "#ffffff"
        ctx.shadowColor = accent
        ctx.shadowBlur = played && playing ? 10 : 0
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(x, mid - h / 2, barWidth, h, barWidth / 2)
        else ctx.rect(x, mid - h / 2, barWidth, h)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [pulseRef])

  return <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
}

/* ------------------------------------------------------------------ Range slider */

function Slider({
  value,
  max,
  buffered,
  onChange,
  onCommit,
  label,
  valueText,
  className,
  step = 0.01,
}: {
  value: number
  max: number
  buffered?: number
  onChange: (value: number) => void
  onCommit?: (value: number) => void
  label: string
  valueText?: string
  className?: string
  step?: number
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const bufferedPct = max > 0 && buffered ? Math.min(100, (buffered / max) * 100) : 0
  return (
    <div className={cn("group/slider relative flex h-5 items-center", className)}>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/15 transition-[height] group-hover/slider:h-2">
        {bufferedPct > 0 && <div className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: `${bufferedPct}%` }} />}
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--player-accent)] to-amber-300" style={{ width: `${pct}%` }} />
      </div>
      <div
        className="pointer-events-none absolute size-3.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgba(245,165,36,0.35)] opacity-0 transition-opacity group-hover/slider:opacity-100 group-focus-within/slider:opacity-100"
        style={{ left: `${pct}%` }}
      />
      <input
        type="range"
        min={0}
        max={max || 0}
        step={step}
        value={Math.min(value, max || 0)}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={(e) => onCommit?.(Number((e.target as HTMLInputElement).value))}
        onKeyUp={(e) => onCommit?.(Number((e.target as HTMLInputElement).value))}
        aria-label={label}
        aria-valuetext={valueText}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ Player */

export function AudioPlaylistSection({ tracks }: { tracks: SermonAudioTrack[] }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const pulseRef = useRef<HTMLDivElement>(null)
  const { graphRef, ready: graphReady, ensure: ensureGraph, disable: disableGraph } = useAudioGraph(audioRef)

  const [currentId, setCurrentId] = useState(tracks[0]?.id)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [scrubbing, setScrubbing] = useState<number | null>(null)
  const [volume, setVolume] = useState(0.85)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<RepeatMode>("off")
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState("All")
  const [durations, setDurations] = useState<Record<number, string>>({})

  const playOnLoad = useRef(false)
  const corsRetried = useRef<Set<number>>(new Set())
  const [corsMode, setCorsMode] = useState(true)

  const index = Math.max(0, tracks.findIndex((t) => t.id === currentId))
  const track = tracks[index]
  const categories = useMemo(() => ["All", ...Array.from(new Set(tracks.map((t) => t.category).filter(Boolean)))], [tracks])
  const visible = category === "All" ? tracks : tracks.filter((t) => t.category === category)

  // Preferences (volume, mute, speed) are remembered per browser.
  useEffect(() => {
    const prefs = readPrefs()
    setVolume(prefs.volume)
    setMuted(prefs.muted)
    setRate(prefs.rate)
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ volume, muted, rate }))
    } catch {
      // Storage unavailable (private mode): preferences just won't be remembered.
    }
  }, [volume, muted, rate])

  // Volume: through the gain node when the analyser graph is active, otherwise on the element.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const level = muted ? 0 : volume
    const graph = graphRef.current
    if (graph) {
      audio.volume = 1
      graph.gain.gain.setTargetAtTime(level * level, graph.ctx.currentTime, 0.02) // perceptual curve
    } else {
      audio.volume = level * level
    }
  }, [volume, muted, graphReady, graphRef])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate
  }, [rate, currentId])

  /* ------------ loading / playing */

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !track) return
    setError(null)
    if (corsMode) {
      const graph = ensureGraph()
      if (graph?.ctx.state === "suspended") await graph.ctx.resume().catch(() => {})
    }
    try {
      await audio.play()
    } catch (err) {
      if ((err as DOMException)?.name === "NotAllowedError") setError("Your browser blocked playback. Press play to start.")
      else if ((err as DOMException)?.name !== "AbortError") setError("This audio couldn't be played. Please try again.")
    }
  }, [corsMode, ensureGraph, track])

  const pause = useCallback(() => audioRef.current?.pause(), [])
  const toggle = useCallback(() => (audioRef.current?.paused ? play() : pause()), [play, pause])

  // Load the selected track.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    setCurrentTime(0)
    setDuration(0)
    setBuffered(0)
    setError(null)
    audio.src = track.audioUrl
    audio.load()
    if (playOnLoad.current) void play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, track?.audioUrl, corsMode])

  /** Clicking a playlist row: switch track, or play/pause if it's already the current one. */
  const select = useCallback(
    (id: number) => {
      if (id === currentId) return void toggle()
      playOnLoad.current = true
      setCurrentId(id)
    },
    [currentId, toggle]
  )

  /** Next / previous / auto-advance: always plays the target (restarting it if it's the same track). */
  const goTo = useCallback(
    (id: number) => {
      if (id === currentId) {
        if (audioRef.current) audioRef.current.currentTime = 0
        return void play()
      }
      playOnLoad.current = true
      setCurrentId(id)
    },
    [currentId, play]
  )

  const step = useCallback(
    (direction: 1 | -1, auto = false) => {
      if (!tracks.length) return
      if (shuffle && tracks.length > 1) {
        let next = index
        while (next === index) next = Math.floor(Math.random() * tracks.length)
        goTo(tracks[next].id)
        return
      }
      const nextIndex = index + direction
      if (nextIndex >= tracks.length) {
        if (auto && repeat === "off") {
          // End of the playlist: stop and rewind.
          playOnLoad.current = false
          setPlaying(false)
          if (audioRef.current) audioRef.current.currentTime = 0
          return
        }
        goTo(tracks[0].id)
      } else if (nextIndex < 0) {
        goTo(tracks[tracks.length - 1].id)
      } else {
        goTo(tracks[nextIndex].id)
      }
    },
    [index, repeat, goTo, shuffle, tracks]
  )

  const previous = useCallback(() => {
    const audio = audioRef.current
    // Like most players: "previous" restarts the track unless you're at the very beginning.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    step(-1)
  }, [step])

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return
    audio.currentTime = Math.min(Math.max(0, time), audio.duration)
    setCurrentTime(audio.currentTime)
  }, [])
  const skip = useCallback((seconds: number) => seekTo((audioRef.current?.currentTime ?? 0) + seconds), [seekTo])

  /* ------------ element events */

  const onError = () => {
    const audio = audioRef.current
    if (!audio || !track) return
    // A host without CORS headers can't feed the analyser; retry once in plain mode if possible.
    if (corsMode && !graphRef.current && !corsRetried.current.has(track.id)) {
      corsRetried.current.add(track.id)
      disableGraph()
      setCorsMode(false)
      return
    }
    setPlaying(false)
    setBuffering(false)
    setError(
      graphRef.current && !corsMode
        ? "This audio file's host doesn't allow it to be played here. Upload it to the Media Library instead."
        : "This audio couldn't be loaded. Check your connection and try again."
    )
  }

  const onLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio || !track) return
    setDuration(audio.duration)
    audio.playbackRate = rate
    if (Number.isFinite(audio.duration)) setDurations((d) => ({ ...d, [track.id]: formatTime(audio.duration) }))
  }

  const onProgress = () => {
    const audio = audioRef.current
    if (!audio || !audio.buffered.length) return
    setBuffered(audio.buffered.end(audio.buffered.length - 1))
  }

  const onPlay = () => {
    setPlaying(true)
    playOnLoad.current = true
    // Only one thing plays at a time on the page.
    document.querySelectorAll("audio, video").forEach((el) => {
      if (el !== audioRef.current) (el as HTMLMediaElement).pause()
    })
  }

  const onEnded = () => {
    if (repeat === "one") {
      seekTo(0)
      void play()
    } else step(1, true)
  }

  /* ------------ media session (lock screen / headphone controls) */

  useEffect(() => {
    if (!("mediaSession" in navigator) || !track) return
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist, album: track.category || "Sermons" })
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => void play()],
      ["pause", () => pause()],
      ["previoustrack", () => previous()],
      ["nexttrack", () => step(1)],
      ["seekbackward", () => skip(-SKIP_SECONDS)],
      ["seekforward", () => skip(SKIP_SECONDS)],
      ["seekto", (d) => d.seekTime !== undefined && seekTo(d.seekTime)],
    ]
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // Unsupported action in this browser.
      }
    }
  }, [track, play, pause, previous, step, skip, seekTo])

  useEffect(() => {
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = playing ? "playing" : "paused"
  }, [playing])

  /* ------------ keyboard shortcuts (while the player has focus) */

  const onKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement
    const typing = target.tagName === "SELECT" || (target.tagName === "INPUT" && (target as HTMLInputElement).type !== "range")
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return
    const key = e.key.toLowerCase()
    const onRange = target.tagName === "INPUT"
    if ((key === " " && target.tagName !== "BUTTON") || key === "k") {
      e.preventDefault()
      void toggle()
    } else if (key === "j" || (key === "arrowleft" && !onRange)) {
      e.preventDefault()
      skip(-SKIP_SECONDS)
    } else if (key === "l" || (key === "arrowright" && !onRange)) {
      e.preventDefault()
      skip(SKIP_SECONDS)
    } else if (key === "m") {
      setMuted((m) => !m)
    } else if (key === "n") {
      step(1)
    } else if (key === "p") {
      previous()
    }
  }

  if (!track) return null

  const shownTime = scrubbing ?? currentTime
  const totalTime = duration || 0
  const progress = totalTime ? shownTime / totalTime : 0
  const effectiveVolume = muted ? 0 : volume
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2

  return (
    <section className="py-12 sm:py-20">
      <Container>
        <div className="mb-10 text-center">
          <Reveal as="p" variant="fade" className="mb-3 text-xs font-semibold tracking-wider text-accent uppercase sm:text-sm">Audio Library</Reveal>
          <Reveal as="h2" variant="up" delay={100} className="mb-4 text-3xl font-bold text-primary sm:text-4xl lg:text-5xl">
            Sermons, Music & <span className="text-accent">Teaching Series</span>
          </Reveal>
          <Reveal as="p" variant="up" delay={200} className="mx-auto max-w-2xl text-foreground/70">
            Explore our collection of inspiring sermons, worship music, and daily teaching series
          </Reveal>
        </div>

        {/* ---------------- Player card ---------------- */}
        <Reveal variant="zoom">
        {/* Keyboard shortcuts are delegated from the player's own buttons/sliders while they have focus. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          className="relative mb-10 overflow-clip rounded-[28px] bg-[#101a3d] text-white shadow-2xl ring-1 ring-white/10 [--player-accent:#f5a524]"
          onKeyDown={onKeyDown}
          role="region"
          aria-label="Audio player"
        >
          {/* ambient background */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -top-32 -left-24 size-96 rounded-full bg-[var(--player-accent)]/20 blur-3xl" />
            <div className="absolute -right-24 -bottom-40 size-[28rem] rounded-full bg-indigo-500/25 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent" />
          </div>

          {/* Sermon audio has no caption files; titles are shown in the player. */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio
            ref={audioRef}
            preload="metadata"
            crossOrigin={corsMode ? "anonymous" : undefined}
            onPlay={onPlay}
            onPause={() => setPlaying(false)}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onCanPlay={() => setBuffering(false)}
            onTimeUpdate={() => scrubbing === null && setCurrentTime(audioRef.current?.currentTime ?? 0)}
            onLoadedMetadata={onLoadedMetadata}
            onDurationChange={onLoadedMetadata}
            onProgress={onProgress}
            onEnded={onEnded}
            onError={onError}
            className="hidden"
          />

          <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:gap-8 lg:p-10">
            {/* Artwork: a slowly spinning disc that pulses with the bass */}
            <div className="flex justify-center md:block">
              <div
                ref={pulseRef}
                className="relative size-36 sm:size-44"
                style={{ transform: "scale(calc(1 + var(--pulse, 0) * 0.06))", transition: "transform 80ms linear" }}
              >
                <div
                  className="absolute inset-0 rounded-full bg-[var(--player-accent)]/40 blur-2xl transition-opacity duration-300"
                  style={{ opacity: "calc(0.25 + var(--pulse, 0) * 0.75)" }}
                  aria-hidden
                />
                <div
                  className={cn(
                    "relative flex size-full items-center justify-center rounded-full bg-[repeating-radial-gradient(circle_at_center,#1b2652_0px,#1b2652_2px,#141d42_3px,#141d42_5px)] shadow-2xl ring-4 ring-white/10 motion-safe:animate-[spin_9s_linear_infinite]",
                    !playing && "[animation-play-state:paused]"
                  )}
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--player-accent)] to-amber-600 text-sm font-bold text-[#101a3d] shadow-lg sm:size-16">
                    Pst.
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--player-accent)]/15 px-3 py-1 text-xs font-semibold tracking-wider text-[var(--player-accent)] uppercase">
                  {playing ? (
                    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-[3px] rounded-full bg-current motion-safe:animate-[eqbar_0.9s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.15}s`, height: "100%" }} />
                      ))}
                    </span>
                  ) : (
                    <Music2 className="size-3" aria-hidden />
                  )}
                  {playing ? "Now playing" : "Ready to play"}
                </span>
                {track.category && <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{track.category}</span>}
                {track.date && <span className="text-xs text-white/50">{track.date}</span>}
              </div>
              <h3 className="mt-3 line-clamp-2 text-2xl leading-tight font-bold sm:text-3xl" aria-live="polite">
                {track.title}
              </h3>
              <p className="mt-1 text-white/70">{track.artist}</p>

              {/* Waves */}
              <div className="relative mt-5 h-20 sm:h-24">
                <Visualizer analyser={graphRef.current?.analyser ?? null} playing={playing && !buffering} progress={progress} pulseRef={pulseRef} />
                {buffering && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs text-white/90 backdrop-blur">
                      <Loader2 className="size-3.5 animate-spin" /> Loading…
                    </span>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="mt-3">
                <Slider
                  value={shownTime}
                  max={totalTime}
                  buffered={buffered}
                  step={0.1}
                  label="Seek"
                  valueText={`${formatTime(shownTime)} of ${formatTime(totalTime)}`}
                  onChange={(v) => setScrubbing(v)}
                  onCommit={(v) => {
                    seekTo(v)
                    setScrubbing(null)
                  }}
                />
                <div className="mt-1 flex justify-between text-xs text-white/60 tabular-nums">
                  <span>{formatTime(shownTime)}</span>
                  <span>{totalTime ? `-${formatTime(totalTime - shownTime)}` : durations[track.id] ?? track.duration}</span>
                </div>
              </div>

              {error && (
                <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/15 p-3 text-sm text-red-100">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" aria-hidden />
                  <p className="flex-1">{error}</p>
                  <button type="button" className="font-semibold underline underline-offset-2" onClick={() => void play()}>
                    Try again
                  </button>
                </div>
              )}

              {/* Controls */}
              <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center justify-center gap-1 sm:gap-2 lg:justify-start">
                  <IconButton label={shuffle ? "Shuffle on" : "Shuffle off"} active={shuffle} onClick={() => setShuffle((s) => !s)}>
                    <Shuffle className="size-4" />
                  </IconButton>
                  <IconButton label="Previous (P)" onClick={previous}>
                    <SkipBack className="size-5" />
                  </IconButton>
                  <IconButton label={`Back ${SKIP_SECONDS} seconds (J)`} onClick={() => skip(-SKIP_SECONDS)} className="relative">
                    <RotateCcw className="size-5" />
                    <span className="absolute text-[8px] font-bold">{SKIP_SECONDS}</span>
                  </IconButton>
                  <button
                    type="button"
                    onClick={() => void toggle()}
                    aria-label={playing ? "Pause (Space)" : "Play (Space)"}
                    className="mx-1 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--player-accent)] to-amber-500 text-[#101a3d] shadow-[0_10px_30px_-5px_rgba(245,165,36,0.6)] transition hover:scale-105 active:scale-95 focus-visible:ring-4 focus-visible:ring-white/40 focus-visible:outline-none sm:size-[72px]"
                  >
                    {buffering && playing ? <Loader2 className="size-7 animate-spin" /> : playing ? <Pause className="size-7 fill-current" /> : <Play className="ml-1 size-7 fill-current" />}
                  </button>
                  <IconButton label={`Forward ${SKIP_SECONDS} seconds (L)`} onClick={() => skip(SKIP_SECONDS)} className="relative">
                    <RotateCw className="size-5" />
                    <span className="absolute text-[8px] font-bold">{SKIP_SECONDS}</span>
                  </IconButton>
                  <IconButton label="Next (N)" onClick={() => step(1)}>
                    <SkipForward className="size-5" />
                  </IconButton>
                  <IconButton
                    label={repeat === "off" ? "Repeat off" : repeat === "all" ? "Repeat all" : "Repeat this track"}
                    active={repeat !== "off"}
                    onClick={() => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"))}
                  >
                    {repeat === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
                  </IconButton>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 lg:justify-end">
                  <div className="flex items-center gap-2">
                    <IconButton label={muted || volume === 0 ? "Unmute (M)" : "Mute (M)"} onClick={() => (volume === 0 ? (setVolume(0.6), setMuted(false)) : setMuted((m) => !m))}>
                      <VolumeIcon className="size-5" />
                    </IconButton>
                    <Slider
                      className="w-24 sm:w-28"
                      value={effectiveVolume}
                      max={1}
                      label="Volume"
                      valueText={`${Math.round(effectiveVolume * 100)}%`}
                      onChange={(v) => {
                        setVolume(v)
                        setMuted(v === 0)
                      }}
                    />
                    <span className="w-8 text-right text-xs text-white/60 tabular-nums">{Math.round(effectiveVolume * 100)}</span>
                  </div>
                  <label className="flex items-center gap-1.5 rounded-full bg-white/10 py-1 pr-1 pl-3 text-xs text-white/70">
                    Speed
                    <select
                      value={rate}
                      onChange={(e) => setRate(Number(e.target.value))}
                      className="cursor-pointer rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white focus-visible:ring-2 focus-visible:ring-[var(--player-accent)] focus-visible:outline-none"
                      aria-label="Playback speed"
                    >
                      {SPEEDS.map((s) => (
                        <option key={s} value={s} className="text-black">
                          {s}x
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        </Reveal>

        {/* ---------------- Playlist ---------------- */}
        <Reveal variant="up">
        {categories.length > 2 && (
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  category === c ? "bg-accent text-accent-foreground shadow-md" : "bg-muted text-foreground/70 hover:bg-accent/20"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <ol className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {visible.map((t, i) => {
            const isCurrent = t.id === track.id
            return (
              <li key={t.id} className={cn("border-b border-border last:border-b-0", isCurrent && "bg-accent/10")}>
                <button
                  type="button"
                  onClick={() => select(t.id)}
                  aria-current={isCurrent ? "true" : undefined}
                  aria-label={`${isCurrent && playing ? "Pause" : "Play"} ${t.title} by ${t.artist}`}
                  className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-muted/60 sm:px-5"
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full transition",
                      isCurrent ? "bg-accent text-accent-foreground shadow-md" : "bg-primary/5 text-primary group-hover:bg-accent group-hover:text-accent-foreground"
                    )}
                  >
                    {isCurrent && playing ? (
                      <span className="flex h-4 items-end gap-[3px] group-hover:hidden" aria-hidden>
                        {[0, 1, 2, 3].map((b) => (
                          <span key={b} className="w-[3px] rounded-full bg-current motion-safe:animate-[eqbar_0.9s_ease-in-out_infinite]" style={{ animationDelay: `${b * 0.12}s`, height: "100%" }} />
                        ))}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold tabular-nums group-hover:hidden">{i + 1}</span>
                    )}
                    {isCurrent && playing ? <Pause className="hidden size-4 fill-current group-hover:block" /> : <Play className="ml-0.5 hidden size-4 fill-current group-hover:block" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate font-semibold", isCurrent ? "text-primary" : "text-foreground")}>{t.title}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-foreground/60">
                      <span>{t.artist}</span>
                      {t.category && (
                        <>
                          <span aria-hidden>•</span>
                          <span>{t.category}</span>
                        </>
                      )}
                      {t.date && (
                        <>
                          <span aria-hidden>•</span>
                          <span>{t.date}</span>
                        </>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-foreground/60 tabular-nums">{durations[t.id] ?? t.duration}</span>
                </button>
              </li>
            )
          })}
        </ol>
        </Reveal>
        <p className="mt-3 text-center text-xs text-foreground/50">
          Tip: click the player, then use Space to play/pause, J / L to skip 15s, N / P for next / previous and M to mute.
        </p>
      </Container>
    </section>
  )
}

function IconButton({
  label,
  onClick,
  active,
  className,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "flex size-10 items-center justify-center rounded-full transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[var(--player-accent)] focus-visible:outline-none sm:size-11",
        active ? "text-[var(--player-accent)]" : "text-white/80 hover:text-white",
        className
      )}
    >
      {children}
    </button>
  )
}
