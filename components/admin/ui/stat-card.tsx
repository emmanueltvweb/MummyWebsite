"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ArrowDownRight, ArrowUpRight, type LucideIcon, Minus } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Tone } from "./primitives"

/** Counts up from 0 (or the previous value) to `value` with an ease-out curve. */
export function AnimatedNumber({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("admin-reduced-motion")
    if (reduce) {
      setDisplay(value)
      from.current = value
      return
    }
    const start = performance.now()
    const initial = from.current
    const duration = 900
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(initial + (value - initial) * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
      else from.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <span className="tabular-nums">
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}

export function Sparkline({ data, className, color = "var(--admin-brand)" }: { data: number[]; className?: string; color?: string }) {
  const id = useId()
  if (data.length < 2 || data.every((v) => v === 0)) return null
  const w = 100
  const h = 32
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => [(i / (data.length - 1)) * w, h - (v / max) * (h - 4) - 2] as const)
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-8 w-24", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const ICON_TONE: Record<Tone, string> = {
  neutral: "bg-admin-subtle text-admin-muted",
  brand: "bg-admin-brand-soft text-admin-brand",
  gold: "bg-admin-gold-soft text-admin-gold-strong",
  success: "bg-admin-success-soft text-admin-success",
  warning: "bg-admin-warning-soft text-admin-gold-strong",
  danger: "bg-admin-danger-soft text-admin-danger",
  sky: "bg-admin-sky-soft text-admin-sky",
}

export function TrendPill({ change, invert = false, onColor = false }: { change: number; invert?: boolean; onColor?: boolean }) {
  const up = change > 0
  const flat = change === 0
  const good = invert ? !up : up
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        onColor
          ? "bg-white/20 text-white backdrop-blur-sm"
          : flat
            ? "bg-admin-subtle text-admin-muted"
            : good
              ? "bg-admin-success-soft text-admin-success"
              : "bg-admin-danger-soft text-admin-danger"
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 1 })}%
      <span className="sr-only">{flat ? "no change" : up ? "increase" : "decrease"} vs previous 30 days</span>
    </span>
  )
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  trend,
  spark,
  suffix,
  decimals,
  hint,
  delay = 0,
  size = "lg",
  kpi,
}: {
  size?: "lg" | "sm"
  /** Renders a coloured gradient KPI card instead of a white card. */
  kpi?: "green" | "teal" | "blue" | "ocean"
  label: string
  value: number | null
  icon: LucideIcon
  tone?: Tone
  trend?: number
  spark?: number[]
  suffix?: string
  decimals?: number
  hint?: string
  delay?: number
}) {
  if (size === "sm") {
    return (
      <div
        className="group admin-rise admin-card flex items-center gap-3.5 rounded-2xl bg-admin-surface p-4 transition duration-300 hover:-translate-y-0.5"
        style={{ animationDelay: `${delay}ms` }}
      >
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", ICON_TONE[tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-admin-muted">{label}</p>
          <p className="text-lg font-bold tracking-tight text-admin-text">
            {value === null ? "—" : <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />}
          </p>
        </div>
        {trend !== undefined ? <TrendPill change={trend} /> : hint ? <span className="text-xs text-admin-muted">{hint}</span> : null}
      </div>
    )
  }

  if (kpi) {
    return (
      <div
        className={cn("group admin-rise admin-kpi relative overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-1", `admin-kpi-${kpi}`)}
        style={{ animationDelay: `${delay}ms` }}
      >
        <span className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-white/10 blur-xl" aria-hidden />
        <div className="relative flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-white/90">{label}</p>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white transition-transform duration-300 group-hover:scale-110">
            <Icon className="size-[18px]" aria-hidden />
          </span>
        </div>
        <div className="relative mt-1 flex items-end justify-between gap-3">
          <p className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
            {value === null ? "—" : <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />}
          </p>
          {trend !== undefined && <TrendPill change={trend} onColor />}
        </div>
        <div className="relative mt-3 h-12">
          {spark && spark.some((v) => v > 0) ? (
            <Sparkline data={spark} color="rgba(255,255,255,0.95)" className="h-12 w-full" />
          ) : (
            <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-12 w-full opacity-60" aria-hidden>
              <path d="M0,24 C20,8 35,8 50,18 S80,30 100,10" fill="none" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
            </svg>
          )}
        </div>
        {hint && <p className="relative mt-2 text-xs font-medium text-white/85">{hint}</p>}
      </div>
    )
  }

  return (
    <div
      className="group admin-rise admin-card relative overflow-hidden rounded-3xl bg-admin-surface p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-admin-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex size-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", ICON_TONE[tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
        {spark && <Sparkline data={spark} />}
      </div>
      <p className="mt-4 text-sm font-medium text-admin-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-admin-text sm:text-[1.7rem]">
        {value === null ? "—" : <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />}
      </p>
      <div className="mt-3 flex min-h-6 items-center gap-2 text-xs text-admin-muted">
        {trend !== undefined && <TrendPill change={trend} />}
        {hint && <span>{hint}</span>}
      </div>
    </div>
  )
}
