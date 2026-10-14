"use client"

import { useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"
import { format } from "date-fns"
import { AlertCircle, Check, Copy, ExternalLink, FileAudio, FileVideo, ImageIcon, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { SearchInput, SegmentedTabs } from "@/components/admin/ui/controls"
import { EmptyState, LoadingButton, PageHeader, Panel, Skeleton } from "@/components/admin/ui/primitives"
import { toast } from "@/components/admin/ui/toast"
import { UploadDropzone } from "@/components/admin/ui/uploads"
import { api, fetcher } from "@/lib/admin/api-client"
import { uploadToCloudinary } from "@/lib/admin/upload"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary/optimize"
import type { CloudinaryMediaAsset, CloudinaryMediaListResponse, MediaAssetType } from "@/lib/cloudinary/types"
import { dedupeCloudinaryAssets } from "@/lib/cloudinary/utils"
import { cn } from "@/lib/utils"

type TypeFilter = "all" | MediaAssetType

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function CloudinaryMediaLibrary() {
  const confirm = useConfirm()
  const { can } = useAuth()
  const [type, setType] = useState<TypeFilter>("all")
  const [search, setSearch] = useState("")
  const [showUpload, setShowUpload] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [active, setActive] = useState<CloudinaryMediaAsset | null>(null)
  const [replacing, setReplacing] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const replaceRef = useRef<HTMLInputElement>(null)
  const [version, setVersion] = useState(0) // cache-buster for replaced assets

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite<CloudinaryMediaListResponse>(
    (index, previous) => {
      if (previous && !previous.nextCursor) return null
      const params = new URLSearchParams({ type, limit: "36" })
      if (search) params.set("search", search)
      if (previous?.nextCursor) params.set("cursor", previous.nextCursor)
      return `/api/admin/cloudinary/media?${params}`
    },
    fetcher,
    { revalidateFirstPage: true }
  )

  const assets = dedupeCloudinaryAssets(data?.flatMap((page) => page.assets) ?? [])
  const hasMore = !!data?.[data.length - 1]?.nextCursor
  const notConfigured = (error as { code?: string } | undefined)?.code === "NOT_CONFIGURED"
  const thumb = (asset: CloudinaryMediaAsset) => (asset.thumbnailUrl ? `${asset.thumbnailUrl}${version ? `?v=${version}` : ""}` : "")

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success("URL copied to clipboard")
    setTimeout(() => setCopied(false), 1500)
  }

  const removeAssets = async (targets: CloudinaryMediaAsset[]) => {
    const ok = await confirm({
      title: targets.length === 1 ? "Delete this file?" : `Delete ${targets.length} files?`,
      description: "Files are permanently removed from Cloudinary. Any page, post or slide still using them will show a broken image.",
      confirmText: "Delete permanently",
    })
    if (!ok) return
    setDeleting(true)
    const ids = new Set(targets.map((a) => a.id))
    const previous = data
    // Optimistically hide them.
    mutate((pages) => pages?.map((p) => ({ ...p, assets: p.assets.filter((a) => !ids.has(a.id)) })), { revalidate: false })
    try {
      const result = await api<{ deleted: number; failed: number }>("/api/admin/cloudinary/media", {
        method: "DELETE",
        body: { assets: targets.map((a) => ({ publicId: a.publicId, resourceType: a.resourceType })) },
      })
      toast.success(`Deleted ${result.deleted} file${result.deleted === 1 ? "" : "s"}`, result.failed ? `${result.failed} could not be deleted.` : undefined)
      setSelected(new Set())
      setActive(null)
      mutate()
    } catch (err) {
      mutate(previous, { revalidate: false })
      toast.fromError(err, "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  const replace = async (file: File) => {
    if (!active) return
    const expected = active.mediaType === "image" ? "image/" : active.mediaType === "video" ? "video/" : "audio/"
    if (!file.type.startsWith(expected)) return toast.error("Wrong file type", `Replace this ${active.mediaType} with another ${active.mediaType}.`)
    setReplacing(0)
    try {
      await uploadToCloudinary(file, { replacePublicId: active.publicId, onProgress: setReplacing })
      toast.success("File replaced", "Everywhere it's used now shows the new version (CDN cache may take a minute).")
      setVersion(Date.now())
      mutate()
    } catch (err) {
      toast.fromError(err, "Replace failed")
    } finally {
      setReplacing(null)
    }
  }

  return (
    <div>
      <PageHeader
        icon={ImageIcon}
        title="Media Library"
        description="Every image, video and audio file used on the website — stored and optimised on Cloudinary."
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={() => mutate()} disabled={isValidating}>
              <RefreshCw className={cn(isValidating && "animate-spin")} /> Refresh
            </Button>
            <Button className="rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90" onClick={() => setShowUpload((v) => !v)} aria-expanded={showUpload}>
              <UploadCloud /> Upload files
            </Button>
          </>
        }
      />

      {showUpload && (
        <Panel className="admin-rise mb-6 p-5">
          <UploadDropzone accept="media" onUploaded={() => mutate()} />
        </Panel>
      )}

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-admin-border/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <SegmentedTabs
            ariaLabel="Filter by type"
            value={type}
            onChange={(v) => (setType(v), setSelected(new Set()))}
            options={[
              { value: "all", label: "All files" },
              { value: "image", label: "Images" },
              { value: "video", label: "Videos" },
              { value: "audio", label: "Audio" },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Search by file name…" className="lg:w-72" />
        </div>

        {selected.size > 0 && can("media.delete") && (
          <div className="admin-rise flex items-center gap-2 border-b border-admin-border/70 bg-admin-brand-soft/60 px-5 py-2.5">
            <span className="text-sm font-semibold text-admin-brand">{selected.size} selected</span>
            <LoadingButton size="sm" variant="outline" className="ml-2 rounded-lg border-admin-danger/40 text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" loading={deleting} onClick={() => removeAssets(assets.filter((a) => selected.has(a.id)))}>
              <Trash2 /> Delete
            </LoadingButton>
            <Button size="sm" variant="ghost" className="ml-auto rounded-lg" onClick={() => setSelected(new Set())}>Clear selection</Button>
          </div>
        )}

        <div className="p-4 sm:p-5">
          {notConfigured ? (
            <EmptyState icon={AlertCircle} title="Cloudinary isn't configured" description="Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to .env.local, then restart the server." />
          ) : error ? (
            <EmptyState icon={AlertCircle} title="Couldn't load media" description={(error as Error).message} action={{ label: "Try again", onClick: () => mutate() }} />
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          ) : assets.length === 0 ? (
            <EmptyState icon={ImageIcon} title={search ? "No files match your search" : "Your library is empty"} description="Upload images, videos or audio and they'll be available everywhere in the dashboard." action={{ label: "Upload files", onClick: () => setShowUpload(true) }} />
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {assets.map((asset, i) => {
                  const isSelected = selected.has(asset.id)
                  return (
                    <li key={asset.id} className="admin-rise" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                      <div className={cn("group relative overflow-hidden rounded-xl border bg-admin-subtle transition", isSelected ? "border-admin-brand ring-2 ring-admin-brand/30" : "border-admin-border/70 hover:shadow-admin-lg")}>
                        <button type="button" onClick={() => setActive(asset)} className="block aspect-square w-full focus-visible:outline-none" aria-label={`Open ${asset.displayName}`}>
                          {asset.mediaType === "image" || (asset.mediaType === "video" && asset.thumbnailUrl) ? (
                            <img src={thumb(asset)} alt={asset.displayName} loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-105" />
                          ) : (
                            <span className="flex size-full items-center justify-center text-admin-muted">
                              {asset.mediaType === "audio" ? <FileAudio className="size-10" /> : <FileVideo className="size-10" />}
                            </span>
                          )}
                          {asset.mediaType !== "image" && (
                            <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">{asset.mediaType}</span>
                          )}
                        </button>
                        {can("media.delete") && (
                          <label className={cn("absolute top-2 left-2 flex size-7 cursor-pointer items-center justify-center rounded-lg bg-white/90 shadow transition", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100")}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(asset.id)) n.delete(asset.id); else n.add(asset.id); return n })}
                              className="size-4 accent-[var(--admin-brand)]"
                              aria-label={`Select ${asset.displayName}`}
                            />
                          </label>
                        )}
                      </div>
                      <p className="mt-1.5 truncate text-xs font-medium text-admin-text" title={asset.displayName}>{asset.displayName}</p>
                      <p className="text-[11px] text-admin-muted">{asset.format.toUpperCase()} · {formatBytes(asset.bytes)}</p>
                    </li>
                  )
                })}
              </ul>
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <LoadingButton variant="outline" className="rounded-xl" loading={isValidating && size > (data?.length ?? 0)} onClick={() => setSize(size + 1)}>
                    Load more
                  </LoadingButton>
                </div>
              )}
            </>
          )}
        </div>
      </Panel>

      {/* Details drawer */}
      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="admin-scroll w-full overflow-y-auto sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="truncate pr-6">{active.displayName}</SheetTitle>
                <SheetDescription>Uploaded {format(new Date(active.createdAt), "d MMM yyyy, HH:mm")}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-6">
                <div className="relative overflow-hidden rounded-xl bg-admin-subtle">
                  {active.mediaType === "image" ? (
                    <img src={`${optimizeCloudinaryUrl(active.secureUrl, { width: 800 })}${version ? `?v=${version}` : ""}`} alt={active.displayName} className="w-full" />
                  ) : active.mediaType === "video" ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption -- previewing an uploaded file; no caption track exists
                    <video src={active.secureUrl} controls className="w-full" />
                  ) : (
                    // eslint-disable-next-line jsx-a11y/media-has-caption -- previewing an uploaded file; no caption track exists
                    <audio src={active.secureUrl} controls className="w-full p-4" />
                  )}
                  {replacing !== null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-admin-surface/85 backdrop-blur-sm">
                      <Loader2 className="size-6 animate-spin text-admin-brand" />
                      <span className="text-sm font-medium tabular-nums">{replacing}%</span>
                    </div>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Type", `${active.mediaType} · ${active.format.toUpperCase()}`],
                    ["Size", formatBytes(active.bytes)],
                    ...(active.width ? [["Dimensions", `${active.width} × ${active.height}px`]] : []),
                    ...(active.duration ? [["Duration", `${Math.round(active.duration)}s`]] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-admin-surface-2 p-3">
                      <dt className="text-xs text-admin-muted">{label}</dt>
                      <dd className="font-medium text-admin-text capitalize">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-admin-text">File URL</p>
                  <div className="flex gap-2">
                    <input readOnly value={active.secureUrl} className="h-9 min-w-0 flex-1 rounded-xl border border-admin-border bg-admin-surface-2 px-3 text-xs text-admin-muted" onFocus={(e) => e.currentTarget.select()} aria-label="File URL" />
                    <Button variant="outline" size="icon" className="size-9 rounded-xl" onClick={() => copy(active.secureUrl)} aria-label="Copy URL">
                      {copied ? <Check className="text-admin-success" /> : <Copy />}
                    </Button>
                  </div>
                  <p className="text-xs text-admin-muted">Public ID: <span className="font-mono">{active.publicId}</span></p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="rounded-xl">
                    <a href={active.secureUrl} target="_blank" rel="noopener noreferrer"><ExternalLink /> Open</a>
                  </Button>
                  {can("media.upload") && (
                    <Button variant="outline" className="rounded-xl" disabled={replacing !== null} onClick={() => replaceRef.current?.click()}>
                      <RefreshCw /> Replace
                    </Button>
                  )}
                </div>
                {can("media.delete") && (
                  <LoadingButton variant="outline" className="w-full rounded-xl border-admin-danger/40 text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" loading={deleting} onClick={() => removeAssets([active])}>
                    <Trash2 /> Delete file
                  </LoadingButton>
                )}
                <input
                  ref={replaceRef}
                  type="file"
                  className="hidden"
                  accept={active.mediaType === "image" ? "image/*" : active.mediaType === "video" ? "video/*" : "audio/*"}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) replace(file)
                    e.target.value = ""
                  }}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
