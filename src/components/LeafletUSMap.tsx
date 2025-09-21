'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Import Leaflet dynamically to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false })

interface Plant {
  plantName: string
  county: string | null
  technology: string
  totalCapacity: number
  latitude: number
  longitude: number
  generatorCount: number
}

interface LeafletUSMapProps {
  selectedState: string
  plants: Plant[]
  loading: boolean
  onStateSelect?: (state: string) => void
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

// State name mapping for consistency
const stateNameMap: { [key: string]: string } = {
  'Delaware': 'Delaware',
  'Illinois': 'Illinois', 
  'Indiana': 'Indiana',
  'Kentucky': 'Kentucky',
  'Maryland': 'Maryland',
  'Michigan': 'Michigan',
  'New Jersey': 'New Jersey',
  'North Carolina': 'North Carolina',
  'Ohio': 'Ohio', 
  'Pennsylvania': 'Pennsylvania',
  'Tennessee': 'Tennessee',
  'Virginia': 'Virginia',
  'West Virginia': 'West Virginia',
  'District of Columbia': 'District of Columbia'
}

// US States GeoJSON data (simplified for key PJM states)
const usStatesGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Virginia", "abbr": "VA" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-83.675, 36.540], [-75.242, 36.540], [-75.770, 37.930], [-77.040, 38.804], 
          [-78.349, 39.464], [-80.934, 39.200], [-83.001, 38.783], [-83.675, 36.540]
        ]]
      }
    },
    {
      "type": "Feature", 
      "properties": { "name": "Pennsylvania", "abbr": "PA" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-80.934, 39.200], [-75.350, 39.881], [-74.705, 40.635], [-75.527, 41.203],
          [-79.762, 42.269], [-80.600, 42.000], [-80.934, 39.200]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Ohio", "abbr": "OH" },
      "geometry": {
        "type": "Polygon", 
        "coordinates": [[
          [-84.820, 38.404], [-80.934, 39.200], [-80.934, 41.977], [-84.801, 41.694],
          [-84.807, 39.103], [-84.820, 38.404]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Maryland", "abbr": "MD" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-79.487, 39.200], [-75.048, 38.451], [-75.994, 38.228], [-79.487, 39.200]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "West Virginia", "abbr": "WV" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-82.644, 38.161], [-78.349, 39.464], [-77.040, 38.804], [-81.106, 37.208], [-82.644, 38.161]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "North Carolina", "abbr": "NC" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-84.321, 34.988], [-75.460, 34.729], [-76.910, 36.550], [-83.109, 36.497], [-84.321, 34.988]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Delaware", "abbr": "DE" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-75.770, 38.451], [-75.047, 38.451], [-75.047, 39.881], [-75.350, 39.881], [-75.770, 38.451]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "New Jersey", "abbr": "NJ" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-75.350, 39.881], [-74.027, 40.008], [-74.705, 40.635], [-75.350, 39.881]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Illinois", "abbr": "IL" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-91.513, 36.970], [-87.019, 36.970], [-87.041, 42.508], [-90.639, 42.510], [-91.513, 36.970]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Indiana", "abbr": "IN" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-88.097, 37.771], [-84.784, 37.771], [-84.807, 39.103], [-87.041, 42.508], [-88.097, 37.771]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Kentucky", "abbr": "KY" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-89.571, 36.497], [-81.964, 36.497], [-83.001, 38.783], [-89.404, 38.122], [-89.571, 36.497]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Michigan", "abbr": "MI" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-90.418, 41.696], [-82.413, 41.677], [-82.898, 45.023], [-88.378, 45.023], [-90.418, 41.696]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Tennessee", "abbr": "TN" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-90.310, 34.982], [-81.647, 35.016], [-83.109, 36.497], [-89.571, 36.497], [-90.310, 34.982]
        ]]
      }
    }
  ]
}

