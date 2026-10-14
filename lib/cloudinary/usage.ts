import "server-only"

import { v2 as cloudinary } from "cloudinary"

import { logger } from "@/lib/server/logger"
import { CLOUDINARY_CLOUD_NAME, isCloudinaryConfigured } from "./config"

let cached: { value: number | null; at: number } | null = null
let inflight: Promise<number | null> | null = null
const TTL = 10 * 60_000
/** On a cold start, don't hold up the dashboard longer than this waiting for Cloudinary. */
const FIRST_LOAD_WAIT_MS = 400

function refresh(): Promise<number | null> {
  inflight ??= (async () => {
    try {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      })
      const usage = await cloudinary.api.usage()
      const value = typeof usage.resources === "number" ? usage.resources : null
      cached = { value, at: Date.now() }
      return value
    } catch (error) {
      logger.warn("Cloudinary usage lookup failed", { error })
      cached = { value: cached?.value ?? null, at: Date.now() }
      return cached.value
    } finally {
      inflight = null
    }
  })()
  return inflight
}

/**
 * Total number of assets in the Cloudinary account.
 * Stale-while-revalidate: answers from the cache immediately and refreshes in the background,
 * so the dashboard never waits on Cloudinary's API (which takes ~0.5–1s).
 */
export async function getCloudinaryAssetCount(): Promise<number | null> {
  if (!isCloudinaryConfigured()) return null
  if (cached) {
    if (Date.now() - cached.at > TTL) void refresh()
    return cached.value
  }
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), FIRST_LOAD_WAIT_MS))
  return Promise.race([refresh(), timeout])
}
