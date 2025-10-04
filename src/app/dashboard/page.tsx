'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEnergyDashboard } from '@/hooks/useEnergyDashboard'
import StateSelector from '@/components/ui/StateSelector'
import EnergyChart from '@/components/ui/EnergyChart'
import MetricCard from '@/components/ui/MetricCard'
import UtilityCard from '@/components/ui/UtilityCard'
import DetailPanel from '@/components/ui/DetailPanel'
import ShowMoreControls, { useShowMore } from '@/components/ui/ShowMoreControls'
import UtilityAnalysisView from '@/components/ui/UtilityAnalysisView'
import ISORegionMap from '@/components/ISORegionMap'

// Plants Table Rows Component
function PlantsTableRows({ utility }: { utility: any }) {
  const [plants, setPlants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlants = async () => {
      if (!utility?.name && !utility?.utility_name) return

      setLoading(true)
      setError(null)
      try {
        const utilityName = utility.name || utility.utility_name
        console.log('🔍 Fetching plants for utility:', utilityName)
        const response = await fetch(`/api/plants?utility=${encodeURIComponent(utilityName)}`)

        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ API Error:', errorData)
          throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        console.log(`✅ Received ${data.length} plants`)
        setPlants(data)
      } catch (error) {
        console.error('Error fetching plants:', error)
        setError(error instanceof Error ? error.message : 'Failed to load plant data')
        setPlants([])
      } finally {
        setLoading(false)
      }
    }

    fetchPlants()
  }, [utility])

  if (loading) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Loading plants...
        </td>
      </tr>
    )
  }

  if (error) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-8 text-center text-red-500">
          {error}
        </td>
      </tr>
    )
  }

  if (plants.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
          No plants found for this utility
        </td>
      </tr>
    )
  }

  return (
    <>
      {plants.map((plant, index) => (
        <tr key={index} className="hover:bg-gray-600">
          <td className="px-4 py-3 text-sm font-medium text-white">
            {plant.plant_name || 'Unknown Plant'}
          </td>
          <td className="px-4 py-3 text-sm text-gray-400">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              plant.technology === 'Natural Gas' ? 'bg-blue-600 text-white' :
              plant.technology === 'Coal' ? 'bg-gray-600 text-white' :
              plant.technology === 'Nuclear' ? 'bg-purple-600 text-white' :
              plant.technology === 'Solar' ? 'bg-yellow-600 text-white' :
              plant.technology === 'Wind' ? 'bg-green-600 text-white' :
              plant.technology === 'Hydro' ? 'bg-cyan-600 text-white' :
              'bg-gray-600 text-white'
            }`}>
              {plant.technology || 'Unknown'}
            </span>
          </td>
          <td className="px-4 py-3 text-sm font-semibold text-right text-blue-600">
            {plant.nameplate_capacity_mw ? parseFloat(plant.nameplate_capacity_mw).toLocaleString() : '0'}
          </td>
          <td className="px-4 py-3 text-sm text-center text-gray-400">
            {plant.operating_year || 'N/A'}
          </td>
          <td className="px-4 py-3 text-sm text-gray-400">
            {plant.county && plant.plant_state ? `${plant.county}, ${plant.plant_state}` : plant.plant_state || 'Unknown'}
          </td>
        </tr>
      ))}
    </>
  )
}

export default function DashboardPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [selectedUtility, setSelectedUtility] = useState<any>(null)
  const [selectedGenerator, setSelectedGenerator] = useState<any>(null)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)
  const [generators, setGenerators] = useState<any[]>([])
  const [generatorsLoading, setGeneratorsLoading] = useState(false)
  const [focusArea, setFocusArea] = useState('Project Sales')
  const [region, setRegion] = useState('PJM')
  const [activeView, setActiveView] = useState<'dashboard' | 'utility-analysis'>('dashboard')
  const [selectedUtilityAnalysis, setSelectedUtilityAnalysis] = useState<any>(null)
  const [capacityTrends, setCapacityTrends] = useState<any>(null)
  const [capacityTrendsLoading, setCapacityTrendsLoading] = useState(false)
  const [mapData, setMapData] = useState<any>(null)
  const [mapDataLoading, setMapDataLoading] = useState(false)
  const [stateUtilities, setStateUtilities] = useState<any[]>([])
  const [stateUtilitiesLoading, setStateUtilitiesLoading] = useState(false)
  const [selectedOwnershipType, setSelectedOwnershipType] = useState<string | null>(null)
  const [selectedUtilityForAnalysis, setSelectedUtilityForAnalysis] = useState<any>(null)
  const [portfolioData, setPortfolioData] = useState<any>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [energyBuyersTab, setEnergyBuyersTab] = useState<'utilities' | 'corporates'>('utilities')
  const [selectedCorporate, setSelectedCorporate] = useState<any>(null)
  const [selectedStateFilter, setSelectedStateFilter] = useState<string | null>(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [snapshotTab, setSnapshotTab] = useState<'supply' | 'demand'>('supply')
  const [supplyMetric, setSupplyMetric] = useState<'capacity' | 'generation'>('capacity')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Toggle favorite status
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(id)) {
        newFavorites.delete(id)
      } else {
        newFavorites.add(id)
      }
      // Save to localStorage
      localStorage.setItem('energyBuyerFavorites', JSON.stringify(Array.from(newFavorites)))
      return newFavorites
    })
  }

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('energyBuyerFavorites')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setFavorites(new Set(parsed))
      } catch (e) {
        console.error('Failed to load favorites', e)
      }
    }
  }, [])

  // Fetch portfolio data when utility is selected
  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!selectedUtilityForAnalysis?.name && !selectedUtilityForAnalysis?.utility_name) {
        setPortfolioData(null)
        return
      }

      setPortfolioLoading(true)
      try {
        const utilityName = selectedUtilityForAnalysis.name || selectedUtilityForAnalysis.utility_name
        console.log('🔍 Fetching portfolio for utility:', utilityName)
        
        const response = await fetch(`/api/generators/by-utility?utilityName=${encodeURIComponent(utilityName)}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio data: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('📊 Portfolio data received:', data)
        setPortfolioData(data)
      } catch (error) {
        console.error('❌ Error fetching portfolio data:', error)
        setPortfolioData(null)
      } finally {
        setPortfolioLoading(false)
      }
    }

    fetchPortfolioData()
  }, [selectedUtilityForAnalysis])
  
  // Region to states mapping
  const regionStatesMap: { [key: string]: string[] } = {
    'CAISO': ['California', 'Nevada'],
    'ERCOT': ['Texas'],
    'ISO-NE': ['Connecticut', 'Maine', 'Massachusetts', 'New Hampshire', 'Rhode Island', 'Vermont'],
    'MISO': ['Arkansas', 'Illinois', 'Indiana', 'Iowa', 'Kentucky', 'Louisiana', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'North Dakota', 'South Dakota', 'Texas', 'Wisconsin'],
    'NYISO': ['New York'],
    'PJM': ['Delaware', 'Illinois', 'Indiana', 'Kentucky', 'Maryland', 'Michigan', 'New Jersey', 'North Carolina', 'Ohio', 'Pennsylvania', 'Tennessee', 'Virginia', 'West Virginia', 'District of Columbia'],
    'SPP': ['Arkansas', 'Kansas', 'Louisiana', 'Mississippi', 'Missouri', 'Nebraska', 'New Mexico', 'Oklahoma', 'North Dakota', 'South Dakota', 'Texas', 'Wyoming']
  }

  // Corporate data centers by region (placeholder data)
  const corporatesByRegion: { [key: string]: any[] } = {
    'PJM': [
      { id: 1, name: 'Amazon Web Services', type: 'Hyperscale', estimatedLoad: '2000 MW', states: ['Virginia', 'Pennsylvania', 'Ohio'], facilities: 50 },
      { id: 2, name: 'Google', type: 'Hyperscale', estimatedLoad: '1500 MW', states: ['Virginia', 'Pennsylvania'], facilities: 25 },
      { id: 3, name: 'Microsoft Azure', type: 'Hyperscale', estimatedLoad: '1800 MW', states: ['Virginia', 'Maryland'], facilities: 35 },
      { id: 4, name: 'Meta (Facebook)', type: 'Hyperscale', estimatedLoad: '800 MW', states: ['Virginia'], facilities: 12 },
      { id: 5, name: 'Oracle Cloud', type: 'Hyperscale', estimatedLoad: '600 MW', states: ['Virginia', 'Pennsylvania'], facilities: 15 },
      { id: 36, name: 'NVIDIA', type: 'AI Infrastructure', estimatedLoad: '950 MW', states: ['Virginia', 'Maryland'], facilities: 8 },
      { id: 37, name: 'CoreWeave', type: 'AI Cloud', estimatedLoad: '750 MW', states: ['Virginia', 'Pennsylvania'], facilities: 6 },
      { id: 38, name: 'QTS Realty Trust', type: 'Data Center REIT', estimatedLoad: '450 MW', states: ['Virginia', 'Pennsylvania'], facilities: 12 },
      { id: 39, name: 'CyrusOne', type: 'Colocation', estimatedLoad: '380 MW', states: ['Virginia', 'Ohio'], facilities: 9 }
    ],
    'ERCOT': [
      { id: 6, name: 'Amazon Web Services', type: 'Hyperscale', estimatedLoad: '1200 MW', states: ['Texas'], facilities: 30 },
      { id: 7, name: 'Microsoft Azure', type: 'Hyperscale', estimatedLoad: '900 MW', states: ['Texas'], facilities: 20 },
      { id: 8, name: 'Google', type: 'Hyperscale', estimatedLoad: '700 MW', states: ['Texas'], facilities: 15 },
      { id: 9, name: 'Meta (Facebook)', type: 'Hyperscale', estimatedLoad: '500 MW', states: ['Texas'], facilities: 10 },
      { id: 10, name: 'Tesla', type: 'Industrial', estimatedLoad: '400 MW', states: ['Texas'], facilities: 5 },
      { id: 40, name: 'NVIDIA', type: 'AI Infrastructure', estimatedLoad: '850 MW', states: ['Texas'], facilities: 7 },
      { id: 41, name: 'CoreWeave', type: 'AI Cloud', estimatedLoad: '620 MW', states: ['Texas'], facilities: 5 }
    ],
    'CAISO': [
      { id: 11, name: 'Google', type: 'Hyperscale', estimatedLoad: '2500 MW', states: ['California'], facilities: 45 },
      { id: 12, name: 'Apple', type: 'Hyperscale', estimatedLoad: '1000 MW', states: ['California', 'Nevada'], facilities: 18 },
      { id: 13, name: 'Amazon Web Services', type: 'Hyperscale', estimatedLoad: '1400 MW', states: ['California'], facilities: 25 },
      { id: 14, name: 'Meta (Facebook)', type: 'Hyperscale', estimatedLoad: '900 MW', states: ['California'], facilities: 16 },
      { id: 15, name: 'Microsoft Azure', type: 'Hyperscale', estimatedLoad: '800 MW', states: ['California'], facilities: 14 },
      { id: 42, name: 'NVIDIA', type: 'AI Infrastructure', estimatedLoad: '1100 MW', states: ['California'], facilities: 10 },
      { id: 43, name: 'CoreWeave', type: 'AI Cloud', estimatedLoad: '680 MW', states: ['California'], facilities: 6 }
    ],
    'MISO': [
      { id: 16, name: 'Google', type: 'Hyperscale', estimatedLoad: '1200 MW', states: ['Iowa', 'Illinois'], facilities: 22 },
      { id: 17, name: 'Meta (Facebook)', type: 'Hyperscale', estimatedLoad: '1500 MW', states: ['Illinois', 'Indiana'], facilities: 28 },
      { id: 18, name: 'Microsoft Azure', type: 'Hyperscale', estimatedLoad: '900 MW', states: ['Illinois', 'Minnesota'], facilities: 18 },
      { id: 19, name: 'Amazon Web Services', type: 'Hyperscale', estimatedLoad: '700 MW', states: ['Iowa', 'Minnesota'], facilities: 15 },
      { id: 20, name: 'Oracle Cloud', type: 'Hyperscale', estimatedLoad: '400 MW', states: ['Illinois'], facilities: 8 }
    ],
    'NYISO': [
      { id: 21, name: 'Amazon Web Services', type: 'Hyperscale', estimatedLoad: '800 MW', states: ['New York'], facilities: 18 },
      { id: 22, name: 'Microsoft Azure', type: 'Hyperscale', estimatedLoad: '900 MW', states: ['New York'], facilities: 20 },
      { id: 23, name: 'Google', type: 'Hyperscale', estimatedLoad: '600 MW', states: ['New York'], facilities: 12 },
      { id: 24, name: 'Digital Realty', type: 'Colocation', estimatedLoad: '500 MW', states: ['New York'], facilities: 15 },
      { id: 25, name: 'Equinix', type: 'Colocation', estimatedLoad: '400 MW', states: ['New York'], facilities: 10 }
    ],
    'ISO-NE': [
      { id: 26, name: 'Microsoft Azure', type: 'Hyperscale', estimatedLoad: '500 MW', states: ['Massachusetts'], facilities: 10 },
      { id: 27, name: 'Amazon Web Services', type: 'Hyperscale', estimatedLoad: '400 MW', states: ['Massachusetts', 'Connecticut'], facilities: 8 },
      { id: 28, name: 'Google', type: 'Hyperscale', estimatedLoad: '600 MW', states: ['Massachusetts'], facilities: 12 },
      { id: 29, name: 'Servistar', type: 'Developer', estimatedLoad: '3000 MW', states: ['Massachusetts'], facilities: 1 },
      { id: 30, name: 'Eversource Energy', type: 'Utility Partner', estimatedLoad: 'N/A', states: ['Massachusetts', 'Connecticut'], facilities: 2 }
    ],
    'SPP': [
      { id: 31, name: 'Meta (Facebook)', type: 'Hyperscale', estimatedLoad: '1000 MW', states: ['Kansas', 'Missouri'], facilities: 20 },
      { id: 32, name: 'Google', type: 'Hyperscale', estimatedLoad: '1000 MW', states: ['Kansas', 'Missouri'], facilities: 18 },
      { id: 33, name: 'Amazon Web Services', type: 'Hyperscale', estimatedLoad: '600 MW', states: ['Kansas', 'Oklahoma'], facilities: 12 },
      { id: 34, name: 'Microsoft Azure', type: 'Hyperscale', estimatedLoad: '500 MW', states: ['Kansas'], facilities: 10 },
      { id: 35, name: 'Edged Data Centers', type: 'Developer', estimatedLoad: '150 MW', states: ['Kansas', 'Missouri'], facilities: 5 }
    ]
  }

  const {
    selectedStates,
    updateSelectedStates,
    dashboardData,
    getCapacityChartData,
    getTechnologyChartData,
    getStateMetrics,
    refreshData
  } = useEnergyDashboard(regionStatesMap[region] || ['Pennsylvania'])

  // Update selected states when region changes
  useEffect(() => {
    if (regionStatesMap[region]) {
      updateSelectedStates(regionStatesMap[region])
    }
  }, [region])

  // Pagination hooks (after dashboardData is available)
  const utilityShowMore = useShowMore(dashboardData?.utilities?.length || 0, 8, 8)
  const generatorShowMore = useShowMore(generators.length, 8, 8)

  // Fetch generators data with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const fetchGenerators = async () => {
      if (selectedStates.length === 0) {
        setGenerators([])
        return
      }
      
      setGeneratorsLoading(true)
      try {
        const stateMap: { [key: string]: string } = {
          // PJM states
          'Delaware': 'DE', 'Illinois': 'IL', 'Indiana': 'IN', 'Kentucky': 'KY',
          'Maryland': 'MD', 'Michigan': 'MI', 'New Jersey': 'NJ', 'North Carolina': 'NC',
          'Ohio': 'OH', 'Pennsylvania': 'PA', 'Tennessee': 'TN', 'Virginia': 'VA',
          'West Virginia': 'WV', 'District of Columbia': 'DC',
          // CAISO states
          'California': 'CA', 'Nevada': 'NV',
          // ERCOT states
          'Texas': 'TX',
          // ISO-NE states
          'Connecticut': 'CT', 'Maine': 'ME', 'Massachusetts': 'MA',
          'New Hampshire': 'NH', 'Rhode Island': 'RI', 'Vermont': 'VT',
          // MISO states
          'Arkansas': 'AR', 'Iowa': 'IA', 'Louisiana': 'LA', 'Minnesota': 'MN',
          'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'North Dakota': 'ND',
          'South Dakota': 'SD', 'Wisconsin': 'WI',
          // NYISO states
          'New York': 'NY',
          // SPP states
          'Kansas': 'KS', 'Nebraska': 'NE', 'New Mexico': 'NM', 'Oklahoma': 'OK',
          'Wyoming': 'WY'
        }
        const stateCodes = selectedStates.map(state => stateMap[state] || state)
        
        const response = await fetch('/api/energy/generators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ states: stateCodes, limit: 100 })
        })
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        setGenerators(data.generators || [])
      } catch (error) {
        console.error('Failed to fetch generators:', error)
        setGenerators([])
      } finally {
        setGeneratorsLoading(false)
      }
    }

    // Debounce API calls
    timeoutId = setTimeout(fetchGenerators, 300)
    
    return () => clearTimeout(timeoutId)
  }, [selectedStates])

  // Fetch state utilities data for all states in region with debouncing
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const fetchStateUtilities = async () => {
      if (selectedStates.length === 0) {
        setStateUtilities([])
        return
      }

      try {
        setStateUtilitiesLoading(true)

        // Fetch utilities for ALL states in the region
        const allUtilitiesPromises = selectedStates.map(async (stateName) => {
          let url = `/api/utilities/by-state?state=${encodeURIComponent(stateName)}`
          if (selectedOwnershipType) {
            url += `&ownership=${encodeURIComponent(selectedOwnershipType)}`
          }

          const response = await fetch(url)
          if (!response.ok) return { utilities: [] }
          const data = await response.json()
          return { utilities: data.utilities || [], state: stateName }
        })

        const allResults = await Promise.all(allUtilitiesPromises)

        // Flatten all utilities and add state information
        const allUtilities = allResults.flatMap(result =>
          result.utilities.map((utility: any) => ({
            ...utility,
            states: [result.state] // Track which state this utility is in
          }))
        )

        // Deduplicate by utility_number and merge states
        const utilityMap = new Map()
        allUtilities.forEach((utility: any) => {
          const key = utility.utility_number || utility.utilityNumber || utility.id
          if (utilityMap.has(key)) {
            // Merge states if utility already exists
            const existing = utilityMap.get(key)
            existing.states = [...new Set([...existing.states, ...utility.states])]
          } else {
            utilityMap.set(key, utility)
          }
        })

        const deduplicatedUtilities = Array.from(utilityMap.values())

        console.log('=== DASHBOARD: Utilities ===')
        console.log(`Fetched from ${selectedStates.length} states`)
        console.log(`Total utilities (deduplicated): ${deduplicatedUtilities.length}`)

        setStateUtilities(deduplicatedUtilities)
      } catch (error) {
        console.error('Error fetching state utilities:', error)
        setStateUtilities([])
      } finally {
        setStateUtilitiesLoading(false)
      }
    }

    // Debounce API calls
    timeoutId = setTimeout(fetchStateUtilities, 300)

    return () => clearTimeout(timeoutId)
  }, [selectedStates, selectedOwnershipType])

  // Fetch capacity trends data with debouncing
  // Reset state filter when region changes
  useEffect(() => {
    setSelectedStateFilter(null)
  }, [region])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const fetchCapacityTrends = async () => {
      if (selectedStates.length === 0) {
        setCapacityTrends(null)
        return
      }

      // Use selectedStateFilter if set, otherwise use all selectedStates
      const statesToFetch = selectedStateFilter ? [selectedStateFilter] : selectedStates

      setCapacityTrendsLoading(true)
      try {
        const response = await fetch('/api/energy/capacity-trends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ states: statesToFetch })
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        setCapacityTrends(data)
      } catch (error) {
        console.error('Failed to fetch capacity trends:', error)
        setCapacityTrends(null)
      } finally {
        setCapacityTrendsLoading(false)
      }
    }

    // Debounce API calls
    timeoutId = setTimeout(fetchCapacityTrends, 300)

    return () => clearTimeout(timeoutId)
  }, [selectedStates, selectedStateFilter])

  // Fetch map data with debouncing
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    
    const fetchMapData = async () => {
      if (selectedStates.length === 0) {
        setMapData(null)
        return
      }
      
      setMapDataLoading(true)
      try {
        const response = await fetch('/api/energy/map-generators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: selectedStates[0] }) // Only use first state since we allow single selection
        })
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        setMapData(data)
      } catch (error) {
        console.error('Failed to fetch map data:', error)
        setMapData(null)
      } finally {
        setMapDataLoading(false)
      }
    }

    // Debounce API calls
    timeoutId = setTimeout(fetchMapData, 300)
    
    return () => clearTimeout(timeoutId)
  }, [selectedStates])

  const handleUtilitySelect = (utility: any) => {
    setSelectedUtility(utility)
    setSelectedGenerator(null)
    setDetailPanelOpen(true)
  }

  const handleGeneratorSelect = (generator: any) => {
    setSelectedGenerator(generator)
    setSelectedUtility(null)
    setDetailPanelOpen(true)
  }

  const handleDetailClose = () => {
    setDetailPanelOpen(false)
    setSelectedUtility(null)
    setSelectedGenerator(null)
  }

  const handleLogout = async () => {
    await logout()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex items-center space-x-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg font-medium text-gray-300">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const metrics = getStateMetrics()
  const capacityData = getCapacityChartData()
  const technologyData = getTechnologyChartData()

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Modern Header */}
      <header className="bg-black shadow-sm border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.05em', fontWeight: '500' }}>
                  <span className="text-white">Hayl Energy AI</span>
                </h1>
                <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="5" width="20" height="14" rx="1" fill="#B91C1C"/>
                    <rect x="2" y="5" width="20" height="1.5" fill="#DC2626"/>
                    <rect x="2" y="7.5" width="20" height="1.5" fill="#DC2626"/>
                    <rect x="2" y="10.5" width="20" height="1.5" fill="#DC2626"/>
                    <rect x="2" y="13.5" width="20" height="1.5" fill="#DC2626"/>
                    <rect x="2" y="16.5" width="20" height="1.5" fill="#DC2626"/>
                    <rect x="2" y="5" width="9" height="8" fill="#1E40AF"/>
                    {[...Array(50)].map((_, i) => {
                      const row = Math.floor(i / 6);
                      const col = i % 6;
                      const x = 3 + col * 1.2;
                      const y = 6 + row * 0.8;
                      if (x > 10 || y > 12) return null;
                      return (
                        <circle key={i} cx={x} cy={y} r="0.15" fill="white"/>
                      );
                    })}
                  </svg>
                  <span>United States</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="flex items-center space-x-2 text-sm">
                <a href="#" className="px-3 py-2 font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all">Home</a>
                <button
                  onClick={() => window.open('/explore', '_blank')}
                  className="px-3 py-2 font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                >
                  Explore
                </button>
                <button
                  onClick={() => window.open('/connections', '_blank', 'noopener,noreferrer')}
                  className="px-3 py-2 font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                >
                  Connections
                </button>
                <a href="#" className="px-3 py-2 font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all">Settings</a>
              </nav>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Debug Info - Remove this in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-800">Debug Info:</h3>
            <p className="text-sm text-yellow-700">Selected States: {JSON.stringify(selectedStates)}</p>
            <p className="text-sm text-yellow-700">Utilities Count: {dashboardData.utilities?.length || 0}</p>
            <p className="text-sm text-yellow-700">Generators Count: {generators.length}</p>
            <p className="text-sm text-yellow-700">Loading: {dashboardData.loading ? 'Yes' : 'No'}</p>
            <p className="text-sm text-yellow-700">Error: {dashboardData.error || 'None'}</p>
          </div>
        )}

        {/* Header & Region Selection Combined */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700 mb-6">
          {/* Welcome Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Welcome, {user.name || user.email.split('@')[0]}</h2>
          </div>

          {/* Auto-loading indicator with better styling */}
          {dashboardData.loading && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm mb-6">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div>
                  <span className="text-blue-800 font-medium">Updating energy data...</span>
                  <div className="text-xs text-blue-600 mt-0.5">Real-time market intelligence</div>
                </div>
              </div>
            </div>
          )}

          {/* Region Selection Pills */}
          <div className="flex flex-wrap gap-3">
            {Object.keys(regionStatesMap).map((regionName) => (
              <button
                key={regionName}
                onClick={() => {
                  console.log('Selecting region:', regionName)
                  setRegion(regionName)
                  updateSelectedStates(regionStatesMap[regionName])
                }}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  region === regionName
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                {regionName}
              </button>
            ))}
          </div>
        </div>

        {/* Latest News Ticker - State Tailored */}
        <div className="bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700 mb-6 overflow-hidden">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-blue-600 px-3 py-1.5 rounded-md flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <span className="text-white text-sm font-semibold">
                {region} NEWS
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex animate-scroll space-x-8">
                {[
                  {
                    title: 'Virginia Clean Energy Act Implementation Update',
                    source: 'Energy Wire',
                    date: 'Dec 15'
                  },
                  {
                    title: 'Dominion Energy Announces Major Solar Investment - $2.5B Commitment',
                    source: 'Bloomberg Energy',
                    date: 'Dec 14'
                  },
                  {
                    title: 'Power Grid Modernization Bill Passes Committee',
                    source: 'Reuters Energy',
                    date: 'Dec 13'
                  },
                  {
                    title: 'Energy Storage Project Approved for Northern Region - 300 MWh',
                    source: 'Power Magazine',
                    date: 'Dec 12'
                  },
                  {
                    title: 'Utility Rate Review Scheduled for Early 2025',
                    source: 'Local Energy Report',
                    date: 'Dec 11'
                  }
                ].concat([
                  {
                    title: 'Virginia Clean Energy Act Implementation Update',
                    source: 'Energy Wire',
                    date: 'Dec 15'
                  },
                  {
                    title: 'Dominion Energy Announces Major Solar Investment - $2.5B Commitment',
                    source: 'Bloomberg Energy',
                    date: 'Dec 14'
                  },
                  {
                    title: 'Power Grid Modernization Bill Passes Committee',
                    source: 'Reuters Energy',
                    date: 'Dec 13'
                  }
                ]).map((news, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="text-white font-medium text-sm whitespace-nowrap">
                      {news.title}
                    </span>
                    <span className="text-gray-400 text-xs whitespace-nowrap">
                      {news.source} • {news.date}
                    </span>
                    <span className="text-blue-600 text-xl">•</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Energy Snapshot Section - Full Width */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {selectedStateFilter || region} {snapshotTab === 'supply' ? 'Power Supply' : 'Power Demand'}
                </h3>
                <p className="text-gray-400">
                  Real-time supply and demand analytics with the latest market intelligence and regulatory updates for informed energy decision-making.
                </p>
              </div>
            </div>

            {/* States in Selected Region - Selectable Pills */}
            {region && regionStatesMap[region] && (
              <div className="mb-6 pb-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-300">
                    Filter by State ({regionStatesMap[region].length} states in {region})
                  </h4>
                  {selectedStateFilter && (
                    <button
                      onClick={() => setSelectedStateFilter(null)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {regionStatesMap[region].map((state) => (
                    <button
                      key={state}
                      onClick={() => setSelectedStateFilter(selectedStateFilter === state ? null : state)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedStateFilter === state
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs - Redesigned as Toggle Buttons with Total */}
            <div className="flex items-center justify-between mb-6">
              {/* Total Capacity - Updates based on state filter */}
              <div className="text-3xl font-bold text-blue-600">
                {capacityTrends ? Math.round(capacityTrends.totalCapacity / 1000) : Math.round(metrics.totalCapacity / 1000)} GW
              </div>

              {/* Toggle Buttons with Map Icon */}
              <div className="flex items-center space-x-3">
                <div className="inline-flex rounded-lg bg-gray-700 p-1">
                  <button
                    onClick={() => setSnapshotTab('supply')}
                    className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all ${
                      snapshotTab === 'supply'
                        ? 'bg-gray-800 text-blue-600 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Power Supply
                  </button>
                  <button
                    onClick={() => setSnapshotTab('demand')}
                    className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all ${
                      snapshotTab === 'demand'
                        ? 'bg-gray-800 text-blue-600 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Power Demand
                  </button>
                </div>

                {/* Map View Button */}
                <button
                  onClick={() => setShowMapModal(true)}
                  className="p-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all"
                  title="View Map"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </button>
              </div>

              {/* Spacer for balance */}
              <div className="w-32"></div>
            </div>

            {/* Power Supply Content */}
            {snapshotTab === 'supply' && (
              <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {capacityTrends?.technologyBreakdown ? capacityTrends.technologyBreakdown
                .slice(0, 6)
                .map((tech: any) => {
                  const colors: Record<string, string> = {
                    'Natural Gas': 'bg-blue-500',
                    'Coal': 'bg-gray-700',
                    'Nuclear': 'bg-purple-500',
                    'Solar': 'bg-yellow-500',
                    'Wind': 'bg-green-500',
                    'Hydro': 'bg-cyan-500',
                    'Battery Storage': 'bg-indigo-500',
                    'Biomass': 'bg-emerald-600',
                    'Other': 'bg-gray-400'
                  }
                  return (
                    <div key={tech.technology} className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${colors[tech.technology] || colors.Other}`} />
                      <span className="text-sm text-gray-300">{tech.technology}:</span>
                      <span className="text-sm font-semibold text-white">
                        {tech.capacity.toLocaleString()} MW
                      </span>
                    </div>
                  )
                }) : capacityTrendsLoading ? (
                <div className="col-span-6 text-center py-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading energy data...</p>
                  </div>
                </div>
              ) : generators.length > 0 ? Object.entries(
                generators.reduce((acc, gen) => {
                  const tech = gen.technology || 'Other'
                  acc[tech] = (acc[tech] || 0) + (gen.capacity?.nameplate || 0)
                  return acc
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 6)
                .map(([tech, capacity]) => {
                  const colors: Record<string, string> = {
                    'Coal': 'bg-gray-700',
                    'Natural Gas': 'bg-blue-500',
                    'Nuclear': 'bg-purple-500',
                    'Solar': 'bg-yellow-500',
                    'Wind': 'bg-green-500',
                    'Hydro': 'bg-cyan-500',
                    'Other': 'bg-gray-400'
                  }
                  return (
                    <div key={tech} className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${colors[tech] || colors.Other}`} />
                      <span className="text-sm text-gray-300">{tech}:</span>
                      <span className="text-sm font-semibold text-white">
                        {Math.round(capacity as number).toLocaleString()} MW
                      </span>
                    </div>
                  )
                }) : (
                <div className="col-span-6 text-center py-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading energy data...</p>
                  </div>
                </div>
              )}
              </div>
              </>
            )}

            {/* Power Demand Content */}
            {snapshotTab === 'demand' && (
              <div>
                {/* Peak Load Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                    <p className="text-sm text-red-600 font-medium mb-1">Peak Load</p>
                    <p className="text-3xl font-bold text-red-900">68.5 GW</p>
                    <p className="text-xs text-red-600 mt-1">Summer 2024</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium mb-1">Average Load</p>
                    <p className="text-3xl font-bold text-blue-900">42.3 GW</p>
                    <p className="text-xs text-blue-600 mt-1">Annual average</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium mb-1">Load Growth</p>
                    <p className="text-3xl font-bold text-purple-900">+3.2%</p>
                    <p className="text-xs text-purple-600 mt-1">YoY growth rate</p>
                  </div>
                </div>

                {/* Load by Customer Class */}
                <div className="bg-gray-900 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Load by Customer Class</h4>
                  <div className="space-y-4">
                    {/* Residential */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="text-sm font-medium text-gray-300">Residential</span>
                        </div>
                        <span className="text-sm font-semibold text-white">24.1 GW (35%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">8.2M customers • 156 TWh/year</p>
                    </div>

                    {/* Commercial */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium text-gray-300">Commercial</span>
                        </div>
                        <span className="text-sm font-semibold text-white">20.6 GW (30%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">1.1M customers • 134 TWh/year</p>
                    </div>

                    {/* Industrial */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span className="text-sm font-medium text-gray-300">Industrial</span>
                        </div>
                        <span className="text-sm font-semibold text-white">24.1 GW (35%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">42K customers • 156 TWh/year</p>
                    </div>
                  </div>
                </div>

                {/* Demand Trends */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Data Centers</p>
                    <p className="text-lg font-bold text-white">12.8 GW</p>
                    <p className="text-xs text-green-600">↑ 18% YoY</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">EV Charging</p>
                    <p className="text-lg font-bold text-white">2.4 GW</p>
                    <p className="text-xs text-green-600">↑ 45% YoY</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Manufacturing</p>
                    <p className="text-lg font-bold text-white">15.2 GW</p>
                    <p className="text-xs text-gray-400">↑ 2% YoY</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Other</p>
                    <p className="text-lg font-bold text-white">13.5 GW</p>
                    <p className="text-xs text-gray-400">→ Flat</p>
                  </div>
                </div>
              </div>
            )}

            {/* Total capacity (for supply tab only) */}
            {snapshotTab === 'supply' && (
              <div className="text-xl font-semibold text-white mb-4">
                Total: {capacityTrends ? Math.round(capacityTrends.totalCapacity / 1000) : Math.round(metrics.totalCapacity / 1000)} GW
              </div>
            )}

            {/* Stacked Bar Chart - Only show for Power Supply */}
            {snapshotTab === 'supply' && (
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="flex justify-end mb-4">
                <div className="inline-flex rounded-lg bg-gray-700 p-0.5">
                  <button onClick={() => setSupplyMetric('capacity')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                    supplyMetric === 'capacity' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}>
                    Capacity (MW)
                  </button>
                  <button onClick={() => setSupplyMetric('generation')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                    supplyMetric === 'generation' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}>
                    Generation (MWh)
                  </button>
                </div>
              </div>
              {capacityTrendsLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : capacityTrends?.chartData ? (
                <div className="h-48">
                {/* Chart Container */}
                <div className="relative h-full">
                  {/* Chart Area */}
                  <div className="ml-4 mr-4 h-full">
                    {(() => {
                      const maxCapacity = Math.max(...capacityTrends.chartData.map((d: any) =>
                        d.data.reduce((sum: number, tech: any) => sum + tech.capacity, 0)
                      ))
                      const chartHeight = 160
                      const techOrder = ['Natural Gas', 'Coal', 'Nuclear', 'Solar', 'Wind', 'Hydro', 'Battery Storage', 'Biomass', 'Other']
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

                      return (
                        <div className="h-full flex flex-col">
                          {/* Chart Area */}
                          <div className="flex flex-1">
                            {/* Y-Axis Scale */}
                            <div className="w-8 flex flex-col justify-between text-right pr-2" style={{ height: `${chartHeight}px` }}>
                              {[0, 1, 2, 3, 4, 5].reverse().map(i => (
                                <div key={i} className="text-xs text-gray-400">
                                  {Math.round((maxCapacity * i / 5) / 1000)}k
                                </div>
                              ))}
                            </div>

                            {/* Chart Bars */}
                            <div className="flex-1 flex items-end justify-between space-x-8 border-l border-b border-gray-300 pl-4 pb-2" style={{ height: `${chartHeight}px` }}>
                              {capacityTrends.chartData.map((yearData: any) => {
                                const totalForYear = yearData.data.reduce((sum: number, tech: any) => sum + tech.capacity, 0)

                                // Create technology map for consistent ordering
                                const techMap: { [key: string]: number } = {}
                                yearData.data.forEach((tech: any) => {
                                  techMap[tech.technology] = tech.capacity
                                })

                                // Calculate stacked segments
                                const segments: Array<{tech: string, capacity: number, height: number, startY: number}> = []
                                let currentY = 0

                                techOrder.forEach(tech => {
                                  const capacity = techMap[tech] || 0
                                  if (capacity > 0) {
                                    const segmentHeight = maxCapacity > 0 ? (capacity / maxCapacity) * (chartHeight - 20) : 0
                                    segments.push({
                                      tech,
                                      capacity,
                                      height: segmentHeight,
                                      startY: currentY
                                    })
                                    currentY += segmentHeight
                                  }
                                })

                                return (
                                  <div key={yearData.year} className="flex flex-col items-center space-y-2 flex-1">
                                    {/* Single Stacked Bar */}
                                    <div
                                      className="relative w-12 border border-gray-700"
                                      style={{ height: `${chartHeight - 20}px` }}
                                    >
                                      {segments.map((segment, index) => (
                                        <div
                                          key={`${yearData.year}-${segment.tech}`}
                                          className="absolute w-full hover:opacity-80 transition-opacity cursor-pointer"
                                          style={{
                                            height: `${segment.height}px`,
                                            backgroundColor: techColors[segment.tech],
                                            bottom: `${segment.startY}px`,
                                            minHeight: segment.height > 0 ? '1px' : '0px'
                                          }}
                                          title={`${segment.tech}: ${segment.capacity.toLocaleString()} MW (${Math.round((segment.capacity / totalForYear) * 100)}%)`}
                                        />
                                      ))}
                                    </div>

                                    {/* Year Label */}
                                    <span className="text-sm font-medium text-gray-300">{yearData.year}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              // Fallback placeholder
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-500 mb-2">No data available</div>
                  <div className="text-sm text-gray-400">Select a state to view capacity trends</div>
                </div>
              </div>
            )}
            </div>
            )}

            {/* Sources */}
            <div className="text-sm text-gray-400 mb-4">
              Sources: EIA.gov, State Energy Data System
            </div>

            {/* Download and Compare buttons */}
            <div className="flex justify-center space-x-3">
              <button className="px-6 py-2.5 text-sm font-medium text-gray-300 hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
                Download
              </button>
              <button className="px-6 py-2.5 text-sm font-medium text-gray-300 hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
                Compare
              </button>
            </div>
        </div>

        {/* Energy Buyers Section */}
        <div className="bg-gray-900 rounded-lg px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">
                {region} Energy Buyers
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Discover the largest energy consumers in the {region} region across {selectedStates.length} states, ranked by peak load demand from highest to lowest capacity requirements.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex gap-3">
                <button
                  onClick={() => setEnergyBuyersTab('utilities')}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    energyBuyersTab === 'utilities'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  Utilities
                </button>
                <button
                  onClick={() => setEnergyBuyersTab('corporates')}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    energyBuyersTab === 'corporates'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  Corporates
                </button>
              </div>
            </div>

            {/* Ownership Type Filter - Only show for Utilities tab */}
            {energyBuyersTab === 'utilities' && selectedStates.length > 0 && (
              <div className="flex justify-center mb-6">
                <div className="inline-flex rounded-lg bg-gray-700 p-1">
                  <button
                    onClick={() => setSelectedOwnershipType(null)}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      selectedOwnershipType === null
                        ? 'bg-gray-800 text-blue-600 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setSelectedOwnershipType('Investor Owned')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      selectedOwnershipType === 'Investor Owned'
                        ? 'bg-gray-800 text-blue-600 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    INVESTOR OWNED
                  </button>
                  <button
                    onClick={() => setSelectedOwnershipType('Cooperative')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      selectedOwnershipType === 'Cooperative'
                        ? 'bg-gray-800 text-blue-600 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    COOPERATIVE
                  </button>
                  <button
                    onClick={() => setSelectedOwnershipType('Municipal')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      selectedOwnershipType === 'Municipal'
                        ? 'bg-gray-800 text-blue-600 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    MUNICIPAL
                  </button>
                  <button
                    onClick={() => setSelectedOwnershipType('Retail Power Marketer')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      selectedOwnershipType === 'Retail Power Marketer'
                        ? 'bg-gray-800 text-blue-600 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    RETAIL POWER MARKETER
                  </button>
                </div>
              </div>
            )}

            {/* Utilities Tab Content */}
            {energyBuyersTab === 'utilities' && (
              <>
                {/* Utilities Count */}
                {selectedStates.length > 0 && (
                  <div className="text-center mb-6">
                    <p className="text-gray-400">
                      {stateUtilitiesLoading ? 'Loading utilities...' : `Found ${stateUtilities.length} utilities across ${region} region`}
                    </p>
                  </div>
                )}

                {/* Company Grid Visualization */}
                <div className="mb-10">
              {stateUtilitiesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading utility companies...</p>
                  </div>
                </div>
              ) : stateUtilities && stateUtilities.length > 0 ? (
                <div className="relative">
                  {/* Horizontal Scrollable Tiles */}
                  <div className="flex overflow-x-auto space-x-4 pb-4 scroll-smooth">
                    {stateUtilities.map((utility, index) => {
                      const utilityId = `utility-${utility.id || utility.utility_number || utility.utilityNumber || index}`
                      const isFavorited = favorites.has(utilityId)

                      return (
                      <div
                        key={utility.id || index}
                        className={`flex-shrink-0 w-72 bg-gray-800 rounded-lg shadow-md border-2 p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 relative ${
                          selectedUtilityForAnalysis?.id === utility.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {/* Favorite Star Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(utilityId)

                            // Save company data to localStorage for explore page
                            const savedCompanies = localStorage.getItem('allEnergyBuyerCompanies')
                            const companies = savedCompanies ? JSON.parse(savedCompanies) : []

                            // Create company object
                            const companyData = {
                              id: utilityId,
                              name: utility.name || utility.utility_name || `Utility ${index + 1}`,
                              type: 'utility',
                              states: utility.states || [],
                              ownershipType: utility.ownershipType || utility.ownership_type,
                              region: region
                            }

                            // Add or update company in the list
                            const existingIndex = companies.findIndex((c: any) => c.id === utilityId)
                            if (existingIndex >= 0) {
                              companies[existingIndex] = companyData
                            } else {
                              companies.push(companyData)
                            }

                            localStorage.setItem('allEnergyBuyerCompanies', JSON.stringify(companies))
                          }}
                          className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors z-10 ${
                            isFavorited
                              ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50'
                              : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                          }`}
                          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>

                        <div
                          className="text-center cursor-pointer"
                          onClick={() => {
                            setSelectedUtilityForAnalysis(utility)
                            setSelectedCorporate(null) // Clear corporate selection
                            // Scroll to profile section with slower animation
                            setTimeout(() => {
                              const element = document.getElementById('utility-analysis-section')
                              if (element) {
                                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                                const offsetPosition = elementPosition - 100 // 100px offset from top to show header

                                window.scrollTo({
                                  top: offsetPosition,
                                  behavior: 'smooth'
                                })
                              }
                            }, 200)
                          }}
                        >
                          <h4 className="text-lg font-bold text-white leading-tight mb-2">
                            {utility.name || utility.utility_name || `Utility ${index + 1}`}
                          </h4>

                          {/* Multi-state badge */}
                          {utility.states && utility.states.length > 1 && (
                            <div className="mb-2">
                              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                                Multi-State ({utility.states.length})
                              </span>
                            </div>
                          )}

                          {/* States operated in */}
                          {utility.states && utility.states.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {utility.states.slice(0, 3).map((state: string) => (
                                  <span key={state} className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                                    {state}
                                  </span>
                                ))}
                                {utility.states.length > 3 && (
                                  <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                                    +{utility.states.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {utility.ownershipType || utility.ownership_type ? (
                            <p className="text-sm text-gray-500 uppercase font-medium mb-3">
                              {utility.ownershipType || utility.ownership_type}
                            </p>
                          ) : null}
                          {utility.utilityNumber && (
                            <p className="text-xs text-gray-400 mb-2">
                              Utility #{utility.utilityNumber}
                            </p>
                          )}
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            selectedUtilityForAnalysis?.id === utility.id
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {selectedUtilityForAnalysis?.id === utility.id ? '✓ Selected' : 'Click to Select'}
                          </div>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                  
                  {/* Scroll Indicators */}
                  <div className="flex justify-center mt-4 space-x-2">
                    {stateUtilities.map((_, index) => (
                      <div
                        key={index}
                        className="w-2 h-2 rounded-full bg-gray-300"
                      />
                    ))}
                  </div>
                </div>
              ) : selectedStates.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white mb-2">No States Selected</h3>
                    <p className="text-gray-400">Select states above to view energy buyers</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white mb-2">No Utilities Found</h3>
                    <p className="text-gray-400">No utility companies found for the selected state</p>
                    <p className="text-sm text-gray-500 mt-2">Try selecting different states or check back later</p>
                  </div>
                </div>
              )}
            </div>
              </>
            )}

            {/* Corporates Tab Content */}
            {energyBuyersTab === 'corporates' && (
              <>
                {/* Corporates Count */}
                <div className="text-center mb-6">
                  <p className="text-gray-400">
                    {corporatesByRegion[region]?.length || 0} major tech companies with data center facilities in {region} region
                  </p>
                </div>

                {/* Corporate Type Filter */}
                <div className="flex justify-center mb-6">
                  <div className="inline-flex rounded-lg bg-gray-700 p-1">
                    <button
                      onClick={() => setSelectedOwnershipType(null)}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                        selectedOwnershipType === null
                          ? 'bg-gray-800 text-blue-600 shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setSelectedOwnershipType('Hyperscale')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                        selectedOwnershipType === 'Hyperscale'
                          ? 'bg-gray-800 text-blue-600 shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      HYPERSCALE
                    </button>
                    <button
                      onClick={() => setSelectedOwnershipType('Colocation')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                        selectedOwnershipType === 'Colocation'
                          ? 'bg-gray-800 text-blue-600 shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      COLOCATION
                    </button>
                    <button
                      onClick={() => setSelectedOwnershipType('Developer')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                        selectedOwnershipType === 'Developer'
                          ? 'bg-gray-800 text-blue-600 shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      DEVELOPER
                    </button>
                  </div>
                </div>

                {/* Corporates Grid */}
                <div className="mb-10">
                  <div className="relative">
                    {/* Horizontal Scrollable Tiles */}
                    <div className="flex overflow-x-auto space-x-4 pb-4 scroll-smooth">
                      {corporatesByRegion[region]?.filter((corporate) =>
                        !selectedOwnershipType || corporate.type === selectedOwnershipType
                      ).map((corporate, index) => {
                        const corporateId = `corporate-${corporate.id || index}`
                        const isFavorited = favorites.has(corporateId)

                        return (
                        <div
                          key={corporate.id || index}
                          className={`flex-shrink-0 w-72 bg-gray-800 rounded-lg shadow-md border-2 p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 relative ${
                            selectedCorporate?.id === corporate.id
                              ? 'border-blue-500 ring-2 ring-blue-500/30'
                              : 'border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {/* Favorite Star Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(corporateId)

                              // Save company data to localStorage for explore page
                              const savedCompanies = localStorage.getItem('allEnergyBuyerCompanies')
                              const companies = savedCompanies ? JSON.parse(savedCompanies) : []

                              // Create company object
                              const companyData = {
                                id: corporateId,
                                name: corporate.name,
                                type: 'corporate',
                                companyType: corporate.type,
                                states: corporate.states || [],
                                estimatedLoad: corporate.estimatedLoad,
                                facilities: corporate.facilities,
                                region: region
                              }

                              // Add or update company in the list
                              const existingIndex = companies.findIndex((c: any) => c.id === corporateId)
                              if (existingIndex >= 0) {
                                companies[existingIndex] = companyData
                              } else {
                                companies.push(companyData)
                              }

                              localStorage.setItem('allEnergyBuyerCompanies', JSON.stringify(companies))
                            }}
                            className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors z-10 ${
                              isFavorited
                                ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50'
                                : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                            }`}
                            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>

                          <div
                            className="text-center cursor-pointer"
                            onClick={() => {
                              setSelectedCorporate(corporate)
                              setSelectedUtilityForAnalysis(null) // Clear utility selection
                              // Scroll to profile section with slower animation
                              setTimeout(() => {
                                const element = document.getElementById('corporate-analysis-section')
                                if (element) {
                                  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                                  const offsetPosition = elementPosition - 100 // 100px offset from top to show header

                                  window.scrollTo({
                                    top: offsetPosition,
                                    behavior: 'smooth'
                                  })
                                }
                              }, 200)
                            }}
                          >
                            <h4 className="text-lg font-bold text-white leading-tight mb-3">
                              {corporate.name}
                            </h4>

                            {/* Multi-state badge */}
                            {corporate.states && corporate.states.length > 1 && (
                              <div className="mb-2">
                                <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                  </svg>
                                  Multi-State ({corporate.states.length})
                                </span>
                              </div>
                            )}

                            {/* States operated in */}
                            {corporate.states && corporate.states.length > 0 && (
                              <div className="mb-3">
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {corporate.states.slice(0, 3).map((state: string) => (
                                    <span key={state} className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                                      {state}
                                    </span>
                                  ))}
                                  {corporate.states.length > 3 && (
                                    <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                                      +{corporate.states.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Facilities Count */}
                            <div className="text-sm text-gray-500 mb-3">
                              {corporate.facilities} facilities
                            </div>

                            {/* Selection Indicator */}
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              selectedCorporate?.id === corporate.id
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-700 text-gray-400'
                            }`}>
                              {selectedCorporate?.id === corporate.id ? '✓ Selected' : 'Click to Select'}
                            </div>
                          </div>
                        </div>
                        )
                      })}
                    </div>

                    {/* Scroll Indicators */}
                    <div className="flex justify-center mt-4 space-x-2">
                      {corporatesByRegion[region]?.map((_, index) => (
                        <div
                          key={index}
                          className="w-2 h-2 rounded-full bg-gray-300"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 italic">
                    Data center load estimates based on public announcements and industry reports. Actual loads may vary.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Utility Analysis Section - Wireframe Format */}
        {selectedUtilityForAnalysis && (
          <section id="utility-analysis-section" className="bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-700">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="pb-6 border-b border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {(selectedUtilityForAnalysis.name || selectedUtilityForAnalysis.utility_name || 'UN').substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-white">{selectedUtilityForAnalysis.name || selectedUtilityForAnalysis.utility_name}</h1>
                          <p className="text-gray-400">{selectedUtilityForAnalysis.state}'s electric utility</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      {(() => {
                        const utilityId = `utility-${selectedUtilityForAnalysis.id || selectedUtilityForAnalysis.utility_number || selectedUtilityForAnalysis.utilityNumber}`
                        const isFavorited = favorites.has(utilityId)

                        return (
                          <button
                            onClick={() => {
                              toggleFavorite(utilityId)

                              // Save company data to localStorage
                              const savedCompanies = localStorage.getItem('allEnergyBuyerCompanies')
                              const companies = savedCompanies ? JSON.parse(savedCompanies) : []

                              const companyData = {
                                id: utilityId,
                                name: selectedUtilityForAnalysis.name || selectedUtilityForAnalysis.utility_name,
                                type: 'utility',
                                states: selectedUtilityForAnalysis.states || [],
                                ownershipType: selectedUtilityForAnalysis.ownershipType || selectedUtilityForAnalysis.ownership_type,
                                region: region
                              }

                              const existingIndex = companies.findIndex((c: any) => c.id === utilityId)
                              if (existingIndex >= 0) {
                                companies[existingIndex] = companyData
                              } else {
                                companies.push(companyData)
                              }

                              localStorage.setItem('allEnergyBuyerCompanies', JSON.stringify(companies))
                            }}
                            className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                              isFavorited
                                ? 'bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600'
                                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                            }`}
                          >
                            <svg className="w-4 h-4 inline mr-2" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            {isFavorited ? 'Favorited' : 'Favorite'}
                          </button>
                        )
                      })()}
                      <button className="px-4 py-2 text-sm font-medium bg-gray-700 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-600">
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Compare
                      </button>
                      <button className="px-4 py-2 text-sm font-medium bg-gray-700 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-600">
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      <button
                        onClick={() => setSelectedUtilityForAnalysis(null)}
                        className="px-4 py-2 text-sm font-medium text-white border border-gray-600 rounded-lg hover:bg-gray-800"
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Overview */}
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-2">Company Description</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {selectedUtilityForAnalysis.name || selectedUtilityForAnalysis.utility_name} is a major electric utility serving customers across {selectedUtilityForAnalysis.state}.
                      The company is engaged in the generation, transmission, and distribution of electricity, providing reliable power to residential, commercial, and industrial customers.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-2">Line of Business</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white shadow-md">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generation
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white shadow-md">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Transmission
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-600 text-white shadow-md">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Distribution
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Analysis Content */}
              <UtilityAnalysisInline utility={selectedUtilityForAnalysis} />
            </div>
          </section>
        )}

        {/* Corporate Analysis Section */}
        {selectedCorporate && (
          <section id="corporate-analysis-section" className="bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-700">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="pb-6 border-b border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {selectedCorporate.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-white">{selectedCorporate.name}</h1>
                          <p className="text-gray-400">{selectedCorporate.type} Data Center Operator | {selectedCorporate.states?.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      {(() => {
                        const corporateId = `corporate-${selectedCorporate.id}`
                        const isFavorited = favorites.has(corporateId)

                        return (
                          <button
                            onClick={() => {
                              toggleFavorite(corporateId)

                              // Save company data to localStorage
                              const savedCompanies = localStorage.getItem('allEnergyBuyerCompanies')
                              const companies = savedCompanies ? JSON.parse(savedCompanies) : []

                              const companyData = {
                                id: corporateId,
                                name: selectedCorporate.name,
                                type: 'corporate',
                                companyType: selectedCorporate.type,
                                states: selectedCorporate.states || [],
                                estimatedLoad: selectedCorporate.estimatedLoad,
                                facilities: selectedCorporate.facilities,
                                region: region
                              }

                              const existingIndex = companies.findIndex((c: any) => c.id === corporateId)
                              if (existingIndex >= 0) {
                                companies[existingIndex] = companyData
                              } else {
                                companies.push(companyData)
                              }

                              localStorage.setItem('allEnergyBuyerCompanies', JSON.stringify(companies))
                            }}
                            className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                              isFavorited
                                ? 'bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600'
                                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                            }`}
                          >
                            <svg className="w-4 h-4 inline mr-2" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            {isFavorited ? 'Favorited' : 'Favorite'}
                          </button>
                        )
                      })()}
                      <button className="px-4 py-2 text-sm font-medium bg-gray-700 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-600">
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Compare
                      </button>
                      <button className="px-4 py-2 text-sm font-medium bg-gray-700 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-600">
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      <button
                        onClick={() => setSelectedCorporate(null)}
                        className="px-4 py-2 text-sm font-medium text-white border border-gray-600 rounded-lg hover:bg-gray-800"
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Content with Timeline */}
              <CorporateAnalysisInline corporate={selectedCorporate} region={region} />
            </div>
          </section>
        )}
      </main>

      {/* Detail Panel Modal */}
      <DetailPanel
        item={selectedUtility || selectedGenerator}
        type={selectedUtility ? 'utility' : 'generator'}
        isOpen={detailPanelOpen}
        onClose={handleDetailClose}
      />

      {activeView === 'utility-analysis' && selectedUtilityAnalysis && (
        <UtilityAnalysisView
          utility={selectedUtilityAnalysis}
          onBack={() => {
            setActiveView('dashboard')
            setSelectedUtilityAnalysis(null)
          }}
        />
      )}

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-6xl w-full h-[80vh] p-8 border border-gray-700">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">Power Infrastructure Map</h2>
              <button
                onClick={() => setShowMapModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Map Placeholder */}
            <div className="bg-gray-700 rounded-lg h-[calc(100%-80px)] flex items-center justify-center border-2 border-dashed border-gray-600">
              <div className="text-center">
                <svg className="mx-auto h-20 w-20 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-gray-400 font-medium text-lg mb-2">Interactive Map Placeholder</p>
                <p className="text-sm text-gray-500">
                  {selectedStateFilter
                    ? `Showing power infrastructure for ${selectedStateFilter}`
                    : 'Showing power infrastructure across selected region'}
                </p>
                <div className="mt-6 flex items-center justify-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-400">Power Plants</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-400">Substations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-gray-400">Transmission Lines</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Generators List Component
function GeneratorsList({ states }: { states: string[] }) {
  const [generators, setGenerators] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const tableShowMore = useShowMore(generators.length, 10, 10)

  useEffect(() => {
    const fetchGenerators = async () => {
      setLoading(true)
      try {
        // Map state names to codes (same as energy-api.ts)
        const stateMap: { [key: string]: string } = {
          'Delaware': 'DE', 'Illinois': 'IL', 'Indiana': 'IN', 'Kentucky': 'KY',
          'Maryland': 'MD', 'Michigan': 'MI', 'New Jersey': 'NJ', 'North Carolina': 'NC',
          'Ohio': 'OH', 'Pennsylvania': 'PA', 'Tennessee': 'TN', 'Virginia': 'VA',
          'West Virginia': 'WV', 'District of Columbia': 'DC'
        }
        const stateCodes = states.map(state => stateMap[state] || state)
        
        const response = await fetch('/api/energy/generators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ states: stateCodes, limit: 15 })
        })
        const data = await response.json()
        setGenerators(data.generators || [])
      } catch (error) {
        console.error('Failed to fetch generators:', error)
        setGenerators([])
      } finally {
        setLoading(false)
      }
    }

    if (states.length > 0) {
      fetchGenerators()
    }
  }, [states])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 font-medium text-gray-300">Plant Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-300">Utility</th>
              <th className="text-left py-3 px-4 font-medium text-gray-300">Technology</th>
              <th className="text-right py-3 px-4 font-medium text-gray-300">Capacity (MW)</th>
              <th className="text-left py-3 px-4 font-medium text-gray-300">State</th>
            </tr>
          </thead>
          <tbody>
            {generators.slice(0, tableShowMore.visibleCount).map((generator, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-900 transition-colors">
                <td className="py-3 px-4 font-medium text-white">
                  {generator.plantName}
                </td>
                <td className="py-3 px-4 text-gray-400">
                  {generator.utilityName}
                </td>
                <td className="py-3 px-4 text-gray-400">
                  {generator.technology}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-blue-600">
                  {Math.round(generator.capacity.nameplate)}
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {generator.state}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <ShowMoreControls
        totalItems={generators.length}
        visibleItems={tableShowMore.visibleCount}
        onShowMore={tableShowMore.showMore}
        onShowLess={tableShowMore.hasLess ? tableShowMore.showLess : undefined}
        className="pt-4 border-t border-gray-100"
      />
    </div>
  )
}

// Inline Utility Analysis Component (Wireframe-based)
function UtilityAnalysisInline({ utility }: { utility: any }) {
  const [activeSection, setActiveSection] = useState(1)
  const [portfolioData, setPortfolioData] = useState<any>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)

  // Fetch portfolio data when utility changes
  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!utility?.name && !utility?.utility_name) {
        setPortfolioData(null)
        return
      }

      setPortfolioLoading(true)
      try {
        const utilityName = utility.name || utility.utility_name
        console.log('🔍 Fetching portfolio for utility:', utilityName)
        
        const response = await fetch(`/api/generators/by-utility?utilityName=${encodeURIComponent(utilityName)}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio data: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('📊 Portfolio data received:', data)
        setPortfolioData(data)
      } catch (error) {
        console.error('❌ Error fetching portfolio data:', error)
        setPortfolioData(null)
      } finally {
        setPortfolioLoading(false)
      }
    }

    fetchPortfolioData()
  }, [utility])

  const sections = [
    { id: 1, title: 'Energy Supply' },
    { id: 2, title: 'Energy demand' },
    { id: 3, title: 'RFP Opportunities' },
    { id: 4, title: 'Key Documents' }
  ]

  return (
    <div className="w-full">
      {/* Section Navigation - Horizontal at Top */}
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg bg-gray-700 p-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-6 py-2.5 rounded-md font-semibold transition-all ${
                  activeSection === section.id
                    ? 'bg-gray-800 text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Section Description */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">
            {sections[activeSection - 1].title}
          </h2>
          <p className="text-gray-400">
            {activeSection === 1 && `Comprehensive overview of ${utility?.name || utility?.utility_name}'s generation portfolio, capacity mix, and supply infrastructure.`}
            {activeSection === 2 && `Detailed analysis of ${utility?.name || utility?.utility_name}'s energy demand patterns, customer segments, and load profiles.`}
            {activeSection === 3 && `Current and upcoming procurement opportunities, RFPs, and partnership initiatives from ${utility?.name || utility?.utility_name}.`}
            {activeSection === 4 && `Access regulatory filings, integrated resource plans, and key documents from ${utility?.name || utility?.utility_name}.`}
          </p>
        </div>
      </div>

      {/* Section Content */}
      <div className="w-full">

            {/* Section 1: Energy Supply */}
            {activeSection === 1 && (
              <>
                {/* Capacity by Technology Chart */}
                {utility && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Capacity by Technology</h3>
                    <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
                      <div className="space-y-3">
                        {[
                          { tech: 'Natural Gas', capacity: 3200, color: 'bg-blue-500', percent: 45 },
                          { tech: 'Coal', capacity: 2100, color: 'bg-gray-600', percent: 29 },
                          { tech: 'Nuclear', capacity: 900, color: 'bg-purple-500', percent: 13 },
                          { tech: 'Solar', capacity: 450, color: 'bg-yellow-500', percent: 6 },
                          { tech: 'Wind', capacity: 350, color: 'bg-green-500', percent: 5 },
                          { tech: 'Hydro', capacity: 150, color: 'bg-cyan-500', percent: 2 }
                        ].map((item) => (
                          <div key={item.tech}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-300">{item.tech}</span>
                              <span className="text-sm text-gray-400">{item.capacity} MW ({item.percent}%)</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-3">
                              <div
                                className={`${item.color} h-3 rounded-full transition-all duration-500`}
                                style={{ width: `${item.percent}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Facilities Map */}
                {utility && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Facility Locations</h3>
                    <div className="bg-gray-700 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <div className="h-96 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <p className="text-gray-500 font-medium">Interactive Map Placeholder</p>
                          <p className="text-sm text-gray-400 mt-2">Will show power plant locations across service territory</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Power Plants Table */}
                {utility && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Power Plant Portfolio</h3>
                    <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-600">
                          <thead className="bg-gray-600">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Plant Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Technology</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Capacity (MW)</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Operating Year</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-700 divide-y divide-gray-600">
                            <PlantsTableRows utility={utility} />
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generation Sources */}
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Generation Sources</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-300">Primary Source:</span>
                        <span className="ml-2 font-medium text-white">Natural Gas</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-300">Renewable %:</span>
                        <span className="ml-2 font-medium text-white">15%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Future Projects Table */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Future Supply Projects</h3>
                  <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Project</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Type</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Status</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Timeline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(4)].map((_, i) => (
                          <tr key={i} className="border-t border-gray-600">
                            <td className="px-4 py-2 text-sm text-white">Project {i + 1}</td>
                            <td className="px-4 py-2 text-sm text-white">Solar</td>
                            <td className="px-4 py-2 text-sm text-green-400">Planned</td>
                            <td className="px-4 py-2 text-sm text-white">2025</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-gray-400 text-center">
                    The data above displays comprehensive power plant information including technology types, operational capacity, and geographic location.
                    Data sourced from EIA.gov and state regulatory filings.
                  </p>
                </div>
              </>
            )}

            {activeSection === 2 && (
              <>
                {/* Demand Overview */}
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Total Customers</p>
                      <p className="text-xl font-bold text-white">2.4M</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Annual Sales</p>
                      <p className="text-xl font-bold text-white">45,600 GWh</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Peak Demand</p>
                      <p className="text-xl font-bold text-white">8.5 GW</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Load Factor</p>
                      <p className="text-xl font-bold text-white">61%</p>
                    </div>
                  </div>
                </div>

                {/* Customer Class Breakdown */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Load by Customer Class</h3>
                  <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-600">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Customer Class</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Customers</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Annual Sales (GWh)</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">% of Total</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Avg. Usage per Customer</th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-700 divide-y divide-gray-600">
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-white">Residential</td>
                          <td className="px-4 py-3 text-sm text-white text-right">2,150,000</td>
                          <td className="px-4 py-3 text-sm text-white text-right">15,960</td>
                          <td className="px-4 py-3 text-sm text-white text-right">35%</td>
                          <td className="px-4 py-3 text-sm text-gray-400 text-right">7,420 kWh/yr</td>
                        </tr>
                        <tr className="bg-gray-600">
                          <td className="px-4 py-3 text-sm font-medium text-white">Commercial</td>
                          <td className="px-4 py-3 text-sm text-white text-right">245,000</td>
                          <td className="px-4 py-3 text-sm text-white text-right">13,680</td>
                          <td className="px-4 py-3 text-sm text-white text-right">30%</td>
                          <td className="px-4 py-3 text-sm text-gray-400 text-right">55,840 kWh/yr</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-white">Industrial</td>
                          <td className="px-4 py-3 text-sm text-white text-right">5,200</td>
                          <td className="px-4 py-3 text-sm text-white text-right">15,960</td>
                          <td className="px-4 py-3 text-sm text-white text-right">35%</td>
                          <td className="px-4 py-3 text-sm text-gray-400 text-right">3.07 GWh/yr</td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-gray-700">
                        <tr>
                          <td className="px-4 py-3 text-sm font-bold text-white">Total</td>
                          <td className="px-4 py-3 text-sm font-bold text-white text-right">2,400,200</td>
                          <td className="px-4 py-3 text-sm font-bold text-white text-right">45,600</td>
                          <td className="px-4 py-3 text-sm font-bold text-white text-right">100%</td>
                          <td className="px-4 py-3 text-sm text-gray-400 text-right">-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Load Profile by Customer Class */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Customer Class Contribution</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span className="font-medium text-white">Residential</span>
                        </div>
                        <span className="font-bold text-white">35%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-500 h-3 rounded-full" style={{width: '35%'}}></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        2.15M customers | 15,960 GWh annual sales
                      </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span className="font-medium text-white">Commercial</span>
                        </div>
                        <span className="font-bold text-white">30%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-green-500 h-3 rounded-full" style={{width: '30%'}}></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        245K customers | 13,680 GWh annual sales
                      </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-purple-500 rounded"></div>
                          <span className="font-medium text-white">Industrial</span>
                        </div>
                        <span className="font-bold text-white">35%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-purple-500 h-3 rounded-full" style={{width: '35%'}}></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        5.2K customers | 15,960 GWh annual sales
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demand Trends */}
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Historical Demand Growth by Class</h3>
                  <div className="h-64 bg-gray-800 rounded-lg p-4 flex items-end justify-between border border-gray-700">
                    {[2020, 2021, 2022, 2023, 2024].map((year) => (
                      <div key={year} className="flex flex-col items-center space-y-2 flex-1">
                        <div className="w-full max-w-[60px] space-y-0.5">
                          <div
                            className="w-full bg-blue-500 rounded-t"
                            style={{ height: `${Math.random() * 40 + 30}px` }}
                            title="Residential"
                          />
                          <div
                            className="w-full bg-green-500"
                            style={{ height: `${Math.random() * 35 + 25}px` }}
                            title="Commercial"
                          />
                          <div
                            className="w-full bg-purple-500"
                            style={{ height: `${Math.random() * 40 + 30}px` }}
                            title="Industrial"
                          />
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{year}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-xs text-gray-400">Residential</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-xs text-gray-400">Commercial</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span className="text-xs text-gray-400">Industrial</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === 3 && (
              <>
                {/* RFP Overview */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Active Procurement Opportunities</h3>
                  <p className="text-gray-300 mb-4">
                    {utility?.name || utility?.utility_name} regularly issues Requests for Proposals (RFPs) for renewable energy, generation capacity, and grid services. Monitor upcoming opportunities to participate in their procurement process.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Typical RFP Cycle</p>
                      <p className="text-xl font-bold text-blue-700">Quarterly</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Avg. Contract Value</p>
                      <p className="text-xl font-bold text-blue-700">$250M - $1B+</p>
                    </div>
                  </div>
                </div>

                {/* Current RFP Opportunities */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Current & Upcoming RFPs</h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: 'Solar + Storage Capacity',
                        type: 'Renewable Energy',
                        capacity: '500 MW Solar + 200 MW/800 MWh Storage',
                        deadline: 'March 15, 2025',
                        status: 'Open',
                        link: (utility?.name || utility?.utility_name)?.toLowerCase().includes('appalachian')
                          ? 'https://www.appalachianpower.com/business/b2b/energy-rfps/2025-RFPS'
                          : 'https://example.com/rfp/solar-storage-2025'
                      },
                      {
                        title: 'Wind Power Purchase Agreement',
                        type: 'Renewable Energy',
                        capacity: '350 MW Wind',
                        deadline: 'April 30, 2025',
                        status: 'Open',
                        link: 'https://example.com/rfp/wind-ppa-2025'
                      },
                      {
                        title: 'Demand Response Program',
                        type: 'Grid Services',
                        capacity: '100 MW Load Reduction',
                        deadline: 'May 20, 2025',
                        status: 'Upcoming',
                        link: 'https://example.com/rfp/demand-response-2025'
                      }
                    ].map((rfp, i) => (
                      <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-white text-lg">{rfp.title}</h4>
                            <p className="text-sm text-gray-400 mt-1">{rfp.type}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            rfp.status === 'Open'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {rfp.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Capacity</p>
                            <p className="text-sm font-medium text-white">{rfp.capacity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Proposal Deadline</p>
                            <p className="text-sm font-medium text-white">{rfp.deadline}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              const params = new URLSearchParams({
                                title: rfp.title,
                                type: rfp.type,
                                deadline: rfp.deadline,
                                status: rfp.status,
                                capacity: rfp.capacity,
                                cod: 'Q4 2026 - Q2 2027',
                                link: rfp.link
                              })
                              window.open(`/rfp?${params.toString()}`, '_blank')
                            }}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Explore RFP
                          </button>
                          <a
                            href={rfp.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Procurement Preferences */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Procurement Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-white">Technology Focus</h4>
                        <p className="text-sm text-gray-400">Solar, wind, battery storage, natural gas (peaking), demand response</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-white">Contract Structure</h4>
                        <p className="text-sm text-gray-400">PPAs (10-25 years), capacity contracts, build-own-transfer, merchant projects</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-white">Geographic Preference</h4>
                        <p className="text-sm text-gray-400">Within service territory or direct interconnection to transmission system</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-white">Sustainability Requirements</h4>
                        <p className="text-sm text-gray-400">Carbon-free or low-carbon resources preferred; renewable energy credits (RECs) included</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Procurement Contact</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">
                      <strong>Department:</strong> Power Supply & Procurement
                    </p>
                    <p className="text-sm text-gray-300">
                      <strong>Email:</strong> procurement@{(utility?.name || utility?.utility_name || 'utility').toLowerCase().replace(/\s+/g, '')}.com
                    </p>
                    <p className="text-sm text-gray-300">
                      <strong>RFP Portal:</strong> <a href="https://example.com/rfp-portal" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">View All Opportunities →</a>
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Section 4: Key Documents */}
            {activeSection === 4 && (
              <>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Regulatory & Planning Documents</h3>
                  <p className="text-gray-400">
                    Access key regulatory filings, integrated resource plans, and financial documents for {utility?.name || utility?.utility_name}.
                  </p>
                </div>

                {/* Document Categories */}
                <div className="space-y-6">
                  {/* Integrated Resource Plan */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">Integrated Resource Plan (IRP)</h4>
                          <p className="text-sm text-gray-400 mt-1">Long-term resource planning and generation strategy</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">2024</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📄 PDF • 15.2 MB</span>
                        <span>Updated: Jan 2024</span>
                      </div>
                      <a
                        href="https://example.com/irp-2024.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download IRP
                      </a>
                    </div>
                  </div>

                  {/* FERC Form 1 */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">FERC Form 1</h4>
                          <p className="text-sm text-gray-400 mt-1">Annual electric utility financial report</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">2023</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📄 PDF • 8.7 MB</span>
                        <span>Filed: April 2024</span>
                      </div>
                      <a
                        href="https://example.com/ferc-form-1-2023.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download FERC Form 1
                      </a>
                    </div>
                  </div>

                  {/* Additional Documents */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Additional Resources</h4>
                    <div className="space-y-3">
                      <a
                        href="https://example.com/rate-case-2024.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors group"
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-300 group-hover:text-white">Rate Case Filing (2024)</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <a
                        href="https://example.com/sustainability-report-2023.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors group"
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-300 group-hover:text-white">Sustainability Report (2023)</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <a
                        href="https://example.com/grid-modernization-plan.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors group"
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-300 group-hover:text-white">Grid Modernization Plan</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}
      </div>
    </div>
  )
}

// Inline Corporate Analysis Component (Timeline-based)
function CorporateAnalysisInline({ corporate, region }: { corporate: any; region: string }) {
  const [activeSection, setActiveSection] = useState(1)

  const sections = [
    { id: 1, title: 'Infrastructure & Facilities' },
    { id: 2, title: 'Energy Consumption' },
    { id: 3, title: 'Sustainability & Future Plans' },
    { id: 4, title: 'Partnership Opportunities' },
    { id: 5, title: 'Key Documents' }
  ]

  return (
    <div className="w-full">
      {/* Section Navigation - Horizontal at Top */}
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg bg-gray-700 p-1 flex-wrap">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-6 py-2.5 rounded-md font-semibold transition-all ${
                  activeSection === section.id
                    ? 'bg-gray-800 text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Section Description */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">
            {sections[activeSection - 1].title}
          </h2>
          <p className="text-gray-400">
            {activeSection === 1 && `Overview of ${corporate.name}'s data center infrastructure, facilities, and operational footprint in the ${region} region.`}
            {activeSection === 2 && `Analysis of ${corporate.name}'s energy consumption patterns, load requirements, and power purchase agreements.`}
            {activeSection === 3 && `${corporate.name}'s sustainability commitments, carbon-free energy goals, and future expansion plans.`}
            {activeSection === 4 && `Partnership opportunities and energy procurement initiatives with ${corporate.name}.`}
            {activeSection === 5 && `Access financial reports, sustainability disclosures, and corporate documents from ${corporate.name}.`}
          </p>
        </div>
      </div>

      {/* Section Content */}
      <div className="w-full">

          {/* Section 1: Infrastructure & Facilities */}
          {activeSection === 1 && (
            <>
              {/* Data Center Locations Map */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Data Center Locations</h3>
                <div className="bg-gray-700 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                  <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-gray-500 font-medium">Interactive Map Placeholder</p>
                      <p className="text-sm text-gray-400 mt-2">Will show {corporate.facilities} data center facilities across {corporate.states?.length} states</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Facilities by State */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Facilities by State</h3>
                <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-600">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">State</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Facilities</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Estimated Load</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Primary Use</th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-700 divide-y divide-gray-600">
                        {corporate.states?.map((state: string, idx: number) => (
                          <tr key={state}>
                            <td className="px-4 py-3 text-sm font-medium text-white">{state}</td>
                            <td className="px-4 py-3 text-sm text-white text-right">{Math.floor(corporate.facilities / corporate.states.length)}</td>
                            <td className="px-4 py-3 text-sm text-white text-right">{Math.round(parseInt(corporate.estimatedLoad) / corporate.states.length)} MW</td>
                            <td className="px-4 py-3 text-sm text-gray-400">Cloud Computing, AI/ML</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Infrastructure Specifications */}
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Infrastructure Specifications</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Data Center Specs</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-400">Tier Classification</span>
                        <span className="font-semibold text-white">Tier III/IV</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-400">Cooling Technology</span>
                        <span className="font-semibold text-white">Advanced Liquid Cooling</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-400">Power Redundancy</span>
                        <span className="font-semibold text-white">N+1 / 2N</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-400">Total IT Capacity</span>
                        <span className="font-semibold text-white">{corporate.estimatedLoad}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Connectivity & Network</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-400">Network Providers</span>
                        <span className="font-semibold text-white">10+ carriers</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-400">Bandwidth Capacity</span>
                        <span className="font-semibold text-white">400G+</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-400">Cloud Interconnect</span>
                        <span className="font-semibold text-white">Direct Connect</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-400">Edge Computing</span>
                        <span className="font-semibold text-white">Enabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Section 2: Energy Consumption */}
          {activeSection === 2 && (
            <>
              {/* Energy Usage Overview */}
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Total Load</p>
                    <p className="text-xl font-bold text-white">{corporate.estimatedLoad}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">PUE Rating</p>
                    <p className="text-xl font-bold text-white">1.15 - 1.25</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Annual Growth</p>
                    <p className="text-xl font-bold text-white">12-18%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Peak Demand</p>
                    <p className="text-xl font-bold text-white">{Math.round(parseInt(corporate.estimatedLoad) * 1.3)} MW</p>
                  </div>
                </div>
              </div>

              {/* Energy Source Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Energy Source Mix</h3>
                <div className="space-y-3">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">Grid Power (Mixed Source)</span>
                      <span className="font-bold text-white">35%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '35%'}}></div>
                    </div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">Renewable PPAs (Solar/Wind)</span>
                      <span className="font-bold text-green-600">45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '45%'}}></div>
                    </div>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">On-site Generation</span>
                      <span className="font-bold text-white">20%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{width: '20%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Power Purchase Agreements */}
              <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-600 border-b border-gray-600">
                  <h3 className="text-lg font-semibold text-white">Active Power Purchase Agreements</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Project Name</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Type</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Capacity</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Sunlight Solar Farm', type: 'Solar', capacity: '200 MW', term: '15 years' },
                      { name: 'Prairie Wind Project', type: 'Wind', capacity: '350 MW', term: '20 years' },
                      { name: 'Mountain Ridge Solar', type: 'Solar', capacity: '150 MW', term: '12 years' },
                    ].map((ppa, i) => (
                      <tr key={i} className="border-t border-gray-600">
                        <td className="px-4 py-2 text-sm text-white">{ppa.name}</td>
                        <td className="px-4 py-2 text-sm text-white">{ppa.type}</td>
                        <td className="px-4 py-2 text-sm text-white">{ppa.capacity}</td>
                        <td className="px-4 py-2 text-sm text-gray-400">{ppa.term}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Section 3: Sustainability & Future Plans */}
          {activeSection === 3 && (
            <>
              {/* Sustainability Goals */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sustainability Commitments</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">100% Renewable Energy Target</p>
                    <p className="text-2xl font-bold text-green-700">2030</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Carbon Neutral Operations</p>
                    <p className="text-2xl font-bold text-green-700">2025</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Water Usage Efficiency</p>
                    <p className="text-2xl font-bold text-green-700">30% reduction</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Renewable Investment</p>
                    <p className="text-2xl font-bold text-green-700">$5B+ committed</p>
                  </div>
                </div>
              </div>

              {/* Planned Expansions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Planned Facility Expansions (2024-2026)</h3>
                <div className="space-y-3">
                  {[
                    { location: 'Northern Virginia', capacity: '500 MW', timeline: 'Q2 2025', investment: '$2.5B' },
                    { location: 'Central Ohio', capacity: '350 MW', timeline: 'Q4 2025', investment: '$1.8B' },
                    { location: 'Western Pennsylvania', capacity: '250 MW', timeline: 'Q1 2026', investment: '$1.2B' },
                  ].map((project, i) => (
                    <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white">{project.location} Expansion</h4>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-400">Capacity: <span className="font-medium text-white">{project.capacity}</span></p>
                            <p className="text-sm text-gray-400">Investment: <span className="font-medium text-white">{project.investment}</span></p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{project.timeline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technology Initiatives */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Emerging Technology Initiatives</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">AI-Driven Energy Optimization</h4>
                      <p className="text-sm text-gray-400 mt-1">Machine learning algorithms to reduce energy consumption by up to 15% through predictive cooling and workload management.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Battery Energy Storage Systems</h4>
                      <p className="text-sm text-gray-400 mt-1">Deploying 500+ MWh of battery storage across facilities to provide grid services and backup power with renewable integration.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Advanced Cooling Technologies</h4>
                      <p className="text-sm text-gray-400 mt-1">Implementing liquid immersion cooling and direct-to-chip cooling for next-gen AI compute infrastructure.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Section 4: Partnership Opportunities */}
          {activeSection === 4 && (
            <>
              {/* Partnership Overview */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Energy Partnership Opportunities</h3>
                <p className="text-gray-300 mb-4">
                  {corporate.name} actively seeks partnerships with energy providers, technology companies, and sustainability consultants to support their data center operations and renewable energy goals.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Partnership Focus</p>
                    <p className="text-xl font-bold text-purple-700">Clean Energy & Grid Services</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Annual Investment</p>
                    <p className="text-xl font-bold text-purple-700">$1B+</p>
                  </div>
                </div>
              </div>

              {/* Current RFP/Partnership Opportunities */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Active Opportunities</h3>
                <div className="space-y-4">
                  {[
                    {
                      title: '24/7 Carbon-Free Energy Supply',
                      type: 'Power Purchase Agreement',
                      details: '1,000+ MW renewable energy with hourly matching',
                      deadline: 'Rolling Applications',
                      status: 'Open',
                      link: 'https://example.com/clean-energy-rfp'
                    },
                    {
                      title: 'Battery Energy Storage Partnership',
                      type: 'Co-Development',
                      details: '500 MW / 2,000 MWh collocated storage',
                      deadline: 'Q2 2025',
                      status: 'Open',
                      link: 'https://example.com/storage-partnership'
                    },
                    {
                      title: 'Grid Flexibility Services',
                      type: 'Demand Response',
                      details: 'Load shifting and demand management program',
                      deadline: 'Ongoing',
                      status: 'Open',
                      link: 'https://example.com/grid-services'
                    }
                  ].map((opp, i) => (
                    <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-white text-lg">{opp.title}</h4>
                          <p className="text-sm text-gray-400 mt-1">{opp.type}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {opp.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Opportunity</p>
                          <p className="text-sm font-medium text-white">{opp.details}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Timeline</p>
                          <p className="text-sm font-medium text-white">{opp.deadline}</p>
                        </div>
                      </div>
                      <a
                        href={opp.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Learn More & Apply
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Partnership Priorities */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Partnership Priorities</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-white">Renewable Energy</h4>
                      <p className="text-sm text-gray-400">Long-term PPAs for wind, solar, and emerging clean energy technologies (geothermal, hydrogen)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-white">Grid Services & Flexibility</h4>
                      <p className="text-sm text-gray-400">Demand response, virtual power plants, behind-the-meter storage solutions</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-white">Innovation & Technology</h4>
                      <p className="text-sm text-gray-400">AI-driven energy optimization, advanced cooling technologies, carbon capture</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-white">Regional Development</h4>
                      <p className="text-sm text-gray-400">Co-locate renewable projects near data centers, support local grid infrastructure</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Partnership Contacts</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <strong>Department:</strong> Energy & Sustainability Partnerships
                  </p>
                  <p className="text-sm text-gray-300">
                    <strong>Email:</strong> energy-partnerships@{corporate.name.toLowerCase().replace(/\s+/g, '')}.com
                  </p>
                  <p className="text-sm text-gray-300">
                    <strong>Partnerships Portal:</strong> <a href="https://example.com/partnerships" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">View All Opportunities →</a>
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Section 5: Key Documents */}
          {activeSection === 5 && (
            <>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-700 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Corporate & Financial Documents</h3>
                <p className="text-gray-400">
                  Access key financial reports, sustainability disclosures, and corporate documents for {corporate.name}.
                </p>
              </div>

              {/* Document Categories */}
              <div className="space-y-6">
                {/* Annual Report */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">Annual Report</h4>
                        <p className="text-sm text-gray-400 mt-1">Comprehensive overview of business operations and financial performance</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">2023</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📄 PDF • 12.4 MB</span>
                      <span>Published: March 2024</span>
                    </div>
                    <a
                      href="https://example.com/annual-report-2023.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Report
                    </a>
                  </div>
                </div>

                {/* 10-K Filing */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">10-K Annual Filing</h4>
                        <p className="text-sm text-gray-400 mt-1">SEC annual report with comprehensive financial statements</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">FY2023</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📄 PDF • 9.8 MB</span>
                      <span>Filed: Feb 2024</span>
                    </div>
                    <a
                      href="https://www.sec.gov/edgar/browse/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download 10-K
                    </a>
                  </div>
                </div>

                {/* ESG & Sustainability */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">ESG & Sustainability Report</h4>
                        <p className="text-sm text-gray-400 mt-1">Environmental, social, and governance initiatives and metrics</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">2023</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📄 PDF • 6.2 MB</span>
                      <span>Published: May 2024</span>
                    </div>
                    <a
                      href="https://example.com/esg-report-2023.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download ESG Report
                    </a>
                  </div>
                </div>

                {/* Additional Documents */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Additional Resources</h4>
                  <div className="space-y-3">
                    <a
                      href="https://example.com/q4-2023-earnings.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">Q4 2023 Earnings Report</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <a
                      href="https://example.com/investor-presentation-2024.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">Investor Presentation 2024</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <a
                      href="https://example.com/data-center-whitepaper.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">Data Center Energy Efficiency Whitepaper</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
      </div>
    </div>
  )
}