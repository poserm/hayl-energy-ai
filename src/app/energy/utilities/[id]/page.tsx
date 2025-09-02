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

    if (params?.id && user) {
      fetchUtilityData(params.id as string)
    }
  }, [params?.id, user, authLoading, router])

  const fetchUtilityData = async (utilityId: string) => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const profile = await energyApi.getUtilityProfile(utilityId).catch(() => {
        const staticUtility = virginiaUtilitiesStatic.find(u => u.id === utilityId)
        if (staticUtility) {
          return {
            ...staticUtility,
            serviceCounties: Array.isArray(staticUtility.serviceTerritory) 
              ? staticUtility.serviceTerritory 
              : [staticUtility.serviceTerritory],
            technologyMix: [
              { technology: 'Natural Gas', capacityMw: Math.floor(staticUtility.nameplateCapacityMw * 0.45), percentage: 45, colorCode: '#3b82f6', count: 12 },
              { technology: 'Nuclear', capacityMw: Math.floor(staticUtility.nameplateCapacityMw * 0.35), percentage: 35, colorCode: '#10b981', count: 3 },
              { technology: 'Coal', capacityMw: Math.floor(staticUtility.nameplateCapacityMw * 0.15), percentage: 15, colorCode: '#6b7280', count: 2 },
              { technology: 'Solar', capacityMw: Math.floor(staticUtility.nameplateCapacityMw * 0.05), percentage: 5, colorCode: '#f59e0b', count: 15 }
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
              <h1 className="text-xl font-semibold text-gray-900">{utility.utilityName}</h1>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {utility.utilityName}
            </h2>
            <div className="flex items-center justify-center space-x-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {utility.state}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {utility.ownershipType}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {utility.sizeCategory}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Capacity"
              value={utility.nameplateCapacityMw || utility.totalCapacityMw}
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
              title="Customers Served"
              value={utility.customersCount}
              color="green"
              className="bg-white rounded-xl shadow-sm border border-gray-200"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <MetricCard
              title="Operating Units"
              value={utility.operatingUnits || 24}
              color="purple"
              className="bg-white rounded-xl shadow-sm border border-gray-200"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Service Territory */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Territory</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(Array.isArray(utility.serviceTerritory) ? utility.serviceTerritory : [utility.serviceTerritory]).map((territory: string, index: number) => (
              <div
                key={index}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-900">
                  {territory}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Mix Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <EnergyChart
            data={data.technologyMix.length > 0 ? data.technologyMix.map(tech => ({
              label: tech.technology,
              value: tech.capacityMw,
              color: tech.colorCode
            })) : [
              { label: 'Natural Gas', value: Math.floor((utility.nameplateCapacityMw || utility.totalCapacityMw) * 0.45), color: '#3b82f6' },
              { label: 'Nuclear', value: Math.floor((utility.nameplateCapacityMw || utility.totalCapacityMw) * 0.35), color: '#10b981' },
              { label: 'Coal', value: Math.floor((utility.nameplateCapacityMw || utility.totalCapacityMw) * 0.15), color: '#6b7280' },
              { label: 'Solar', value: Math.floor((utility.nameplateCapacityMw || utility.totalCapacityMw) * 0.05), color: '#f59e0b' }
            ]}
            title={`${utility.utilityName} Technology Portfolio`}
            type="donut"
            height={400}
          />
        </div>

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
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Compare Utilities
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Export Data
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}