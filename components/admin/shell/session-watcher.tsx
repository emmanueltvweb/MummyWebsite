"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Clock, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/components/admin/admin-auth-provider"

const ACTIVITY_KEY = "admin-last-activity"
const WARN_BEFORE_MS = 60_000
const HEARTBEAT_EVERY_MS = 60_000
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const

function readSharedActivity() {
  try {
    return Number(localStorage.getItem(ACTIVITY_KEY)) || 0
  } catch {
    return 0
  }
}

/**
 * Auto-logout:
 *  - Sessions without "remember me" end after a period of inactivity (shared across open tabs).
 *    A countdown warning appears 60 seconds before.
 *  - Every session also ends at its absolute expiry time.
 *  - While the user is active, a heartbeat keeps the server-side session alive.
 */
export function SessionWatcher() {
  const { user, logout } = useAuth()
  const idleTimeout = user?.session.idleTimeoutMs ?? null
  const expiresAt = user ? new Date(user.session.expiresAt).getTime() : 0

  const lastActivity = useRef(Date.now())
  const lastHeartbeat = useRef(Date.now())
  const loggingOut = useRef(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  const markActive = useCallback(() => {
    const now = Date.now()
    if (now - lastActivity.current < 1000) return
    lastActivity.current = now
    try {
      localStorage.setItem(ACTIVITY_KEY, String(now))
    } catch {
      // storage unavailable – this tab still tracks its own activity
    }
  }, [])

  const endSession = useCallback(() => {
    if (loggingOut.current) return
    loggingOut.current = true
    void logout("expired")
  }, [logout])

  const stayActive = useCallback(async () => {
    markActive()
    setSecondsLeft(null)
    lastHeartbeat.current = Date.now()
    await fetch("/api/auth/session", { method: "POST" }).then((r) => {
      if (r.status === 401) endSession()
    }).catch(() => undefined)
  }, [endSession, markActive])

  // Track activity in this tab and pick up activity from other tabs.
  useEffect(() => {
    if (!user) return
    markActive()
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActive, { passive: true }))
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVITY_KEY && e.newValue) lastActivity.current = Math.max(lastActivity.current, Number(e.newValue))
    }
    window.addEventListener("storage", onStorage)
    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActive))
      window.removeEventListener("storage", onStorage)
    }
  }, [user, markActive])

  // Single ticking loop: heartbeat, warning countdown, and expiry.
  useEffect(() => {
    if (!user) return
    const tick = () => {
      const now = Date.now()
      lastActivity.current = Math.max(lastActivity.current, readSharedActivity())

      if (now >= expiresAt) return endSession()

      if (idleTimeout) {
        const idleDeadline = lastActivity.current + idleTimeout
        const remaining = idleDeadline - now
        if (remaining <= 0) return endSession()
        setSecondsLeft(remaining <= WARN_BEFORE_MS ? Math.ceil(remaining / 1000) : null)
      }

      // Keep the server session alive only when there has been real activity since the last beat.
      if (now - lastHeartbeat.current >= HEARTBEAT_EVERY_MS && lastActivity.current > lastHeartbeat.current) {
        lastHeartbeat.current = now
        fetch("/api/auth/session", { method: "POST" })
          .then((r) => r.status === 401 && endSession())
          .catch(() => undefined)
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    // Laptops waking from sleep: check immediately when the tab becomes visible again.
    document.addEventListener("visibilitychange", tick)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [user, idleTimeout, expiresAt, endSession])

  const open = secondsLeft !== null
  const mm = Math.floor((secondsLeft ?? 0) / 60)
  const ss = String((secondsLeft ?? 0) % 60).padStart(2, "0")

  return (
    <Dialog open={open} onOpenChange={(o) => !o && stayActive()}>
      <DialogContent showCloseButton={false} className="admin-pop rounded-3xl text-center sm:max-w-sm">
        <div className="flex flex-col items-center">
          <span className="relative mb-5 flex size-20 items-center justify-center rounded-full bg-admin-warning-soft">
            <span className="absolute inset-0 rounded-full admin-ring bg-admin-warning/20" />
            <Clock className="relative size-9 text-admin-gold-strong" aria-hidden />
          </span>
          <DialogTitle className="text-xl font-bold text-admin-text">Are you still there?</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-admin-muted">
            For your security you'll be signed out due to inactivity in
          </DialogDescription>
          <p className="mt-3 text-4xl font-bold text-admin-text tabular-nums" aria-live="polite">
            {mm}:{ss}
          </p>
          <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={endSession}>
              <LogOut /> Sign out
            </Button>
            <Button className="flex-1 rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90" onClick={stayActive}>
              Stay signed in
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
