'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { technologyColors } from '@/lib/energy-api'

interface Generator {
  plantId: string
  plantName: string
  latitude: number
  longitude: number
  technology: string
  capacity: number
  balancingAuthority: string
  state: string
  stateName: string
  entityName: string
  generatorCount: number
}

interface EIAGeneratorsMapProps {
  region?: string
  state?: string
  technology?: string
  height?: string
}

export default function EIAGeneratorsMap({
  region = 'PJM',
  state,
  technology,
  height = '500px'
}: EIAGeneratorsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  const [generators, setGenerators] = useState<Generator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  // Fetch generators data
  useEffect(() => {
    async function fetchGenerators() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (region) params.append('region', region)
        if (state) params.append('state', state)
        if (technology) params.append('technology', technology)

        console.log('[EIA Map] Fetching generators:', { region, state, technology })

        const response = await fetch(`/api/eia/generators?${params.toString()}`)
        const data = await response.json()

        if (data.success) {
          setGenerators(data.generators)
          setStats(data.stats)
          console.log(`[EIA Map] Loaded ${data.generators.length} generators`)
        } else {
          setError(data.error || 'Failed to load generators')
        }
      } catch (err) {
        console.error('[EIA Map] Error:', err)
        setError('Failed to fetch generator data')
      } finally {
        setLoading(false)
      }
    }

    fetchGenerators()
  }, [region, state, technology])

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-78.5, 38.0], // Default to Virginia
      zoom: 6,
      projection: { name: 'mercator' } as any,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    return () => {
      markers.current.forEach(marker => marker.remove())
      markers.current = []
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Add generator markers
  useEffect(() => {
    if (!map.current || !generators || generators.length === 0) return

    function addGeneratorMarkers() {
      if (!map.current) return

      // Clear existing markers
      markers.current.forEach(marker => marker.remove())
      markers.current = []

      // Calculate bounds for auto-zoom
      const bounds = new mapboxgl.LngLatBounds()

      generators.forEach((gen: Generator) => {
        if (!gen.latitude || !gen.longitude) return

        // Get color for technology
        const color = technologyColors[gen.technology as keyof typeof technologyColors] || '#808080'

        // Calculate marker size based on capacity
        // Scale: 100 MW = 20px, 1000 MW = 40px, 10000 MW = 80px
        const baseSize = 10
        const sizeMultiplier = Math.log10(Math.max(gen.capacity, 1)) * 15
        const markerSize = Math.min(Math.max(baseSize + sizeMultiplier, 15), 80)

        // Create marker element
        const el = document.createElement('div')
        el.className = 'generator-marker'
        el.style.width = `${markerSize}px`
        el.style.height = `${markerSize}px`
        el.style.backgroundColor = color
        el.style.borderRadius = '50%'
        el.style.border = '2px solid rgba(255, 255, 255, 0.8)'
        el.style.cursor = 'pointer'
        el.style.opacity = '0.8'
        el.style.transition = 'all 0.2s'

        // Hover effects
        el.addEventListener('mouseenter', () => {
          el.style.opacity = '1'
          el.style.transform = 'scale(1.1)'
          el.style.zIndex = '1000'
        })
        el.addEventListener('mouseleave', () => {
          el.style.opacity = '0.8'
          el.style.transform = 'scale(1)'
          el.style.zIndex = 'auto'
        })

        // Create popup with generator details
        const popup = new mapboxgl.Popup({
          offset: markerSize / 2,
          closeButton: false,
          className: 'generator-popup'
        }).setHTML(`
          <div style="color: #fff; font-family: system-ui; min-width: 200px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: ${color};">
              ${gen.plantName}
            </div>
            <div style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">
              ${gen.entityName}
            </div>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 12px; margin-top: 8px;">
              <div style="color: #9ca3af;">Technology:</div>
              <div style="font-weight: 500; color: ${color};">${gen.technology}</div>

              <div style="color: #9ca3af;">Capacity:</div>
              <div style="font-weight: 600; color: #3b82f6;">${gen.capacity.toFixed(1)} MW</div>

              <div style="color: #9ca3af;">Generators:</div>
              <div>${gen.generatorCount} unit${gen.generatorCount > 1 ? 's' : ''}</div>

              <div style="color: #9ca3af;">Location:</div>
              <div>${gen.stateName}</div>

              <div style="color: #9ca3af;">Region:</div>
              <div>${gen.balancingAuthority}</div>
            </div>
          </div>
        `)

        // Create and add marker
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([gen.longitude, gen.latitude])
          .setPopup(popup)
          .addTo(map.current!)

        markers.current.push(marker)

        // Add to bounds
        bounds.extend([gen.longitude, gen.latitude])
      })

      // Fit map to show all markers
      if (!bounds.isEmpty()) {
        map.current!.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 10
        })
      }
    }

    if (map.current.loaded()) {
      addGeneratorMarkers()
    } else {
      map.current.on('load', addGeneratorMarkers)
    }
  }, [generators])

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-white text-sm">Loading generators...</div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && !loading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center rounded-lg">
          <div className="text-center p-6">
            <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
            <div className="text-gray-400 text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Stats overlay */}
      {stats && !loading && (
        <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 rounded-lg p-4 max-w-xs">
          <div className="text-white text-sm font-semibold mb-2">Region: {region}</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
            <div>
              <div className="text-gray-500">Total Plants</div>
              <div className="font-semibold">{stats.totalPlants.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Total Capacity</div>
              <div className="font-semibold text-blue-400">{(stats.totalCapacity / 1000).toFixed(1)} GW</div>
            </div>
          </div>

          {/* Technology breakdown */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-gray-500 text-xs mb-2">By Technology</div>
            {Object.entries(stats.byTechnology || {})
              .sort((a: any, b: any) => b[1].capacity - a[1].capacity)
              .slice(0, 5)
              .map(([tech, data]: [string, any]) => {
                const color = technologyColors[tech as keyof typeof technologyColors] || '#808080'
                return (
                  <div key={tech} className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-gray-300">{tech}</span>
                    </div>
                    <span className="font-semibold" style={{ color }}>
                      {(data.capacity / 1000).toFixed(1)} GW
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
