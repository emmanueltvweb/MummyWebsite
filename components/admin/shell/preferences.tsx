"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type ThemePreference = "light" | "dark" | "system"

interface Preferences {
  theme: ThemePreference
  sidebarCollapsed: boolean
  reducedMotion: boolean
  compactTables: boolean
}

interface PreferencesContext extends Preferences {
  resolvedTheme: "light" | "dark"
  set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
}

const DEFAULTS: Preferences = { theme: "light", sidebarCollapsed: false, reducedMotion: false, compactTables: false }
const STORAGE_KEY = "admin-preferences"

const Context = createContext<PreferencesContext | null>(null)

function read(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function AdminPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS)
  const [systemDark, setSystemDark] = useState(false)

  useEffect(() => {
    setPrefs(read())
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    setSystemDark(media.matches)
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  const resolvedTheme = prefs.theme === "system" ? (systemDark ? "dark" : "light") : prefs.theme

  // The admin theme is applied to <html> so portalled UI (dialogs, menus, toasts) matches.
  // It's removed again when leaving the admin so the public site is unaffected.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", resolvedTheme === "dark")
    root.classList.toggle("admin-reduced-motion", prefs.reducedMotion)
    return () => {
      root.classList.remove("dark")
      root.classList.remove("admin-reduced-motion")
    }
  }, [resolvedTheme, prefs.reducedMotion])

  const set = useCallback<PreferencesContext["set"]>((key, value) => {
    setPrefs((current) => {
      const next = { ...current, [key]: value }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // storage unavailable – keep in memory only
      }
      return next
    })
  }, [])

  const value = useMemo(() => ({ ...prefs, resolvedTheme, set }), [prefs, resolvedTheme, set]) as PreferencesContext
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function usePreferences() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error("usePreferences must be used inside AdminPreferencesProvider")
  return ctx
}
