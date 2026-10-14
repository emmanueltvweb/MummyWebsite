"use client"

import { useEffect } from "react"

import { useAuth } from "@/components/admin/admin-auth-provider"
import { NAV, navPermission } from "./nav-config"

/** Editor routes that aren't in the sidebar but are opened often. */
const EXTRA_ROUTES = ["/admin/posts/new", "/admin/pages/site/home", "/admin/newsletter/new", "/admin/profile"]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * DEVELOPMENT ONLY. `next dev` compiles each page the first time it's opened, which makes the
 * first click on every sidebar item take several seconds. After the dashboard has loaded, this
 * quietly requests each admin page once (one at a time, while the tab is idle) so they're already
 * compiled when you click them. It does nothing in production, where pages are prebuilt.
 */
export function DevRouteWarmup() {
  const { user, can } = useAuth()
  const ready = Boolean(user)

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !ready) return
    let cancelled = false

    const routes = [
      ...NAV.flatMap((group) => group.items)
        .filter((item) => {
          const permission = navPermission(item)
          return !permission || can(permission)
        })
        .map((item) => item.href),
      ...EXTRA_ROUTES,
    ]
    const unique = [...new Set(routes)].filter((href) => href !== window.location.pathname)

    const run = async () => {
      await sleep(2500) // let the current page finish loading first
      for (const href of unique) {
        if (cancelled) return
        while (document.hidden && !cancelled) await sleep(1000)
        try {
          await fetch(href, { credentials: "same-origin", headers: { "x-dev-warmup": "1" } })
        } catch {
          // Ignore: this is only a speed-up.
        }
        await sleep(250)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
    // Run once per full page load, after sign-in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return null
}
