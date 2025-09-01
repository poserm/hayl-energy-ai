'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { clsx } from 'clsx'
import { Utility, UtilityType } from '@/types/energy'
import { virginiaUtilities, virginiaUtils } from '@/data/virginia-utilities'
import UtilityCard from './UtilityCard'
import FilterTabs from './FilterTabs'
import { InlineLoader } from '@/components/ui/LoadingSpinner'
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

interface UtilityGridProps {
  utilities?: Utility[]
  loading?: boolean
  onUtilityAnalyze?: (utility: Utility) => void
  onUtilityCompare?: (utility: Utility) => void
  showFilters?: boolean
  compact?: boolean
  className?: string
}

const UtilityGrid: React.FC<UtilityGridProps> = ({
  utilities = virginiaUtilities,
  loading = false,
  onUtilityAnalyze,
  onUtilityCompare,
  showFilters = true,
  compact = false,
  className,
}) => {
  const [activeFilter, setActiveFilter] = useState<UtilityType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'capacity' | 'customers'>('capacity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter and sort utilities
  const filteredAndSortedUtilities = useMemo(() => {
    let filtered = utilities

    // Apply type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(utility => utility.type === activeFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(utility =>
        utility.name.toLowerCase().includes(query) ||
        utility.region.toLowerCase().includes(query) ||
        utility.serviceTerritory.counties.some(county => 
          county.toLowerCase().includes(query)
        )
      )
    }

    // Sort utilities
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'capacity':
          comparison = a.totalCapacity - b.totalCapacity
          break
        case 'customers':
          comparison = a.customerCount - b.customerCount
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [utilities, activeFilter, searchQuery, sortBy, sortOrder])

  // Calculate utility counts by type
  const utilityCounts = useMemo(() => {
    const counts = {
      all: utilities.length,
      [UtilityType.INVESTOR_OWNED]: virginiaUtils.getUtilitiesByType(UtilityType.INVESTOR_OWNED).length,
      [UtilityType.COOPERATIVE]: virginiaUtils.getUtilitiesByType(UtilityType.COOPERATIVE).length,
      [UtilityType.MUNICIPAL]: virginiaUtils.getUtilitiesByType(UtilityType.MUNICIPAL).length,
    }
    return counts
  }, [utilities])

  if (loading) {
    return <InlineLoader message="Loading Virginia utilities..." />
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          <FilterTabs
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            utilityCounts={utilityCounts}
          />
          
          {/* Search and sort controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search utilities, regions, or counties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'capacity' | 'customers')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="capacity">Sort by Capacity</option>
                <option value="customers">Sort by Customers</option>
                <option value="name">Sort by Name</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-primary-500"
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredAndSortedUtilities.length} of {utilities.length} utilities
          {activeFilter !== 'all' && ` • Filtered by ${activeFilter.replace('_', ' ')}`}
          {searchQuery && ` • Search: "${searchQuery}"`}
        </p>
        
        {filteredAndSortedUtilities.length > 0 && (
          <div className="text-sm text-gray-500">
            Total Capacity: {filteredAndSortedUtilities.reduce((sum, u) => sum + u.totalCapacity, 0).toLocaleString()} MW
          </div>
        )}
      </div>

      {/* Utility grid */}
      {filteredAndSortedUtilities.length === 0 ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No utilities found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? `No utilities match your search "${searchQuery}"`
              : 'No utilities match your current filters'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div
          className={clsx(
            compact
              ? 'space-y-3'
              : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {filteredAndSortedUtilities.map((utility) => (
            <UtilityCard
              key={utility.id}
              utility={utility}
              compact={compact}
              onAnalyze={onUtilityAnalyze}
              onCompare={onUtilityCompare}
            />
          ))}
        </div>
      )}

      {/* Virginia energy market summary */}
      {!searchQuery && activeFilter === 'all' && (
        <div className="mt-8 bg-primary-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">
            Virginia Energy Market Overview
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-primary-800">Total Installed Capacity</p>
              <p className="text-2xl font-bold text-primary-900">27.3 GW</p>
            </div>
            <div>
              <p className="font-medium text-primary-800">Total Customers Served</p>
              <p className="text-2xl font-bold text-primary-900">3.6M</p>
            </div>
            <div>
              <p className="font-medium text-primary-800">Clean Energy Target</p>
              <p className="text-2xl font-bold text-primary-900">100%</p>
              <p className="text-xs text-primary-700">by 2045</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UtilityGrid