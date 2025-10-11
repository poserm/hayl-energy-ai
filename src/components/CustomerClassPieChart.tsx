'use client'

interface CustomerClassData {
  class: string
  load: number
  color: string
}

export default function CustomerClassPieChart() {
  // Placeholder data for customer classes
  const data: CustomerClassData[] = [
    { class: 'Residential', load: 24.1, color: '#3b82f6' }, // blue
    { class: 'Commercial', load: 20.6, color: '#22c55e' }, // green
    { class: 'Industrial', load: 24.1, color: '#a855f7' }  // purple
  ]

  const total = data.reduce((sum, item) => sum + item.load, 0)

  // Calculate percentages and cumulative angles for pie chart
  let currentAngle = 0
  const slices = data.map((item) => {
    const percentage = (item.load / total) * 100
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
          {slices.map((slice) => (
            <g key={slice.class} className="group cursor-pointer">
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
            {total.toFixed(1)}
          </text>
          <text
            x={centerX}
            y={centerY + 18}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-400"
          >
            GW
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {slices.map((slice) => (
          <div key={slice.class} className="flex items-center justify-between p-2 bg-gray-800/30 rounded hover:bg-gray-800/50 transition-all cursor-pointer group">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm group-hover:scale-110 transition-transform"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-xs text-gray-300">{slice.class}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-white">
                {slice.load.toFixed(1)} GW
              </span>
              <span className="text-xs text-gray-400 ml-2">({slice.percentage.toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        Placeholder Data • Customer Load Distribution
      </p>
    </div>
  )
}
