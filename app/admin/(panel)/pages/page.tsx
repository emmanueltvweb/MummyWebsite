"use client"

import Link from "next/link"
import useSWR from "swr"
import { format } from "date-fns"
import { ExternalLink, FilePlus2, FileText, LayoutTemplate, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { BrandButton, EmptyState, PageHeader, Panel, PanelHeader, Pill, StatusBadge, TableSkeleton } from "@/components/admin/ui/primitives"
import { toast } from "@/components/admin/ui/toast"
import { api } from "@/lib/admin/api-client"
import type { CmsPage } from "@/lib/cms/types"
import { BUILT_IN_PAGES } from "@/lib/content/page-types"

type Row = Omit<CmsPage, "content">

export default function PagesManagement() {
  const confirm = useConfirm()
  const { can } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<Row[]>("/api/admin/pages")

  const remove = async (page: Row) => {
    if (!(await confirm({ title: `Delete “${page.title}”?`, description: `The page at /pages/${page.slug} will stop working.` }))) return
    try {
      await mutate(
        async (rows = []) => {
          await api(`/api/admin/pages/${page.id}`, { method: "DELETE" })
          return rows.filter((r) => r.id !== page.id)
        },
        { optimisticData: (rows = []) => rows.filter((r) => r.id !== page.id), rollbackOnError: true, revalidate: false }
      )
      toast.success("Page deleted")
    } catch (err) {
      toast.fromError(err, "Couldn't delete page")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Pages"
        description="Create standalone pages and manage the content of the website's built-in pages."
        actions={can("website.manage") && <BrandButton asChild><Link href="/admin/pages/new"><FilePlus2 /> New page</Link></BrandButton>}
      />

      <Panel className="overflow-hidden">
        <PanelHeader title="Custom pages" description="Pages you create here are published at /pages/your-page-name." />
        <div className="mt-4">
          {error ? (
            <div className="p-5"><ErrorFallback label="pages" message={(error as Error).message} onRetry={() => mutate()} /></div>
          ) : isLoading ? (
            <TableSkeleton rows={3} />
          ) : !data?.length ? (
            <EmptyState icon={FileText} title="No custom pages yet" description="Great for things like a Statement of Faith, Partnership, or Privacy Policy page." action={can("website.manage") ? { label: "Create a page", href: "/admin/pages/new" } : undefined} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-admin-surface-2 text-left text-xs text-admin-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Title</th>
                    <th scope="col" className="px-3 py-3 font-medium">Status</th>
                    <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell">Last updated</th>
                    <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border/70">
                  {data.map((page) => (
                    <tr key={page.id} className="transition hover:bg-admin-surface-2">
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/pages/${page.id}`} className="font-semibold text-admin-text hover:text-admin-brand">{page.title}</Link>
                        <p className="text-xs text-admin-muted">/pages/{page.slug}</p>
                      </td>
                      <td className="px-3 py-3.5"><StatusBadge status={page.status} /></td>
                      <td className="hidden px-3 py-3.5 text-admin-muted md:table-cell">{format(new Date(page.updatedAt), "d MMM yyyy")} · {page.updatedBy}</td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {page.status === "published" && (
                          <Button asChild variant="ghost" size="icon-sm" className="rounded-lg"><a href={`/pages/${page.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${page.title}`}><ExternalLink /></a></Button>
                        )}
                        {can("website.manage") && (
                          <>
                            <Button asChild variant="ghost" size="icon-sm" className="rounded-lg"><Link href={`/admin/pages/${page.id}`} aria-label={`Edit ${page.title}`}><Pencil /></Link></Button>
                            <Button variant="ghost" size="icon-sm" className="rounded-lg text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" onClick={() => remove(page)} aria-label={`Delete ${page.title}`}><Trash2 /></Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader title="Built-in pages" description="These pages are part of the website design. Click a page to edit its text, images and links." />
        <ul className="mt-4 grid grid-cols-1 divide-y divide-admin-border/70 border-t border-admin-border/70 md:grid-cols-2 md:divide-y-0">
          {BUILT_IN_PAGES.map((page) => (
            <li key={page.key} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-admin-surface-2 md:border-b md:border-admin-border/70 md:odd:border-r">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-admin-brand-soft text-admin-brand"><LayoutTemplate className="size-4" /></span>
              <Link href={`/admin/pages/site/${page.key}`} className="min-w-0 flex-1">
                <p className="truncate font-medium text-admin-text hover:text-admin-brand">{page.title}</p>
                <p className="truncate text-xs text-admin-muted">{page.path} · {page.description}</p>
              </Link>
              <Pill tone="success" dot>Live</Pill>
              <Button asChild variant="ghost" size="icon-sm" className="rounded-lg"><a href={page.path} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${page.title}`}><ExternalLink /></a></Button>
              <Button asChild variant="ghost" size="icon-sm" className="rounded-lg">
                <Link href={`/admin/pages/site/${page.key}`} aria-label={`${can("website.manage") ? "Edit" : "View"} ${page.title}`}><Pencil /></Link>
              </Button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
