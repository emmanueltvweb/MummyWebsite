"use client"

import { createContext, useCallback, useContext, useMemo } from "react"
import useSWR from "swr"

import { api, fetcher } from "@/lib/admin/api-client"
import type { Permission } from "@/lib/cms/rbac"
import type { CurrentUser, PublicUser } from "@/lib/cms/types"

interface AuthContextType {
  user: CurrentUser | null
  isLoading: boolean
  login: (email: string, password: string, remember: boolean) => Promise<PublicUser>
  logout: (reason?: "expired") => Promise<void>
  refresh: () => Promise<unknown>
  /** True when the user has the permission. */
  can: (permission: Permission) => boolean
  /** True when the user has at least one of the permissions. */
  canAny: (permissions: Permission[]) => boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children, enabled = true }: { children: React.ReactNode; enabled?: boolean }) {
  const { data, isLoading, mutate } = useSWR<CurrentUser>(enabled ? "/api/auth/me" : null, fetcher, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  })

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const user = await api<PublicUser>("/api/auth/login", { body: { email, password, remember } })
      await mutate(undefined, { revalidate: false })
      return user
    },
    [mutate]
  )

  const logout = useCallback(
    async (reason?: "expired") => {
      await api("/api/auth/logout", { method: "POST" }).catch(() => undefined)
      await mutate(undefined, { revalidate: false })
      const next = reason ? `?reason=${reason}&next=${encodeURIComponent(window.location.pathname)}` : ""
      window.location.replace(`/admin/login${next}`)
    },
    [mutate]
  )

  const permissions = useMemo(() => new Set(data?.permissions ?? []), [data])
  const can = useCallback((permission: Permission) => permissions.has(permission), [permissions])
  const canAny = useCallback((list: Permission[]) => list.some((p) => permissions.has(p)), [permissions])

  return (
    <AuthContext.Provider
      value={{
        user: data ?? null,
        isLoading: enabled && isLoading,
        login,
        logout,
        refresh: mutate,
        can,
        canAny,
        isSuperAdmin: data?.role === "super_admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error("useAuth must be used within an AdminAuthProvider")
  return context
}
