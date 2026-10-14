import "server-only"

import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "crypto"
import { promisify } from "util"
import { cookies, headers } from "next/headers"

import { ALL_PERMISSIONS, LEGACY_ROLE_MAP, SUPER_ADMIN_ROLE, type Permission } from "@/lib/cms/rbac"
import { roles, sessions, users } from "@/lib/cms/store"
import type { AdminUser, PublicUser, Role, SessionRecord } from "@/lib/cms/types"
import { logger } from "./logger"
import { REMEMBER_TTL_SECONDS, SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./session-token"

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

/** Sessions without "Remember me" are signed out after this much inactivity. */
export const IDLE_TIMEOUT_MS = Math.max(5, Number(process.env.ADMIN_IDLE_TIMEOUT_MINUTES) || 60) * 60_000
/** Extra server-side allowance so the browser's countdown always runs out (and signs out cleanly) first. */
const IDLE_GRACE_MS = 2 * 60_000
/** How often we persist "last seen" for a session (avoids a write on every request). */
const TOUCH_INTERVAL_MS = 30_000

/* ============================================================================ Passwords */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, 64)
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$")
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, "hex")
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)
  return timingSafeEqual(expected, actual)
}

/** A readable random password, e.g. for admin-initiated resets. */
export function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  const bytes = randomBytes(14)
  let out = ""
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return `${out.slice(0, 5)}-${out.slice(5, 10)}-${out.slice(10)}7`
}

export function toPublicUser(user: AdminUser): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, sessionVersion, ...rest } = user
  return rest
}

const DUMMY_HASH = `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`

/* ============================================================================ Setup & migration */

let ready: Promise<void> | null = null

/**
 * - Creates the first Super Admin when no users exist (ADMIN_SEED_* env vars, or the old demo login).
 * - Migrates accounts from the previous admin/editor/contributor roles and "inactive" status.
 * - Guarantees there is always at least one active Super Admin.
 */
export function ensureAuthReady() {
  ready ??= (async () => {
    const existing = await users.all()
    if (!existing.length) {
      const email = process.env.ADMIN_SEED_EMAIL?.toLowerCase() || "admin@example.com"
      const password = process.env.ADMIN_SEED_PASSWORD || "password123"
      await users.insert({
        name: process.env.ADMIN_SEED_NAME || "Site Administrator",
        email,
        role: SUPER_ADMIN_ROLE,
        status: "active",
        passwordHash: await hashPassword(password),
        sessionVersion: 1,
        mustChangePassword: !process.env.ADMIN_SEED_PASSWORD,
      })
      logger.warn("Seeded initial Super Admin", { email, usingDefaultPassword: !process.env.ADMIN_SEED_PASSWORD })
      return
    }

    const roleIds = new Set((await roles.all()).map((r) => r.id))
    const needsMigration = existing.some((u) => !roleIds.has(u.role) || (u.status as string) === "inactive")
    const hasSuperAdmin = existing.some((u) => u.role === SUPER_ADMIN_ROLE && u.status === "active")
    if (!needsMigration && hasSuperAdmin) return

    await users.mutate((items) => {
      const migrated = items.map((u) => ({
        ...u,
        role: roleIds.has(u.role) ? u.role : LEGACY_ROLE_MAP[u.role] ?? "author",
        status: (u.status as string) === "inactive" ? ("suspended" as const) : u.status,
      }))
      if (!migrated.some((u) => u.role === SUPER_ADMIN_ROLE && u.status === "active")) {
        // Promote the longest-standing active administrator (or, failing that, the oldest active user).
        const candidates = migrated
          .filter((u) => u.status === "active")
          .sort((a, b) => (a.role === "admin" ? 0 : 1) - (b.role === "admin" ? 0 : 1) || a.createdAt.localeCompare(b.createdAt))
        if (candidates[0]) {
          candidates[0].role = SUPER_ADMIN_ROLE
          logger.warn("Promoted user to Super Admin during role migration", { email: candidates[0].email })
        }
      }
      return migrated
    })
  })().catch((error) => {
    ready = null
    throw error
  })
  return ready
}

/* ============================================================================ Roles & permissions */

export async function permissionsForRole(roleId: Role): Promise<Set<Permission>> {
  if (roleId === SUPER_ADMIN_ROLE) return new Set(ALL_PERMISSIONS)
  const role = await roles.get(roleId)
  return new Set(role?.permissions ?? [])
}

export async function roleName(roleId: Role) {
  return (await roles.get(roleId))?.name ?? roleId
}

/* ============================================================================ Sign-in */

