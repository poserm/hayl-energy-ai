'use client'

import { useEffect, useRef, useState } from 'react'

interface Plant {
  plantName: string
  county: string | null
  technology: string
  totalCapacity: number
  latitude: number
  longitude: number
  generatorCount: number
}

interface GoogleMapProps {
  selectedState: string
  plants: Plant[]
  loading: boolean
}

// State coordinates for map centering
const stateCoordinates: { [key: string]: { lat: number, lng: number, zoom: number } } = {
  'Virginia': { lat: 37.4316, lng: -78.6569, zoom: 7 },
  'Pennsylvania': { lat: 40.2732, lng: -76.8755, zoom: 7 },
  'Ohio': { lat: 40.3888, lng: -82.7649, zoom: 7 },
  'Maryland': { lat: 39.0639, lng: -76.8021, zoom: 8 },
  'West Virginia': { lat: 38.4912, lng: -80.9540, zoom: 8 },
  'North Carolina': { lat: 35.6301, lng: -79.8064, zoom: 7 },
  'Delaware': { lat: 39.3185, lng: -75.5071, zoom: 9 },
  'New Jersey': { lat: 40.2989, lng: -74.5210, zoom: 8 },
  'Illinois': { lat: 40.3363, lng: -89.0022, zoom: 7 },
  'Indiana': { lat: 39.8647, lng: -86.2604, zoom: 7 },
  'Kentucky': { lat: 37.6681, lng: -84.6701, zoom: 7 },
  'Michigan': { lat: 43.3266, lng: -84.5361, zoom: 7 },
  'Tennessee': { lat: 35.7478, lng: -86.7915, zoom: 7 },
  'District of Columbia': { lat: 38.9072, lng: -77.0369, zoom: 11 }
}

// Technology colors matching the dashboard
const techColors: { [key: string]: string } = {
  'Natural Gas': '#3B82F6',
  'Coal': '#374151',
  'Nuclear': '#8B5CF6',
  'Solar': '#EAB308',
  'Wind': '#10B981',
  'Hydro': '#06B6D4',
  'Battery Storage': '#6366F1',
  'Biomass': '#059669',
  'Other': '#6B7280'
}

export default function GoogleMap({ selectedState, plants, loading }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&libraries=geometry`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      setIsLoaded(true)
    }
    
    script.onerror = () => {
      setError('Failed to load Google Maps. Please check your API key.')
    }
    
    document.head.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    const stateCoord = stateCoordinates[selectedState] || { lat: 39.8283, lng: -98.5795, zoom: 4 }
    
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: stateCoord,
      zoom: stateCoord.zoom,
      mapTypeId: 'terrain',
      styles: [
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#c9b2a6' }]
        },
        {
          featureType: 'administrative.land_parcel',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#dcd2be' }]
        },
        {
          featureType: 'administrative.land_parcel',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#ae9e90' }]
        }
      ]
    })
  }, [isLoaded, selectedState])

  // Update markers when plants data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !plants || loading) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Add new markers
    plants.forEach((plant) => {
      if (!plant.latitude || !plant.longitude) return

      const color = techColors[plant.technology] || techColors.Other
      
      // Calculate marker size based on capacity
      const size = Math.max(8, Math.min(24, Math.sqrt(plant.totalCapacity / 1000) * 4))
      
      // Create custom icon
      const icon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 0.8,
        stroke: '#FFFFFF',
        strokeWeight: 2,
        scale: size / 2
      }

      const marker = new window.google.maps.Marker({
        position: { lat: plant.latitude, lng: plant.longitude },
        map: mapInstanceRef.current,
        title: plant.plantName,
        icon: icon
      })

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3 max-w-xs">
            <h3 class="font-semibold text-gray-900 mb-2">${plant.plantName}</h3>
            ${plant.county ? `<p class="text-sm text-gray-600 mb-1">${plant.county} County</p>` : ''}
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Technology:</span>
                <span class="font-medium" style="color: ${color}">${plant.technology}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Capacity:</span>
                <span class="font-medium">${plant.totalCapacity.toLocaleString()} MW</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Generators:</span>
                <span class="font-medium">${plant.generatorCount}</span>
              </div>
            </div>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker)
      })

      markersRef.current.push(marker)
    })

    // Zoom to state if we have plants
    if (plants.length > 0 && selectedState) {
      const stateCoord = stateCoordinates[selectedState]
      if (stateCoord && mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(stateCoord)
        mapInstanceRef.current.setZoom(stateCoord.zoom)
      }
    }
  }, [plants, loading, selectedState])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">🗺️</div>
          <div className="text-sm mb-2">Google Maps Error</div>
          <div className="text-xs text-gray-400">{error}</div>
          <div className="text-xs text-gray-400 mt-2">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local
          </div>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
          <div className="text-sm">Loading Google Maps...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {loading && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          <span className="text-sm text-gray-600">Loading generators...</span>
        </div>
      )}
      
      {plants && plants.length > 0 && !loading && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <div className="text-sm font-medium text-gray-900 mb-1">
            {selectedState}
          </div>
          <div className="text-xs text-gray-600">
            {plants.length} plants • {Math.round(plants.reduce((sum, p) => sum + p.totalCapacity, 0) / 1000)} GW
          </div>
        </div>
      )}
    </div>
  )
}