'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Save, Eye, RotateCcw, Upload } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import the WYSIWYG editor to avoid SSR issues
const RichTextEditor = dynamic(
  () => import('@/components/admin/rich-text-editor'),
  { ssr: false }
)

interface PageData {
  title: string
  slug: string
  content: string
  excerpt: string
  featuredImage: string
  status: 'published' | 'draft'
  metaTitle: string
  metaDescription: string
}

export default function PageEditor({ 
  pageId = 'new',
  initialData 
}: { 
  pageId?: string
  initialData?: Partial<PageData>
}) {
  const [pageData, setPageData] = useState<PageData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    excerpt: initialData?.excerpt || '',
    featuredImage: initialData?.featuredImage || '',
    status: initialData?.status || 'draft',
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Auto-save functionality
  useEffect(() => {
    if (hasChanges) {
      const timer = setTimeout(() => {
        handleSave(true) // Auto-save
      }, 30000) // Auto-save every 30 seconds

      return () => clearTimeout(timer)
    }
  }, [hasChanges, pageData])

  const handleInputChange = (field: keyof PageData, value: string) => {
    setPageData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async (isAutoSave = false) => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLastSaved(new Date())
      setHasChanges(false)
      
      if (!isAutoSave) {
        // Show success message
        alert('Page saved successfully!')
      }
    } catch (error) {
      console.error('Save error:', error)
      if (!isAutoSave) {
        alert('Failed to save page. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    // Open preview in new tab
    const previewUrl = `/preview/${pageId}`
    window.open(previewUrl, '_blank')
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        handleInputChange('featuredImage', e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {pageId === 'new' ? 'Create New Page' : 'Edit Page'}
          </h1>
          <p className="text-gray-600">
            {hasChanges && 'You have unsaved changes'}
            {lastSaved && !hasChanges && `Last saved: ${lastSaved.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => handleSave(false)} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Page'}
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center space-x-2">
        <span>Status:</span>
        <Badge variant={pageData.status === 'published' ? 'default' : 'secondary'}>
          {pageData.status}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleInputChange('status', pageData.status === 'published' ? 'draft' : 'published')}
        >
          {pageData.status === 'published' ? 'Switch to Draft' : 'Publish'}
        </Button>
      </div>

      {/* Main Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={pageData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter page title"
                />
              </div>
              
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={pageData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="enter-url-slug"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={pageData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  placeholder="Brief description of the page"
                  rows={3}
                />
              </div>

              <div>
                <Label>Main Content</Label>
                <RichTextEditor
                  content={pageData.content}
                  onChange={(content) => handleInputChange('content', content)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              {pageData.featuredImage ? (
                <div className="space-y-3">
                  <img
                    src={pageData.featuredImage}
                    alt="Featured"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('featuredImage', '')}
                    className="w-full"
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-3">No image selected</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>Upload Image</span>
                    </Button>
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={pageData.metaTitle}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  placeholder="Page title for search engines"
                />
              </div>
              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={pageData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  placeholder="Brief description for search engines"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}