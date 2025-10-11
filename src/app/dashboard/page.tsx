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
import dynamic from 'next/dynamic'

// Dynamically import MapboxMap to avoid SSR issues
const MapboxMap = dynamic(() => import('@/components/MapboxMap'), { ssr: false })
// Dynamically import OpportunitiesSection
const OpportunitiesSection = dynamic(() => import('@/components/OpportunitiesSection'), { ssr: false })
// Dynamically import EIA Supply Charts
const EIASupplyCharts = dynamic(() => import('@/components/EIASupplyCharts'), { ssr: false })
// Dynamically import CustomerClassPieChart
const CustomerClassPieChart = dynamic(() => import('@/components/CustomerClassPieChart'), { ssr: false })

// Plants Table Rows Component
function PlantsTableRows({ plants, loading, error }: { plants: any[], loading?: boolean, error?: string | null }) {
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
  const [eiaGenerators, setEiaGenerators] = useState<any[]>([])
  const [eiaLoading, setEiaLoading] = useState(false)
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
  const [buyerViewMode, setbuyerViewMode] = useState<'all' | 'utilities' | 'corporates'>('all')
  const [buyerSortBy, setBuyerSortBy] = useState<'load' | 'name' | 'recent'>('load')
  const [selectedCorporate, setSelectedCorporate] = useState<any>(null)
  const [selectedStateFilter, setSelectedStateFilter] = useState<string | null>(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showPowerPlantMapModal, setShowPowerPlantMapModal] = useState(false)
  const [showDataCenterMapModal, setShowDataCenterMapModal] = useState(false)
  const [snapshotTab, setSnapshotTab] = useState<'supply' | 'demand'>('supply')
  const [supplyMetric, setSupplyMetric] = useState<'capacity' | 'generation'>('capacity')
  const [supplyExpanded, setSupplyExpanded] = useState(false)
  const [demandExpanded, setDemandExpanded] = useState(false)
  const [demandDriversExpanded, setDemandDriversExpanded] = useState(false)
  const [pricesExpanded, setPricesExpanded] = useState(false)
  const [newsExpanded, setNewsExpanded] = useState(false)
  const [selectedTechnology, setSelectedTechnology] = useState<string>('All Technologies')
  const [supplyView, setSupplyView] = useState<'current' | 'pipeline' | 'retirements'>('current')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{text: string, sender: 'user' | 'assistant'}>>([
    { text: `Hello ${user?.name || 'there'}, how can I help you today?`, sender: 'assistant' }
  ])

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

  // Fetch EIA generators for map display
  useEffect(() => {
    const fetchEIAGenerators = async () => {
      setEiaLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('region', region)
        if (selectedStateFilter) {
          // Map full state name to abbreviation
          const stateMap: { [key: string]: string } = {
            'Virginia': 'VA', 'Maryland': 'MD', 'Pennsylvania': 'PA',
            'Delaware': 'DE', 'New Jersey': 'NJ', 'West Virginia': 'WV',
            'North Carolina': 'NC', 'Ohio': 'OH', 'Illinois': 'IL',
            'Indiana': 'IN', 'Kentucky': 'KY', 'Michigan': 'MI',
            'Tennessee': 'TN', 'District of Columbia': 'DC',
            'California': 'CA', 'Texas': 'TX', 'New York': 'NY'
          }
          const stateCode = stateMap[selectedStateFilter] || selectedStateFilter
          params.append('state', stateCode)
        }
        if (selectedTechnology !== 'All Technologies') {
          params.append('technology', selectedTechnology)
        }

        const url = `/api/eia/generators?${params.toString()}`
        console.log('[Dashboard] ========================================')
        console.log('[Dashboard] Fetching EIA generators')
        console.log('[Dashboard] URL:', url)
        console.log('[Dashboard] Region:', region)
        console.log('[Dashboard] State Filter:', selectedStateFilter)
        console.log('[Dashboard] Technology:', selectedTechnology)
        console.log('[Dashboard] ========================================')

        const response = await fetch(url)
        console.log('[Dashboard] Response status:', response.status)
        console.log('[Dashboard] Response OK:', response.ok)

        const data = await response.json()
        console.log('[Dashboard] Response data:', {
          success: data.success,
          generatorsCount: data.generators?.length || 0,
          total: data.total,
          error: data.error,
          debug: data.debug
        })

        if (data.success) {
          // Transform EIA data to Plant format for MapboxMap
          const plants = data.generators.map((gen: any) => ({
            plant_name: gen.plantName,
            technology: gen.technology,
            nameplate_capacity_mw: gen.capacity,
            plant_state: gen.state,
            latitude: gen.latitude,
            longitude: gen.longitude,
            entity_name: gen.entityName,
            generator_count: gen.generatorCount
          }))
          console.log('[Dashboard] Transformed plants:', plants.length)
          console.log('[Dashboard] Sample plant:', plants[0])
          setEiaGenerators(plants)
        } else {
          console.error('[Dashboard] API returned success: false')
          console.error('[Dashboard] Error:', data.error)
          console.error('[Dashboard] Debug info:', data.debug)
          setEiaGenerators([])
        }
      } catch (error) {
        console.error('[Dashboard] ========================================')
        console.error('[Dashboard] Exception during fetch:')
        console.error('[Dashboard] Error:', error)
        console.error('[Dashboard] Error type:', error instanceof Error ? error.constructor.name : typeof error)
        console.error('[Dashboard] Error message:', error instanceof Error ? error.message : String(error))
        console.error('[Dashboard] ========================================')
        setEiaGenerators([])
      } finally {
        setEiaLoading(false)
      }
    }

    fetchEIAGenerators()
  }, [region, selectedStateFilter, selectedTechnology])

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

        {/* Latest News - Collapsible */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 mb-6 overflow-hidden">
          <button
            onClick={() => setNewsExpanded(!newsExpanded)}
            className="w-full p-5 flex items-center justify-between hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <h3 className="text-lg font-bold text-white">Market News</h3>
              <span className="text-xs text-gray-400 bg-blue-600/20 px-2 py-1 rounded">3 Latest</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${newsExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {newsExpanded && (
            <div className="px-5 pb-5 space-y-3 border-t border-gray-700 pt-4">
              {[
                {
                  company: 'Dominion Energy',
                  state: 'VA',
                  headline: 'Announces $3.2B Offshore Wind Investment',
                  date: 'Dec 15, 2024',
                  time: '2h ago'
                },
                {
                  company: 'PJM Interconnection',
                  state: 'Regional',
                  headline: 'Capacity Auction Clears at Record High Prices',
                  date: 'Dec 15, 2024',
                  time: '4h ago'
                },
                {
                  company: 'AES Corporation',
                  state: 'VA',
                  headline: '500 MW Battery Storage Project Approved',
                  date: 'Dec 14, 2024',
                  time: '1d ago'
                }
              ].map((news, index) => (
                <div
                  key={index}
                  className="bg-gray-900 hover:bg-gray-850 p-4 rounded-lg cursor-pointer transition-all border border-gray-700 hover:border-blue-500 group"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-400 font-bold text-base">{news.company}</span>
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs font-semibold rounded">
                          {news.state}
                        </span>
                      </div>
                      <h4 className="text-white text-sm font-medium leading-relaxed group-hover:text-blue-300 transition-colors">
                        {news.headline}
                      </h4>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-gray-400 text-xs font-medium">{news.date}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{news.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Power Market Overview - 3 Pillars */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-xl border border-gray-700">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                    {selectedStateFilter || region} Power Market Overview
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Comprehensive market intelligence across supply, demand, and pricing
                  </p>
                </div>
                <button
                  onClick={() => setShowMapModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600 text-gray-300 hover:text-white rounded-xl transition-all border border-gray-600 hover:border-gray-500"
                  title={
                    supplyExpanded ? `View ${selectedStateFilter || region} Power Supply Map` :
                    demandExpanded ? `View ${selectedStateFilter || region} Demand Map` :
                    pricesExpanded ? `View ${selectedStateFilter || region} Pricing Map` :
                    `View ${selectedStateFilter || region} Regional Map`
                  }
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-sm font-medium">
                    {supplyExpanded ? 'Supply Map' :
                     demandExpanded ? 'Demand Map' :
                     pricesExpanded ? 'Pricing Map' :
                     'View Map'}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Hint */}
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 px-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Click any pillar to view detailed market analytics</span>
            </div>

            {/* Hero Metrics - 3 Pillars Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* SUPPLY Pillar */}
              <button
                onClick={() => {
                  setSupplyExpanded(!supplyExpanded)
                  setDemandExpanded(false)
                  setPricesExpanded(false)
                }}
                className={`rounded-xl p-6 transition-all text-left group ${
                  supplyExpanded
                    ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-2 border-blue-400 shadow-xl shadow-blue-500/20 scale-[1.02]'
                    : demandExpanded || pricesExpanded
                    ? 'bg-gradient-to-br from-gray-900/30 to-gray-800/30 border border-gray-600/30 opacity-50 hover:opacity-70'
                    : 'bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/10'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/20 group-hover:bg-blue-500/30 rounded-lg transition-colors">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Supply</h4>
                  </div>
                  <span className="text-xs text-green-400 font-medium">↑ 8.3%</span>
                </div>
                <div className="text-4xl font-bold text-white mb-1">
                  {capacityTrends ? Math.round(capacityTrends.totalCapacity / 1000) : Math.round(metrics.totalCapacity / 1000)} GW
                </div>
                <p className="text-xs text-gray-400 mb-3">Total Installed Capacity</p>

                {/* Mini Trend Chart - Sparkline */}
                <div className="h-8 mb-3">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <polyline
                      points="0,25 20,22 40,18 60,20 80,15 100,12"
                      fill="none"
                      stroke="rgba(96, 165, 250, 0.5)"
                      strokeWidth="2"
                    />
                    <polyline
                      points="0,25 20,22 40,18 60,20 80,15 100,12 100,30 0,30"
                      fill="url(#supplyGradient)"
                      stroke="none"
                    />
                    <defs>
                      <linearGradient id="supplyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(96, 165, 250, 0.3)" />
                        <stop offset="100%" stopColor="rgba(96, 165, 250, 0.0)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="pt-3 border-t border-blue-500/20 flex justify-between text-xs">
                  <div>
                    <p className="text-gray-400">Renewable</p>
                    <p className="text-white font-semibold">15.2 GW</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Pipeline</p>
                    <p className="text-white font-semibold">12.8 GW</p>
                  </div>
                  <div className="flex items-center text-blue-400 group-hover:text-blue-300">
                    <svg className={`w-4 h-4 transition-transform ${supplyExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* DEMAND Pillar */}
              <button
                onClick={() => {
                  setDemandExpanded(!demandExpanded)
                  setSupplyExpanded(false)
                  setPricesExpanded(false)
                }}
                className={`rounded-xl p-6 transition-all text-left group ${
                  demandExpanded
                    ? 'bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-2 border-purple-400 shadow-xl shadow-purple-500/20 scale-[1.02]'
                    : supplyExpanded || pricesExpanded
                    ? 'bg-gradient-to-br from-gray-900/30 to-gray-800/30 border border-gray-600/30 opacity-50 hover:opacity-70'
                    : 'bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/20 group-hover:bg-purple-500/30 rounded-lg transition-colors">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide">Demand</h4>
                  </div>
                  <span className="text-xs text-green-400 font-medium">↑ 3.2%</span>
                </div>
                <div className="text-4xl font-bold text-white mb-1">68.5 GW</div>
                <p className="text-xs text-gray-400 mb-3">Peak Load (Summer '24)</p>

                {/* Mini Trend Chart - Bar Chart Style */}
                <div className="h-8 mb-3 flex items-end justify-between gap-1">
                  {[45, 48, 52, 58, 62, 68, 65, 55, 50, 48, 52, 56].map((val, i) => (
                    <div key={i} className="flex-1 bg-purple-500/30 rounded-t transition-all group-hover:bg-purple-500/40" style={{ height: `${(val / 70) * 100}%` }}></div>
                  ))}
                </div>

                <div className="pt-3 border-t border-purple-500/20 flex justify-between text-xs">
                  <div>
                    <p className="text-gray-400">Average</p>
                    <p className="text-white font-semibold">42.3 GW</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Growth</p>
                    <p className="text-white font-semibold">+3.2%</p>
                  </div>
                  <div className="flex items-center text-purple-400 group-hover:text-purple-300">
                    <svg className={`w-4 h-4 transition-transform ${demandExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* PRICES Pillar */}
              <button
                onClick={() => {
                  setPricesExpanded(!pricesExpanded)
                  setSupplyExpanded(false)
                  setDemandExpanded(false)
                }}
                className={`rounded-xl p-6 transition-all text-left group ${
                  pricesExpanded
                    ? 'bg-gradient-to-br from-emerald-900/50 to-emerald-800/50 border-2 border-emerald-400 shadow-xl shadow-emerald-500/20 scale-[1.02]'
                    : supplyExpanded || demandExpanded
                    ? 'bg-gradient-to-br from-gray-900/30 to-gray-800/30 border border-gray-600/30 opacity-50 hover:opacity-70'
                    : 'bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 border border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/20 group-hover:bg-emerald-500/30 rounded-lg transition-colors">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-emerald-300 uppercase tracking-wide">Prices</h4>
                  </div>
                  <span className="text-xs text-red-400 font-medium">↓ 12%</span>
                </div>
                <div className="text-4xl font-bold text-white mb-1">$32.45</div>
                <p className="text-xs text-gray-400 mb-3">Energy Price ($/MWh)</p>

                {/* Mini Trend Chart - Declining Line */}
                <div className="h-8 mb-3">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <polyline
                      points="0,5 20,8 40,12 60,15 80,22 100,25"
                      fill="none"
                      stroke="rgba(52, 211, 153, 0.5)"
                      strokeWidth="2"
                    />
                    <polyline
                      points="0,5 20,8 40,12 60,15 80,22 100,25 100,30 0,30"
                      fill="url(#pricesGradient)"
                      stroke="none"
                    />
                    <defs>
                      <linearGradient id="pricesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(52, 211, 153, 0.3)" />
                        <stop offset="100%" stopColor="rgba(52, 211, 153, 0.0)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="pt-3 border-t border-emerald-500/20 flex justify-between text-xs">
                  <div>
                    <p className="text-gray-400">On-Peak</p>
                    <p className="text-white font-semibold">$45.20</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Capacity</p>
                    <p className="text-white font-semibold">$8.50</p>
                  </div>
                  <div className="flex items-center text-emerald-400 group-hover:text-emerald-300">
                    <svg className={`w-4 h-4 transition-transform ${pricesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            {/* Supply Content */}
            {supplyExpanded && (
              <div className="mb-6 mt-6 space-y-6">
                {/* Side-by-side subsections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Installed Capacity */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                      Installed Capacity
                    </h4>

                    <EIASupplyCharts
                      region={region}
                      state={selectedStateFilter || undefined}
                      selectedTechnology="All Technologies"
                      supplyView={supplyView}
                      chartType="capacity-fuel"
                    />
                  </div>

                  {/* Generation */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                      Generation
                    </h4>

                    <EIASupplyCharts
                      region={region}
                      state={selectedStateFilter || undefined}
                      selectedTechnology="All Technologies"
                      supplyView={supplyView}
                      chartType="generation"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Demand Content */}
            {demandExpanded && (
              <div className="mb-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Load Growth Forecast */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                      Load Growth Forecast
                      <span className="ml-auto text-sm text-green-400 font-medium">+2.8% CAGR</span>
                    </h4>

                    {/* Line Chart */}
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-semibold text-white">Projected Peak Load (2025-2035)</h5>
                        <span className="text-xs text-gray-400">Base Case Scenario</span>
                      </div>

                      <svg className="w-full h-48" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
                        {/* Grid lines */}
                        <line x1="50" y1="20" x2="50" y2="160" stroke="#374151" strokeWidth="1" />
                        <line x1="50" y1="160" x2="580" y2="160" stroke="#374151" strokeWidth="1" />
                        {[40, 70, 100, 130].map((y) => (
                          <line key={y} x1="50" y1={y} x2="580" y2={y} stroke="#1f2937" strokeWidth="0.5" strokeDasharray="4 4" />
                        ))}

                        {/* Data line with gradient */}
                        <defs>
                          <linearGradient id="demandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.05" />
                          </linearGradient>
                        </defs>

                        {/* Forecast data points (2025-2035) */}
                        {(() => {
                          const years = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035]
                          const loads = [68.5, 70.2, 72.1, 74.3, 76.8, 79.5, 82.4, 85.6, 89.1, 92.8, 96.8] // GW
                          const points = years.map((year, i) => {
                            const x = 50 + (i * 48)
                            const y = 160 - ((loads[i] - 65) / 35) * 140
                            return { x, y, year, load: loads[i] }
                          })

                          const pathData = points.map((p, i) =>
                            i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
                          ).join(' ')

                          const fillPath = `${pathData} L ${points[points.length - 1].x} 160 L 50 160 Z`

                          return (
                            <>
                              <path d={fillPath} fill="url(#demandGradient)" />
                              <path d={pathData} stroke="#a855f7" strokeWidth="2.5" fill="none" />
                              {points.map((point, i) => (
                                <g key={i}>
                                  <circle cx={point.x} cy={point.y} r="4" fill="#a855f7" stroke="#1a1a1a" strokeWidth="2" className="cursor-pointer hover:r-6 transition-all" />
                                  <text x={point.x} y="180" textAnchor="middle" className="text-xs fill-gray-400" fontSize="10">
                                    {i % 2 === 0 ? point.year : ''}
                                  </text>
                                </g>
                              ))}
                            </>
                          )
                        })()}

                        {/* Y-axis labels */}
                        <text x="40" y="165" textAnchor="end" className="text-xs fill-gray-400" fontSize="10">65</text>
                        <text x="40" y="135" textAnchor="end" className="text-xs fill-gray-400" fontSize="10">75</text>
                        <text x="40" y="105" textAnchor="end" className="text-xs fill-gray-400" fontSize="10">85</text>
                        <text x="40" y="75" textAnchor="end" className="text-xs fill-gray-400" fontSize="10">95</text>
                        <text x="40" y="25" textAnchor="end" className="text-xs fill-gray-400" fontSize="10">100 GW</text>
                      </svg>
                    </div>

                    {/* Key Demand Drivers - Collapsible */}
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <button
                        onClick={() => setDemandDriversExpanded(!demandDriversExpanded)}
                        className="w-full flex items-center justify-between text-sm font-semibold text-white hover:text-purple-400 transition-colors"
                      >
                        <span>Key Demand Drivers</span>
                        <svg
                          className={`w-5 h-5 transition-transform ${demandDriversExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {demandDriversExpanded && (
                        <div className="mt-4 space-y-3">
                          {/* Data Centers */}
                          <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 border border-cyan-500/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                </svg>
                                <span className="text-sm font-semibold text-white">Data Centers</span>
                              </div>
                              <span className="text-green-400 text-xs font-medium">↑ 18%</span>
                            </div>
                            <p className="text-lg font-bold text-white mb-1">12.8 GW</p>
                            <p className="text-xs text-gray-400">AI/Cloud computing expansion</p>
                          </div>

                          {/* EV Charging */}
                          <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-sm font-semibold text-white">EV Charging</span>
                              </div>
                              <span className="text-green-400 text-xs font-medium">↑ 45%</span>
                            </div>
                            <p className="text-lg font-bold text-white mb-1">2.4 GW</p>
                            <p className="text-xs text-gray-400">Fleet electrification</p>
                          </div>

                          {/* Manufacturing */}
                          <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border border-orange-500/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                <span className="text-sm font-semibold text-white">Manufacturing</span>
                              </div>
                              <span className="text-gray-400 text-xs font-medium">↑ 2%</span>
                            </div>
                            <p className="text-lg font-bold text-white mb-1">15.2 GW</p>
                            <p className="text-xs text-gray-400">Semiconductor fabs</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Load by Customer Class */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                      Load by Customer Class
                    </h4>

                    <CustomerClassPieChart />
                  </div>
                </div>
              </div>
            )}

            {/* Prices Content */}
            {pricesExpanded && (
              <div className="mb-6 mt-6 space-y-6">
                {/* Energy Prices */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                    Energy Prices ($/MWh)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 border border-emerald-500/30 rounded-lg p-4">
                      <p className="text-sm text-emerald-400 font-medium mb-1">Average (24/7)</p>
                      <p className="text-3xl font-bold text-white">$32.45</p>
                      <p className="text-xs text-red-400 mt-1">↓ 12% vs last year</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border border-orange-500/30 rounded-lg p-4">
                      <p className="text-sm text-orange-400 font-medium mb-1">On-Peak</p>
                      <p className="text-3xl font-bold text-white">$45.20</p>
                      <p className="text-xs text-red-400 mt-1">↓ 8% vs last year</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-sm text-blue-400 font-medium mb-1">Off-Peak</p>
                      <p className="text-3xl font-bold text-white">$19.70</p>
                      <p className="text-xs text-red-400 mt-1">↓ 15% vs last year</p>
                    </div>
                  </div>

                  {/* Price Trends by Month - Enhanced Visualization */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-semibold text-white">Monthly Average Prices (2024)</h5>
                      <span className="text-xs text-gray-400">Peak: August</span>
                    </div>

                    {/* Interactive Line Chart */}
                    <div className="relative h-40 mb-4">
                      {/* Y-axis labels */}
                      <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
                        <span>$50</span>
                        <span>$40</span>
                        <span>$30</span>
                        <span>$20</span>
                      </div>

                      {/* Chart area */}
                      <div className="ml-8 h-full">
                        {/* Grid lines */}
                        <div className="absolute inset-0 ml-8 flex flex-col justify-between">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="border-t border-gray-700/50"></div>
                          ))}
                        </div>

                        {/* Price line chart */}
                        <svg className="w-full h-full relative z-10" viewBox="0 0 120 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="priceChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
                              <stop offset="100%" stopColor="rgba(16, 185, 129, 0.0)" />
                            </linearGradient>
                          </defs>
                          {/* Area fill */}
                          <polyline
                            points="0,23 10,30 20,34 30,42 40,47 50,37 60,15 70,8 80,22 90,34 100,27 110,31 110,100 0,100"
                            fill="url(#priceChartGradient)"
                            stroke="none"
                          />
                          {/* Line */}
                          <polyline
                            points="0,23 10,30 20,34 30,42 40,47 50,37 60,15 70,8 80,22 90,34 100,27 110,31"
                            fill="none"
                            stroke="rgba(16, 185, 129, 0.8)"
                            strokeWidth="2"
                          />
                          {/* Data points */}
                          {[23, 30, 34, 42, 47, 37, 15, 8, 22, 34, 27, 31].map((y, i) => (
                            <circle key={i} cx={i * 10} cy={y} r="3" fill="rgb(16, 185, 129)" className="cursor-pointer hover:r-4 transition-all" />
                          ))}
                        </svg>
                      </div>
                    </div>

                    {/* Month labels with actual values */}
                    <div className="grid grid-cols-6 gap-2">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => {
                        const prices = [38.5, 35.2, 32.8, 28.9, 26.4, 31.7, 42.3, 45.8, 38.9, 33.2, 36.7, 34.5]
                        const isHighest = i === 7
                        const isLowest = i === 4
                        return (
                          <div key={month} className={`text-center rounded p-2 transition-all hover:bg-gray-900/70 cursor-pointer ${
                            isHighest ? 'bg-red-900/20 border border-red-500/30' :
                            isLowest ? 'bg-blue-900/20 border border-blue-500/30' :
                            'bg-gray-900/30'
                          }`}>
                            <p className="text-xs text-gray-400 mb-1">{month}</p>
                            <p className={`text-sm font-bold ${
                              isHighest ? 'text-red-400' :
                              isLowest ? 'text-blue-400' :
                              'text-white'
                            }`}>${prices[i]}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Capacity Market */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                    Capacity Market Prices
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/20 border border-indigo-500/30 rounded-lg p-4">
                      <p className="text-sm text-indigo-400 font-medium mb-2">Current Auction (2025/26)</p>
                      <p className="text-3xl font-bold text-white mb-1">$8.50</p>
                      <p className="text-sm text-gray-400">per kW-month</p>
                      <div className="mt-3 pt-3 border-t border-indigo-500/20">
                        <p className="text-xs text-gray-400">Cleared Capacity</p>
                        <p className="text-white font-semibold">72,450 MW</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-violet-900/20 to-violet-800/20 border border-violet-500/30 rounded-lg p-4">
                      <p className="text-sm text-violet-400 font-medium mb-2">Next Auction (2026/27)</p>
                      <p className="text-3xl font-bold text-white mb-1">$9.20</p>
                      <p className="text-sm text-gray-400">per kW-month (forecast)</p>
                      <div className="mt-3 pt-3 border-t border-violet-500/20">
                        <p className="text-xs text-gray-400">Expected Demand</p>
                        <p className="text-white font-semibold">74,800 MW</p>
                      </div>
                    </div>
                  </div>

                  {/* Historical Capacity Prices */}
                  <div className="mt-4 bg-gray-800/50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-white mb-3">Historical Capacity Auction Results</h5>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { year: '2021/22', price: 7.35 },
                        { year: '2022/23', price: 6.90 },
                        { year: '2023/24', price: 7.80 },
                        { year: '2024/25', price: 8.15 },
                        { year: '2025/26', price: 8.50 }
                      ].map(item => (
                        <div key={item.year} className="text-center bg-gray-900/50 rounded p-2">
                          <p className="text-xs text-gray-400 mb-1">{item.year}</p>
                          <p className="text-lg font-bold text-white">${item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price Drivers */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-yellow-500 rounded-full"></span>
                    Key Price Drivers
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3">
                      <div className="p-1.5 bg-blue-500/20 rounded mt-0.5">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white mb-1">Natural Gas Prices</p>
                        <p className="text-sm text-gray-400">Henry Hub averaging $2.45/MMBtu (↓18% YoY) driving lower marginal costs</p>
                      </div>
                      <span className="text-red-400 font-medium whitespace-nowrap">-↓</span>
                    </div>

                    <div className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3">
                      <div className="p-1.5 bg-green-500/20 rounded mt-0.5">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white mb-1">Renewable Penetration</p>
                        <p className="text-sm text-gray-400">15.2 GW of zero-marginal-cost renewables reducing peak prices</p>
                      </div>
                      <span className="text-red-400 font-medium whitespace-nowrap">-↓</span>
                    </div>

                    <div className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3">
                      <div className="p-1.5 bg-purple-500/20 rounded mt-0.5">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white mb-1">Demand Growth</p>
                        <p className="text-sm text-gray-400">Data centers and EVs driving +3.2% annual load growth, tightening supply</p>
                      </div>
                      <span className="text-green-400 font-medium whitespace-nowrap">-↑</span>
                    </div>

                    <div className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3">
                      <div className="p-1.5 bg-red-500/20 rounded mt-0.5">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white mb-1">Coal Retirements</p>
                        <p className="text-sm text-gray-400">4.2 GW retiring by 2030, potential reliability concerns during peak periods</p>
                      </div>
                      <span className="text-green-400 font-medium whitespace-nowrap">-↑</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Opportunities/RFP Section */}
        <OpportunitiesSection region={region} />

        {/* Energy Buyers Section */}
        <div className="bg-gray-900 rounded-lg px-6 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header with Stats */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {region} Energy Buyers
                  </h2>
                  <p className="text-gray-400">
                    Track key utilities and corporate energy buyers across {selectedStates.length} states
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4">
                  <div className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                    <div className="text-2xl font-bold text-blue-500">{stateUtilities.length}</div>
                    <div className="text-xs text-gray-400">Utilities</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                    <div className="text-2xl font-bold text-purple-500">{corporatesByRegion[region]?.length || 0}</div>
                    <div className="text-xs text-gray-400">Corporates</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                    <div className="text-2xl font-bold text-green-500">{favorites.size}</div>
                    <div className="text-xs text-gray-400">Watching</div>
                  </div>
                </div>
              </div>

              {/* Filters and Controls */}
              <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4 border border-gray-700">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Show:</span>
                  <div className="inline-flex rounded-lg bg-gray-700 p-1">
                    <button
                      onClick={() => {
                        setbuyerViewMode('all')
                        setEnergyBuyersTab('utilities')
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        buyerViewMode === 'all'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      All Buyers
                    </button>
                    <button
                      onClick={() => {
                        setbuyerViewMode('utilities')
                        setEnergyBuyersTab('utilities')
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        buyerViewMode === 'utilities'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      Utilities Only
                    </button>
                    <button
                      onClick={() => {
                        setbuyerViewMode('corporates')
                        setEnergyBuyersTab('corporates')
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        buyerViewMode === 'corporates'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      Corporates Only
                    </button>
                  </div>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Sort by:</span>
                  <select
                    value={buyerSortBy}
                    onChange={(e) => setBuyerSortBy(e.target.value as any)}
                    className="bg-gray-700 text-white rounded-lg px-4 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="load">Energy Load (High to Low)</option>
                    <option value="name">Company Name (A-Z)</option>
                    <option value="recent">Recently Added</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Unified "All Buyers" View */}
            {buyerViewMode === 'all' && (
              <div className="mb-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Utilities Column */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Utilities ({stateUtilities.length})
                      </h3>
                    </div>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {stateUtilities.slice(0, 10).map((utility, index) => {
                        const utilityId = `utility-${utility.id || utility.utility_number || utility.utilityNumber || index}`
                        const isFavorited = favorites.has(utilityId)

                        return (
                          <div
                            key={utility.id || index}
                            onClick={() => {
                              setSelectedUtilityForAnalysis(utility)
                              setEnergyBuyersTab('utilities')
                              setbuyerViewMode('utilities')
                            }}
                            className={`bg-gray-800 rounded-lg p-4 border-2 transition-all cursor-pointer hover:border-blue-500 ${
                              selectedUtilityForAnalysis?.id === utility.id
                                ? 'border-blue-500 ring-2 ring-blue-500/30'
                                : 'border-gray-700'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-white">
                                    {utility.name || utility.utility_name || `Utility ${index + 1}`}
                                  </h4>
                                  {isFavorited && (
                                    <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                                    </svg>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {utility.states?.[0] || utility.state || 'N/A'}
                                  </span>
                                  {utility.ownership_type && (
                                    <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">
                                      {utility.ownership_type}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFavorite(utilityId)

                                  const savedCompanies = localStorage.getItem('allEnergyBuyerCompanies')
                                  const companies = savedCompanies ? JSON.parse(savedCompanies) : []
                                  const companyData = {
                                    id: utilityId,
                                    name: utility.name || utility.utility_name || `Utility ${index + 1}`,
                                    type: 'utility',
                                    states: utility.states || [],
                                    ...utility
                                  }
                                  const existingIndex = companies.findIndex((c: any) => c.id === utilityId)
                                  if (existingIndex >= 0) {
                                    companies[existingIndex] = companyData
                                  } else {
                                    companies.push(companyData)
                                  }
                                  localStorage.setItem('allEnergyBuyerCompanies', JSON.stringify(companies))
                                }}
                                className="text-gray-400 hover:text-yellow-500 transition-colors"
                              >
                                <svg className={`w-5 h-5 ${isFavorited ? 'fill-current text-yellow-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      {stateUtilities.length > 10 && (
                        <button
                          onClick={() => {
                            setbuyerViewMode('utilities')
                            setEnergyBuyersTab('utilities')
                          }}
                          className="w-full py-3 text-blue-500 hover:text-blue-400 font-medium text-sm"
                        >
                          View all {stateUtilities.length} utilities →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Corporates Column */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Corporates ({corporatesByRegion[region]?.length || 0})
                      </h3>
                    </div>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {(corporatesByRegion[region] || []).slice(0, 10).map((corporate, index) => {
                        const corporateId = `corporate-${corporate.id || index}`
                        const isFavorited = favorites.has(corporateId)

                        return (
                          <div
                            key={corporate.id || index}
                            onClick={() => {
                              setSelectedCorporate(corporate)
                              setEnergyBuyersTab('corporates')
                              setbuyerViewMode('corporates')
                            }}
                            className={`bg-gray-800 rounded-lg p-4 border-2 transition-all cursor-pointer hover:border-purple-500 ${
                              selectedCorporate?.id === corporate.id
                                ? 'border-purple-500 ring-2 ring-purple-500/30'
                                : 'border-gray-700'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-white">{corporate.name}</h4>
                                  {isFavorited && (
                                    <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                                    </svg>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                    </svg>
                                    {corporate.facilities} facilities
                                  </span>
                                  <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">
                                    {corporate.type}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFavorite(corporateId)

                                  const savedCompanies = localStorage.getItem('allEnergyBuyerCompanies')
                                  const companies = savedCompanies ? JSON.parse(savedCompanies) : []
                                  const companyData = {
                                    id: corporateId,
                                    name: corporate.name,
                                    type: 'corporate',
                                    ...corporate
                                  }
                                  const existingIndex = companies.findIndex((c: any) => c.id === corporateId)
                                  if (existingIndex >= 0) {
                                    companies[existingIndex] = companyData
                                  } else {
                                    companies.push(companyData)
                                  }
                                  localStorage.setItem('allEnergyBuyerCompanies', JSON.stringify(companies))
                                }}
                                className="text-gray-400 hover:text-yellow-500 transition-colors"
                              >
                                <svg className={`w-5 h-5 ${isFavorited ? 'fill-current text-yellow-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      {(corporatesByRegion[region]?.length || 0) > 10 && (
                        <button
                          onClick={() => {
                            setbuyerViewMode('corporates')
                            setEnergyBuyersTab('corporates')
                          }}
                          className="w-full py-3 text-purple-500 hover:text-purple-400 font-medium text-sm"
                        >
                          View all {corporatesByRegion[region]?.length} corporates →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ownership Type Filter - Only show for Utilities tab */}
            {buyerViewMode === 'utilities' && energyBuyersTab === 'utilities' && selectedStates.length > 0 && (
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
            {buyerViewMode === 'utilities' && energyBuyersTab === 'utilities' && (
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
            {buyerViewMode === 'corporates' && energyBuyersTab === 'corporates' && (
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
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full h-[90vh] p-8 border border-gray-700">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">
                {supplyExpanded ? `${selectedStateFilter || region} Power Supply Map` :
                 demandExpanded ? `${selectedStateFilter || region} Demand Map` :
                 pricesExpanded ? `${selectedStateFilter || region} Pricing Map` :
                 `${selectedStateFilter || region} Power Market Map`}
              </h2>
              <button
                onClick={() => setShowMapModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Interactive Map with EIA Generator Data */}
            <div className="bg-gray-900 rounded-lg h-[calc(100%-80px)] overflow-hidden border border-gray-600 relative">
              <MapboxMap
                containerId="power-infrastructure-map"
                plants={eiaGenerators}
              />

              {/* Loading overlay */}
              {eiaLoading && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <div className="text-white text-sm">Loading generators...</div>
                  </div>
                </div>
              )}

              {/* Info overlay */}
              <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600 z-[1000]">
                <p className="text-sm text-gray-300 font-semibold mb-1">
                  {region} Region
                </p>
                <p className="text-xs text-gray-400">
                  {selectedStateFilter
                    ? `Viewing: ${selectedStateFilter}`
                    : 'All states in region'}
                </p>
                {selectedTechnology !== 'All Technologies' && (
                  <p className="text-xs text-gray-400">
                    Filter: {selectedTechnology}
                  </p>
                )}
                <p className="text-xs text-blue-400 mt-2">
                  {eiaGenerators.length.toLocaleString()} plants shown
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Chat Button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 transition-all hover:scale-105 z-40"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="font-medium">Ask a question</span>
        </button>
      )}

      {/* Chat Window */}
      {showChat && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-gray-800 rounded-lg shadow-2xl border border-gray-700 flex flex-col z-50">
          {/* Chat Header */}
          <div className="bg-gray-900 px-4 py-3 rounded-t-lg border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-white font-medium">Chat Assistant</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowChat(false)}
                className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                title="Minimize"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (chatMessage.trim()) {
                  setChatMessages([...chatMessages, { text: chatMessage, sender: 'user' }])
                  setChatMessage('')
                  // Simulate assistant response
                  setTimeout(() => {
                    setChatMessages(prev => [...prev, {
                      text: "I'm here to help! This is a placeholder response. Full chat functionality coming soon.",
                      sender: 'assistant'
                    }])
                  }, 500)
                }
              }}
              className="flex space-x-2"
            >
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
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
  const [showPowerPlantMapModal, setShowPowerPlantMapModal] = useState(false)
  const [plants, setPlants] = useState<any[]>([])
  const [plantsLoading, setPlantsLoading] = useState(false)
  const [plantsError, setPlantsError] = useState<string | null>(null)
  const [selectedRFP, setSelectedRFP] = useState<any>(null)
  const [showAllPlants, setShowAllPlants] = useState(false)
  const [showAllFutureProjects, setShowAllFutureProjects] = useState(false)
  const [customerClassView, setCustomerClassView] = useState<'table' | 'visual'>('visual')
  const [supplyExpanded, setSupplyExpanded] = useState(true)
  const [demandExpanded, setDemandExpanded] = useState(true)

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

  // Fetch plants data when utility changes
  useEffect(() => {
    const fetchPlants = async () => {
      if (!utility?.name && !utility?.utility_name) {
        setPlants([])
        return
      }

      setPlantsLoading(true)
      setPlantsError(null)
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
        setPlantsError(error instanceof Error ? error.message : 'Failed to load plant data')
        setPlants([])
      } finally {
        setPlantsLoading(false)
      }
    }

    fetchPlants()
  }, [utility])

  const sections = [
    { id: 1, title: 'At a Glance', icon: '📊' },
    { id: 2, title: 'RFPs & Opportunities', icon: '🎯' },
    { id: 3, title: 'Key Contacts', icon: '👥' }
  ]

  return (
    <div className="w-full">
      {/* Company Header */}
      <div className="mb-6 pb-6 border-b border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-white">{utility?.name || utility?.utility_name}</h1>
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                {utility?.ownershipType || 'Investor-Owned'}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-2">
              {utility?.states?.join(', ') || 'Multi-state service territory'}
            </p>
            <p className="text-sm text-gray-300 max-w-3xl leading-relaxed">
              Leading electric utility providing generation, transmission, and distribution services across {utility?.states?.length || 'multiple'} states.
              Committed to delivering reliable power to 2.4M+ customers while transitioning to clean energy with a goal of 40% renewable capacity by 2030.
            </p>
          </div>
        </div>
      </div>

      {/* Section Navigation - Horizontal at Top */}
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg bg-gray-700 p-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-6 py-2.5 rounded-md font-semibold transition-all flex items-center gap-2 ${
                  activeSection === section.id
                    ? 'bg-gray-800 text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="w-full">

            {/* Section 1: At a Glance */}
            {activeSection === 1 && (
              <>
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="text-xs text-gray-400 font-medium">Total Capacity</p>
                    </div>
                    <p className="text-2xl font-bold text-white">7,150 MW</p>
                    <p className="text-xs text-green-400 mt-1">↑ 8.3% YoY</p>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-xs text-gray-400 font-medium">Renewable %</p>
                    </div>
                    <p className="text-2xl font-bold text-white">15%</p>
                    <p className="text-xs text-gray-400 mt-1">Target: 40% by 2030</p>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-xs text-gray-400 font-medium">Customers</p>
                    </div>
                    <p className="text-2xl font-bold text-white">2.4M</p>
                    <p className="text-xs text-green-400 mt-1">↑ 3.2% YoY</p>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      <p className="text-xs text-gray-400 font-medium">Peak Demand</p>
                    </div>
                    <p className="text-2xl font-bold text-white">8.5 GW</p>
                    <p className="text-xs text-gray-400 mt-1">Load Factor: 61%</p>
                  </div>
                </div>

                {/* ===== SUPPLY SIDE ===== */}
                <div className="mb-6">
                  <button
                    onClick={() => setSupplyExpanded(!supplyExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚡</span>
                      <div className="text-left">
                        <h2 className="text-xl font-bold text-white">Generation Portfolio</h2>
                        <p className="text-sm text-gray-400">Supply-side capacity and infrastructure</p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${supplyExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {supplyExpanded && (
                  <div className="mt-6">

                  {/* Key Insights - Supply */}
                  <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/20 rounded-lg p-5 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-300 mb-2">Key Insight</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Natural gas dominates the portfolio at <span className="font-semibold text-white">45%</span>, while renewables currently represent <span className="font-semibold text-white">13%</span> with <span className="font-semibold text-white">6 new projects</span> planned to reach 40% by 2030.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Capacity by Technology Chart */}
                  {utility && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-white mb-4">Capacity by Technology</h3>
                      <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
                        {/* Stacked Bar Chart */}
                        <div className="flex h-12 rounded-lg overflow-hidden mb-4">
                          {[
                            { tech: 'Natural Gas', capacity: 3200, color: 'bg-blue-500', percent: 45 },
                            { tech: 'Coal', capacity: 2100, color: 'bg-gray-600', percent: 29 },
                            { tech: 'Nuclear', capacity: 900, color: 'bg-purple-500', percent: 13 },
                            { tech: 'Solar', capacity: 450, color: 'bg-yellow-500', percent: 6 },
                            { tech: 'Wind', capacity: 350, color: 'bg-green-500', percent: 5 },
                            { tech: 'Hydro', capacity: 150, color: 'bg-cyan-500', percent: 2 }
                          ].map((item) => (
                            <div
                              key={item.tech}
                              className={`${item.color} flex items-center justify-center text-white text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer`}
                              style={{ width: `${item.percent}%` }}
                              title={`${item.tech}: ${item.capacity} MW (${item.percent}%)`}
                            >
                              {item.percent >= 10 && <span>{item.percent}%</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Power Plants Table */}
                  {utility && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Power Plant Portfolio</h3>
                        <button
                          onClick={() => setShowPowerPlantMapModal(true)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all"
                          title="View Map"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </button>
                      </div>
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
                              <PlantsTableRows plants={showAllPlants ? plants : plants.slice(0, 5)} loading={plantsLoading} error={plantsError} />
                            </tbody>
                          </table>
                        </div>
                        {!plantsLoading && !plantsError && plants.length > 5 && (
                          <div className="px-4 py-3 bg-gray-700 border-t border-gray-600">
                            <button
                              onClick={() => setShowAllPlants(!showAllPlants)}
                              className="w-full py-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2"
                            >
                              {showAllPlants ? (
                                <>
                                  Show Less
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  View All ({plants.length} plants)
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                          {[...Array(showAllFutureProjects ? 6 : 3)].map((_, i) => (
                            <tr key={i} className="border-t border-gray-600">
                              <td className="px-4 py-2 text-sm text-white">Project {i + 1}</td>
                              <td className="px-4 py-2 text-sm text-white">{i % 2 === 0 ? 'Solar' : 'Wind'}</td>
                              <td className="px-4 py-2 text-sm text-green-400">Planned</td>
                              <td className="px-4 py-2 text-sm text-white">{2025 + Math.floor(i / 2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-4 py-3 bg-gray-700 border-t border-gray-600">
                        <button
                          onClick={() => setShowAllFutureProjects(!showAllFutureProjects)}
                          className="w-full py-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2"
                        >
                          {showAllFutureProjects ? (
                            <>
                              Show Less
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </>
                          ) : (
                            <>
                              View All (6 projects)
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  </div>
                  )}
                </div>

                {/* ===== DEMAND SIDE ===== */}
                <div className="mb-6">
                  <button
                    onClick={() => setDemandExpanded(!demandExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👥</span>
                      <div className="text-left">
                        <h2 className="text-xl font-bold text-white">Customer Base & Load Profile</h2>
                        <p className="text-sm text-gray-400">Demand-side customer classes and consumption</p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${demandExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {demandExpanded && (
                  <div className="mt-6">

                  {/* Key Insights - Demand */}
                  <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-500/20 rounded-lg p-5 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-purple-300 mb-2">Key Insight</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Residential and Industrial sectors each drive <span className="font-semibold text-white">35%</span> of total load, with <span className="font-semibold text-white">2.4M customers</span> growing at <span className="font-semibold text-white">3.2% YoY</span> and peak demand of <span className="font-semibold text-white">8.5 GW</span>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Class Breakdown - Unified View */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Load by Customer Class</h3>
                      <div className="inline-flex rounded-lg bg-gray-700 p-1">
                        <button
                          onClick={() => setCustomerClassView('visual')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            customerClassView === 'visual'
                              ? 'bg-gray-800 text-blue-400'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Visual
                        </button>
                        <button
                          onClick={() => setCustomerClassView('table')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            customerClassView === 'table'
                              ? 'bg-gray-800 text-blue-400'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Table
                        </button>
                      </div>
                    </div>

                    {customerClassView === 'visual' ? (
                      <div className="space-y-3">
                        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-blue-500 rounded"></div>
                              <span className="font-medium text-white">Residential</span>
                            </div>
                            <span className="font-bold text-white">35%</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-3">
                            <div className="bg-blue-500 h-3 rounded-full" style={{width: '35%'}}></div>
                          </div>
                          <div className="mt-2 text-sm text-gray-400">
                            2.15M customers | 15,960 GWh annual sales
                          </div>
                        </div>

                        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-green-500 rounded"></div>
                              <span className="font-medium text-white">Commercial</span>
                            </div>
                            <span className="font-bold text-white">30%</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-3">
                            <div className="bg-green-500 h-3 rounded-full" style={{width: '30%'}}></div>
                          </div>
                          <div className="mt-2 text-sm text-gray-400">
                            245K customers | 13,680 GWh annual sales
                          </div>
                        </div>

                        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-purple-500 rounded"></div>
                              <span className="font-medium text-white">Industrial</span>
                            </div>
                            <span className="font-bold text-white">35%</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-3">
                            <div className="bg-purple-500 h-3 rounded-full" style={{width: '35%'}}></div>
                          </div>
                          <div className="mt-2 text-sm text-gray-400">
                            5.2K customers | 15,960 GWh annual sales
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-600">
                          <thead className="bg-gray-600">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Customer Class</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Customers</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Annual Sales (GWh)</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">% of Total</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Avg. Usage</th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-700 divide-y divide-gray-600">
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-white flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                Residential
                              </td>
                              <td className="px-4 py-3 text-sm text-white text-right">2,150,000</td>
                              <td className="px-4 py-3 text-sm text-white text-right">15,960</td>
                              <td className="px-4 py-3 text-sm text-white text-right">35%</td>
                              <td className="px-4 py-3 text-sm text-gray-400 text-right">7,420 kWh/yr</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-white flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                Commercial
                              </td>
                              <td className="px-4 py-3 text-sm text-white text-right">245,000</td>
                              <td className="px-4 py-3 text-sm text-white text-right">13,680</td>
                              <td className="px-4 py-3 text-sm text-white text-right">30%</td>
                              <td className="px-4 py-3 text-sm text-gray-400 text-right">55,840 kWh/yr</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-white flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                                Industrial
                              </td>
                              <td className="px-4 py-3 text-sm text-white text-right">5,200</td>
                              <td className="px-4 py-3 text-sm text-white text-right">15,960</td>
                              <td className="px-4 py-3 text-sm text-white text-right">35%</td>
                              <td className="px-4 py-3 text-sm text-gray-400 text-right">3.07 GWh/yr</td>
                            </tr>
                          </tbody>
                          <tfoot className="bg-gray-700 border-t-2 border-gray-600">
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
                    )}
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
                </div>
                  )}
                </div>

                <div className="mt-6">
                  <p className="text-sm text-gray-400 text-center">
                    Complete supply and demand data for comprehensive market intelligence.
                    Data sourced from EIA.gov, state regulatory filings, and utility reports.
                  </p>
                </div>
              </>
            )}

            {activeSection === 2 && (
              <>
                {/* Active RFPs */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Active & Upcoming RFPs
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        title: 'Solar + Storage Capacity',
                        type: 'Renewable Energy',
                        capacity: '500 MW Solar + 200 MW/800 MWh Storage',
                        deadline: 'March 15, 2025',
                        issued: 'Dec 1, 2024',
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
                        issued: 'Jan 15, 2025',
                        status: 'Open',
                        link: 'https://example.com/rfp/wind-ppa-2025'
                      },
                      {
                        title: 'Demand Response Program',
                        type: 'Grid Services',
                        capacity: '100 MW Load Reduction',
                        deadline: 'May 20, 2025',
                        issued: 'Feb 1, 2025',
                        status: 'Upcoming',
                        link: 'https://example.com/rfp/demand-response-2025'
                      }
                    ].map((rfp, i) => (
                      <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-white">{rfp.title}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                rfp.status === 'Open'
                                  ? 'bg-green-900/50 text-green-400 border border-green-700'
                                  : 'bg-blue-900/50 text-blue-400 border border-blue-700'
                              }`}>
                                {rfp.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 text-xs">Type</p>
                                <p className="text-gray-300">{rfp.type}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Capacity</p>
                                <p className="text-gray-300">{rfp.capacity}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Deadline</p>
                                <p className="text-white font-medium">{rfp.deadline}</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedRFP(rfp)}
                            className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            View Details
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Completed RFPs */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Recent Completed RFPs</h3>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Project</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Capacity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Awarded</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Winner</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">COD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        <tr className="hover:bg-gray-750">
                          <td className="px-4 py-3 text-sm text-white">Coastal Solar Farm</td>
                          <td className="px-4 py-3 text-sm text-gray-300">Solar PV</td>
                          <td className="px-4 py-3 text-sm text-gray-300">300 MW</td>
                          <td className="px-4 py-3 text-sm text-gray-300">Oct 2024</td>
                          <td className="px-4 py-3 text-sm text-blue-400">NextEra Energy</td>
                          <td className="px-4 py-3 text-sm text-gray-300">Q2 2026</td>
                        </tr>
                        <tr className="hover:bg-gray-750">
                          <td className="px-4 py-3 text-sm text-white">Mountain Wind Project</td>
                          <td className="px-4 py-3 text-sm text-gray-300">Wind</td>
                          <td className="px-4 py-3 text-sm text-gray-300">250 MW</td>
                          <td className="px-4 py-3 text-sm text-gray-300">Aug 2024</td>
                          <td className="px-4 py-3 text-sm text-blue-400">Avangrid Renewables</td>
                          <td className="px-4 py-3 text-sm text-gray-300">Q4 2025</td>
                        </tr>
                        <tr className="hover:bg-gray-750">
                          <td className="px-4 py-3 text-sm text-white">Battery Storage System</td>
                          <td className="px-4 py-3 text-sm text-gray-300">Storage</td>
                          <td className="px-4 py-3 text-sm text-gray-300">150 MW/600 MWh</td>
                          <td className="px-4 py-3 text-sm text-gray-300">Jun 2024</td>
                          <td className="px-4 py-3 text-sm text-blue-400">Fluence Energy</td>
                          <td className="px-4 py-3 text-sm text-gray-300">Q3 2025</td>
                        </tr>
                        <tr className="hover:bg-gray-750">
                          <td className="px-4 py-3 text-sm text-white">Combined Cycle Gas Plant</td>
                          <td className="px-4 py-3 text-sm text-gray-300">Natural Gas</td>
                          <td className="px-4 py-3 text-sm text-gray-300">450 MW</td>
                          <td className="px-4 py-3 text-sm text-gray-300">Mar 2024</td>
                          <td className="px-4 py-3 text-sm text-blue-400">Siemens Energy</td>
                          <td className="px-4 py-3 text-sm text-gray-300">Q1 2026</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Section 3: Key Contacts */}
            {activeSection === 3 && (
              <>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold text-white mb-4">Decision Makers & Key Stakeholders</h3>
                  <p className="text-gray-400 mb-6">
                    Connect with procurement leaders and decision makers at {utility?.name || utility?.utility_name}.
                  </p>

                  {/* Contact Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        name: 'Sarah Johnson',
                        title: 'VP, Power Supply & Procurement',
                        department: 'Procurement',
                        email: 's.johnson@utility.com',
                        phone: '(555) 123-4567',
                        linkedin: '#'
                      },
                      {
                        name: 'Michael Chen',
                        title: 'Director, Renewable Energy',
                        department: 'Clean Energy',
                        email: 'm.chen@utility.com',
                        phone: '(555) 234-5678',
                        linkedin: '#'
                      },
                      {
                        name: 'Emily Rodriguez',
                        title: 'Manager, Strategic Sourcing',
                        department: 'Procurement',
                        email: 'e.rodriguez@utility.com',
                        phone: '(555) 345-6789',
                        linkedin: '#'
                      },
                      {
                        name: 'David Park',
                        title: 'Senior Analyst, Resource Planning',
                        department: 'Planning',
                        email: 'd.park@utility.com',
                        phone: '(555) 456-7890',
                        linkedin: '#'
                      }
                    ].map((contact, idx) => (
                      <div key={idx} className="bg-gray-700 rounded-lg p-5 border border-gray-600 hover:border-blue-500 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-white text-lg">{contact.name}</h4>
                            <p className="text-sm text-gray-400">{contact.title}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                              {contact.department}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <a href={`mailto:${contact.email}`} className="hover:text-blue-400 transition-colors">
                              {contact.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {contact.phone}
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <a
                              href={contact.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                              </svg>
                              Connect
                            </a>
                            <button className="ml-auto px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors">
                              Add to Network
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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

      {/* Power Plant Map Modal */}
      {showPowerPlantMapModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full h-[90vh] p-8 border border-gray-700">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">Power Plant Locations</h2>
              <button
                onClick={() => setShowPowerPlantMapModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Power Plant Map */}
            <div className="bg-gray-900 rounded-lg h-[calc(100%-80px)] overflow-hidden border border-gray-600 relative">
              <MapboxMap containerId="power-plant-locations-map" plants={plants} />

              {/* Info overlay */}
              <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600 z-[1000]">
                <p className="text-sm text-gray-300">
                  {utility?.name || utility?.utility_name} Power Plants - {plants.length} facilities
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RFP Detail Modal */}
      {selectedRFP && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedRFP.title}</h2>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">{utility?.name || utility?.utility_name}</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                      selectedRFP.status === 'Open'
                        ? 'bg-green-900/50 text-green-400 border-green-700'
                        : 'bg-blue-900/50 text-blue-400 border-blue-700'
                    }`}>
                      {selectedRFP.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRFP(null)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Type</div>
                  <div className="text-lg font-semibold text-white">{selectedRFP.type}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Capacity</div>
                  <div className="text-lg font-semibold text-white">{selectedRFP.capacity}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Proposal Deadline</div>
                  <div className="text-lg font-semibold text-white">{selectedRFP.deadline}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Issued Date</div>
                  <div className="text-lg font-semibold text-white">{selectedRFP.issued}</div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Project Overview</h3>
                <p className="text-gray-300">
                  {utility?.name || utility?.utility_name} is seeking proposals for {selectedRFP.capacity} of {selectedRFP.type.toLowerCase()} capacity.
                  This procurement is part of the utility's broader strategy to enhance grid reliability and meet growing energy demands while advancing clean energy goals.
                </p>
              </div>

              {/* Key Requirements */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Key Requirements</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Project must be located within or adjacent to service territory
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Commercial operation date: Q4 2026 - Q2 2027
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Proven technology and development experience
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Competitive pricing and long-term PPA structure
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Financial strength and project financing capabilities
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
                <a
                  href={selectedRFP.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all text-center"
                >
                  View Official RFP Document
                </a>
                <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all">
                  Track Opportunity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Inline Corporate Analysis Component (Timeline-based)
function CorporateAnalysisInline({ corporate, region }: { corporate: any; region: string }) {
  const [activeSection, setActiveSection] = useState(1)
  const [showDataCenterMapModal, setShowDataCenterMapModal] = useState(false)

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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Data Center Locations</h3>
                  <button
                    onClick={() => setShowDataCenterMapModal(true)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all"
                    title="View Map"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </button>
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
                        {corporate.states?.map((state: string) => (
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
                <h3 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                  {region} Active Opportunities
                </h3>
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

      {/* Data Center Map Modal */}
      {showDataCenterMapModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full h-[90vh] p-8 border border-gray-700">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">Data Center Locations</h2>
              <button
                onClick={() => setShowDataCenterMapModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Data Center Map */}
            <div className="bg-gray-900 rounded-lg h-[calc(100%-80px)] overflow-hidden border border-gray-600 relative">
              <MapboxMap containerId="data-center-locations-map" />

              {/* Info overlay */}
              <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600 z-[1000]">
                <p className="text-sm text-gray-300">
                  {corporate.name} Data Centers
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}