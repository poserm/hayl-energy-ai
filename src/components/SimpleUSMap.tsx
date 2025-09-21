'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { STATE_COORDINATES } from '@/lib/map-utils'

// Dynamic imports to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false })

interface SimpleUSMapProps {
  height?: string
  width?: string
  selectedState?: string
}

export default function SimpleUSMap({ height = '500px', width = '100%', selectedState }: SimpleUSMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [geoData, setGeoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    setIsClient(true)
    
    const loadUSStates = async () => {
      try {
        setLoading(true)
        console.log('Loading US state boundaries...')
        
        // Use a direct, reliable US states GeoJSON source
        const response = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
        
        if (!response.ok) {
          throw new Error('Failed to fetch US states data')
        }
        
        const data = await response.json()
        console.log('US states GeoJSON data loaded:', data)
        
        setGeoData(data)
        
      } catch (error) {
        console.error('Error loading map data:', error)
        setError('Failed to load map data')
        
        // Use a simple fallback that loads successfully without boxes
        const fallbackData = {
          type: 'FeatureCollection',
          features: []
        }
        setGeoData(fallbackData)
      } finally {
        setLoading(false)
      }
    }
    
    loadUSStates()
  }, [])

  // Zoom to selected state when it changes
  useEffect(() => {
    console.log('SimpleUSMap: selectedState changed to:', selectedState)
    console.log('SimpleUSMap: mapRef.current exists:', !!mapRef.current)
    console.log('SimpleUSMap: STATE_COORDINATES keys:', Object.keys(STATE_COORDINATES))
    
    // Add a small delay to ensure map is fully initialized
    const timer = setTimeout(() => {
      if (selectedState && mapRef.current && STATE_COORDINATES[selectedState]) {
        const stateCoords = STATE_COORDINATES[selectedState]
        const bounds = [
          [stateCoords.bounds.south, stateCoords.bounds.west],
          [stateCoords.bounds.north, stateCoords.bounds.east]
        ]
        
        console.log('SimpleUSMap: Zooming to state:', selectedState, bounds)
        try {
          mapRef.current.fitBounds(bounds, { 
            padding: [30, 30],
            maxZoom: 7,
            duration: 1.5
          })
        } catch (error) {
          console.error('Error zooming to state:', error)
        }
      } else if (!selectedState && mapRef.current) {
        // Reset to US view when no state selected
        console.log('SimpleUSMap: Resetting to US view')
        try {
          mapRef.current.setView([39.8283, -98.5795], 4, { duration: 1.5 })
        } catch (error) {
          console.error('Error resetting view:', error)
        }
      } else if (selectedState && mapRef.current) {
        console.log('SimpleUSMap: State not found in STATE_COORDINATES:', selectedState)
        console.log('Available states:', Object.keys(STATE_COORDINATES))
      } else if (selectedState && !mapRef.current) {
        console.log('SimpleUSMap: Map reference not available yet, state:', selectedState)
      }
    }, 100) // Small delay to ensure map is ready
    
    return () => clearTimeout(timer)
  }, [selectedState])

  // Simple style for state boundaries - just lines, no fills
  const stateStyle = {
    color: '#666666',
    weight: 2,
    opacity: 1,
    fillOpacity: 0,
    fill: false
  }

  if (!isClient) {
    return (
      <div style={{ height, width }} className="bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ height, width }} className="bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
          <div className="text-gray-500">Loading US map...</div>
        </div>
      </div>
    )
  }

  if (error && !geoData) {
    return (
      <div style={{ height, width }}>
        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          attributionControl={true}
          whenCreated={(mapInstance: any) => {
            console.log('Map instance created for error state')
            mapRef.current = mapInstance
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
      </div>
    )
  }

  return (
    <div style={{ height, width }}>
      <MapContainer
        center={[39.8283, -98.5795]} // Center of United States
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        attributionControl={true}
        zoomControl={true}
        whenCreated={(mapInstance: any) => {
          console.log('Main map instance created')
          mapRef.current = mapInstance
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {geoData && (
          <GeoJSON
            data={geoData}
            style={stateStyle}
            interactive={false}
          />
        )}
      </MapContainer>
    </div>
  )
}