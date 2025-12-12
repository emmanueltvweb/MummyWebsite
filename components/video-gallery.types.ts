export interface VideoItem {
  id: string
  title: string
  thumbnail: string
  duration: string
  views: string
  date: string
  description?: string
}

export interface VideoGalleryProps {
  videos?: VideoItem[]
  className?: string
  title?: string
  subtitle?: string
}