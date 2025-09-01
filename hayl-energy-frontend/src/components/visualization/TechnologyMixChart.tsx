'use client'

import React from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TechnologyCapacity, EnergyTechnology } from '@/types/energy'
import { energyApiUtils } from '@/lib/energy-api'

interface TechnologyMixChartProps {
  data: TechnologyCapacity[]
  chartType?: 'pie' | 'bar'
  title?: string
  showLegend?: boolean
  showLabels?: boolean
  height?: number
  className?: string
}

const TechnologyMixChart: React.FC<TechnologyMixChartProps> = ({
  data,
  chartType = 'pie',
  title,
  showLegend = true,
  showLabels = true,
  height = 300,
  className,
}) => {
  // Prepare chart data
  const chartData = data.map((item) => ({
    name: item.technology.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: item.capacity,
    percentage: item.percentage,
    color: energyApiUtils.getTechnologyColor(item.technology),
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Capacity: {data.value.toLocaleString()} MW
          </p>
          <p className="text-sm text-gray-600">
            Share: {data.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    if (percent < 0.05) return null // Don't show labels for slices < 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          {title}
        </h3>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'pie' ? (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={showLabels ? renderCustomizedLabel : false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis 
              label={{ value: 'Capacity (MW)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Custom legend */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">
                {item.name} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Summary statistics */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Total Capacity: {chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()} MW
        {' • '}
        {chartData.length} Technologies
      </div>
    </div>
  )
}

export default TechnologyMixChart

// Compact version for smaller displays
export const CompactTechnologyMixChart: React.FC<TechnologyMixChartProps> = ({
  data,
  title,
  className,
}) => {
  const chartData = data.map((item) => ({
    name: item.technology.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: item.capacity,
    percentage: item.percentage,
    color: energyApiUtils.getTechnologyColor(item.technology),
  }))

  return (
    <div className={className}>
      {title && (
        <h4 className="text-sm font-medium text-gray-900 mb-3">{title}</h4>
      )}
      
      <div className="space-y-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    backgroundColor: item.color,
                    width: `${item.percentage}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-12 text-right">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}