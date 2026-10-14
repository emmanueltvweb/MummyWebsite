"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { feedback } from "@/components/admin/ui/feedback"

/** Warns before closing the tab when there are unsaved changes. */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])
}

/**
 * Runs an async action with a busy flag and a hard guard against duplicate submissions
 * (a ref, so double-clicks within the same frame are also blocked).
 */
export function useSubmit() {
  const running = useRef(false)
  const [busy, setBusy] = useState<string | null>(null)
  const run = useCallback(
    async <T,>(key: string, action: (ctx: { showPreloader: (label?: string) => () => void }) => Promise<T>): Promise<T | undefined> => {
      if (running.current) return undefined
      running.current = true
      setBusy(key)
      const stops: (() => void)[] = []
      try {
        // The action decides when to show the full-screen saving preloader (e.g. after validation passes).
        return await action({
          showPreloader: (label) => {
            const stop = feedback.saving(label)
            stops.push(stop)
            return stop
          },
        })
      } finally {
        stops.forEach((stop) => stop())
        running.current = false
        setBusy(null)
      }
    },
    []
  )
  return { busy, run }
}

export function slugifyClient(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}
