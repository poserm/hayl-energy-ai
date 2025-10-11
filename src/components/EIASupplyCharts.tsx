'use client'

import { useEffect, useState } from 'react'
import { technologyColors } from '@/lib/energy-api'

interface TechnologyData {
  technology: string
  capacity: number
  count: number
  color: string
}

interface EIASupplyChartsProps {
  region?: string
  state?: string
  selectedTechnology?: string
  supplyView?: 'current' | 'pipeline' | 'retirements'
}

export default function EIASupplyCharts({
  region = 'PJM',
  state,
  selectedTechnology = 'All Technologies',
  supplyView = 'current'
}: EIASupplyChartsProps) {
  const [technologies, setTechnologies] = useState<TechnologyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCapacity, setTotalCapacity] = useState(0)

  // Fetch data from EIA
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (region) params.append('region', region)
        if (state) params.append('state', state)
        if (selectedTechnology !== 'All Technologies') {
          params.append('technology', selectedTechnology)
        }

        const response = await fetch(`/api/eia/generators?${params.toString()}`)
        const data = await response.json()

        if (data.success && data.stats) {
          // Convert stats to technology array
          const techArray: TechnologyData[] = Object.entries(data.stats.byTechnology || {})
            .map(([tech, stats]: [string, any]) => ({
              technology: tech,
              capacity: stats.capacity,
              count: stats.count,
              color: technologyColors[tech as keyof typeof technologyColors] || '#808080'
            }))
            .sort((a, b) => b.capacity - a.capacity)

          setTechnologies(techArray)
          setTotalCapacity(data.stats.totalCapacity || 0)
        } else {
          setError(data.error || 'Failed to load data')
        }
      } catch (err) {
        console.error('[EIA Supply Charts] Error:', err)
        setError('Failed to fetch supply data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [region, state, selectedTechnology])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">Loading supply data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
        <p className="text-gray-500 text-sm mt-2">Using EIA API data</p>
      </div>
    )
  }

  if (technologies.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-400">No generators found for {region}</p>
      </div>
    )
  }

  // Render All Technologies view
  if (selectedTechnology === 'All Technologies') {
    return (
      <div className="space-y-6">
        {/* Stacked Bar Chart - Larger */}
        <div className="flex h-16 rounded-lg overflow-hidden shadow-lg">
          {technologies.map((tech, index) => {
            const percentage = (tech.capacity / totalCapacity) * 100
            return (
              <div
                key={tech.technology}
                className="flex items-center justify-center text-white text-sm font-bold transition-all hover:opacity-90 cursor-pointer group relative"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: tech.color
                }}
                title={`${tech.technology}: ${(tech.capacity / 1000).toFixed(1)} GW (${percentage.toFixed(1)}%)`}
              >
                {percentage > 5 && (
                  <span className="text-shadow drop-shadow-lg">
                    {tech.technology.split(' ')[0]}
                  </span>
                )}

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl border border-gray-700">
                  <div className="font-semibold">{tech.technology}</div>
                  <div className="text-gray-300">{(tech.capacity / 1000).toFixed(2)} GW ({percentage.toFixed(1)}%)</div>
                  <div className="text-gray-400">{tech.count} plants</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Inline Legend - Compact */}
        <div className="flex flex-wrap gap-4 justify-center">
          {technologies.map((tech) => (
            <div key={tech.technology} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: tech.color }}
              />
              <span className="text-xs text-gray-300">
                {tech.technology}: <span className="font-semibold text-white">{(tech.capacity / 1000).toFixed(1)} GW</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render Single Technology view
  const selectedTech = technologies.find(t => t.technology === selectedTechnology)
  if (!selectedTech) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-400">No {selectedTechnology} generators found in {region}</p>
      </div>
    )
  }

  const percentage = (selectedTech.capacity / totalCapacity) * 100

  return (
    <div className="space-y-4">
      {/* Single Technology Bar */}
      <div>
        <div className="flex h-12 rounded-lg overflow-hidden mb-4 border-2" style={{ borderColor: selectedTech.color }}>
          <div
            className="flex items-center justify-center text-white text-sm font-semibold w-full"
            style={{ backgroundColor: selectedTech.color }}
          >
            {selectedTech.technology}: {(selectedTech.capacity / 1000).toFixed(1)} GW
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400">
            {percentage.toFixed(1)}% of total regional capacity • {selectedTech.count} facilities
          </p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-500 mb-1">Capacity</p>
          <p className="text-xl font-bold text-white">{(selectedTech.capacity / 1000).toFixed(2)} GW</p>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-500 mb-1">Facilities</p>
          <p className="text-xl font-bold text-white">{selectedTech.count}</p>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-500 mb-1">Avg Size</p>
          <p className="text-xl font-bold text-white">
            {(selectedTech.capacity / selectedTech.count).toFixed(0)} MW
          </p>
        </div>
      </div>

      {/* Data Source Note */}
      <p className="text-xs text-gray-500 text-center mt-4">
        ℹ️ Real-time data from EIA Form 860 • {supplyView.charAt(0).toUpperCase() + supplyView.slice(1)} operating capacity
      </p>
    </div>
  )
}
