import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check what data exists in each table
    const [generatorsCount, utilitiesCount, territoriesCount] = await Promise.all([
      prisma.generators.count(),
      prisma.utilities.count(),
      prisma.service_territories.count()
    ])

    // Get sample data from generators table
    const sampleGenerators = await prisma.generators.findMany({
      take: 3,
      select: {
        id: true,
        entity_name: true,
        plant_name: true,
        plant_state: true,
        technology: true,
        nameplate_capacity_mw: true,
        source_sheet: true
      }
    })

    // Get sample utilities
    const sampleUtilities = await prisma.utilities.findMany({
      take: 3,
      select: {
        id: true,
        utility_name: true,
        state: true,
        ownership_type: true
      }
    })

    return NextResponse.json({
      database_status: 'connected',
      table_counts: {
        generators: generatorsCount,
        utilities: utilitiesCount,
        service_territories: territoriesCount
      },
      sample_data: {
        generators: sampleGenerators,
        utilities: sampleUtilities
      }
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}