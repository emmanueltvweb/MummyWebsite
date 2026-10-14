/**
 * Signed session tokens using Web Crypto (HMAC-SHA256).
 * Runtime-agnostic so it can run inside `proxy.ts` as well as route handlers.
 *
 * Token format: base64url(JSON payload) + "." + base64url(signature)
 */

export const SESSION_COOKIE = "admin_session"
/** "Remember me" sessions last 30 days. */
export const REMEMBER_TTL_SECONDS = 60 * 60 * 24 * 30
/** Other sessions end when the browser closes, after inactivity, or at the latest after 12 hours. */
export const SESSION_TTL_SECONDS = 60 * 60 * 12

export interface SessionPayload {
  sid: string // server-side session id
  sub: string // user id
  exp: number // unix seconds
  v: number // user session version – bumped on password change to revoke old sessions
}

const encoder = new TextEncoder()

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (secret && secret.length >= 32) return secret
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET must be set (32+ characters) in production")
  }
  // Development fallback so the dashboard works out of the box.
  return "dev-only-insecure-session-secret-change-me-please"
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

let cachedKey: { secret: string; key: Promise<CryptoKey> } | null = null
function getKey() {
  const secret = getSecret()
  if (cachedKey?.secret !== secret) {
    cachedKey = {
      secret,
      key: crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]),
    }
  }
  return cachedKey.key
}

export async function signSession(payload: Omit<SessionPayload, "exp">, ttlSeconds: number): Promise<string> {
  const full: SessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }
  const body = toBase64Url(encoder.encode(JSON.stringify(full)))
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(body)))
  return `${body}.${toBase64Url(signature)}`
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  const [body, signature] = token.split(".")
  if (!body || !signature) return null
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      fromBase64Url(signature) as BufferSource,
      encoder.encode(body)
    )
    if (!valid) return null
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload
    if (!payload.sid || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
