import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get all unique states
    const states = await prisma.utilities.findMany({
      select: { state: true },
      distinct: ['state']
    })

    // Get all unique ownership types
    const ownershipTypes = await prisma.utilities.findMany({
      select: { ownership_type: true },
      distinct: ['ownership_type']
    })

    // Get total count
    const totalCount = await prisma.utilities.count()

    // Get a few sample utilities
    const sampleUtilities = await prisma.utilities.findMany({
      take: 5,
      select: {
        id: true,
        utility_name: true,
        state: true,
        ownership_type: true,
        total_capacity_mw: true
      }
    })

    return NextResponse.json({
      success: true,
      summary: {
        totalUtilities: totalCount,
        uniqueStates: states.length,
        uniqueOwnershipTypes: ownershipTypes.length
      },
      states: states.map(s => s.state).sort(),
      ownershipTypes: ownershipTypes.map(o => o.ownership_type).filter(Boolean).sort(),
      sampleUtilities
    })

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}