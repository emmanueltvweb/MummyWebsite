"use client"

import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import { FolderPlus, FolderTree, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { SearchInput } from "@/components/admin/ui/controls"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { BrandButton, EmptyState, Field, inputClass, LoadingButton, PageHeader, Panel, TableSkeleton } from "@/components/admin/ui/primitives"
import { toast } from "@/components/admin/ui/toast"
import { feedback } from "@/components/admin/ui/feedback"
import { api } from "@/lib/admin/api-client"
import { slugifyClient, useSubmit } from "@/lib/admin/hooks"
import type { Category } from "@/lib/cms/types"
import { cn } from "@/lib/utils"

type Row = Category & { postCount: number }

const SWATCHES = ["#1b2552", "#2f4a8a", "#4f9bd9", "#d4a017", "#b7791f", "#15803d", "#b91c1c", "#7c3aed", "#be185d", "#0f766e"]
const EMPTY = { name: "", slug: "", description: "", color: SWATCHES[0] }

export default function CategoriesPage() {
  const confirm = useConfirm()
  const { can } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<Row[]>("/api/admin/categories")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Row | "new" | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [slugTouched, setSlugTouched] = useState(false)
  const [formError, setFormError] = useState("")
  const { busy, run } = useSubmit()

  const open = (row: Row | "new") => {
    setEditing(row)
    setFormError("")
    setSlugTouched(row !== "new")
    setForm(row === "new" ? EMPTY : { name: row.name, slug: row.slug, description: row.description, color: row.color })
  }

  const save = () =>
    run("save", async ({ showPreloader }) => {
      if (!form.name.trim()) return setFormError("Name is required")
      const isNew = editing === "new"
      showPreloader(isNew ? "Creating category…" : "Saving category…")
      try {
        const saved = await api<Row>(isNew ? "/api/admin/categories" : `/api/admin/categories/${(editing as Row).id}`, {
          method: isNew ? "POST" : "PUT",
          body: form,
        })
        await mutate(
          (rows = []) =>
            (isNew ? [...rows, saved] : rows.map((r) => (r.id === saved.id ? { ...saved, postCount: r.postCount } : r))).sort((a, b) =>
              a.name.localeCompare(b.name)
            ),
          { revalidate: false }
        )
        setEditing(null)
        feedback.success(isNew ? "Category created" : "Category updated", { description: `“${saved.name}” is ready to use on your posts.` })
      } catch (err) {
        setFormError((err as Error).message)
      }
    })

  const remove = async (row: Row) => {
    const ok = await confirm({
      title: `Delete “${row.name}”?`,
      description: row.postCount
        ? `${row.postCount} post(s) use this category. They won't be deleted — they'll just no longer be in this category.`
        : "This category isn't used by any posts.",
    })
    if (!ok) return
    try {
      await mutate(
        async (rows = []) => {
          await api(`/api/admin/categories/${row.id}`, { method: "DELETE" })
          return rows.filter((r) => r.id !== row.id)
        },
        { optimisticData: (rows = []) => rows.filter((r) => r.id !== row.id), rollbackOnError: true, revalidate: false }
      )
      toast.success("Category deleted")
    } catch (err) {
      toast.fromError(err, "Couldn't delete category")
    }
  }

  const rows = (data ?? []).filter((r) => !search || `${r.name} ${r.description}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <PageHeader
        icon={FolderTree}
        title="Categories"
        description="Group related posts so readers can browse topics on the blog."
        actions={can("categories.manage") && <BrandButton onClick={() => open("new")}><FolderPlus /> New category</BrandButton>}
      />

      <Panel className="overflow-hidden">
        <div className="border-b border-admin-border/70 p-4 sm:p-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search categories…" className="max-w-sm" />
        </div>
        {error ? (
          <div className="p-5"><ErrorFallback label="category list" message={(error as Error).message} onRetry={() => mutate()} /></div>
        ) : isLoading ? (
          <TableSkeleton rows={4} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title={search ? "No matching categories" : "No categories yet"}
            description={search ? "Try another search term." : "Create categories like “Devotionals” or “Ministry News” to organise your posts."}
            action={!search && can("categories.manage") ? { label: "Create a category", onClick: () => open("new") } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-admin-surface-2 text-left text-xs text-admin-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Name</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell">Description</th>
                  <th scope="col" className="px-3 py-3 font-medium">Slug</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Posts</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/70">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-admin-surface-2">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-3 font-semibold text-admin-text">
                        <span className="size-3 shrink-0 rounded-full ring-4" style={{ background: row.color, ["--tw-ring-color" as string]: `${row.color}26` }} />
                        {row.name}
                      </span>
                    </td>
                    <td className="hidden max-w-xs truncate px-3 py-3.5 text-admin-muted md:table-cell">{row.description || "—"}</td>
                    <td className="px-3 py-3.5 font-mono text-xs text-admin-muted">{row.slug}</td>
                    <td className="px-3 py-3.5 text-right">
                      <Link href={`/admin/posts?category=${row.id}`} className="font-semibold text-admin-brand tabular-nums hover:underline">{row.postCount}</Link>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {can("categories.manage") && (
                        <>
                          <Button variant="ghost" size="icon-sm" className="rounded-lg" onClick={() => open(row)} aria-label={`Edit ${row.name}`}><Pencil /></Button>
                          <Button variant="ghost" size="icon-sm" className="rounded-lg text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" onClick={() => remove(row)} aria-label={`Delete ${row.name}`}><Trash2 /></Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <form onSubmit={(e) => (e.preventDefault(), save())} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing === "new" ? "New category" : "Edit category"}</DialogTitle>
              <DialogDescription>Categories appear as filters on the public blog.</DialogDescription>
            </DialogHeader>
            {formError && <p role="alert" className="rounded-xl bg-admin-danger-soft px-3 py-2 text-sm text-admin-danger">{formError}</p>}
            <Field label="Name" htmlFor="cat-name" required>
              <input
                id="cat-name"
                value={form.name}
                maxLength={80}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugifyClient(e.target.value) }))}
                className={inputClass}
              />
            </Field>
            <Field label="Slug" htmlFor="cat-slug" hint={`Used in links: /blog?category=${form.slug || "…"}`}>
              <input id="cat-slug" value={form.slug} onChange={(e) => (setSlugTouched(true), setForm((f) => ({ ...f, slug: slugifyClient(e.target.value) })))} className={cn(inputClass, "font-mono")} />
            </Field>
            <Field label="Description" htmlFor="cat-desc">
              <textarea id="cat-desc" rows={3} maxLength={500} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={cn(inputClass, "h-auto py-2.5")} />
            </Field>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-admin-text">Colour</legend>
              <div className="flex flex-wrap items-center gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={cn("size-8 rounded-full transition hover:scale-110", form.color === c && "ring-2 ring-admin-text ring-offset-2 ring-offset-admin-surface")}
                    style={{ background: c }}
                    aria-label={`Colour ${c}`}
                    aria-pressed={form.color === c}
                  />
                ))}
                <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="size-8 cursor-pointer rounded-full border border-admin-border" aria-label="Custom colour" />
              </div>
            </fieldset>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditing(null)}>Cancel</Button>
              <LoadingButton type="submit" loading={busy === "save"} className="rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90">
                {editing === "new" ? "Create category" : "Save changes"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
