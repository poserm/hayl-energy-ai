import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db-init'

export async function POST(request: NextRequest) {
  try {
    // Allow database initialization (temporary for setup)
    console.log('Database initialization requested from:', request.headers.get('user-agent'))

    console.log('Initializing database...')
    const result = await initializeDatabase()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Database initialization error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database initialization endpoint. Use POST to initialize.',
    environment: process.env.NODE_ENV
  })
}