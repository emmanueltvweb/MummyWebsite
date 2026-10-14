"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR, { useSWRConfig } from "swr"
import { formatDistanceToNow } from "date-fns"
import { Check, Clock, ExternalLink, MessageSquare, ShieldAlert, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { PaginationBar, SearchInput, SegmentedTabs } from "@/components/admin/ui/controls"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { EmptyState, FullPageSpinner, LoadingButton, PageHeader, Panel, StatusBadge, TableSkeleton } from "@/components/admin/ui/primitives"
import { toast } from "@/components/admin/ui/toast"
import { api } from "@/lib/admin/api-client"
import { useSubmit } from "@/lib/admin/hooks"
import type { Comment, CommentStatus, Paginated } from "@/lib/cms/types"
import { cn } from "@/lib/utils"

type Row = Omit<Comment, "ip"> & { post: { title: string; slug: string } | null }
type Action = "approve" | "pending" | "spam" | "delete"
type Filter = CommentStatus | "all"

function CommentsModeration() {
  const params = useSearchParams()
  const confirm = useConfirm()
  const { can } = useAuth()
  const { mutate: globalMutate } = useSWRConfig()
  const { busy, run } = useSubmit()
  const [status, setStatus] = useState<Filter>((params.get("status") as Filter) || "all")
  const [search, setSearch] = useState(params.get("search") ?? "")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const key = `/api/admin/comments?status=${status}&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ""}`
  const { data, error, isLoading, mutate } = useSWR<Paginated<Row> & { counts: Record<Filter, number> }>(key, { keepPreviousData: true })

  const moderate = (action: Action, ids: string[]) =>
    run(`${action}`, async () => {
      if (action === "delete") {
        const ok = await confirm({ title: ids.length > 1 ? `Delete ${ids.length} comments?` : "Delete this comment?", description: "Deleted comments can't be recovered." })
        if (!ok) return
      }
      const idSet = new Set(ids)
      const nextStatus: CommentStatus | null = action === "approve" ? "approved" : action === "delete" ? null : action
      try {
        await mutate(
          async (current) => {
            await api("/api/admin/comments", { body: { ids, action } })
            return current
          },
          {
            optimisticData: (current) => ({
                ...current!,
                items: current!.items
                  .map((c) => (idSet.has(c.id) && nextStatus ? { ...c, status: nextStatus } : c))
                  .filter((c) => !(idSet.has(c.id) && (!nextStatus || (status !== "all" && nextStatus !== status)))),
              }),
            rollbackOnError: true,
            revalidate: true,
          }
        )
        setSelected(new Set())
        globalMutate((k) => typeof k === "string" && (k.startsWith("/api/admin/comments") || k.startsWith("/api/admin/stats")))
        const verb = { approve: "Approved", pending: "Marked as pending", spam: "Marked as spam", delete: "Deleted" }[action]
        toast.success(`${verb} ${ids.length} comment${ids.length === 1 ? "" : "s"}`)
      } catch (err) {
        toast.fromError(err, "Moderation failed")
      }
    })

  const items = data?.items ?? []
  const allSelected = items.length > 0 && items.every((c) => selected.has(c.id))
  const editor = can("comments.moderate")

  const ActionButton = ({ label, icon: Icon, onClick, className }: { label: string; icon: typeof Check; onClick: () => void; className?: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" className={cn("rounded-lg", className)} onClick={onClick} aria-label={label} disabled={!!busy}>
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )

  return (
    <div>
      <PageHeader icon={MessageSquare} title="Comments" description="Review what readers are saying and keep discussions healthy." />
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-admin-border/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <SegmentedTabs
            ariaLabel="Filter comments"
            value={status}
            onChange={(v) => (setStatus(v), setPage(1), setSelected(new Set()))}
            options={[
              { value: "all", label: "All", count: data?.counts.all },
              { value: "pending", label: "Pending", count: data?.counts.pending },
              { value: "approved", label: "Approved", count: data?.counts.approved },
              { value: "spam", label: "Spam", count: data?.counts.spam },
            ]}
          />
          <SearchInput value={search} onChange={(v) => (setSearch(v), setPage(1))} placeholder="Search by author or text…" className="lg:w-72" />
        </div>

        {selected.size > 0 && editor && (
          <div className="admin-rise flex flex-wrap items-center gap-2 border-b border-admin-border/70 bg-admin-brand-soft/60 px-5 py-2.5">
            <span className="mr-2 text-sm font-semibold text-admin-brand">{selected.size} selected</span>
            <LoadingButton size="sm" variant="outline" className="rounded-lg" loading={busy === "approve"} disabled={!!busy} onClick={() => moderate("approve", [...selected])}><Check /> Approve</LoadingButton>
            <LoadingButton size="sm" variant="outline" className="rounded-lg" loading={busy === "pending"} disabled={!!busy} onClick={() => moderate("pending", [...selected])}><Clock /> Pending</LoadingButton>
            <LoadingButton size="sm" variant="outline" className="rounded-lg" loading={busy === "spam"} disabled={!!busy} onClick={() => moderate("spam", [...selected])}><ShieldAlert /> Spam</LoadingButton>
            <LoadingButton size="sm" variant="outline" className="rounded-lg border-admin-danger/40 text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" loading={busy === "delete"} disabled={!!busy} onClick={() => moderate("delete", [...selected])}><Trash2 /> Delete</LoadingButton>
          </div>
        )}

        {error ? (
          <div className="p-5"><ErrorFallback label="comments" message={(error as Error).message} onRetry={() => mutate()} /></div>
        ) : isLoading && !data ? (
          <TableSkeleton rows={5} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={search ? "No matching comments" : status === "pending" ? "Nothing awaiting review" : "No comments here"}
            description={status === "pending" && !search ? "You're all caught up. New comments will appear here for approval." : "Comments from blog readers will show up here."}
          />
        ) : (
          <ul className="divide-y divide-admin-border/70">
            {editor && (
              <li className="flex items-center gap-3 bg-admin-surface-2 px-5 py-2.5 text-xs text-admin-muted">
                <input type="checkbox" aria-label="Select all comments" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((c) => c.id)))} className="size-4 accent-[var(--admin-brand)]" />
                Select all on this page
              </li>
            )}
            {items.map((c) => (
              <li key={c.id} className={cn("flex gap-3 px-5 py-4 transition", selected.has(c.id) ? "bg-admin-brand-soft/40" : "hover:bg-admin-surface-2")}>
                {editor && (
                  <input
                    type="checkbox"
                    aria-label={`Select comment by ${c.authorName}`}
                    checked={selected.has(c.id)}
                    onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n })}
                    className="mt-3 size-4 shrink-0 accent-[var(--admin-brand)]"
                  />
                )}
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-admin-gold to-admin-gold-strong font-bold text-[oklch(0.2_0.05_265)]">
                  {c.authorName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-admin-text">{c.authorName}</span>
                    <span className="text-xs text-admin-muted">{c.authorEmail}</span>
                    <StatusBadge status={c.status} />
                    <span className="text-xs text-admin-muted">· {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-admin-text">{c.content}</p>
                  {c.post && (
                    <a href={`/blog/${c.post.slug}#comments-heading`} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-admin-brand hover:underline">
                      on “{c.post.title}” <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                {editor && (
                  <div className="flex shrink-0 items-start gap-0.5">
                    {c.status !== "approved" && <ActionButton label="Approve" icon={Check} onClick={() => moderate("approve", [c.id])} className="text-admin-success hover:bg-admin-success-soft hover:text-admin-success" />}
                    {c.status !== "spam" && <ActionButton label="Mark as spam" icon={ShieldAlert} onClick={() => moderate("spam", [c.id])} />}
                    {c.status !== "pending" && <ActionButton label="Move to pending" icon={Clock} onClick={() => moderate("pending", [c.id])} />}
                    <ActionButton label="Delete" icon={Trash2} onClick={() => moderate("delete", [c.id])} className="text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {data && <PaginationBar page={data.page} pageCount={data.pageCount} total={data.total} pageSize={data.pageSize} onPage={setPage} noun="comments" />}
      </Panel>
    </div>
  )
}

export default function CommentsPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <CommentsModeration />
    </Suspense>
  )
}
