import { v2 as cloudinary } from "cloudinary"
import { z } from "zod"

import { ApiError, parseBody, route } from "@/lib/server/api"
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_FOLDER, isCloudinaryConfigured } from "@/lib/cloudinary/config"
import { invalidateMediaCache } from "@/lib/cloudinary/media-cache"

const signInput = z.object({
  folder: z
    .string()
    .regex(/^[\w-]+(\/[\w-]+)*$/)
    .max(100)
    .optional(),
  /** When replacing an existing asset, sign an overwrite of the same public ID. */
  publicId: z.string().max(255).regex(/^[\w\-/. ]+$/).optional(),
})

/**
 * Returns a short-lived signature so the browser can upload straight to Cloudinary.
 * This gives real upload progress and avoids routing large files through our server.
 */
export const POST = route({ permission: "media.upload", rateLimit: { limit: 120, windowMs: 60_000, key: "cloudinary-sign" } }, async ({ request }) => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, "Cloudinary is not configured. Add the API credentials to .env.local", "NOT_CONFIGURED")
  }
  const { folder, publicId } = await parseBody(request, signInput)

  const params: Record<string, string | number | boolean> = { timestamp: Math.round(Date.now() / 1000) }
  if (publicId) {
    params.public_id = publicId
    params.overwrite = true
    params.invalidate = true
  } else {
    params.folder = folder ? `${CLOUDINARY_UPLOAD_FOLDER}/${folder}` : CLOUDINARY_UPLOAD_FOLDER
  }

  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!)
  // An upload is about to happen: make the media library list fresh results while it completes.
  invalidateMediaCache({ uploadWindow: true })
  return {
    ...params,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
  }
})
