import { audit } from "@/lib/server/audit"
import { ApiError, route } from "@/lib/server/api"
import { isCloudinaryConfigured } from "@/lib/cloudinary/config"
import { invalidateMediaCache } from "@/lib/cloudinary/media-cache"
import { uploadToCloudinary } from "@/lib/cloudinary/server"

const MAX_SIZE = 100 * 1024 * 1024 // 100MB

const ALLOWED = /^(image\/(jpeg|png|webp|gif|avif|svg\+xml)|video\/(mp4|webm|quicktime)|audio\/.+)$/

/**
 * Server-side upload fallback (the dashboard uploads directly to Cloudinary with a signature
 * from /api/admin/cloudinary/sign). Kept for existing callers.
 */
export const POST = route({ permission: "media.upload", rateLimit: { limit: 60, windowMs: 60_000, key: "cloudinary-upload" } }, async ({ request, user, ip }) => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, "Cloudinary is not configured. Add API credentials to .env.local", "NOT_CONFIGURED")
  }
  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) throw new ApiError(400, "No file provided", "BAD_REQUEST")
  if (file.size > MAX_SIZE) throw new ApiError(400, "File exceeds 100MB limit", "TOO_LARGE")
  if (!ALLOWED.test(file.type)) throw new ApiError(400, `Unsupported file type: ${file.type || "unknown"}`, "UNSUPPORTED")

  const result = await uploadToCloudinary(file)
  invalidateMediaCache()
  await audit(user, "media.upload", "media", `Uploaded ${file.name}`, { ip })
  return result
})
