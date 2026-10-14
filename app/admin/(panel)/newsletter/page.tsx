"use client"

import Link from "next/link"
import useSWR from "swr"
import { format } from "date-fns"
import { Eye, Mail, MailCheck, MousePointerClick, Pencil, Send, Trash2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { BrandButton, EmptyState, PageHeader, Panel, StatusBadge, TableSkeleton } from "@/components/admin/ui/primitives"
import { StatCard } from "@/components/admin/ui/stat-card"
import { toast } from "@/components/admin/ui/toast"
import { api } from "@/lib/admin/api-client"
import type { Campaign } from "@/lib/cms/types"

type Row = Omit<Campaign, "content" | "opens" | "clicks" | "links"> & { openCount: number; clickCount: number }

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0)

export default function NewsletterPage() {
  const confirm = useConfirm()
  const { can } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<{ items: Row[]; activeSubscribers: number }>("/api/admin/campaigns", {
    refreshInterval: (latest) => (latest?.items.some((c) => c.status === "sending") ? 3000 : 0),
  })

  const items = data?.items ?? []
  const sent = items.filter((c) => c.status === "sent")
  const delivered = sent.reduce((s, c) => s + c.delivered, 0)

  const remove = async (c: Row) => {
    if (!(await confirm({ title: `Delete “${c.subject}”?`, description: c.status === "sent" ? "Its delivery and engagement stats will be lost." : "This draft will be deleted." }))) return
    try {
      await mutate(
        async (cur) => {
          await api(`/api/admin/campaigns/${c.id}`, { method: "DELETE" })
          return cur && { ...cur, items: cur.items.filter((x) => x.id !== c.id) }
        },
        { optimisticData: (cur) => cur! && { ...cur!, items: cur!.items.filter((x) => x.id !== c.id) }, rollbackOnError: true, revalidate: false }
      )
      toast.success("Campaign deleted")
    } catch (err) {
      toast.fromError(err, "Couldn't delete campaign")
    }
  }

  return (
    <div>
      <PageHeader
        icon={Mail}
        title="Newsletter"
        description="Write and send email campaigns to your subscribers, then track opens and clicks."
        actions={can("newsletter.manage") && <BrandButton asChild><Link href="/admin/newsletter/new"><Send /> New campaign</Link></BrandButton>}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard size="sm" label="Active subscribers" value={data?.activeSubscribers ?? null} icon={Users} tone="gold" />
        <StatCard size="sm" label="Campaigns sent" value={data ? sent.length : null} icon={Send} tone="brand" />
        <StatCard size="sm" label="Average open rate" value={data ? pct(sent.reduce((s, c) => s + c.openCount, 0), delivered) : null} suffix="%" decimals={1} icon={Eye} tone="sky" />
        <StatCard size="sm" label="Average click rate" value={data ? pct(sent.reduce((s, c) => s + c.clickCount, 0), delivered) : null} suffix="%" decimals={1} icon={MousePointerClick} tone="success" />
      </div>

      <Panel className="overflow-hidden">
        {error ? (
          <div className="p-5"><ErrorFallback label="campaigns" message={(error as Error).message} onRetry={() => mutate()} /></div>
        ) : isLoading ? (
          <TableSkeleton rows={4} />
        ) : items.length === 0 ? (
          <EmptyState icon={Mail} title="No campaigns yet" description="Share news, event invitations or a weekly devotional with everyone on your list." action={can("newsletter.manage") ? { label: "Create your first campaign", href: "/admin/newsletter/new" } : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-admin-surface-2 text-left text-xs text-admin-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Campaign</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="hidden px-3 py-3 text-right font-medium md:table-cell">Delivered</th>
                  <th scope="col" className="hidden px-3 py-3 text-right font-medium md:table-cell">Opens</th>
                  <th scope="col" className="hidden px-3 py-3 text-right font-medium md:table-cell">Clicks</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/70">
                {items.map((c) => (
                  <tr key={c.id} className="transition hover:bg-admin-surface-2">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/newsletter/${c.id}`} className="font-semibold text-admin-text hover:text-admin-brand">{c.subject}</Link>
                      <p className="text-xs text-admin-muted">{c.sentAt ? `Sent ${format(new Date(c.sentAt), "d MMM yyyy, HH:mm")}` : `Created ${format(new Date(c.createdAt), "d MMM yyyy")}`} · {c.createdBy}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={c.status} />
                      {c.status === "sending" && <p className="mt-1 text-xs text-admin-muted tabular-nums">{c.delivered + c.failed}/{c.recipients}</p>}
                    </td>
                    <td className="hidden px-3 py-3.5 text-right tabular-nums md:table-cell">
                      {c.status === "draft" ? "—" : <><span className="font-semibold">{c.delivered}</span><span className="text-admin-muted">/{c.recipients}</span></>}
                    </td>
                    <td className="hidden px-3 py-3.5 text-right tabular-nums md:table-cell">{c.status === "draft" ? "—" : <><span className="font-semibold">{pct(c.openCount, c.delivered)}%</span> <span className="text-xs text-admin-muted">({c.openCount})</span></>}</td>
                    <td className="hidden px-3 py-3.5 text-right tabular-nums md:table-cell">{c.status === "draft" ? "—" : <><span className="font-semibold">{pct(c.clickCount, c.delivered)}%</span> <span className="text-xs text-admin-muted">({c.clickCount})</span></>}</td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Button asChild variant="ghost" size="icon-sm" className="rounded-lg">
                        <Link href={`/admin/newsletter/${c.id}`} aria-label={c.status === "draft" ? `Edit ${c.subject}` : `View report for ${c.subject}`}>{c.status === "draft" ? <Pencil /> : <MailCheck />}</Link>
                      </Button>
                      {can("newsletter.manage") && c.status !== "sending" && (
                        <Button variant="ghost" size="icon-sm" className="rounded-lg text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" onClick={() => remove(c)} aria-label={`Delete ${c.subject}`}><Trash2 /></Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
