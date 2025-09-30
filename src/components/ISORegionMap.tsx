'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { feature } from 'topojson-client'

interface ISORegionMapProps {
  selectedRegion?: string
  onRegionClick?: (region: string) => void
}

// Define ISO/RTO regions and their member states
const ISO_REGIONS = {
  'CAISO': ['CA'],
  'ERCOT': ['TX'],
  'ISO-NE': ['CT', 'ME', 'MA', 'NH', 'RI', 'VT'],
  'MISO': ['AR', 'IL', 'IN', 'IA', 'KY', 'LA', 'MI', 'MN', 'MS', 'MO', 'MT', 'ND', 'SD', 'WI'],
  'NYISO': ['NY'],
  'PJM': ['DE', 'IL', 'IN', 'KY', 'MD', 'MI', 'NJ', 'NC', 'OH', 'PA', 'TN', 'VA', 'WV', 'DC'],
  'SPP': ['AR', 'KS', 'LA', 'MS', 'MO', 'NE', 'NM', 'OK', 'ND', 'SD', 'TX', 'WY']
}

// Color scheme for each ISO/RTO region
const REGION_COLORS: Record<string, string> = {
  'CAISO': '#3b82f6',    // Blue
  'ERCOT': '#10b981',    // Green
  'ISO-NE': '#8b5cf6',   // Purple
  'MISO': '#f59e0b',     // Amber
  'NYISO': '#ef4444',    // Red
  'PJM': '#06b6d4',      // Cyan
  'SPP': '#ec4899',      // Pink
  'NONE': '#e5e7eb'      // Gray for non-ISO states
}

// Create a map of state abbreviation to ISO region
const STATE_TO_REGION: Record<string, string[]> = {}
Object.entries(ISO_REGIONS).forEach(([region, states]) => {
  states.forEach(state => {
    if (!STATE_TO_REGION[state]) {
      STATE_TO_REGION[state] = []
    }
    STATE_TO_REGION[state].push(region)
  })
})

export default function ISORegionMap({ selectedRegion, onRegionClick }: ISORegionMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const width = 800
    const height = 500

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')

    const g = svg.append('g')

    // Define projection
    const projection = d3.geoAlbersUsa()
      .scale(1000)
      .translate([width / 2, height / 2])

    const path = d3.geoPath().projection(projection)

    // Load US states TopoJSON
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(response => response.json())
      .then(us => {
        const states = feature(us, us.objects.states)

        // State name to abbreviation mapping
        const stateNameToAbbr: Record<string, string> = {
          'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
          'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
          'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
          'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
          'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
          'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
          'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
          'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
          'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
          'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
          'District of Columbia': 'DC'
        }

        // Draw states
        g.selectAll('path')
          .data(states.features)
          .enter()
          .append('path')
          .attr('d', path as any)
          .attr('class', 'state')
          .attr('fill', (d: any) => {
            const stateName = d.properties.name
            const stateAbbr = stateNameToAbbr[stateName]
            const regions = STATE_TO_REGION[stateAbbr] || []

            // If a region is selected, only highlight states in that region
            if (selectedRegion) {
              if (regions.includes(selectedRegion)) {
                return REGION_COLORS[selectedRegion]
              }
              return REGION_COLORS.NONE
            }

            // If state belongs to multiple regions, use the first one's color
            if (regions.length > 0) {
              return REGION_COLORS[regions[0]]
            }
            return REGION_COLORS.NONE
          })
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .style('transition', 'all 0.3s ease')
          .on('mouseover', function(event: any, d: any) {
            const stateName = d.properties.name
            const stateAbbr = stateNameToAbbr[stateName]
            const regions = STATE_TO_REGION[stateAbbr] || []

            // Highlight state
            d3.select(this)
              .attr('stroke', '#000000')
              .attr('stroke-width', 2.5)
              .style('opacity', 0.8)

            // Show tooltip
            if (tooltipRef.current) {
              const regionText = regions.length > 0
                ? regions.join(', ')
                : 'Non-ISO Region'

              tooltipRef.current.innerHTML = `
                <div class="font-semibold">${stateName}</div>
                <div class="text-sm">${regionText}</div>
              `
              tooltipRef.current.style.display = 'block'
              tooltipRef.current.style.left = `${event.pageX + 10}px`
              tooltipRef.current.style.top = `${event.pageY - 10}px`
            }
          })
          .on('mouseout', function() {
            // Remove highlight
            d3.select(this)
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 1.5)
              .style('opacity', 1)

            // Hide tooltip
            if (tooltipRef.current) {
              tooltipRef.current.style.display = 'none'
            }
          })
          .on('click', function(event: any, d: any) {
            const stateName = d.properties.name
            const stateAbbr = stateNameToAbbr[stateName]
            const regions = STATE_TO_REGION[stateAbbr] || []

            if (regions.length > 0 && onRegionClick) {
              onRegionClick(regions[0])
            }
          })
      })
      .catch(error => {
        console.error('Error loading map data:', error)
      })

  }, [selectedRegion, onRegionClick])

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
      <div
        ref={tooltipRef}
        className="absolute hidden bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none z-50"
        style={{ display: 'none' }}
      />

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-2">ISO/RTO Regions</div>
        <div className="space-y-1">
          {Object.entries(REGION_COLORS).filter(([key]) => key !== 'NONE').map(([region, color]) => (
            <div key={region} className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-700">{region}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}