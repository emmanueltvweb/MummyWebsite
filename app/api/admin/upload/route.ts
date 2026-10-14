import { audit } from "@/lib/server/audit"
import { ApiError, route } from "@/lib/server/api"
import { isCloudinaryConfigured } from "@/lib/cloudinary/config"
import { uploadToCloudinary } from "@/lib/cloudinary/server"

const MAX_SIZE = 100 * 1024 * 1024
const ALLOWED = /^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|webm)|audio\/.+)$/

/** Legacy upload endpoint – all media now goes to Cloudinary (no more local /public/uploads files). */
export const POST = route({ permission: "media.upload", rateLimit: { limit: 60, windowMs: 60_000, key: "legacy-upload" } }, async ({ request, user, ip }) => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, "Cloudinary is not configured. Add API credentials to .env.local", "NOT_CONFIGURED")
  }
  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) throw new ApiError(400, "No file provided", "BAD_REQUEST")
  if (file.size > MAX_SIZE) throw new ApiError(400, "File exceeds 100MB limit", "TOO_LARGE")
  if (!ALLOWED.test(file.type)) throw new ApiError(400, "Unsupported file type", "UNSUPPORTED")

  const result = await uploadToCloudinary(file)
  await audit(user, "media.upload", "media", `Uploaded ${file.name}`, { ip })
  return {
    url: result.secureUrl,
    publicId: result.publicId,
    resourceType: result.resourceType,
    mediaType: result.mediaType,
    format: result.format,
    size: result.bytes,
    thumbnailUrl: result.thumbnailUrl,
  }
})
