'use client'

import { useState } from 'react'

interface RFP {
  id: string
  title: string
  company: string
  companyType: 'utility' | 'corporate'
  technology: string[]
  capacity: string
  location: string[]
  dueDate: string
  status: 'active' | 'closing-soon' | 'closed'
  matchScore?: number
  description: string
  requirements: string[]
  estimatedValue: string
}

// Mock RFP data - in production, this would come from API
const mockRFPs: RFP[] = [
  {
    id: 'rfp-001',
    title: 'Solar PPA - 200 MW Utility Scale Project',
    company: 'Dominion Energy Virginia',
    companyType: 'utility',
    technology: ['Solar', 'Storage'],
    capacity: '200 MW',
    location: ['Virginia', 'North Carolina'],
    dueDate: '2025-01-15',
    status: 'active',
    matchScore: 92,
    description: 'Seeking proposals for solar photovoltaic power purchase agreements to support renewable energy goals.',
    requirements: [
      'Minimum 200 MW capacity',
      'Commercial operation by Q4 2026',
      '15-20 year PPA term',
      'Optional battery storage (50 MW / 200 MWh)'
    ],
    estimatedValue: '$180M'
  },
  {
    id: 'rfp-002',
    title: 'Data Center Renewable Energy Supply',
    company: 'Amazon Web Services',
    companyType: 'corporate',
    technology: ['Solar', 'Wind'],
    capacity: '150 MW',
    location: ['Virginia'],
    dueDate: '2024-12-28',
    status: 'closing-soon',
    matchScore: 85,
    description: 'AWS seeks renewable energy suppliers for Northern Virginia data center operations.',
    requirements: [
      '24/7 clean energy matching',
      'Minimum 150 MW capacity',
      'Flexible delivery terms',
      'Renewable Energy Credits included'
    ],
    estimatedValue: '$120M'
  },
  {
    id: 'rfp-003',
    title: 'Wind Energy PPAs - Multi-Site Portfolio',
    company: 'Microsoft',
    companyType: 'corporate',
    technology: ['Wind'],
    capacity: '300 MW',
    location: ['Virginia', 'Maryland', 'Pennsylvania'],
    dueDate: '2025-02-01',
    status: 'active',
    matchScore: 78,
    description: 'Seeking wind energy power purchase agreements across Mid-Atlantic region.',
    requirements: [
      'Geographic diversity preferred',
      'Minimum 100 MW per site',
      '12-15 year PPA term',
      'Q2 2026 commercial operation'
    ],
    estimatedValue: '$250M'
  },
  {
    id: 'rfp-004',
    title: 'Battery Energy Storage System',
    company: 'Appalachian Power',
    companyType: 'utility',
    technology: ['Storage'],
    capacity: '100 MW / 400 MWh',
    location: ['West Virginia', 'Virginia'],
    dueDate: '2025-01-20',
    status: 'active',
    matchScore: 70,
    description: 'RFP for grid-scale battery energy storage to support renewable integration and grid reliability.',
    requirements: [
      'Minimum 4-hour duration',
      '100 MW / 400 MWh capacity',
      'Grid interconnection support',
      'Operating by Q3 2026'
    ],
    estimatedValue: '$95M'
  },
  {
    id: 'rfp-005',
    title: 'Community Solar Program',
    company: 'Northern Virginia Electric Cooperative',
    companyType: 'utility',
    technology: ['Solar'],
    capacity: '50 MW',
    location: ['Virginia'],
    dueDate: '2025-01-10',
    status: 'closing-soon',
    matchScore: 88,
    description: 'Community solar project to serve residential and small business customers.',
    requirements: [
      '5-10 MW per site (5 sites total)',
      'Subscriber management system',
      'Community engagement plan',
      'Commercial operation by Q1 2026'
    ],
    estimatedValue: '$45M'
  }
]

interface OpportunitiesSectionProps {
  region: string
}

