'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function ExplorePage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [allCompanies, setAllCompanies] = useState<any[]>([])

  // Load favorites and all companies from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('energyBuyerFavorites')
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites)
        setFavorites(new Set(parsed))
      } catch (e) {
        console.error('Failed to load favorites', e)
      }
    }

    // Load all companies from localStorage (we'll save them from dashboard)
    const savedCompanies = localStorage.getItem('allEnergyBuyerCompanies')
    if (savedCompanies) {
      try {
        const parsed = JSON.parse(savedCompanies)
        setAllCompanies(parsed)
      } catch (e) {
        console.error('Failed to load companies', e)
      }
    }
  }, [])

  const getFavoritedCompanies = () => {
    return allCompanies.filter(company => favorites.has(company.id.toString()))
  }

  const favoritedCompanies = getFavoritedCompanies()
  const utilities = favoritedCompanies.filter(c => c.type === 'utility')
  const corporates = favoritedCompanies.filter(c => c.type === 'corporate')

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HE</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hayl Energy AI
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="flex items-center space-x-6 text-sm">
                <button
                  onClick={() => window.close()}
                  className="font-medium text-gray-700 hover:text-gray-900"
                >
                  Close
                </button>
                <a href="/dashboard" className="font-medium text-gray-700 hover:text-gray-900">Dashboard</a>
              </nav>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Favorited Companies
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            View and manage your favorited energy buyers and corporates across all regions
          </p>
        </div>

        {/* Empty State */}
        {favoritedCompanies.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Favorites Yet</h3>
            <p className="text-gray-600 mb-6">Start favoriting companies from the dashboard to see them here</p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        )}

        {/* Utilities Section */}
        {utilities.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Utilities ({utilities.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {utilities.map((utility) => (
                <div
                  key={utility.id}
                  className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300"
                >
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                      {utility.name}
                    </h4>

                    {/* Multi-state badge */}
                    {utility.states && utility.states.length > 1 && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                          Multi-State ({utility.states.length})
                        </span>
                      </div>
                    )}

                    {/* States */}
                    {utility.states && utility.states.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {utility.states.slice(0, 3).map((state: string) => (
                            <span key={state} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {state}
                            </span>
                          ))}
                          {utility.states.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              +{utility.states.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {utility.ownershipType && (
                      <p className="text-sm text-gray-500 uppercase font-medium mb-3">
                        {utility.ownershipType}
                      </p>
                    )}

                    {/* Region */}
                    {utility.region && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {utility.region}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Corporates Section */}
        {corporates.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Corporates ({corporates.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {corporates.map((corporate) => (
                <div
                  key={corporate.id}
                  className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-6 hover:shadow-xl hover:border-green-300 transition-all duration-300"
                >
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                      {corporate.name}
                    </h4>

                    {/* Company Type Badge */}
                    <div className="mb-3">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        corporate.companyType === 'Hyperscale' ? 'bg-blue-100 text-blue-700' :
                        corporate.companyType === 'Colocation' ? 'bg-green-100 text-green-700' :
                        corporate.companyType === 'Developer' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {corporate.companyType}
                      </span>
                    </div>

                    {/* Multi-state badge */}
                    {corporate.states && corporate.states.length > 1 && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                          Multi-State ({corporate.states.length})
                        </span>
                      </div>
                    )}

                    {/* States */}
                    {corporate.states && corporate.states.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {corporate.states.slice(0, 3).map((state: string) => (
                            <span key={state} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {state}
                            </span>
                          ))}
                          {corporate.states.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              +{corporate.states.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Estimated Load */}
                    {corporate.estimatedLoad && (
                      <div className="mb-3 px-3 py-2 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Estimated Load</p>
                        <p className="text-lg font-bold text-green-600">
                          {corporate.estimatedLoad}
                        </p>
                      </div>
                    )}

                    {/* Facilities Count */}
                    {corporate.facilities && (
                      <div className="text-sm text-gray-500 mb-3">
                        {corporate.facilities} facilities
                      </div>
                    )}

                    {/* Region */}
                    {corporate.region && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {corporate.region}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
