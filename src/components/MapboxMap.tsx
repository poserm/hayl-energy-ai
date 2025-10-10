'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface Plant {
  plant_name?: string
  technology?: string
  nameplate_capacity_mw?: string | number
  operating_year?: string
  county?: string
  plant_state?: string
  latitude?: number
  longitude?: number
  entity_name?: string
  generator_count?: number
}

interface MapboxMapProps {
  containerId: string
  plants?: Plant[]
}

// Approximate US state center coordinates
const STATE_COORDS: { [key: string]: [number, number] } = {
  'AL': [-86.9023, 32.8067], 'AK': [-152.4044, 61.3707], 'AZ': [-111.4312, 33.7298],
  'AR': [-92.3731, 34.9697], 'CA': [-119.4179, 36.1162], 'CO': [-105.3111, 39.0598],
  'CT': [-72.7554, 41.5978], 'DE': [-75.5071, 39.3185], 'FL': [-81.5158, 27.7663],
  'GA': [-83.6431, 33.0406], 'HI': [-157.4983, 21.0943], 'ID': [-114.4788, 44.2405],
  'IL': [-89.3985, 40.3495], 'IN': [-86.2816, 39.8494], 'IA': [-93.0977, 42.0115],
  'KS': [-96.7265, 38.5266], 'KY': [-84.6701, 37.6681], 'LA': [-91.9679, 31.1695],
  'ME': [-69.3819, 44.6939], 'MD': [-76.6413, 39.0639], 'MA': [-71.5301, 42.2302],
  'MI': [-84.5361, 43.3266], 'MN': [-93.9196, 45.6945], 'MS': [-89.6782, 32.7416],
  'MO': [-92.2896, 38.4561], 'MT': [-110.4544, 46.9219], 'NE': [-98.2680, 41.1254],
  'NV': [-117.0554, 38.3135], 'NH': [-71.5639, 43.4525], 'NJ': [-74.5210, 40.2989],
  'NM': [-106.2484, 34.8405], 'NY': [-74.9481, 42.1657], 'NC': [-79.8064, 35.6301],
  'ND': [-99.7840, 47.5289], 'OH': [-82.7649, 40.3888], 'OK': [-96.9289, 35.5653],
  'OR': [-122.0709, 44.5720], 'PA': [-77.1945, 40.5908], 'RI': [-71.5101, 41.6809],
  'SC': [-80.9066, 33.8569], 'SD': [-99.4388, 44.2998], 'TN': [-86.6923, 35.7478],
  'TX': [-97.5631, 31.0545], 'UT': [-111.8910, 40.1500], 'VT': [-72.7107, 44.0459],
  'VA': [-78.1690, 37.7693], 'WA': [-121.4906, 47.4009], 'WV': [-80.9545, 38.4912],
  'WI': [-89.6165, 44.2685], 'WY': [-107.3025, 42.7559], 'DC': [-77.0369, 38.9072]
}

// Technology color mapping (matching dashboard theme)
const TECH_COLORS: { [key: string]: string } = {
  'Coal': '#8B4513',
  'Natural Gas': '#4169E1',
  'Nuclear': '#FFD700',
  'Solar': '#FFA500',
  'Wind': '#00CED1',
  'Hydroelectric': '#0000FF',
  'Hydro': '#0000FF',
  'Battery Storage': '#9932CC',
  'Storage': '#9932CC',
  'Biomass': '#228B22',
  'Geothermal': '#DC143C',
  'Other': '#808080'
}

