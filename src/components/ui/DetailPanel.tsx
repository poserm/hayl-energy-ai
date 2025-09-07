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

interface GeneratorData {
  id: string
  entityName: string
  plantName: string
  state: string
  technology: string
  capacity: {
    nameplate: number
  }
  nameplate_capacity_mw?: number
  sourceSheet?: string
}

interface DetailPanelProps {
  item: UtilityData | GeneratorData | null
  type: 'utility' | 'generator'
  isOpen: boolean
  onClose: () => void
}

const DetailPanel = ({ item, type, isOpen, onClose }: DetailPanelProps) => {
  const router = useRouter()

  if (!isOpen || !item) return null

  const formatCapacity = (mw: number) => {
    if (mw >= 1000) {
      return `${(mw / 1000).toFixed(1)} GW`
    }
    return `${Math.round(mw)} MW`
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

  const isUtility = (item: any): item is UtilityData => {
    return 'utilityName' in item
  }

  const isGenerator = (item: any): item is GeneratorData => {
    return 'plantName' in item
  }

  const renderUtilityDetails = (utility: UtilityData) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {utility.utilityName}
          </h2>
          <div className="flex items-center space-x-3 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {utility.state}
            </span>
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${utility.sizeCategory.toLowerCase() === 'major' ? 'bg-green-100 text-green-800' : 
                utility.sizeCategory.toLowerCase() === 'regional' ? 'bg-blue-100 text-blue-800' : 
                'bg-indigo-100 text-indigo-800'}
            `}>
              {utility.sizeCategory} Utility
            </span>
          </div>
          <p className="text-gray-600 text-lg">{utility.ownershipType}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatCapacity(utility.nameplateCapacityMw)}
          </div>
          <div className="text-sm text-blue-700 font-medium">Total Capacity</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatCustomers(utility.customersCount)}
          </div>
          <div className="text-sm text-green-700 font-medium">Customers Served</div>
        </div>
        {utility.generatorCount && (
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {utility.generatorCount}
            </div>
            <div className="text-sm text-purple-700 font-medium">Generators</div>
          </div>
        )}
        {utility.nercRegion && (
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="text-lg font-bold text-orange-600">
              {utility.nercRegion}
            </div>
            <div className="text-sm text-orange-700 font-medium">NERC Region</div>
          </div>
        )}
      </div>

      {/* Service Territory */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Territory</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {utility.serviceTerritory.map((territory, index) => (
            <span key={index} className="px-3 py-1 bg-white text-gray-700 rounded-lg text-sm border">
              {territory}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={() => router.push(`/energy/utilities/${utility.id}`)}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View Full Profile
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )

  const renderGeneratorDetails = (generator: GeneratorData) => {
    const capacity = generator.capacity?.nameplate || generator.nameplate_capacity_mw || 0
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {generator.plantName}
            </h2>
            <div className="flex items-center space-x-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {generator.state}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {generator.technology}
              </span>
            </div>
            <p className="text-gray-600 text-lg">Owned by {generator.entityName}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCapacity(capacity)}
            </div>
            <div className="text-sm text-blue-700 font-medium">Nameplate Capacity</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-lg font-bold text-green-600">
              {generator.technology}
            </div>
            <div className="text-sm text-green-700 font-medium">Technology Type</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-lg font-bold text-purple-600">
              {generator.state}
            </div>
            <div className="text-sm text-purple-700 font-medium">Location</div>
          </div>
        </div>

        {/* Facility Information */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Facility Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Plant Name:</span>
              <span className="font-medium text-gray-900">{generator.plantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Owner:</span>
              <span className="font-medium text-gray-900">{generator.entityName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Technology:</span>
              <span className="font-medium text-gray-900">{generator.technology}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">State:</span>
              <span className="font-medium text-gray-900">{generator.state}</span>
            </div>
            {generator.sourceSheet && (
              <div className="flex justify-between md:col-span-2">
                <span className="text-gray-600">Data Source:</span>
                <span className="font-medium text-gray-900">{generator.sourceSheet}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => router.push(`/energy/generators/${generator.id}`)}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            View Full Details
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {isUtility(item) && renderUtilityDetails(item)}
          {isGenerator(item) && renderGeneratorDetails(item)}
        </div>
      </div>
    </div>
  )
}

export default DetailPanel