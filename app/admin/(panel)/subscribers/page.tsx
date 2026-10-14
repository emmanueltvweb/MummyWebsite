"use client"

import { Suspense, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import useSWR from "swr"
import { format } from "date-fns"
import { Download, Trash2, Upload, UserRound, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { PaginationBar, SearchInput, SegmentedTabs } from "@/components/admin/ui/controls"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { ImportSubscribersDialog } from "@/components/admin/subscribers/import-dialog"
import { BrandButton, EmptyState, FullPageSpinner, LoadingButton, PageHeader, Panel, StatusBadge, TableSkeleton } from "@/components/admin/ui/primitives"
import { StatCard } from "@/components/admin/ui/stat-card"
import { toast } from "@/components/admin/ui/toast"
import { api } from "@/lib/admin/api-client"
import { useSubmit } from "@/lib/admin/hooks"
import type { Paginated, Subscriber } from "@/lib/cms/types"
import { cn } from "@/lib/utils"

type Row = Omit<Subscriber, "token">
type Filter = "all" | "subscribed" | "unsubscribed"

function SubscribersList() {
  const params = useSearchParams()
  const confirm = useConfirm()
  const { can } = useAuth()
  const { busy, run } = useSubmit()
  const [status, setStatus] = useState<Filter>("all")
  const [search, setSearch] = useState(params.get("search") ?? "")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importOpen, setImportOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // "Import subscribers" in the sidebar links here with ?import=1 — open the dialog, then tidy the URL.
  useEffect(() => {
    if (params.get("import") === "1" && can("subscribers.manage")) {
      setImportOpen(true)
      router.replace(pathname, { scroll: false })
    }
  }, [params, can, router, pathname])

  const query = `status=${status}&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ""}`
  const { data, error, isLoading, mutate } = useSWR<Paginated<Row> & { counts: Record<Filter, number> }>(`/api/admin/subscribers?${query}`, { keepPreviousData: true })
  const { data: stats } = useSWR<{ cards: { newSubscribers: { value: number; trend: number } } }>("/api/admin/stats")

  const remove = (ids: string[]) =>
    run("delete", async () => {
      const ok = await confirm({
        title: ids.length > 1 ? `Remove ${ids.length} subscribers?` : "Remove this subscriber?",
        description: "They'll be deleted from your list and won't receive newsletters. They can sign up again from the website.",
        confirmText: "Remove",
      })
      if (!ok) return
      const idSet = new Set(ids)
      try {
        await mutate(
          async (current) => {
            await api("/api/admin/subscribers", { method: "DELETE", body: { ids } })
            return current
          },
          { optimisticData: (c) => ({ ...c!, items: c!.items.filter((s) => !idSet.has(s.id)) }), rollbackOnError: true, revalidate: true }
        )
        setSelected(new Set())
        toast.success(`Removed ${ids.length} subscriber${ids.length === 1 ? "" : "s"}`)
      } catch (err) {
        toast.fromError(err, "Couldn't remove subscribers")
      }
    })

  const items = data?.items ?? []
  const allSelected = items.length > 0 && items.every((s) => selected.has(s.id))

  return (
    <div>
      <PageHeader
        icon={UserRound}
        title="Email Subscribers"
        description="People who signed up for the newsletter on the website."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <a href={`/api/admin/subscribers?format=csv&status=${status}${search ? `&search=${encodeURIComponent(search)}` : ""}`} download><Download /> Export CSV</a>
            </Button>
            {can("subscribers.manage") && (
              <BrandButton onClick={() => setImportOpen(true)}>
                <Upload /> Import subscribers
              </BrandButton>
            )}
          </>
        }
      />
      <ImportSubscribersDialog open={importOpen} onOpenChange={setImportOpen} onImported={() => mutate()} />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard size="sm" label="Active subscribers" value={data?.counts.subscribed ?? null} icon={Users} tone="success" />
        <StatCard size="sm" label="Unsubscribed" value={data?.counts.unsubscribed ?? null} icon={UserRound} tone="neutral" />
        <StatCard size="sm" label="New in the last 30 days" value={stats?.cards.newSubscribers.value ?? null} trend={stats?.cards.newSubscribers.trend} icon={UserRound} tone="gold" />
      </div>

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-admin-border/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <SegmentedTabs
            ariaLabel="Filter subscribers"
            value={status}
            onChange={(v) => (setStatus(v), setPage(1), setSelected(new Set()))}
            options={[
              { value: "all", label: "All", count: data?.counts.all },
              { value: "subscribed", label: "Subscribed", count: data?.counts.subscribed },
              { value: "unsubscribed", label: "Unsubscribed", count: data?.counts.unsubscribed },
            ]}
          />
          <SearchInput value={search} onChange={(v) => (setSearch(v), setPage(1))} placeholder="Search by email…" className="lg:w-72" />
        </div>

        {selected.size > 0 && can("subscribers.manage") && (
          <div className="admin-rise flex items-center gap-2 border-b border-admin-border/70 bg-admin-brand-soft/60 px-5 py-2.5">
            <span className="text-sm font-semibold text-admin-brand">{selected.size} selected</span>
            <LoadingButton size="sm" variant="outline" className="ml-2 rounded-lg border-admin-danger/40 text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" loading={busy === "delete"} onClick={() => remove([...selected])}>
              <Trash2 /> Remove
            </LoadingButton>
          </div>
        )}

        {error ? (
          <div className="p-5"><ErrorFallback label="subscribers" message={(error as Error).message} onRetry={() => mutate()} /></div>
        ) : isLoading && !data ? (
          <TableSkeleton rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? "No matching subscribers" : "No subscribers yet"}
            description={search ? "Try a different search." : "When visitors join the newsletter from the homepage, they'll appear here. You can also import an existing list."}
            action={!search && can("subscribers.manage") ? { label: "Import subscribers", onClick: () => setImportOpen(true) } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-admin-surface-2 text-left text-xs text-admin-muted">
                <tr>
                  {can("subscribers.manage") && (
                    <th scope="col" className="w-10 py-3 pl-5">
                      <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((s) => s.id)))} className="size-4 accent-[var(--admin-brand)]" />
                    </th>
                  )}
                  <th scope="col" className="px-5 py-3 font-medium">Email</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">Source</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Subscribed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/70">
                {items.map((s) => (
                  <tr key={s.id} className={cn("transition", selected.has(s.id) ? "bg-admin-brand-soft/40" : "hover:bg-admin-surface-2")}>
                    {can("subscribers.manage") && (
                      <td className="py-3 pl-5">
                        <input type="checkbox" aria-label={`Select ${s.email}`} checked={selected.has(s.id)} onChange={() => setSelected((cur) => { const n = new Set(cur); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n })} className="size-4 accent-[var(--admin-brand)]" />
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <p className="font-medium text-admin-text">{s.email}</p>
                      {s.name && <p className="text-xs text-admin-muted">{s.name}</p>}
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={s.status} /></td>
                    <td className="hidden px-3 py-3 text-admin-muted capitalize sm:table-cell">{s.source}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap text-admin-muted">{format(new Date(s.createdAt), "d MMM yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <PaginationBar page={data.page} pageCount={data.pageCount} total={data.total} pageSize={data.pageSize} onPage={setPage} noun="subscribers" />}
      </Panel>
    </div>
  )
}

export default function SubscribersPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <SubscribersList />
    </Suspense>
  )
}
