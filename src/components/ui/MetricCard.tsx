'use client'

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray' | 'orange'
  className?: string
}

const colorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  purple: 'text-purple-600',
  red: 'text-red-600',
  gray: 'text-gray-600',
  orange: 'text-orange-600'
}

export default function MetricCard({ 
  title, 
  value, 
  unit = '', 
  icon, 
  color = 'gray',
  className = '' 
}: MetricCardProps) {
  const colorClass = colorClasses[color]
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`
      }
      return val.toLocaleString()
    }
    return val
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-3">
        {icon && (
          <div className={`w-8 h-8 ${colorClass} flex items-center justify-center`}>
            {icon}
          </div>
        )}
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {title}
        </h3>
      </div>
      
      <div className="flex items-baseline space-x-2">
        <p className={`text-2xl font-bold ${colorClass}`}>
          {formatValue(value)}
        </p>
        {unit && (
          <span className="text-sm font-medium text-gray-500">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}