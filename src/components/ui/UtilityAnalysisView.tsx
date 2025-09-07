'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface UtilityAnalysisViewProps {
  utility: any
  onBack: () => void
}

export default function UtilityAnalysisView({ utility, onBack }: UtilityAnalysisViewProps) {
  const [activeSection, setActiveSection] = useState(1)
  const [generators, setGenerators] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'integrated' | 'contracted' | 'solicitations'>('integrated')
  const [activeStage, setActiveStage] = useState<'advanced' | 'mid' | 'early'>('advanced')
  const [filters, setFilters] = useState({
    solarOwned: true,
    storage: false
  })

  // Fetch generators for this utility
  useEffect(() => {
    const fetchGenerators = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/energy/generators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            utilityId: utility.id,
            limit: 50 
          })
        })
        const data = await response.json()
        setGenerators(data.generators || [])
      } catch (error) {
        console.error('Failed to fetch generators:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchGenerators()
  }, [utility.id])

  // Group generators by technology
  const technologyBreakdown = generators.reduce((acc, gen) => {
    const tech = gen.technology || 'Other'
    acc[tech] = (acc[tech] || 0) + (gen.capacity?.nameplate || 0)
    return acc
  }, {} as Record<string, number>)

  const sections = [
    { id: 1, title: 'Existing Portfolio' },
    { id: 2, title: 'Energy demand' },
    { id: 3, title: 'Energy Supply' }
  ]

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <button
                onClick={onBack}
                className="text-gray-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-gray-900 font-bold text-lg">
                    {utility.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{utility.name}</h1>
                  <p className="text-gray-300">{utility.state}'s largest electric utility</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 text-sm font-medium text-white border border-gray-600 rounded-lg hover:bg-gray-800">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white border border-gray-600 rounded-lg hover:bg-gray-800">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white border border-gray-600 rounded-lg hover:bg-gray-800">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-1.274 0-2.47.263-3.568.71m9.032 10.316A9.003 9.003 0 0112 21c-1.274 0-2.47-.263-3.568-.71" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Side - Timeline and Content */}
          <div className="col-span-8">
            <div className="flex">
              {/* Timeline Navigation */}
              <div className="mr-8">
                <div className="relative">
                  {sections.map((section, index) => (
                    <div key={section.id} className="flex items-center mb-8">
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors ${
                          activeSection === section.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        }`}
                      >
                        {String(section.id).padStart(2, '0')}
                      </button>
                      {index < sections.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-300" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Content */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {sections[activeSection - 1].title}
                </h2>
                <p className="text-gray-600 mb-6">
                  Summary of their preferred scenario. Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.
                </p>

                {activeSection === 1 && (
                  <>
                    {/* Energy Source Cards */}
                    <div className="grid grid-cols-5 gap-4 mb-8">
                      {Object.entries(technologyBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([tech, capacity]) => {
                          const colors: Record<string, string> = {
                            'Coal': 'bg-gray-700',
                            'Natural Gas': 'bg-blue-500',
                            'Nuclear': 'bg-purple-500',
                            'Solar': 'bg-yellow-500',
                            'Wind': 'bg-green-500'
                          }
                          return (
                            <div key={tech} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className={`w-3 h-3 rounded-full ${colors[tech] || 'bg-gray-400'}`} />
                                <span className="text-sm font-medium text-gray-900">{tech}</span>
                              </div>
                              <p className="text-lg font-bold text-gray-900">
                                {Math.round(capacity / 1000)} GW
                              </p>
                            </div>
                          )
                        })}
                    </div>

                    {/* Retirements Table */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Retirements</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">NAME</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">MW</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">YEAR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...Array(8)].map((_, i) => (
                            <tr key={i} className="border-t border-gray-200">
                              <td className="px-4 py-2 text-sm text-gray-900">Plant Name {i + 1}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">500</td>
                              <td className="px-4 py-2 text-sm text-gray-900">2025</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                      Source(s): EIA.gov, State regulatory filings
                    </p>
                  </>
                )}

                {activeSection === 2 && (
                  <>
                    {/* Tab Navigation */}
                    <div className="flex space-x-1 mb-6">
                      <button
                        onClick={() => setActiveTab('integrated')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeTab === 'integrated'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Integrated planning
                      </button>
                      <button
                        onClick={() => setActiveTab('contracted')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeTab === 'contracted'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Contracted projects
                      </button>
                      <button
                        onClick={() => setActiveTab('solicitations')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeTab === 'solicitations'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Active solicitations
                      </button>
                    </div>

                    {/* Summary Metrics */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                      <div className="flex justify-between items-center">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="text-xl font-bold text-gray-900">
                            {Math.round(utility.totalCapacity / 1000)} GW
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">IRP Filing year</p>
                          <p className="text-xl font-bold text-gray-900">2023</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Next IRP year</p>
                          <p className="text-xl font-bold text-gray-900">2025</p>
                        </div>
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="h-64 bg-gray-50 rounded-lg p-4 flex items-end justify-between">
                      {[2017, 2018, 2019, 2020, 2021, 2022, 2023].map((year) => (
                        <div key={year} className="flex flex-col items-center space-y-2">
                          <div 
                            className="w-16 bg-blue-500 rounded-t" 
                            style={{ height: `${Math.random() * 150 + 50}px` }}
                          />
                          <span className="text-xs text-gray-600">{year}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeSection === 3 && (
                  <>
                    {/* Stage Navigation */}
                    <div className="flex space-x-1 mb-6">
                      <button
                        onClick={() => setActiveStage('advanced')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeStage === 'advanced'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Advanced
                      </button>
                      <button
                        onClick={() => setActiveStage('mid')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeStage === 'mid'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Mid stage
                      </button>
                      <button
                        onClick={() => setActiveStage('early')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeStage === 'early'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Early stage
                      </button>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex space-x-6">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.solarOwned}
                            onChange={(e) => setFilters({ ...filters, solarOwned: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm text-gray-700">Solar owned</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.storage}
                            onChange={(e) => setFilters({ ...filters, storage: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm text-gray-700">Storage</span>
                        </label>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Open distribution
                      </button>
                    </div>

                    {/* Projects Table */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Project name</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">MW</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">POI</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Land</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">COD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...Array(6)].map((_, i) => (
                            <tr key={i} className="border-t border-gray-200">
                              <td className="px-4 py-2 text-sm text-gray-900">Solar Project {i + 1}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">100</td>
                              <td className="px-4 py-2 text-sm text-gray-900">Solar</td>
                              <td className="px-4 py-2 text-sm text-gray-900">Advanced</td>
                              <td className="px-4 py-2 text-sm text-gray-900">Substation {i + 1}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">Secured</td>
                              <td className="px-4 py-2 text-sm text-gray-900">2025</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Map */}
          <div className="col-span-4">
            <div className="bg-gray-900 rounded-2xl overflow-hidden sticky top-8">
              <div className="p-4">
                <h3 className="text-white font-semibold">Interactive map</h3>
                <p className="text-gray-400 text-sm">
                  Now showing: {sections[activeSection - 1].title}
                </p>
              </div>
              <div className="h-96 bg-gray-800 flex items-center justify-center">
                <svg viewBox="0 0 200 150" className="w-48 h-36">
                  <path 
                    d="M 50 30 L 150 30 L 150 50 L 140 60 L 140 100 L 130 110 L 120 120 L 80 120 L 70 110 L 60 100 L 60 60 L 50 50 Z" 
                    fill="#6B7280" 
                    stroke="#4B5563" 
                    strokeWidth="2"
                  />
                  <text x="100" y="75" textAnchor="middle" className="fill-white text-sm">
                    Indiana
                  </text>
                </svg>
              </div>
              <div className="p-4 space-y-2">
                <h4 className="text-white text-sm font-medium mb-2">
                  {activeSection === 3 ? 'Development Stage' : 'Technology Mix'}
                </h4>
                {activeSection === 3 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Mid stage</span>
                      <span className="text-white text-sm font-medium">10 projects</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Early stage</span>
                      <span className="text-white text-sm font-medium">20 projects</span>
                    </div>
                  </>
                ) : (
                  Object.entries(technologyBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([tech, capacity]) => {
                      const colors: Record<string, string> = {
                        'Coal': 'bg-gray-700',
                        'Natural Gas': 'bg-blue-500',
                        'Nuclear': 'bg-purple-500',
                        'Solar': 'bg-yellow-500',
                        'Wind': 'bg-green-500'
                      }
                      return (
                        <div key={tech} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${colors[tech] || 'bg-gray-400'}`} />
                            <span className="text-gray-300 text-sm">{tech}</span>
                          </div>
                          <span className="text-white text-sm font-medium">
                            {Math.round(capacity / 1000)} GW
                          </span>
                        </div>
                      )
                    })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Latest News */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Latest News</h3>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <div className="w-2 h-2 bg-gray-300 rounded-full" />
                <div className="w-2 h-2 bg-gray-300 rounded-full" />
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Policy', 'Indiana income', 'Energy target', 'Policy'].map((title, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="h-48 bg-gray-200 rounded-lg mb-3 group-hover:bg-gray-300 transition-colors" />
                <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600">{title}</h4>
                <p className="text-sm text-gray-600">9 Dec, 2024 | CNN</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}