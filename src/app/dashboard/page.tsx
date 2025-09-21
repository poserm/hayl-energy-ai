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
import SimpleUSMap from '@/components/SimpleUSMap'
import Image from 'next/image'

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
  
  const {
    selectedStates,
    updateSelectedStates,
    dashboardData,
    getCapacityChartData,
    getTechnologyChartData,
    getStateMetrics,
    refreshData
  } = useEnergyDashboard(['Pennsylvania'])

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

        {/* Welcome Section */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome, {user.name || user.email.split('@')[0]}</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Focus area:</label>
              <select 
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Project Sales">Project Sales</option>
                <option value="Market Analysis">Market Analysis</option>
                <option value="Regulatory Updates">Regulatory Updates</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Region:</label>
              <select 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PJM">PJM</option>
                <option value="ERCOT">ERCOT</option>
                <option value="ISO-NE">ISO-NE</option>
                <option value="CAISO">CAISO</option>
                <option value="MISO">MISO</option>
              </select>
            </div>
          </div>
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

        {/* State Selection Pills */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select State</h3>
            <button
              onClick={() => updateSelectedStates([])}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          </div>
          
          {/* Currently Selected State */}
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedStates.length > 0 ? (
              <div className="flex items-center bg-gray-900 text-white px-3 py-1 rounded-full text-sm">
                <span>{selectedStates[0]}</span>
                <button
                  onClick={() => {
                    console.log('Removing state:', selectedStates[0])
                    updateSelectedStates([])
                  }}
                  className="ml-2 text-gray-300 hover:text-white"
                >
                  ×
                </button>
              </div>
            ) : (
              <p className="text-gray-500 italic">No state selected</p>
            )}
          </div>

          {/* Available States to Select */}
          <div className="flex flex-wrap gap-2">
            {(['Delaware', 'Illinois', 'Indiana', 'Kentucky', 'Maryland', 'Michigan', 'New Jersey', 'North Carolina', 'Ohio', 'Pennsylvania', 'Tennessee', 'Virginia', 'West Virginia', 'District of Columbia'] as const)
              .map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    console.log('Selecting state:', state)
                    updateSelectedStates([state])
                  }}
                  disabled={selectedStates.includes(state)}
                  className={`px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                    selectedStates.includes(state)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  {state}
                </button>
              ))
            }
          </div>
        </div>

        {/* Energy Snapshot Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Energy Snapshot (60%) */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Energy Snapshot</h3>
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
              {capacityTrendsLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : capacityTrends?.chartData ? (
                <div className="h-48">
                  {/* Chart Container */}
                  <div className="relative h-full">
                    {/* Y-Axis Label */}
                    <div className="absolute left-0 top-1/2 transform -rotate-90 -translate-y-1/2 -translate-x-6">
                      <span className="text-sm font-medium text-gray-700">Total MW Capacity</span>
                    </div>
                    
                    {/* Chart Area */}
                    <div className="ml-12 mr-4 h-full">
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
                              <div className="w-10 flex flex-col justify-between text-right pr-2" style={{ height: `${chartHeight}px` }}>
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
                            
                            {/* X-Axis Label */}
                            <div className="text-center mt-2 ml-10">
                              <span className="text-sm font-medium text-gray-700">Year</span>
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

          {/* Right Side - Interactive Map (40%) */}
          <div className="lg:col-span-2 bg-gray-900 rounded-2xl overflow-hidden">
            <div className="p-4">
              <h3 className="text-white font-semibold">Interactive map</h3>
              <p className="text-gray-400 text-sm">
                {selectedStates.length > 0 
                  ? `Generators in ${selectedStates[0]}` 
                  : 'Select a state to view generators'
                }
              </p>
            </div>
            <div className="h-96 bg-gray-100 rounded-b-2xl overflow-hidden">
              <SimpleUSMap 
                height="100%" 
                width="100%" 
                selectedState={selectedStates[0] || undefined}
              />
            </div>
            <div className="p-4 space-y-2">
              <h4 className="text-white text-sm font-medium mb-2">Technology Breakdown</h4>
              {generators.length > 0 ? Object.entries(
                generators.reduce((acc, gen) => {
                  const tech = gen.technology || 'Other'
                  acc[tech] = (acc[tech] || 0) + (gen.capacity?.nameplate || 0)
                  return acc
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
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
                    <div key={tech} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${colors[tech] || colors.Other}`} />
                        <span className="text-gray-300 text-sm">{tech}</span>
                      </div>
                      <span className="text-white text-sm font-medium">
                        {Math.round(capacity).toLocaleString()} MW
                      </span>
                    </div>
                  )
                }) : (
                  <div className="text-center py-4">
                    <div className="animate-pulse">
                      <div className="h-3 bg-gray-600 rounded w-20 mb-2 mx-auto"></div>
                      <div className="h-3 bg-gray-600 rounded w-16 mb-2 mx-auto"></div>
                      <div className="h-3 bg-gray-600 rounded w-24 mx-auto"></div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Latest News Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Latest News</h3>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <div className="w-2 h-2 bg-gray-300 rounded-full" />
                <div className="w-2 h-2 bg-gray-300 rounded-full" />
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Policy', 'Indiana income', 'Energy target', 'Policy'].map((title, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="h-48 bg-gray-200 rounded-lg mb-3 group-hover:bg-gray-300 transition-colors" />
                <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600">{title}</h4>
                <p className="text-sm text-gray-600">9 Dec, 2024 | CNN</p>
              </div>
            ))}
          </div>
        </div>

        {/* Energy Buyers Section */}
        <div className="bg-gray-50 -mx-6 px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Energy Buyers</h2>
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

            {/* Filter Tags */}
            <div className="flex justify-center space-x-6 mb-10">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-gray-700">INVESTOR OWNED</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-gray-700">COOPERATIVES</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-gray-700">MUNICIPALITIES</span>
              </div>
            </div>

            {/* Company Bubble Visualization */}
            <div className="relative h-96 mb-10 bg-gray-50 rounded-lg p-4">
              {dashboardData.loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading utility companies...</p>
                  </div>
                </div>
              ) : dashboardData.utilities && dashboardData.utilities.length > 0 ? (
                <div className="relative w-full h-full">
                  {dashboardData.utilities
                    .sort((a, b) => (b.peakLoad || b.totalCapacity || 0) - (a.peakLoad || a.totalCapacity || 0))
                    .slice(0, 5)
                    .map((utility, index) => {
                      const sizes = ['w-48 h-48', 'w-40 h-40', 'w-32 h-32', 'w-28 h-28', 'w-24 h-24']
                      const positions = [
                        'left-[20%] top-[20%]', 
                        'right-[20%] top-[20%]', 
                        'left-[30%] bottom-[20%]',
                        'right-[30%] bottom-[20%]',
                        'left-[50%] top-[50%]'
                      ]
                      
                      return (
                        <div
                          key={utility.id || index}
                          className={`absolute ${positions[index]} transform -translate-x-1/2 -translate-y-1/2`}
                        >
                          <div
                            className={`${sizes[index]} bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center justify-center p-4 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer`}
                            onClick={() => {
                              console.log('Selected utility for analysis:', utility)
                              setSelectedUtilityAnalysis(utility)
                              setActiveView('utility-analysis')
                            }}
                          >
                            {index === 0 && (
                              <span className="text-xs text-gray-500 uppercase mb-2">Largest company</span>
                            )}
                            <h4 className={`${index < 2 ? 'text-base' : 'text-sm'} font-bold text-gray-900 text-center mb-2 leading-tight`}>
                              {utility.name || `Utility ${index + 1}`}
                            </h4>
                            <p className="text-xs text-gray-600 text-center">
                              {utility.totalCapacity ? 
                                `${Math.round(utility.totalCapacity).toLocaleString()} MW` :
                                `Capacity: ${Math.floor(Math.random() * 5000 + 1000)} MW`
                              }
                            </p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : selectedStates.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No States Selected</h3>
                    <p className="text-gray-600">Select states above to view energy buyers</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Utilities Found</h3>
                    <p className="text-gray-600">No utility companies found for the selected states</p>
                    <p className="text-sm text-gray-500 mt-2">Try selecting different states or check back later</p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <button 
                className="px-8 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!dashboardData.utilities || dashboardData.utilities.length === 0}
                onClick={() => {
                  const topUtility = dashboardData.utilities?.[0]
                  if (topUtility) {
                    console.log('Analyzing top utility:', topUtility)
                    setSelectedUtilityAnalysis(topUtility)
                    setActiveView('utility-analysis')
                  } else {
                    alert('No utilities available to analyze. Please select states first.')
                  }
                }}
              >
                {dashboardData.utilities && dashboardData.utilities.length > 0 ? 'ANALYSE BUYER' : 'SELECT STATES FIRST'}
              </button>
            </div>
          </div>
        </div>
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