"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Navigation, ExternalLink } from "lucide-react"

// TypeScript declarations for Google Maps
declare global {
  interface Window {
    google?: any;
  }
}

const churchLocation = {
  lat: 6.5244,
  lng: 3.3792,
  address: "1, Segun Irefin Street, Agodo, Egbe, Lagos, Nigeria",
  name: "The Synagogue, Church Of All Nations (SCOAN)"
}

// Global variable to track if Google Maps API is being loaded
let isGoogleMapsLoading = false
let googleMapsCallbacks: (() => void)[] = []

export function ChurchMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)

  const loadGoogleMapsAPI = () => {
    return new Promise<void>((resolve, reject) => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        resolve()
        return
      }

      // If already loading, add to callbacks
      if (isGoogleMapsLoading) {
        googleMapsCallbacks.push(resolve)
        return
      }

      // Start loading
      isGoogleMapsLoading = true

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=places&callback=initGoogleMaps`
      script.async = true
      script.defer = true
      
      // Global callback for Google Maps
      ;(window as any).initGoogleMaps = () => {
        setIsMapLoaded(true)
        resolve()
        // Call all pending callbacks
        googleMapsCallbacks.forEach(callback => callback())
        googleMapsCallbacks = []
        isGoogleMapsLoading = false
        delete (window as any).initGoogleMaps
      }

      script.onerror = () => {
        setMapError(true)
        reject(new Error('Failed to load Google Maps API'))
        isGoogleMapsLoading = false
        googleMapsCallbacks = []
        delete (window as any).initGoogleMaps
      }

      document.head.appendChild(script)
    })
  }

  useEffect(() => {
    loadGoogleMapsAPI()
      .then(() => {
        if (mapRef.current && window.google) {
          initializeMap()
        }
      })
      .catch(() => {
        setMapError(true)
      })

    return () => {
      // Cleanup function
      const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
      scripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      })
    }
  }, [])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: churchLocation,
        zoom: 15,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        // Disable unnecessary features for better performance
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false
      })

      // Add marker
      const marker = new window.google.maps.Marker({
        position: churchLocation,
        map,
        title: churchLocation.name,
        animation: window.google.maps.Animation.DROP
      })

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
              ${churchLocation.name}
            </h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.4;">
              ${churchLocation.address}
            </p>
          </div>
        `
      })

      // Open info window by default
      infoWindow.open(map, marker)

      // Close info window when map is clicked
      map.addListener('click', () => {
        infoWindow.close()
      })

      // Reopen info window when marker is clicked
      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError(true)
    }
  }

  const handleGetDirections = () => {
    const encodedAddress = encodeURIComponent(churchLocation.address)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank')
  }

  const handleOpenInGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(churchLocation.address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
  }

  return (
    <section className="py-16 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Find Us on the Map
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get directions to The SCOAN and plan your visit with our interactive map
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <div className="relative rounded-xl overflow-hidden shadow-lg">
              {mapError ? (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Map could not be loaded</p>
                    <p className="text-sm text-muted-foreground/70 mb-4">
                      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 
                        ? "There may be an issue with the map configuration." 
                        : "Google Maps API key is not configured."}
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={handleGetDirections}
                        className="w-full sm:w-auto px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
                      >
                        Get Directions
                      </button>
                      <button
                        onClick={handleOpenInGoogleMaps}
                        className="w-full sm:w-auto px-4 py-2 bg-background border border-border text-foreground rounded-md hover:bg-accent/10 transition-colors ml-2"
                      >
                        Open in Google Maps
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  ref={mapRef}
                  className="aspect-video bg-muted"
                  aria-label="Interactive map showing church location"
                />
              )}
              
              {!isMapLoaded && !mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Details & Actions */}
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                Location Details
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {churchLocation.address}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGetDirections}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </button>
              
              <button
                onClick={handleOpenInGoogleMaps}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background border border-border text-foreground rounded-lg hover:bg-accent/10 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Maps
              </button>
            </div>

            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Map Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Interactive zoom controls</li>
                <li>• Street view available</li>
                <li>• Satellite imagery option</li>
                <li>• Traffic information</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}