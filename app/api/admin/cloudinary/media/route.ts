import { z } from "zod"

import { audit } from "@/lib/server/audit"
import { ApiError, parseBody, route } from "@/lib/server/api"
import { isCloudinaryConfigured } from "@/lib/cloudinary/config"
import { cachedMediaList, invalidateMediaCache } from "@/lib/cloudinary/media-cache"
import { deleteCloudinaryAsset, listCloudinaryMedia } from "@/lib/cloudinary/server"
import type { MediaAssetType } from "@/lib/cloudinary/types"

function assertConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, "Cloudinary is not configured", "NOT_CONFIGURED")
  }
}

export const GET = route({ permission: ["media.view", "media.upload"] }, async ({ request }) => {
  assertConfigured()
  const { searchParams } = new URL(request.url)
  const options = {
    mediaType: (searchParams.get("type") || "all") as MediaAssetType | "all",
    cursor: searchParams.get("cursor"),
    maxResults: Math.min(Number(searchParams.get("limit") || "30"), 100),
    search: searchParams.get("search") || undefined,
  }
  return cachedMediaList(JSON.stringify(options), () => listCloudinaryMedia(options))
})

const deleteInput = z.object({
  assets: z
    .array(z.object({ publicId: z.string().min(1).max(255), resourceType: z.enum(["image", "video", "raw"]) }))
    .min(1)
    .max(100)
    .optional(),
  publicId: z.string().min(1).max(255).optional(),
  resourceType: z.enum(["image", "video", "raw"]).optional(),
})

/** Deletes one asset (`publicId` + `resourceType`) or many (`assets`). */
export const DELETE = route({ permission: "media.delete" }, async ({ request, user, ip }) => {
  assertConfigured()
  const body = await parseBody(request, deleteInput)
  const assets =
    body.assets ?? (body.publicId && body.resourceType ? [{ publicId: body.publicId, resourceType: body.resourceType }] : [])
  if (!assets.length) throw new ApiError(400, "publicId and resourceType are required", "BAD_REQUEST")

  const results = await Promise.allSettled(assets.map((a) => deleteCloudinaryAsset(a.publicId, a.resourceType)))
  invalidateMediaCache()
  const deleted = results.filter((r) => r.status === "fulfilled").length
  await audit(user, "media.delete", "media", `Deleted ${deleted} media file(s)`, { ip })
  if (!deleted) throw new ApiError(502, "Cloudinary could not delete the selected file(s)", "DELETE_FAILED")
  return { deleted, failed: assets.length - deleted }
})
