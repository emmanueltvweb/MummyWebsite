"use client"

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
  }
}

let redirecting = false

/** The session ended (expired, revoked, suspended…): go to the login page once, explaining why. */
function handleUnauthorized() {
  if (typeof window === "undefined" || redirecting || window.location.pathname === "/admin/login") return
  redirecting = true
  const next = encodeURIComponent(window.location.pathname + window.location.search)
  // Clear any stale cookie first so the proxy doesn't bounce us straight back.
  fetch("/api/auth/logout", { method: "POST" }).finally(() => {
    window.location.href = `/admin/login?reason=expired&next=${next}`
  })
}

/** JSON request helper that unwraps `{ success, data }` envelopes and throws readable errors. */
export async function api<T>(url: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}) {
  let response: Response
  try {
    response = await fetch(url, {
      method: options.method ?? (options.body ? "POST" : "GET"),
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      credentials: "same-origin",
    })
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error
    throw new ApiClientError("Network error – check your connection and try again.", 0, "NETWORK")
  }

  let payload: { success?: boolean; data?: T; error?: string; code?: string } | null = null
  try {
    payload = await response.json()
  } catch {
    // non-JSON response
  }

  if (response.status === 401) handleUnauthorized()
  if (!response.ok || payload?.success === false) {
    throw new ApiClientError(
      payload?.error || `Request failed (${response.status})`,
      response.status,
      payload?.code
    )
  }
  return (payload?.data ?? payload) as T
}

/** SWR fetcher */
export const fetcher = <T,>(url: string) => api<T>(url)

export function errorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
