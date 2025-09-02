'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { energyApi, virginiaUtilitiesStatic } from '@/lib/energy-api'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import EnergyChart from '@/components/ui/EnergyChart'
import MetricCard from '@/components/ui/MetricCard'

interface UtilityDetailData {
  utility: any | null
  technologyMix: any[]
  loading: boolean
  error: string | null
}

export default function UtilityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<UtilityDetailData>({
    utility: null,
    technologyMix: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (params.id && user) {
      fetchUtilityData(params.id as string)
    }
  }, [params.id, user, authLoading, router])

  const fetchUtilityData = async (utilityId: string) => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Try API first, fallback to static data
      const profile = await energyApi.getUtilityProfile(utilityId).catch(() => {
        // Find static utility data
        const staticUtility = virginiaUtilitiesStatic.find(u => u.id === utilityId)
        if (staticUtility) {
          return {
            ...staticUtility,
            serviceCounties: Array.isArray(staticUtility.serviceTerritory) 
              ? staticUtility.serviceTerritory 
              : [staticUtility.serviceTerritory],
            technologyMix: [
              { technology: 'Natural Gas', capacityMw: Math.floor(staticUtility.nameplateCapacityMw * 0.45), percentage: 45, colorCode: '#4169E1', count: 12 },
              { technology: 'Nuclear', capacityMw: Math.floor(staticUtility.nameplateCapacityMw * 0.35), percentage: 35, colorCode: '#FFD700', count: 3 },
              { technology: 'Coal', capacityMw: Math.floor(staticUtility.nameplateCapacityMw * 0.15), percentage: 15, colorCode: '#8B4513', count: 2 },
              { technology: 'Solar', capacityMw: Math.floor(staticUtility.nameplateCapacityMw * 0.05), percentage: 5, colorCode: '#FFA500', count: 15 }
            ],
            operatingUnits: 32,
            plannedUnits: 8,
            retiredUnits: 4
          }
        }
        throw new Error('Utility not found')
      })
      
      setData({
        utility: profile,
        technologyMix: profile.technologyMix || [],
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
      <div className="dashboard-container">
        <div className="min-h-screen flex items-center justify-center">
          <div className="glassmorphism rounded-3xl p-12">
            <div className="flex flex-col items-center space-y-6">
              <svg className="animate-spin h-16 w-16 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-2xl font-bold gradient-text">Loading utility intelligence...</span>
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (data.error || !data.utility) {
    return (
      <div className="dashboard-container">
        <div className="min-h-screen flex items-center justify-center">
          <div className="glassmorphism rounded-3xl p-12 text-center max-w-lg">
            <div className="mb-6">
              <svg className="mx-auto h-20 w-20 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Utility Not Found</h2>
            <p className="text-gray-600 mb-8 text-lg">{data.error}</p>
            <Link
              href="/dashboard"
              className="btn-primary-modern inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { utility } = data

  return (
    <div className="dashboard-container">
      <div className="relative z-10">
        {/* Header */}
        <header className="floating-header">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Link 
                  href="/dashboard"
                  className="flex items-center space-x-3 text-gray-600 hover:text-purple-600 transition-all duration-300 group"
                >
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="font-semibold text-lg">Dashboard</span>
                </Link>
                <div className="text-gray-300 text-2xl">/</div>
                <h1 className="section-header text-3xl">{utility.utilityName}</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Image
                  src="/hayl-logo-new.svg"
                  alt="Hayl Energy AI"
                  width={48}
                  height={48}
                  className="rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          {/* Utility Hero Section */}
          <div className="glassmorphism rounded-3xl p-12 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                {utility.utilityName}
              </h2>
              <div className="flex items-center justify-center space-x-6 mb-8">
                <span className="state-tag px-6 py-3 rounded-full text-lg font-bold">
                  {utility.state}
                </span>
                <span className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full text-lg font-semibold">
                  {utility.ownershipType}
                </span>
                <span className="px-6 py-3 bg-gradient-to-r from-green-100 to-blue-100 text-gray-800 rounded-full text-lg font-semibold">
                  {utility.sizeCategory}
                </span>
              </div>
            </div>
            
            <div className="dashboard-grid">
              <MetricCard
                title="Total Capacity"
                value={utility.nameplateCapacityMw || utility.totalCapacityMw}
                unit="MW"
                color="blue"
                className="metric-card-modern"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
              <MetricCard
                title="Customers Served"
                value={utility.customersCount}
                color="green"
                className="metric-card-modern"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
              <MetricCard
                title="Operating Units"
                value={utility.operatingUnits || 24}
                color="yellow"
                className="metric-card-modern"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Service Territory */}
          <div className="glassmorphism rounded-3xl p-8 mb-12">
            <h3 className="section-header text-3xl mb-8 text-center">Service Territory</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(Array.isArray(utility.serviceTerritory) ? utility.serviceTerritory : [utility.serviceTerritory]).map((territory: string, index: number) => (
                <div
                  key={index}
                  className="gradient-border p-6 rounded-2xl group hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full pulsing-dot"></div>
                    <span className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {territory}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technology Mix Chart */}
          <div className="chart-container mb-12">
            <EnergyChart
              data={data.technologyMix.length > 0 ? data.technologyMix.map(tech => ({
                label: tech.technology,
                value: tech.capacityMw,
                color: tech.colorCode
              })) : [
                { label: 'Natural Gas', value: Math.floor((utility.nameplateCapacityMw || utility.totalCapacityMw) * 0.45), color: '#4169E1' },
                { label: 'Nuclear', value: Math.floor((utility.nameplateCapacityMw || utility.totalCapacityMw) * 0.35), color: '#FFD700' },
                { label: 'Coal', value: Math.floor((utility.nameplateCapacityMw || utility.totalCapacityMw) * 0.15), color: '#8B4513' },
                { label: 'Solar', value: Math.floor((utility.nameplateCapacityMw || utility.totalCapacityMw) * 0.05), color: '#FFA500' }
              ]}
              title={`${utility.utilityName} Technology Portfolio`}
              type="donut"
              height={450}
            />
          </div>

          {/* Action Buttons */}
          <div className="text-center">
            <div className="glassmorphism rounded-2xl p-8 inline-block">
              <div className="flex items-center space-x-6">
                <Link
                  href="/dashboard"
                  className="btn-primary-modern inline-flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Dashboard</span>
                </Link>
                <button className="px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 border border-gray-200">
                  Compare Utilities
                </button>
                <button className="px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 border border-gray-200">
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}