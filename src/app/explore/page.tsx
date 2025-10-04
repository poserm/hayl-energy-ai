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
  const [activeSection, setActiveSection] = useState<'overview' | 'news' | 'insights' | 'analytics'>('overview')

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

    if (selectedCompany?.id === companyId) {
      setSelectedCompany(null)
    }
  }

  const handleToggleFavorite = (companyId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(companyId)) {
      newFavorites.delete(companyId)
    } else {
      newFavorites.add(companyId)
    }
    setFavorites(newFavorites)
    localStorage.setItem('energyBuyerFavorites', JSON.stringify(Array.from(newFavorites)))
  }

  // Mock news data - in production, this would come from an API
  const getCompanyNews = (companyName: string) => [
    {
      id: 1,
      title: `${companyName} Announces Major Renewable Energy Investment`,
      source: 'Energy News Daily',
      date: '2 days ago',
      summary: 'Company commits $500M to solar and wind expansion across service territories.',
      category: 'Investment'
    },
    {
      id: 2,
      title: `${companyName} Partners with Tech Giants for Grid Modernization`,
      source: 'Utility Dive',
      date: '1 week ago',
      summary: 'Strategic partnership aims to implement AI-driven grid management systems.',
      category: 'Technology'
    },
    {
      id: 3,
      title: `Regulatory Update: ${companyName} Files Rate Case`,
      source: 'Bloomberg Energy',
      date: '2 weeks ago',
      summary: 'New rate proposal includes infrastructure upgrades and clean energy transition costs.',
      category: 'Regulatory'
    },
    {
      id: 4,
      title: `${companyName} Reports Strong Q4 Earnings`,
      source: 'Reuters',
      date: '3 weeks ago',
      summary: 'Quarterly revenue exceeds expectations driven by commercial load growth.',
      category: 'Financial'
    }
  ]

  // Mock insights data
  const getCompanyInsights = (company: any) => [
    {
      id: 1,
      type: 'growth',
      icon: '📈',
      title: 'Load Growth Trajectory',
      value: '+12.3%',
      description: 'Year-over-year commercial load increase driven by data center expansion',
      trend: 'positive'
    },
    {
      id: 2,
      type: 'opportunity',
      icon: '💡',
      title: 'Strategic Opportunity',
      value: 'High',
      description: 'Company actively seeking distributed generation partnerships',
      trend: 'neutral'
    },
    {
      id: 3,
      type: 'risk',
      icon: '⚠️',
      title: 'Regulatory Risk',
      value: 'Moderate',
      description: 'Pending rate case decision may impact infrastructure investment timeline',
      trend: 'negative'
    },
    {
      id: 4,
      type: 'competitive',
      icon: '🎯',
      title: 'Market Position',
      value: '#2',
      description: 'Second-largest provider in the region with 2.1M customers',
      trend: 'positive'
    }
  ]

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <div className="bg-gray-900 shadow-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HE</span>
                </div>
                <span className="text-xl font-bold text-white">
                  Hayl Energy AI
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="flex items-center space-x-6 text-sm">
                <button
                  onClick={() => window.close()}
                  className="font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Close
                </button>
                <a href="/dashboard" className="font-medium text-gray-300 hover:text-white transition-colors">Dashboard</a>
              </nav>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
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
      <div className="max-w-7xl mx-auto px-6 py-12 min-h-screen">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Deep Dive Intelligence
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl">
            Comprehensive analysis, news, and insights for your favorited energy companies
          </p>
        </div>

        {!selectedCompany ? (
          <>
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-lg bg-gray-700 p-1">
                <button
                  onClick={() => {
                    setActiveTab('all')
                    setSelectedCompany(null)
                  }}
                  className={`px-6 py-2.5 rounded-md font-semibold transition-all ${
                    activeTab === 'all'
                      ? 'bg-gray-800 text-blue-600 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All ({favoritedCompanies.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('utilities')
                    setSelectedCompany(null)
                  }}
                  className={`px-6 py-2.5 rounded-md font-semibold transition-all ${
                    activeTab === 'utilities'
                      ? 'bg-gray-800 text-blue-600 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Utilities ({utilities.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('corporates')
                    setSelectedCompany(null)
                  }}
                  className={`px-6 py-2.5 rounded-md font-semibold transition-all ${
                    activeTab === 'corporates'
                      ? 'bg-gray-800 text-blue-600 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Corporates ({corporates.length})
                </button>
              </div>
            </div>

            {/* Empty State */}
            {favoritedCompanies.length === 0 && (
              <div className="text-center py-20">
                <svg className="w-24 h-24 text-gray-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <h3 className="text-2xl font-semibold text-white mb-3">No Favorites Yet</h3>
                <p className="text-gray-400 mb-6">Start favoriting companies from the dashboard to explore them here</p>
                <a
                  href="/dashboard"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </a>
              </div>
            )}

            {/* Companies Grid */}
            {favoritedCompanies.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-all duration-300 overflow-hidden group cursor-pointer"
                    onClick={() => {
                      setSelectedCompany(company)
                      setActiveSection('overview')
                    }}
                  >
                    {/* Company Card Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          company.type === 'utility' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                        }`}>
                          {company.type === 'utility' ? 'Utility' : 'Corporate'}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFavorite(company.id)
                          }}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {company.name}
                      </h3>

                      {company.region && (
                        <p className="text-sm text-gray-400 mb-3">{company.region}</p>
                      )}

                      {company.states && company.states.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {company.states.slice(0, 3).map((state: string) => (
                            <span key={state} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                              {state}
                            </span>
                          ))}
                          {company.states.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                              +{company.states.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                        <span className="text-sm text-blue-400 font-medium flex items-center space-x-1">
                          <span>Explore</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                          <span>4 new insights</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Company Detail View */
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => setSelectedCompany(null)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Companies</span>
            </button>

            {/* Company Header */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedCompany.type === 'utility' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {selectedCompany.type === 'utility' ? 'Utility Company' : 'Corporate Entity'}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFavorite(selectedCompany.id)
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        favorites.has(selectedCompany.id)
                          ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20'
                          : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                      }`}
                    >
                      <svg className="w-5 h-5" fill={favorites.has(selectedCompany.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-2">{selectedCompany.name}</h1>
                  {selectedCompany.region && (
                    <p className="text-lg text-gray-400">{selectedCompany.region}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedCompany.states && selectedCompany.states.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedCompany.states.map((state: string) => (
                    <span key={state} className="px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg text-sm font-medium">
                      {state}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Section Navigation */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-lg bg-gray-700 p-1">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`px-6 py-2.5 rounded-md font-semibold transition-all ${
                    activeSection === 'overview'
                      ? 'bg-gray-800 text-blue-600 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveSection('news')}
                  className={`px-6 py-2.5 rounded-md font-semibold transition-all ${
                    activeSection === 'news'
                      ? 'bg-gray-800 text-blue-600 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  News
                </button>
                <button
                  onClick={() => setActiveSection('insights')}
                  className={`px-6 py-2.5 rounded-md font-semibold transition-all ${
                    activeSection === 'insights'
                      ? 'bg-gray-800 text-blue-600 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Insights
                </button>
                <button
                  onClick={() => setActiveSection('analytics')}
                  className={`px-6 py-2.5 rounded-md font-semibold transition-all ${
                    activeSection === 'analytics'
                      ? 'bg-gray-800 text-blue-600 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Analytics
                </button>
              </div>
            </div>

            {/* Section Content */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-8">
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Company Overview</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Type</p>
                      <p className="text-lg font-semibold text-white">
                        {selectedCompany.type === 'utility' ? 'Electric Utility' : selectedCompany.companyType || 'Corporate'}
                      </p>
                    </div>
                    {selectedCompany.ownershipType && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-1">Ownership</p>
                        <p className="text-lg font-semibold text-white">{selectedCompany.ownershipType}</p>
                      </div>
                    )}
                    {selectedCompany.states && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-1">Service Territory</p>
                        <p className="text-lg font-semibold text-white">{selectedCompany.states.length} States</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">About</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {selectedCompany.name} is a {selectedCompany.type === 'utility' ? 'leading electric utility company' : 'major corporate energy buyer'} serving
                      customers across {selectedCompany.region || 'multiple regions'}.
                      {selectedCompany.type === 'utility'
                        ? ' The company provides reliable power generation, transmission, and distribution services to residential, commercial, and industrial customers.'
                        : ' The company operates multiple data centers and facilities with significant energy demands across the service territory.'
                      }
                    </p>
                  </div>

                  {selectedCompany.type === 'utility' && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Line of Business</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white shadow-md">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generation
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white shadow-md">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Transmission
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-600 text-white shadow-md">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Distribution
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'news' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Company News</h2>
                    <span className="text-sm text-gray-400">Last updated: Today</span>
                  </div>

                  <div className="space-y-4">
                    {getCompanyNews(selectedCompany.name).map((article) => (
                      <div key={article.id} className="bg-gray-700 rounded-lg p-6 hover:bg-gray-650 transition-colors border border-gray-600">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              article.category === 'Investment' ? 'bg-green-600 text-white' :
                              article.category === 'Technology' ? 'bg-blue-600 text-white' :
                              article.category === 'Regulatory' ? 'bg-yellow-600 text-white' :
                              'bg-purple-600 text-white'
                            }`}>
                              {article.category}
                            </span>
                            <span className="text-xs text-gray-400">{article.date}</span>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2 hover:text-blue-400 cursor-pointer">
                          {article.title}
                        </h3>
                        <p className="text-gray-300 text-sm mb-3">{article.summary}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Source: {article.source}</span>
                          <button className="text-blue-400 hover:text-blue-300 font-medium">
                            Read more →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'insights' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">AI-Powered Insights</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getCompanyInsights(selectedCompany).map((insight) => (
                      <div key={insight.id} className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                        <div className="flex items-start space-x-3">
                          <span className="text-3xl">{insight.icon}</span>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">{insight.title}</h3>
                            <p className={`text-2xl font-bold mb-2 ${
                              insight.trend === 'positive' ? 'text-green-400' :
                              insight.trend === 'negative' ? 'text-red-400' :
                              'text-blue-400'
                            }`}>
                              {insight.value}
                            </p>
                            <p className="text-sm text-gray-300">{insight.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-6 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 text-blue-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-white font-semibold mb-2">AI Recommendation</h4>
                        <p className="text-gray-300 text-sm">
                          Based on current market trends and company trajectory, this is an optimal time to engage
                          {selectedCompany.name} regarding renewable energy partnerships and distributed generation opportunities.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'analytics' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Market Analytics</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                      <p className="text-sm text-blue-400 font-medium mb-1">Market Share</p>
                      <p className="text-3xl font-bold text-white mb-2">23.4%</p>
                      <p className="text-xs text-gray-400">Regional ranking: #2</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/40 to-green-900/20 border border-green-500/30 rounded-lg p-6">
                      <p className="text-sm text-green-400 font-medium mb-1">Customer Base</p>
                      <p className="text-3xl font-bold text-white mb-2">2.1M</p>
                      <p className="text-xs text-gray-400">+5.2% YoY growth</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                      <p className="text-sm text-purple-400 font-medium mb-1">Renewable %</p>
                      <p className="text-3xl font-bold text-white mb-2">28%</p>
                      <p className="text-xs text-gray-400">Target: 40% by 2030</p>
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Competitive Position</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Service Territory Coverage</span>
                          <span className="text-sm font-semibold text-white">85%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Renewable Integration</span>
                          <span className="text-sm font-semibold text-white">72%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Grid Modernization</span>
                          <span className="text-sm font-semibold text-white">68%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Customer Satisfaction</span>
                          <span className="text-sm font-semibold text-white">91%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '91%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span>Add to Connections</span>
                </button>
                <button
                  onClick={() => window.open('/dashboard', '_blank')}
                  className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>View on Dashboard</span>
                </button>
                <button className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
