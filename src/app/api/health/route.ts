import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/db-init'
import { monitoring } from '@/lib/monitoring'

export async function GET() {
  try {
    const startTime = Date.now()

    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '0.1.0',
      checks: {
        database: false,
        monitoring: { sentry: false, analytics: false }
      },
      performance: {
        responseTime: 0
      }
    }

    // Database connectivity check
    try {
      const dbHealth = await checkDatabaseHealth()
      health.checks.database = dbHealth.healthy
      if (!dbHealth.healthy) {
        console.error('Database health check failed:', dbHealth.error)
        health.status = 'degraded'
      }
    } catch (error) {
      console.error('Database health check failed:', error)
      health.checks.database = false
      health.status = 'degraded'
    }

    // Monitoring services health check
    try {
      health.checks.monitoring = await monitoring.healthCheck()
    } catch (error) {
      console.error('Monitoring health check failed:', error)
    }

    // Calculate response time
    health.performance.responseTime = Date.now() - startTime

    // Set status based on critical checks
    if (!health.checks.database) {
      health.status = 'unhealthy'
      return NextResponse.json(health, { status: 503 })
    }

    return NextResponse.json(health, { 
      status: health.status === 'healthy' ? 200 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      environment: process.env.NODE_ENV
    }, { status: 503 })
  }
}