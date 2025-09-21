'use client'

import { useEffect, useRef, useState } from 'react'

interface Plant {
  plantName: string
  county: string | null
  technology: string
  totalCapacity: number
  latitude: number
  longitude: number
  generatorCount: number
}

interface InteractiveUSMapProps {
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

// Simplified US state paths and centers
const usStates = {
  'Virginia': {
    path: 'M 600 340 L 720 330 L 740 350 L 720 380 L 620 390 L 600 340 Z',
    center: { x: 670, y: 360 },
    bounds: { minX: 600, maxX: 740, minY: 330, maxY: 390 }
  },
  'Pennsylvania': {
    path: 'M 580 280 L 720 270 L 730 300 L 720 320 L 580 330 Z',
    center: { x: 650, y: 300 },
    bounds: { minX: 580, maxX: 730, minY: 270, maxY: 330 }
  },
  'Ohio': {
    path: 'M 520 300 L 580 290 L 590 350 L 520 360 Z',
    center: { x: 555, y: 325 },
    bounds: { minX: 520, maxX: 590, minY: 290, maxY: 360 }
  },
  'Maryland': {
    path: 'M 650 350 L 720 345 L 725 365 L 650 370 Z',
    center: { x: 687, y: 357 },
    bounds: { minX: 650, maxX: 725, minY: 345, maxY: 370 }
  },
  'West Virginia': {
    path: 'M 580 330 L 620 325 L 630 360 L 580 365 Z',
    center: { x: 605, y: 345 },
    bounds: { minX: 580, maxX: 630, minY: 325, maxY: 365 }
  },
  'North Carolina': {
    path: 'M 600 390 L 720 380 L 740 420 L 600 430 Z',
    center: { x: 670, y: 405 },
    bounds: { minX: 600, maxX: 740, minY: 380, maxY: 430 }
  },
  'Delaware': {
    path: 'M 720 350 L 740 345 L 745 375 L 720 380 Z',
    center: { x: 732, y: 362 },
    bounds: { minX: 720, maxX: 745, minY: 345, maxY: 380 }
  },
  'New Jersey': {
    path: 'M 720 320 L 750 315 L 755 345 L 720 350 Z',
    center: { x: 737, y: 332 },
    bounds: { minX: 720, maxX: 755, minY: 315, maxY: 350 }
  },
  'Illinois': {
    path: 'M 420 320 L 480 315 L 485 380 L 420 385 Z',
    center: { x: 452, y: 350 },
    bounds: { minX: 420, maxX: 485, minY: 315, maxY: 385 }
  },
  'Indiana': {
    path: 'M 480 320 L 520 315 L 525 370 L 480 375 Z',
    center: { x: 502, y: 345 },
    bounds: { minX: 480, maxX: 525, minY: 315, maxY: 375 }
  },
  'Kentucky': {
    path: 'M 480 370 L 580 365 L 585 395 L 480 400 Z',
    center: { x: 532, y: 382 },
    bounds: { minX: 480, maxX: 585, minY: 365, maxY: 400 }
  },
  'Michigan': {
    path: 'M 480 240 L 560 235 L 565 290 L 480 295 Z',
    center: { x: 522, y: 265 },
    bounds: { minX: 480, maxX: 565, minY: 235, maxY: 295 }
  },
  'Tennessee': {
    path: 'M 480 400 L 600 395 L 605 425 L 480 430 Z',
    center: { x: 542, y: 412 },
    bounds: { minX: 480, maxX: 605, minY: 395, maxY: 430 }
  },
  'District of Columbia': {
    path: 'M 715 355 L 725 352 L 728 362 L 715 365 Z',
    center: { x: 721, y: 358 },
    bounds: { minX: 715, maxX: 728, minY: 352, maxY: 365 }
  }
}

export default function InteractiveUSMap({ selectedState, plants, loading, onStateSelect }: InteractiveUSMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewBox, setViewBox] = useState('0 0 1000 600')
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)

  // Convert lat/lng to SVG coordinates (approximate for US)
  const latLngToSVG = (lat: number, lng: number) => {
    const x = (lng + 130) * 6.5 // Adjust scaling for better positioning
    const y = (50 - lat) * 9
    return { x, y }
  }

  // Handle state selection and zooming
  const handleStateClick = (stateName: string) => {
    if (onStateSelect) {
      onStateSelect(stateName)
    }
    
    const state = usStates[stateName as keyof typeof usStates]
    if (state) {
      // Zoom to state
      const padding = 50
      const width = state.bounds.maxX - state.bounds.minX + padding * 2
      const height = state.bounds.maxY - state.bounds.minY + padding * 2
      const centerX = state.bounds.minX + (state.bounds.maxX - state.bounds.minX) / 2
      const centerY = state.bounds.minY + (state.bounds.maxY - state.bounds.minY) / 2
      
      setViewBox(`${centerX - width/2} ${centerY - height/2} ${width} ${height}`)
    }
  }

  // Reset to full US view
  const resetView = () => {
    setViewBox('0 0 1000 600')
  }

  // Zoom to selected state when prop changes
  useEffect(() => {
    if (selectedState && usStates[selectedState as keyof typeof usStates]) {
      handleStateClick(selectedState)
    }
  }, [selectedState])

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden rounded-lg">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={resetView}
          className="bg-white rounded-lg shadow-lg p-2 text-xs font-medium hover:bg-gray-50"
        >
          Reset View
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

      {/* Instructions */}
      {!selectedState && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center text-gray-500">
          <div className="text-lg mb-2">🗺️</div>
          <div className="text-sm">Click any state to explore generators</div>
        </div>
      )}

      {/* SVG Map */}
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="w-full h-full transition-all duration-500 ease-in-out"
        style={{ backgroundColor: '#f1f5f9' }}
      >
        {/* Background */}
        <rect width="1000" height="600" fill="#f1f5f9" />
        
        {/* Water bodies for context */}
        <circle cx="200" cy="350" r="80" fill="#bfdbfe" opacity="0.3" />
        <circle cx="800" cy="450" r="60" fill="#bfdbfe" opacity="0.3" />
        
        {/* State outlines */}
        {Object.entries(usStates).map(([stateName, stateData]) => {
          const isSelected = selectedState === stateName
          const isHovered = hoveredState === stateName
          
          return (
            <g key={stateName}>
              <path
                d={stateData.path}
                fill={isSelected ? '#3B82F6' : isHovered ? '#60A5FA' : '#ffffff'}
                stroke={isSelected ? '#1e40af' : '#374151'}
                strokeWidth={isSelected ? '3' : '1.5'}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredState(stateName)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => handleStateClick(stateName)}
              />
              
              {/* State labels */}
              <text
                x={stateData.center.x}
                y={stateData.center.y}
                textAnchor="middle"
                className="text-xs font-medium fill-gray-700 pointer-events-none"
                style={{ fontSize: Math.max(8, 12) }}
              >
                {stateName.length > 12 ? stateName.substring(0, 12) + '...' : stateName}
              </text>
            </g>
          )
        })}

        {/* Generator markers */}
        {plants.map((plant, index) => {
          if (!plant.latitude || !plant.longitude) return null
          
          const { x, y } = latLngToSVG(plant.latitude, plant.longitude)
          const radius = Math.max(3, Math.min(15, Math.sqrt(plant.totalCapacity / 1000) * 3))
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
              {plant.totalCapacity > 1000 && (
                <text
                  x={x}
                  y={y + radius + 12}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700 pointer-events-none"
                  style={{ fontSize: Math.max(8, 10) }}
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

        {/* Hover tooltip */}
        {hoveredState && !selectedState && (
          <g>
            <rect x="10" y="10" width="200" height="60" fill="white" stroke="#ccc" rx="5" opacity="0.9" />
            <text x="20" y="30" className="text-sm font-medium fill-gray-900">{hoveredState}</text>
            <text x="20" y="50" className="text-xs fill-gray-600">Click to select this state</text>
          </g>
        )}
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