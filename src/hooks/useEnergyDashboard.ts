'use client'

import { useState, useEffect, useCallback } from 'react'
import { energyApi, UtilityData, TechnologyMix, technologyColors, virginiaUtilitiesStatic } from '@/lib/energy-api'

export interface DashboardData {
  utilities: UtilityData[]
  technologyMix: TechnologyMix[]
  statesComparison: any
  loading: boolean
  error: string | null
}

export interface ChartData {
  label: string
  value: number
  color: string
  percentage?: number
}

export function useEnergyDashboard(initialStates: string[] = ['Virginia']) {
  const [selectedStates, setSelectedStates] = useState<string[]>(initialStates)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    utilities: [],
    technologyMix: [],
    statesComparison: null,
    loading: false,
    error: null
  })

  const fetchDashboardData = useCallback(async (states: string[]) => {
    if (states.length === 0) {
      setDashboardData(prev => ({
        ...prev,
        utilities: [],
        technologyMix: [],
        statesComparison: null,
        loading: false
      }))
      return
    }

    setDashboardData(prev => ({ ...prev, loading: true, error: null }))

    try {
      const [utilities, technologyMix, statesComparison] = await Promise.all([
        energyApi.getStateUtilities(states).catch(() => {
          // Fallback to static data for Virginia
          return states.includes('Virginia') ? virginiaUtilitiesStatic : []
        }),
        energyApi.getStateTechnologyMix(states).catch(() => {
          // Fallback technology mix data
          return states.includes('Virginia') ? [
            { technology: 'Natural Gas', capacityMw: 15600, percentage: 52.1, colorCode: '#4169E1', count: 45 },
            { technology: 'Nuclear', capacityMw: 4200, percentage: 25.8, colorCode: '#FFD700', count: 4 },
            { technology: 'Coal', capacityMw: 3200, percentage: 12.4, colorCode: '#8B4513', count: 12 },
            { technology: 'Solar', capacityMw: 1800, percentage: 6.2, colorCode: '#FFA500', count: 230 },
            { technology: 'Wind', capacityMw: 600, percentage: 2.1, colorCode: '#00CED1', count: 8 },
            { technology: 'Hydroelectric', capacityMw: 400, percentage: 1.4, colorCode: '#0000FF', count: 15 }
          ] : []
        }),
        energyApi.getStatesComparison(states).catch(() => ({ states: [], metrics: [] }))
      ])

      setDashboardData({
        utilities,
        technologyMix,
        statesComparison,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
      // Use fallback data for Virginia when API fails
      const fallbackUtilities = states.includes('Virginia') ? virginiaUtilitiesStatic : []
      const fallbackTechnology = states.includes('Virginia') ? [
        { technology: 'Natural Gas', capacityMw: 15600, percentage: 52.1, colorCode: '#4169E1', count: 45 },
        { technology: 'Nuclear', capacityMw: 4200, percentage: 25.8, colorCode: '#FFD700', count: 4 },
        { technology: 'Coal', capacityMw: 3200, percentage: 12.4, colorCode: '#8B4513', count: 12 },
        { technology: 'Solar', capacityMw: 1800, percentage: 6.2, colorCode: '#FFA500', count: 230 }
      ] : []
      
      setDashboardData({
        utilities: fallbackUtilities,
        technologyMix: fallbackTechnology,
        statesComparison: { states: [], metrics: [] },
        loading: false,
        error: `API unavailable - showing ${states.includes('Virginia') ? 'Virginia' : 'sample'} data`
      })
    }
  }, [])

  useEffect(() => {
    fetchDashboardData(selectedStates)
  }, [selectedStates, fetchDashboardData])

  const updateSelectedStates = useCallback((states: string[]) => {
    setSelectedStates(states)
  }, [])

  const getCapacityChartData = useCallback((): ChartData[] => {
    return dashboardData.utilities.map(utility => ({
      label: utility.utilityName,
      value: utility.nameplateCapacityMw,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }))
  }, [dashboardData.utilities])

  const getTechnologyChartData = useCallback((): ChartData[] => {
    const techData: { [tech: string]: { capacity: number, color: string } } = {}
    
    dashboardData.technologyMix.forEach(mix => {
      const tech = mix.technology
      const existing = techData[tech] || { capacity: 0, color: mix.colorCode || technologyColors[tech as keyof typeof technologyColors] || '#808080' }
      techData[tech] = {
        capacity: existing.capacity + mix.capacityMw,
        color: mix.colorCode || existing.color
      }
    })

    return Object.entries(techData).map(([tech, data]) => ({
      label: tech,
      value: data.capacity,
      color: data.color
    }))
  }, [dashboardData.technologyMix])

  const getStateMetrics = useCallback(() => {
    const totalUtilities = dashboardData.utilities.length
    const totalCapacity = dashboardData.utilities.reduce((sum, u) => sum + u.nameplateCapacityMw, 0)
    const totalCustomers = dashboardData.utilities.reduce((sum, u) => sum + u.customersCount, 0)
    const avgCapacity = totalUtilities > 0 ? totalCapacity / totalUtilities : 0

    return {
      totalUtilities,
      totalCapacity,
      totalCustomers,
      avgCapacity,
      selectedStatesCount: selectedStates.length
    }
  }, [dashboardData.utilities, selectedStates.length])

  return {
    selectedStates,
    updateSelectedStates,
    dashboardData,
    refreshData: () => fetchDashboardData(selectedStates),
    getCapacityChartData,
    getTechnologyChartData,
    getStateMetrics
  }
}