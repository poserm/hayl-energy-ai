'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { calculateMapBounds, getGeneratorCoordinates } from '@/lib/map-utils'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface GeneratorData {
  id: string
  entityName: string
  plantName: string
  state: string
  technology: string
  capacity: {
    nameplate: number
  }
  nameplate_capacity_mw?: number
  sourceSheet?: string
}

interface GeneratorMapProps {
  generators: GeneratorData[]
  selectedGenerator?: GeneratorData
  onGeneratorSelect?: (generator: GeneratorData) => void
  selectedStates?: string[]
}

const GeneratorMap = ({ generators, selectedGenerator, onGeneratorSelect, selectedStates = [] }: GeneratorMapProps) => {
  const [isClient, setIsClient] = useState(false)
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    import('leaflet').then((leaflet) => {
      setL(leaflet.default)
      
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      })
    })
  }, [])

  // Generator coordinates are now imported from map-utils

  const createGeneratorIcon = (generator: GeneratorData) => {
    if (!L) return undefined
    
    const capacity = generator.capacity?.nameplate || generator.nameplate_capacity_mw || 0
    const size = capacity >= 1000 ? 30 : capacity >= 100 ? 20 : 15
    
    const getTechnologyColor = (tech: string) => {
      const techLower = tech.toLowerCase()
      if (techLower.includes('solar')) return '#f59e0b' // yellow-500
      if (techLower.includes('wind')) return '#3b82f6' // blue-500
      if (techLower.includes('nuclear')) return '#8b5cf6' // violet-500
      if (techLower.includes('natural gas') || techLower.includes('gas')) return '#f97316' // orange-500
      if (techLower.includes('coal')) return '#374151' // gray-700
      if (techLower.includes('hydro')) return '#06b6d4' // cyan-500
      if (techLower.includes('battery') || techLower.includes('storage')) return '#10b981' // emerald-500
      return '#6366f1' // indigo-500
    }
    
    const color = getTechnologyColor(generator.technology)
    
    return L.divIcon({
      html: `
        <div style="
          width: ${size}px; 
          height: ${size}px; 
          background: ${color}; 
          border: 2px solid white; 
          border-radius: 4px; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${size > 20 ? '10px' : '8px'};
        ">
          ⚡
        </div>
      `,
      className: 'custom-generator-marker',
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
        
        {generators.map((generator) => {
          const coordinates = getGeneratorCoordinates(generator.plantName, generator.state, generator.entityName)
          const icon = createGeneratorIcon(generator)
          const capacity = generator.capacity?.nameplate || generator.nameplate_capacity_mw || 0
          
          return (
            <Marker
              key={generator.id}
              position={coordinates}
              icon={icon}
              eventHandlers={{
                click: () => onGeneratorSelect?.(generator)
              }}
            >
              <Popup className="generator-popup">
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg mb-2 text-gray-900">
                    {generator.plantName}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Owner:</span>
                      <span className="font-medium">{generator.entityName}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Technology:</span>
                      <span className="font-medium text-green-600">{generator.technology}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-bold text-blue-600">
                        {formatCapacity(capacity)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">State:</span>
                      <span className="font-medium">{generator.state}</span>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${capacity >= 1000 ? 'bg-red-100 text-red-800' : 
                          capacity >= 100 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'}
                      `}>
                        {capacity >= 1000 ? 'Large Scale' : capacity >= 100 ? 'Medium Scale' : 'Small Scale'}
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
        <h4 className="font-semibold text-sm mb-2">Technology</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Solar</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Wind</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span>Nuclear</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>Natural Gas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-700 rounded"></div>
            <span>Coal</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeneratorMap