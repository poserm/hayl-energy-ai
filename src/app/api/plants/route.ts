import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const utilityName = searchParams.get('utility')

    if (!utilityName) {
      return NextResponse.json({ error: 'Utility name required' }, { status: 400 })
    }

    console.log('🔍 Getting plants for utility:', utilityName)

    // Test database connection first
    try {
      await prisma.$connect()
      console.log('✅ Database connected')
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError)
      return NextResponse.json({
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 })
    }

    // Get plants for this utility
    const plants = await prisma.generators.findMany({
      where: {
        entity_name: {
          contains: utilityName,
          mode: 'insensitive'
        }
      },
      select: {
        plant_name: true,
        nameplate_capacity_mw: true,
        technology: true,
        operating_year: true,
        plant_state: true,
        county: true
      },
      orderBy: [
        { nameplate_capacity_mw: 'desc' },
        { plant_name: 'asc' }
      ]
    })

    console.log(`📊 Found ${plants.length} plants for "${utilityName}"`)

    return NextResponse.json(plants)

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch plants',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}