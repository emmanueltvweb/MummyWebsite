"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { SWRConfig } from "swr"
import { Toaster } from "sonner"
import { KeyRound, ShieldX, X } from "lucide-react"
import Link from "next/link"

import { TooltipProvider } from "@/components/ui/tooltip"
import { AdminAuthProvider, useAuth } from "@/components/admin/admin-auth-provider"
import { ConfirmProvider } from "@/components/admin/ui/confirm-dialog"
import { ErrorBoundary } from "@/components/admin/ui/error-boundary"
import { BrandLoader, FeedbackLayer, NavigationLoader } from "@/components/admin/ui/feedback"
import { FullPageSpinner } from "@/components/admin/ui/primitives"
import { adminSWRConfig } from "@/lib/admin/store"
import { permissionForPath } from "@/lib/cms/rbac"
import { CommandPalette } from "./command-palette"
import { DevRouteWarmup } from "./dev-route-warmup"
import { AdminPreferencesProvider, usePreferences } from "./preferences"
import { ShortcutsDialog, useGlobalShortcuts } from "./shortcuts"
import { SessionWatcher } from "./session-watcher"
import { Sidebar } from "./sidebar"
import { Breadcrumbs, Topbar } from "./topbar"

/** Material-style ripple on every admin button, via one delegated listener. */
function useRipple(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const onDown = (e: PointerEvent) => {
      if (document.documentElement.classList.contains("admin-reduced-motion")) return
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-slot="button"], [data-ripple]')
      if (!target || target.hasAttribute("disabled")) return
      const rect = target.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const ripple = document.createElement("span")
      ripple.className = "admin-ripple"
      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`
      target.appendChild(ripple)
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true })
    }
    el.addEventListener("pointerdown", onDown)
    return () => el.removeEventListener("pointerdown", onDown)
  }, [root])
}

/** Shown instead of a page the signed-in user's role doesn't give them access to. */
function AccessDenied() {
  const { user } = useAuth()
  return (
    <div className="admin-card admin-rise mx-auto mt-6 max-w-lg rounded-3xl bg-admin-surface px-8 py-12 text-center">
      <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-admin-danger-soft text-admin-danger">
        <ShieldX className="size-8" aria-hidden />
      </span>
      <h1 className="text-xl font-bold text-admin-text">You don't have access to this page</h1>
      <p className="mt-2 text-sm text-admin-muted">
        Your role{user ? <> (<strong>{user.roleName}</strong>)</> : null} doesn't include permission for this area. Ask a Super Admin if you need access.
      </p>
      <Link href="/admin" className="mt-6 inline-flex items-center rounded-xl bg-admin-brand px-4 py-2.5 text-sm font-semibold text-admin-brand-fg">
        Back to dashboard
      </Link>
    </div>
  )
}

function PasswordBanner() {
  const { user } = useAuth()
  const [hidden, setHidden] = useState(false)
  if (!user?.mustChangePassword || hidden) return null
  return (
    <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-admin-warning/40 bg-admin-warning-soft p-4 text-sm admin-rise">
      <KeyRound className="mt-0.5 size-5 shrink-0 text-admin-gold-strong" aria-hidden />
      <p className="flex-1 text-admin-text">
        <strong>You're using the default admin password.</strong> Please{" "}
        <Link href="/admin/profile" className="font-semibold text-admin-brand underline underline-offset-2">
          change it now
        </Link>{" "}
        to keep the website secure.
      </p>
      <button type="button" onClick={() => setHidden(true)} aria-label="Dismiss" className="rounded-md p-1 text-admin-muted hover:bg-admin-surface">
        <X className="size-4" />
      </button>
    </div>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { sidebarCollapsed, set, resolvedTheme } = usePreferences()
  const { isLoading, user, can } = useAuth()
  const required = pathname === "/admin/posts/new" ? "blog.create" : permissionForPath(pathname)
  const allowed = !required || can(required)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useRipple(rootRef)

  const handlers = useMemo(
    () => ({
      onSearch: () => setSearchOpen(true),
      onHelp: () => setHelpOpen(true),
      onToggleSidebar: () => set("sidebarCollapsed", !sidebarCollapsed),
    }),
    [set, sidebarCollapsed]
  )
  useGlobalShortcuts(handlers)
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <div ref={rootRef} className="admin-shell admin-canvas-bg flex min-h-screen text-admin-text">
      <a href="#admin-main" className="sr-only z-[60] rounded-lg bg-admin-brand px-4 py-2 text-admin-brand-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Suspense>
        <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobile} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} onSearch={() => setSearchOpen(true)} onShortcuts={() => setHelpOpen(true)} />
        <main id="admin-main" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <Breadcrumbs />
            <PasswordBanner />
            {isLoading && !user ? (
              <FullPageSpinner />
            ) : user && !allowed ? (
              <AccessDenied />
            ) : (
              <ErrorBoundary label="page" key={pathname}>
                <div key={pathname} className="admin-page-enter">
                  {children}
                </div>
              </ErrorBoundary>
            )}
          </div>
        </main>
      </div>
      <Suspense>
        <NavigationLoader />
      </Suspense>
      <FeedbackLayer />
      <SessionWatcher />
      <DevRouteWarmup />
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <ShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <Toaster
        theme={resolvedTheme}
        richColors
        closeButton
        position="top-right"
        expand
        visibleToasts={4}
        toastOptions={{ className: "rounded-2xl" }}
      />
    </div>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  // The admin UI depends on browser-only state (saved preferences, the viewer's clock and the
  // signed-in session), so it renders on the client only. This avoids server/client hydration
  // mismatches; the server sends a lightweight branded loader instead.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="admin-shell admin-canvas-bg flex min-h-screen items-center justify-center">
        <div className="rounded-3xl bg-admin-surface px-10 py-8 shadow-admin-lg">
          <BrandLoader label="Loading dashboard…" />
        </div>
      </div>
    )
  }

  return (
    <SWRConfig value={adminSWRConfig}>
      <AdminPreferencesProvider>
        <AdminAuthProvider>
          <TooltipProvider delayDuration={200}>
            <ConfirmProvider>
              <Frame>{children}</Frame>
            </ConfirmProvider>
          </TooltipProvider>
        </AdminAuthProvider>
      </AdminPreferencesProvider>
    </SWRConfig>
  )
}
