"use client"

import { api, ApiClientError } from "./api-client"

export interface UploadedAsset {
  publicId: string
  secureUrl: string
  resourceType: "image" | "video" | "raw"
  format: string
  bytes: number
  width?: number
  height?: number
  originalFilename?: string
}

interface SignResponse {
  signature: string
  apiKey: string
  uploadUrl: string
  timestamp: number
  folder?: string
  public_id?: string
  overwrite?: boolean
  invalidate?: boolean
}

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024
export const IMAGE_MIME = /^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/

export function validateFile(file: File, accept: "image" | "media" = "image"): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name} is larger than 100 MB`
  if (accept === "image" && !IMAGE_MIME.test(file.type)) return `${file.name} isn't a supported image (JPG, PNG, WebP, GIF, AVIF, SVG)`
  if (accept === "media" && !/^(image|video|audio)\//.test(file.type)) return `${file.name} isn't an image, video or audio file`
  return null
}

/** Re-hosts a remote or data: image URL on Cloudinary (used for images pasted into the editor). */
export async function uploadRemoteToCloudinary(source: string, folder?: string): Promise<UploadedAsset> {
  const signed = await api<SignResponse>("/api/admin/cloudinary/sign", { body: { folder } })
  const form = new FormData()
  form.append("file", source)
  form.append("api_key", signed.apiKey)
  form.append("timestamp", String(signed.timestamp))
  form.append("signature", signed.signature)
  if (signed.folder) form.append("folder", signed.folder)
  const response = await fetch(signed.uploadUrl, { method: "POST", body: form })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiClientError(body?.error?.message || "Could not import image", response.status)
  return {
    publicId: body.public_id,
    secureUrl: body.secure_url,
    resourceType: body.resource_type,
    format: body.format,
    bytes: body.bytes,
    width: body.width,
    height: body.height,
  }
}

/**
 * Uploads a file straight from the browser to Cloudinary using a server-issued signature.
 * Reports real byte-level progress and supports cancellation.
 */
export async function uploadToCloudinary(
  file: File,
  options: { folder?: string; replacePublicId?: string; onProgress?: (percent: number) => void; signal?: AbortSignal } = {}
): Promise<UploadedAsset> {
  const signed = await api<SignResponse>("/api/admin/cloudinary/sign", {
    body: { folder: options.folder, publicId: options.replacePublicId },
  })

  const form = new FormData()
  form.append("file", file)
  form.append("api_key", signed.apiKey)
  form.append("timestamp", String(signed.timestamp))
  form.append("signature", signed.signature)
  if (signed.folder) form.append("folder", signed.folder)
  if (signed.public_id) form.append("public_id", signed.public_id)
  if (signed.overwrite) form.append("overwrite", "true")
  if (signed.invalidate) form.append("invalidate", "true")

  return new Promise<UploadedAsset>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", signed.uploadUrl)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      let body: Record<string, unknown> = {}
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        // ignore
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          publicId: body.public_id as string,
          secureUrl: body.secure_url as string,
          resourceType: body.resource_type as UploadedAsset["resourceType"],
          format: body.format as string,
          bytes: body.bytes as number,
          width: body.width as number | undefined,
          height: body.height as number | undefined,
          originalFilename: body.original_filename as string | undefined,
        })
      } else {
        const message = (body.error as { message?: string } | undefined)?.message
        reject(new ApiClientError(message || `Upload failed (${xhr.status})`, xhr.status))
      }
    }
    xhr.onerror = () => reject(new ApiClientError("Upload failed – check your connection", 0, "NETWORK"))
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"))
    options.signal?.addEventListener("abort", () => xhr.abort())
    xhr.send(form)
  })
}
