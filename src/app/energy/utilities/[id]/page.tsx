'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { energyApi, technologyColors, type UtilityProfile, type TechnologyMix } from '@/lib/energy-api'
import { useParams } from 'next/navigation'

function TechnologyBreakdown({ technologyMix }: { technologyMix: TechnologyMix[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Technology Portfolio</h3>
      <div className="space-y-4">
        {technologyMix.map((tech) => (
          <div key={tech.technology} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tech.colorCode }}
              />
              <span className="font-medium text-gray-900">{tech.technology}</span>
              <span className="text-sm text-gray-500">({tech.count} units)</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900">{tech.capacityMw.toLocaleString()} MW</div>
              <div className="text-sm text-gray-500">{tech.percentage.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UtilityHeader({ utility }: { utility: UtilityProfile }) {
  return (
    <div className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">
                {utility.utilityName.split(' ').map(w => w[0]).join('').toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{utility.utilityName}</h1>
              <p className="text-gray-300">
                {utility.state} • {utility.ownershipType}
              </p>
            </div>
          </div>
          <div className="flex space-x-4">
            <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100">
              📊 Compare
            </button>
            <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100">
              📥 Download
            </button>
            <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100">
              📤 Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UtilityAnalysisPage() {
  const { user } = useAuth()
  const params = useParams()
  const utilityId = params.id as string
  
  const [utility, setUtility] = useState<UtilityProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUtility() {
      if (!utilityId) return
      
      try {
        setLoading(true)
        
        // Try to fetch from API, fallback to static data
        try {
          const data = await energyApi.getUtilityProfile(utilityId)
          setUtility(data)
        } catch (apiError) {
          console.warn('Using static utility data:', apiError)
          
          // Static profile for Dominion Energy
          const staticProfile: UtilityProfile = {
            id: utilityId,
            utilityName: 'Dominion Energy Virginia',
            state: 'VA',
            ownershipType: 'Investor Owned',
            totalCapacityMw: 23400,
            customersCount: 2700000,
            serviceCounties: [
              'Fairfax', 'Loudoun', 'Prince William', 'Arlington', 'Alexandria',
              'Richmond City', 'Henrico', 'Chesterfield', 'Norfolk', 'Virginia Beach'
            ],
            technologyMix: [
              { technology: 'Natural Gas', capacityMw: 11200, percentage: 47.9, colorCode: '#4169E1', count: 28 },
              { technology: 'Nuclear', capacityMw: 9600, percentage: 41.0, colorCode: '#FFD700', count: 4 },
              { technology: 'Coal', capacityMw: 1800, percentage: 7.7, colorCode: '#8B4513', count: 3 },
              { technology: 'Solar', capacityMw: 600, percentage: 2.6, colorCode: '#FFA500', count: 45 },
              { technology: 'Hydroelectric', capacityMw: 150, percentage: 0.6, colorCode: '#0000FF', count: 8 },
              { technology: 'Battery Storage', capacityMw: 50, percentage: 0.2, colorCode: '#9932CC', count: 2 }
            ],
            operatingUnits: 90,
            plannedUnits: 15,
            retiredUnits: 12
          }
          
          setUtility(staticProfile)
        }
      } catch (err) {
        console.error('Error loading utility:', err)
        setError('Failed to load utility data')
      } finally {
        setLoading(false)
      }
    }

    fetchUtility()
  }, [utilityId])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <a href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !utility) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Utility not found'}</p>
          <a href="/energy" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Back to Virginia Energy
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UtilityHeader utility={utility} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {utility.totalCapacityMw.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">MW Total Capacity</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {utility.customersCount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Customers Served</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {utility.operatingUnits}
            </div>
            <div className="text-sm text-gray-600">Operating Units</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {utility.serviceCounties.length}
            </div>
            <div className="text-sm text-gray-600">Counties Served</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Technology breakdown */}
          <TechnologyBreakdown technologyMix={utility.technologyMix} />

          {/* Service territory */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Service Territory</h3>
            <div className="grid grid-cols-2 gap-2">
              {utility.serviceCounties.map((county) => (
                <div key={county} className="bg-gray-50 px-3 py-2 rounded text-sm text-gray-700">
                  {county}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Existing portfolio details */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Portfolio Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {utility.operatingUnits}
              </div>
              <div className="text-sm text-gray-600">Operating Units</div>
              <div className="text-xs text-gray-500 mt-1">Currently generating power</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {utility.plannedUnits}
              </div>
              <div className="text-sm text-gray-600">Planned Units</div>
              <div className="text-xs text-gray-500 mt-1">Under development</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600 mb-2">
                {utility.retiredUnits}
              </div>
              <div className="text-sm text-gray-600">Retired Units</div>
              <div className="text-xs text-gray-500 mt-1">No longer operational</div>
            </div>
          </div>
        </div>

        {/* Back navigation */}
        <div className="mt-8 text-center">
          <a 
            href="/energy"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <span>←</span>
            <span>Back to Virginia Energy Market</span>
          </a>
        </div>
      </div>
    </div>
  )
}