export default function MapboxMap({ containerId, plants }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (map.current) return // Initialize map only once

    // Set Mapbox access token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    if (!mapContainer.current) return

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark mode style
      center: [-98.5795, 39.8283], // Geographic center of USA
      zoom: 3.5,
      projection: { name: 'mercator' } as any,
    })

    // Add navigation controls (zoom buttons)
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    // Cleanup
    return () => {
      // Remove all markers
      markers.current.forEach(marker => marker.remove())
      markers.current = []

      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Add plant markers when plants data changes
  useEffect(() => {
    if (!map.current || !plants || plants.length === 0) return

    // Wait for map to load before adding markers
    if (!map.current.loaded()) {
      map.current.on('load', () => addPlantMarkers())
    } else {
      addPlantMarkers()
    }

    function addPlantMarkers() {
      if (!map.current || !plants) return

      // Remove existing markers
      markers.current.forEach(marker => marker.remove())
      markers.current = []

      // Add new markers for each plant
      plants.forEach(plant => {
        // Use actual coordinates if available, otherwise use state center with offset
        let lng: number, lat: number

        if (plant.latitude && plant.longitude) {
          // Use actual plant coordinates from EIA data
          lng = plant.longitude
          lat = plant.latitude
        } else if (plant.plant_state) {
          // Fall back to state center with random offset
          const stateCoords = STATE_COORDS[plant.plant_state]
          if (!stateCoords) return

          const randomOffset = () => (Math.random() - 0.5) * 1.5
          lng = stateCoords[0] + randomOffset()
          lat = stateCoords[1] + randomOffset()
        } else {
          return // Skip if no location data available
        }

        // Calculate circle size based on capacity (min 8px, max 40px)
        const capacity = typeof plant.nameplate_capacity_mw === 'string'
          ? parseFloat(plant.nameplate_capacity_mw)
          : (plant.nameplate_capacity_mw || 0)
        const size = Math.min(Math.max(8, Math.sqrt(capacity) * 2), 40)

        // Get color based on technology
        const color = TECH_COLORS[plant.technology || ''] || '#6b7280'

        // Create custom marker element
        const el = document.createElement('div')
        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.backgroundColor = color
        el.style.borderRadius = '50%'
        el.style.border = '2px solid rgba(255, 255, 255, 0.5)'
        el.style.cursor = 'pointer'
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)'
        el.style.transition = 'transform 0.2s'

        // Hover effects
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)'
          el.style.zIndex = '1000'
        })
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)'
          el.style.zIndex = '1'
        })

        // Create popup with plant info
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="color: #1f2937; padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${plant.plant_name || 'Unknown Plant'}</h3>
            ${plant.entity_name ? `<p style="margin: 2px 0; font-size: 12px; color: #6b7280;">${plant.entity_name}</p>` : ''}
            <p style="margin: 2px 0;"><strong>Technology:</strong> ${plant.technology || 'Unknown'}</p>
            <p style="margin: 2px 0;"><strong>Capacity:</strong> ${capacity.toLocaleString()} MW</p>
            ${plant.generator_count ? `<p style="margin: 2px 0;"><strong>Generators:</strong> ${plant.generator_count} units</p>` : ''}
            <p style="margin: 2px 0;"><strong>Location:</strong> ${plant.county ? `${plant.county}, ` : ''}${plant.plant_state}</p>
            ${plant.operating_year ? `<p style="margin: 2px 0;"><strong>Operating Since:</strong> ${plant.operating_year}</p>` : ''}
          </div>
        `)

        // Create and add marker (with draggable: false to prevent movement)
        const marker = new mapboxgl.Marker({ element: el, draggable: false })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!)

        markers.current.push(marker)
      })

      // Fit map to show all markers if there are plants
      if (plants.length > 0 && markers.current.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        markers.current.forEach(marker => {
          const lngLat = marker.getLngLat()
          bounds.extend(lngLat)
        })
        map.current?.fitBounds(bounds, { padding: 50, maxZoom: 7 })
      }
    }
  }, [plants])

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainer}
        id={containerId}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />

      {/* Legend - only show if plants data is provided */}
      {plants && plants.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 border border-gray-600 z-[1000] shadow-lg">
          <h4 className="text-sm font-semibold text-white mb-3">Technology Types</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3b82f6', border: '2px solid rgba(255, 255, 255, 0.5)' }}></div>
              <span className="text-xs text-gray-300">Natural Gas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#6b7280', border: '2px solid rgba(255, 255, 255, 0.5)' }}></div>
              <span className="text-xs text-gray-300">Coal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#a855f7', border: '2px solid rgba(255, 255, 255, 0.5)' }}></div>
              <span className="text-xs text-gray-300">Nuclear</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#eab308', border: '2px solid rgba(255, 255, 255, 0.5)' }}></div>
              <span className="text-xs text-gray-300">Solar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#22c55e', border: '2px solid rgba(255, 255, 255, 0.5)' }}></div>
              <span className="text-xs text-gray-300">Wind</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#06b6d4', border: '2px solid rgba(255, 255, 255, 0.5)' }}></div>
              <span className="text-xs text-gray-300">Hydro</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-600">
            <p className="text-xs text-gray-400 italic">Circle size = Capacity</p>
          </div>
        </div>
      )}
    </div>
  )
}
