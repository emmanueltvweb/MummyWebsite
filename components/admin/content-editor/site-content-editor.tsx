'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Eye, Globe, Layout, Loader2, Plus, RefreshCw, Save } from 'lucide-react'
import { toast } from 'sonner'

import { useConfirm } from '@/components/admin/ui/confirm-dialog'
import { ErrorFallback } from '@/components/admin/ui/error-boundary'
import { feedback } from '@/components/admin/ui/feedback'
import { ImageUploadField } from '@/components/admin/ui/uploads'
import { MediaField } from '@/components/admin/media-field'
import { NavLinksEditor, StringListEditor } from '@/components/admin/content-editor/field-editors'
import { GalleryCategoryItems } from '@/components/admin/content-editor/gallery-items-editor'
import { AddCategoryDialog, CategoryDescriptionPanel } from '@/components/admin/content-editor/gallery-category-editor'
import { api } from '@/lib/admin/api-client'
import { useUnsavedChangesWarning } from '@/lib/admin/hooks'
import { refresh, setCached } from '@/lib/admin/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { defaultSiteContent } from '@/lib/content/defaults'
import { defaultGalleryData } from '@/lib/content/gallery-defaults'
import type { GalleryData, SiteContent } from '@/lib/content/types'

const CONTENT_KEY = '/api/content'
const GALLERY_KEY = '/api/content/gallery'

/** Which part of the website this editor shows: everything, or a single built-in page. */
export type SiteContentScope = 'all' | 'home' | 'contact' | 'visit' | 'gallery'

const SCOPES: Record<SiteContentScope, { title: string; description: string; path: string; tab: string }> = {
  all: { title: 'Website Content', description: 'Edit all major website content from one place', path: '/', tab: 'home' },
  home: { title: 'Home Page', description: 'Hero banner, about, latest sermon and newsletter sections', path: '/', tab: 'home' },
  contact: { title: 'Contact Page', description: 'Page heading and contact details', path: '/contact', tab: 'pages' },
  visit: { title: 'Visit Page', description: 'Page heading and gallery title', path: '/visit', tab: 'pages' },
  gallery: { title: 'Crusade / Outreach Gallery', description: 'Page heading and gallery images', path: '/gallery', tab: 'gallery' },
}

