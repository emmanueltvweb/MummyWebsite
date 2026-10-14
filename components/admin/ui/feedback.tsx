"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { AlertTriangle, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { errorMessage } from "@/lib/admin/api-client"
import { cn } from "@/lib/utils"

/* ============================================================================
   Tiny global store for save feedback: a blocking "saving" preloader and a
   success / error result modal. Usable from anywhere (no provider needed).
   ========================================================================== */

interface ResultAction {
  label: string
  href?: string
  external?: boolean
  onClick?: () => void
}

interface Result {
  id: number
  kind: "success" | "error"
  title: string
  description?: string
  actions?: ResultAction[]
  celebrate?: boolean
  autoCloseMs?: number
}

interface State {
  saving: string | null
  result: Result | null
}

let state: State = { saving: null, result: null }
const listeners = new Set<() => void>()
const emit = (next: Partial<State>) => {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
let savingDepth = 0
let resultId = 0
let savingSince = 0
let pendingResult: Result | null = null
/** Keep the preloader up long enough to be seen, even when the server answers instantly. */
const MIN_PRELOADER_MS = 700

function showResult(result: Result) {
  // Never show the result modal underneath the saving preloader — wait for it to finish.
  if (state.saving) pendingResult = result
  else emit({ result })
}

export const feedback = {
  /** Shows the full-screen saving preloader until the returned function is called. */
  saving(label = "Saving changes…") {
    if (!savingDepth) savingSince = Date.now()
    savingDepth++
    emit({ saving: label })
    let done = false
    return () => {
      if (done) return
      done = true
      const wait = Math.max(0, MIN_PRELOADER_MS - (Date.now() - savingSince))
      setTimeout(() => {
        savingDepth = Math.max(0, savingDepth - 1)
        if (savingDepth) return
        const result = pendingResult
        pendingResult = null
        emit({ saving: null, ...(result ? { result } : {}) })
      }, wait)
    }
  },
  /** Runs `task` behind the saving preloader. */
  async during<T>(label: string, task: () => Promise<T>): Promise<T> {
    const stop = feedback.saving(label)
    try {
      return await task()
    } finally {
      stop()
    }
  },
  success(title: string, options: Omit<Result, "id" | "kind" | "title"> = {}) {
    showResult({ id: ++resultId, kind: "success", title, autoCloseMs: 3200, ...options })
  },
  error(title: string, error?: unknown, options: Omit<Result, "id" | "kind" | "title" | "description"> = {}) {
    showResult({ id: ++resultId, kind: "error", title, description: error === undefined ? undefined : errorMessage(error), ...options })
  },
  close() {
    emit({ result: null })
  },
}

function useFeedbackState() {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

/* ------------------------------------------------------------------ Brand loader */

export function BrandLoader({ label, size = "lg" }: { label?: string; size?: "sm" | "lg" }) {
  const big = size === "lg"
  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <div className={cn("relative", big ? "size-20" : "size-12")}>
        <span className="absolute inset-0 rounded-full border-4 border-admin-brand-soft" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-admin-gold border-r-admin-brand [animation-duration:900ms]" />
        <span
          className={cn(
            "absolute inset-2 flex items-center justify-center rounded-full bg-gradient-to-br from-admin-gold to-admin-gold-strong font-bold text-[oklch(0.2_0.05_265)] shadow-lg admin-loader-pulse",
            big ? "text-sm" : "text-[9px]"
          )}
        >
          Pst.
        </span>
      </div>
      {label && <p className="text-sm font-semibold text-admin-text">{label}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ Confetti (CSS only) */

const CONFETTI_COLORS = ["var(--admin-gold)", "var(--admin-brand)", "var(--admin-sky)", "var(--admin-success)"]

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-visible" aria-hidden>
      {Array.from({ length: 22 }).map((_, i) => {
        const angle = (i / 22) * Math.PI * 2
        const distance = 70 + (i % 4) * 22
        return (
          <span
            key={i}
            className="admin-confetti absolute top-[72px] left-1/2 h-2.5 w-1.5 rounded-sm"
            style={
              {
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                "--dx": `${Math.cos(angle) * distance}px`,
                "--dy": `${Math.sin(angle) * distance - 20}px`,
                "--rot": `${(i * 47) % 360}deg`,
                animationDelay: `${(i % 5) * 20}ms`,
              } as React.CSSProperties
            }
          />
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ Layer */

export function FeedbackLayer() {
  const { saving, result } = useFeedbackState()
  const [paused, setPaused] = useState(false)

  useEffect(() => setPaused(false), [result?.id])

  useEffect(() => {
    if (!result?.autoCloseMs || paused || result.kind !== "success") return
    const t = setTimeout(() => feedback.close(), result.autoCloseMs)
    return () => clearTimeout(t)
  }, [result, paused])

  const success = result?.kind === "success"

  return (
    <>
      {/* Blocking saving preloader */}
      <div
        className={cn(
          "fixed inset-0 z-[90] flex items-center justify-center bg-[oklch(0.18_0.04_265/0.35)] backdrop-blur-[3px] transition-opacity duration-200",
          saving ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!saving}
      >
        {saving && (
          <div className="admin-pop rounded-3xl border border-admin-border/60 bg-admin-surface px-10 py-8 shadow-admin-lg">
            <BrandLoader label={saving} />
            <p className="mt-2 text-center text-xs text-admin-muted">Please don't close this page</p>
          </div>
        )}
      </div>

      {/* Result modal */}
      <Dialog open={!!result} onOpenChange={(open) => !open && feedback.close()}>
        <DialogContent
          showCloseButton={false}
          onMouseEnter={() => setPaused(true)}
          className="admin-pop overflow-hidden rounded-3xl border-0 px-8 pt-10 pb-8 text-center sm:max-w-sm"
        >
          {result && (
            <div key={result.id} className="relative flex flex-col items-center">
              {success && result.celebrate && <Confetti />}
              <button
                type="button"
                onClick={() => feedback.close()}
                className="absolute -top-6 -right-4 rounded-full p-1.5 text-admin-muted transition hover:bg-admin-subtle hover:text-admin-text"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>

              <div className="relative mb-6 flex size-24 items-center justify-center">
                <span className={cn("absolute inset-0 rounded-full admin-ring", success ? "bg-admin-success/20" : "bg-admin-danger/20")} />
                <span className={cn("absolute inset-0 rounded-full admin-ring [animation-delay:250ms]", success ? "bg-admin-success/15" : "bg-admin-danger/15")} />
                <span
                  className={cn(
                    "admin-badge-in relative flex size-20 items-center justify-center rounded-full shadow-lg",
                    success ? "bg-gradient-to-br from-admin-success to-[oklch(0.5_0.14_160)]" : "bg-gradient-to-br from-admin-danger to-[oklch(0.5_0.2_25)]"
                  )}
                >
                  {success ? (
                    <svg viewBox="0 0 52 52" className="size-11 text-white" aria-hidden>
                      <path className="admin-check-draw" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" d="M14 27l8 8 16-17" />
                    </svg>
                  ) : (
                    <AlertTriangle className="admin-shake size-9 text-white" strokeWidth={2.5} />
                  )}
                </span>
              </div>

              <DialogTitle className="admin-fade-up text-2xl font-bold tracking-tight text-admin-text">{result.title}</DialogTitle>
              <DialogDescription className="admin-fade-up mt-2 max-w-xs text-sm leading-relaxed text-admin-muted [animation-delay:80ms]">
                {result.description ?? (success ? "Your changes have been saved." : "Something went wrong. Please try again.")}
              </DialogDescription>

              <div className="admin-fade-up mt-7 flex w-full flex-col gap-2 [animation-delay:160ms] sm:flex-row sm:justify-center">
                {result.actions?.map((action) =>
                  action.href ? (
                    <Button key={action.label} asChild variant="outline" className="rounded-xl" onClick={() => feedback.close()}>
                      {action.external ? (
                        <a href={action.href} target="_blank" rel="noopener noreferrer">{action.label}</a>
                      ) : (
                        <Link href={action.href}>{action.label}</Link>
                      )}
                    </Button>
                  ) : (
                    <Button key={action.label} variant="outline" className="rounded-xl" onClick={() => (action.onClick?.(), feedback.close())}>
                      {action.label}
                    </Button>
                  )
                )}
                <Button
                  onClick={() => feedback.close()}
                  className={cn("min-w-28 rounded-xl text-white", success ? "bg-admin-success hover:bg-admin-success/90" : "bg-admin-danger hover:bg-admin-danger/90")}
                >
                  {success ? <><Check /> Done</> : "OK, got it"}
                </Button>
              </div>

              {success && result.autoCloseMs && (
                <div className="absolute inset-x-0 -bottom-8 h-1 overflow-hidden bg-admin-subtle" aria-hidden>
                  <div
                    key={`${result.id}-${paused}`}
                    className="h-full bg-admin-success"
                    style={{ animation: paused ? "none" : `admin-countdown ${result.autoCloseMs}ms linear forwards`, width: paused ? "100%" : undefined }}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ============================================================================
   Navigation preloader: top progress bar + branded loader while moving
   between admin pages. Starts on internal link clicks / router pushes and
   finishes when the URL changes.
   ========================================================================== */

let navStart: (() => void) | null = null
/** Call before programmatic `router.push` so the navigation preloader shows. */
export function startNavigationProgress() {
  navStart?.()
}

export function NavigationLoader() {
  const pathname = usePathname()
  const search = useSearchParams()
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle")
  const [showLoader, setShowLoader] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const first = useRef(true)

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const start = () => {
    clear()
    setPhase("loading")
    // Only show the big loader if the page takes a moment, to avoid flicker on fast navigations.
    timers.current.push(setTimeout(() => setShowLoader(true), 250))
    // Safety net in case navigation never completes.
    timers.current.push(setTimeout(() => finish(), 15000))
  }

  const finish = () => {
    clear()
    setShowLoader(false)
    setPhase((p) => (p === "loading" ? "done" : p))
    timers.current.push(setTimeout(() => setPhase("idle"), 400))
  }

  useEffect(() => {
    navStart = start
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement).closest("a")
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return
      const url = new URL(anchor.href, location.href)
      if (url.origin !== location.origin) return
      if (url.pathname === location.pathname && url.search === location.search) return
      if (!url.pathname.startsWith("/admin")) return
      start()
    }
    document.addEventListener("click", onClick, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      navStart = null
      clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search])

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[95] h-[3px]" aria-hidden>
        <div
          className={cn(
            "h-full bg-gradient-to-r from-admin-gold via-admin-gold-strong to-admin-brand shadow-[0_0_10px_var(--admin-gold)]",
            phase === "loading" && "admin-nav-progress",
            phase === "done" && "w-full opacity-0 transition-opacity duration-300 delay-150",
            phase === "idle" && "w-0"
          )}
        />
      </div>
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-[85] flex items-center justify-center transition-opacity duration-200",
          showLoader ? "opacity-100" : "opacity-0"
        )}
        aria-hidden={!showLoader}
      >
        {showLoader && (
          <div className="admin-pop rounded-3xl border border-admin-border/60 bg-admin-surface/90 px-8 py-6 shadow-admin-lg backdrop-blur">
            <BrandLoader size="sm" label="Loading…" />
          </div>
        )}
      </div>
    </>
  )
}
