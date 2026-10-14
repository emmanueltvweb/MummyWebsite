import "server-only"

/**
 * Short-lived cache for media-library listings, so opening the Media page (or the image picker)
 * doesn't wait on Cloudinary's search API every time.
 *
 * Uploads go straight from the browser to Cloudinary, so the server can't see them finish.
 * Instead, issuing an upload signature turns the cache off for a couple of minutes, which
 * covers the upload and the library refresh that follows it.
 */
const TTL = 60_000
const UPLOAD_WINDOW = 2 * 60_000

// Kept on globalThis so every route bundle (list, sign, upload, delete) shares one cache.
const store = ((globalThis as { __mediaListCache?: { entries: Map<string, { at: number; data: Promise<unknown> }>; bypassUntil: number } })
  .__mediaListCache ??= { entries: new Map(), bypassUntil: 0 })
const entries = store.entries

export function cachedMediaList<T>(key: string, load: () => Promise<T>): Promise<T> {
  const now = Date.now()
  if (now < store.bypassUntil) return load()
  const hit = entries.get(key)
  if (hit && now - hit.at < TTL) return hit.data as Promise<T>
  const data = load()
  entries.set(key, { at: now, data })
  // Never keep a failed request around.
  data.catch(() => entries.delete(key))
  return data
}

/** Call after media changes. `uploadWindow` keeps the cache off while uploads complete. */
export function invalidateMediaCache({ uploadWindow = false } = {}) {
  entries.clear()
  if (uploadWindow) store.bypassUntil = Math.max(store.bypassUntil, Date.now() + UPLOAD_WINDOW)
}
