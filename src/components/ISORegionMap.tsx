'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic imports to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false })

interface ISORegionMapProps {
  selectedState?: string
  onStateClick?: (state: string) => void
}

export default function ISORegionMap({ selectedState, onStateClick }: ISORegionMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [geoData, setGeoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)

    const loadUSStates = async () => {
      try {
        setLoading(true)
        console.log('ISORegionMap: Loading US state boundaries...')

        // Use the same reliable US states GeoJSON source as SimpleUSMap
        const response = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')

        if (!response.ok) {
          throw new Error('Failed to fetch US states data')
        }

        const data = await response.json()
        console.log('ISORegionMap: US states GeoJSON data loaded successfully')

        setGeoData(data)

      } catch (error) {
        console.error('ISORegionMap: Error loading map data:', error)
        // Set empty data instead of showing error
        setGeoData({
          type: 'FeatureCollection',
          features: []
        })
      } finally {
        setLoading(false)
      }
    }

    loadUSStates()
  }, [])

  // Simple style function for state boundaries
  const stateStyle = (feature: any) => {
    const stateName = feature.properties.name
    const isSelected = selectedState === stateName

    return {
      color: isSelected ? '#3b82f6' : '#666666',
      weight: isSelected ? 3 : 2,
      opacity: 1,
      fillOpacity: isSelected ? 0.3 : 0.1,
      fillColor: isSelected ? '#3b82f6' : '#e5e7eb',
      fill: true
    }
  }

  // Handle state interactions
  const onEachFeature = (feature: any, layer: any) => {
    const stateName = feature.properties.name

    layer.on({
      mouseover: (e: any) => {
        const layer = e.target
        layer.setStyle({
          weight: 3,
          color: '#000000',
          fillOpacity: 0.5
        })
      },
      mouseout: (e: any) => {
        const layer = e.target
        const style = stateStyle(feature)
        layer.setStyle(style)
      },
      click: () => {
        if (onStateClick) {
          onStateClick(stateName)
        }
      }
    })

    // Bind tooltip
    layer.bindTooltip(`<strong>${stateName}</strong>`, {
      permanent: false,
      direction: 'top'
    })
  }

  if (!isClient) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
          <div className="text-gray-500">Loading map...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[39.8283, -98.5795]} // Center of United States
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        attributionControl={true}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {geoData && geoData.features && geoData.features.length > 0 && (
          <GeoJSON
            key={selectedState || 'all'}
            data={geoData}
            style={stateStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  )
}