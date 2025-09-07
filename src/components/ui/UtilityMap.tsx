'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { calculateMapBounds, getUtilityCoordinates } from '@/lib/map-utils'

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface UtilityData {
  id: string
  utilityName: string
  state: string
  ownershipType: string
  nameplateCapacityMw: number
  logoScale: number
  sizeCategory: string
  serviceTerritory: string[]
  customersCount: number
  generatorCount?: number
  nercRegion?: string
}

interface UtilityMapProps {
  utilities: UtilityData[]
  selectedUtility?: UtilityData
  onUtilitySelect?: (utility: UtilityData) => void
  selectedStates?: string[]
}

// Utility coordinates are now imported from map-utils

const UtilityMap = ({ utilities, selectedUtility, onUtilitySelect, selectedStates = [] }: UtilityMapProps) => {
  const [isClient, setIsClient] = useState(false)
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    // Import Leaflet for creating custom icons
    import('leaflet').then((leaflet) => {
      setL(leaflet.default)
      
      // Fix for default markers in Next.js
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      })
    })
  }, [])

  const createCustomIcon = (utility: UtilityData) => {
    if (!L) return undefined
    
    const size = utility.nameplateCapacityMw > 10000 ? 35 : 
                utility.nameplateCapacityMw > 1000 ? 25 : 18
    
    const color = utility.sizeCategory.toLowerCase() === 'major' ? '#059669' : 
                 utility.sizeCategory.toLowerCase() === 'regional' ? '#2563eb' : '#4f46e5'
    
    return L.divIcon({
      html: `
        <div style="
          width: ${size}px; 
          height: ${size}px; 
          background: ${color}; 
          border: 3px solid white; 
          border-radius: 50%; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${size > 25 ? '12px' : '10px'};
        ">
          ${utility.utilityName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      `,
      className: 'custom-utility-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    })
  }

  const formatCapacity = (mw: number) => {
    if (mw >= 1000) {
      return `${(mw / 1000).toFixed(1)} GW`
    }
    return `${Math.round(mw)} MW`
  }

  const formatCustomers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`
    }
    return count.toString()
  }

  // Don't render on server side
  if (!isClient) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  // Calculate dynamic bounds based on selected states
  const mapBounds = calculateMapBounds(selectedStates.length > 0 ? selectedStates : ['Virginia'])

  return (
    <div className="h-96 rounded-lg overflow-hidden border border-gray-200 relative">
      <MapContainer
        key={selectedStates.join(',')}
        bounds={mapBounds}
        scrollWheelZoom={true}
        className="h-full w-full"
        boundsOptions={{ padding: [20, 20] }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {utilities.map((utility) => {
          const coordinates = getUtilityCoordinates(utility.utilityName, utility.state)
          const icon = createCustomIcon(utility)
          
          return (
            <Marker
              key={utility.id}
              position={coordinates}
              icon={icon}
              eventHandlers={{
                click: () => onUtilitySelect?.(utility)
              }}
            >
              <Popup className="utility-popup">
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg mb-2 text-gray-900">
                    {utility.utilityName}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{utility.ownershipType}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-bold text-blue-600">
                        {formatCapacity(utility.nameplateCapacityMw)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customers:</span>
                      <span className="font-bold text-green-600">
                        {formatCustomers(utility.customersCount)}
                      </span>
                    </div>
                    
                    {utility.generatorCount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Generators:</span>
                        <span className="font-medium">{utility.generatorCount}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Territory:</span>
                      <span className="font-medium text-right">
                        {utility.serviceTerritory[0] || 'Statewide'}
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${utility.sizeCategory.toLowerCase() === 'major' ? 'bg-green-100 text-green-800' : 
                          utility.sizeCategory.toLowerCase() === 'regional' ? 'bg-blue-100 text-blue-800' : 
                          'bg-indigo-100 text-indigo-800'}
                      `}>
                        {utility.sizeCategory}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border z-[1000]">
        <h4 className="font-semibold text-sm mb-2">Utility Size</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            <span>Major (&gt;10GW)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>Regional (1-10GW)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
            <span>Local (&lt;1GW)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UtilityMap