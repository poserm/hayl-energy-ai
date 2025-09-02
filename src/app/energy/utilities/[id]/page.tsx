'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { energyApi } from '@/lib/energy-api'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import EnergyChart from '@/components/ui/EnergyChart'
import MetricCard from '@/components/ui/MetricCard'

interface UtilityDetailData {
  utility: any | null
  generators: any[]
  loading: boolean
  error: string | null
}

export default function UtilityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<UtilityDetailData>({
    utility: null,
    generators: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (params?.id && user) {
      fetchUtilityData(params.id as string)
    }
  }, [params?.id, user, authLoading, router])

  const fetchUtilityData = async (utilityId: string) => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Get comprehensive utility profile from Prisma
      const [profile, generators] = await Promise.all([
        energyApi.getUtilityProfile(utilityId),
        energyApi.getGeneratorsFromPrisma({ utility: utilityId.split('_')[0] })
      ])
      
      setData({
        utility: profile,
        generators: generators.generators || [],
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Failed to fetch utility data:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Utility not found or failed to load data'
      }))
    }
  }

  if (authLoading || data.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg font-medium text-gray-700">Loading utility details...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (data.error || !data.utility) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center max-w-md">
          <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Utility Not Found</h2>
          <p className="text-gray-600 mb-6">{data.error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { utility } = data
  const utilityInfo = utility.utility_info || utility
  const portfolio = utility.energy_portfolio || {}
  const technologyMix = portfolio.technologyMix || utility.technologyMix || []
  const facilities = utility.facilities || []
  const serviceTerritory = utility.service_territory || utility.serviceCounties || []
  const operationalMetrics = utility.operational_metrics
  const customerMetrics = utility.customer_metrics

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Dashboard</span>
              </Link>
              <div className="text-gray-300">/</div>
              <h1 className="text-xl font-semibold text-gray-900">
                {utilityInfo.utilityName || utilityInfo.utility_name}
              </h1>
            </div>
            <Image
              src="/hayl-logo-new.svg"
              alt="Hayl Energy AI"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Utility Overview */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
              {(utilityInfo.utilityName || utilityInfo.utility_name || 'UN')
                .split(' ')
                .map((w: string) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {utilityInfo.utilityName || utilityInfo.utility_name}
            </h2>
            <div className="flex items-center justify-center space-x-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {utilityInfo.state}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {utilityInfo.ownershipType || utilityInfo.ownership_type}
              </span>
              {portfolio.cleanEnergyPercentage && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {Math.round(portfolio.cleanEnergyPercentage)}% Clean Energy
                </span>
              )}
            </div>
          </div>
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Capacity"
              value={utilityInfo.totalCapacityMw || utilityInfo.nameplateCapacityMw || 0}
              unit="MW"
              color="blue"
              className="bg-white rounded-xl shadow-sm border border-gray-200"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
            <MetricCard
              title="Generation Units"
              value={utilityInfo.totalGenerators || data.generators.length}
              color="green"
              className="bg-white rounded-xl shadow-sm border border-gray-200"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
            <MetricCard
              title="Power Plants"
              value={utilityInfo.totalPlants || facilities.length}
              color="purple"
              className="bg-white rounded-xl shadow-sm border border-gray-200"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
            <MetricCard
              title="Counties Served"
              value={utilityInfo.countiesServed || serviceTerritory.length}
              color="orange"
              className="bg-white rounded-xl shadow-sm border border-gray-200"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Customer & Financial Metrics */}
        {customerMetrics && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer & Financial Metrics ({customerMetrics.year})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Customers"
                value={customerMetrics.totalCustomers}
                color="blue"
                className="bg-gray-50 rounded-xl p-4"
              />
              <MetricCard
                title="Total Sales"
                value={Math.round(customerMetrics.totalSalesMwh)}
                unit="MWh"
                color="green"
                className="bg-gray-50 rounded-xl p-4"
              />
              <MetricCard
                title="Total Revenue"
                value={Math.round(customerMetrics.totalRevenueMillion)}
                unit="$M"
                color="purple"
                className="bg-gray-50 rounded-xl p-4"
              />
              <MetricCard
                title="Avg Revenue/Customer"
                value={Math.round(customerMetrics.totalRevenueMillion * 1000000 / customerMetrics.totalCustomers)}
                unit="$/yr"
                color="orange"
                className="bg-gray-50 rounded-xl p-4"
              />
            </div>

            {/* Customer Sector Breakdown */}
            {customerMetrics.sectors && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-800 mb-4">Customer Sectors</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(customerMetrics.sectors).map(([sector, data]: [string, any]) => (
                    <div key={sector} className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 capitalize mb-2">{sector}</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Customers:</span>
                          <span className="font-medium">{data.customers.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sales:</span>
                          <span className="font-medium">{Math.round(data.salesMwh).toLocaleString()} MWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Revenue:</span>
                          <span className="font-medium">${Math.round(data.revenueMillion)}M</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Operational Metrics */}
        {operationalMetrics && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Operational Metrics ({operationalMetrics.year})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Summer Peak Demand"
                value={Math.round(operationalMetrics.summerPeakDemandMw)}
                unit="MW"
                color="red"
                className="bg-gray-50 rounded-xl p-4"
              />
              <MetricCard
                title="Winter Peak Demand"
                value={Math.round(operationalMetrics.winterPeakDemandMw)}
                unit="MW"
                color="blue"
                className="bg-gray-50 rounded-xl p-4"
              />
              <MetricCard
                title="Net Generation"
                value={Math.round(operationalMetrics.netGenerationMwh)}
                unit="MWh"
                color="green"
                className="bg-gray-50 rounded-xl p-4"
              />
              <MetricCard
                title="Operating Revenue"
                value={Math.round(operationalMetrics.totalRevenueMillion)}
                unit="$M"
                color="purple"
                className="bg-gray-50 rounded-xl p-4"
              />
            </div>
          </div>
        )}

        {/* Technology Portfolio */}
        {technologyMix.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <EnergyChart
                data={technologyMix.map((tech: any) => ({
                  label: tech.technology,
                  value: tech.capacityMw,
                  color: tech.colorCode
                }))}
                title="Technology Portfolio"
                type="donut"
                height={400}
              />
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technology Details</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {technologyMix.map((tech: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: tech.colorCode }}
                      ></div>
                      <div>
                        <div className="font-medium text-gray-900">{tech.technology}</div>
                        <div className="text-sm text-gray-600">
                          {tech.count} units • {tech.plantCount || 0} plants
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{tech.capacityMw} MW</div>
                      <div className="text-sm text-gray-600">{tech.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Energy Categories Summary */}
        {portfolio.energyCategories && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Energy Portfolio Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(portfolio.energyCategories).map(([category, data]: [string, any]) => (
                <div key={category} className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Math.round(data.percentage)}%
                  </div>
                  <div className="text-lg font-medium text-gray-900 capitalize mb-1">{category}</div>
                  <div className="text-sm text-gray-600">{Math.round(data.capacityMw)} MW</div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800 font-medium">
                  {Math.round(portfolio.cleanEnergyPercentage || 0)}% Clean Energy Portfolio
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Generation Facilities */}
        {facilities.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Major Generation Facilities</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Plant Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">County</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Capacity (MW)</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Units</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities.slice(0, 10).map((facility: any, index: number) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {facility.plantName || facility.plant_name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{facility.county}</td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-600">
                        {Math.round(facility.capacityMw || 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {facility.generatorCount || facility.generator_count}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {facility.location && facility.location.latitude ? 
                          `${facility.location.latitude.toFixed(2)}, ${facility.location.longitude.toFixed(2)}` : 
                          'N/A'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Service Territory */}
        {serviceTerritory.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Territory</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {serviceTerritory.map((territory: string, index: number) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {territory.replace(' County', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Generators Table */}
        {data.generators.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Individual Generators ({data.generators.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Plant</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Technology</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">County</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Capacity (MW)</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Online Year</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.generators.slice(0, 20).map((generator: any, index: number) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {generator.plantName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{generator.technology}</td>
                      <td className="py-3 px-4 text-gray-600">{generator.county}</td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-600">
                        {Math.round(generator.capacity.nameplate)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {generator.operatingYear || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          generator.status?.toLowerCase().includes('operating') || generator.status?.toLowerCase().includes('op') ? 
                            'bg-green-100 text-green-800' : 
                            generator.status?.toLowerCase().includes('planned') ? 
                              'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                        }`}>
                          {generator.status || 'Operating'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Capacity Development Timeline */}
        {utility.capacity_timeline && utility.capacity_timeline.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Capacity Development Timeline</h3>
            <div className="overflow-x-auto">
              <EnergyChart
                data={utility.capacity_timeline.map((timeline: any) => ({
                  label: timeline.year.toString(),
                  value: timeline.capacityAddedMw
                }))}
                title="Annual Capacity Additions"
                type="bar"
                height={300}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 inline-block">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
              <button 
                onClick={() => window.open(`/api/energy/utility-profile/${params?.id}`, '_blank')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Raw Data
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Compare Utilities
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}