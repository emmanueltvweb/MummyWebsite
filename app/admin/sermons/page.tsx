'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Upload, 
  Calendar, 
  User, 
  Tag,
  Search,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

interface Sermon {
  id: string
  title: string
  description: string
  preacher: string
  date: string
  duration: string
  videoUrl: string
  thumbnail: string
  tags: string[]
  category: string
  views: number
}

const mockSermons: Sermon[] = [
  {
    id: '1',
    title: 'The Power of Faith',
    description: 'An inspiring message about the power of faith in our daily lives.',
    preacher: 'Pastor Evelyn Joshua',
    date: '2024-01-15',
    duration: '45:30',
    videoUrl: '/sermons/faith-sermon.mp4',
    thumbnail: '/sermon.jpeg',
    tags: ['faith', 'inspiration', 'daily-life'],
    category: 'Sunday Service',
    views: 1250
  },
  {
    id: '2',
    title: 'Divine Healing',
    description: 'Understanding God\'s healing power in our lives.',
    preacher: 'Guest Speaker',
    date: '2024-01-08',
    duration: '38:15',
    videoUrl: '/sermons/healing-sermon.mp4',
    thumbnail: '/divinehealing.jpeg',
    tags: ['healing', 'miracles', 'faith'],
    category: 'Special Service',
    views: 890
  },
]

export default function SermonsManagement() {
  const [sermons, setSermons] = useState<Sermon[]>(mockSermons)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', 'Sunday Service', 'Special Service', 'Bible Study', 'Youth Service']

  const filteredSermons = sermons.filter(sermon => {
    const matchesSearch = sermon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sermon.preacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sermon.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || sermon.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>, sermonId: string) => {
    const file = event.target.files?.[0]
    if (file) {
      // Simulate video upload
      const videoUrl = URL.createObjectURL(file)
      setSermons(prev => prev.map(sermon => 
        sermon.id === sermonId 
          ? { ...sermon, videoUrl, duration: '00:00' }
          : sermon
      ))
    }
  }

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>, sermonId: string) => {
    const file = event.target.files?.[0]
    if (file) {
      const thumbnail = URL.createObjectURL(file)
      setSermons(prev => prev.map(sermon => 
        sermon.id === sermonId 
          ? { ...sermon, thumbnail }
          : sermon
      ))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sermons</h1>
          <p className="text-gray-600">Manage your sermon videos and content</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Sermon
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search sermons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Sermons Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSermons.map((sermon) => (
          <Card key={sermon.id} className="overflow-hidden">
            <div className="aspect-video bg-gray-100 relative">
              {sermon.thumbnail ? (
                <img
                  src={sermon.thumbnail}
                  alt={sermon.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Play className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant="secondary">{sermon.category}</Badge>
              </div>
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">{sermon.title}</CardTitle>
              <p className="text-sm text-gray-600 line-clamp-2">{sermon.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    <span>{sermon.preacher}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{sermon.date}</span>
                  </div>
                </div>
                <span>{sermon.duration}</span>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {sermon.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
              
              <div className="text-sm text-gray-500">
                {sermon.views} views
              </div>

              {/* Upload Controls */}
              <div className="space-y-2 pt-3 border-t">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label className="text-xs">Video File</Label>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleVideoUpload(e, sermon.id)}
                      className="text-xs"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Thumbnail</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleThumbnailUpload(e, sermon.id)}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-red-600">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSermons.length === 0 && (
        <div className="text-center py-12">
          <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sermons found</h3>
          <p className="text-gray-600">Upload your first sermon to get started</p>
        </div>
      )}
    </div>
  )
}