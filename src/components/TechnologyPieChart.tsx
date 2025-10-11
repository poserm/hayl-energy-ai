'use client'

import { technologyColors } from '@/lib/energy-api'

interface TechnologyData {
  technology: string
  value: number
  color: string
}

interface TechnologyPieChartProps {
  data: TechnologyData[]
  total: number
  unit: string
}

export default function TechnologyPieChart({ data, total, unit }: TechnologyPieChartProps) {
  if (data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No data available</p>
      </div>
    )
  }

  // Calculate percentages and cumulative angles for pie chart
  let currentAngle = 0
  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100
    const sliceAngle = (percentage / 100) * 360
    const slice = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + sliceAngle
    }
    currentAngle += sliceAngle
    return slice
  })

  // Helper function to convert polar to cartesian coordinates
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    }
  }

  // Helper function to create arc path
  const describeArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle)
    const end = polarToCartesian(centerX, centerY, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return [
      'M', centerX, centerY,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ')
  }

  const centerX = 100
  const centerY = 100
  const radius = 80

  return (
    <div className="space-y-4">
      {/* Pie Chart */}
      <div className="flex justify-center">
        <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-lg">
          {slices.map((slice, index) => (
            <g key={slice.technology} className="group cursor-pointer">
              <path
                d={describeArc(centerX, centerY, radius, slice.startAngle, slice.endAngle)}
                fill={slice.color}
                stroke="rgba(0, 0, 0, 0.3)"
                strokeWidth="1"
                className="transition-all hover:opacity-80"
              />
            </g>
          ))}
          {/* Center circle for donut effect */}
          <circle cx={centerX} cy={centerY} r="40" fill="#1a1a1a" />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-lg font-bold fill-white"
          >
            {(total / (unit === 'GW' ? 1000 : 1000)).toFixed(1)}
          </text>
          <text
            x={centerX}
            y={centerY + 18}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-400"
          >
            {unit}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {slices.map((slice) => (
          <div key={slice.technology} className="flex items-center justify-between p-2 bg-gray-800/30 rounded hover:bg-gray-800/50 transition-all cursor-pointer group">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm group-hover:scale-110 transition-transform"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-xs text-gray-300">{slice.technology}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-white">
                {(slice.value / (unit === 'GW' ? 1000 : 1000)).toFixed(1)} {unit}
              </span>
              <span className="text-xs text-gray-400 ml-2">({slice.percentage.toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
