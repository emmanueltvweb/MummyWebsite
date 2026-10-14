"use client"

import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import { Copy, Lock, Plus, ShieldCheck, Trash2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { feedback } from "@/components/admin/ui/feedback"
import { BrandButton, EmptyState, Field, inputClass, LoadingButton, PageHeader, Panel, Pill, Skeleton } from "@/components/admin/ui/primitives"
import { api } from "@/lib/admin/api-client"
import { useSubmit } from "@/lib/admin/hooks"
import { ALL_PERMISSIONS, type Permission, PERMISSION_MODULES } from "@/lib/cms/rbac"
import type { RoleRecord } from "@/lib/cms/types"
import { cn } from "@/lib/utils"

type RoleRow = RoleRecord & { userCount: number }
type Draft = { id?: string; name: string; description: string; permissions: Permission[]; locked?: boolean; system?: boolean }

function PermissionMatrix({ value, onChange, readOnly }: { value: Permission[]; onChange: (next: Permission[]) => void; readOnly?: boolean }) {
  const set = new Set(value)
  const toggle = (p: Permission) => {
    const next = new Set(set)
    if (next.has(p)) next.delete(p)
    else next.add(p)
    // Any action within a module implies being able to view it.
    const [module] = p.split(".")
    if (next.has(p) && !p.endsWith(".view") && ALL_PERMISSIONS.includes(`${module}.view` as Permission)) next.add(`${module}.view` as Permission)
    onChange(ALL_PERMISSIONS.filter((x) => next.has(x)))
  }
  const toggleModule = (keys: Permission[], on: boolean) => {
    const next = new Set(set)
    keys.forEach((k) => (on ? next.add(k) : next.delete(k)))
    onChange(ALL_PERMISSIONS.filter((x) => next.has(x)))
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-admin-border">
      <div className="hidden grid-cols-[200px_1fr] bg-admin-surface-2 px-4 py-2.5 text-xs font-semibold text-admin-muted md:grid">
        <span>Module</span>
        <span>Permissions</span>
      </div>
      <ul className="divide-y divide-admin-border">
        {PERMISSION_MODULES.map((module) => {
          const keys = module.actions.map((a) => `${module.key}.${a.key}` as Permission)
          const granted = keys.filter((k) => set.has(k)).length
          const all = granted === keys.length
          return (
            <li key={module.key} className="grid gap-3 px-4 py-3.5 md:grid-cols-[200px_1fr]">
              <div className="flex items-start justify-between gap-2 md:block">
                <div>
                  <p className="font-semibold text-admin-text">{module.label}</p>
                  <p className="text-xs text-admin-muted">{module.description}</p>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => toggleModule(keys, !all)}
                    className="mt-1 shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold text-admin-brand hover:bg-admin-brand-soft"
                  >
                    {all ? "Clear" : "Select all"}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {module.actions.map((action) => {
                  const key = `${module.key}.${action.key}` as Permission
                  const on = set.has(key)
                  return (
                    <label
                      key={key}
                      htmlFor={`perm-${key}`}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                        on ? "border-admin-brand/40 bg-admin-brand-soft/60 text-admin-text" : "border-admin-border text-admin-muted",
                        readOnly ? "cursor-default" : "cursor-pointer hover:border-admin-brand/40"
                      )}
                    >
                      <input
                        id={`perm-${key}`}
                        type="checkbox"
                        checked={on}
                        disabled={readOnly}
                        onChange={() => toggle(key)}
                        className="size-4 accent-[var(--admin-brand)]"
                      />
                      {action.label}
                    </label>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function RolesPage() {
  const { can } = useAuth()
  const editable = can("users.roles")
  const { data, error, isLoading, mutate } = useSWR<{ roles: RoleRow[] }>(can("users.view") ? "/api/admin/roles" : null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [formError, setFormError] = useState("")
  const [deleting, setDeleting] = useState<RoleRow | null>(null)
  const [reassignTo, setReassignTo] = useState("")
  const { busy, run } = useSubmit()
  const roles = data?.roles ?? []

  if (!can("users.view")) return <EmptyState icon={ShieldCheck} title="No access" description="Your role doesn't include access to roles and permissions." />

  const openRole = (role: RoleRow) => {
    setFormError("")
    setDraft({ id: role.id, name: role.name, description: role.description, permissions: role.permissions, locked: role.locked, system: role.system })
  }
  const newRole = (from?: RoleRow) => {
    setFormError("")
    setDraft({ name: from ? `${from.name} (copy)` : "", description: from?.description ?? "", permissions: from?.permissions ?? ["dashboard.view"] })
  }

  const save = () =>
    run("save", async ({ showPreloader }) => {
      if (!draft) return
      if (draft.name.trim().length < 2) return setFormError("Give the role a name")
      showPreloader(draft.id ? "Saving permissions…" : "Creating role…")
      try {
        const body = { name: draft.name, description: draft.description, permissions: draft.permissions }
        const saved = await api<RoleRecord>(draft.id ? `/api/admin/roles/${draft.id}` : "/api/admin/roles", { method: draft.id ? "PUT" : "POST", body })
        await mutate()
        setDraft(null)
        feedback.success(draft.id ? "Role updated" : "Role created", {
          description: draft.id
            ? `Changes to “${saved.name}” apply immediately to everyone with this role.`
            : `“${saved.name}” is ready. Assign it to people from the Users page.`,
          actions: draft.id ? undefined : [{ label: "Go to Users", href: "/admin/users" }],
        })
      } catch (err) {
        setFormError((err as Error).message)
      }
    })

  const remove = () =>
    run("delete", async ({ showPreloader }) => {
      if (!deleting) return
      if (deleting.userCount && !reassignTo) return
      showPreloader("Deleting role…")
      try {
        await api(`/api/admin/roles/${deleting.id}`, { method: "DELETE", body: { reassignTo: reassignTo || undefined } })
        await mutate()
        setDeleting(null)
        setDraft(null)
        feedback.success("Role deleted", { description: deleting.userCount ? `${deleting.userCount} user(s) were moved to the new role.` : undefined })
      } catch (err) {
        feedback.error("Couldn't delete the role", err)
      }
    })

  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        title="Roles & Permissions"
        description="Decide exactly what each role can see and do. Changes apply instantly to everyone with the role."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/users"><Users /> Users</Link>
            </Button>
            {editable && <BrandButton onClick={() => newRole()}><Plus /> New custom role</BrandButton>}
          </>
        }
      />

      {!editable && (
        <p className="mb-5 rounded-2xl border border-admin-border bg-admin-surface-2 px-4 py-3 text-sm text-admin-muted">
          You can view roles, but only a Super Admin (or a role with “Manage roles & permissions”) can change them.
        </p>
      )}

      {error ? (
        <ErrorFallback label="roles" message={(error as Error).message} onRetry={() => mutate()} />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-3xl" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role, i) => (
            <Panel key={role.id} className="admin-rise flex flex-col p-5" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-admin-text">
                    {role.name}
                    {role.locked && <Lock className="size-4 text-admin-gold-strong" aria-label="Locked" />}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-admin-muted">{role.description || "No description"}</p>
                </div>
                <Pill tone={role.system ? "brand" : "gold"}>{role.system ? "Built-in" : "Custom"}</Pill>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs text-admin-muted">
                  <span>{role.permissions.length} of {ALL_PERMISSIONS.length} permissions</span>
                  <span>{role.userCount} user{role.userCount === 1 ? "" : "s"}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-admin-subtle">
                  <div className="h-full rounded-full bg-gradient-to-r from-admin-teal to-admin-brand transition-all" style={{ width: `${(role.permissions.length / ALL_PERMISSIONS.length) * 100}%` }} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {PERMISSION_MODULES.filter((m) => role.permissions.some((p) => p.startsWith(`${m.key}.`))).map((m) => (
                  <span key={m.key} className="rounded-md bg-admin-subtle px-1.5 py-0.5 text-[11px] font-medium text-admin-muted">{m.label}</span>
                ))}
              </div>

              <div className="mt-auto flex gap-2 pt-5">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => openRole(role)}>
                  {role.locked || !editable ? "View permissions" : "Edit permissions"}
                </Button>
                {editable && (
                  <Button variant="ghost" size="icon" className="rounded-xl" aria-label={`Duplicate ${role.name}`} title="Duplicate as a custom role" onClick={() => newRole(role)}>
                    <Copy />
                  </Button>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Role editor */}
      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="admin-scroll max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-4xl">
          {draft && (
            <form onSubmit={(e) => (e.preventDefault(), save())} className="space-y-5">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {draft.id ? draft.name : "New custom role"}
                  {draft.locked && <Pill tone="gold"><Lock className="size-3" /> Always has every permission</Pill>}
                </DialogTitle>
                <DialogDescription>
                  {draft.locked
                    ? "The Super Admin role can't be restricted, so there's always someone who can manage the site."
                    : "Tick what this role is allowed to do. Giving any action in a module automatically includes viewing it."}
                </DialogDescription>
              </DialogHeader>
              {formError && <p role="alert" className="rounded-xl bg-admin-danger-soft px-3 py-2 text-sm text-admin-danger">{formError}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Role name" htmlFor="role-name" required>
                  <input id="role-name" value={draft.name} maxLength={60} disabled={draft.locked || !editable} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Description" htmlFor="role-desc">
                  <input id="role-desc" value={draft.description} maxLength={240} disabled={draft.locked || !editable} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <PermissionMatrix value={draft.permissions} onChange={(permissions) => setDraft({ ...draft, permissions })} readOnly={draft.locked || !editable} />
              <DialogFooter className="items-center sm:justify-between">
                <div>
                  {editable && draft.id && !draft.system && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger"
                      onClick={() => {
                        setReassignTo("")
                        setDeleting(roles.find((r) => r.id === draft.id) ?? null)
                      }}
                    >
                      <Trash2 /> Delete role
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDraft(null)}>
                    {draft.locked || !editable ? "Close" : "Cancel"}
                  </Button>
                  {editable && !draft.locked && (
                    <LoadingButton type="submit" data-shortcut="save" loading={busy === "save"} className="rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90">
                      {draft.id ? "Save permissions" : "Create role"}
                    </LoadingButton>
                  )}
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete custom role */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
            <DialogDescription>
              {deleting?.userCount
                ? `${deleting.userCount} user(s) have this role. Choose the role they should move to.`
                : "No one has this role, so it can be deleted safely."}
            </DialogDescription>
          </DialogHeader>
          {!!deleting?.userCount && (
            <Field label="Move users to" htmlFor="reassign">
              <select id="reassign" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className={cn(inputClass, "cursor-pointer")}>
                <option value="">Choose a role…</option>
                {roles.filter((r) => r.id !== deleting.id && !r.locked).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleting(null)}>Cancel</Button>
            <LoadingButton loading={busy === "delete"} disabled={!!deleting?.userCount && !reassignTo} onClick={remove} className="rounded-xl bg-admin-danger text-white hover:bg-admin-danger/90">
              <Trash2 /> Delete role
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
