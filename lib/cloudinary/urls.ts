import type { CloudinaryResourceType, MediaAssetType } from "./types"
import { CLOUDINARY_CLOUD_NAME } from "./config"

function encodePublicId(publicId: string): string {
  return publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

export function buildCloudinaryDeliveryUrl(
  publicId: string,
  options: {
    resourceType?: CloudinaryResourceType
    transformation?: string
    format?: string
  } = {}
): string {
  const resourceType = options.resourceType ?? "image"
  const transformation = options.transformation ? `${options.transformation}/` : ""
  const format = options.format ? `.${options.format}` : ""

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${transformation}${encodePublicId(publicId)}${format}`
}

export function buildCloudinaryThumbnailUrl(
  publicId: string,
  resourceType: CloudinaryResourceType,
  mediaType: MediaAssetType
): string {
  const transformation = "c_fill,w_400,h_300,g_auto"

  if (mediaType === "image") {
    return buildCloudinaryDeliveryUrl(publicId, {
      resourceType,
      transformation,
    })
  }

  if (mediaType === "video") {
    return buildCloudinaryDeliveryUrl(publicId, {
      resourceType: "video",
      transformation,
      format: "jpg",
    })
  }

  return ""
}
