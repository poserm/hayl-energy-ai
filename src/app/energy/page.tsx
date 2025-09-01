'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { energyApi, virginiaUtilitiesStatic, type UtilityData } from '@/lib/energy-api'

interface FilterTabsProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
}

function FilterTabs({ activeFilter, onFilterChange }: FilterTabsProps) {
  const filters = [
    { id: 'all', label: 'All Utilities' },
    { id: 'investor-owned', label: 'Investor Owned' },
    { id: 'cooperative', label: 'Cooperatives' },
    { id: 'municipal', label: 'Municipalities' }
  ]

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeFilter === filter.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

interface UtilityCardProps {
  utility: UtilityData
  onAnalyze: (utility: UtilityData) => void
}

function UtilityCard({ utility, onAnalyze }: UtilityCardProps) {
  const getCardSize = (scale: number) => {
    if (scale >= 90) return 'w-80 h-48'
    if (scale >= 70) return 'w-64 h-40'
    if (scale >= 60) return 'w-56 h-36'
    return 'w-48 h-32'
  }

  const getLogoSize = (scale: number) => {
    if (scale >= 90) return 'text-4xl'
    if (scale >= 70) return 'text-3xl'
    if (scale >= 60) return 'text-2xl'
    return 'text-xl'
  }

  return (
    <div className={`${getCardSize(utility.logoScale)} bg-white rounded-lg shadow-md border border-gray-200 p-6 flex flex-col justify-between hover:shadow-lg transition-shadow`}>
      <div className="flex-1 flex items-center justify-center">
        {/* Logo placeholder */}
        <div className={`${getLogoSize(utility.logoScale)} font-bold text-blue-600 text-center`}>
          {utility.utilityName.split(' ').map(word => word[0]).join('').toUpperCase()}
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <h3 className="font-semibold text-gray-900 text-sm mb-1">
          {utility.utilityName}
        </h3>
        <p className="text-xs text-gray-600 mb-2">
          {utility.sizeCategory}
        </p>
        <p className="text-xs text-gray-500 mb-3">
          {utility.nameplateCapacityMw.toLocaleString()} MW • {utility.customersCount.toLocaleString()} customers
        </p>
        
        <button
          onClick={() => onAnalyze(utility)}
          className="w-full bg-black text-white text-xs py-2 px-4 rounded-full hover:bg-gray-800 transition-colors"
        >
          ANALYSE UTILITY
        </button>
      </div>
    </div>
  )
}

export default function VirginiaEnergyPage() {
  const { user } = useAuth()
  const [utilities, setUtilities] = useState<UtilityData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    async function fetchUtilities() {
      try {
        setLoading(true)
        // Try to fetch from API, fallback to static data
        try {
          const data = await energyApi.getVirginiaUtilities()
          setUtilities(data)
        } catch (apiError) {
          console.warn('Using static data:', apiError)
          setUtilities(virginiaUtilitiesStatic)
        }
      } catch (err) {
        console.error('Error loading utilities:', err)
        setError('Failed to load utility data')
      } finally {
        setLoading(false)
      }
    }

    fetchUtilities()
  }, [])

  const filteredUtilities = utilities.filter(utility => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'investor-owned') return utility.ownershipType === 'Investor Owned'
    if (activeFilter === 'cooperative') return utility.ownershipType === 'Cooperative'
    if (activeFilter === 'municipal') return utility.ownershipType === 'Municipal'
    return true
  })

  const handleAnalyzeUtility = (utility: UtilityData) => {
    // Navigate to utility analysis page
    window.location.href = `/energy/utilities/${utility.id}`
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access Virginia energy market data.</p>
          <a href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Virginia Energy Market
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive analysis of Virginia's energy utilities and market dynamics. 
              Explore all energy sources and infrastructure across the Commonwealth.
            </p>
          </div>

          {/* State selector */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-600">🇺🇸</span>
              <span className="text-sm font-medium text-gray-900">Virginia</span>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button className="px-6 py-2 bg-white text-gray-900 rounded-md shadow-sm font-medium">
                Utilities
              </button>
              <button className="px-6 py-2 text-gray-600 hover:text-gray-900 rounded-md">
                Corporates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterTabs 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Utilities grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
              {filteredUtilities.map((utility) => (
                <UtilityCard
                  key={utility.id}
                  utility={utility}
                  onAnalyze={handleAnalyzeUtility}
                />
              ))}
            </div>

            {/* Summary stats */}
            <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Virginia Energy Market Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredUtilities.length}
                  </div>
                  <div className="text-sm text-gray-600">Utilities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(filteredUtilities.reduce((sum, u) => sum + u.nameplateCapacityMw, 0) / 1000)}k
                  </div>
                  <div className="text-sm text-gray-600">MW Capacity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(filteredUtilities.reduce((sum, u) => sum + u.customersCount, 0) / 1000000 * 10) / 10}M
                  </div>
                  <div className="text-sm text-gray-600">Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(filteredUtilities.flatMap(u => u.serviceTerritory)).size}
                  </div>
                  <div className="text-sm text-gray-600">Regions</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}