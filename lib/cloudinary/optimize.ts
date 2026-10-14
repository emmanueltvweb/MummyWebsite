/**
 * Adds Cloudinary delivery optimisations (automatic format + quality, optional resize) to a
 * stored `https://res.cloudinary.com/...` URL. Non-Cloudinary URLs are returned unchanged.
 */
export function optimizeCloudinaryUrl(
  url: string | undefined | null,
  options: { width?: number; height?: number; crop?: "fill" | "limit" | "fit" | "thumb"; gravity?: "auto" | "face" | "north" } = {}
): string {
  if (!url) return ""
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/)(.*)$/)
  if (!match) return url
  const [, prefix, rest] = match
  // Skip if the URL already carries our transformation.
  if (rest.startsWith("f_auto")) return url

  const parts = ["f_auto", "q_auto"]
  if (options.width || options.height) {
    parts.push(`c_${options.crop ?? "limit"}`)
    if (options.width) parts.push(`w_${options.width}`)
    if (options.height) parts.push(`h_${options.height}`)
    if (options.gravity && options.crop === "fill") parts.push(`g_${options.gravity}`)
  }
  return `${prefix}${parts.join(",")}/${rest}`
}

/** Extracts the public ID (without extension/version) from a Cloudinary delivery URL. */
export function publicIdFromUrl(url: string): { publicId: string; resourceType: "image" | "video" | "raw" } | null {
  const match = url.match(/^https:\/\/res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:[^/]*[_,][^/]*\/)*(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i)
  if (!match) return null
  return { resourceType: match[1] as "image" | "video" | "raw", publicId: decodeURIComponent(match[2]) }
}
