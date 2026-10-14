/**
 * In-memory sliding-window rate limiter.
 * Good enough for a single Node process; replace the store with Redis/Upstash when scaling out.
 */

interface Bucket {
  hits: number[]
}

const buckets = new Map<string, Bucket>()
let lastSweep = Date.now()

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (!bucket.hits.length || now - bucket.hits[bucket.hits.length - 1] > windowMs * 2) buckets.delete(key)
  }
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now, windowMs)
  const bucket = buckets.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter((time) => now - time < windowMs)

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket)
    const retryAfterSeconds = Math.ceil((windowMs - (now - bucket.hits[0])) / 1000)
    return { ok: false, remaining: 0, retryAfterSeconds }
  }

  bucket.hits.push(now)
  buckets.set(key, bucket)
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") || "local"
}