export default function OpportunitiesSection({ region }: OpportunitiesSectionProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'utilities' | 'corporates'>('all')
  const [techFilter, setTechFilter] = useState<string>('all')
  const [selectedRFP, setSelectedRFP] = useState<RFP | null>(null)

  const filteredRFPs = mockRFPs.filter(rfp => {
    if (activeFilter !== 'all' && rfp.companyType !== activeFilter) return false
    if (techFilter !== 'all' && !rfp.technology.includes(techFilter)) return false
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-500/10 border-green-500/30'
      case 'closing-soon': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
      case 'closed': return 'text-gray-500 bg-gray-500/10 border-gray-500/30'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30'
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="bg-gray-900 rounded-lg px-6 py-12 mb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Active Opportunities
              </h2>
              <p className="text-gray-400">
                Track and respond to RFPs from energy buyers in {region}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                <div className="text-2xl font-bold text-blue-500">{filteredRFPs.length}</div>
                <div className="text-xs text-gray-400">Active RFPs</div>
              </div>
              <div className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                <div className="text-2xl font-bold text-yellow-500">
                  {filteredRFPs.filter(r => r.status === 'closing-soon').length}
                </div>
                <div className="text-xs text-gray-400">Closing Soon</div>
              </div>
              <div className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                <div className="text-2xl font-bold text-purple-500">
                  {filteredRFPs.filter(r => (r.matchScore || 0) >= 80).length}
                </div>
                <div className="text-xs text-gray-400">High Match</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4 border border-gray-700">
            {/* Company Type Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Company Type:</span>
              <div className="inline-flex rounded-lg bg-gray-700 p-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter('utilities')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeFilter === 'utilities'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Utilities
                </button>
                <button
                  onClick={() => setActiveFilter('corporates')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeFilter === 'corporates'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Corporates
                </button>
              </div>
            </div>

            {/* Technology Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Technology:</span>
              <select
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                className="bg-gray-700 text-white rounded-lg px-4 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Technologies</option>
                <option value="Solar">Solar</option>
                <option value="Wind">Wind</option>
                <option value="Storage">Battery Storage</option>
              </select>
            </div>
          </div>
        </div>

        {/* RFP List */}
        <div className="space-y-4">
          {filteredRFPs.map((rfp) => {
            const daysUntilDue = getDaysUntilDue(rfp.dueDate)

            return (
              <div
                key={rfp.id}
                onClick={() => setSelectedRFP(rfp)}
                className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-blue-500 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{rfp.title}</h3>
                      {rfp.matchScore && rfp.matchScore >= 80 && (
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full border border-purple-500/30">
                          {rfp.matchScore}% Match
                        </span>
                      )}
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(rfp.status)}`}>
                        {rfp.status === 'closing-soon' ? `Closes in ${daysUntilDue} days` : rfp.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mb-3">
                      <span className="flex items-center gap-2 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {rfp.company}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {rfp.capacity}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {rfp.location.join(', ')}
                      </span>
                    </div>

                    <p className="text-sm text-gray-300 mb-3">{rfp.description}</p>

                    <div className="flex items-center gap-2">
                      {rfp.technology.map((tech, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right ml-6">
                    <div className="text-sm font-semibold text-green-500 mb-1">{rfp.estimatedValue}</div>
                    <div className="text-xs text-gray-400">Est. Value</div>
                    <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredRFPs.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">No RFPs Found</h3>
            <p className="text-gray-400">Try adjusting your filters to see more opportunities</p>
          </div>
        )}
      </div>

      {/* RFP Detail Modal */}
      {selectedRFP && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedRFP.title}</h2>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">{selectedRFP.company}</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedRFP.status)}`}>
                      {selectedRFP.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRFP(null)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Capacity</div>
                  <div className="text-lg font-semibold text-white">{selectedRFP.capacity}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Estimated Value</div>
                  <div className="text-lg font-semibold text-green-500">{selectedRFP.estimatedValue}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Due Date</div>
                  <div className="text-lg font-semibold text-white">
                    {new Date(selectedRFP.dueDate).toLocaleDateString()}
                    <span className="text-sm text-yellow-500 ml-2">({getDaysUntilDue(selectedRFP.dueDate)} days)</span>
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Location</div>
                  <div className="text-lg font-semibold text-white">{selectedRFP.location.join(', ')}</div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                <p className="text-gray-300">{selectedRFP.description}</p>
              </div>

              {/* Requirements */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Key Requirements</h3>
                <ul className="space-y-2">
                  {selectedRFP.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
                <button className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all">
                  Start Response
                </button>
                <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all">
                  Save for Later
                </button>
                <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all">
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
