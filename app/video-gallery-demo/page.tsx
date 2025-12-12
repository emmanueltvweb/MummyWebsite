import { VideoGallery } from '@/components/video-gallery'
import SplashCursor from "@/components/SplashCursor"

/**
 * Example page demonstrating the VideoGallery component integration
 * This shows how to use the component with custom videos and styling
 */
export default function VideoGalleryDemo() {
  // Custom video data (optional - component has default videos)
  const customVideos = [
    {
      id: 'custom-1',
      title: 'Custom Sermon Title 1',
      thumbnail: '/custom-sermon-1.jpg',
      duration: '35:45',
      views: '5.2K',
      date: 'Dec 1, 2025',
      description: 'A powerful message about faith and perseverance.'
    },
    {
      id: 'custom-2',
      title: 'Custom Sermon Title 2',
      thumbnail: '/custom-sermon-2.jpg',
      duration: '42:30',
      views: '7.8K',
      date: 'Nov 24, 2025',
      description: 'Understanding God\'s plan for your life.'
    },
    // Add more videos as needed...
  ]

  return (
    <main className="min-h-screen bg-background">
      <SplashCursor />
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary mb-6">
            Sermon Library
          </h1>
          <p className="text-xl text-foreground/70 mb-8">
            Explore our collection of powerful sermons and teachings
          </p>
        </div>
      </section>

      {/* Video Gallery Section */}
      <section className="py-16">
        <VideoGallery
          // Use custom videos (optional - remove to use default videos)
          videos={customVideos}
          
          // Custom title and subtitle
          title="Featured Sermons"
          subtitle="Watch these life-changing messages from Pastor Evelyn Joshua"
          
          // Additional styling (optional)
          className="bg-gradient-to-b from-background to-muted/20"
        />
      </section>

      {/* Additional Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary mb-6">
            More Content Coming Soon
          </h2>
          <p className="text-lg text-foreground/70">
            Stay tuned for more powerful messages and teachings.
          </p>
        </div>
      </section>
    </main>
  )
}