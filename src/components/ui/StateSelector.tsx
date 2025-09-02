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
    <div className={`space-y-6 ${className}`}>
      {/* Selected States */}
      {selectedStates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Selected States ({selectedStates.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedStates.map((state) => (
              <span
                key={state}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {state}
                <button
                  onClick={() => removeState(state)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 focus:outline-none transition-colors"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add State Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <span className="flex items-center text-gray-700">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add State
          </span>
          <ChevronDownIcon 
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search states..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                autoFocus
              />
            </div>

            {/* States List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredStates.length > 0 ? (
                filteredStates.map((state) => (
                  <button
                    key={state}
                    onClick={() => addState(state)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                  >
                    {state}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  {searchTerm ? 'No states found' : 'All states already selected'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}