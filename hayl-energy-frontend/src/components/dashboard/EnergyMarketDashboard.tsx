'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { energyApi } from '@/lib/energy-api'
import { Utility } from '@/types/energy'
import { virginiaUtilities, virginiaEnergyOverview } from '@/data/virginia-utilities'
import UtilityGrid from './UtilityGrid'
import { FullScreenLoader, InlineLoader } from '@/components/ui/LoadingSpinner'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import {
  MapPinIcon,
  ChartBarIcon,
  BoltIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'

interface EnergyMarketDashboardProps {
  region?: string
}

const EnergyMarketDashboard: React.FC<EnergyMarketDashboardProps> = ({
  region = 'virginia'
}) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [utilities, setUtilities] = useState<Utility[]>(virginiaUtilities)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUtilities, setSelectedUtilities] = useState<Set<string>>(new Set())

  // Load utilities data
  useEffect(() => {
    const loadUtilities = async () => {
      if (!isAuthenticated) return
      
      setLoading(true)
      setError(null)

      try {
        let response
        if (region === 'virginia') {
          response = await energyApi.getVirginiaUtilities()
        } else {
          response = await energyApi.getAllUtilities()
        }

        if (response.success) {
          setUtilities(response.data)
        } else {
          // Fall back to static data
          console.warn('API call failed, using static data:', response.error)
          setUtilities(virginiaUtilities)
        }
      } catch (err) {
        console.warn('Failed to load utilities, using static data:', err)
        setUtilities(virginiaUtilities)
      } finally {
        setLoading(false)
      }
    }

    loadUtilities()
  }, [isAuthenticated, region])

  const handleUtilityAnalyze = (utility: Utility) => {
    // Navigation handled by Link in UtilityCard
    console.log('Analyzing utility:', utility.name)
  }

  const handleUtilityCompare = (utility: Utility) => {
    setSelectedUtilities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(utility.id)) {
        newSet.delete(utility.id)
      } else if (newSet.size < 4) { // Limit to 4 utilities for comparison
        newSet.add(utility.id)
      } else {
        setError('You can compare up to 4 utilities at once.')
        setTimeout(() => setError(null), 3000)
      }
      return newSet
    })
  }

  const clearSelection = () => {
    setSelectedUtilities(new Set())
  }

  const navigateToComparison = () => {
    const utilityIds = Array.from(selectedUtilities)
    const searchParams = new URLSearchParams({ utilities: utilityIds.join(',') })
    window.location.href = `/compare?${searchParams.toString()}`
  }

  // Calculate summary statistics
  const totalCapacity = utilities.reduce((sum, u) => sum + u.totalCapacity, 0)
  const totalCustomers = utilities.reduce((sum, u) => sum + u.customerCount, 0)

  if (authLoading) {
    return <FullScreenLoader message="Loading energy market data..." />
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <BoltIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Sign in to access energy market data
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Get comprehensive insights into Virginia's energy utilities and market analysis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Virginia Energy Market Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Welcome back, {user?.name || 'Energy Analyst'}
            </p>
            <p className="text-sm text-gray-500">
              Comprehensive intelligence for Virginia's energy utilities and market trends
            </p>
          </div>
          <div className="hidden md:block">
            <MapPinIcon className="h-16 w-16 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BoltIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {(totalCapacity / 1000).toFixed(1)} GW
              </p>
              <p className="text-sm text-gray-600">Total Capacity</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-secondary-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {(totalCustomers / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-gray-600">Customers Served</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-accent-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{utilities.length}</p>
              <p className="text-sm text-gray-600">Utilities Tracked</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">100%</p>
              <p className="text-sm text-gray-600">Carbon-Free by 2045</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <Alert
          type="error"
          message={error}
          dismissible
          onDismiss={() => setError(null)}
        />
      )}

      {/* Comparison selection bar */}
      {selectedUtilities.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DocumentChartBarIcon className="h-6 w-6 text-primary-600" />
              <div>
                <p className="font-medium text-primary-900">
                  {selectedUtilities.size} utilities selected for comparison
                </p>
                <p className="text-sm text-primary-700">
                  Compare capacity, technology mix, service areas, and more
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
              >
                Clear
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={navigateToComparison}
                disabled={selectedUtilities.size < 2}
              >
                Compare {selectedUtilities.size > 1 ? `${selectedUtilities.size} ` : ''}Utilities
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Utilities grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Virginia Utilities</h2>
          <p className="text-sm text-gray-600">
            Explore utilities by ownership type, capacity, and service territory
          </p>
        </div>
        
        <UtilityGrid
          utilities={utilities}
          loading={loading}
          onUtilityAnalyze={handleUtilityAnalyze}
          onUtilityCompare={handleUtilityCompare}
          showFilters={true}
        />
      </div>

      {/* Quick insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Highlights</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <span>Dominion Energy Virginia serves 2.7M customers with 23.4 GW capacity</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-secondary-600 rounded-full mt-2"></div>
              <span>Virginia Clean Economy Act targets 100% carbon-free electricity by 2045</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-accent-600 rounded-full mt-2"></div>
              <span>2.6 GW Coastal Virginia Offshore Wind project under construction</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
              <span>Coal plant retirements accelerating across the state</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              icon={<ChartBarIcon className="h-4 w-4" />}
              onClick={() => window.location.href = '/analytics'}
            >
              View Market Analytics
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              icon={<MapPinIcon className="h-4 w-4" />}
              onClick={() => window.location.href = '/dashboard/utilities/virginia'}
            >
              Explore Virginia Map
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              icon={<DocumentChartBarIcon className="h-4 w-4" />}
              onClick={() => window.location.href = '/compare'}
            >
              Compare Utilities
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnergyMarketDashboard