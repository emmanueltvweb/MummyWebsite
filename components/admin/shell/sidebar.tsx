"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import useSWR from "swr"
import * as Collapsible from "@radix-ui/react-collapsible"
import { ChevronDown, ChevronLeft, ExternalLink, Moon, PanelLeftOpen, Sun, X } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { fetcher } from "@/lib/admin/api-client"
import { cn } from "@/lib/utils"
import { NAV, navPermission, type NavItem } from "./nav-config"
import { usePreferences } from "./preferences"

function matches(item: Pick<NavItem, "href" | "match">, pathname: string) {
  return item.href === "/admin"
    ? pathname === "/admin"
    : pathname === item.href || pathname.startsWith(`${item.href}/`) || !!item.match?.some((m) => pathname.startsWith(m))
}

/** Highlights only the most specific matching item (e.g. "Sermons" at /admin/pages/site/sermon, not "Pages" too). */
function useIsActive() {
  const pathname = usePathname()
  const best = NAV.flatMap((group) => group.items)
    .filter((item) => matches(item, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return (item: Pick<NavItem, "href" | "match">) => item.href === best?.href
}

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const { sidebarCollapsed: collapsed, set, resolvedTheme } = usePreferences()
  const { can } = useAuth()
  const isActive = useIsActive()
  const pathname = usePathname()

  const { data: pending } = useSWR<{ counts: { pending: number } }>(can("comments.view") ? "/api/admin/comments?status=pending&pageSize=1" : null, fetcher, {
    refreshInterval: 60_000,
  })

  // Close the mobile drawer on navigation.
  useEffect(() => onMobileClose(), [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const compact = collapsed && !mobileOpen

  return (
    <>
      <div
        className={cn("fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity lg:hidden", mobileOpen ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={onMobileClose}
        aria-hidden
      />
      <aside
        aria-label="Admin navigation"
        className={cn(
          "admin-sidebar fixed inset-y-0 left-0 z-50 flex flex-col rounded-r-3xl shadow-admin-lg transition-[width,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:sticky lg:top-3 lg:my-3 lg:ml-3 lg:h-[calc(100vh-1.5rem)] lg:shrink-0 lg:translate-x-0 lg:rounded-3xl",
          compact ? "w-[84px]" : "w-[272px]",
          mobileOpen ? "translate-x-0 shadow-admin-lg" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className={cn("flex h-[72px] shrink-0 items-center border-b border-admin-border/70", compact ? "justify-center px-2" : "justify-between px-5")}>
          <Link href="/admin" className="flex min-w-0 items-center gap-3" aria-label="Dashboard home">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-admin-gold to-admin-gold-strong text-sm font-bold text-[oklch(0.2_0.05_265)] shadow-sm">
              Pst.
            </span>
            {!compact && (
              <span className="min-w-0 leading-tight">
                <span className="block truncate font-bold text-admin-text">Evelyn Joshua</span>
                <span className="block text-xs font-semibold tracking-[0.14em] text-[var(--admin-mint)] uppercase">Admin Console</span>
              </span>
            )}
          </Link>
          {mobileOpen && (
            <button
              type="button"
              onClick={onMobileClose}
              className="rounded-lg p-2 text-admin-muted transition hover:bg-admin-subtle hover:text-admin-text lg:hidden"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Collapse / expand handle on the sidebar edge (large screens) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => set("sidebarCollapsed", !collapsed)}
              className="absolute top-[58px] -right-3.5 z-10 hidden size-7 items-center justify-center rounded-full border border-admin-border bg-admin-surface text-admin-muted shadow-admin transition hover:scale-110 hover:border-admin-brand hover:text-admin-brand lg:flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              <ChevronLeft className={cn("size-4 transition-transform duration-300", collapsed && "rotate-180")} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
        </Tooltip>

        {/* Navigation */}
        <nav className="admin-scroll flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => {
            const items = group.items.filter((item) => { const perm = navPermission(item); return !perm || can(perm) })
            if (!items.length) return null
            return (
              <div key={group.label} className="mb-5">
                {compact ? (
                  <div className="mx-auto mb-2 h-px w-8 bg-admin-border" aria-hidden />
                ) : (
                  <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.12em] text-admin-muted/80 uppercase">{group.label}</p>
                )}
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.href}>
                      <NavLink item={item} compact={compact} active={isActive(item)} badge={item.badge === "pendingComments" ? pending?.counts.pending : undefined} />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-3 border-t border-admin-border/70 p-3">
          {compact ? (
            <>
              <IconButton label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={() => set("theme", resolvedTheme === "dark" ? "light" : "dark")}>
                {resolvedTheme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </IconButton>
              <IconButton label="Expand sidebar" onClick={() => set("sidebarCollapsed", false)} className="hidden lg:flex">
                <PanelLeftOpen className="size-5" />
              </IconButton>
            </>
          ) : (
            <>
              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-admin-muted transition hover:bg-admin-subtle hover:text-admin-text"
              >
                View website <ExternalLink className="size-4" />
              </Link>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-admin-subtle p-1" role="radiogroup" aria-label="Colour theme">
                {(["light", "dark"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={resolvedTheme === mode}
                    onClick={() => set("theme", mode)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all",
                      resolvedTheme === mode ? "bg-admin-surface text-admin-text shadow-sm" : "text-admin-muted hover:text-admin-text"
                    )}
                  >
                    {mode === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    {mode === "light" ? "Light" : "Dark"}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

function IconButton({ label, onClick, children, className }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className={cn("mx-auto flex size-11 items-center justify-center rounded-xl text-admin-muted transition hover:bg-admin-subtle hover:text-admin-text", className)}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function NavLink({ item, compact, active, badge }: { item: NavItem; compact: boolean; active: boolean; badge?: number }) {
  const Icon = item.icon
  const { can } = useAuth()
  const search = useSearchParams()
  const pathname = usePathname()
  const [open, setOpen] = useState(active)
  useEffect(() => {
    if (active) setOpen(true)
  }, [active])

  const linkClass = cn(
    "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
    compact ? "mx-auto size-11 justify-center" : "px-3 py-2.5",
    active
      ? "bg-admin-brand text-admin-brand-fg shadow-[0_8px_20px_-8px_var(--admin-brand)]"
      : "text-admin-muted hover:bg-admin-subtle hover:text-admin-text"
  )

  const content = (
    <>
      <Icon className={cn("size-5 shrink-0 transition-transform duration-200", !active && "group-hover:scale-110")} aria-hidden />
      {!compact && <span className="flex-1 truncate">{item.label}</span>}
      {!!badge && (
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-admin-danger text-[11px] font-bold text-white tabular-nums",
            compact ? "absolute -top-1 -right-1 size-5" : "h-5 min-w-5 px-1.5"
          )}
          aria-label={`${badge} pending`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </>
  )

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={item.href} className={linkClass} aria-current={active ? "page" : undefined} aria-label={item.label}>
            {content}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  if (!item.children) {
    return (
      <Link href={item.href} className={linkClass} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    )
  }

  const currentStatus = search.get("status")
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <Link href={item.href} className={cn(linkClass, "flex-1")} aria-current={active ? "page" : undefined}>
          {content}
        </Link>
        <Collapsible.Trigger
          className="rounded-lg p-2 text-admin-muted transition hover:bg-admin-subtle hover:text-admin-text"
          aria-label={`${open ? "Collapse" : "Expand"} ${item.label}`}
        >
          <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} />
        </Collapsible.Trigger>
      </div>
      <Collapsible.Content className="admin-collapsible overflow-hidden">
        <ul className="mt-1 ml-5 space-y-0.5 border-l border-admin-border pl-3">
          {item.children.filter((child) => !child.permission || can(child.permission)).map((child) => {
            const [path, query] = child.href.split("?")
            const status = query ? new URLSearchParams(query).get("status") : null
            const childActive = !child.action && pathname === path && (status ? currentStatus === status : !currentStatus)
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  aria-current={childActive ? "page" : undefined}
                  className={cn(
                    "block rounded-lg px-3 py-1.5 text-sm transition",
                    childActive ? "bg-admin-gold-soft font-semibold text-admin-gold-strong" : "text-admin-muted hover:bg-admin-subtle hover:text-admin-text"
                  )}
                >
                  {child.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
