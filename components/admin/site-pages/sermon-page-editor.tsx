"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Music, Plus, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { FullPageSpinner, Panel, PanelBody, PanelHeader } from "@/components/admin/ui/primitives"
import { UploadDropzone } from "@/components/admin/ui/uploads"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary/optimize"
import type { BuiltInPage, SermonAudioTrack, SermonPageContent, SermonVideo } from "@/lib/content/page-types"

import { ImageInput, ListItemCard, moveItem, newId, PageEditorShell, TagsInput, TextArea, TextInput, usePageContentDraft } from "./page-editor-kit"

const RichTextEditor = dynamic(() => import("@/components/admin/editor/rich-text-editor"), {
  ssr: false,
  loading: () => <div className="admin-skeleton h-[260px] rounded-2xl" />,
})

export function SermonPageEditor({ page }: { page: BuiltInPage }) {
  const { draft, update, dirty, save, reload, saving, reloading, setBusy, error } = usePageContentDraft("sermon", page.title)
  const confirm = useConfirm()
  const [openVideo, setOpenVideo] = useState<string | null>(null)
  const [openTrack, setOpenTrack] = useState<number | null>(null)

  if (error && !draft) return <ErrorFallback label="page" message={error.message} onRetry={reload} />
  if (!draft) return <FullPageSpinner />

  const content = draft as SermonPageContent
  const { hero, featured, videos, audio } = content
  const setHero = (patch: Partial<SermonPageContent["hero"]>) => update((c) => ({ ...c, hero: { ...c.hero, ...patch } }))
  const setFeatured = (patch: Partial<SermonPageContent["featured"]>) => update((c) => ({ ...c, featured: { ...c.featured, ...patch } }))
  const setVideos = (patch: Partial<SermonPageContent["videos"]>) => update((c) => ({ ...c, videos: { ...c.videos, ...patch } }))
  const setTracks = (tracks: SermonAudioTrack[]) => update((c) => ({ ...c, audio: { tracks } }))
  const setVideo = (id: string, patch: Partial<SermonVideo>) => setVideos({ items: videos.items.map((v) => (v.id === id ? { ...v, ...patch } : v)) })
  const setTrack = (id: number, patch: Partial<SermonAudioTrack>) => setTracks(audio.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const addVideo = () => {
    const video: SermonVideo = { id: newId("video"), title: "New sermon video", description: "", thumbnail: "", embedUrl: "" }
    setVideos({ items: [...videos.items, video] })
    setOpenVideo(video.id)
  }
  const addTrack = () => {
    const id = audio.tracks.reduce((max, t) => Math.max(max, t.id), 0) + 1
    setTracks([...audio.tracks, { id, title: "New audio message", artist: "Pastor Evelyn Joshua", category: "Sermon", duration: "", date: "", audioUrl: "" }])
    setOpenTrack(id)
  }
  const confirmRemove = (what: string) =>
    confirm({ title: `Remove “${what}”?`, description: "It's removed from the page when you save.", confirmText: "Remove", tone: "danger" })

  return (
    <PageEditorShell
      title={page.title}
      description="Edit the page heading, the sermon of the week, the video list and the audio playlist."
      path={page.path}
      dirty={dirty}
      saving={saving}
      reloading={reloading}
      updatedAt={content.updatedAt}
      updatedBy={content.updatedBy}
      onSave={save}
      onReload={reload}
    >
      <Panel>
        <PanelHeader title="Page heading" description="The banner at the top of the Sermon page." />
        <PanelBody className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Small label" value={hero.label} onChange={(label) => setHero({ label })} placeholder="Messages" />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Title" value={hero.title} onChange={(title) => setHero({ title })} />
            <TextInput label="Highlighted words" value={hero.titleHighlight} onChange={(titleHighlight) => setHero({ titleHighlight })} hint="Shown in gold" />
          </div>
          <div className="sm:col-span-2">
            <TextArea label="Subtitle" value={hero.subtitle} onChange={(subtitle) => setHero({ subtitle })} rows={2} />
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title="Sermon of the week" description="The featured sermon with its picture, video, summary and buttons." />
        <PanelBody className="space-y-5">
          <div className="grid gap-5 md:grid-cols-[320px_1fr]">
            <ImageInput label="Featured image" value={featured.imageUrl} onChange={(imageUrl) => setFeatured({ imageUrl })} folder="sermons" />
            <div className="space-y-4">
              <TextInput label="Badge" value={featured.badge} onChange={(badge) => setFeatured({ badge })} placeholder="Sermon of the Week" />
              <TextInput label="Sermon title" value={featured.title} onChange={(title) => setFeatured({ title })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput label="Date" value={featured.date} onChange={(date) => setFeatured({ date })} placeholder="December 09, 2025" />
                <TextInput label="Speaker" value={featured.speaker} onChange={(speaker) => setFeatured({ speaker })} />
              </div>
            </div>
          </div>
          <TextInput
            label="Video embed link"
            value={featured.videoEmbedUrl}
            onChange={(videoEmbedUrl) => setFeatured({ videoEmbedUrl: videoEmbedUrl.trim() })}
            placeholder="https://www.facebook.com/plugins/video.php?…"
            hint="Plays when visitors click the play button on the image. Use the “Embed” link from Facebook or YouTube."
          />
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-admin-text">Summary</p>
            <RichTextEditor value={featured.summaryHtml} onChange={(summaryHtml) => setFeatured({ summaryHtml })} folder="sermons" minimal onBusyChange={setBusy} ariaLabel="Sermon summary" />
          </div>
          <TagsInput label="Key topics" value={featured.keyTopics} onChange={(keyTopics) => setFeatured({ keyTopics })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-admin-border/70 p-4">
              <p className="text-sm font-semibold text-admin-text">First button</p>
              <TextInput label="Button text" value={featured.watchNowLabel} onChange={(watchNowLabel) => setFeatured({ watchNowLabel })} placeholder="Watch Now" maxLength={40} />
              <TextInput label="Button link" value={featured.watchNowUrl} onChange={(watchNowUrl) => setFeatured({ watchNowUrl: watchNowUrl.trim() })} placeholder="https://…" />
            </div>
            <div className="space-y-3 rounded-2xl border border-admin-border/70 p-4">
              <p className="text-sm font-semibold text-admin-text">Second button</p>
              <TextInput label="Button text" value={featured.downloadAppLabel} onChange={(downloadAppLabel) => setFeatured({ downloadAppLabel })} placeholder="Download App" maxLength={40} />
              <TextInput label="Button link" value={featured.downloadAppUrl} onChange={(downloadAppUrl) => setFeatured({ downloadAppUrl: downloadAppUrl.trim() })} placeholder="https://…" />
            </div>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title={`Sermon videos (${videos.items.length})`}
          description="The scrolling “More Sermons” video list. Leave it empty to hide the section."
          actions={
            <Button size="sm" className="rounded-xl" onClick={addVideo}>
              <Plus /> Add video
            </Button>
          }
        />
        <PanelBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Section title" value={videos.title} onChange={(title) => setVideos({ title })} />
            <TextInput label="Section subtitle" value={videos.subtitle} onChange={(subtitle) => setVideos({ subtitle })} />
          </div>
          <div className="space-y-3">
            {videos.items.map((video, index) => (
              <ListItemCard
                key={video.id}
                index={index}
                total={videos.items.length}
                title={video.title}
                subtitle={video.embedUrl ? "Video link added" : "No video link yet"}
                thumbnail={video.thumbnail ? optimizeCloudinaryUrl(video.thumbnail, { width: 160, height: 100, crop: "fill" }) : undefined}
                open={openVideo === video.id}
                onToggle={() => setOpenVideo(openVideo === video.id ? null : video.id)}
                onMove={(direction) => setVideos({ items: moveItem(videos.items, index, direction) })}
                onRemove={async () => (await confirmRemove(video.title)) && setVideos({ items: videos.items.filter((v) => v.id !== video.id) })}
                removeLabel={`Remove video ${index + 1}`}
              >
                <div className="grid gap-5 md:grid-cols-[280px_1fr]">
                  <ImageInput label="Thumbnail" value={video.thumbnail} onChange={(thumbnail) => setVideo(video.id, { thumbnail })} folder="sermons" />
                  <div className="space-y-4">
                    <TextInput label="Title" value={video.title} onChange={(title) => setVideo(video.id, { title })} />
                    <TextArea label="Description" value={video.description} onChange={(description) => setVideo(video.id, { description })} rows={3} />
                    <TextInput
                      label="Video embed link"
                      value={video.embedUrl}
                      onChange={(embedUrl) => setVideo(video.id, { embedUrl: embedUrl.trim() })}
                      placeholder="https://www.facebook.com/plugins/video.php?…"
                    />
                  </div>
                </div>
              </ListItemCard>
            ))}
            {videos.items.length === 0 && (
              <p className="flex items-center gap-2 rounded-2xl border border-dashed border-admin-border p-6 text-sm text-admin-muted">
                <Video className="size-4" /> No videos — the section is hidden on the website.
              </p>
            )}
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title={`Audio playlist (${audio.tracks.length})`}
          description="Audio messages visitors can play on the page. Leave it empty to hide the player."
          actions={
            <Button size="sm" className="rounded-xl" onClick={addTrack}>
              <Plus /> Add audio
            </Button>
          }
        />
        <PanelBody className="space-y-3">
          {audio.tracks.map((track, index) => (
            <ListItemCard
              key={track.id}
              index={index}
              total={audio.tracks.length}
              title={track.title}
              subtitle={[track.artist, track.category, track.duration].filter(Boolean).join(" · ")}
              open={openTrack === track.id}
              onToggle={() => setOpenTrack(openTrack === track.id ? null : track.id)}
              onMove={(direction) => setTracks(moveItem(audio.tracks, index, direction))}
              onRemove={async () => (await confirmRemove(track.title)) && setTracks(audio.tracks.filter((t) => t.id !== track.id))}
              removeLabel={`Remove audio ${index + 1}`}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Title" value={track.title} onChange={(title) => setTrack(track.id, { title })} />
                <TextInput label="Speaker / artist" value={track.artist} onChange={(artist) => setTrack(track.id, { artist })} />
                <TextInput label="Category" value={track.category} onChange={(category) => setTrack(track.id, { category })} placeholder="Sermon" />
                <div className="grid grid-cols-2 gap-3">
                  <TextInput label="Date" value={track.date} onChange={(date) => setTrack(track.id, { date })} placeholder="Dec 6, 2025" />
                  <TextInput label="Length" value={track.duration} onChange={(duration) => setTrack(track.id, { duration })} placeholder="34:14" />
                </div>
              </div>
              <TextInput
                label="Audio file link"
                value={track.audioUrl}
                onChange={(audioUrl) => setTrack(track.id, { audioUrl: audioUrl.trim() })}
                placeholder="https://res.cloudinary.com/…/sermon.mp3"
                hint="Paste an MP3 link, or upload a file below."
              />
              {track.audioUrl && (
                // Admin-only preview of the uploaded sermon audio; captions don't apply here.
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <audio controls preload="none" src={track.audioUrl} className="w-full" aria-label={`Preview ${track.title}`} />
              )}
              <UploadDropzone
                accept="media"
                compact
                multiple={false}
                folder="sermons/audio"
                onUploaded={(assets) => assets[0] && setTrack(track.id, { audioUrl: assets[0].secureUrl })}
              />
            </ListItemCard>
          ))}
          {audio.tracks.length === 0 && (
            <p className="flex items-center gap-2 rounded-2xl border border-dashed border-admin-border p-6 text-sm text-admin-muted">
              <Music className="size-4" /> No audio — the player is hidden on the website.
            </p>
          )}
        </PanelBody>
      </Panel>
    </PageEditorShell>
  )
}
