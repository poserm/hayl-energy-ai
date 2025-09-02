'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'

interface StateSelectorProps {
  selectedStates: string[]
  onStatesChange: (states: string[]) => void
  className?: string
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
  'Wisconsin', 'Wyoming'
]

export default function StateSelector({ selectedStates, onStatesChange, className = '' }: StateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredStates = US_STATES.filter(state => 
    state.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedStates.includes(state)
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addState = (state: string) => {
    if (!selectedStates.includes(state)) {
      onStatesChange([...selectedStates, state])
      setSearchTerm('')
      setIsOpen(false)
    }
  }

  const removeState = (state: string) => {
    onStatesChange(selectedStates.filter(s => s !== state))
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected States Display */}
      <div className="mb-8">
        <label className="block text-xl font-bold gradient-text mb-6">
          Selected States ({selectedStates.length})
        </label>
        {selectedStates.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {selectedStates.map((state) => (
              <span
                key={state}
                className="inline-flex items-center px-6 py-3 rounded-2xl text-base font-bold state-tag shadow-lg group"
              >
                {state}
                <button
                  onClick={() => removeState(state)}
                  className="ml-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 focus:outline-none transition-all duration-200 group-hover:scale-110"
                >
                  <XMarkIcon className="w-4 h-4 text-white" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="glassmorphism rounded-xl p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-lg font-semibold text-gray-600">No states selected</p>
            <p className="text-gray-500">Add states using the dropdown below</p>
          </div>
        )}
      </div>

      {/* Add State Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full glassmorphism rounded-2xl px-8 py-4 flex items-center justify-between hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all duration-300 group shadow-lg"
        >
          <span className="flex items-center text-gray-800 font-semibold text-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <PlusIcon className="w-5 h-5 text-white" />
            </div>
            Add New State
          </span>
          <ChevronDownIcon 
            className={`w-6 h-6 text-gray-600 transition-all duration-300 ${isOpen ? 'rotate-180 text-purple-600' : 'group-hover:text-purple-600'}`} 
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-4 w-full glassmorphism rounded-2xl shadow-2xl border border-white/20 overflow-hidden backdrop-blur-xl">
            {/* Search Input */}
            <div className="p-6 border-b border-white/10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search states..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-gray-800 placeholder-gray-500 backdrop-blur-sm font-medium"
                  autoFocus
                />
                <svg className="absolute right-4 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* States List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredStates.length > 0 ? (
                <div className="p-2">
                  {filteredStates.map((state) => (
                    <button
                      key={state}
                      onClick={() => addState(state)}
                      className="w-full text-left px-6 py-4 text-gray-800 hover:bg-white/20 focus:outline-none focus:bg-white/20 rounded-xl transition-all duration-200 font-medium hover:scale-105 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="group-hover:text-purple-600 transition-colors">{state}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center">
                  <div className="glassmorphism rounded-xl p-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 font-semibold">
                      {searchTerm ? 'No states found' : 'All states already selected'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}