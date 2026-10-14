import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE, verifySession } from "@/lib/server/session-token"

const MOVED_ROUTES: Record<string, string> = {
  "/admin/sermons": "/admin/pages/site/sermon",
  "/admin/pages/home": "/admin/pages/site/home",
}

/**
 * Gatekeeper for the admin area. Verifies the signed session cookie before any admin page or
 * admin API runs. Route handlers additionally re-check the user record and role.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)

  if (pathname.startsWith("/api/admin")) {
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Your session has expired. Please sign in again.", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  const isLogin = pathname === "/admin/login"
  if (!session && !isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = "/admin/login"
    url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }
  if (session && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // Old admin addresses that moved.
  const moved = MOVED_ROUTES[pathname]
  if (moved) return NextResponse.redirect(new URL(moved, request.url))

  const response = NextResponse.next()
  response.headers.set("X-Robots-Tag", "noindex, nofollow")
  return response
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
