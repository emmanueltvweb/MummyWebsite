"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"

import { BUILT_IN_PAGES } from "@/lib/content/page-types"
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Keyboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { api, fetcher } from "@/lib/admin/api-client"
import type { Notification } from "@/lib/cms/types"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ROUTE_LABELS } from "./nav-config"
import { usePreferences } from "./preferences"

export function Topbar({ onMenu, onSearch, onShortcuts }: { onMenu: () => void; onSearch: () => void; onShortcuts: () => void }) {
  const { user, can } = useAuth()
  const { sidebarCollapsed, set } = usePreferences()
  const firstName = user?.name.split(" ")[0]

  return (
    <header className="admin-topbar sticky top-0 z-30 border-b border-white/15 backdrop-blur-xl">
      <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} className="rounded-xl p-2 text-admin-muted hover:bg-admin-subtle lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => set("sidebarCollapsed", !sidebarCollapsed)}
              className="hidden rounded-xl border border-admin-border/70 p-2 text-admin-muted transition hover:bg-admin-subtle hover:text-admin-text lg:inline-flex"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!sidebarCollapsed}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} <span className="ml-1 opacity-60">Ctrl B</span>
          </TooltipContent>
        </Tooltip>

        <div className="min-w-0 flex-1">
          <p className="hidden text-xs text-admin-muted sm:block">
            Welcome back{firstName ? "," : ""} <span aria-hidden>👋</span>
          </p>
          <p className="truncate text-sm font-semibold text-admin-text sm:text-base">{user?.name ?? " "}</p>
        </div>

        <button
          type="button"
          onClick={onSearch}
          className="hidden h-10 w-full max-w-xs items-center gap-2 rounded-xl border border-admin-border bg-admin-surface-2 px-3 text-sm text-admin-muted transition hover:border-admin-brand/30 hover:bg-admin-surface md:flex"
          aria-label="Search the dashboard"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search anything…</span>
          <kbd className="rounded-md border border-admin-border bg-admin-surface px-1.5 py-0.5 text-[10px] font-semibold">Ctrl K</kbd>
        </button>
        <Button variant="ghost" size="icon" className="rounded-xl md:hidden" onClick={onSearch} aria-label="Search">
          <Search className="size-5" />
        </Button>

        {can("blog.create") && (
          <Button asChild className="hidden rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90 sm:inline-flex">
            <Link href="/admin/posts/new">
              <Plus /> New post
            </Link>
          </Button>
        )}

        <NotificationsMenu />
        <UserMenu onShortcuts={onShortcuts} />
      </div>
    </header>
  )
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length <= 1) return null

  const crumbs = segments.flatMap((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`
    // Built-in page editors live at /admin/pages/site/<key>: show the page name, skip "site".
    if (segments[index - 1] === "pages" && segment === "site") return []
    if (segments[index - 1] === "site") {
      const page = BUILT_IN_PAGES.find((p) => p.key === segment)
      if (page) return [{ href, label: page.title }]
    }
    const label = ROUTE_LABELS[segment] ?? (segment.length > 20 || /^[0-9a-f-]{8,}$/i.test(segment) ? "Edit" : decodeURIComponent(segment))
    return [{ href, label }]
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-admin-muted">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="size-3.5 opacity-60" aria-hidden />}
              {last ? (
                <span aria-current="page" className="font-medium text-admin-text">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="rounded transition hover:text-admin-text">{crumb.label}</Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

const NOTIFICATION_ICON = { comment: MessageSquare, subscriber: UserRound, post: Newspaper, system: ShieldAlert, campaign: Mail }

function NotificationsMenu() {
  const router = useRouter()
  const { data, mutate } = useSWR<{ items: Notification[]; unread: number }>("/api/admin/notifications", fetcher, {
    refreshInterval: 45_000,
  })
  const unread = data?.unread ?? 0

  const markRead = async (ids?: string[]) => {
    // Optimistic: flip locally first, then sync.
    mutate(
      (current) =>
        current && {
          items: current.items.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)),
          unread: ids ? Math.max(0, current.unread - ids.filter((id) => current.items.find((n) => n.id === id && !n.read)).length) : 0,
        },
      { revalidate: false }
    )
    await api("/api/admin/notifications", { method: "PATCH", body: { ids } }).catch(() => mutate())
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl border border-admin-border/70 bg-admin-surface" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-admin-danger opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-admin-danger ring-2 ring-admin-surface" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(92vw,380px)] rounded-2xl p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-semibold text-admin-text">Notifications</p>
            <p className="text-xs text-admin-muted">{unread ? `${unread} unread` : "You're all caught up"}</p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => markRead()}>
              <CheckCheck className="size-4" /> Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <div className="admin-scroll max-h-96 overflow-y-auto p-1.5">
          {!data?.items.length ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <Bell className="size-6 text-admin-muted" />
              <p className="text-sm text-admin-muted">No notifications yet. New comments and subscribers will show up here.</p>
            </div>
          ) : (
            data.items.slice(0, 12).map((n) => {
              const Icon = NOTIFICATION_ICON[n.type] ?? Bell
              return (
                <DropdownMenuItem
                  key={n.id}
                  className="items-start gap-3 rounded-xl p-3"
                  onSelect={() => {
                    if (!n.read) markRead([n.id])
                    if (n.href) router.push(n.href)
                  }}
                >
                  <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", n.read ? "bg-admin-subtle text-admin-muted" : "bg-admin-brand-soft text-admin-brand")}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("truncate text-sm", n.read ? "text-admin-muted" : "font-semibold text-admin-text")}>{n.title}</span>
                      {!n.read && <span className="size-2 shrink-0 rounded-full bg-admin-gold" aria-label="unread" />}
                    </span>
                    <span className="line-clamp-2 text-xs text-admin-muted">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-admin-muted/80">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                  </span>
                </DropdownMenuItem>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu({ onShortcuts }: { onShortcuts: () => void }) {
  const { user, logout, can } = useAuth()
  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-admin-brand to-admin-sky text-sm font-bold text-white ring-2 ring-admin-surface ring-offset-2 ring-offset-admin-border transition hover:scale-105"
          aria-label="Account menu"
        >
          {initials || <UserRound className="size-5" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl p-1.5">
        <DropdownMenuLabel className="px-3 py-2">
          <p className="truncate font-semibold text-admin-text">{user?.name}</p>
          <p className="truncate text-xs font-normal text-admin-muted">{user?.email}</p>
          <span className="mt-1.5 inline-block rounded-full bg-admin-gold-soft px-2 py-0.5 text-[11px] font-semibold text-admin-gold-strong ">{user?.roleName}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-lg">
          <Link href="/admin/profile">
            <UserRound /> My profile
          </Link>
        </DropdownMenuItem>
        {can("settings.view") && (
          <DropdownMenuItem asChild className="rounded-lg">
            <Link href="/admin/settings">
              <Settings /> Site settings
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="rounded-lg" onSelect={onShortcuts}>
          <Keyboard /> Keyboard shortcuts
          <kbd className="ml-auto text-[10px] text-admin-muted">?</kbd>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="rounded-lg text-admin-danger focus:bg-admin-danger-soft focus:text-admin-danger" onSelect={() => logout()}>
          <LogOut className="text-admin-danger" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
