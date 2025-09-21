'use client'

import { useEffect, useState } from 'react'
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
        
        // Use official US Census Bureau data for accurate state boundaries
        try {
          console.log('Loading US Census Bureau state boundaries...')
          const response = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
          if (!response.ok) throw new Error('Failed to fetch US Census data')
          geoData = await response.json()
          console.log('Successfully loaded US Census state boundaries:', geoData)
        } catch (error) {
          console.warn('US Census source failed, trying alternative reliable source...', error)
          
          // Fallback to another reliable source with proper state geometries
          try {
            const response = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json')
            if (!response.ok) throw new Error('Failed to fetch from TopoJSON source')
            const topoData = await response.json()
            // Convert TopoJSON to GeoJSON if needed
            if (topoData.objects && topoData.objects.states) {
              // This would need topojson library, so try another source
              throw new Error('TopoJSON conversion needed')
            }
            geoData = topoData
            console.log('Successfully loaded US states from TopoJSON source:', geoData)
          } catch (error2) {
            console.warn('All external sources failed, using simplified fallback...')
            // Use a comprehensive fallback with proper US state boundaries
            geoData = createFallbackGeoJSON()
          }
        }
        
        if (geoData && geoData.features) {
          // Clean and deduplicate state features
          const uniqueStates = new Map()
          const cleanedFeatures: GeoJSONFeature[] = []
          
          geoData.features.forEach((feature: any) => {
            const stateName = feature.properties.NAME || feature.properties.name || feature.properties.NAME_1
            
            // Skip invalid features
            if (!stateName || !feature.geometry) {
              console.warn('Skipping invalid feature:', feature)
              return
            }
            
            // Only keep one feature per state (prevents duplicates)
            if (!uniqueStates.has(stateName)) {
              const cleanedFeature = {
                ...feature,
                properties: {
                  ...feature.properties,
                  name: stateName,
                  NAME: stateName
                }
              }
              
              uniqueStates.set(stateName, cleanedFeature)
              cleanedFeatures.push(cleanedFeature)
            } else {
              console.warn('Duplicate state found, skipping:', stateName)
            }
          })
          
          const cleanedGeoData = {
            ...geoData,
            features: cleanedFeatures
          }
          
          setUsStatesGeoJSON(cleanedGeoData)
          console.log('GeoJSON data cleaned and ready:', cleanedFeatures.length, 'unique states loaded')
          console.log('State names:', cleanedFeatures.map(f => f.properties.name).sort())
        } else {
          throw new Error('Invalid GeoJSON data structure')
        }
        
      } catch (error) {
        console.error('Failed to load GeoJSON data:', error)
        setGeoDataError('Failed to load map data. Using fallback data.')
        
        // Use fallback GeoJSON data
        const fallbackData = createFallbackGeoJSON()
        setUsStatesGeoJSON(fallbackData)
      } finally {
        setGeoDataLoading(false)
      }
    }
    
    loadGeoJSONData()
  }, [])
  
  // Create comprehensive fallback GeoJSON data with proper US state boundaries
  const createFallbackGeoJSON = () => {
    return {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": { "name": "Virginia", "NAME": "Virginia", "STATE_CODE": "VA" },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[-83.675, 36.540], [-75.242, 36.540], [-75.242, 38.029], [-77.040, 38.804], [-78.349, 39.464], [-80.934, 39.200], [-83.001, 38.783], [-83.675, 36.540]]]
          }
        },
        {
          "type": "Feature",
          "properties": { "name": "Pennsylvania", "NAME": "Pennsylvania", "STATE_CODE": "PA" },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[-80.934, 39.200], [-75.350, 39.881], [-74.705, 40.635], [-75.527, 41.203], [-79.762, 42.269], [-80.600, 42.000], [-80.934, 39.200]]]
          }
        },
        {
          "type": "Feature",
          "properties": { "name": "Ohio", "NAME": "Ohio", "STATE_CODE": "OH" },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[-84.820, 38.404], [-80.934, 39.200], [-80.934, 41.977], [-84.801, 41.694], [-84.807, 39.103], [-84.820, 38.404]]]
          }
        },
        {
          "type": "Feature",
          "properties": { "name": "Maryland", "NAME": "Maryland", "STATE_CODE": "MD" },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[-79.487, 39.200], [-75.048, 38.451], [-75.994, 38.228], [-79.487, 39.200]]]
          }
        },
        {
          "type": "Feature",
          "properties": { "name": "North Carolina", "NAME": "North Carolina", "STATE_CODE": "NC" },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[-84.321, 34.988], [-75.460, 34.729], [-76.910, 36.550], [-83.109, 36.497], [-84.321, 34.988]]]
          }
        },
        {
          "type": "Feature",
          "properties": { "name": "West Virginia", "NAME": "West Virginia", "STATE_CODE": "WV" },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[-82.644, 38.161], [-78.349, 39.464], [-77.040, 38.804], [-81.106, 37.208], [-82.644, 38.161]]]
          }
        },
        {
          "type": "Feature",
          "properties": { "name": "Delaware", "NAME": "Delaware", "STATE_CODE": "DE" },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[-75.770, 38.451], [-75.047, 38.451], [-75.047, 39.881], [-75.350, 39.881], [-75.770, 38.451]]]
          }
        },
        {
          "type": "Feature",
          "properties": { "name": "New Jersey", "NAME": "New Jersey", "STATE_CODE": "NJ" },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[-75.350, 39.881], [-74.027, 40.008], [-74.705, 40.635], [-75.350, 39.881]]]
          }
        }
      ]
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

  // Style function for clean state boundaries - NO FILLS, ONLY LINES
  const getStateStyle = (feature: GeoJSONFeature) => {
    const stateName = feature.properties.name || feature.properties.NAME || ''
    const isSelected = stateName === selectedState
    
    // PJM states get different styling
    const pjmStates = ['Virginia', 'Pennsylvania', 'Ohio', 'Maryland', 'West Virginia', 
                       'North Carolina', 'Delaware', 'New Jersey', 'Illinois', 'Indiana', 
                       'Kentucky', 'Michigan', 'Tennessee', 'District of Columbia']
    const isPJMState = pjmStates.includes(stateName)
    
    return {
      // ONLY boundary lines - absolutely no fills to avoid boxes
      fillColor: 'transparent',
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#1e40af' : (isPJMState ? '#475569' : '#94a3b8'),
      dashArray: isSelected ? '' : '3,3', // Subtle dashes for non-selected states
      fillOpacity: 0, // Never fill anything to avoid boxes
      fill: false // Explicitly disable fill
    }
  }

  // Handle census bureau state boundary interactions
  const onEachFeature = (feature: GeoJSONFeature, layer: any) => {
    const stateName = feature.properties.name || feature.properties.NAME || ''
    
    // Ensure this is a valid state feature
    if (!stateName) {
      console.warn('Invalid state feature - no name:', feature)
      return
    }
    
    console.log('Setting up census boundary events for state:', stateName)
    
    // Make the actual state boundary interactive
    layer.on({
      mouseover: (e: any) => {
        console.log('Hovering over state boundary:', stateName)
        const target = e.target
        target.setStyle({
          weight: 4,
          color: '#1e40af',
          dashArray: '',
          fillOpacity: 0, // No fill on hover to avoid boxes
          fillColor: 'transparent'
        })
        // Bring to front to ensure it's on top
        if (target.bringToFront) target.bringToFront()
      },
      mouseout: (e: any) => {
        console.log('Mouse left state boundary:', stateName)
        const target = e.target
        // Reset to original styling
        target.setStyle(getStateStyle(feature))
      },
      click: (e: any) => {
        console.log('Census state boundary clicked:', stateName)
        
        // Prevent map click events from interfering
        e.originalEvent.stopPropagation()
        
        // Update selected state via dashboard callback
        if (stateName && onStateSelect) {
          onStateSelect(stateName)
          console.log('State selection updated:', stateName)
        }
        
        // Zoom to the clicked state's bounds
        if (stateName && map) {
          try {
            const bounds = getBoundsFromGeometry(feature.geometry)
            console.log('Fitting map to state bounds:', stateName, bounds)
            map.fitBounds(bounds, { 
              padding: [30, 30],
              maxZoom: 8 // Prevent zooming too close
            })
          } catch (error) {
            console.error('Failed to zoom to state:', stateName, error)
          }
        }
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
        whenCreated={(mapInstance: any) => {
          console.log('Map instance created:', mapInstance)
          setMap(mapInstance)
        }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* US State Boundaries - ONLY LINES, NO BOXES */}
        {usStatesGeoJSON && (
          <GeoJSON
            data={usStatesGeoJSON}
            style={getStateStyle}
            onEachFeature={onEachFeature}
            key={`census-boundaries-${selectedState || 'none'}`}
            // Ensure this is the only interactive layer - NO FILLS
            interactive={true}
            bubblingMouseEvents={false}
            // Force line-only rendering
            pathOptions={{
              fill: false,
              fillOpacity: 0,
              fillColor: 'transparent'
            }}
          />
        )}

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