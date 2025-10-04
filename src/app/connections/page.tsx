'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Connection {
  id: string
  companyName: string
  companyType: 'utility' | 'corporate'
  contactName: string
  contactTitle: string
  contactEmail: string
  phone?: string
  notes?: string
  status: 'pending' | 'connected' | 'archived'
  addedDate: string
}

export default function ConnectionsPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [allCompanies, setAllCompanies] = useState<any[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'connected' | 'archived'>('all')

  // Load data from localStorage
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

    const savedConnections = localStorage.getItem('energyConnections')
    if (savedConnections) {
      try {
        const parsed = JSON.parse(savedConnections)
        setConnections(parsed)
      } catch (e) {
        console.error('Failed to load connections', e)
      }
    }
  }, [])

  const getFavoritedCompanies = () => {
    return allCompanies.filter(company => favorites.has(company.id.toString()))
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleAddConnection = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const newConnection: Connection = {
      id: Date.now().toString(),
      companyName: selectedCompany?.name || '',
      companyType: selectedCompany?.type || 'utility',
      contactName: formData.get('contactName') as string,
      contactTitle: formData.get('contactTitle') as string,
      contactEmail: formData.get('contactEmail') as string,
      phone: formData.get('phone') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      status: 'pending',
      addedDate: new Date().toISOString()
    }

    const updatedConnections = [...connections, newConnection]
    setConnections(updatedConnections)
    localStorage.setItem('energyConnections', JSON.stringify(updatedConnections))

    setShowAddModal(false)
    setSelectedCompany(null)
  }

  const handleStatusChange = (connectionId: string, newStatus: 'pending' | 'connected' | 'archived') => {
    const updated = connections.map(conn =>
      conn.id === connectionId ? { ...conn, status: newStatus } : conn
    )
    setConnections(updated)
    localStorage.setItem('energyConnections', JSON.stringify(updated))
  }

  const handleDeleteConnection = (connectionId: string) => {
    const updated = connections.filter(conn => conn.id !== connectionId)
    setConnections(updated)
    localStorage.setItem('energyConnections', JSON.stringify(updated))
  }

  const filteredConnections = filterStatus === 'all'
    ? connections
    : connections.filter(conn => conn.status === filterStatus)

  const favoritedCompanies = getFavoritedCompanies()

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
                <a href="/dashboard" className="font-medium text-gray-300 hover:text-white transition-colors">Dashboard</a>
                <a href="/explore" className="font-medium text-gray-300 hover:text-white transition-colors">Explore</a>
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
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Your Connections
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl">
            Manage your network and build relationships with favorited energy buyers and corporates
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Total Connections</p>
            <p className="text-3xl font-bold text-white">{connections.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-400">{connections.filter(c => c.status === 'pending').length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Connected</p>
            <p className="text-3xl font-bold text-green-400">{connections.filter(c => c.status === 'connected').length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Favorites</p>
            <p className="text-3xl font-bold text-blue-400">{favorites.size}</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-6">
          {/* Filter Toggle */}
          <div className="inline-flex rounded-lg bg-gray-700 p-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                filterStatus === 'all' ? 'bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                filterStatus === 'pending' ? 'bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('connected')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                filterStatus === 'connected' ? 'bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Connected
            </button>
            <button
              onClick={() => setFilterStatus('archived')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                filterStatus === 'archived' ? 'bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Archived
            </button>
          </div>

          {/* Add Connection Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Connection</span>
          </button>
        </div>

        {/* Connections List */}
        {filteredConnections.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 text-gray-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-2xl font-semibold text-white mb-3">No Connections Yet</h3>
            <p className="text-gray-400 mb-6">Start building your network by adding connections from your favorited companies</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Connection
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConnections.map((connection) => (
              <div key={connection.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{connection.contactName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        connection.companyType === 'utility' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                      }`}>
                        {connection.companyType === 'utility' ? 'Utility' : 'Corporate'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        connection.status === 'connected' ? 'bg-green-600 text-white' :
                        connection.status === 'pending' ? 'bg-yellow-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-1">{connection.contactTitle} at {connection.companyName}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{connection.contactEmail}</span>
                      </span>
                      {connection.phone && (
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{connection.phone}</span>
                        </span>
                      )}
                    </div>
                    {connection.notes && (
                      <p className="text-sm text-gray-400 mt-2 italic">"{connection.notes}"</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={connection.status}
                      onChange={(e) => handleStatusChange(connection.id, e.target.value as any)}
                      className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="connected">Connected</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button
                      onClick={() => handleDeleteConnection(connection.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete connection"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-8 border border-gray-700">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">Add New Connection</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedCompany(null)
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddConnection} className="space-y-6">
              {/* Company Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Select Company from Favorites</label>
                <select
                  value={selectedCompany?.id || ''}
                  onChange={(e) => {
                    const company = favoritedCompanies.find(c => c.id === e.target.value)
                    setSelectedCompany(company)
                  }}
                  className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose a company --</option>
                  {favoritedCompanies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.type === 'utility' ? 'Utility' : 'Corporate'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Contact Name</label>
                <input
                  type="text"
                  name="contactName"
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="John Doe"
                />
              </div>

              {/* Contact Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Contact Title</label>
                <input
                  type="text"
                  name="contactTitle"
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="VP of Operations"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="john.doe@company.com"
                />
              </div>

              {/* Phone (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Add any notes about this connection..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedCompany(null)
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedCompany}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
