'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Import Leaflet dynamically to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

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

// US Census Bureau states mapping for consistent naming
const stateNameMap: { [key: string]: string } = {
  'Alabama': 'Alabama', 'Alaska': 'Alaska', 'Arizona': 'Arizona', 'Arkansas': 'Arkansas',
  'California': 'California', 'Colorado': 'Colorado', 'Connecticut': 'Connecticut',
  'Delaware': 'Delaware', 'Florida': 'Florida', 'Georgia': 'Georgia', 'Hawaii': 'Hawaii',
  'Idaho': 'Idaho', 'Illinois': 'Illinois', 'Indiana': 'Indiana', 'Iowa': 'Iowa',
  'Kansas': 'Kansas', 'Kentucky': 'Kentucky', 'Louisiana': 'Louisiana', 'Maine': 'Maine',
  'Maryland': 'Maryland', 'Massachusetts': 'Massachusetts', 'Michigan': 'Michigan',
  'Minnesota': 'Minnesota', 'Mississippi': 'Mississippi', 'Missouri': 'Missouri',
  'Montana': 'Montana', 'Nebraska': 'Nebraska', 'Nevada': 'Nevada', 'New Hampshire': 'New Hampshire',
  'New Jersey': 'New Jersey', 'New Mexico': 'New Mexico', 'New York': 'New York',
  'North Carolina': 'North Carolina', 'North Dakota': 'North Dakota', 'Ohio': 'Ohio',
  'Oklahoma': 'Oklahoma', 'Oregon': 'Oregon', 'Pennsylvania': 'Pennsylvania',
  'Rhode Island': 'Rhode Island', 'South Carolina': 'South Carolina', 'South Dakota': 'South Dakota',
  'Tennessee': 'Tennessee', 'Texas': 'Texas', 'Utah': 'Utah', 'Vermont': 'Vermont',
  'Virginia': 'Virginia', 'Washington': 'Washington', 'West Virginia': 'West Virginia',
  'Wisconsin': 'Wisconsin', 'Wyoming': 'Wyoming', 'District of Columbia': 'District of Columbia',
  'Puerto Rico': 'Puerto Rico'
}

interface GeoJSONFeature {
  type: string
  properties: {
    name?: string
    NAME?: string
    [key: string]: any
  }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
}

interface GeoJSONData {
  type: string
  features: GeoJSONFeature[]
}

