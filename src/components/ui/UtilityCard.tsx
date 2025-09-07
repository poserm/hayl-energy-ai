'use client'

import { useRouter } from 'next/navigation'

interface UtilityData {
  id: string
  utilityName: string
  state: string
  ownershipType: string
  nameplateCapacityMw: number
  logoScale: number
  sizeCategory: string
  serviceTerritory: string[]
  customersCount: number
  generatorCount?: number
  nercRegion?: string
}

interface UtilityCardProps {
  utility: UtilityData
  isSelected?: boolean
  onSelect?: (utility: UtilityData) => void
}

const UtilityCard = ({ utility, isSelected = false, onSelect }: UtilityCardProps) => {
  const router = useRouter()

  const handleClick = () => {
    if (onSelect) {
      onSelect(utility)
    } else {
      router.push(`/energy/utilities/${utility.id}`)
    }
  }

  const formatUtilityName = (name: string) => {
    // Clean up common suffixes for better display
    return name
      .replace(/\s+(LLC|Inc|Co|Corp|Corporation|Company|Limited|Partnership|LP)\s*$/gi, '')
      .replace(/\s+&\s+Power\s+Co\s*$/gi, ' & Power')
      .trim()
  }

  const getInitials = (name: string) => {
    const cleaned = formatUtilityName(name)
    const words = cleaned.split(' ').filter(word => word.length > 2)
    if (words.length >= 2) {
      return words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
    }
    return cleaned.slice(0, 2).toUpperCase()
  }

  const getSizeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'major': return 'bg-green-600 text-white border-green-200'
      case 'regional': return 'bg-blue-600 text-white border-blue-200' 
      case 'local': return 'bg-indigo-600 text-white border-indigo-200'
      default: return 'bg-gray-600 text-white border-gray-200'
    }
  }

  const formatCapacity = (mw: number) => {
    if (mw >= 1000) {
      return `${(mw / 1000).toFixed(1)}GW`
    }
    return `${Math.round(mw)}MW`
  }

  const formatCustomers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`
    }
    return count.toString()
  }

  return (
    <div
      onClick={handleClick}
      className={`
        group cursor-pointer bg-white border-2 rounded-xl p-6 transition-all duration-200 
        hover:shadow-lg hover:scale-[1.02] hover:border-blue-300
        ${isSelected ? 'border-blue-500 shadow-md scale-[1.01]' : 'border-gray-200'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold
            ${getSizeColor(utility.sizeCategory)}
          `}>
            {getInitials(utility.utilityName)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {formatUtilityName(utility.utilityName)}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {utility.state}
              </span>
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${utility.sizeCategory.toLowerCase() === 'major' ? 'bg-green-100 text-green-800' : 
                  utility.sizeCategory.toLowerCase() === 'regional' ? 'bg-blue-100 text-blue-800' : 
                  'bg-indigo-100 text-indigo-800'}
              `}>
                {utility.sizeCategory}
              </span>
            </div>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Company Type */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-1">
        {utility.ownershipType}
      </p>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="text-xl font-bold text-blue-600">
            {formatCapacity(utility.nameplateCapacityMw)}
          </div>
          <div className="text-xs text-gray-500 font-medium">Capacity</div>
        </div>
        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="text-xl font-bold text-green-600">
            {formatCustomers(utility.customersCount)}
          </div>
          <div className="text-xs text-gray-500 font-medium">Customers</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2 text-sm">
        {utility.generatorCount && (
          <div className="flex justify-between">
            <span className="text-gray-600">Generators:</span>
            <span className="font-medium text-gray-900">{utility.generatorCount}</span>
          </div>
        )}
        {utility.nercRegion && (
          <div className="flex justify-between">
            <span className="text-gray-600">NERC Region:</span>
            <span className="font-medium text-gray-900">{utility.nercRegion}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Territory:</span>
          <span className="font-medium text-gray-900 text-right">
            {utility.serviceTerritory[0] || 'Statewide'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default UtilityCard