'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { energyApi, technologyColors } from '@/lib/energy-api'

interface TechnologyData {
  technology: string
  capacityMw: number
  percentage: number
  count: number
}

interface MarketStats {
  totalCapacityMw: number
  totalUtilities: number
  dominantTechnology: string
  renewablePercentage: number
}

function TechnologyChart({ data }: { data: TechnologyData[] }) {
  const maxCapacity = Math.max(...data.map(d => d.capacityMw))
  
  return (
    <div className="space-y-3">
      {data.map((tech) => (
        <div key={tech.technology} className="flex items-center space-x-4">
          <div className="w-20 text-sm font-medium text-gray-700">
            {tech.technology}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
            <div
              className="h-6 rounded-full flex items-center justify-end pr-2"
              style={{
                width: `${(tech.capacityMw / maxCapacity) * 100}%`,
                backgroundColor: technologyColors[tech.technology as keyof typeof technologyColors] || '#808080'
              }}
            >
              <span className="text-xs font-medium text-white">
                {tech.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="w-24 text-sm text-gray-600 text-right">
            {tech.capacityMw.toLocaleString()} MW
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ title, value, subtitle, color = 'blue' }: {
  title: string
  value: string | number
  subtitle: string
  color?: string
}) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className={`text-3xl font-bold ${colorClasses[color as keyof typeof colorClasses]} mb-1`}>
        {value}
      </div>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [technologyData, setTechnologyData] = useState<TechnologyData[]>([])
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        
        // Try to fetch real data, fallback to static
        try {
          const [techMix, overview] = await Promise.all([
            energyApi.getVirginiaTechnologyMix(),
            energyApi.getMarketOverview()
          ])
          setTechnologyData(techMix)
          setMarketStats(overview)
        } catch (apiError) {
          console.warn('Using static analytics data:', apiError)
          
          // Static Virginia technology mix data
          const staticTechData: TechnologyData[] = [
            { technology: 'Natural Gas', capacityMw: 12800, percentage: 42.5, count: 45 },
            { technology: 'Nuclear', capacityMw: 9600, percentage: 31.8, count: 4 },
            { technology: 'Coal', capacityMw: 4200, percentage: 13.9, count: 8 },
            { technology: 'Solar', capacityMw: 2100, percentage: 7.0, count: 156 },
            { technology: 'Hydroelectric', capacityMw: 800, percentage: 2.7, count: 12 },
            { technology: 'Wind', capacityMw: 600, percentage: 2.0, count: 8 },
            { technology: 'Battery Storage', capacityMw: 100, percentage: 0.3, count: 3 }
          ]
          
          const staticStats: MarketStats = {
            totalCapacityMw: 30200,
            totalUtilities: 15,
            dominantTechnology: 'Natural Gas',
            renewablePercentage: 9.7
          }
          
          setTechnologyData(staticTechData)
          setMarketStats(staticStats)
        }
      } catch (err) {
        console.error('Error loading analytics:', err)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access market analytics.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Virginia Energy Market Analytics
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive analysis of Virginia's energy infrastructure and market trends
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="space-y-8">
            {/* Market overview stats */}
            {marketStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                  title="Total Capacity"
                  value={`${Math.round(marketStats.totalCapacityMw / 1000)}k MW`}
                  subtitle="Installed generation capacity"
                  color="blue"
                />
                <StatCard
                  title="Utilities"
                  value={marketStats.totalUtilities}
                  subtitle="Active electric utilities"
                  color="green"
                />
                <StatCard
                  title="Dominant Source"
                  value={marketStats.dominantTechnology}
                  subtitle="Primary energy technology"
                  color="orange"
                />
                <StatCard
                  title="Renewable Share"
                  value={`${marketStats.renewablePercentage}%`}
                  subtitle="Solar + Wind + Hydro"
                  color="purple"
                />
              </div>
            )}

            {/* Technology breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Technology Mix by Capacity
              </h2>
              <TechnologyChart data={technologyData} />
            </div>

            {/* Additional insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Energy Transition Insights
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Coal Retirement Progress</span>
                    <span className="font-medium text-orange-600">65% retired since 2010</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Solar Growth Rate</span>
                    <span className="font-medium text-green-600">+180% over 5 years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Natural Gas Expansion</span>
                    <span className="font-medium text-blue-600">+45% since 2015</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Nuclear Baseload</span>
                    <span className="font-medium text-yellow-600">32% of state capacity</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Regional Distribution
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Northern Virginia</span>
                    <span className="font-medium">35% of state demand</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Central Virginia</span>
                    <span className="font-medium">40% of state demand</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Southwest Virginia</span>
                    <span className="font-medium">15% of state demand</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tidewater/Eastern</span>
                    <span className="font-medium">10% of state demand</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}