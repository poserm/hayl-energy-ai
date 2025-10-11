'use client'

import { useEffect, useState } from 'react'
import { technologyColors } from '@/lib/energy-api'

interface TechnologyData {
  technology: string
  capacity: number
  generation?: number
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
  const [totalGeneration, setTotalGeneration] = useState(0)

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

        // Fetch both capacity and generation data in parallel
        const [capacityResponse, generationResponse] = await Promise.all([
          fetch(`/api/eia/generators?${params.toString()}`),
          fetch(`/api/eia/generation?${params.toString()}`)
        ])

        const [capacityData, generationData] = await Promise.all([
          capacityResponse.json(),
          generationResponse.json()
        ])

        if (capacityData.success && capacityData.stats) {
          // Build a map of generation by technology
          const generationByTech: { [key: string]: number } = {}
          if (generationData.success && generationData.stats?.byTechnology) {
            Object.entries(generationData.stats.byTechnology).forEach(([tech, stats]: [string, any]) => {
              generationByTech[tech] = stats.generation || 0
            })
          }

          // Convert stats to technology array with both capacity and generation
          const techArray: TechnologyData[] = Object.entries(capacityData.stats.byTechnology || {})
            .map(([tech, stats]: [string, any]) => ({
              technology: tech,
              capacity: stats.capacity,
              generation: generationByTech[tech] || 0,
              count: stats.count,
              color: technologyColors[tech as keyof typeof technologyColors] || '#808080'
            }))
            .sort((a, b) => b.capacity - a.capacity)

          setTechnologies(techArray)
          setTotalCapacity(capacityData.stats.totalCapacity || 0)
          setTotalGeneration(generationData.stats?.totalGeneration || 0)
        } else {
          setError(capacityData.error || 'Failed to load capacity data')
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
        {/* Dual Bar Charts - Capacity and Generation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Installed Capacity Chart */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 text-center">Installed Capacity (MW)</h4>
            <div className="flex h-12 rounded-lg overflow-hidden shadow-lg">
              {technologies.map((tech) => {
                const percentage = (tech.capacity / totalCapacity) * 100
                return (
                  <div
                    key={tech.technology}
                    className="flex items-center justify-center text-white text-xs font-bold transition-all hover:opacity-90 cursor-pointer group relative"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: tech.color
                    }}
                    title={`${tech.technology}: ${(tech.capacity / 1000).toFixed(1)} GW (${percentage.toFixed(1)}%)`}
                  >
                    {percentage > 8 && (
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
            <p className="text-xs text-gray-400 text-center">
              Total: {(totalCapacity / 1000).toFixed(1)} GW
            </p>
          </div>

          {/* Generation Chart */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 text-center">Generation (MWh)</h4>
            <div className="flex h-12 rounded-lg overflow-hidden shadow-lg">
              {technologies.map((tech) => {
                const percentage = totalGeneration > 0 ? ((tech.generation || 0) / totalGeneration) * 100 : 0
                return (
                  <div
                    key={tech.technology}
                    className="flex items-center justify-center text-white text-xs font-bold transition-all hover:opacity-90 cursor-pointer group relative"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: tech.color,
                      display: percentage === 0 ? 'none' : 'flex'
                    }}
                    title={`${tech.technology}: ${((tech.generation || 0) / 1000).toFixed(1)} GWh (${percentage.toFixed(1)}%)`}
                  >
                    {percentage > 8 && (
                      <span className="text-shadow drop-shadow-lg">
                        {tech.technology.split(' ')[0]}
                      </span>
                    )}

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl border border-gray-700">
                      <div className="font-semibold">{tech.technology}</div>
                      <div className="text-gray-300">{((tech.generation || 0) / 1000).toFixed(2)} GWh ({percentage.toFixed(1)}%)</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 text-center">
              {totalGeneration > 0 ? `Total: ${(totalGeneration / 1000).toFixed(1)} GWh` : 'Data not available'}
            </p>
          </div>
        </div>

        {/* Inline Legend - Compact */}
        <div className="flex flex-wrap gap-4 justify-center pt-2 border-t border-gray-700">
          {technologies.map((tech) => (
            <div key={tech.technology} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: tech.color }}
              />
              <span className="text-xs text-gray-300">
                {tech.technology}
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
  const generationPercentage = totalGeneration > 0 ? ((selectedTech.generation || 0) / totalGeneration) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Detailed Stats - Now includes generation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-500 mb-1">Capacity</p>
          <p className="text-xl font-bold text-white">{(selectedTech.capacity / 1000).toFixed(2)} GW</p>
          <p className="text-xs text-gray-400 mt-1">{percentage.toFixed(1)}% of total</p>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-500 mb-1">Generation</p>
          <p className="text-xl font-bold text-white">
            {selectedTech.generation ? `${((selectedTech.generation || 0) / 1000).toFixed(2)} GWh` : 'N/A'}
          </p>
          {selectedTech.generation && totalGeneration > 0 && (
            <p className="text-xs text-gray-400 mt-1">{generationPercentage.toFixed(1)}% of total</p>
          )}
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
