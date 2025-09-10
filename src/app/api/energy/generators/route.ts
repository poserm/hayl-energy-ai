import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { states, utility, technology, limit = 50 } = await request.json()
    
    // Map state names to codes (same as energy-api.ts)
    const stateMap: { [key: string]: string } = {
      'Delaware': 'DE', 'Illinois': 'IL', 'Indiana': 'IN', 'Kentucky': 'KY',
      'Maryland': 'MD', 'Michigan': 'MI', 'New Jersey': 'NJ', 'North Carolina': 'NC',
      'Ohio': 'OH', 'Pennsylvania': 'PA', 'Tennessee': 'TN', 'Virginia': 'VA',
      'West Virginia': 'WV', 'District of Columbia': 'DC'
    }
    
    // Build filters
    const filters: any = {
      nameplate_capacity_mw: { not: null }
    }

    if (states && states.length > 0) {
      const stateCodes = states.map((s: string) => stateMap[s] || s.toUpperCase())
      filters.plant_state = { in: stateCodes }
    }

    if (utility) {
      filters.entity_name = { contains: utility, mode: 'insensitive' }
    }

    if (technology && technology.length > 0) {
      filters.technology = { in: technology }
    }

    // Get generators with all details
    const generators = await prisma.generators.findMany({
      where: filters,
      select: {
        id: true,
        entity_name: true,
        plant_name: true,
        plant_state: true,
        technology: true,
        nameplate_capacity_mw: true,
        source_sheet: true
      },
      orderBy: {
        nameplate_capacity_mw: 'desc'
      },
      take: Number(limit)
    })

    // Transform data for frontend (correct field names for GeneratorCard)
    const transformedGenerators = generators.map(gen => ({
      id: gen.id,
      entityName: gen.entity_name, // Changed from utilityName
      plantName: gen.plant_name,
      state: gen.plant_state,
      technology: gen.technology,
      capacity: {
        nameplate: Number(gen.nameplate_capacity_mw || 0)
      },
      nameplate_capacity_mw: Number(gen.nameplate_capacity_mw || 0),
      sourceSheet: gen.source_sheet
    }))

    return NextResponse.json({
      generators: transformedGenerators,
      total: transformedGenerators.length,
      filters: { states, utility, technology }
    })
  } catch (error) {
    console.error('Error fetching generators:', error)
    return NextResponse.json({ error: 'Failed to fetch generators' }, { status: 500 })
  }
}