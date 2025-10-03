'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function ExplorePage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [allCompanies, setAllCompanies] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'utilities' | 'corporates'>('all')

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

    // Load all companies from localStorage
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

  const getDisplayedCompanies = () => {
    if (activeTab === 'utilities') return utilities
    if (activeTab === 'corporates') return corporates
    return favoritedCompanies
  }

  const displayedCompanies = getDisplayedCompanies()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleRemoveFavorite = (companyId: string) => {
    const newFavorites = new Set(favorites)
    newFavorites.delete(companyId)
    setFavorites(newFavorites)
    localStorage.setItem('energyBuyerFavorites', JSON.stringify(Array.from(newFavorites)))

    // If the removed company was selected, clear selection
    if (selectedCompany?.id === companyId) {
      setSelectedCompany(null)
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Favorited Companies
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            View detailed information and drill into your favorited energy buyers and corporates
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full bg-gray-200 p-1">
            <button
              onClick={() => {
                setActiveTab('all')
                setSelectedCompany(null)
              }}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              All ({favoritedCompanies.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('utilities')
                setSelectedCompany(null)
              }}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                activeTab === 'utilities'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Utilities ({utilities.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('corporates')
                setSelectedCompany(null)
              }}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                activeTab === 'corporates'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Corporates ({corporates.length})
            </button>
          </div>
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

        {/* Companies Grid and Detail View */}
        {favoritedCompanies.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Companies List */}
            <div className={`${selectedCompany ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-4`}>
              <div className={`grid ${selectedCompany ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
                {displayedCompanies.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => setSelectedCompany(company)}
                    className={`bg-white rounded-lg shadow-md border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-xl relative ${
                      selectedCompany?.id === company.id
                        ? company.type === 'utility'
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFavorite(company.id)
                      }}
                      className="absolute top-2 right-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                      title="Remove from favorites"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="text-center">
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold mb-2 ${
                        company.type === 'utility' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {company.type === 'utility' ? 'Utility' : 'Corporate'}
                      </div>

                      <h4 className="text-base font-bold text-gray-900 leading-tight mb-2">
                        {company.name}
                      </h4>

                      {/* Region */}
                      {company.region && (
                        <div className="mb-2">
                          <span className="text-xs text-gray-500">{company.region}</span>
                        </div>
                      )}

                      {/* States */}
                      {company.states && company.states.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center mb-2">
                          {company.states.slice(0, 2).map((state: string) => (
                            <span key={state} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {state}
                            </span>
                          ))}
                          {company.states.length > 2 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              +{company.states.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-blue-600 font-medium mt-2">
                        Click for details →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail Panel */}
            {selectedCompany && (
              <div className="lg:col-span-2 bg-white rounded-lg shadow-xl border-2 border-gray-300 p-8 sticky top-24 h-fit">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold mb-3 ${
                      selectedCompany.type === 'utility' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedCompany.type === 'utility' ? 'Utility Company' : 'Corporate Entity'}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {selectedCompany.name}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Region */}
                  {selectedCompany.region && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">ISO Region</h3>
                      <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                        {selectedCompany.region}
                      </div>
                    </div>
                  )}

                  {/* States Coverage */}
                  {selectedCompany.states && selectedCompany.states.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                        States of Operation ({selectedCompany.states.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCompany.states.map((state: string) => (
                          <span key={state} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                            {state}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Utility-specific details */}
                  {selectedCompany.type === 'utility' && (
                    <>
                      {selectedCompany.ownershipType && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Ownership Type</h3>
                          <p className="text-lg font-medium text-gray-900">{selectedCompany.ownershipType}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Corporate-specific details */}
                  {selectedCompany.type === 'corporate' && (
                    <>
                      {selectedCompany.companyType && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Company Type</h3>
                          <div className={`inline-flex px-4 py-2 rounded-lg font-medium ${
                            selectedCompany.companyType === 'Hyperscale' ? 'bg-blue-50 text-blue-700' :
                            selectedCompany.companyType === 'Colocation' ? 'bg-green-50 text-green-700' :
                            selectedCompany.companyType === 'Developer' ? 'bg-purple-50 text-purple-700' :
                            selectedCompany.companyType === 'AI Infrastructure' ? 'bg-orange-50 text-orange-700' :
                            selectedCompany.companyType === 'AI Cloud' ? 'bg-pink-50 text-pink-700' :
                            'bg-gray-50 text-gray-700'
                          }`}>
                            {selectedCompany.companyType}
                          </div>
                        </div>
                      )}

                      {selectedCompany.estimatedLoad && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Estimated Load</h3>
                          <p className="text-2xl font-bold text-green-600">{selectedCompany.estimatedLoad}</p>
                        </div>
                      )}

                      {selectedCompany.facilities && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Facilities</h3>
                          <p className="text-lg font-medium text-gray-900">{selectedCompany.facilities} facilities</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRemoveFavorite(selectedCompany.id)}
                        className="flex-1 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Remove from Favorites
                      </button>
                      <button
                        onClick={() => {
                          // Navigate back to dashboard with this company selected
                          window.opener?.postMessage({
                            type: 'SELECT_COMPANY',
                            company: selectedCompany
                          }, '*')
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View on Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