export default function LeafletUSMap({ selectedState, plants, loading, onStateSelect }: LeafletUSMapProps) {
  const [map, setMap] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [usStatesGeoJSON, setUsStatesGeoJSON] = useState<GeoJSONData | null>(null)
  const [geoDataLoading, setGeoDataLoading] = useState(true)
  const [geoDataError, setGeoDataError] = useState<string | null>(null)

  // Load real US states GeoJSON data from reliable source
  useEffect(() => {
    setIsClient(true)
    
    const loadGeoJSONData = async () => {
      try {
        setGeoDataLoading(true)
        setGeoDataError(null)
        
        let geoData = null
        
        // Try the most reliable source first - us-states.json
        try {
          console.log('Loading US states GeoJSON data...')
          const response = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
          if (!response.ok) throw new Error('Failed to fetch from primary source')
          geoData = await response.json()
          console.log('Successfully loaded US states GeoJSON data:', geoData)
        } catch (error) {
          console.warn('Primary source failed, trying alternative...', error)
          
          // Fallback to alternative source
          try {
            const response = await fetch('https://eric.clst.org/assets/wiki/uploads/Stuff/gz_2010_us_040_00_5m.json')
            if (!response.ok) throw new Error('Failed to fetch from secondary source')
            geoData = await response.json()
            console.log('Successfully loaded US states from alternative source:', geoData)
          } catch (error2) {
            console.error('All external sources failed, using local fallback')
            throw new Error('Unable to load US states data from external sources')
          }
        }
        
        if (geoData && geoData.features) {
          // Ensure proper state name mapping
          geoData.features = geoData.features.map((feature: any) => {
            const stateName = feature.properties.NAME || feature.properties.name || feature.properties.NAME_1
            return {
              ...feature,
              properties: {
                ...feature.properties,
                name: stateName,
                NAME: stateName
              }
            }
          })
          
          setUsStatesGeoJSON(geoData)
          console.log('GeoJSON data processed and ready:', geoData.features.length, 'states loaded')
        } else {
          throw new Error('Invalid GeoJSON data structure')
        }
        
      } catch (error) {
        console.error('Failed to load GeoJSON data:', error)
        setGeoDataError('Failed to load map data. Please check your internet connection.')
        
        // Create a minimal fallback with just a few key states for PJM region
        const fallbackData = {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "properties": { "name": "Virginia", "NAME": "Virginia" },
              "geometry": {
                "type": "Polygon",
                "coordinates": [[[-83.675, 36.540], [-75.242, 36.540], [-75.770, 37.930], [-77.040, 38.804], [-78.349, 39.464], [-80.934, 39.200], [-83.001, 38.783], [-83.675, 36.540]]]
              }
            },
            {
              "type": "Feature",
              "properties": { "name": "Pennsylvania", "NAME": "Pennsylvania" },
              "geometry": {
                "type": "Polygon",
                "coordinates": [[[-80.934, 39.200], [-75.350, 39.881], [-74.705, 40.635], [-75.527, 41.203], [-79.762, 42.269], [-80.600, 42.000], [-80.934, 39.200]]]
              }
            }
          ]
        }
        setUsStatesGeoJSON(fallbackData)
      } finally {
        setGeoDataLoading(false)
      }
    }
    
    loadGeoJSONData()
  }, [])

  // Handle state selection and zooming
  const handleStateClick = (stateName: string) => {
    if (onStateSelect) {
      onStateSelect(stateName)
    }
    
    if (!usStatesGeoJSON || !map) return
    
    // Find the state feature and zoom to it
    const stateFeature = usStatesGeoJSON.features.find(
      (feature: GeoJSONFeature) => feature.properties.name === stateName || feature.properties.NAME === stateName
    )
    
    if (stateFeature && map) {
      try {
        const bounds = getBoundsFromGeometry(stateFeature.geometry)
        map.fitBounds(bounds, { padding: [20, 20] })
      } catch (error) {
        console.warn('Failed to calculate bounds for state:', stateName, error)
      }
    }
  }

  // Calculate bounds from geometry (handles Polygon and MultiPolygon)
  const getBoundsFromGeometry = (geometry: GeoJSONFeature['geometry']) => {
    let allCoords: number[][] = []
    
    if (geometry.type === 'Polygon') {
      allCoords = geometry.coordinates[0] as number[][]
    } else if (geometry.type === 'MultiPolygon') {
      // Flatten all polygon coordinates
      (geometry.coordinates as number[][][][]).forEach((polygon: number[][][]) => {
        allCoords = allCoords.concat(polygon[0])
      })
    }
    
    if (allCoords.length === 0) {
      // Fallback to center of US
      return [[39.8283, -98.5795], [39.8283, -98.5795]]
    }
    
    const lats = allCoords.map(coord => coord[1])
    const lngs = allCoords.map(coord => coord[0])
    
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ]
  }

  // Style function for states
  const getStateStyle = (feature: GeoJSONFeature) => {
    const stateName = feature.properties.name || feature.properties.NAME || ''
    const isSelected = stateName === selectedState
    
    // PJM states get different styling
    const pjmStates = ['Virginia', 'Pennsylvania', 'Ohio', 'Maryland', 'West Virginia', 
                       'North Carolina', 'Delaware', 'New Jersey', 'Illinois', 'Indiana', 
                       'Kentucky', 'Michigan', 'Tennessee', 'District of Columbia']
    const isPJMState = pjmStates.includes(stateName)
    
    return {
      fillColor: isSelected ? '#3B82F6' : (isPJMState ? '#e2e8f0' : '#f8fafc'),
      weight: isSelected ? 3 : (isPJMState ? 2 : 1),
      opacity: 1,
      color: isSelected ? '#1e40af' : (isPJMState ? '#475569' : '#94a3b8'),
      dashArray: '',
      fillOpacity: isSelected ? 0.8 : (isPJMState ? 0.4 : 0.2)
    }
  }

  // Handle feature events
  const onEachFeature = (feature: GeoJSONFeature, layer: any) => {
    const stateName = feature.properties.name || feature.properties.NAME || ''
    
    layer.on({
      mouseover: () => {
        layer.setStyle({
          weight: 4,
          color: '#1e40af',
          dashArray: '',
          fillOpacity: 0.7
        })
        if (layer.bringToFront) layer.bringToFront()
      },
      mouseout: () => {
        layer.setStyle(getStateStyle(feature))
      },
      click: () => {
        if (stateName) handleStateClick(stateName)
      }
    })

    // Bind popup with state information
    const pjmStates = ['Virginia', 'Pennsylvania', 'Ohio', 'Maryland', 'West Virginia', 
                       'North Carolina', 'Delaware', 'New Jersey', 'Illinois', 'Indiana', 
                       'Kentucky', 'Michigan', 'Tennessee', 'District of Columbia']
    const isPJMState = pjmStates.includes(stateName)
    
    layer.bindPopup(`
      <div class="p-3">
        <h3 class="font-semibold text-lg mb-1">${stateName}</h3>
        <p class="text-sm text-gray-600 mb-2">${isPJMState ? 'PJM Region State' : 'Outside PJM Region'}</p>
        <p class="text-xs text-gray-500">Click to ${isPJMState ? 'explore energy data' : 'select this state'}</p>
      </div>
    `)
  }

  // Zoom to selected state when it changes
  useEffect(() => {
    if (selectedState && map && usStatesGeoJSON) {
      const stateFeature = usStatesGeoJSON.features.find(
        (feature: GeoJSONFeature) => feature.properties.name === selectedState || feature.properties.NAME === selectedState
      )
      
      if (stateFeature) {
        try {
          const bounds = getBoundsFromGeometry(stateFeature.geometry)
          map.fitBounds(bounds, { padding: [20, 20] })
        } catch (error) {
          console.warn('Failed to zoom to selected state:', selectedState, error)
        }
      }
    }
  }, [selectedState, map, usStatesGeoJSON])

  if (!isClient || geoDataLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
          <div className="text-sm">{geoDataLoading ? 'Loading map data...' : 'Loading map...'}</div>
          {geoDataError && (
            <div className="text-xs text-red-500 mt-2 max-w-xs">{geoDataError}</div>
          )}
        </div>
      </div>
    )
  }
  
  if (!usStatesGeoJSON) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center text-red-500">
          <div className="text-sm mb-2">Failed to load map data</div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Retry
          </button>
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
        ref={(mapInstance: any) => {
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
          const radius = Math.max(4, Math.min(12, Math.sqrt(plant.totalCapacity / 100) * 2))
          
          return (
            <CircleMarker
              key={`${plant.plantName}-${index}`}
              center={[plant.latitude, plant.longitude]}
              radius={radius}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: color,
                fillOpacity: 0.8
              }}
              eventHandlers={{
                click: (e: any) => {
                  e.originalEvent.stopPropagation()
                }
              }}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-sm mb-1">{plant.plantName}</h4>
                  {plant.county && (
                    <p className="text-xs text-gray-600 mb-1">{plant.county} County</p>
                  )}
                  <div className="text-xs space-y-1">
                    <div><strong>Technology:</strong> {plant.technology}</div>
                    <div><strong>Capacity:</strong> {plant.totalCapacity.toLocaleString()} MW</div>
                    <div><strong>Generators:</strong> {plant.generatorCount}</div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
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