'use client'

import { useState, useRef, useEffect } from 'react'

interface Plant {
  plantName: string
  county: string | null
  technology: string
  totalCapacity: number
  latitude: number
  longitude: number
  generatorCount: number
}

interface CustomUSMapProps {
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

// US States data with SVG paths and coordinates
const usStates = {
  'Virginia': {
    path: 'M 740 300 L 780 290 L 800 300 L 810 310 L 800 320 L 780 330 L 740 320 Z',
    center: { x: 770, y: 310 },
    bounds: { minX: 740, maxX: 810, minY: 290, maxY: 330 }
  },
  'Pennsylvania': {
    path: 'M 720 250 L 780 240 L 790 250 L 785 270 L 720 280 Z',
    center: { x: 750, y: 260 },
    bounds: { minX: 720, maxX: 790, minY: 240, maxY: 280 }
  },
  'Ohio': {
    path: 'M 680 260 L 720 250 L 720 290 L 680 300 Z',
    center: { x: 700, y: 275 },
    bounds: { minX: 680, maxX: 720, minY: 250, maxY: 300 }
  },
  'Maryland': {
    path: 'M 750 300 L 790 295 L 795 305 L 785 315 L 750 310 Z',
    center: { x: 772, y: 305 },
    bounds: { minX: 750, maxX: 795, minY: 295, maxY: 315 }
  },
  'West Virginia': {
    path: 'M 700 280 L 740 275 L 745 295 L 705 300 Z',
    center: { x: 722, y: 287 },
    bounds: { minX: 700, maxX: 745, minY: 275, maxY: 300 }
  },
  'North Carolina': {
    path: 'M 720 330 L 790 320 L 810 340 L 720 350 Z',
    center: { x: 765, y: 335 },
    bounds: { minX: 720, maxX: 810, minY: 320, maxY: 350 }
  },
  'Delaware': {
    path: 'M 790 300 L 800 295 L 805 315 L 790 320 Z',
    center: { x: 797, y: 307 },
    bounds: { minX: 790, maxX: 805, minY: 295, maxY: 320 }
  },
  'New Jersey': {
    path: 'M 780 270 L 800 265 L 805 285 L 780 290 Z',
    center: { x: 792, y: 277 },
    bounds: { minX: 780, maxX: 805, minY: 265, maxY: 290 }
  },
  'Illinois': {
    path: 'M 580 280 L 620 275 L 625 315 L 580 320 Z',
    center: { x: 602, y: 297 },
    bounds: { minX: 580, maxX: 625, minY: 275, maxY: 320 }
  },
  'Indiana': {
    path: 'M 630 280 L 670 275 L 675 310 L 630 315 Z',
    center: { x: 652, y: 292 },
    bounds: { minX: 630, maxX: 675, minY: 275, maxY: 315 }
  },
  'Kentucky': {
    path: 'M 650 310 L 720 305 L 725 330 L 650 335 Z',
    center: { x: 687, y: 317 },
    bounds: { minX: 650, maxX: 725, minY: 305, maxY: 335 }
  },
  'Michigan': {
    path: 'M 620 220 L 680 215 L 685 255 L 620 260 Z',
    center: { x: 652, y: 237 },
    bounds: { minX: 620, maxX: 685, minY: 215, maxY: 260 }
  },
  'Tennessee': {
    path: 'M 630 340 L 720 335 L 725 355 L 630 360 Z',
    center: { x: 677, y: 347 },
    bounds: { minX: 630, maxX: 725, minY: 335, maxY: 360 }
  },
  'District of Columbia': {
    path: 'M 785 305 L 792 302 L 795 308 L 785 310 Z',
    center: { x: 790, y: 306 },
    bounds: { minX: 785, maxX: 795, minY: 302, maxY: 310 }
  }
}

export default function CustomUSMap({ selectedState, plants, loading, onStateSelect }: CustomUSMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [viewBox, setViewBox] = useState('0 0 1000 600')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Convert lat/lng to SVG coordinates
  const latLngToSVG = (lat: number, lng: number) => {
    const x = (lng + 130) * 6 // Rough conversion for US coordinates
    const y = (50 - lat) * 8
    return { x: x + panOffset.x, y: y + panOffset.y }
  }

  // Handle state selection and zooming
  const handleStateClick = (stateName: string) => {
    const state = usStates[stateName as keyof typeof usStates]
    if (state && onStateSelect) {
      onStateSelect(stateName)
      
      // Zoom to state
      const padding = 50
      const width = state.bounds.maxX - state.bounds.minX + padding * 2
      const height = state.bounds.maxY - state.bounds.minY + padding * 2
      const centerX = state.bounds.minX + (state.bounds.maxX - state.bounds.minX) / 2
      const centerY = state.bounds.minY + (state.bounds.maxY - state.bounds.minY) / 2
      
      setViewBox(`${centerX - width/2} ${centerY - height/2} ${width} ${height}`)
      setZoomLevel(3)
    }
  }

  // Reset to full US view
  const resetView = () => {
    setViewBox('0 0 1000 600')
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      setPanOffset(prev => ({
        x: prev.x + deltaX / zoomLevel,
        y: prev.y + deltaY / zoomLevel
      }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle zoom
  const handleZoom = (delta: number, centerX?: number, centerY?: number) => {
    const newZoom = Math.max(0.5, Math.min(10, zoomLevel + delta))
    setZoomLevel(newZoom)
    
    if (centerX !== undefined && centerY !== undefined) {
      const factor = delta > 0 ? 0.8 : 1.2
      setPanOffset(prev => ({
        x: prev.x + (centerX - 500) * (1 - factor),
        y: prev.y + (centerY - 300) * (1 - factor)
      }))
    }
  }

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden rounded-lg">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
        <div className="bg-white rounded-lg shadow-lg p-2 space-y-1">
          <button
            onClick={() => handleZoom(0.5)}
            className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-lg font-bold"
          >
            +
          </button>
          <button
            onClick={() => handleZoom(-0.5)}
            className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-lg font-bold"
          >
            −
          </button>
        </div>
        <button
          onClick={resetView}
          className="bg-white rounded-lg shadow-lg p-2 text-xs font-medium hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          <span className="text-sm text-gray-600">Loading generators...</span>
        </div>
      )}

      {/* Map Info */}
      {selectedState && plants.length > 0 && !loading && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
          <div className="text-sm font-medium text-gray-900 mb-1">
            {selectedState}
          </div>
          <div className="text-xs text-gray-600">
            {plants.length} plants • {Math.round(plants.reduce((sum, p) => sum + p.totalCapacity, 0) / 1000)} GW
          </div>
        </div>
      )}

      {/* SVG Map */}
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
          e.preventDefault()
          const rect = svgRef.current?.getBoundingClientRect()
          if (rect) {
            const centerX = e.clientX - rect.left
            const centerY = e.clientY - rect.top
            handleZoom(e.deltaY > 0 ? -0.2 : 0.2, centerX, centerY)
          }
        }}
      >
        {/* Background */}
        <rect width="1000" height="600" fill="#f1f5f9" />
        
        {/* Water bodies */}
        <circle cx="800" cy="400" r="60" fill="#bfdbfe" opacity="0.5" />
        <circle cx="200" cy="350" r="80" fill="#bfdbfe" opacity="0.5" />
        
        {/* State outlines */}
        {Object.entries(usStates).map(([stateName, stateData]) => (
          <path
            key={stateName}
            d={stateData.path}
            fill={selectedState === stateName ? '#3B82F6' : hoveredState === stateName ? '#60A5FA' : '#ffffff'}
            stroke="#374151"
            strokeWidth="1"
            className="hover:fill-blue-200 cursor-pointer transition-colors"
            onMouseEnter={() => setHoveredState(stateName)}
            onMouseLeave={() => setHoveredState(null)}
            onClick={(e) => {
              e.stopPropagation()
              handleStateClick(stateName)
            }}
          />
        ))}

        {/* State labels */}
        {Object.entries(usStates).map(([stateName, stateData]) => (
          <text
            key={`${stateName}-label`}
            x={stateData.center.x}
            y={stateData.center.y}
            textAnchor="middle"
            className="text-xs font-medium fill-gray-700 pointer-events-none"
            style={{ fontSize: Math.max(8, 12 / zoomLevel) }}
          >
            {stateName.length > 12 ? stateName.substring(0, 12) + '...' : stateName}
          </text>
        ))}

        {/* Generator markers */}
        {plants.map((plant, index) => {
          if (!plant.latitude || !plant.longitude) return null
          
          const { x, y } = latLngToSVG(plant.latitude, plant.longitude)
          const radius = Math.max(2, Math.min(15, Math.sqrt(plant.totalCapacity / 1000) * 3))
          const color = techColors[plant.technology] || techColors.Other
          
          return (
            <g key={plant.plantName}>
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill={color}
                stroke="#ffffff"
                strokeWidth="2"
                opacity="0.8"
                className="hover:opacity-100 cursor-pointer transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPlant(plant)
                }}
              />
              {/* Labels for large plants */}
              {plant.totalCapacity > 1000 && zoomLevel > 2 && (
                <text
                  x={x}
                  y={y + radius + 12}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700 pointer-events-none"
                  style={{ fontSize: Math.max(8, 10 / zoomLevel) }}
                >
                  {plant.plantName.length > 15 
                    ? plant.plantName.substring(0, 15) + '...' 
                    : plant.plantName
                  }
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Plant Info Modal */}
      {selectedPlant && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">{selectedPlant.plantName}</h3>
              <button
                onClick={() => setSelectedPlant(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {selectedPlant.county && (
              <p className="text-sm text-gray-600 mb-3">{selectedPlant.county} County</p>
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Technology:</span>
                <span 
                  className="font-medium"
                  style={{ color: techColors[selectedPlant.technology] || techColors.Other }}
                >
                  {selectedPlant.technology}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-medium">{selectedPlant.totalCapacity.toLocaleString()} MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Generators:</span>
                <span className="font-medium">{selectedPlant.generatorCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}