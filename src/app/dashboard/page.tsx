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
import Image from 'next/image'

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
        <tr key={index} className="hover:bg-gray-50">
          <td className="px-4 py-3 text-sm font-medium text-gray-900">
            {plant.plant_name || 'Unknown Plant'}
          </td>
          <td className="px-4 py-3 text-sm text-gray-600">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              plant.technology === 'Natural Gas' ? 'bg-blue-100 text-blue-800' :
              plant.technology === 'Coal' ? 'bg-gray-100 text-gray-800' :
              plant.technology === 'Nuclear' ? 'bg-purple-100 text-purple-800' :
              plant.technology === 'Solar' ? 'bg-yellow-100 text-yellow-800' :
              plant.technology === 'Wind' ? 'bg-green-100 text-green-800' :
              plant.technology === 'Hydro' ? 'bg-cyan-100 text-cyan-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {plant.technology || 'Unknown'}
            </span>
          </td>
          <td className="px-4 py-3 text-sm font-semibold text-right text-blue-600">
            {plant.nameplate_capacity_mw ? parseFloat(plant.nameplate_capacity_mw).toLocaleString() : '0'}
          </td>
          <td className="px-4 py-3 text-sm text-center text-gray-600">
            {plant.operating_year || 'N/A'}
          </td>
          <td className="px-4 py-3 text-sm text-gray-600">
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
      { id: 5, name: 'Oracle Cloud', type: 'Hyperscale', estimatedLoad: '600 MW', states: ['Virginia', 'Pennsylvania'], facilities: 15 }
    ],
    'ERCOT': [
      { id: 6, name: 'Amazon Web Services', type: 'Hyperscale', estimatedLoad: '1200 MW', states: ['Texas'], facilities: 30 },
      { id: 7, name: 'Microsoft Azure', type: 'Hyperscale', estimatedLoad: '900 MW', states: ['Texas'], facilities: 20 },
      { id: 8, name: 'Google', type: 'Hyperscale', estimatedLoad: '700 MW', states: ['Texas'], facilities: 15 },
      { id: 9, name: 'Meta (Facebook)', type: 'Hyperscale', estimatedLoad: '500 MW', states: ['Texas'], facilities: 10 },
      { id: 10, name: 'Tesla', type: 'Industrial', estimatedLoad: '400 MW', states: ['Texas'], facilities: 5 }
    ],
    'CAISO': [
      { id: 11, name: 'Google', type: 'Hyperscale', estimatedLoad: '2500 MW', states: ['California'], facilities: 45 },
      { id: 12, name: 'Apple', type: 'Hyperscale', estimatedLoad: '1000 MW', states: ['California', 'Nevada'], facilities: 18 },
      { id: 13, name: 'Amazon Web Services', type: 'Hyperscale', estimatedLoad: '1400 MW', states: ['California'], facilities: 25 },
      { id: 14, name: 'Meta (Facebook)', type: 'Hyperscale', estimatedLoad: '900 MW', states: ['California'], facilities: 16 },
      { id: 15, name: 'Microsoft Azure', type: 'Hyperscale', estimatedLoad: '800 MW', states: ['California'], facilities: 14 }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg font-medium text-gray-700">Loading dashboard...</span>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <Image
                  src="/hayl-logo-new.svg"
                  alt="Hayl Energy AI"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <h1 className="text-2xl font-bold text-gray-900">HAYL ENERGY AI</h1>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <div className="flex items-center space-x-6">
              <nav className="flex items-center space-x-6 text-sm">
                <a href="#" className="font-medium text-gray-700 hover:text-gray-900">Home</a>
                <a href="#" className="font-medium text-gray-700 hover:text-gray-900">Explore</a>
                <a href="#" className="font-medium text-gray-700 hover:text-gray-900">Connections</a>
                <a href="#" className="font-medium text-gray-700 hover:text-gray-900">Settings</a>
              </nav>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100">
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

        {/* Header Section - Minimalist Design */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Welcome, {user.name || user.email.split('@')[0]}</h2>
        </div>

        {/* Auto-loading indicator with better styling */}
        {dashboardData.loading && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
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
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
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
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                {regionName}
              </button>
            ))}
          </div>

        </div>

        {/* Latest News Ticker - State Tailored */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6 overflow-hidden">
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
                    <span className="text-gray-900 font-medium text-sm whitespace-nowrap">
                      {news.title}
                    </span>
                    <span className="text-gray-600 text-xs whitespace-nowrap">
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
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {region} Energy Snapshot {selectedStateFilter && `- ${selectedStateFilter}`}
                </h3>
                <p className="text-gray-600">
                  Real-time supply and demand analytics with the latest market intelligence and regulatory updates for informed energy decision-making.
                </p>
                <div className="text-3xl font-bold text-blue-600 mt-4">
                  {Math.round(metrics.totalCapacity / 1000)} GW
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Download
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Compare
                </button>
              </div>
            </div>

            {/* States in Selected Region - Selectable Pills */}
            {region && regionStatesMap[region] && (
              <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
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

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-gray-200 mb-6">
              <button className="px-4 py-2 text-sm font-medium text-gray-900 border-b-2 border-blue-500">
                Power supply
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Power demand
              </button>
            </div>

            {/* Energy breakdown by technology */}
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
                      <span className="text-sm text-gray-700">{tech.technology}:</span>
                      <span className="text-sm font-semibold text-gray-900">
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
                      <span className="text-sm text-gray-700">{tech}:</span>
                      <span className="text-sm font-semibold text-gray-900">
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

            {/* Total capacity */}
            <div className="text-xl font-semibold text-gray-900 mb-4">
              Total: {capacityTrends ? Math.round(capacityTrends.totalCapacity / 1000) : Math.round(metrics.totalCapacity / 1000)} GW
            </div>

            {/* Stacked Bar Chart */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Capacity Trends</h4>
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
                                <div key={i} className="text-xs text-gray-600">
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
                                      className="relative w-12 border border-gray-200"
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
                                    <span className="text-sm font-medium text-gray-700">{yearData.year}</span>
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

            {/* Sources */}
            <div className="text-sm text-gray-600 mb-4">
              Sources: EIA.gov, State Energy Data System
            </div>

            {/* Explore more button */}
            <button className="w-full py-3 text-center text-blue-600 font-medium border border-blue-600 rounded-lg hover:bg-blue-50">
              Explore more
            </button>
        </div>

        {/* Energy Buyers Section */}
        <div className="bg-gray-50 -mx-6 px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {region} Energy Buyers
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover the largest energy consumers in the {region} region across {selectedStates.length} states, ranked by peak load demand from highest to lowest capacity requirements.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-full bg-gray-200 p-1">
                <button
                  onClick={() => setEnergyBuyersTab('utilities')}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    energyBuyersTab === 'utilities'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Utilities
                </button>
                <button
                  onClick={() => setEnergyBuyersTab('corporates')}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    energyBuyersTab === 'corporates'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Corporates
                </button>
              </div>
            </div>

            {/* Ownership Type Filter - Only show for Utilities tab */}
            {energyBuyersTab === 'utilities' && selectedStates.length > 0 && (
              <div className="flex justify-center mb-6">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedOwnershipType(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedOwnershipType === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setSelectedOwnershipType('Investor Owned')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedOwnershipType === 'Investor Owned'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    INVESTOR OWNED
                  </button>
                  <button
                    onClick={() => setSelectedOwnershipType('Cooperative')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedOwnershipType === 'Cooperative'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    COOPERATIVE
                  </button>
                  <button
                    onClick={() => setSelectedOwnershipType('Municipal')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedOwnershipType === 'Municipal'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    MUNICIPAL
                  </button>
                  <button
                    onClick={() => setSelectedOwnershipType('Retail Power Marketer')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedOwnershipType === 'Retail Power Marketer'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                    <p className="text-gray-600">
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
                    <p className="text-gray-600">Loading utility companies...</p>
                  </div>
                </div>
              ) : stateUtilities && stateUtilities.length > 0 ? (
                <div className="relative">
                  {/* Horizontal Scrollable Tiles */}
                  <div className="flex overflow-x-auto space-x-4 pb-4 scroll-smooth">
                    {stateUtilities.map((utility, index) => (
                      <div
                        key={utility.id || index}
                        onClick={() => {
                          setSelectedUtilityForAnalysis(utility)
                          setSelectedCorporate(null) // Clear corporate selection
                        }}
                        className={`flex-shrink-0 w-72 bg-white rounded-lg shadow-md border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                          selectedUtilityForAnalysis?.id === utility.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">
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
                                  <span key={state} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                    {state}
                                  </span>
                                ))}
                                {utility.states.length > 3 && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
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
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {selectedUtilityForAnalysis?.id === utility.id ? '✓ Selected' : 'Click to Select'}
                          </div>
                        </div>
                      </div>
                    ))}
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No States Selected</h3>
                    <p className="text-gray-600">Select states above to view energy buyers</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Utilities Found</h3>
                    <p className="text-gray-600">No utility companies found for the selected state</p>
                    <p className="text-sm text-gray-500 mt-2">Try selecting different states or check back later</p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <button
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
                disabled={!selectedUtilityForAnalysis}
                onClick={() => {
                  if (selectedUtilityForAnalysis) {
                    console.log('Analyzing selected utility:', selectedUtilityForAnalysis)
                    // Scroll to analysis section
                    const analysisSection = document.getElementById('utility-analysis-section')
                    if (analysisSection) {
                      analysisSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      })
                    }
                  } else {
                    alert('Please select a utility first by clicking on one of the tiles above.')
                  }
                }}
              >
                {selectedUtilityForAnalysis ? `ANALYZE ${(selectedUtilityForAnalysis.name || selectedUtilityForAnalysis.utility_name || 'UTILITY').toUpperCase()}` : 'SELECT A UTILITY FIRST'}
              </button>
            </div>
              </>
            )}

            {/* Corporates Tab Content */}
            {energyBuyersTab === 'corporates' && (
              <>
                {/* Corporates Count */}
                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    {corporatesByRegion[region]?.length || 0} major tech companies with data center facilities in {region} region
                  </p>
                </div>

                {/* Corporates Grid */}
                <div className="mb-10">
                  <div className="relative">
                    {/* Horizontal Scrollable Tiles */}
                    <div className="flex overflow-x-auto space-x-4 pb-4 scroll-smooth">
                      {corporatesByRegion[region]?.map((corporate, index) => (
                        <div
                          key={corporate.id || index}
                          onClick={() => {
                            setSelectedCorporate(corporate)
                            setSelectedUtilityForAnalysis(null) // Clear utility selection
                          }}
                          className={`flex-shrink-0 w-72 bg-white rounded-lg shadow-md border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                            selectedCorporate?.id === corporate.id
                              ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-center">
                            <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                              {corporate.name}
                            </h4>

                            {/* Company Type Badge */}
                            <div className="mb-3">
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                corporate.type === 'Hyperscale' ? 'bg-blue-100 text-blue-700' :
                                corporate.type === 'Colocation' ? 'bg-green-100 text-green-700' :
                                corporate.type === 'Developer' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {corporate.type}
                              </span>
                            </div>

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
                                    <span key={state} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                      {state}
                                    </span>
                                  ))}
                                  {corporate.states.length > 3 && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                      +{corporate.states.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Estimated Load */}
                            <div className="mb-3 px-3 py-2 bg-green-50 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Estimated Load</p>
                              <p className="text-lg font-bold text-green-600">
                                {corporate.estimatedLoad}
                              </p>
                            </div>

                            {/* Facilities Count */}
                            <div className="text-sm text-gray-500 mb-3">
                              {corporate.facilities} facilities
                            </div>

                            {/* Selection Indicator */}
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              selectedCorporate?.id === corporate.id
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {selectedCorporate?.id === corporate.id ? '✓ Selected' : 'Click to Select'}
                            </div>
                          </div>
                        </div>
                      ))}
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

                {/* CTA Button */}
                <div className="text-center">
                  <button
                    className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
                    disabled={!selectedCorporate}
                    onClick={() => {
                      if (selectedCorporate) {
                        console.log('Analyzing selected corporate:', selectedCorporate)
                        // Scroll to analysis section
                        const analysisSection = document.getElementById('corporate-analysis-section')
                        if (analysisSection) {
                          analysisSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                          })
                        }
                      } else {
                        alert('Please select a company first by clicking on one of the tiles above.')
                      }
                    }}
                  >
                    {selectedCorporate ? `VIEW ${selectedCorporate.name.toUpperCase()} PROFILE` : 'SELECT A COMPANY FIRST'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Utility Analysis Section - Wireframe Format */}
        {selectedUtilityForAnalysis && (
          <section id="utility-analysis-section" className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-6">
              {/* Header */}
              <div className="bg-gray-900 text-white rounded-2xl mb-8">
                <div className="px-8 py-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                          <span className="text-gray-900 font-bold text-lg">
                            {(selectedUtilityForAnalysis.name || selectedUtilityForAnalysis.utility_name || 'UN').substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold">{selectedUtilityForAnalysis.name || selectedUtilityForAnalysis.utility_name}</h1>
                          <p className="text-gray-300">{selectedUtilityForAnalysis.state}'s electric utility</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 text-sm font-medium text-white border border-gray-600 rounded-lg hover:bg-gray-800">
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Compare
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-white border border-gray-600 rounded-lg hover:bg-gray-800">
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

              {/* Main Analysis Content */}
              <UtilityAnalysisInline utility={selectedUtilityForAnalysis} />
            </div>
          </section>
        )}

        {/* Corporate Analysis Section */}
        {selectedCorporate && (
          <section id="corporate-analysis-section" className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-6">
              {/* Header */}
              <div className="bg-gray-900 text-white rounded-2xl mb-8">
                <div className="px-8 py-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                          <span className="text-gray-900 font-bold text-lg">
                            {selectedCorporate.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold">{selectedCorporate.name}</h1>
                          <p className="text-gray-300">{selectedCorporate.type} Data Center Operator | {selectedCorporate.states?.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 text-sm font-medium text-white border border-gray-600 rounded-lg hover:bg-gray-800">
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Compare
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-white border border-gray-600 rounded-lg hover:bg-gray-800">
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
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Plant Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Utility</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Technology</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Capacity (MW)</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">State</th>
            </tr>
          </thead>
          <tbody>
            {generators.slice(0, tableShowMore.visibleCount).map((generator, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">
                  {generator.plantName}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {generator.utilityName}
                </td>
                <td className="py-3 px-4 text-gray-600">
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
    { id: 1, title: 'Existing Portfolio' },
    { id: 2, title: 'Energy demand' },
    { id: 3, title: 'Energy Supply' }
  ]

  return (
    <div className="w-full">
      {/* Main Content Container */}
      <div className="flex gap-8">
        {/* Timeline Navigation */}
        <div className="flex-shrink-0">
          <div className="relative">
            {sections.map((section, index) => (
              <div key={section.id} className="flex items-center mb-8">
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors ${
                    activeSection === section.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                  }`}
                >
                  {String(section.id).padStart(2, '0')}
                </button>
                {index < sections.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section Content */}
        <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {sections[activeSection - 1].title}
            </h2>
            <p className="text-gray-600 mb-6">
              Summary of their preferred scenario. Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.
            </p>

            {/* Facilities Map */}
            {utility && activeSection === 1 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Facility Locations</h3>
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
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
            {utility && activeSection === 1 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Power Plant Portfolio</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plant Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technology</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity (MW)</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Operating Year</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <PlantsTableRows utility={utility} />
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {activeSection === 1 && (
              <div className="mt-6">
                <p className="text-sm text-gray-600 text-center">
                  The table above displays comprehensive power plant data including technology types, operational capacity, and geographic location. 
                  Data sourced from EIA.gov and state regulatory filings.
                </p>
              </div>
            )}

            {activeSection === 2 && (
              <>
                {/* Demand Overview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Customers</p>
                      <p className="text-xl font-bold text-gray-900">2.4M</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Annual Sales</p>
                      <p className="text-xl font-bold text-gray-900">45,600 GWh</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Peak Demand</p>
                      <p className="text-xl font-bold text-gray-900">8.5 GW</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Load Factor</p>
                      <p className="text-xl font-bold text-gray-900">61%</p>
                    </div>
                  </div>
                </div>

                {/* Customer Class Breakdown */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Load by Customer Class</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Class</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Sales (GWh)</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Usage per Customer</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Residential</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">2,150,000</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">15,960</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">35%</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">7,420 kWh/yr</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Commercial</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">245,000</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">13,680</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">30%</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">55,840 kWh/yr</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Industrial</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">5,200</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">15,960</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">35%</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">3.07 GWh/yr</td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-gray-100">
                        <tr>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">2,400,200</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">45,600</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">100%</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Load Profile by Customer Class */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Class Contribution</h3>
                  <div className="space-y-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span className="font-medium text-gray-900">Residential</span>
                        </div>
                        <span className="font-bold text-gray-900">35%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-500 h-3 rounded-full" style={{width: '35%'}}></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        2.15M customers | 15,960 GWh annual sales
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span className="font-medium text-gray-900">Commercial</span>
                        </div>
                        <span className="font-bold text-gray-900">30%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-green-500 h-3 rounded-full" style={{width: '30%'}}></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        245K customers | 13,680 GWh annual sales
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-purple-500 rounded"></div>
                          <span className="font-medium text-gray-900">Industrial</span>
                        </div>
                        <span className="font-bold text-gray-900">35%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-purple-500 h-3 rounded-full" style={{width: '35%'}}></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        5.2K customers | 15,960 GWh annual sales
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demand Trends */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Demand Growth by Class</h3>
                  <div className="h-64 bg-white rounded-lg p-4 flex items-end justify-between border border-gray-200">
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
                        <span className="text-xs text-gray-600 font-medium">{year}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-xs text-gray-600">Residential</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-xs text-gray-600">Commercial</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span className="text-xs text-gray-600">Industrial</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === 3 && (
              <>
                {/* Supply Analysis */}
                <div className="space-y-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Generation Sources</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Primary Source:</span>
                        <span className="ml-2 font-medium">Natural Gas</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Renewable %:</span>
                        <span className="ml-2 font-medium">15%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Projects Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Project</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Timeline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(4)].map((_, i) => (
                        <tr key={i} className="border-t border-gray-200">
                          <td className="px-4 py-2 text-sm text-gray-900">Project {i + 1}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">Solar</td>
                          <td className="px-4 py-2 text-sm text-green-600">Planned</td>
                          <td className="px-4 py-2 text-sm text-gray-900">2025</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
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
    { id: 3, title: 'Sustainability & Future Plans' }
  ]

  return (
    <div className="w-full">
      {/* Main Content Container */}
      <div className="flex gap-8">
        {/* Timeline Navigation */}
        <div className="flex-shrink-0">
          <div className="relative">
            {sections.map((section, index) => (
              <div key={section.id} className="flex items-center mb-8">
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors ${
                    activeSection === section.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                  }`}
                >
                  {String(section.id).padStart(2, '0')}
                </button>
                {index < sections.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section Content */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {sections[activeSection - 1].title}
          </h2>
          <p className="text-gray-600 mb-6">
            Comprehensive analysis of {corporate.name}'s data center operations and energy strategy in the {region} region.
          </p>

          {/* Section 1: Infrastructure & Facilities */}
          {activeSection === 1 && (
            <>
              {/* Data Center Locations Map */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Center Locations</h3>
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Facilities by State</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Facilities</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Load</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Use</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {corporate.states?.map((state: string, idx: number) => (
                          <tr key={state}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{state}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{Math.floor(corporate.facilities / corporate.states.length)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{Math.round(parseInt(corporate.estimatedLoad) / corporate.states.length)} MW</td>
                            <td className="px-4 py-3 text-sm text-gray-600">Cloud Computing, AI/ML</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Infrastructure Specifications */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Infrastructure Specifications</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Center Specs</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-600">Tier Classification</span>
                        <span className="font-semibold text-gray-900">Tier III/IV</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-600">Cooling Technology</span>
                        <span className="font-semibold text-gray-900">Advanced Liquid Cooling</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-600">Power Redundancy</span>
                        <span className="font-semibold text-gray-900">N+1 / 2N</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Total IT Capacity</span>
                        <span className="font-semibold text-gray-900">{corporate.estimatedLoad}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Connectivity & Network</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-600">Network Providers</span>
                        <span className="font-semibold text-gray-900">10+ carriers</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-600">Bandwidth Capacity</span>
                        <span className="font-semibold text-gray-900">400G+</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-600">Cloud Interconnect</span>
                        <span className="font-semibold text-gray-900">Direct Connect</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Edge Computing</span>
                        <span className="font-semibold text-gray-900">Enabled</span>
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
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Load</p>
                    <p className="text-xl font-bold text-gray-900">{corporate.estimatedLoad}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">PUE Rating</p>
                    <p className="text-xl font-bold text-gray-900">1.15 - 1.25</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Annual Growth</p>
                    <p className="text-xl font-bold text-gray-900">12-18%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Peak Demand</p>
                    <p className="text-xl font-bold text-gray-900">{Math.round(parseInt(corporate.estimatedLoad) * 1.3)} MW</p>
                  </div>
                </div>
              </div>

              {/* Energy Source Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Energy Source Mix</h3>
                <div className="space-y-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">Grid Power (Mixed Source)</span>
                      <span className="font-bold text-gray-900">35%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '35%'}}></div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">Renewable PPAs (Solar/Wind)</span>
                      <span className="font-bold text-green-600">45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '45%'}}></div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">On-site Generation</span>
                      <span className="font-bold text-gray-900">20%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{width: '20%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Power Purchase Agreements */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Active Power Purchase Agreements</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Project Name</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Capacity</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Sunlight Solar Farm', type: 'Solar', capacity: '200 MW', term: '15 years' },
                      { name: 'Prairie Wind Project', type: 'Wind', capacity: '350 MW', term: '20 years' },
                      { name: 'Mountain Ridge Solar', type: 'Solar', capacity: '150 MW', term: '12 years' },
                    ].map((ppa, i) => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="px-4 py-2 text-sm text-gray-900">{ppa.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{ppa.type}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{ppa.capacity}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{ppa.term}</td>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sustainability Commitments</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-700 mb-1">100% Renewable Energy Target</p>
                    <p className="text-2xl font-bold text-green-700">2030</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Carbon Neutral Operations</p>
                    <p className="text-2xl font-bold text-green-700">2025</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Water Usage Efficiency</p>
                    <p className="text-2xl font-bold text-green-700">30% reduction</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Renewable Investment</p>
                    <p className="text-2xl font-bold text-green-700">$5B+ committed</p>
                  </div>
                </div>
              </div>

              {/* Planned Expansions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Planned Facility Expansions (2024-2026)</h3>
                <div className="space-y-3">
                  {[
                    { location: 'Northern Virginia', capacity: '500 MW', timeline: 'Q2 2025', investment: '$2.5B' },
                    { location: 'Central Ohio', capacity: '350 MW', timeline: 'Q4 2025', investment: '$1.8B' },
                    { location: 'Western Pennsylvania', capacity: '250 MW', timeline: 'Q1 2026', investment: '$1.2B' },
                  ].map((project, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{project.location} Expansion</h4>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600">Capacity: <span className="font-medium text-gray-900">{project.capacity}</span></p>
                            <p className="text-sm text-gray-600">Investment: <span className="font-medium text-gray-900">{project.investment}</span></p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{project.timeline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technology Initiatives */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emerging Technology Initiatives</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">AI-Driven Energy Optimization</h4>
                      <p className="text-sm text-gray-600 mt-1">Machine learning algorithms to reduce energy consumption by up to 15% through predictive cooling and workload management.</p>
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
                      <h4 className="font-medium text-gray-900">Battery Energy Storage Systems</h4>
                      <p className="text-sm text-gray-600 mt-1">Deploying 500+ MWh of battery storage across facilities to provide grid services and backup power with renewable integration.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Advanced Cooling Technologies</h4>
                      <p className="text-sm text-gray-600 mt-1">Implementing liquid immersion cooling and direct-to-chip cooling for next-gen AI compute infrastructure.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}