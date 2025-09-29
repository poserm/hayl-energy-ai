import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const utilityName = searchParams.get('utilityName')
    
    if (!utilityName) {
      return NextResponse.json(
        { error: 'Utility name is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Fetching generators for utility:', utilityName)

    // Search for generators that match the utility name in entity_name OR utility_name
    const generators = await prisma.generators.findMany({
      where: {
        OR: [
          {
            entity_name: {
              contains: utilityName,
              mode: 'insensitive'
            }
          },
          {
            utility_name: {
              contains: utilityName,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        plant_name: true,
        entity_name: true,
        technology: true,
        prime_mover: true,
        nameplate_capacity_mw: true,
        operating_date: true,
        state: true,
        county: true,
        utility_id: true,
        utility_name: true,
        balancing_authority_code: true,
        balancing_authority_name: true,
        sector_name: true,
        sector: true
      },
      orderBy: [
        { nameplate_capacity_mw: 'desc' },
        { plant_name: 'asc' }
      ]
    })

    console.log(`📊 Found ${generators.length} generators for utility: ${utilityName}`)
    
    // Debug: Show a few example entity_name and utility_name values
    if (generators.length > 0) {
      console.log('🔍 Sample generator data:')
      generators.slice(0, 3).forEach((gen, i) => {
        console.log(`  ${i + 1}. entity_name: "${gen.entity_name}", utility_name: "${gen.utility_name}"`)
      })
    } else {
      console.log('⚠️ No generators found. Let me check what similar utilities exist...')
      // Search for any utilities with similar names
      const similarUtilities = await prisma.generators.findMany({
        where: {
          OR: [
            {
              entity_name: {
                contains: 'Virginia',
                mode: 'insensitive'
              }
            },
            {
              utility_name: {
                contains: 'Virginia',
                mode: 'insensitive'
              }
            }
          ]
        },
        select: {
          entity_name: true,
          utility_name: true
        },
        distinct: ['entity_name'],
        take: 5
      })
      console.log('🔍 Similar Virginia utilities found:', similarUtilities.map(u => ({
        entity_name: u.entity_name,
        utility_name: u.utility_name
      })))
    }

    // Calculate portfolio statistics
    const totalCapacity = generators.reduce((sum, gen) => {
      const capacity = parseFloat(gen.nameplate_capacity_mw?.toString() || '0')
      return sum + (isNaN(capacity) ? 0 : capacity)
    }, 0)

    const totalPlants = new Set(generators.map(gen => gen.plant_name)).size

    // Technology breakdown
    const technologyBreakdown = generators.reduce((acc: any, gen) => {
      const tech = gen.technology || 'Unknown'
      if (!acc[tech]) {
        acc[tech] = { count: 0, capacity: 0 }
      }
      acc[tech].count += 1
      const capacity = parseFloat(gen.nameplate_capacity_mw?.toString() || '0')
      acc[tech].capacity += isNaN(capacity) ? 0 : capacity
      return acc
    }, {})

    const portfolioData = {
      totalGenerators: generators.length,
      totalPlants,
      totalCapacity: Math.round(totalCapacity * 100) / 100,
      technologyBreakdown,
      generators: generators.map(gen => ({
        ...gen,
        nameplate_capacity_mw: parseFloat(gen.nameplate_capacity_mw?.toString() || '0')
      }))
    }

    console.log('✅ Portfolio data calculated:', {
      totalGenerators: portfolioData.totalGenerators,
      totalPlants: portfolioData.totalPlants,
      totalCapacity: portfolioData.totalCapacity
    })

    return NextResponse.json(portfolioData)

  } catch (error) {
    console.error('❌ Error fetching generator data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generator data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}