import type { CloudinaryMediaAsset } from "./types"

export function getAssetKey(asset: Pick<CloudinaryMediaAsset, "resourceType" | "publicId">): string {
  return `${asset.resourceType}:${asset.publicId}`
}

export function dedupeCloudinaryAssets(assets: CloudinaryMediaAsset[]): CloudinaryMediaAsset[] {
  const seen = new Map<string, CloudinaryMediaAsset>()

  for (const asset of assets) {
    seen.set(getAssetKey(asset), asset)
  }

  return Array.from(seen.values())
}
