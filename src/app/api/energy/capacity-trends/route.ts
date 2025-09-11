import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { states } = await request.json()
    
    if (!states || !Array.isArray(states) || states.length === 0) {
      return NextResponse.json({ error: 'States array required' }, { status: 400 })
    }

    // Map state names to codes
    const stateMap: { [key: string]: string } = {
      'Delaware': 'DE', 'Illinois': 'IL', 'Indiana': 'IN', 'Kentucky': 'KY',
      'Maryland': 'MD', 'Michigan': 'MI', 'New Jersey': 'NJ', 'North Carolina': 'NC',
      'Ohio': 'OH', 'Pennsylvania': 'PA', 'Tennessee': 'TN', 'Virginia': 'VA',
      'West Virginia': 'WV', 'District of Columbia': 'DC'
    }
    const stateCodes = states.map(state => stateMap[state] || state.toUpperCase())

    // Get generators data with technology normalization
    const generators = await prisma.generators.findMany({
      where: {
        plant_state: { in: stateCodes },
        nameplate_capacity_mw: { not: null },
        operating_year: { not: null, gte: 1950, lte: 2024 } // Reasonable year range
      },
      select: {
        nameplate_capacity_mw: true,
        technology: true,
        operating_year: true,
        plant_state: true
      }
    })

    // Normalize technology names
    const normalizeTechnology = (tech: string | null): string => {
      if (!tech) return 'Other'
      
      const techLower = tech.toLowerCase()
      
      // Natural Gas variations
      if (techLower.includes('natural gas') || 
          techLower.includes('gas') ||
          techLower.includes('combined cycle') ||
          techLower.includes('combustion turbine') ||
          techLower.includes('gas turbine')) {
        return 'Natural Gas'
      }
      
      // Coal variations
      if (techLower.includes('coal') || techLower.includes('steam')) {
        return 'Coal'
      }
      
      // Nuclear variations
      if (techLower.includes('nuclear')) {
        return 'Nuclear'
      }
      
      // Solar variations
      if (techLower.includes('solar') || techLower.includes('photovoltaic')) {
        return 'Solar'
      }
      
      // Wind variations
      if (techLower.includes('wind')) {
        return 'Wind'
      }
      
      // Hydro variations
      if (techLower.includes('hydro') || techLower.includes('water')) {
        return 'Hydro'
      }
      
      // Battery/Storage variations
      if (techLower.includes('battery') || techLower.includes('storage')) {
        return 'Battery Storage'
      }
      
      // Biomass variations
      if (techLower.includes('biomass') || techLower.includes('wood') || techLower.includes('biogas')) {
        return 'Biomass'
      }
      
      return 'Other'
    }

    // Process data for cumulative capacity by year and technology
    const yearRange = [2021, 2022, 2023, 2024]
    const technologies = ['Natural Gas', 'Coal', 'Nuclear', 'Solar', 'Wind', 'Hydro', 'Battery Storage', 'Biomass', 'Other']
    
    // Group by technology and calculate cumulative capacity
    const capacityData: { [year: number]: { [tech: string]: number } } = {}
    
    // Initialize data structure
    yearRange.forEach(year => {
      capacityData[year] = {}
      technologies.forEach(tech => {
        capacityData[year][tech] = 0
      })
    })

    // Calculate cumulative capacity for each year
    yearRange.forEach(currentYear => {
      const cumulativeCapacity: { [tech: string]: number } = {}
      technologies.forEach(tech => { cumulativeCapacity[tech] = 0 })
      
      // Sum up all capacity from generators that came online up to and including current year
      generators.forEach(gen => {
        const operatingYear = gen.operating_year
        const capacity = Number(gen.nameplate_capacity_mw || 0)
        const normalizedTech = normalizeTechnology(gen.technology)
        
        if (operatingYear && operatingYear <= currentYear && capacity > 0) {
          cumulativeCapacity[normalizedTech] += capacity
        }
      })
      
      // Store the cumulative values for this year
      Object.keys(cumulativeCapacity).forEach(tech => {
        capacityData[currentYear][tech] = cumulativeCapacity[tech]
      })
    })

    // Calculate total capacity for selected states
    const totalCapacity = generators.reduce((sum, gen) => {
      return sum + Number(gen.nameplate_capacity_mw || 0)
    }, 0)

    // Format data for the chart
    const chartData = yearRange.map(year => ({
      year,
      data: technologies.map(tech => ({
        technology: tech,
        capacity: Math.round(capacityData[year][tech])
      })).filter(item => item.capacity > 0) // Only include technologies with capacity
    }))

    // Get technology breakdown for current year (2024 or latest available)
    const currentYearData = capacityData[2024]
    const technologyBreakdown = technologies
      .map(tech => ({
        technology: tech,
        capacity: Math.round(currentYearData[tech]),
        percentage: totalCapacity > 0 ? Math.round((currentYearData[tech] / totalCapacity) * 100) : 0
      }))
      .filter(item => item.capacity > 0)
      .sort((a, b) => b.capacity - a.capacity)

    return NextResponse.json({
      chartData,
      technologyBreakdown,
      totalCapacity: Math.round(totalCapacity),
      states: stateCodes,
      generatorCount: generators.length
    })

  } catch (error) {
    console.error('Error fetching capacity trends:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch capacity trends',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}