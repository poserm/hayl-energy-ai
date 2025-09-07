import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { states } = await request.json()
    
    if (!states || !Array.isArray(states)) {
      return NextResponse.json({ error: 'States array required' }, { status: 400 })
    }

    // Map state names to codes (same as energy-api.ts)
    const stateMap: { [key: string]: string } = {
      'Virginia': 'VA', 'Texas': 'TX', 'California': 'CA', 'New York': 'NY',
      'Florida': 'FL', 'Illinois': 'IL', 'Michigan': 'MI', 'North Carolina': 'NC',
      'Minnesota': 'MN', 'Massachusetts': 'MA'
    }
    const stateCodes = states.map(state => stateMap[state] || state.toUpperCase())

    // Get utilities with aggregated generator data
    const utilities = await prisma.generators.groupBy({
      by: ['entity_name', 'plant_state', 'sector'],
      where: {
        entity_name: { not: null },
        plant_state: { in: stateCodes },
        nameplate_capacity_mw: { not: null }
      },
      _sum: {
        nameplate_capacity_mw: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          nameplate_capacity_mw: 'desc'
        }
      }
    })

    // Get additional utility details from utilities table (if exists)
    let utilityNumbers: any[] = []
    let territories: any[] = []
    
    try {
      utilityNumbers = await prisma.utilities.findMany({
        where: {
          state: { in: stateCodes }
        },
        select: {
          utility_number: true,
          utility_name: true,
          state: true,
          ownership_type: true,
          nerc_region: true
        }
      })
    } catch (e) {
      console.warn('Utilities table not available')
    }

    try {
      territories = await prisma.service_territories.groupBy({
        by: ['utility_name', 'state'],
        where: {
          state: { in: stateCodes }
        },
        _count: {
          county: true
        }
      })
    } catch (e) {
      console.warn('Service territories table not available')
    }

    // Combine data
    const utilitiesData = utilities.map((util, index) => {
      const capacity = Number(util._sum.nameplate_capacity_mw || 0)
      const additionalInfo = utilityNumbers.find(u => 
        u.utility_name?.toLowerCase().includes(util.entity_name?.toLowerCase() || '') ||
        util.entity_name?.toLowerCase().includes(u.utility_name?.toLowerCase() || '')
      )
      
      const territoryInfo = territories.find(t => 
        t.utility_name?.toLowerCase().includes(util.entity_name?.toLowerCase() || '')
      )
      
      return {
        id: `${util.plant_state}_${Math.abs(util.entity_name?.split('').reduce((a, b) => a + b.charCodeAt(0), 0) || 0) % 100000}`,
        utilityName: util.entity_name || 'Unknown Utility',
        state: util.plant_state || '',
        ownershipType: additionalInfo?.ownership_type || util.sector || 'Electric Utility',
        nameplateCapacityMw: capacity,
        logoScale: capacity > 10000 ? 100 : capacity > 5000 ? 80 : 60,
        sizeCategory: capacity > 10000 ? 'Major' : capacity > 5000 ? 'Regional' : 'Local',
        serviceTerritory: [`${territoryInfo?._count.county || 'Multiple'} counties`],
        customersCount: Math.floor(capacity * 50), // Estimate based on capacity
        generatorCount: util._count.id,
        nercRegion: additionalInfo?.nerc_region
      }
    }).filter(util => util.nameplateCapacityMw > 0)

    return NextResponse.json(utilitiesData)
  } catch (error) {
    console.error('Error fetching utilities:', error)
    return NextResponse.json({ error: 'Failed to fetch utilities' }, { status: 500 })
  }
}