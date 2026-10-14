"use client"

import { usePathname } from "next/navigation"

/** Renders children only on the public website (not inside /admin). */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith("/admin")) return null
  return <>{children}</>
}
