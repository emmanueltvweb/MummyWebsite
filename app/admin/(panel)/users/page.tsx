"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { format, formatDistanceToNow } from "date-fns"
import {
  Ban,
  Check,
  Copy,
  KeyRound,
  LogOut,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { SearchInput } from "@/components/admin/ui/controls"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { feedback } from "@/components/admin/ui/feedback"
import { BrandButton, EmptyState, Field, inputClass, LoadingButton, PageHeader, Panel, Pill, StatusBadge, TableSkeleton } from "@/components/admin/ui/primitives"
import { toast } from "@/components/admin/ui/toast"
import { api } from "@/lib/admin/api-client"
import { useSubmit } from "@/lib/admin/hooks"
import { SUPER_ADMIN_ROLE } from "@/lib/cms/rbac"
import type { PublicUser, RoleRecord, UserStatus } from "@/lib/cms/types"
import { cn } from "@/lib/utils"

type Row = PublicUser & { roleName: string; postCount: number; activeSessions: number }
type RoleRow = RoleRecord & { userCount: number }
type Form = { name: string; email: string; role: string; status: UserStatus; password: string }

const EMPTY: Form = { name: "", email: "", role: "author", status: "active", password: "" }

function suggestPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  const values = crypto.getRandomValues(new Uint32Array(14))
  const raw = Array.from(values, (v) => alphabet[v % alphabet.length]).join("")
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10)}7`
}

const ROLE_TONE: Record<string, "gold" | "brand" | "sky" | "success" | "neutral"> = {
  super_admin: "gold",
  admin: "brand",
  editor: "sky",
  author: "success",
  moderator: "neutral",
}

export default function UsersPage() {
  const confirm = useConfirm()
  const { user: me, can, isSuperAdmin } = useAuth()
  const manage = can("users.manage")
  const { data, error, isLoading, mutate } = useSWR<Row[]>(can("users.view") ? "/api/admin/users" : null)
  const { data: roleData } = useSWR<{ roles: RoleRow[] }>(can("users.view") ? "/api/admin/roles" : null)
  const roles = roleData?.roles ?? []

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all")
  const [editing, setEditing] = useState<Row | "new" | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [formError, setFormError] = useState("")
  const [suspending, setSuspending] = useState<Row | null>(null)
  const [reason, setReason] = useState("")
  const [tempPassword, setTempPassword] = useState<{ user: Row; password: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const { busy, run } = useSubmit()

  const assignableRoles = useMemo(() => roles.filter((r) => isSuperAdmin || r.id !== SUPER_ADMIN_ROLE), [roles, isSuperAdmin])
  const rows = (data ?? [])
    .filter((u) => roleFilter === "all" || u.role === roleFilter)
    .filter((u) => statusFilter === "all" || u.status === statusFilter)
    .filter((u) => !search || `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()))

  if (!can("users.view")) {
    return <EmptyState icon={ShieldCheck} title="No access" description="Your role doesn't include access to user management." />
  }

  const canTouch = (u: Row) => manage && (isSuperAdmin || u.role !== SUPER_ADMIN_ROLE)

  const open = (row: Row | "new") => {
    setEditing(row)
    setFormError("")
    setForm(row === "new" ? { ...EMPTY, password: suggestPassword() } : { name: row.name, email: row.email, role: row.role, status: row.status, password: "" })
  }

  const save = () =>
    run("save", async ({ showPreloader }) => {
      const isNew = editing === "new"
      if (!form.name.trim() || !form.email.trim()) return setFormError("Name and email are required")
      if (isNew && form.password.length < 10) return setFormError("Password must be at least 10 characters and include a letter and a number")
      showPreloader(isNew ? "Creating account…" : "Saving changes…")
      try {
        const body = isNew ? form : { ...form, password: form.password || undefined }
        const saved = await api<Row>(isNew ? "/api/admin/users" : `/api/admin/users/${(editing as Row).id}`, { method: isNew ? "POST" : "PUT", body })
        await mutate()
        setEditing(null)
        feedback.success(isNew ? "User created" : "User updated", {
          description: isNew
            ? `${saved.email} can sign in now with the password you set. They'll be asked to choose their own password.`
            : `${saved.name}'s account has been updated.`,
        })
      } catch (err) {
        setFormError((err as Error).message)
      }
    })

  const setStatus = (u: Row, status: UserStatus, why?: string) =>
    run(`status-${u.id}`, async ({ showPreloader }) => {
      showPreloader(status === "suspended" ? "Suspending account…" : "Reactivating account…")
      try {
        await api(`/api/admin/users/${u.id}/status`, { body: { status, reason: why || undefined } })
        await mutate()
        setSuspending(null)
        feedback.success(status === "suspended" ? "Account suspended" : "Account reactivated", {
          description: status === "suspended" ? `${u.name} has been signed out everywhere and can't sign in until reactivated.` : `${u.name} can sign in again.`,
        })
      } catch (err) {
        feedback.error("Couldn't update the account", err)
      }
    })

  const resetPassword = async (u: Row) => {
    const ok = await confirm({
      tone: "default",
      title: `Reset ${u.name}'s password?`,
      description: "A temporary password will be generated and they'll be signed out everywhere. They must choose a new password after signing in.",
      confirmText: "Reset password",
    })
    if (!ok) return
    await run(`reset-${u.id}`, async ({ showPreloader }) => {
      showPreloader("Resetting password…")
      try {
        const { temporaryPassword } = await api<{ temporaryPassword: string }>(`/api/admin/users/${u.id}/reset-password`, { method: "POST" })
        await mutate()
        setCopied(false)
        setTempPassword({ user: u, password: temporaryPassword })
      } catch (err) {
        feedback.error("Couldn't reset the password", err)
      }
    })
  }

  const signOutEverywhere = async (u: Row) => {
    const ok = await confirm({ tone: "default", title: `Sign ${u.name} out of all devices?`, description: "They'll need to sign in again on every device.", confirmText: "Sign out everywhere" })
    if (!ok) return
    try {
      const { revoked } = await api<{ revoked: number }>(`/api/admin/users/${u.id}/sessions`, { method: "DELETE" })
      await mutate()
      toast.success(`Signed out of ${revoked} session${revoked === 1 ? "" : "s"}`)
    } catch (err) {
      toast.fromError(err, "Couldn't sign the user out")
    }
  }

  const remove = async (u: Row) => {
    if (!(await confirm({ title: `Delete ${u.name}?`, description: `${u.email} will lose access immediately. Their ${u.postCount} post(s) stay on the site.` }))) return
    try {
      await mutate(
        async (current = []) => {
          await api(`/api/admin/users/${u.id}`, { method: "DELETE" })
          return current.filter((r) => r.id !== u.id)
        },
        { optimisticData: (current = []) => current.filter((r) => r.id !== u.id), rollbackOnError: true, revalidate: false }
      )
      toast.success("User deleted")
    } catch (err) {
      toast.fromError(err, "Couldn't delete user")
    }
  }

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Users"
        description="Manage who can access the dashboard, their roles, and account security."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/roles"><ShieldCheck /> Roles & permissions</Link>
            </Button>
            {manage && <BrandButton onClick={() => open("new")}><UserPlus /> Add user</BrandButton>}
          </>
        }
      />

      {/* Role summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setRoleFilter(roleFilter === role.id ? "all" : role.id)}
            aria-pressed={roleFilter === role.id}
            className={cn(
              "admin-card rounded-2xl bg-admin-surface p-4 text-left transition hover:-translate-y-0.5",
              roleFilter === role.id && "ring-2 ring-admin-brand"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <Pill tone={ROLE_TONE[role.id] ?? "neutral"}>{role.name}</Pill>
              <span className="text-xl font-bold text-admin-text tabular-nums">{role.userCount}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-admin-muted">{role.description || `${role.permissions.length} permissions`}</p>
          </button>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-admin-border/70 p-4 sm:p-5 lg:flex-row lg:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" className="lg:max-w-sm lg:flex-1" />
          <select aria-label="Filter by role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={cn(inputClass, "cursor-pointer lg:w-48")}>
            <option value="all">All roles</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={cn(inputClass, "cursor-pointer lg:w-44")}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {error ? (
          <div className="p-5"><ErrorFallback label="users" message={(error as Error).message} onRetry={() => mutate()} /></div>
        ) : isLoading ? (
          <TableSkeleton rows={4} />
        ) : !rows.length ? (
          <EmptyState icon={Users} title="No users found" description="Try a different search or filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-admin-surface-2 text-left text-xs text-admin-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">User</th>
                  <th scope="col" className="px-3 py-3 font-medium">Role</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell">Last sign-in</th>
                  <th scope="col" className="hidden px-3 py-3 text-right font-medium lg:table-cell">Sessions</th>
                  <th scope="col" className="hidden px-3 py-3 text-right font-medium sm:table-cell">Posts</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/70">
                {rows.map((u) => (
                  <tr key={u.id} className={cn("transition hover:bg-admin-surface-2", u.status === "suspended" && "opacity-75")}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-admin-brand to-admin-sky text-xs font-bold text-white">
                          {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-admin-text">
                            {u.name} {u.id === me?.id && <span className="text-xs font-normal text-admin-muted">(you)</span>}
                          </p>
                          <p className="truncate text-xs text-admin-muted">{u.email}</p>
                          {u.mustChangePassword && <p className="text-[11px] font-medium text-admin-gold-strong">Must change password</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><Pill tone={ROLE_TONE[u.role] ?? "neutral"}>{u.roleName}</Pill></td>
                    <td className="px-3 py-3">
                      <StatusBadge status={u.status} />
                      {u.status === "suspended" && u.suspendedReason && <p className="mt-1 max-w-40 truncate text-[11px] text-admin-muted" title={u.suspendedReason}>{u.suspendedReason}</p>}
                    </td>
                    <td className="hidden px-3 py-3 text-admin-muted md:table-cell">{u.lastLoginAt ? formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true }) : "Never"}</td>
                    <td className="hidden px-3 py-3 text-right tabular-nums lg:table-cell">{u.activeSessions}</td>
                    <td className="hidden px-3 py-3 text-right tabular-nums sm:table-cell">{u.postCount}</td>
                    <td className="px-5 py-3 text-right">
                      {canTouch(u) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="rounded-lg" aria-label={`Actions for ${u.name}`} disabled={!!busy}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-xl">
                            <DropdownMenuItem onSelect={() => open(u)}><Pencil /> Edit & assign role</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => resetPassword(u)}><KeyRound /> Reset password</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => signOutEverywhere(u)} disabled={!u.activeSessions}><LogOut /> Sign out of all devices</DropdownMenuItem>
                            {u.id !== me?.id && (
                              <>
                                <DropdownMenuSeparator />
                                {u.status === "active" ? (
                                  <DropdownMenuItem onSelect={() => (setReason(""), setSuspending(u))}><Ban /> Suspend account</DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onSelect={() => setStatus(u, "active")}><UserCheck /> Reactivate account</DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-admin-danger focus:bg-admin-danger-soft focus:text-admin-danger" onSelect={() => remove(u)}>
                                  <Trash2 className="text-admin-danger" /> Delete user
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Create / edit */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <form onSubmit={(e) => (e.preventDefault(), save())} className="space-y-4" autoComplete="off">
            <DialogHeader>
              <DialogTitle>{editing === "new" ? "Add user" : "Edit user"}</DialogTitle>
              <DialogDescription>
                {editing === "new" ? "They'll be asked to choose their own password the first time they sign in." : editing ? `Member since ${format(new Date(editing.createdAt), "d MMM yyyy")}` : ""}
              </DialogDescription>
            </DialogHeader>
            {formError && <p role="alert" className="rounded-xl bg-admin-danger-soft px-3 py-2 text-sm text-admin-danger">{formError}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="user-name" required>
                <input id="user-name" value={form.name} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Email" htmlFor="user-email" required>
                <input id="user-email" type="email" value={form.email} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
              </Field>
            </div>
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-admin-text">Role</legend>
              <div className="admin-scroll grid max-h-64 gap-2 overflow-y-auto pr-1">
                {assignableRoles.map((role) => (
                  <label
                    key={role.id}
                    htmlFor={`role-${role.id}`}
                    className={cn(
                      "grid cursor-pointer grid-cols-[auto_1fr_auto] gap-x-3 rounded-xl border p-3 transition",
                      form.role === role.id ? "border-admin-brand bg-admin-brand-soft/50" : "border-admin-border hover:bg-admin-surface-2"
                    )}
                  >
                    <input
                      id={`role-${role.id}`}
                      type="radio"
                      name="role"
                      value={role.id}
                      checked={form.role === role.id}
                      disabled={editing !== "new" && editing?.id === me?.id}
                      onChange={() => setForm((f) => ({ ...f, role: role.id }))}
                      className="row-span-2 mt-1 accent-[var(--admin-brand)]"
                    />
                    <span className="text-sm font-semibold text-admin-text">{role.name}</span>
                    <span className="row-span-2 self-center text-xs text-admin-muted tabular-nums">{role.permissions.length} perms</span>
                    <span className="text-xs text-admin-muted">{role.description || (role.system ? "" : "Custom role")}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Field
              label={editing === "new" ? "Password" : "New password"}
              htmlFor="user-password"
              required={editing === "new"}
              hint={editing === "new" ? "Share this securely. They'll be asked to change it." : "Leave blank to keep the current password. Setting one signs them out everywhere."}
            >
              <div className="flex gap-2">
                <input id="user-password" type="text" autoComplete="new-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={cn(inputClass, "font-mono")} />
                <Button type="button" variant="outline" className="h-10 shrink-0 rounded-xl" onClick={() => setForm((f) => ({ ...f, password: suggestPassword() }))}>
                  <RefreshCw /> Generate
                </Button>
              </div>
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditing(null)}>Cancel</Button>
              <LoadingButton type="submit" loading={busy === "save"} className="rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90">
                {editing === "new" ? "Create user" : "Save changes"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Suspend */}
      <Dialog open={!!suspending} onOpenChange={(o) => !o && setSuspending(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <form onSubmit={(e) => (e.preventDefault(), suspending && setStatus(suspending, "suspended", reason))} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Suspend {suspending?.name}?</DialogTitle>
              <DialogDescription>They'll be signed out of every device immediately and won't be able to sign in until you reactivate the account. Nothing they created is deleted.</DialogDescription>
            </DialogHeader>
            <Field label="Reason (optional)" htmlFor="suspend-reason" hint="Visible to other admins in the user list and audit log.">
              <input id="suspend-reason" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} className={inputClass} placeholder="e.g. Left the team" />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setSuspending(null)}>Cancel</Button>
              <LoadingButton type="submit" loading={!!busy} className="rounded-xl bg-admin-danger text-white hover:bg-admin-danger/90"><Ban /> Suspend account</LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Temporary password (shown once) */}
      <Dialog open={!!tempPassword} onOpenChange={(o) => !o && setTempPassword(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Temporary password for {tempPassword?.user.name}</DialogTitle>
            <DialogDescription>Copy it now and share it securely. It won't be shown again. They'll choose a new password after signing in.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-xl border border-admin-border bg-admin-surface-2 p-3">
            <code className="flex-1 font-mono text-lg font-semibold tracking-wide break-all text-admin-text">{tempPassword?.password}</code>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              aria-label="Copy password"
              onClick={async () => {
                await navigator.clipboard.writeText(tempPassword?.password ?? "")
                setCopied(true)
              }}
            >
              {copied ? <Check className="text-admin-success" /> : <Copy />}
            </Button>
          </div>
          <DialogFooter>
            <Button className="rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90" onClick={() => setTempPassword(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
