'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEnergyDashboard } from '@/hooks/useEnergyDashboard'
import StateSelector from '@/components/ui/StateSelector'
import EnergyChart from '@/components/ui/EnergyChart'
import MetricCard from '@/components/ui/MetricCard'
import Image from 'next/image'

export default function DashboardPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  
  const {
    selectedStates,
    updateSelectedStates,
    dashboardData,
    refreshData,
    getCapacityChartData,
    getTechnologyChartData,
    getStateMetrics
  } = useEnergyDashboard(['Virginia'])

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
    <div className="dashboard-container">
      <div className="relative z-10">
        {/* Floating Header */}
        <header className="floating-header">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <Image
                  src="/hayl-logo-new.svg"
                  alt="Hayl Energy AI"
                  width={48}
                  height={48}
                  className="rounded-xl shadow-lg"
                />
                <div>
                  <h1 className="section-header text-3xl">Energy Market Intelligence</h1>
                  <p className="text-gray-600 text-lg font-medium">Multi-state energy data analytics platform</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full pulsing-dot"></div>
                  <span className="text-gray-700 font-semibold">
                    {user.name || user.email.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold transition-all duration-300 border border-red-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-12">
        
          {/* Hero Section */}
          <div className="glassmorphism rounded-3xl p-12 mb-12 text-center">
            <h2 className="section-header text-5xl mb-6">
              Multi-State Energy Intelligence
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover comprehensive energy market insights across multiple states with real-time data analytics and AI-powered intelligence.
            </p>
            <button
              onClick={refreshData}
              disabled={dashboardData.loading}
              className="btn-primary-modern inline-flex items-center space-x-3"
            >
              {dashboardData.loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Refreshing Intelligence...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Market Data</span>
                </>
              )}
            </button>
          </div>

          {/* State Selection Section */}
          <div className="glassmorphism rounded-3xl p-8 mb-12">
            <h3 className="section-header text-3xl mb-8 text-center">Select States for Analysis</h3>
            <StateSelector
              selectedStates={selectedStates}
              onStatesChange={updateSelectedStates}
            />
          </div>

          {/* Key Metrics */}
          <div className="glassmorphism rounded-3xl p-8 mb-12">
            <h3 className="section-header text-3xl mb-8 text-center">Market Overview</h3>
            <div className="dashboard-grid">
              <MetricCard
                title="States"
                value={metrics.selectedStatesCount}
                color="blue"
                className="metric-card-modern"
                trend={{ value: 12, direction: 'up' }}
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                }
              />
              <MetricCard
                title="Utilities"
                value={metrics.totalUtilities}
                color="green"
                className="metric-card-modern"
                trend={{ value: 8, direction: 'up' }}
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
              <MetricCard
                title="Total Capacity"
                value={metrics.totalCapacity}
                unit="MW"
                color="yellow"
                className="metric-card-modern"
                trend={{ value: 15, direction: 'up' }}
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
              <MetricCard
                title="Customers"
                value={metrics.totalCustomers}
                color="purple"
                className="metric-card-modern"
                trend={{ value: 5, direction: 'up' }}
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
              <MetricCard
                title="Avg Capacity"
                value={Math.round(metrics.avgCapacity)}
                unit="MW"
                color="gray"
                className="metric-card-modern"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* State Selection */}
          <div className="glassmorphism rounded-3xl p-8 mb-12">
            <h3 className="section-header text-3xl mb-8 text-center">State Selection & Control Center</h3>
            <StateSelector
              selectedStates={selectedStates}
              onStatesChange={updateSelectedStates}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            <div className="chart-container">
              <EnergyChart
                data={capacityData}
                title="Utility Capacity Comparison"
                type="bar"
                height={400}
              />
            </div>
            <div className="chart-container">
              <EnergyChart
                data={technologyData}
                title="Technology Mix Distribution"
                type="donut"
                height={400}
              />
            </div>
          </div>

          {/* Utilities Gallery */}
          <div className="glassmorphism rounded-3xl p-8 mb-12">
            <h3 className="section-header text-3xl mb-8 text-center">
              Utility Intelligence Network ({dashboardData.utilities.length})
            </h3>
            {dashboardData.loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <svg className="animate-spin h-16 w-16 text-purple-600 mx-auto mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-xl font-bold gradient-text">Loading utility intelligence...</p>
                  <div className="loading-shimmer h-4 w-64 mx-auto mt-4 rounded"></div>
                </div>
              </div>
            ) : dashboardData.utilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {dashboardData.utilities.map((utility) => (
                  <div
                    key={utility.id}
                    onClick={() => router.push(`/energy/utilities/${utility.id}`)}
                    className="utility-card-clickable rounded-2xl p-8 group"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {utility.utilityName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="state-tag px-3 py-1 rounded-full text-sm font-bold">
                          {utility.state}
                        </span>
                      </div>
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    
                    <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      {utility.utilityName}
                    </h4>
                    <p className="text-gray-600 mb-4 font-medium">
                      {utility.ownershipType}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600 animated-counter">
                          {(utility.nameplateCapacityMw / 1000).toFixed(1)}K
                        </div>
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                          MW Capacity
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <div className="text-2xl font-bold text-green-600 animated-counter">
                          {(utility.customersCount / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                          Customers
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Service Territory:</span>
                      <span className="font-semibold text-gray-700">
                        {Array.isArray(utility.serviceTerritory) 
                          ? `${utility.serviceTerritory.length} regions`
                          : utility.serviceTerritory}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="glassmorphism rounded-2xl p-12 max-w-md mx-auto">
                  <svg className="mx-auto h-20 w-20 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <h4 className="text-2xl font-bold text-gray-700 mb-3">No States Selected</h4>
                  <p className="text-gray-500 text-lg">Choose states above to explore energy market intelligence</p>
                </div>
              </div>
            )}
          </div>

        {dashboardData.error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-800">Data Loading Error</h4>
                <p className="text-sm text-red-700">{dashboardData.error}</p>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  )
}