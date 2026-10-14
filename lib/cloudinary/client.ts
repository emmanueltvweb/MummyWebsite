export { CLOUDINARY_CLOUD_NAME } from "./config"
export {
  buildCloudinaryDeliveryUrl,
  buildCloudinaryThumbnailUrl,
} from "./urls"

import { buildCloudinaryDeliveryUrl, buildCloudinaryThumbnailUrl } from "./urls"

export function buildCloudinaryUrl(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
) {
  return buildCloudinaryDeliveryUrl(publicId, { resourceType })
}

export function buildCloudinaryThumbnail(publicId: string) {
  return buildCloudinaryThumbnailUrl(publicId, "image", "image")
}
