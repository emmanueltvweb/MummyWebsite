"use client"

import { useEffect, useState } from "react"
import { KeyRound, UserRound } from "lucide-react"

import { ActiveSessions } from "@/components/admin/account/active-sessions"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { Field, inputClass, LoadingButton, PageHeader, Panel, PanelBody, PanelHeader, Pill } from "@/components/admin/ui/primitives"
import { feedback } from "@/components/admin/ui/feedback"
import { api } from "@/lib/admin/api-client"
import { useSubmit } from "@/lib/admin/hooks"

function strength(pw: string) {
  let score = 0
  if (pw.length >= 10) score++
  if (pw.length >= 14) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}

export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const { busy, run } = useSubmit()
  const [name, setName] = useState("")
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" })
  const [pwError, setPwError] = useState("")

  useEffect(() => {
    if (user) setName(user.name)
  }, [user])

  const saveName = () =>
    run("name", async ({ showPreloader }) => {
      showPreloader("Saving profile…")
      try {
        await api("/api/auth/profile", { method: "PATCH", body: { name } })
        await refresh()
        feedback.success("Profile updated", { description: "Your new name will appear on posts you write." })
      } catch (err) {
        feedback.error("Couldn't update profile", err)
      }
    })

  const changePassword = () =>
    run("password", async ({ showPreloader }) => {
      setPwError("")
      if (pw.newPassword !== pw.confirm) return setPwError("The new passwords don't match")
      showPreloader("Updating password…")
      try {
        await api("/api/auth/password", { body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword } })
        setPw({ currentPassword: "", newPassword: "", confirm: "" })
        await refresh()
        feedback.success("Password changed", { description: "You've been signed out of all other devices." })
      } catch (err) {
        setPwError((err as Error).message)
      }
    })

  const score = strength(pw.newPassword)
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"]
  const colors = ["bg-admin-danger", "bg-admin-danger", "bg-admin-warning", "bg-admin-sky", "bg-admin-success"]

  return (
    <div className="max-w-3xl">
      <PageHeader icon={UserRound} title="My profile" description="Update your name and password." />
      <div className="space-y-6">
        <Panel>
          <PanelHeader title="Account" />
          <PanelBody>
            <form onSubmit={(e) => (e.preventDefault(), saveName())} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name" htmlFor="profile-name" hint="Shown as the author on posts you write.">
                  <input id="profile-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Email" htmlFor="profile-email" hint="Ask an administrator to change your email.">
                  <input id="profile-email" value={user?.email ?? ""} readOnly className={`${inputClass} bg-admin-surface-2`} />
                </Field>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-admin-muted">Role: <Pill tone="gold">{user?.roleName}</Pill></span>
                <LoadingButton type="submit" loading={busy === "name"} disabled={!name.trim() || name === user?.name} className="rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90">Save</LoadingButton>
              </div>
            </form>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Change password" description="Use at least 10 characters with a mix of letters and numbers." />
          <PanelBody>
            <form onSubmit={(e) => (e.preventDefault(), changePassword())} className="space-y-4">
              {pwError && <p role="alert" className="rounded-xl bg-admin-danger-soft px-3 py-2 text-sm text-admin-danger">{pwError}</p>}
              <Field label="Current password" htmlFor="pw-current">
                <input id="pw-current" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password" htmlFor="pw-new">
                  <input id="pw-new" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} className={inputClass} />
                </Field>
                <Field label="Confirm new password" htmlFor="pw-confirm">
                  <input id="pw-confirm" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} className={inputClass} />
                </Field>
              </div>
              {pw.newPassword && (
                <div aria-live="polite">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-admin-subtle"}`} />)}
                  </div>
                  <p className="mt-1 text-xs text-admin-muted">Strength: {labels[score]}</p>
                </div>
              )}
              <div className="flex justify-end">
                <LoadingButton type="submit" loading={busy === "password"} disabled={!pw.currentPassword || !pw.newPassword} className="rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90">
                  <KeyRound /> Change password
                </LoadingButton>
              </div>
            </form>
          </PanelBody>
        </Panel>

        <ActiveSessions />
      </div>
    </div>
  )
}
