'use client'

import { useEffect, useState } from 'react'
import { technologyColors } from '@/lib/energy-api'
import TechnologyPieChart from './TechnologyPieChart'

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
  chartType?: 'capacity' | 'generation'
}

export default function EIASupplyCharts({
  region = 'PJM',
  state,
  selectedTechnology = 'All Technologies',
  supplyView = 'current',
  chartType = 'capacity'
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

        // Fetch both capacity and generation data if needed
        if (chartType === 'generation') {
          const generationResponse = await fetch(`/api/eia/generation?${params.toString()}`)
          const generationData = await generationResponse.json()

          if (generationData.success && generationData.stats) {
            // Convert stats to technology array for generation
            const techArray: TechnologyData[] = Object.entries(generationData.stats.byTechnology || {})
              .map(([tech, stats]: [string, any]) => ({
                technology: tech,
                capacity: 0,
                generation: stats.generation || 0,
                count: 0,
                color: technologyColors[tech as keyof typeof technologyColors] || '#808080'
              }))
              .filter(item => item.generation > 0)
              .sort((a, b) => (b.generation || 0) - (a.generation || 0))

            setTechnologies(techArray)
            setTotalGeneration(generationData.stats.totalGeneration || 0)
          } else {
            setError(generationData.error || 'Failed to load generation data')
          }
        } else {
          // Fetch capacity data
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
        }
      } catch (err) {
        console.error('[EIA Supply Charts] Error:', err)
        setError('Failed to fetch supply data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [region, state, selectedTechnology, chartType])

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

  // Render pie chart based on chart type
  if (chartType === 'capacity') {
    // Capacity Pie Chart
    const pieData = technologies.map(tech => ({
      technology: tech.technology,
      value: tech.capacity,
      color: tech.color
    }))

    return (
      <div>
        <TechnologyPieChart
          data={pieData}
          total={totalCapacity}
          unit="GW"
        />
        <p className="text-xs text-gray-500 text-center mt-4">
          Real-time capacity data from EIA Form 860
        </p>
      </div>
    )
  } else {
    // Generation Pie Chart
    const pieData = technologies.map(tech => ({
      technology: tech.technology,
      value: tech.generation || 0,
      color: tech.color
    }))

    return (
      <div>
        <TechnologyPieChart
          data={pieData}
          total={totalGeneration}
          unit="GWh"
        />
        <p className="text-xs text-gray-500 text-center mt-4">
          Real-time generation data from EIA
        </p>
      </div>
    )
  }
}
