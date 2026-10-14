import "server-only"

import { NextResponse, type NextRequest } from "next/server"
import { ZodError, type ZodTypeAny, type output } from "zod"

import type { Permission } from "@/lib/cms/rbac"
import { canAny, getSessionUser, type SessionUser } from "./auth"
import { logger } from "./logger"
import { clientIp, rateLimit } from "./rate-limit"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
  }
}

export const notFound = (what = "Resource") => new ApiError(404, `${what} not found`, "NOT_FOUND")
export const badRequest = (message: string, details?: unknown) => new ApiError(400, message, "BAD_REQUEST", details)

export function ok<T>(data: T, init?: { message?: string; status?: number }) {
  return NextResponse.json({ success: true, data, message: init?.message }, { status: init?.status ?? 200 })
}

export function fail(status: number, error: string, code?: string, details?: unknown) {
  return NextResponse.json({ success: false, error, code, details }, { status })
}

function formatZod(error: ZodError) {
  return error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
    .join("; ")
}

export async function parseBody<S extends ZodTypeAny>(request: Request, schema: S): Promise<output<S>> {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    throw badRequest("Request body must be valid JSON")
  }
  return schema.parse(json)
}

/**
 * For legacy handlers not wrapped in `route()`: returns an error response when the caller isn't
 * signed in with the given permission, otherwise the user.
 */
export async function requireUser(permission: Permission): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser({ touch: true })
  if (!user) return fail(401, "Your session has expired. Please sign in again.", "UNAUTHORIZED")
  if (!canAny(user, [permission])) return fail(403, "You don't have permission to do that.", "FORBIDDEN")
  return user
}

interface RouteOptions {
  /** `false` = public endpoint. Otherwise a signed-in user is required (the default). */
  auth?: false
  /** Permission(s) required — the user needs at least one of them. */
  permission?: Permission | Permission[]
  /** Requests per window per client IP (+ route). */
  rateLimit?: { limit: number; windowMs: number; key?: string }
}

export interface RouteContext<P> {
  request: NextRequest
  params: P
  user: SessionUser | null
  ip: string
}

type Handler<P> = (ctx: RouteContext<P>) => Promise<Response | unknown>

/**
 * Wraps a route handler with auth, rate limiting, consistent JSON envelopes,
 * validation error mapping and structured logging.
 */
export function route<P = Record<string, string>>(options: RouteOptions, handler: Handler<P>) {
  return async (request: NextRequest, context: { params: Promise<P> }) => {
    const started = Date.now()
    const ip = clientIp(request)
    const path = new URL(request.url).pathname

    try {
      if (options.rateLimit) {
        const key = `${options.rateLimit.key ?? path}:${ip}`
        const result = rateLimit(key, options.rateLimit.limit, options.rateLimit.windowMs)
        if (!result.ok) {
          logger.warn("Rate limit exceeded", { path, ip })
          const response = fail(429, "Too many requests. Please slow down and try again shortly.", "RATE_LIMITED")
          response.headers.set("Retry-After", String(result.retryAfterSeconds))
          return response
        }
      }

      let user: SessionUser | null = null
      if (options.auth !== false) {
        // Only changes (non-GET) count as activity, so background polling can't keep an idle session alive.
        user = await getSessionUser({ touch: request.method !== "GET" })
        if (!user) return fail(401, "Your session has expired. Please sign in again.", "UNAUTHORIZED")
        const required = options.permission ? [options.permission].flat() : []
        if (required.length && !canAny(user, required)) return fail(403, "You don't have permission to do that.", "FORBIDDEN")
      } else {
        user = await getSessionUser().catch(() => null)
      }

      const params = ((await context?.params) ?? {}) as P
      const result = await handler({ request, params, user, ip })
      const response = result instanceof Response ? result : ok(result)

      if (request.method !== "GET") {
        logger.info("api", { method: request.method, path, status: response.status, ms: Date.now() - started, user: user?.email })
      }
      return response
    } catch (error) {
      if (error instanceof ApiError) {
        return fail(error.status, error.message, error.code, error.details)
      }
      if (error instanceof ZodError) {
        return fail(400, formatZod(error), "VALIDATION_ERROR", error.flatten())
      }
      logger.error("Unhandled API error", { method: request.method, path, error })
      return fail(500, "Something went wrong on our side. Please try again.", "INTERNAL_ERROR")
    }
  }
}
