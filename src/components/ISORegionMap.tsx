'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic imports to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false })

interface ISORegionMapProps {
  selectedRegion?: string
  onRegionClick?: (region: string) => void
}

// Define ISO/RTO regions and their member states
const ISO_REGIONS: Record<string, string[]> = {
  'CAISO': ['California'],
  'ERCOT': ['Texas'],
  'ISO-NE': ['Connecticut', 'Maine', 'Massachusetts', 'New Hampshire', 'Rhode Island', 'Vermont'],
  'MISO': ['Arkansas', 'Illinois', 'Indiana', 'Iowa', 'Kentucky', 'Louisiana', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'North Dakota', 'South Dakota', 'Wisconsin'],
  'NYISO': ['New York'],
  'PJM': ['Delaware', 'Illinois', 'Indiana', 'Kentucky', 'Maryland', 'Michigan', 'New Jersey', 'North Carolina', 'Ohio', 'Pennsylvania', 'Tennessee', 'Virginia', 'West Virginia', 'District of Columbia'],
  'SPP': ['Arkansas', 'Kansas', 'Louisiana', 'Mississippi', 'Missouri', 'Nebraska', 'New Mexico', 'Oklahoma', 'North Dakota', 'South Dakota', 'Texas', 'Wyoming']
}

// Color scheme for each ISO/RTO region
const REGION_COLORS: Record<string, string> = {
  'CAISO': '#3b82f6',    // Blue
  'ERCOT': '#10b981',    // Green
  'ISO-NE': '#8b5cf6',   // Purple
  'MISO': '#f59e0b',     // Amber
  'NYISO': '#ef4444',    // Red
  'PJM': '#06b6d4',      // Cyan
  'SPP': '#ec4899'       // Pink
}

// Create a map of state name to ISO regions
const STATE_TO_REGIONS: Record<string, string[]> = {}
Object.entries(ISO_REGIONS).forEach(([region, states]) => {
  states.forEach(state => {
    if (!STATE_TO_REGIONS[state]) {
      STATE_TO_REGIONS[state] = []
    }
    STATE_TO_REGIONS[state].push(region)
  })
})

export default function ISORegionMap({ selectedRegion, onRegionClick }: ISORegionMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [geoData, setGeoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)

    const loadUSStates = async () => {
      try {
        setLoading(true)
        console.log('ISORegionMap: Loading US state boundaries...')

        // Use a direct, reliable US states GeoJSON source
        const response = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')

        if (!response.ok) {
          throw new Error('Failed to fetch US states data')
        }

        const data = await response.json()
        console.log('ISORegionMap: US states GeoJSON data loaded:', data)

        setGeoData(data)

      } catch (error) {
        console.error('ISORegionMap: Error loading map data:', error)
        setError('Failed to load map data')
      } finally {
        setLoading(false)
      }
    }

    loadUSStates()
  }, [])

  // Style function for state boundaries based on ISO/RTO regions
  const stateStyle = (feature: any) => {
    const stateName = feature.properties.name
    const regions = STATE_TO_REGIONS[stateName] || []

    // If a specific region is selected
    if (selectedRegion) {
      if (regions.includes(selectedRegion)) {
        return {
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.7,
          fillColor: REGION_COLORS[selectedRegion],
          fill: true
        }
      }
      // Non-selected states are grayed out
      return {
        color: '#cccccc',
        weight: 1,
        opacity: 0.5,
        fillOpacity: 0.2,
        fillColor: '#e5e7eb',
        fill: true
      }
    }

    // No region selected - show all regions with their colors
    if (regions.length > 0) {
      // Use the first region's color if state belongs to multiple regions
      return {
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.6,
        fillColor: REGION_COLORS[regions[0]],
        fill: true
      }
    }

    // Non-ISO states
    return {
      color: '#999999',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.2,
      fillColor: '#e5e7eb',
      fill: true
    }
  }

  // Handle state click
  const onEachFeature = (feature: any, layer: any) => {
    const stateName = feature.properties.name
    const regions = STATE_TO_REGIONS[stateName] || []

    layer.on({
      mouseover: (e: any) => {
        const layer = e.target
        layer.setStyle({
          weight: 3,
          color: '#000000',
          fillOpacity: 0.8
        })
      },
      mouseout: (e: any) => {
        const layer = e.target
        const style = stateStyle(feature)
        layer.setStyle(style)
      },
      click: () => {
        if (regions.length > 0 && onRegionClick) {
          onRegionClick(regions[0])
        }
      }
    })

    // Bind tooltip
    const regionText = regions.length > 0 ? regions.join(', ') : 'Non-ISO Region'
    layer.bindTooltip(`<strong>${stateName}</strong><br/>${regionText}`, {
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
          <div className="text-gray-500">Loading ISO/RTO map...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full bg-red-50 flex items-center justify-center">
        <div className="text-red-600">Error loading map data</div>
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

        {geoData && (
          <GeoJSON
            key={selectedRegion || 'all'}
            data={geoData}
            style={stateStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-[1000]">
        <div className="text-xs font-semibold text-gray-700 mb-2">ISO/RTO Regions</div>
        <div className="space-y-1">
          {Object.entries(REGION_COLORS).map(([region, color]) => (
            <div
              key={region}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
              onClick={() => onRegionClick && onRegionClick(region)}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-700">{region}</span>
            </div>
          ))}
          {selectedRegion && (
            <button
              onClick={() => onRegionClick && onRegionClick('')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline w-full text-left"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>
    </div>
  )
}