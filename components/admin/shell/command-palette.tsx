"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Command } from "cmdk"
import {
  FileText,
  FolderTree,
  GalleryHorizontalEnd,
  Loader2,
  MessageSquare,
  Moon,
  Newspaper,
  Plus,
  Search,
  Sun,
  UserRound,
  Users,
} from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { startNavigationProgress } from "@/components/admin/ui/feedback"
import { fetcher } from "@/lib/admin/api-client"
import type { SearchHit } from "@/app/api/admin/search/route"
import { NAV, navPermission } from "./nav-config"
import { usePreferences } from "./preferences"

const HIT_ICON = {
  post: Newspaper,
  page: FileText,
  category: FolderTree,
  comment: MessageSquare,
  subscriber: UserRound,
  user: Users,
  slide: GalleryHorizontalEnd,
}

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-admin-text aria-selected:bg-admin-brand-soft aria-selected:text-admin-brand data-[disabled=true]:opacity-50"

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const { can } = useAuth()
  const { resolvedTheme, set } = usePreferences()
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const { data, isLoading } = useSWR<{ hits: SearchHit[] }>(
    open && debounced.length >= 2 ? `/api/admin/search?q=${encodeURIComponent(debounced)}` : null,
    fetcher,
    { keepPreviousData: true }
  )

  const go = (href: string) => {
    onOpenChange(false)
    startNavigationProgress()
    router.push(href)
  }

  const q = query.trim().toLowerCase()
  const pages = NAV.flatMap((g) => g.items)
    .filter((item) => { const perm = navPermission(item); return !perm || can(perm) })
    .filter((item) => !q || item.label.toLowerCase().includes(q))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="top-[15%] translate-y-0 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Search the dashboard</DialogTitle>
        <DialogDescription className="sr-only">Search posts, pages, subscribers and more, or jump to a section.</DialogDescription>
        <Command shouldFilter={false} loop className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-admin-border px-4">
            <Search className="size-5 shrink-0 text-admin-muted" aria-hidden />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search posts, pages, subscribers… or jump to"
              className="h-14 flex-1 bg-transparent text-base text-admin-text outline-none placeholder:text-admin-muted"
            />
            {isLoading && <Loader2 className="size-4 animate-spin text-admin-muted" />}
          </div>
          <Command.List className="admin-scroll max-h-[min(60vh,420px)] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-10 text-center text-sm text-admin-muted">No results for “{query}”.</Command.Empty>

            {!q && (
              <Command.Group heading="Quick actions" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-admin-muted">
                {can("blog.create") && (
                  <Command.Item value="new-post" onSelect={() => go("/admin/posts/new")} className={itemClass}>
                    <Plus className="size-4" /> Write a new post
                  </Command.Item>
                )}
                {can("website.manage") && (
                  <Command.Item value="new-page" onSelect={() => go("/admin/pages/new")} className={itemClass}>
                    <FileText className="size-4" /> Create a page
                  </Command.Item>
                )}
                <Command.Item
                  value="toggle-theme"
                  onSelect={() => {
                    set("theme", resolvedTheme === "dark" ? "light" : "dark")
                    onOpenChange(false)
                  }}
                  className={itemClass}
                >
                  {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
                </Command.Item>
              </Command.Group>
            )}

            {!!data?.hits.length && q.length >= 2 && (
              <Command.Group heading="Content" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-admin-muted">
                {data.hits.map((hit) => {
                  const Icon = HIT_ICON[hit.type]
                  return (
                    <Command.Item key={`${hit.type}-${hit.id}`} value={`${hit.type}-${hit.id}`} onSelect={() => go(hit.href)} className={itemClass}>
                      <Icon className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{hit.title}</span>
                        <span className="block truncate text-xs text-admin-muted">{hit.subtitle}</span>
                      </span>
                    </Command.Item>
                  )
                })}
              </Command.Group>
            )}

            {pages.length > 0 && (
              <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-admin-muted">
                {pages.map((item) => (
                  <Command.Item key={item.href} value={`nav-${item.href}`} onSelect={() => go(item.href)} className={itemClass}>
                    <item.icon className="size-4" /> {item.label}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
          <div className="flex items-center gap-4 border-t border-admin-border px-4 py-2.5 text-xs text-admin-muted">
            <span><kbd className="font-semibold">↑↓</kbd> navigate</span>
            <span><kbd className="font-semibold">Enter</kbd> open</span>
            <span><kbd className="font-semibold">Esc</kbd> close</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
