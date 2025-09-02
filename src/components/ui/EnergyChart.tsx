'use client'

import { useMemo } from 'react'

interface ChartData {
  label: string
  value: number
  color: string
  percentage?: number
}

interface EnergyChartProps {
  data: ChartData[]
  title: string
  type: 'bar' | 'pie' | 'donut'
  height?: number
  showPercentages?: boolean
  className?: string
}

export default function EnergyChart({ 
  data, 
  title, 
  type, 
  height = 300, 
  showPercentages = true,
  className = '' 
}: EnergyChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data])
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])

  const renderBarChart = () => (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
        const valuePercentage = total > 0 ? (item.value / total) * 100 : 0
        
        return (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-24 text-sm font-medium text-gray-700 truncate flex-shrink-0">
              {item.label}
            </div>
            <div className="flex-1 flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-800">
                    {item.value.toLocaleString()} MW
                  </span>
                </div>
              </div>
              {showPercentages && (
                <div className="w-12 text-xs font-medium text-gray-600 text-right">
                  {valuePercentage.toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderPieChart = () => {
    let cumulativePercentage = 0
    const radius = 80
    const strokeWidth = type === 'donut' ? 20 : radius
    const normalizedRadius = radius - strokeWidth / 2
    const circumference = normalizedRadius * 2 * Math.PI

    return (
      <div className="flex items-center justify-center space-x-8">
        <div className="relative">
          <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
            <circle
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
              const strokeDashoffset = -cumulativePercentage * circumference / 100
              cumulativePercentage += percentage

              return (
                <circle
                  key={index}
                  cx={radius}
                  cy={radius}
                  r={normalizedRadius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              )
            })}
          </svg>
          {type === 'donut' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {(total / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-gray-500">Total MW</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0
            return (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{item.label}</span>
                  <span className="text-gray-500 ml-1">
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      <div style={{ height: `${height}px` }} className="flex items-center justify-center">
        {data.length > 0 ? (
          type === 'bar' ? renderBarChart() : renderPieChart()
        ) : (
          <div className="text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-sm">No data available</p>
          </div>
        )}
      </div>
    </div>
  )
}