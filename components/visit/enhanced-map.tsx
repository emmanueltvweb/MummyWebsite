"use client"

import { useState } from "react"
import { MapPin, Navigation, ExternalLink, Loader2, AlertCircle } from "lucide-react"

export function EnhancedMap() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const churchLocation = {
    address: "1, Segun Irefin Street, Agodo, Egbe, Lagos, Nigeria",
    name: "The Synagogue, Church Of All Nations (SCOAN)"
  }

  const handleGetDirections = () => {
    const encodedAddress = encodeURIComponent(churchLocation.address)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank')
  }

  const handleViewLargerMap = () => {
    const encodedAddress = encodeURIComponent(churchLocation.address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = () => {
    setError('Failed to load the map. Please check your internet connection.')
    setIsLoading(false)
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Find Us
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visit The Synagogue, Church Of All Nations at our location in Lagos, Nigeria
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <div className="bg-background rounded-lg shadow-lg overflow-hidden">
              {/* Loading State */}
              {isLoading && (
                <div className="aspect-[4/3] flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="aspect-[4/3] flex items-center justify-center bg-muted">
                  <div className="text-center max-w-sm">
                    <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="text-destructive font-medium mb-2">Map Loading Error</p>
                    <p className="text-muted-foreground text-sm mb-4">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm text-primary hover:text-primary/80 underline"
                    >
                      Refresh Page
                    </button>
                  </div>
                </div>
              )}

              {/* Google Maps Iframe Embed */}
              {!error && (
                <div className="relative">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-muted-foreground">Loading map...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.8043008599066!2d3.2699999757131946!3d6.546377622895603!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xaac3a9c8627f4abd%3A0x9f6fef23232e072a!2sThe%20Synagogue%2C%20Church%20Of%20All%20Nations%20(SCOAN)!5e0!3m2!1sen!2sng!4v1765822884579!5m2!1sen!2sng"
                    width="600"
                    height="450"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full aspect-[4/3]"
                    title="Interactive map showing The Synagogue, Church Of All Nations location"
                    aria-label="Interactive map showing church location"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-6">
            {/* Address Card */}
            <div className="bg-background rounded-lg shadow-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{churchLocation.name}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {churchLocation.address}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleGetDirections}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  aria-label="Get directions to the church"
                >
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </button>
                <button
                  onClick={handleViewLargerMap}
                  className="w-full inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  aria-label="View larger map in new window"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Larger Map
                </button>
              </div>
            </div>

            {/* Service Information */}
            <div className="bg-background rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">Service Time</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Sunday Service:</strong> 8:00 AM</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-background rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">Contact</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Phone:</strong> +234 1 123 4567</p>
                <p><strong>Email:</strong> info@scoan.org</p>
                <p><strong>Website:</strong> www.scoan.org</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}