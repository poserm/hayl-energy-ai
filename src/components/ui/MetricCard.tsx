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
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray'
  className?: string
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100',
    iconText: 'text-blue-600',
    trend: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100', 
    iconText: 'text-green-600',
    trend: 'text-green-600'
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'bg-yellow-100',
    iconText: 'text-yellow-600',
    trend: 'text-yellow-600'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100',
    iconText: 'text-purple-600',
    trend: 'text-purple-600'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100',
    iconText: 'text-red-600',
    trend: 'text-red-600'
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'bg-gray-100',
    iconText: 'text-gray-600',
    trend: 'text-gray-600'
  }
}

export default function MetricCard({ 
  title, 
  value, 
  unit = '', 
  icon, 
  trend, 
  color = 'gray',
  className = '' 
}: MetricCardProps) {
  const colors = colorClasses[color]
  
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

  const TrendIcon = ({ direction }: { direction: 'up' | 'down' | 'neutral' }) => {
    if (direction === 'up') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      )
    } else if (direction === 'down') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${colors.bg} ${className} metric-card-hover`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            {icon && (
              <div className={`w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center ${colors.iconText}`}>
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              {title}
            </h3>
          </div>
          
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">
              {formatValue(value)}
            </p>
            {unit && (
              <span className="text-sm font-medium text-gray-500">
                {unit}
              </span>
            )}
          </div>

          {trend && (
            <div className={`flex items-center space-x-1 mt-2 ${colors.trend}`}>
              <TrendIcon direction={trend.direction} />
              <span className="text-sm font-medium">
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}