import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { state } = await request.json()
    
    if (!state) {
      return NextResponse.json({ error: 'State required' }, { status: 400 })
    }

    // Map state names to codes
    const stateMap: { [key: string]: string } = {
      'Delaware': 'DE', 'Illinois': 'IL', 'Indiana': 'IN', 'Kentucky': 'KY',
      'Maryland': 'MD', 'Michigan': 'MI', 'New Jersey': 'NJ', 'North Carolina': 'NC',
      'Ohio': 'OH', 'Pennsylvania': 'PA', 'Tennessee': 'TN', 'Virginia': 'VA',
      'West Virginia': 'WV', 'District of Columbia': 'DC'
    }
    const stateCode = stateMap[state] || state.toUpperCase()

    // Get generators with county and location data
    const generators = await prisma.generators.findMany({
      where: {
        plant_state: stateCode,
        nameplate_capacity_mw: { not: null },
        plant_name: { not: null }
      },
      select: {
        id: true,
        plant_name: true,
        plant_state: true,
        plant_county: true,
        technology: true,
        nameplate_capacity_mw: true,
        plant_latitude: true,
        plant_longitude: true
      }
    })

    // Normalize technology names (same logic as capacity-trends)
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

    // Group by plant name and sum capacities
    const plantGroups: { [plantName: string]: {
      plantName: string,
      county: string | null,
      technology: string,
      totalCapacity: number,
      latitude: number | null,
      longitude: number | null,
      generatorCount: number
    }} = {}

    generators.forEach(gen => {
      const plantName = gen.plant_name!
      const capacity = Number(gen.nameplate_capacity_mw || 0)
      const normalizedTech = normalizeTechnology(gen.technology)
      
      if (!plantGroups[plantName]) {
        plantGroups[plantName] = {
          plantName: plantName,
          county: gen.plant_county,
          technology: normalizedTech,
          totalCapacity: capacity,
          latitude: gen.plant_latitude ? Number(gen.plant_latitude) : null,
          longitude: gen.plant_longitude ? Number(gen.plant_longitude) : null,
          generatorCount: 1
        }
      } else {
        // Sum capacities and take the most common technology
        plantGroups[plantName].totalCapacity += capacity
        plantGroups[plantName].generatorCount += 1
        
        // Use the technology with the highest individual capacity for this plant
        if (capacity > (plantGroups[plantName].totalCapacity - capacity)) {
          plantGroups[plantName].technology = normalizedTech
        }
      }
    })

    // Convert to array and add mock coordinates for plants without lat/lng
    const mapData = Object.values(plantGroups).map((plant, index) => {
      // If no coordinates, generate mock coordinates based on county/index
      let latitude = plant.latitude
      let longitude = plant.longitude
      
      if (!latitude || !longitude) {
        // Mock coordinates for different states (approximate center points)
        const stateCoordinates: { [key: string]: { lat: number, lng: number, spread: number } } = {
          'VA': { lat: 37.4316, lng: -78.6569, spread: 2 },
          'PA': { lat: 40.2732, lng: -76.8755, spread: 2 },
          'OH': { lat: 40.3888, lng: -82.7649, spread: 2 },
          'MD': { lat: 39.0639, lng: -76.8021, spread: 1 },
          'WV': { lat: 38.4912, lng: -80.9540, spread: 1.5 },
          'NC': { lat: 35.6301, lng: -79.8064, spread: 2 },
          'DE': { lat: 39.3185, lng: -75.5071, spread: 0.5 },
          'NJ': { lat: 40.2989, lng: -74.5210, spread: 1 },
          'IL': { lat: 40.3363, lng: -89.0022, spread: 2 },
          'IN': { lat: 39.8647, lng: -86.2604, spread: 1.5 },
          'KY': { lat: 37.6681, lng: -84.6701, spread: 2 },
          'MI': { lat: 43.3266, lng: -84.5361, spread: 2 },
          'TN': { lat: 35.7478, lng: -86.7915, spread: 2 },
          'DC': { lat: 38.9072, lng: -77.0369, spread: 0.1 }
        }
        
        const stateInfo = stateCoordinates[stateCode] || { lat: 39, lng: -77, spread: 1 }
        
        // Distribute plants around the state center
        const angle = (index * 2 * Math.PI) / Object.keys(plantGroups).length
        const distance = (index % 3 + 1) * stateInfo.spread / 3
        
        latitude = stateInfo.lat + Math.cos(angle) * distance
        longitude = stateInfo.lng + Math.sin(angle) * distance
      }
      
      return {
        ...plant,
        latitude,
        longitude
      }
    })

    return NextResponse.json({
      plants: mapData,
      totalPlants: mapData.length,
      totalCapacity: mapData.reduce((sum, plant) => sum + plant.totalCapacity, 0),
      state: stateCode
    })

  } catch (error) {
    console.error('Error fetching map generators:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch map generators',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}