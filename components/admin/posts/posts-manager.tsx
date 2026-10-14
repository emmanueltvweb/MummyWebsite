"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { format } from "date-fns"
import {
  Archive,
  CalendarClock,
  Copy,
  Eye,
  FilePen,
  FilePlus2,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Newspaper,
  Pencil,
  Rocket,
  Trash2,
  Undo2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { PaginationBar, SearchInput, SegmentedTabs } from "@/components/admin/ui/controls"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { BrandButton, EmptyState, inputClass, LoadingButton, PageHeader, Panel, Skeleton, StatusBadge } from "@/components/admin/ui/primitives"
import { toast } from "@/components/admin/ui/toast"
import { feedback } from "@/components/admin/ui/feedback"
import { api } from "@/lib/admin/api-client"
import { useSubmit } from "@/lib/admin/hooks"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary/optimize"
import { postCoverImage } from "@/lib/cms/cover"
import type { Category, Paginated, Post, PostStatus } from "@/lib/cms/types"
import { cn } from "@/lib/utils"

type StatusFilter = PostStatus | "all"
type BulkAction = "delete" | "publish" | "unpublish" | "draft" | "archive"

interface PostsResponse extends Paginated<Post> {
  counts: Record<StatusFilter, number>
  authors: { id: string; name: string }[]
}

const SECTION_COPY: Record<StatusFilter, { title: string; description: string }> = {
  all: { title: "Blog Posts", description: "Write, organise and publish articles for the website blog." },
  published: { title: "Published Posts", description: "Posts that are live on the public blog right now." },
  draft: { title: "Draft Posts", description: "Work in progress — not visible to visitors." },
  scheduled: { title: "Scheduled Posts", description: "Posts that will go live automatically at their scheduled time." },
  archived: { title: "Archived Posts", description: "Retired posts kept for reference. They're hidden from the blog." },
}

export function PostsManager() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const confirm = useConfirm()
  const { can, user } = useAuth()
  const { mutate: globalMutate } = useSWRConfig()
  const { busy, run } = useSubmit()

  const status = (params.get("status") as StatusFilter) || "all"
  const search = params.get("search") ?? ""
  const category = params.get("category") ?? ""
  const author = params.get("author") ?? ""
  const from = params.get("from") ?? ""
  const to = params.get("to") ?? ""
  const sort = params.get("sort") ?? "newest"
  const page = Number(params.get("page") || 1)

  const [view, setView] = useState<"grid" | "list">("list")
  useEffect(() => {
    try {
      if (localStorage.getItem("admin-posts-view") === "grid") setView("grid")
    } catch {
      // storage unavailable
    }
  }, [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(!!(category || author || from || to))

  const query = new URLSearchParams({ status, sort, page: String(page), pageSize: view === "grid" ? "12" : "15" })
  if (search) query.set("search", search)
  if (category) query.set("category", category)
  if (author) query.set("author", author)
  if (from) query.set("from", from)
  if (to) query.set("to", to)
  const key = `/api/admin/posts?${query}`

  const { data, error, isLoading, mutate } = useSWR<PostsResponse>(key, { keepPreviousData: true })
  const { data: categories } = useSWR<Category[]>("/api/admin/categories")
  const categoryName = useMemo(() => new Map(categories?.map((c) => [c.id, c]) ?? []), [categories])

  const setParam = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "" || (k === "status" && v === "all") || (k === "sort" && v === "newest")) next.delete(k)
      else next.set(k, v)
    }
    if (!("page" in updates)) next.delete("page")
    setSelected(new Set())
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false })
  }

  const changeView = (v: "grid" | "list") => {
    setView(v)
    try {
      localStorage.setItem("admin-posts-view", v)
    } catch {
      // ignore
    }
  }

  const refreshAll = () => globalMutate((k) => typeof k === "string" && (k.startsWith("/api/admin/posts") || k.startsWith("/api/admin/stats")))

  /** Optimistically applies a change to the visible list, then syncs with the server. */
  const bulk = (action: BulkAction, ids: string[]) =>
    run(`bulk-${action}`, async ({ showPreloader }) => {
      if (!ids.length) return
      if (action === "delete") {
        const ok = await confirm({
          title: ids.length === 1 ? "Delete this post?" : `Delete ${ids.length} posts?`,
          description: "This permanently removes the post(s) and their comments. This can't be undone.",
          confirmText: "Delete permanently",
        })
        if (!ok) return
      } else {
        showPreloader({ publish: "Publishing…", unpublish: "Unpublishing…", draft: "Moving to drafts…", archive: "Archiving…" }[action])
      }
      const nextStatus: Record<Exclude<BulkAction, "delete">, PostStatus> = { publish: "published", unpublish: "draft", draft: "draft", archive: "archived" }
      const idSet = new Set(ids)
      await mutate(
        async (current) => {
          await api("/api/admin/posts/bulk", { body: { ids, action } })
          return current
        },
        {
          optimisticData: (current) => ({
              ...current!,
              items:
                action === "delete"
                  ? current!.items.filter((p) => !idSet.has(p.id))
                  : current!.items
                      .map((p) => (idSet.has(p.id) ? { ...p, status: nextStatus[action] } : p))
                      .filter((p) => status === "all" || p.status === status),
            }),
          rollbackOnError: true,
          revalidate: true,
        }
      )
        .then(() => {
          const noun = `${ids.length} post${ids.length === 1 ? "" : "s"}`
          if (action === "delete") {
            toast.success(`Deleted ${noun}`)
          } else {
            const copy = {
              publish: { title: ids.length === 1 ? "Post published!" : "Posts published!", description: `${noun} ${ids.length === 1 ? "is" : "are"} now live on the blog.` },
              unpublish: { title: "Unpublished", description: `${noun} moved back to drafts and removed from the blog.` },
              draft: { title: "Moved to drafts", description: `${noun} moved to drafts.` },
              archive: { title: "Archived", description: `${noun} archived and hidden from the blog.` },
            }[action]
            feedback.success(copy.title, { description: copy.description, celebrate: action === "publish" })
          }
          setSelected(new Set())
          refreshAll()
        })
        .catch((err) => (action === "delete" ? toast.fromError(err, "Delete failed") : feedback.error("Bulk action failed", err)))
    })

  const duplicate = (post: Post) =>
    run(`dup-${post.id}`, async () => {
      try {
        const copy = await api<Post>(`/api/admin/posts/${post.id}/duplicate`, { method: "POST" })
        toast.success("Post duplicated", `“${copy.title}” was saved as a draft.`)
        refreshAll()
      } catch (err) {
        toast.fromError(err, "Couldn't duplicate post")
      }
    })

  const items = data?.items ?? []
  const allSelected = items.length > 0 && items.every((p) => selected.has(p.id))
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const canEdit = (post: Post) => can("blog.edit_any") || (can("blog.create") && post.authorId === user?.id)
  const hasFilters = !!(search || category || author || from || to)
  const copy = SECTION_COPY[status] ?? SECTION_COPY.all

  const rowActions = (post: Post) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="rounded-lg" aria-label={`Actions for ${post.title}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        {canEdit(post) && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/posts/${post.id}`}><Pencil /> Edit</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <a href={post.status === "published" ? `/blog/${post.slug}` : `/blog/preview/${post.id}`} target="_blank" rel="noopener noreferrer">
            <Eye /> {post.status === "published" ? "View live" : "Preview"}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => duplicate(post)}>
          <Copy /> Duplicate
        </DropdownMenuItem>
        {can("blog.publish") && (
          <>
            <DropdownMenuSeparator />
            {post.status !== "published" && (
              <DropdownMenuItem onSelect={() => bulk("publish", [post.id])}><Rocket /> Publish now</DropdownMenuItem>
            )}
            {post.status === "published" && (
              <DropdownMenuItem onSelect={() => bulk("unpublish", [post.id])}><Undo2 /> Unpublish</DropdownMenuItem>
            )}
            {post.status !== "archived" && (
              <DropdownMenuItem onSelect={() => bulk("archive", [post.id])}><Archive /> Archive</DropdownMenuItem>
            )}
          </>
        )}
        {can("blog.delete") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-admin-danger focus:bg-admin-danger-soft focus:text-admin-danger" onSelect={() => bulk("delete", [post.id])}>
              <Trash2 className="text-admin-danger" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const dateLabel = (post: Post) =>
    post.status === "scheduled" && post.scheduledAt
      ? `Goes live ${format(new Date(post.scheduledAt), "d MMM yyyy, HH:mm")}`
      : format(new Date(post.publishedAt ?? post.updatedAt), "d MMM yyyy")

  return (
    <div>
      <PageHeader
        icon={Newspaper}
        title={copy.title}
        description={copy.description}
        actions={
          <BrandButton asChild>
            <Link href="/admin/posts/new"><FilePlus2 /> New post</Link>
          </BrandButton>
        }
      />

      <Panel className="overflow-hidden">
        {/* Toolbar */}
        <div className="space-y-4 border-b border-admin-border/70 p-4 sm:p-5">
          <SegmentedTabs
            ariaLabel="Filter by status"
            value={status}
            onChange={(v) => setParam({ status: v })}
            options={[
              { value: "all", label: "All", count: data?.counts.all },
              { value: "published", label: "Published", count: data?.counts.published },
              { value: "draft", label: "Drafts", count: data?.counts.draft },
              { value: "scheduled", label: "Scheduled", count: data?.counts.scheduled },
              { value: "archived", label: "Archived", count: data?.counts.archived },
            ]}
          />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput value={search} onChange={(v) => setParam({ search: v })} placeholder="Search posts by title, tag or author…" className="lg:max-w-sm lg:flex-1" />
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <Button variant="outline" className={cn("rounded-xl", showFilters && "border-admin-brand text-admin-brand")} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
                <Filter /> Filters
                {hasFilters && <span className="size-2 rounded-full bg-admin-gold" />}
              </Button>
              <select aria-label="Sort posts" value={sort} onChange={(e) => setParam({ sort: e.target.value })} className={cn(inputClass, "w-auto cursor-pointer")}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="views">Most viewed</option>
                <option value="title">Alphabetical</option>
              </select>
              <div className="flex rounded-xl bg-admin-subtle p-1" role="radiogroup" aria-label="Layout">
                {([
                  ["list", List],
                  ["grid", LayoutGrid],
                ] as const).map(([v, Icon]) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={view === v}
                    aria-label={`${v} view`}
                    onClick={() => changeView(v)}
                    className={cn("rounded-lg p-1.5 transition", view === v ? "bg-admin-surface text-admin-brand shadow-sm" : "text-admin-muted hover:text-admin-text")}
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="admin-rise grid grid-cols-1 gap-3 rounded-xl bg-admin-surface-2 p-3 sm:grid-cols-2 lg:grid-cols-5">
              <select aria-label="Filter by category" value={category} onChange={(e) => setParam({ category: e.target.value })} className={cn(inputClass, "cursor-pointer")}>
                <option value="">All categories</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select aria-label="Filter by author" value={author} onChange={(e) => setParam({ author: e.target.value })} className={cn(inputClass, "cursor-pointer")}>
                <option value="">All authors</option>
                {data?.authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input type="date" aria-label="From date" value={from} onChange={(e) => setParam({ from: e.target.value })} className={inputClass} />
              <input type="date" aria-label="To date" value={to} onChange={(e) => setParam({ to: e.target.value })} className={inputClass} />
              <Button variant="ghost" className="rounded-xl" disabled={!hasFilters} onClick={() => setParam({ search: null, category: null, author: null, from: null, to: null })}>
                <X /> Clear filters
              </Button>
            </div>
          )}
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && (
          <div className="admin-rise flex flex-wrap items-center gap-2 border-b border-admin-border/70 bg-admin-brand-soft/60 px-4 py-2.5 sm:px-5">
            <span className="mr-2 text-sm font-semibold text-admin-brand">{selected.size} selected</span>
            {can("blog.publish") && (
              <>
                <LoadingButton size="sm" variant="outline" className="rounded-lg" loading={busy === "bulk-publish"} disabled={!!busy} onClick={() => bulk("publish", [...selected])}><Rocket /> Publish</LoadingButton>
                <LoadingButton size="sm" variant="outline" className="rounded-lg" loading={busy === "bulk-unpublish"} disabled={!!busy} onClick={() => bulk("unpublish", [...selected])}><Undo2 /> Unpublish</LoadingButton>
                <LoadingButton size="sm" variant="outline" className="rounded-lg" loading={busy === "bulk-draft"} disabled={!!busy} onClick={() => bulk("draft", [...selected])}><FilePen /> Move to draft</LoadingButton>
                <LoadingButton size="sm" variant="outline" className="rounded-lg" loading={busy === "bulk-archive"} disabled={!!busy} onClick={() => bulk("archive", [...selected])}><Archive /> Archive</LoadingButton>
              </>
            )}
            {can("blog.delete") && (
              <>
                <LoadingButton size="sm" variant="outline" className="rounded-lg border-admin-danger/40 text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" loading={busy === "bulk-delete"} disabled={!!busy} onClick={() => bulk("delete", [...selected])}><Trash2 /> Delete</LoadingButton>
              </>
            )}
            <Button size="sm" variant="ghost" className="ml-auto rounded-lg" onClick={() => setSelected(new Set())}>Clear selection</Button>
          </div>
        )}

        {/* Content */}
        {error ? (
          <div className="p-5"><ErrorFallback label="post list" message={(error as Error).message} onRetry={() => mutate()} /></div>
        ) : isLoading && !data ? (
          view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-3 p-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          )
        ) : items.length === 0 ? (
          hasFilters ? (
            <EmptyState icon={Filter} title="No posts match your filters" description="Try a different search term or clear the filters." action={{ label: "Clear filters", onClick: () => setParam({ search: null, category: null, author: null, from: null, to: null }) }} />
          ) : (
            <EmptyState
              icon={status === "scheduled" ? CalendarClock : Newspaper}
              title={status === "all" ? "No posts yet" : `No ${copy.title.toLowerCase()}`}
              description={status === "all" ? "Create your first blog post — it will appear on the public blog as soon as you publish it." : undefined}
              action={{ label: "Write a post", href: "/admin/posts/new" }}
            />
          )
        ) : view === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-admin-surface-2 text-left text-xs text-admin-muted">
                <tr>
                  <th scope="col" className="w-10 py-3 pl-5">
                    <input type="checkbox" aria-label="Select all posts on this page" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((p) => p.id)))} className="size-4 accent-[var(--admin-brand)]" />
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">Title</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell">Categories</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">Views</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium lg:table-cell">Date</th>
                  <th scope="col" className="py-3 pr-5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/70">
                {items.map((post) => (
                  <tr key={post.id} className={cn("group transition", selected.has(post.id) ? "bg-admin-brand-soft/40" : "hover:bg-admin-surface-2")}>
                    <td className="py-3 pl-5">
                      <input type="checkbox" aria-label={`Select ${post.title}`} checked={selected.has(post.id)} onChange={() => toggle(post.id)} className="size-4 accent-[var(--admin-brand)]" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="hidden size-12 shrink-0 overflow-hidden rounded-lg bg-admin-subtle sm:block">
                          {postCoverImage(post) ? (
                            <img src={optimizeCloudinaryUrl(postCoverImage(post), { width: 120, height: 120, crop: "fill" })} alt="" loading="lazy" className="size-full object-cover" />
                          ) : (
                            <Newspaper className="m-3.5 size-5 text-admin-muted" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <Link href={canEdit(post) ? `/admin/posts/${post.id}` : `/blog/preview/${post.id}`} className="line-clamp-1 font-semibold text-admin-text hover:text-admin-brand">
                            {post.title}
                          </Link>
                          <p className="text-xs text-admin-muted">by {post.authorName} · {post.readingMinutes} min read</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      <div className="flex max-w-[200px] flex-wrap gap-1">
                        {post.categoryIds.slice(0, 2).map((id) => {
                          const c = categoryName.get(id)
                          return c ? <span key={id} className="rounded-md px-1.5 py-0.5 text-xs font-medium" style={{ background: `${c.color}1a`, color: c.color }}>{c.name}</span> : null
                        })}
                        {post.categoryIds.length > 2 && <span className="text-xs text-admin-muted">+{post.categoryIds.length - 2}</span>}
                        {!post.categoryIds.length && <span className="text-xs text-admin-muted">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={post.status} /></td>
                    <td className="hidden px-3 py-3 text-admin-muted tabular-nums sm:table-cell">{post.views.toLocaleString()}</td>
                    <td className="hidden px-3 py-3 whitespace-nowrap text-admin-muted lg:table-cell">{dateLabel(post)}</td>
                    <td className="py-3 pr-5 text-right">{rowActions(post)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((post, index) => (
              <article
                key={post.id}
                className={cn(
                  "group admin-rise relative flex flex-col overflow-hidden rounded-2xl border bg-admin-surface transition duration-300 hover:-translate-y-1 hover:shadow-admin-lg",
                  selected.has(post.id) ? "border-admin-brand ring-2 ring-admin-brand/20" : "border-admin-border/70"
                )}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-admin-subtle">
                  {postCoverImage(post) ? (
                    <img src={optimizeCloudinaryUrl(postCoverImage(post), { width: 640, height: 400, crop: "fill" })} alt={post.featuredImageAlt} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-admin-brand-soft to-admin-gold-soft">
                      <Newspaper className="size-10 text-admin-brand/40" />
                    </div>
                  )}
                  <label className="absolute top-3 left-3 flex size-7 cursor-pointer items-center justify-center rounded-lg bg-white/90 shadow">
                    <input type="checkbox" aria-label={`Select ${post.title}`} checked={selected.has(post.id)} onChange={() => toggle(post.id)} className="size-4 accent-[var(--admin-brand)]" />
                  </label>
                  <span className="absolute top-3 right-3"><StatusBadge status={post.status} /></span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex flex-wrap gap-1">
                    {post.categoryIds.slice(0, 2).map((id) => {
                      const c = categoryName.get(id)
                      return c ? <span key={id} className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: `${c.color}1a`, color: c.color }}>{c.name}</span> : null
                    })}
                  </div>
                  <Link href={canEdit(post) ? `/admin/posts/${post.id}` : `/blog/preview/${post.id}`} className="line-clamp-2 font-semibold text-admin-text hover:text-admin-brand">
                    {post.title}
                  </Link>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-admin-muted">{post.excerpt || "Excerpt will be generated from the content."}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-admin-border/70 pt-3 text-xs text-admin-muted">
                    <span className="truncate">{dateLabel(post)} · {post.views.toLocaleString()} views</span>
                    {rowActions(post)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {data && (
          <PaginationBar page={data.page} pageCount={data.pageCount} total={data.total} pageSize={data.pageSize} onPage={(p) => setParam({ page: String(p) })} noun="posts" />
        )}
      </Panel>
    </div>
  )
}