export function SiteContentEditor({ scope = 'all' }: { scope?: SiteContentScope }) {
  const meta = SCOPES[scope]
  const scoped = scope !== 'all'
  const [activeTab, setActiveTab] = useState(meta.tab)
  const [content, setContent] = useState<SiteContent>(defaultSiteContent)
  const [gallery, setGallery] = useState<GalleryData>(defaultGalleryData)
  const [activeGalleryCategory, setActiveGalleryCategory] = useState('SCOAN HQ')
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const confirm = useConfirm()

  // Server data lives in the shared admin store: returning to this page shows it instantly.
  const contentQuery = useSWR<SiteContent>(CONTENT_KEY)
  const galleryQuery = useSWR<GalleryData>(GALLERY_KEY)
  const remoteContent = contentQuery.data
  const remoteGallery = galleryQuery.data

  const currentSnapshot = useMemo(
    () => JSON.stringify({ content, gallery }),
    [content, gallery]
  )

  const hasUnsavedChanges = savedSnapshot !== '' && currentSnapshot !== savedSnapshot
  const dirtyRef = useRef(hasUnsavedChanges)
  dirtyRef.current = hasUnsavedChanges
  useUnsavedChangesWarning(hasUnsavedChanges)

  /** Replaces the working copy with what's on the server. */
  const applyRemote = useCallback((nextContent: SiteContent, nextGallery: GalleryData) => {
    setContent(nextContent)
    setGallery(nextGallery)
    setActiveGalleryCategory((current) =>
      current in nextGallery ? current : Object.keys(nextGallery)[0] ?? current
    )
    setSavedSnapshot(JSON.stringify({ content: nextContent, gallery: nextGallery }))
  }, [])

  // Sync the working copy from the store — but never overwrite edits that haven't been saved.
  useEffect(() => {
    if (!remoteContent || !remoteGallery || dirtyRef.current) return
    applyRemote(remoteContent, remoteGallery)
  }, [remoteContent, remoteGallery, applyRemote])

  const isLoading = savedSnapshot === '' && !contentQuery.error && !galleryQuery.error
  const loadError = savedSnapshot === '' ? contentQuery.error || galleryQuery.error : null

  /** Explicit reload: fetch fresh copies from the server and reset the form. */
  const loadContent = async () => {
    if (
      hasUnsavedChanges &&
      !(await confirm({
        title: 'Discard unsaved changes?',
        description: 'Reloading replaces your edits with the version currently on the website.',
        confirmText: 'Discard & reload',
        tone: 'danger',
      }))
    ) {
      return
    }
    setIsReloading(true)
    try {
      const [nextContent, nextGallery] = await Promise.all([contentQuery.mutate(), galleryQuery.mutate()])
      if (nextContent && nextGallery) applyRemote(nextContent, nextGallery)
      toast.success('Loaded the latest content')
    } catch {
      toast.error('Failed to reload content')
    } finally {
      setIsReloading(false)
    }
  }

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      toast.info('Everything is already up to date — no changes to save.')
      return
    }

    setIsSaving(true)
    const stopPreloader = feedback.saving('Saving website content…')

    try {
      const [savedContent, savedGallery] = await Promise.all([
        api<SiteContent>(CONTENT_KEY, { method: 'PUT', body: { ...content, updatedBy: 'Admin' } }),
        api<GalleryData>(GALLERY_KEY, { method: 'PUT', body: gallery }),
      ])

      // Update the page and the shared store in place — no refetch, no reload.
      applyRemote(savedContent, savedGallery)
      setCached(CONTENT_KEY, savedContent)
      setCached(GALLERY_KEY, savedGallery)
      refresh('/api/admin/stats', '/api/admin/audit-logs')
      setLastSaved(new Date().toLocaleString())
      stopPreloader()
      feedback.success('Website updated', {
        description: 'All your changes are now live on the website.',
        actions: [{ label: 'View website', href: '/', external: true }],
      })
    } catch (error) {
      stopPreloader()
      feedback.error("Couldn't save your changes", error)
    } finally {
      setIsSaving(false)
    }
  }

  const SaveButton = () => (
    <Button
      onClick={handleSave}
      disabled={isSaving}
      className="shadow-sm"
    >
      {isSaving ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Save className="h-4 w-4 mr-2" />
      )}
      {isSaving ? 'Saving...' : 'Save All Changes'}
    </Button>
  )

  const updateContent = <K extends keyof SiteContent>(section: K, value: SiteContent[K]) => {
    setContent((prev) => ({ ...prev, [section]: value }))
  }

  if (loadError) {
    return (
      <ErrorFallback
        label="website content"
        message={(loadError as Error).message}
        onRetry={() => {
          contentQuery.mutate()
          galleryQuery.mutate()
        }}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading website content...</p>
      </div>
    )
  }

  const galleryCategories = Object.keys(gallery)

  return (
    <div className="space-y-8 max-w-5xl pb-10">
      {/* Sticky so Save is always reachable while editing further down the page. */}
      <div className="sticky top-[84px] z-20 overflow-hidden rounded-2xl border bg-gradient-to-br from-white via-white to-blue-50 p-4 shadow-md sm:p-6">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-100/60 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-amber-100/50 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                {scoped && (
                  <Link href="/admin/pages" className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="h-3 w-3" /> All pages
                  </Link>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                  {meta.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {meta.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {hasUnsavedChanges ? (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                  Unsaved changes
                </Badge>
              ) : (
                <Badge variant="outline" className="border-green-300 bg-green-50 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  All changes saved
                </Badge>
              )}
              {lastSaved && (
                <span className="text-xs text-gray-500">Last saved: {lastSaved}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={loadContent} disabled={isSaving || isReloading} className="bg-white/80">
              <RefreshCw className={`h-4 w-4 mr-1 ${isReloading ? 'animate-spin' : ''}`} />
              Reload
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(meta.path, '_blank')}
              className="bg-white/80"
            >
              <Eye className="h-4 w-4 mr-1" />
              {scoped ? 'View Page' : 'Preview Site'}
            </Button>
            <SaveButton />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`${scoped ? 'hidden' : 'flex'} h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/60 p-1.5`}>
          <TabsTrigger value="home" className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Layout className="h-4 w-4 mr-2" />
            Home Page
          </TabsTrigger>
          <TabsTrigger value="site" className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Site & Navigation
          </TabsTrigger>
          <TabsTrigger value="pages" className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Other Pages
          </TabsTrigger>
          <TabsTrigger value="gallery" className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="space-y-6 mt-6">
          <Card className="border-gray-200/80 shadow-sm">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <p className="text-sm text-gray-600">
                The large image slider under the hero banner is managed separately.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/slider">Edit homepage slider</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Main banner with video background, rotating phrases, and carousel images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hero Title</Label>
                <Input
                  value={content.home.hero.title}
                  onChange={(e) => updateContent('home', {
                    ...content.home,
                    hero: { ...content.home.hero, title: e.target.value },
                  })}
                />
              </div>
              <StringListEditor
                label="Rotating Phrases"
                items={content.home.hero.phrases}
                onChange={(phrases) => updateContent('home', {
                  ...content.home,
                  hero: { ...content.home.hero, phrases },
                })}
                placeholder="And Win Today"
              />
              <div>
                <Label>Background Video URL</Label>
                <Input
                  value={content.home.hero.backgroundVideoUrl}
                  onChange={(e) => updateContent('home', {
                    ...content.home,
                    hero: { ...content.home.hero, backgroundVideoUrl: e.target.value },
                  })}
                />
              </div>
              <div className="space-y-4">
                <Label>Hero Carousel Images</Label>
                {content.home.hero.carouselImages.map((img, index) => (
                  <MediaField
                    key={index}
                    label={`Slide ${index + 1}`}
                    publicId={img.publicId}
                    url={img.url}
                    alt={img.alt}
                    onChange={(value) => {
                      const carouselImages = [...content.home.hero.carouselImages]
                      carouselImages[index] = { ...img, ...value }
                      updateContent('home', {
                        ...content.home,
                        hero: { ...content.home.hero, carouselImages },
                      })
                    }}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateContent('home', {
                    ...content.home,
                    hero: {
                      ...content.home.hero,
                      carouselImages: [...content.home.hero.carouselImages, { alt: 'Slide visual' }],
                    },
                  })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Slide
                </Button>
              </div>
              <div className="space-y-4">
                <Label>Call-to-Action Buttons</Label>
                {content.home.hero.buttons.map((btn, index) => (
                  <div key={index} className="grid sm:grid-cols-3 gap-2 p-3 border rounded-lg">
                    <Input
                      value={btn.label}
                      onChange={(e) => {
                        const buttons = [...content.home.hero.buttons]
                        buttons[index] = { ...btn, label: e.target.value }
                        updateContent('home', { ...content.home, hero: { ...content.home.hero, buttons } })
                      }}
                      placeholder="Button label"
                    />
                    <Input
                      value={btn.href}
                      onChange={(e) => {
                        const buttons = [...content.home.hero.buttons]
                        buttons[index] = { ...btn, href: e.target.value }
                        updateContent('home', { ...content.home, hero: { ...content.home.hero, buttons } })
                      }}
                      placeholder="Link URL"
                    />
                    <select
                      value={btn.variant}
                      onChange={(e) => {
                        const buttons = [...content.home.hero.buttons]
                        buttons[index] = { ...btn, variant: e.target.value as 'primary' | 'secondary' }
                        updateContent('home', { ...content.home, hero: { ...content.home.hero, buttons } })
                      }}
                      className="border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="primary">Primary Style</option>
                      <option value="secondary">Secondary Style</option>
                    </select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle>About Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={content.home.about.title}
                    onChange={(e) => updateContent('home', {
                      ...content.home,
                      about: { ...content.home.about, title: e.target.value },
                    })}
                  />
                </div>
                <div>
                  <Label>Highlighted Name</Label>
                  <Input
                    value={content.home.about.highlightText}
                    onChange={(e) => updateContent('home', {
                      ...content.home,
                      about: { ...content.home.about, highlightText: e.target.value },
                    })}
                  />
                </div>
              </div>
              <div>
                <Label>About Text</Label>
                <Textarea
                  rows={5}
                  value={content.home.about.content}
                  onChange={(e) => updateContent('home', {
                    ...content.home,
                    about: { ...content.home.about, content: e.target.value },
                  })}
                />
              </div>
              <div>
                <Label>Learn More Link</Label>
                <Input
                  value={content.home.about.learnMoreHref}
                  onChange={(e) => updateContent('home', {
                    ...content.home,
                    about: { ...content.home.about, learnMoreHref: e.target.value },
                  })}
                />
              </div>
              <div className="space-y-4">
                <Label>About Carousel Images</Label>
                {content.home.about.carouselImages.map((img, index) => (
                  <MediaField
                    key={index}
                    label={`Image ${index + 1}`}
                    publicId={img.publicId}
                    url={img.url}
                    alt={img.alt}
                    onChange={(value) => {
                      const carouselImages = [...content.home.about.carouselImages]
                      carouselImages[index] = { ...img, ...value }
                      updateContent('home', {
                        ...content.home,
                        about: { ...content.home.about, carouselImages },
                      })
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle>Latest Sermon Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Badge Text</Label>
                  <Input value={content.home.sermon.badge} onChange={(e) => updateContent('home', {
                    ...content.home, sermon: { ...content.home.sermon, badge: e.target.value },
                  })} />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input value={content.home.sermon.date} onChange={(e) => updateContent('home', {
                    ...content.home, sermon: { ...content.home.sermon, date: e.target.value },
                  })} />
                </div>
                <div>
                  <Label>Speaker</Label>
                  <Input value={content.home.sermon.speaker} onChange={(e) => updateContent('home', {
                    ...content.home, sermon: { ...content.home.sermon, speaker: e.target.value },
                  })} />
                </div>
              </div>
              <div>
                <Label>Sermon Title</Label>
                <Input value={content.home.sermon.title} onChange={(e) => updateContent('home', {
                  ...content.home, sermon: { ...content.home.sermon, title: e.target.value },
                })} />
              </div>
              <StringListEditor
                label="Summary Paragraphs"
                items={content.home.sermon.summaryParagraphs}
                onChange={(summaryParagraphs) => updateContent('home', {
                  ...content.home, sermon: { ...content.home.sermon, summaryParagraphs },
                })}
              />
              <div>
                <Label>Quote</Label>
                <Textarea rows={2} value={content.home.sermon.quote} onChange={(e) => updateContent('home', {
                  ...content.home, sermon: { ...content.home.sermon, quote: e.target.value },
                })} />
              </div>
              <StringListEditor
                label="Key Topics"
                items={content.home.sermon.keyTopics}
                onChange={(keyTopics) => updateContent('home', {
                  ...content.home, sermon: { ...content.home.sermon, keyTopics },
                })}
              />
              <div className="space-y-3">
                <div>
                  <Label>Featured Image</Label>
                  <p className="mt-1 text-xs text-gray-500">
                    Drag & drop or upload a new image, pick one from the Media Library, or paste an image URL below. Landscape (16:9) images look best.
                  </p>
                </div>
                <div className="max-w-xl">
                  <ImageUploadField
                    value={content.home.sermon.featuredImageUrl}
                    folder="sermons"
                    label="sermon image"
                    onChange={(url) => updateContent('home', {
                      ...content.home, sermon: { ...content.home.sermon, featuredImageUrl: url },
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="sermon-image-url" className="text-xs text-gray-600">Or paste an image URL (e.g. from Cloudinary)</Label>
                  <Input
                    id="sermon-image-url"
                    className="mt-1"
                    placeholder="https://res.cloudinary.com/…"
                    value={content.home.sermon.featuredImageUrl}
                    onChange={(e) => updateContent('home', {
                      ...content.home, sermon: { ...content.home.sermon, featuredImageUrl: e.target.value.trim() },
                    })}
                  />
                </div>
              </div>
              <div>
                <Label>Facebook Video Embed URL</Label>
                <Input value={content.home.sermon.facebookVideoEmbedUrl} onChange={(e) => updateContent('home', {
                  ...content.home, sermon: { ...content.home.sermon, facebookVideoEmbedUrl: e.target.value },
                })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  { title: 'First button', labelKey: 'watchNowLabel', urlKey: 'watchNowUrl', fallback: 'Watch Now', primary: true },
                  { title: 'Second button', labelKey: 'downloadAppLabel', urlKey: 'downloadAppUrl', fallback: 'Download App', primary: false },
                ] as const).map((button) => (
                  <div key={button.labelKey} className="space-y-3 rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{button.title}</p>
                      <span
                        className={`truncate rounded-lg px-3 py-1 text-xs font-semibold ${button.primary ? 'bg-amber-400 text-gray-900' : 'border-2 border-[#12224b] text-[#12224b]'}`}
                        title="Preview"
                      >
                        {content.home.sermon[button.labelKey] || button.fallback}
                      </span>
                    </div>
                    <div>
                      <Label htmlFor={`sermon-${button.labelKey}`} className="text-xs text-gray-600">Button text</Label>
                      <Input
                        id={`sermon-${button.labelKey}`}
                        className="mt-1"
                        maxLength={40}
                        placeholder={button.fallback}
                        value={content.home.sermon[button.labelKey] ?? ''}
                        onChange={(e) => updateContent('home', {
                          ...content.home, sermon: { ...content.home.sermon, [button.labelKey]: e.target.value },
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sermon-${button.urlKey}`} className="text-xs text-gray-600">Button link (URL)</Label>
                      <Input
                        id={`sermon-${button.urlKey}`}
                        className="mt-1"
                        placeholder="https://…"
                        value={content.home.sermon[button.urlKey]}
                        onChange={(e) => updateContent('home', {
                          ...content.home, sermon: { ...content.home.sermon, [button.urlKey]: e.target.value },
                        })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle>Newsletter Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={content.home.newsletter.title} onChange={(e) => updateContent('home', {
                    ...content.home, newsletter: { ...content.home.newsletter, title: e.target.value },
                  })} />
                </div>
                <div>
                  <Label>Highlighted Word</Label>
                  <Input value={content.home.newsletter.titleHighlight} onChange={(e) => updateContent('home', {
                    ...content.home, newsletter: { ...content.home.newsletter, titleHighlight: e.target.value },
                  })} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={content.home.newsletter.description} onChange={(e) => updateContent('home', {
                  ...content.home, newsletter: { ...content.home.newsletter, description: e.target.value },
                })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="site" className="space-y-6">
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Brand Initial (logo text)</Label>
                <Input value={content.branding.brandInitial} onChange={(e) => updateContent('branding', {
                  ...content.branding, brandInitial: e.target.value,
                })} />
              </div>
              <div>
                <Label>Brand Name</Label>
                <Input value={content.branding.brandName} onChange={(e) => updateContent('branding', {
                  ...content.branding, brandName: e.target.value,
                })} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader><CardTitle>Navigation</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <NavLinksEditor
                label="Main Navigation Links"
                links={content.header.navItems}
                onChange={(navItems) => updateContent('header', { ...content.header, navItems })}
              />
              <NavLinksEditor
                label="About Dropdown Links"
                links={content.header.aboutDropdownItems}
                onChange={(aboutDropdownItems) => updateContent('header', { ...content.header, aboutDropdownItems })}
              />
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader><CardTitle>Footer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tagline</Label>
                <Textarea rows={2} value={content.footer.tagline} onChange={(e) => updateContent('footer', {
                  ...content.footer, tagline: e.target.value,
                })} />
              </div>
              <NavLinksEditor
                label="Quick Links"
                links={content.footer.quickLinks}
                onChange={(quickLinks) => updateContent('footer', { ...content.footer, quickLinks })}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input value={content.footer.email} onChange={(e) => updateContent('footer', {
                    ...content.footer, email: e.target.value,
                  })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={content.footer.phone} onChange={(e) => updateContent('footer', {
                    ...content.footer, phone: e.target.value,
                  })} />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Textarea rows={3} value={content.footer.address} onChange={(e) => updateContent('footer', {
                  ...content.footer, address: e.target.value,
                })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Facebook URL</Label>
                  <Input value={content.footer.socialLinks.facebook} onChange={(e) => updateContent('footer', {
                    ...content.footer, socialLinks: { ...content.footer.socialLinks, facebook: e.target.value },
                  })} />
                </div>
                <div>
                  <Label>Instagram URL</Label>
                  <Input value={content.footer.socialLinks.instagram} onChange={(e) => updateContent('footer', {
                    ...content.footer, socialLinks: { ...content.footer.socialLinks, instagram: e.target.value },
                  })} />
                </div>
                <div>
                  <Label>YouTube URL</Label>
                  <Input value={content.footer.socialLinks.youtube} onChange={(e) => updateContent('footer', {
                    ...content.footer, socialLinks: { ...content.footer.socialLinks, youtube: e.target.value },
                  })} />
                </div>
                <div>
                  <Label>Email Link (mailto:)</Label>
                  <Input value={content.footer.socialLinks.email} onChange={(e) => updateContent('footer', {
                    ...content.footer, socialLinks: { ...content.footer.socialLinks, email: e.target.value },
                  })} />
                </div>
              </div>
              <div>
                <Label>Copyright Text</Label>
                <Input value={content.footer.copyright} onChange={(e) => updateContent('footer', {
                  ...content.footer, copyright: e.target.value,
                })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
          {scope !== 'visit' && (
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader><CardTitle>Contact Page</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={content.contact.title} onChange={(e) => updateContent('contact', {
                    ...content.contact, title: e.target.value,
                  })} />
                </div>
                <div>
                  <Label>Title Highlight</Label>
                  <Input value={content.contact.titleHighlight} onChange={(e) => updateContent('contact', {
                    ...content.contact, titleHighlight: e.target.value,
                  })} />
                </div>
              </div>
              <div>
                <Label>Subtitle</Label>
                <Textarea rows={2} value={content.contact.subtitle} onChange={(e) => updateContent('contact', {
                  ...content.contact, subtitle: e.target.value,
                })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input value={content.contact.email} onChange={(e) => updateContent('contact', {
                    ...content.contact, email: e.target.value,
                  })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={content.contact.phone} onChange={(e) => updateContent('contact', {
                    ...content.contact, phone: e.target.value,
                  })} />
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Textarea rows={3} value={content.contact.location} onChange={(e) => updateContent('contact', {
                  ...content.contact, location: e.target.value,
                })} />
              </div>
            </CardContent>
          </Card>
          )}

          {scope !== 'contact' && (
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader><CardTitle>Visit Page</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hero Title</Label>
                <Input value={content.visit.heroTitle} onChange={(e) => updateContent('visit', {
                  ...content.visit, heroTitle: e.target.value,
                })} />
              </div>
              <div>
                <Label>Hero Subtitle</Label>
                <Textarea rows={2} value={content.visit.heroSubtitle} onChange={(e) => updateContent('visit', {
                  ...content.visit, heroSubtitle: e.target.value,
                })} />
              </div>
              <div>
                <Label>Gallery Section Title</Label>
                <Input value={content.visit.gallerySectionTitle} onChange={(e) => updateContent('visit', {
                  ...content.visit, gallerySectionTitle: e.target.value,
                })} />
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader><CardTitle>Gallery Page Header</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Label</Label>
                <Input value={content.gallery.label} onChange={(e) => updateContent('gallery', {
                  ...content.gallery, label: e.target.value,
                })} />
              </div>
              <div>
                <Label>Title</Label>
                <Input value={content.gallery.title} onChange={(e) => updateContent('gallery', {
                  ...content.gallery, title: e.target.value,
                })} />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Textarea rows={2} value={content.gallery.subtitle} onChange={(e) => updateContent('gallery', {
                  ...content.gallery, subtitle: e.target.value,
                })} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader>
              <CardTitle>Gallery Categories & Items</CardTitle>
              <CardDescription>Pick a category to edit its description and photos, or add a new one.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {galleryCategories.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={activeGalleryCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveGalleryCategory(cat)}
                  >
                    {cat}
                    <span className={`ml-1 rounded-full px-1.5 text-[11px] tabular-nums ${activeGalleryCategory === cat ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                      {gallery[cat]?.length ?? 0}
                    </span>
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddCategoryOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Category
                </Button>
              </div>

              <AddCategoryDialog
                open={addCategoryOpen}
                onOpenChange={setAddCategoryOpen}
                existing={galleryCategories}
                onCreate={(name, description) => {
                  setGallery((g) => ({ ...g, [name]: [] }))
                  updateContent('gallery', {
                    ...content.gallery,
                    categoryDescriptions: { ...content.gallery.categoryDescriptions, [name]: description },
                  })
                  setActiveGalleryCategory(name)
                }}
              />

              {activeGalleryCategory && galleryCategories.includes(activeGalleryCategory) && (
                <CategoryDescriptionPanel
                  key={`description-${activeGalleryCategory}`}
                  category={activeGalleryCategory}
                  value={content.gallery.categoryDescriptions?.[activeGalleryCategory]}
                  imageCount={gallery[activeGalleryCategory]?.length ?? 0}
                  onChange={(value) =>
                    updateContent('gallery', {
                      ...content.gallery,
                      categoryDescriptions: { ...content.gallery.categoryDescriptions, [activeGalleryCategory]: value },
                    })
                  }
                  onDelete={async () => {
                    const name = activeGalleryCategory
                    const count = gallery[name]?.length ?? 0
                    const ok = await confirm({
                      title: `Delete the “${name}” category?`,
                      description: `${count ? `Its ${count} image${count === 1 ? '' : 's'} and ` : ''}its description will be removed from the gallery when you save. Uploaded files stay in the media library.`,
                      confirmText: 'Delete category',
                      tone: 'danger',
                    })
                    if (!ok) return
                    const rest = Object.fromEntries(Object.entries(gallery).filter(([c]) => c !== name))
                    setGallery(rest)
                    const descriptions = { ...content.gallery.categoryDescriptions }
                    delete descriptions[name]
                    const subcategories = { ...content.gallery.categorySubcategories }
                    delete subcategories[name]
                    const subDescriptions = { ...content.gallery.subcategoryDescriptions }
                    delete subDescriptions[name]
                    updateContent('gallery', {
                      ...content.gallery,
                      categoryDescriptions: descriptions,
                      categorySubcategories: subcategories,
                      subcategoryDescriptions: subDescriptions,
                    })
                    setActiveGalleryCategory(Object.keys(rest)[0] ?? '')
                  }}
                />
              )}

              <GalleryCategoryItems
                key={`items-${activeGalleryCategory}`}
                category={activeGalleryCategory}
                items={gallery[activeGalleryCategory] ?? []}
                onChange={(items) => setGallery((g) => ({ ...g, [activeGalleryCategory]: items }))}
                subcategories={content.gallery.categorySubcategories?.[activeGalleryCategory] ?? []}
                onSubcategoriesChange={(subs) =>
                  setContent((prev) => ({
                    ...prev,
                    gallery: {
                      ...prev.gallery,
                      categorySubcategories: { ...prev.gallery.categorySubcategories, [activeGalleryCategory]: subs },
                    },
                  }))
                }
                subcategoryDescriptions={content.gallery.subcategoryDescriptions?.[activeGalleryCategory] ?? {}}
                onSubcategoryDescriptionsChange={(descriptions) =>
                  setContent((prev) => ({
                    ...prev,
                    gallery: {
                      ...prev.gallery,
                      subcategoryDescriptions: { ...prev.gallery.subcategoryDescriptions, [activeGalleryCategory]: descriptions },
                    },
                  }))
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
