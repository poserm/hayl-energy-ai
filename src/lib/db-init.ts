/**
 * Database initialization utility
 * Ensures database tables exist and are properly set up
 */

import { prisma } from './prisma'

export async function initializeDatabase() {
  try {
    console.log('Checking database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check if User table exists by running a simple query
    await prisma.user.findFirst()
    console.log('✅ Database tables are accessible')
    
    return { success: true, message: 'Database initialized successfully' }
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    
    // If tables don't exist, this will help identify the issue
    if (error instanceof Error && error.message.includes('does not exist')) {
      return { 
        success: false, 
        message: 'Database tables not found. Run `prisma db push` to create them.',
        error: error.message
      }
    }
    
    return { 
      success: false, 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  } finally {
    await prisma.$disconnect()
  }
}

export async function checkDatabaseHealth() {
  try {
    await prisma.$connect()
    
    // Run a quick test query
    const userCount = await prisma.user.count()
    
    await prisma.$disconnect()
    
    return {
      healthy: true,
      userCount,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    await prisma.$disconnect()
    
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}