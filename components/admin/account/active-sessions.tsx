"use client"

import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import { LogOut, Monitor, Smartphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { LoadingButton, Panel, PanelBody, PanelHeader, Pill, Skeleton } from "@/components/admin/ui/primitives"
import { toast } from "@/components/admin/ui/toast"
import { api } from "@/lib/admin/api-client"
import { useSubmit } from "@/lib/admin/hooks"

interface SessionRow {
  id: string
  current: boolean
  remember: boolean
  ip?: string
  userAgent?: string
  createdAt: string
  lastSeenAt: string
  expiresAt: string
}

/** Very small user-agent summary, e.g. "Chrome on Windows". */
function describeDevice(ua = "") {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser"
  const os = /Windows/.test(ua) ? "Windows" : /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Unknown device"
  return { label: `${browser} on ${os}`, mobile: /iPhone|Android|Mobile/.test(ua) }
}

export function ActiveSessions() {
  const confirm = useConfirm()
  const { data, isLoading, mutate } = useSWR<SessionRow[]>("/api/auth/sessions")
  const { busy, run } = useSubmit()
  const others = (data ?? []).filter((s) => !s.current)

  const revoke = (id: string) =>
    run(`revoke-${id}`, async () => {
      try {
        await mutate(
          async (current = []) => {
            await api(`/api/auth/sessions/${id}`, { method: "DELETE" })
            return current.filter((s) => s.id !== id)
          },
          { optimisticData: (current = []) => current.filter((s) => s.id !== id), rollbackOnError: true, revalidate: false }
        )
        toast.success("Device signed out")
      } catch (err) {
        toast.fromError(err, "Couldn't sign out that device")
      }
    })

  const revokeOthers = async () => {
    if (!(await confirm({ tone: "default", title: "Sign out all other devices?", description: "You'll stay signed in here.", confirmText: "Sign out others" }))) return
    await run("others", async () => {
      try {
        const { revoked } = await api<{ revoked: number }>("/api/auth/sessions", { method: "DELETE" })
        await mutate()
        toast.success(`Signed out of ${revoked} other device${revoked === 1 ? "" : "s"}`)
      } catch (err) {
        toast.fromError(err, "Couldn't sign out other devices")
      }
    })
  }

  return (
    <Panel>
      <PanelHeader
        title="Active sessions"
        description="Devices where you're currently signed in. Sign out any you don't recognise."
        actions={
          others.length > 0 && (
            <LoadingButton variant="outline" size="sm" className="rounded-xl" loading={busy === "others"} onClick={revokeOthers}>
              <LogOut /> Sign out all other devices
            </LoadingButton>
          )
        }
      />
      <PanelBody>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : (
          <ul className="divide-y divide-admin-border/70">
            {(data ?? []).map((s) => {
              const device = describeDevice(s.userAgent)
              const Icon = device.mobile ? Smartphone : Monitor
              return (
                <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-admin-brand-soft text-admin-brand">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-admin-text">
                      {device.label}
                      {s.current && <Pill tone="success" dot>This device</Pill>}
                      {s.remember && <Pill tone="sky">Remembered</Pill>}
                    </p>
                    <p className="text-xs text-admin-muted">
                      {s.ip ? `${s.ip} · ` : ""}Active {formatDistanceToNow(new Date(s.lastSeenAt), { addSuffix: true })} · Signed in {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!s.current && (
                    <Button variant="ghost" size="sm" className="rounded-lg text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" disabled={busy === `revoke-${s.id}`} onClick={() => revoke(s.id)}>
                      Sign out
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </PanelBody>
    </Panel>
  )
}