export default function LeafletUSMap({ selectedState, plants, loading, onStateSelect }: LeafletUSMapProps) {
  const mapRef = useRef<any>(null)
  const [map, setMap] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle state selection and zooming
  const handleStateClick = (stateName: string) => {
    if (onStateSelect) {
      onStateSelect(stateName)
    }
    
    // Find the state feature and zoom to it
    const stateFeature = usStatesGeoJSON.features.find(
      feature => feature.properties.name === stateName
    )
    
    if (stateFeature && map) {
      const bounds = getBounds(stateFeature.geometry.coordinates[0])
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }

  // Calculate bounds from coordinates
  const getBounds = (coordinates: number[][]) => {
    const lats = coordinates.map(coord => coord[1])
    const lngs = coordinates.map(coord => coord[0])
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ]
  }

  // Style function for states
  const getStateStyle = (feature: any) => {
    const isSelected = feature.properties.name === selectedState
    return {
      fillColor: isSelected ? '#3B82F6' : '#f3f4f6',
      weight: 2,
      opacity: 1,
      color: isSelected ? '#1e40af' : '#6b7280',
      dashArray: '',
      fillOpacity: isSelected ? 0.7 : 0.3
    }
  }

  // Handle feature events
  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target
        layer.setStyle({
          weight: 3,
          color: '#1e40af',
          dashArray: '',
          fillOpacity: 0.7
        })
        layer.bringToFront()
      },
      mouseout: (e: any) => {
        layer.setStyle(getStateStyle(feature))
      },
      click: (e: any) => {
        handleStateClick(feature.properties.name)
      }
    })

    // Bind popup
    layer.bindPopup(`
      <div class="p-2">
        <h3 class="font-semibold">${feature.properties.name}</h3>
        <p class="text-sm text-gray-600">Click to select this state</p>
      </div>
    `)
  }

  // Zoom to selected state when it changes
  useEffect(() => {
    if (selectedState && map) {
      const stateFeature = usStatesGeoJSON.features.find(
        feature => feature.properties.name === selectedState
      )
      
      if (stateFeature) {
        const bounds = getBounds(stateFeature.geometry.coordinates[0])
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    }
  }, [selectedState, map])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
          <div className="text-sm">Loading map...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden rounded-lg">
      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          <span className="text-sm text-gray-600">Loading generators...</span>
        </div>
      )}

      {/* Map Info */}
      {selectedState && plants.length > 0 && !loading && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
          <div className="text-sm font-medium text-gray-900 mb-1">
            {selectedState}
          </div>
          <div className="text-xs text-gray-600">
            {plants.length} plants • {Math.round(plants.reduce((sum, p) => sum + p.totalCapacity, 0) / 1000)} GW
          </div>
        </div>
      )}

      {/* Reset View Button */}
      <div className="absolute top-4 left-4 z-[1000]">
        <button
          onClick={() => {
            if (map) {
              map.setView([39.8283, -98.5795], 4) // Center of US
            }
          }}
          className="bg-white rounded-lg shadow-lg p-2 text-xs font-medium hover:bg-gray-50"
        >
          Reset View
        </button>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={[39.8283, -98.5795]} // Center of US
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        ref={(mapInstance) => {
          if (mapInstance) {
            setMap(mapInstance)
          }
        }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* State Boundaries */}
        <GeoJSON
          data={usStatesGeoJSON}
          style={getStateStyle}
          onEachFeature={onEachFeature}
          key={selectedState} // Force re-render when selected state changes
        />

        {/* Generator Markers */}
        {plants.map((plant, index) => {
          if (!plant.latitude || !plant.longitude) return null
          
          const color = techColors[plant.technology] || techColors.Other
          const size = Math.max(8, Math.min(24, Math.sqrt(plant.totalCapacity / 1000) * 4))
          
          // Create custom marker using CSS
          return (
            <div key={plant.plantName}>
              {/* We'll add markers using a different approach since we need custom styling */}
            </div>
          )
        })}
      </MapContainer>

      {/* Custom CSS for Leaflet */}
      <style jsx global>{`
        .leaflet-container {
          background: #f1f5f9;
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
      `}</style>
    </div>
  )
}