export type AuthResult = { ok: true; user: AdminUser } | { ok: false; reason: "invalid" | "suspended" }

export async function authenticate(email: string, password: string): Promise<AuthResult> {
  await ensureAuthReady()
  const user = await users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  // Always run a hash comparison so response timing doesn't reveal whether the email exists.
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !ok) return { ok: false, reason: "invalid" }
  if (user.status !== "active") return { ok: false, reason: "suspended" }
  return { ok: true, user }
}

async function requestMeta() {
  const h = await headers()
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || undefined,
    userAgent: h.get("user-agent")?.slice(0, 300) || undefined,
  }
}

export async function startSession(user: AdminUser, options: { remember: boolean }) {
  const ttl = options.remember ? REMEMBER_TTL_SECONDS : SESSION_TTL_SECONDS
  const now = Date.now()
  const session = await sessions.insert({
    id: randomUUID(),
    userId: user.id,
    remember: options.remember,
    lastSeenAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl * 1000).toISOString(),
    ...(await requestMeta()),
  })
  const token = await signSession({ sid: session.id, sub: user.id, v: user.sessionVersion }, ttl)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Without "remember me" the cookie is a browser-session cookie (gone when the browser closes).
    ...(options.remember ? { maxAge: ttl } : {}),
  })
  void pruneSessions()
  return session
}

export async function endSession() {
  const store = await cookies()
  const payload = await verifySession(store.get(SESSION_COOKIE)?.value)
  if (payload) await sessions.update(payload.sid, { revokedAt: new Date().toISOString() })
  store.delete(SESSION_COOKIE)
}

/** Revokes every session for a user (optionally keeping one, e.g. the current device). */
export async function revokeUserSessions(userId: string, exceptSessionId?: string) {
  const now = new Date().toISOString()
  let count = 0
  await sessions.mutate((items) =>
    items.map((s) => {
      if (s.userId !== userId || s.id === exceptSessionId || s.revokedAt) return s
      count++
      return { ...s, revokedAt: now, updatedAt: now }
    })
  )
  return count
}

export function isSessionLive(session: SessionRecord, now = Date.now()) {
  if (session.revokedAt) return false
  if (new Date(session.expiresAt).getTime() <= now) return false
  if (!session.remember && now - new Date(session.lastSeenAt).getTime() > IDLE_TIMEOUT_MS + IDLE_GRACE_MS) return false
  return true
}

/** Drops sessions that ended more than a week ago so the store doesn't grow forever. */
async function pruneSessions() {
  const cutoff = Date.now() - 7 * 86_400_000
  try {
    const all = await sessions.all()
    const stale = all.filter((s) => !isSessionLive(s) && new Date(s.revokedAt ?? s.expiresAt).getTime() < cutoff)
    if (stale.length) await sessions.remove(stale.map((s) => s.id))
  } catch (error) {
    logger.warn("Session pruning failed", { error })
  }
}

/* ============================================================================ Current user */

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  permissions: Set<Permission>
  sessionId: string
  session: SessionRecord
}

/**
 * Returns the signed-in user, re-validated on every call against the user store, their role's
 * current permissions and the server-side session (revoked / expired / idle sessions are rejected).
 * `touch` marks the session as active (used for real user activity, not background polling).
 */
export async function getSessionUser(options: { touch?: boolean } = {}): Promise<SessionUser | null> {
  const store = await cookies()
  const payload = await verifySession(store.get(SESSION_COOKIE)?.value)
  if (!payload) return null
  await ensureAuthReady()

  const [session, user] = await Promise.all([sessions.get(payload.sid), users.get(payload.sub)])
  if (!session || session.userId !== payload.sub || !isSessionLive(session)) return null
  if (!user || user.status !== "active" || user.sessionVersion !== payload.v) return null

  let current = session
  if (options.touch && Date.now() - new Date(session.lastSeenAt).getTime() > TOUCH_INTERVAL_MS) {
    current = (await sessions.update(session.id, { lastSeenAt: new Date().toISOString() })) ?? session
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: await permissionsForRole(user.role),
    sessionId: session.id,
    session: current,
  }
}

export function can(user: Pick<SessionUser, "permissions"> | null, permission: Permission) {
  return !!user && user.permissions.has(permission)
}

export function canAny(user: Pick<SessionUser, "permissions"> | null, permissions: Permission[]) {
  return permissions.some((p) => can(user, p))
}

export function isSuperAdmin(user: Pick<SessionUser, "role"> | null) {
  return user?.role === SUPER_ADMIN_ROLE
}
