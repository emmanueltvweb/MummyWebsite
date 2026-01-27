'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye,
  FileImage,
  FileVideo,
  FileAudio,
  FileText
} from 'lucide-react'

interface MediaFile {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document'
  size: string
  uploadDate: string
  url: string
  thumbnail?: string
}

const mockMediaFiles: MediaFile[] = [
  {
    id: '1',
    name: 'church-building.jpg',
    type: 'image',
    size: '2.5 MB',
    uploadDate: '2024-01-15',
    url: '/Church1.jpg',
    thumbnail: '/Church1.jpg'
  },
  {
    id: '2',
    name: 'sermon-video.mp4',
    type: 'video',
    size: '45.2 MB',
    uploadDate: '2024-01-14',
    url: '/sermon-video.mp4',
    thumbnail: '/sermon.jpeg'
  },
  {
    id: '3',
    name: 'testimony-audio.mp3',
    type: 'audio',
    size: '8.7 MB',
    uploadDate: '2024-01-13',
    url: '/testimony-audio.mp3'
  },
  {
    id: '4',
    name: 'event-document.pdf',
    type: 'document',
    size: '1.2 MB',
    uploadDate: '2024-01-12',
    url: '/event-document.pdf'
  },
]

export default function MediaLibrary() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(mockMediaFiles)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isUploading, setIsUploading] = useState(false)

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || file.type === typeFilter
    return matchesSearch && matchesType
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      Array.from(files).forEach(file => {
        const newFile: MediaFile = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: getFileType(file.type),
          size: formatFileSize(file.size),
          uploadDate: new Date().toISOString().split('T')[0],
          url: URL.createObjectURL(file)
        }
        setMediaFiles(prev => [newFile, ...prev])
      })
      
      alert('Files uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload files. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const getFileType = (mimeType: string): MediaFile['type'] => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: MediaFile['type']) => {
    switch (type) {
      case 'image': return <FileImage className="h-6 w-6 text-blue-500" />
      case 'video': return <FileVideo className="h-6 w-6 text-purple-500" />
      case 'audio': return <FileAudio className="h-6 w-6 text-green-500" />
      case 'document': return <FileText className="h-6 w-6 text-orange-500" />
    }
  }

  const handleDelete = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      setMediaFiles(prev => prev.filter(file => file.id !== fileId))
    }
  }

  const handleDownload = (file: MediaFile) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600">Manage your images, videos, and documents</p>
        </div>
        <div>
          <Input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="media-upload"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          />
          <Label htmlFor="media-upload">
            <Button asChild disabled={isUploading}>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </span>
            </Button>
          </Label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search media files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
          </select>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFiles.map((file) => (
          <Card key={file.id} className="overflow-hidden">
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              {file.thumbnail ? (
                <img
                  src={file.thumbnail}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  {getFileIcon(file.type)}
                  <p className="text-xs text-gray-500 mt-2">{file.type}</p>
                </div>
              )}
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium truncate">{file.name}</CardTitle>
              <CardDescription>
                <div className="flex justify-between text-xs">
                  <span>{file.size}</span>
                  <span>{file.uploadDate}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(file.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media files found</h3>
          <p className="text-gray-600">Upload some files to get started</p>
        </div>
      )}
    </div>
  )
}