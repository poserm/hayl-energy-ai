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
          'Delaware': 'DE', 'Illinois': 'IL', 'Indiana': 'IN', 'Kentucky': 'KY',
          'Maryland': 'MD', 'Michigan': 'MI', 'New Jersey': 'NJ', 'North Carolina': 'NC',
          'Ohio': 'OH', 'Pennsylvania': 'PA', 'Tennessee': 'TN', 'Virginia': 'VA',
          'West Virginia': 'WV', 'District of Columbia': 'DC'
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

  // Fetch state utilities data with debouncing
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    
    const fetchStateUtilities = async () => {
      if (selectedStates.length === 0) {
        setStateUtilities([])
        return
      }

      try {
        setStateUtilitiesLoading(true)
        const stateName = selectedStates[0] // Use first selected state
        
        let url = `/api/utilities/by-state?state=${encodeURIComponent(stateName)}`
        if (selectedOwnershipType) {
          url += `&ownership=${encodeURIComponent(selectedOwnershipType)}`
        }
        
        console.log('=== DASHBOARD: Fetching utilities ===')
        console.log('Selected state:', stateName)
        console.log('API URL:', url)
        
        const response = await fetch(url)
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('API Error Response:', errorData)
          throw new Error(errorData.error || 'Failed to fetch utilities')
        }
        
        const data = await response.json()
        console.log('=== DASHBOARD: API Response ===', data)
        console.log('Number of utilities found:', data.utilities?.length || 0)
        
        setStateUtilities(data.utilities || [])
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
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    
    const fetchCapacityTrends = async () => {
      if (selectedStates.length === 0) {
        setCapacityTrends(null)
        return
      }
      
      setCapacityTrendsLoading(true)
      try {
        const response = await fetch('/api/energy/capacity-trends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ states: selectedStates })
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
  }, [selectedStates])

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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select ISO/RTO Region</h3>
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

          {/* States in Selected Region */}
          {region && regionStatesMap[region] && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                States in {region} ({regionStatesMap[region].length} states)
              </h4>
              <div className="flex flex-wrap gap-2">
                {regionStatesMap[region].map((state) => (
                  <span
                    key={state}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                  >
                    {state}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Latest News Ticker - State Tailored */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-blue-600 px-3 py-1.5 rounded-md flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <span className="text-white text-sm font-semibold">
                {selectedStates.length > 0 ? selectedStates[0] : 'ENERGY'} NEWS
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

        {/* Energy Snapshot Section - Full Width with Integrated Map */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Energy Data (2/3) */}
            <div className="lg:col-span-2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedStates.length > 0 ? `${selectedStates[0]} Energy Snapshot` : 'Energy Snapshot'}
                </h3>
                <p className="text-gray-600 max-w-lg">
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

            {/* Right Side - Integrated Map (1/3) */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Interactive Map
              </h3>
              <div className="h-[600px] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <ISORegionMap
                  selectedState={selectedStates[0] || undefined}
                  onStateClick={(stateName) => {
                    console.log('State clicked:', stateName)
                    updateSelectedStates([stateName])
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Energy Buyers Section */}
        <div className="bg-gray-50 -mx-6 px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {selectedStates.length > 0 ? `${selectedStates[0]} Energy Buyers` : 'Energy Buyers'}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover the largest energy consumers in your selected region, ranked by peak load demand from highest to lowest capacity requirements.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-full bg-gray-200 p-1">
                <button className="px-6 py-2 rounded-full bg-gray-900 text-white font-medium">
                  Utilities
                </button>
                <button className="px-6 py-2 rounded-full text-gray-700 hover:text-gray-900 font-medium">
                  Corporates
                </button>
              </div>
            </div>

            {/* Ownership Type Filter */}
            {selectedStates.length > 0 && (
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

            {/* Utilities Count */}
            {selectedStates.length > 0 && (
              <div className="text-center mb-6">
                <p className="text-gray-600">
                  {stateUtilitiesLoading ? 'Loading utilities...' : `Found ${stateUtilities.length} utilities in ${selectedStates[0]}`}
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
                        onClick={() => setSelectedUtilityForAnalysis(utility)}
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
    <div className="grid grid-cols-12 gap-8">
      {/* Left Side - Timeline and Content */}
      <div className="col-span-12">
        <div className="flex">
          {/* Timeline Navigation */}
          <div className="mr-8">
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
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {sections[activeSection - 1].title}
            </h2>
            <p className="text-gray-600 mb-6">
              Summary of their preferred scenario. Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.
            </p>

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
                {/* Demand Analysis */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Peak Demand</p>
                      <p className="text-xl font-bold text-gray-900">1.2 GW</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Annual Growth</p>
                      <p className="text-xl font-bold text-gray-900">2.1%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Forecast Year</p>
                      <p className="text-xl font-bold text-gray-900">2025</p>
                    </div>
                  </div>
                </div>

                {/* Mock Chart */}
                <div className="h-64 bg-gray-50 rounded-lg p-4 flex items-end justify-between">
                  {[2020, 2021, 2022, 2023, 2024].map((year) => (
                    <div key={year} className="flex flex-col items-center space-y-2">
                      <div 
                        className="w-16 bg-blue-500 rounded-t" 
                        style={{ height: `${Math.random() * 150 + 50}px` }}
                      />
                      <span className="text-xs text-gray-600">{year}</span>
                    </div>
                  ))}
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
    </div>
  )
}