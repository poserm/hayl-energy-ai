'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic imports to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false })

interface SimpleUSMapProps {
  height?: string
  width?: string
}

export default function SimpleUSMap({ height = '500px', width = '100%' }: SimpleUSMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [geoData, setGeoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        
        // Use minimal fallback data for demonstration
        const fallbackData = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { name: 'Virginia' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-83.675, 36.540],
                  [-75.242, 36.540], 
                  [-75.242, 39.466],
                  [-83.675, 39.466],
                  [-83.675, 36.540]
                ]]
              }
            }
          ]
        }
        setGeoData(fallbackData)
      } finally {
        setLoading(false)
      }
    }
    
    loadUSStates()
  }, [])

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
      <div style={{ height, width }} className="bg-gray-100 flex items-center justify-center">
        <div className="text-center text-red-500">
          <div>Failed to load map</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height, width }} className="rounded-lg overflow-hidden">
      <MapContainer
        center={[39.8283, -98.5795]} // Center of United States
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {geoData && (
          <GeoJSON
            data={geoData}
            style={stateStyle}
          />
        )}
      </MapContainer>
    </div>
  )
}