'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function RFPDetailsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get RFP data from URL params
  const title = searchParams.get('title') || ''
  const type = searchParams.get('type') || ''
  const deadline = searchParams.get('deadline') || ''
  const status = searchParams.get('status') || ''
  const capacity = searchParams.get('capacity') || ''
  const cod = searchParams.get('cod') || ''
  const link = searchParams.get('link') || ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header with Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="w-px h-6 bg-gray-300" />
              <h1 className="text-xl font-bold text-gray-900">Hayl Energy AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">RFP Details</span>
            </div>
          </div>
        </div>
      </div>

      {/* RFP Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">{title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-blue-100">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="font-medium">{type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Deadline: {deadline}</span>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    status === 'Active'
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* RFP Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">RFP Summary</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                This Request for Proposals seeks qualified developers to provide renewable energy capacity
                to meet growing demand and support clean energy transition goals. The selected projects will
                contribute to grid reliability while advancing sustainability objectives.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-2">Target Capacity</p>
                  <p className="text-3xl font-bold text-blue-900">{capacity}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium mb-2">Commercial Operation Date</p>
                  <p className="text-3xl font-bold text-purple-900">{cod}</p>
                </div>
              </div>
            </div>

            {/* Key Requirements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Requirements</h2>
              <div className="space-y-4">
                {[
                  { title: 'Technology', description: 'Solar PV, Wind, or Hybrid (Solar + Storage) projects eligible' },
                  { title: 'Location', description: 'Projects must be located within or deliverable to the service territory' },
                  { title: 'Contract Structure', description: 'Power Purchase Agreement (PPA) with 15-25 year term' },
                  { title: 'Developer Qualifications', description: 'Demonstrated experience with utility-scale renewable projects' },
                  { title: 'Permitting & Interconnection', description: 'Active interconnection queue position or path to interconnection required' }
                ].map((req, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{req.title}</h3>
                      <p className="text-sm text-gray-600">{req.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">RFP Timeline</h2>
              <div className="space-y-6">
                {[
                  { milestone: 'RFP Release', date: 'January 15, 2025', status: 'completed' },
                  { milestone: 'Pre-Bid Conference', date: 'February 1, 2025', status: 'completed' },
                  { milestone: 'Proposal Deadline', date: deadline, status: 'active' },
                  { milestone: 'Shortlist Notification', date: 'May 15, 2025', status: 'upcoming' },
                  { milestone: 'Contract Award', date: 'June 30, 2025', status: 'upcoming' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        item.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : item.status === 'active'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.milestone}</h3>
                      <p className="text-sm text-gray-600">{item.date}</p>
                    </div>
                    <div>
                      {item.status === 'completed' && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Completed
                        </span>
                      )}
                      {item.status === 'active' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          Active
                        </span>
                      )}
                      {item.status === 'upcoming' && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Full RFP
                </a>
                <button className="block w-full px-4 py-3 bg-gray-100 text-gray-700 text-center font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Download PDF
                </button>
                <button className="block w-full px-4 py-3 bg-gray-100 text-gray-700 text-center font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Save to Watchlist
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">RFP Coordinator</p>
                  <p className="font-medium text-gray-900">Procurement Team</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-blue-600">rfp@utility.com</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">(555) 123-4567</p>
                </div>
              </div>
            </div>

            {/* Key Dates */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold text-orange-900">Important Deadline</h3>
              </div>
              <p className="text-2xl font-bold text-orange-900 mb-1">{deadline}</p>
              <p className="text-sm text-orange-700">Proposal submission deadline</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RFPDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RFP details...</p>
        </div>
      </div>
    }>
      <RFPDetailsContent />
    </Suspense>
  )
}
