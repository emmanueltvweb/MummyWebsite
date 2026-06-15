'use client'

import { HomePageEditor } from '@/components/admin/home-page-editor'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function HomePageEdit() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async (data: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/home-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Home page updated successfully!')
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
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/pages')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <HomePageEditor
          pageId="home"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}