"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { startNavigationProgress } from "@/components/admin/ui/feedback"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export const SHORTCUTS: { keys: string[]; label: string; href?: string }[] = [
  { keys: ["Ctrl", "K"], label: "Open search / command palette" },
  { keys: ["/"], label: "Focus search" },
  { keys: ["?"], label: "Show keyboard shortcuts" },
  { keys: ["Ctrl", "S"], label: "Save the current form" },
  { keys: ["Ctrl", "B"], label: "Collapse / expand sidebar" },
  { keys: ["g", "d"], label: "Go to Dashboard", href: "/admin" },
  { keys: ["g", "p"], label: "Go to Blog Posts", href: "/admin/posts" },
  { keys: ["g", "n"], label: "New post", href: "/admin/posts/new" },
  { keys: ["g", "c"], label: "Go to Comments", href: "/admin/comments" },
  { keys: ["g", "m"], label: "Go to Media Library", href: "/admin/media" },
  { keys: ["g", "s"], label: "Go to Subscribers", href: "/admin/subscribers" },
  { keys: ["g", "e"], label: "Go to Newsletter", href: "/admin/newsletter" },
]

const SEQUENCES = Object.fromEntries(SHORTCUTS.filter((s) => s.href).map((s) => [s.keys.join(""), s.href!]))

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))
}

export function useGlobalShortcuts(handlers: { onSearch: () => void; onHelp: () => void; onToggleSidebar: () => void }) {
  const router = useRouter()
  const pending = useRef<{ key: string; at: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault()
        handlers.onSearch()
        return
      }
      if (mod && e.key.toLowerCase() === "b" && !isTyping(e.target)) {
        e.preventDefault()
        handlers.onToggleSidebar()
        return
      }
      if (mod && e.key.toLowerCase() === "s") {
        // Forms opt in by rendering a button with data-shortcut="save".
        const save = document.querySelector<HTMLButtonElement>('[data-shortcut="save"]:not(:disabled)')
        if (save) {
          e.preventDefault()
          save.click()
        }
        return
      }
      if (mod || e.altKey || isTyping(e.target)) return

      if (e.key === "?") {
        e.preventDefault()
        handlers.onHelp()
        return
      }
      if (e.key === "/") {
        e.preventDefault()
        handlers.onSearch()
        return
      }
      const now = Date.now()
      if (pending.current && now - pending.current.at < 900) {
        const href = SEQUENCES[pending.current.key + e.key.toLowerCase()]
        pending.current = null
        if (href) {
          e.preventDefault()
          startNavigationProgress()
          router.push(href)
        }
        return
      }
      if (e.key.toLowerCase() === "g") pending.current = { key: "g", at: now }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handlers, router])
}

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Move around the dashboard without reaching for the mouse.</DialogDescription>
        </DialogHeader>
        <ul className="divide-y divide-admin-border">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="text-admin-text">{shortcut.label}</span>
              <span className="flex shrink-0 items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && shortcut.keys.length === 2 && key.length === 1 && shortcut.keys[0].length === 1 && (
                      <span className="text-xs text-admin-muted">then</span>
                    )}
                    <kbd className="min-w-7 rounded-md border border-admin-border bg-admin-surface-2 px-1.5 py-0.5 text-center text-xs font-semibold text-admin-text shadow-[0_1px_0_var(--admin-border)]">
                      {key}
                    </kbd>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
