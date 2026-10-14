export type CloudinaryResourceType = "image" | "video" | "raw"

export type MediaAssetType = "image" | "video" | "audio" | "other"

export interface CloudinaryMediaAsset {
  id: string
  publicId: string
  url: string
  secureUrl: string
  resourceType: CloudinaryResourceType
  mediaType: MediaAssetType
  format: string
  bytes: number
  width?: number
  height?: number
  duration?: number
  createdAt: string
  thumbnailUrl: string
  displayName: string
}

export interface CloudinaryMediaListResponse {
  assets: CloudinaryMediaAsset[]
  nextCursor: string | null
  totalCount?: number
}

export interface CloudinaryUploadResult {
  publicId: string
  url: string
  secureUrl: string
  resourceType: CloudinaryResourceType
  mediaType: MediaAssetType
  format: string
  bytes: number
  width?: number
  height?: number
  duration?: number
  thumbnailUrl: string
}
