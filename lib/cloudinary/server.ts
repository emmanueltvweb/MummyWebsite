import { v2 as cloudinary } from "cloudinary"

import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_FOLDER,
  getMediaType,
  isCloudinaryConfigured,
} from "./config"
import type {
  CloudinaryMediaAsset,
  CloudinaryMediaListResponse,
  CloudinaryResourceType,
  CloudinaryUploadResult,
  MediaAssetType,
} from "./types"
import { buildCloudinaryDeliveryUrl, buildCloudinaryThumbnailUrl } from "./urls"
import { dedupeCloudinaryAssets } from "./utils"

interface ListCursors {
  image?: string
  video?: string
  raw?: string
}

function ensureConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local"
    )
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

function encodeCursors(cursors: ListCursors | null): string | null {
  if (!cursors || (!cursors.image && !cursors.video && !cursors.raw)) return null
  return Buffer.from(JSON.stringify(cursors)).toString("base64url")
}

function decodeCursors(cursor: string | null | undefined): ListCursors {
  if (!cursor) return {}
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString()) as ListCursors
  } catch {
    return {}
  }
}

function buildThumbnailUrl(
  publicId: string,
  resourceType: CloudinaryResourceType,
  _format: string,
  mediaType: MediaAssetType
): string {
  return buildCloudinaryThumbnailUrl(publicId, resourceType, mediaType)
}

function normalizeResource(resource: {
  public_id: string
  secure_url: string
  url: string
  resource_type: string
  format: string
  bytes: number
  width?: number
  height?: number
  duration?: number
  created_at: string
}): CloudinaryMediaAsset {
  const resourceType = resource.resource_type as CloudinaryResourceType
  const mediaType = getMediaType(resource.format, resourceType)
  const displayName = resource.public_id.split("/").pop() || resource.public_id

  return {
    id: `${resourceType}:${resource.public_id}`,
    publicId: resource.public_id,
    url: resource.url,
    secureUrl: resource.secure_url,
    resourceType,
    mediaType,
    format: resource.format,
    bytes: resource.bytes,
    width: resource.width,
    height: resource.height,
    duration: resource.duration,
    createdAt: resource.created_at,
    thumbnailUrl: buildThumbnailUrl(resource.public_id, resourceType, resource.format, mediaType),
    displayName,
  }
}

async function fetchResources(
  resourceType: CloudinaryResourceType,
  maxResults: number,
  cursor?: string
) {
  const response = await cloudinary.api.resources({
    type: "upload",
    resource_type: resourceType,
    max_results: maxResults,
    next_cursor: cursor,
  })

  return {
    assets: (response.resources || []).map(normalizeResource),
    nextCursor: response.next_cursor as string | undefined,
  }
}

function filterByMediaType(assets: CloudinaryMediaAsset[], mediaType: MediaAssetType | "all") {
  if (mediaType === "all") return assets
  return assets.filter((asset) => asset.mediaType === mediaType)
}

function filterBySearch(assets: CloudinaryMediaAsset[], search?: string) {
  const query = search?.trim().toLowerCase()
  if (!query) return assets

  return assets.filter(
    (asset) =>
      asset.publicId.toLowerCase().includes(query) ||
      asset.displayName.toLowerCase().includes(query) ||
      asset.format.toLowerCase().includes(query)
  )
}

export async function listCloudinaryMedia(options: {
  mediaType?: MediaAssetType | "all"
  cursor?: string | null
  maxResults?: number
  search?: string
}): Promise<CloudinaryMediaListResponse> {
  ensureConfigured()

  const maxResults = options.maxResults ?? 30
  const mediaType = options.mediaType ?? "all"
  const cursors = decodeCursors(options.cursor)

  if (mediaType === "image") {
    const result = await fetchResources("image", maxResults, cursors.image)
    const assets = filterBySearch(result.assets, options.search)
    return { assets, nextCursor: result.nextCursor ?? null }
  }

  if (mediaType === "video") {
    const result = await fetchResources("video", maxResults, cursors.video)
    const assets = filterBySearch(
      result.assets.filter((asset) => asset.mediaType === "video"),
      options.search
    )
    return { assets, nextCursor: result.nextCursor ?? null }
  }

  if (mediaType === "audio") {
    const [videoResult, rawResult] = await Promise.all([
      fetchResources("video", maxResults, cursors.video),
      fetchResources("raw", maxResults, cursors.raw),
    ])

    const assets = filterBySearch(
      [...videoResult.assets, ...rawResult.assets].filter((asset) => asset.mediaType === "audio"),
      options.search
    ).slice(0, maxResults)

    const nextCursor = encodeCursors({
      video: videoResult.nextCursor,
      raw: rawResult.nextCursor,
    })

    return { assets: dedupeCloudinaryAssets(assets), nextCursor }
  }

  const perType = Math.max(10, Math.ceil(maxResults / 3))
  const [images, videos, raw] = await Promise.all([
    fetchResources("image", perType, cursors.image),
    fetchResources("video", perType, cursors.video),
    fetchResources("raw", perType, cursors.raw),
  ])

  const assets = dedupeCloudinaryAssets(
    filterBySearch(
      filterByMediaType([...images.assets, ...videos.assets, ...raw.assets], "all"),
      options.search
    )
  )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxResults)

  const nextCursor = encodeCursors({
    image: images.nextCursor,
    video: videos.nextCursor,
    raw: raw.nextCursor,
  })

  return { assets, nextCursor }
}

export async function uploadToCloudinary(
  file: File,
  folder = CLOUDINARY_UPLOAD_FOLDER
): Promise<CloudinaryUploadResult> {
  ensureConfigured()

  const bytes = Buffer.from(await file.arrayBuffer())
  const resourceType = getUploadResourceType(file.type)

  const result = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error || new Error("Upload failed"))
          return
        }
        resolve(uploadResult)
      }
    )

    stream.end(bytes)
  })

  const mediaType = getMediaType(result.format, result.resource_type as CloudinaryResourceType)

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    resourceType: result.resource_type as CloudinaryResourceType,
    mediaType,
    format: result.format,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    duration: result.duration,
    thumbnailUrl: buildThumbnailUrl(
      result.public_id,
      result.resource_type as CloudinaryResourceType,
      result.format,
      mediaType
    ),
  }
}

export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: CloudinaryResourceType
): Promise<void> {
  ensureConfigured()
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

function getUploadResourceType(mimeType: string): CloudinaryResourceType {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "video"
  return "raw"
}

export function getPublicAssetUrl(publicId: string, resourceType: CloudinaryResourceType = "image") {
  return buildCloudinaryDeliveryUrl(publicId, { resourceType })
}

export function uploadResultToAsset(result: CloudinaryUploadResult): CloudinaryMediaAsset {
  return {
    id: `${result.resourceType}:${result.publicId}`,
    publicId: result.publicId,
    url: result.url,
    secureUrl: result.secureUrl,
    resourceType: result.resourceType,
    mediaType: result.mediaType,
    format: result.format,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    duration: result.duration,
    createdAt: new Date().toISOString(),
    thumbnailUrl: result.thumbnailUrl,
    displayName: result.publicId.split("/").pop() || result.publicId,
  }
}
