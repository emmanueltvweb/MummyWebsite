'use client'

import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buildCloudinaryThumbnail } from '@/lib/cloudinary/client'

interface MediaFieldProps {
  label: string
  publicId?: string
  url?: string
  alt?: string
  onChange: (value: { publicId?: string; url?: string; alt?: string }) => void
  showAlt?: boolean
  accept?: string
  hint?: string
}

export function MediaField({
  label,
  publicId = '',
  url = '',
  alt = '',
  onChange,
  showAlt = true,
  accept = 'image/*,video/*,audio/*',
  hint = 'Paste a Cloudinary public ID, upload a file, or use a full media URL.',
}: MediaFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const previewUrl = url || (publicId ? buildCloudinaryThumbnail(publicId) : '')

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/cloudinary/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      onChange({
        publicId: result.data.publicId,
        url: result.data.secureUrl,
        alt: alt || file.name,
      })
      toast.success('Uploaded to Cloudinary')
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4 bg-gray-50/50">
      <Label>{label}</Label>
      <p className="text-xs text-gray-500">{hint}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-gray-600">Cloudinary Public ID</Label>
          <Input
            value={publicId}
            onChange={(e) => onChange({ publicId: e.target.value, url: '', alt })}
            placeholder="e.g. 10_cdpaih"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-600">Or Media URL</Label>
          <Input
            value={url}
            onChange={(e) => onChange({ url: e.target.value, publicId: '', alt })}
            placeholder="https://..."
          />
        </div>
      </div>

      {showAlt && (
        <div>
          <Label className="text-xs text-gray-600">Alt Text</Label>
          <Input
            value={alt}
            onChange={(e) => onChange({ publicId, url, alt: e.target.value })}
            placeholder="Describe the image for accessibility"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-1" />
          {isUploading ? 'Uploading...' : 'Upload to Cloudinary'}
        </Button>
        {(publicId || url) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ publicId: '', url: '', alt: '' })}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {previewUrl && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={alt || 'Preview'} className="h-24 w-auto rounded border object-cover" />
        </div>
      )}
    </div>
  )
}
