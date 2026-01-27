'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Edit, Eye, Trash2, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Page {
  id: string
  title: string
  slug: string
  status: 'published' | 'draft'
  lastModified: string
  lastModifiedBy: string
}

const mockPages: Page[] = [
  { id: '1', title: 'Home', slug: '/', status: 'published', lastModified: '2024-01-15', lastModifiedBy: 'Admin User' },
  { id: '2', title: 'About TB Joshua', slug: '/about/tb-joshua', status: 'published', lastModified: '2024-01-14', lastModifiedBy: 'Editor User' },
  { id: '3', title: 'About SCOAN', slug: '/about/scoan', status: 'published', lastModified: '2024-01-13', lastModifiedBy: 'Admin User' },
  { id: '4', title: 'About Emmanuel TV', slug: '/about/emmanuel-tv', status: 'published', lastModified: '2024-01-12', lastModifiedBy: 'Editor User' },
  { id: '5', title: 'Sermons', slug: '/sermon', status: 'published', lastModified: '2024-01-11', lastModifiedBy: 'Admin User' },
  { id: '6', title: 'Crusade/Outreach', slug: '/crusade-outreach', status: 'published', lastModified: '2024-01-10', lastModifiedBy: 'Editor User' },
  { id: '7', title: 'Visit Us', slug: '/visit-us', status: 'published', lastModified: '2024-01-10', lastModifiedBy: 'Editor User' },
]

export default function PagesManagement() {
  const [pages, setPages] = useState<Page[]>(mockPages)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (pageId: string) => {
    // Navigate to edit page
    window.location.href = `/admin/pages/${pageId}/edit`
  }

  const handlePreview = (slug: string) => {
    // Open preview in new tab
    window.open(slug, '_blank')
  }

  const handleDelete = (pageId: string) => {
    if (confirm('Are you sure you want to delete this page?')) {
      setPages(pages.filter(page => page.id !== pageId))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pages</h1>
          <p className="text-gray-600">Manage your website pages</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Page
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="search"
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {/* Pages Grid */}
      <div className="grid gap-4">
        {filteredPages.map((page) => (
          <Card key={page.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <CardDescription className="mt-1">{page.slug}</CardDescription>
                </div>
                <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                  {page.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Last modified: {page.lastModified} by {page.lastModifiedBy}</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(page.slug)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(page.id)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(page.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}