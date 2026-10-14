"use client"

import { useState } from "react"
import useSWR from "swr"
import { format } from "date-fns"
import { Activity, ShieldCheck } from "lucide-react"

import { useAuth } from "@/components/admin/admin-auth-provider"
import { PaginationBar, SearchInput } from "@/components/admin/ui/controls"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { EmptyState, inputClass, PageHeader, Panel, Pill, TableSkeleton, type Tone } from "@/components/admin/ui/primitives"
import type { AuditEntry, Paginated } from "@/lib/cms/types"
import { cn } from "@/lib/utils"

function actionTone(action: string): Tone {
  if (action.includes("delete") || action === "auth.failed") return "danger"
  if (action.includes("create") || action.includes("publish") || action === "auth.login") return "success"
  if (action.startsWith("auth")) return "sky"
  return "brand"
}

export default function AuditLogsPage() {
  const { can } = useAuth()
  const [search, setSearch] = useState("")
  const [entity, setEntity] = useState("all")
  const [userId, setUserId] = useState("all")
  const [page, setPage] = useState(1)
  const key = `/api/admin/audit-logs?page=${page}&entity=${entity}&user=${userId}${search ? `&search=${encodeURIComponent(search)}` : ""}`
  const { data, error, isLoading, mutate } = useSWR<Paginated<AuditEntry> & { users: { id: string; name: string }[]; entities: string[] }>(can("settings.view") ? key : null, { keepPreviousData: true })

  if (!can("settings.view")) return <EmptyState icon={ShieldCheck} title="No access" description="Your role doesn't include access to the audit log." />

  return (
    <div>
      <PageHeader icon={Activity} title="Audit Logs" description="A record of every change made in the dashboard — who did what, and when." />
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-admin-border/70 p-4 sm:p-5 lg:flex-row lg:items-center">
          <SearchInput value={search} onChange={(v) => (setSearch(v), setPage(1))} placeholder="Search activity…" className="lg:max-w-sm lg:flex-1" />
          <select aria-label="Filter by area" value={entity} onChange={(e) => (setEntity(e.target.value), setPage(1))} className={cn(inputClass, "cursor-pointer lg:w-48")}>
            <option value="all">All areas</option>
            {data?.entities.map((e) => <option key={e} value={e} className="capitalize">{e}</option>)}
          </select>
          <select aria-label="Filter by user" value={userId} onChange={(e) => (setUserId(e.target.value), setPage(1))} className={cn(inputClass, "cursor-pointer lg:w-48")}>
            <option value="all">All users</option>
            {data?.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        {error ? (
          <div className="p-5"><ErrorFallback label="audit log" message={(error as Error).message} onRetry={() => mutate()} /></div>
        ) : isLoading && !data ? (
          <TableSkeleton rows={8} />
        ) : !data?.items.length ? (
          <EmptyState icon={Activity} title="No activity recorded" description="Actions like publishing posts, uploading media and signing in are logged here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-admin-surface-2 text-left text-xs text-admin-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">When</th>
                  <th scope="col" className="px-3 py-3 font-medium">User</th>
                  <th scope="col" className="px-3 py-3 font-medium">Action</th>
                  <th scope="col" className="px-3 py-3 font-medium">Details</th>
                  <th scope="col" className="hidden px-5 py-3 font-medium lg:table-cell">IP address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/70">
                {data.items.map((entry) => (
                  <tr key={entry.id} className="transition hover:bg-admin-surface-2">
                    <td className="px-5 py-3 whitespace-nowrap text-admin-muted tabular-nums">{format(new Date(entry.createdAt), "d MMM yyyy, HH:mm:ss")}</td>
                    <td className="px-3 py-3 font-medium whitespace-nowrap text-admin-text">{entry.userName}</td>
                    <td className="px-3 py-3"><Pill tone={actionTone(entry.action)}><span className="font-mono">{entry.action}</span></Pill></td>
                    <td className="min-w-64 px-3 py-3 text-admin-text">{entry.summary}</td>
                    <td className="hidden px-5 py-3 font-mono text-xs text-admin-muted lg:table-cell">{entry.ip ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <PaginationBar page={data.page} pageCount={data.pageCount} total={data.total} pageSize={data.pageSize} onPage={setPage} noun="entries" />}
      </Panel>
    </div>
  )
}
