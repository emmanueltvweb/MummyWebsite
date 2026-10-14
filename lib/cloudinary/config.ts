import type { CloudinaryResourceType, MediaAssetType } from "./types"

export const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dvlcc2r5w"

export const CLOUDINARY_UPLOAD_FOLDER =
  process.env.CLOUDINARY_UPLOAD_FOLDER || "website-uploads"

const AUDIO_FORMATS = new Set(["mp3", "wav", "aac", "ogg", "m4a", "flac", "opus"])

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  )
}

export function getMediaType(format: string, resourceType: CloudinaryResourceType): MediaAssetType {
  if (resourceType === "image") return "image"
  if (AUDIO_FORMATS.has(format.toLowerCase())) return "audio"
  if (resourceType === "video") return "video"
  return "other"
}

export { AUDIO_FORMATS }
