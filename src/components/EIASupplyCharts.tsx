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
  chartType?: 'capacity-fuel' | 'capacity-tech' | 'generation'
}

export default function EIASupplyCharts({
  region = 'PJM',
  state,
  selectedTechnology = 'All Technologies',
  supplyView = 'current',
  chartType = 'capacity-fuel'
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

        // Fetch from generators endpoint (has both capacity and generation)
        const response = await fetch(`/api/eia/generators?${params.toString()}`)
        const data = await response.json()

        if (data.success && data.stats) {
          let techArray: TechnologyData[] = []

          if (chartType === 'capacity-fuel') {
            // Show capacity by fuel type (Natural Gas, Nuclear, etc.)
            techArray = Object.entries(data.stats.byFuelType || {})
              .map(([fuel, stats]: [string, any]) => ({
                technology: fuel,
                capacity: stats.capacity,
                generation: stats.generation || 0,
                count: stats.count,
                color: technologyColors[fuel as keyof typeof technologyColors] || '#808080'
              }))
              .sort((a, b) => b.capacity - a.capacity)
            setTotalCapacity(data.stats.totalCapacity || 0)
          } else if (chartType === 'capacity-tech') {
            // Show capacity by detailed technology (Natural Gas Combined Cycle, etc.)
            techArray = Object.entries(data.stats.byTechnology || {})
              .map(([tech, stats]: [string, any]) => ({
                technology: tech,
                capacity: stats.capacity,
                generation: stats.generation || 0,
                count: stats.count,
                color: technologyColors[tech as keyof typeof technologyColors] || '#808080'
              }))
              .sort((a, b) => b.capacity - a.capacity)
            setTotalCapacity(data.stats.totalCapacity || 0)
          } else if (chartType === 'generation') {
            // Show generation by technology
            techArray = Object.entries(data.stats.byTechnology || {})
              .map(([tech, stats]: [string, any]) => ({
                technology: tech,
                capacity: 0,
                generation: stats.generation || 0,
                count: 0,
                color: technologyColors[tech as keyof typeof technologyColors] || '#808080'
              }))
              .filter(item => item.generation > 0)
              .sort((a, b) => (b.generation || 0) - (a.generation || 0))
            setTotalGeneration(data.stats.totalGeneration || 0)
          }

          setTechnologies(techArray)
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
  if (chartType === 'capacity-fuel' || chartType === 'capacity-tech') {
    // Capacity Pie Chart (by fuel type or technology type)
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
          {chartType === 'capacity-fuel' ? 'By Fuel Type' : 'By Technology Type'} • EIA Form 860
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
          By Technology • EIA Operating Data
        </p>
      </div>
    )
  }
}
