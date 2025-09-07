'use client'

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

interface GeneratorCardProps {
  generator: GeneratorData
  isSelected?: boolean
  onSelect?: (generator: GeneratorData) => void
}

const GeneratorCard = ({ generator, isSelected = false, onSelect }: GeneratorCardProps) => {
  const handleClick = () => {
    onSelect?.(generator)
  }

  const capacity = generator.capacity?.nameplate || generator.nameplate_capacity_mw || 0

  const formatCapacity = (mw: number) => {
    if (mw >= 1000) {
      return `${(mw / 1000).toFixed(1)}GW`
    }
    return `${Math.round(mw)}MW`
  }

  const getTechnologyColor = (tech: string) => {
    const techLower = tech.toLowerCase()
    if (techLower.includes('solar')) return 'bg-yellow-600 text-white border-yellow-200'
    if (techLower.includes('wind')) return 'bg-blue-600 text-white border-blue-200'
    if (techLower.includes('nuclear')) return 'bg-purple-600 text-white border-purple-200'
    if (techLower.includes('natural gas') || techLower.includes('gas')) return 'bg-orange-600 text-white border-orange-200'
    if (techLower.includes('coal')) return 'bg-gray-700 text-white border-gray-200'
    if (techLower.includes('hydro')) return 'bg-cyan-600 text-white border-cyan-200'
    if (techLower.includes('battery') || techLower.includes('storage')) return 'bg-green-600 text-white border-green-200'
    return 'bg-indigo-600 text-white border-indigo-200'
  }

  const getInitials = (plantName: string) => {
    const words = plantName.split(' ').filter(word => word.length > 2)
    if (words.length >= 2) {
      return words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
    }
    return plantName.slice(0, 2).toUpperCase()
  }

  const getSizeCategory = (mw: number) => {
    if (mw >= 1000) return 'Large Scale'
    if (mw >= 100) return 'Medium Scale'
    return 'Small Scale'
  }

  return (
    <div
      onClick={handleClick}
      className={`
        group cursor-pointer bg-gradient-to-br from-white to-gray-50 border-2 rounded-xl p-6 transition-all duration-200 
        hover:shadow-lg hover:scale-[1.02] hover:border-orange-300 hover:from-orange-50 hover:to-orange-100
        ${isSelected ? 'border-orange-500 shadow-md scale-[1.01] from-orange-50 to-orange-100' : 'border-gray-200'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold
            ${getTechnologyColor(generator.technology)}
          `}>
            {getInitials(generator.plantName)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
              {generator.plantName}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {generator.state}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {getSizeCategory(capacity)}
              </span>
            </div>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors flex-shrink-0" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      {/* Owner */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-1">
        Owned by {generator.entityName}
      </p>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center bg-orange-50 rounded-lg p-3">
          <div className="text-xl font-bold text-orange-600">
            {formatCapacity(capacity)}
          </div>
          <div className="text-xs text-gray-500 font-medium">Capacity</div>
        </div>
        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-bold text-blue-600 line-clamp-1">
            {generator.technology}
          </div>
          <div className="text-xs text-gray-500 font-medium">Technology</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Plant ID:</span>
          <span className="font-medium text-gray-900">{generator.id}</span>
        </div>
        {generator.sourceSheet && (
          <div className="flex justify-between">
            <span className="text-gray-600">Source:</span>
            <span className="font-medium text-gray-900 text-right line-clamp-1">
              {generator.sourceSheet}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default GeneratorCard