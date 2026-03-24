'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, Eye, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface HomePageEditorProps {
  pageId: string
  initialData?: {
    heroTitle?: string
    heroSubtitle?: string
    heroPhrases?: string[]
    heroDescription?: string
    aboutTitle?: string
    aboutContent?: string
    sermonTitle?: string
    sermonContent?: string
  }
  onSave?: (data: any) => void
  onCancel?: () => void
}

export function HomePageEditor({ pageId, initialData, onSave, onCancel }: HomePageEditorProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    heroTitle: initialData?.heroTitle || "Good Morning,",
    heroSubtitle: initialData?.heroSubtitle || "And Win Today",
    heroPhrases: initialData?.heroPhrases || ["And Win Today", "Win Tomorrow", "And Win Forever"],
    heroDescription: initialData?.heroDescription || "Serving the world with faith, love, and spiritual guidance.",
    aboutTitle: initialData?.aboutTitle || "About Pastor Evelyn Joshua",
    aboutContent: initialData?.aboutContent || "Pastor Evelyn Joshua is a Nigerian minister of God, pastor, preacher and tele-evangelist. She is the Senior Pastor and Leader of world renowned charismatic Christian ministry, The Synagogue, Church of All Nations (The SCOAN). Evelyn is also the President of Emmanuel Global Network (Owner of Emmanuel TV).",
    sermonTitle: initialData?.sermonTitle || "THE YEAR OF OVERFLOWING JOY 2026",
    sermonContent: initialData?.sermonContent || "So did the Lord Almighty declare through Pastor Evelyn Joshua to believers across the world during the SCOAN Candlelight Service 2025.",
  })

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    // Load current home page content
    fetchHomeContent()
  }, [])

  const fetchHomeContent = async () => {
    try {
      const response = await fetch('/api/home-content')
      const result = await response.json()
      
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          ...result.data
        }))
      }
    } catch (error) {
      console.error('Error fetching home content:', error)
      toast.error('Failed to load current home page content')
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/home-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: formData
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Home page updated successfully!')
        setLastSaved(new Date())
        onSave?.(formData)
        
        // Redirect to home page with edit mode enabled for inline editing
        setTimeout(() => {
          router.push('/?admin=true&edit=true')
        }, 1500)
      } else {
        throw new Error(result.error || 'Failed to save changes')
      }
    } catch (error) {
      console.error('Error saving home content:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    // Open home page in new tab
    window.open('/?preview=true', '_blank')
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Home Page</h1>
          <p className="text-gray-600">Modify the content of your home page</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={isSaving}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {isSaving ? 'Saving...' : 'Save & Go to Inline Editor'}
          </Button>
        </div>
      </div>

      {lastSaved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 text-sm">
            Last saved: {lastSaved.toLocaleString()}
          </p>
        </div>
      )}

      <div className="grid gap-6">
        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="heroTitle">Hero Title</Label>
              <Input
                id="heroTitle"
                value={formData.heroTitle}
                onChange={(e) => handleChange('heroTitle', e.target.value)}
                placeholder="Enter hero title"
              />
            </div>
            <div>
              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
              <Input
                id="heroSubtitle"
                value={formData.heroSubtitle}
                onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                placeholder="Enter hero subtitle"
              />
            </div>
            <div>
              <Label htmlFor="heroDescription">Hero Description</Label>
              <Textarea
                id="heroDescription"
                value={formData.heroDescription}
                onChange={(e) => handleChange('heroDescription', e.target.value)}
                placeholder="Enter hero description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle>About Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="aboutTitle">About Title</Label>
              <Input
                id="aboutTitle"
                value={formData.aboutTitle}
                onChange={(e) => handleChange('aboutTitle', e.target.value)}
                placeholder="Enter about title"
              />
            </div>
            <div>
              <Label htmlFor="aboutContent">About Content</Label>
              <Textarea
                id="aboutContent"
                value={formData.aboutContent}
                onChange={(e) => handleChange('aboutContent', e.target.value)}
                placeholder="Enter about content"
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sermon Section */}
        <Card>
          <CardHeader>
            <CardTitle>Sermon Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sermonTitle">Sermon Title</Label>
              <Input
                id="sermonTitle"
                value={formData.sermonTitle}
                onChange={(e) => handleChange('sermonTitle', e.target.value)}
                placeholder="Enter sermon title"
              />
            </div>
            <div>
              <Label htmlFor="sermonContent">Sermon Content</Label>
              <Textarea
                id="sermonContent"
                value={formData.sermonContent}
                onChange={(e) => handleChange('sermonContent', e.target.value)}
                placeholder="Enter sermon content"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save & Go to Inline Editor'}
        </Button>
      </div>
    </div>
  )
}