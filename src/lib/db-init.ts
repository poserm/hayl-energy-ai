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
    
    // First, let's check what tables exist
    try {
      const tables = await prisma.$queryRaw<Array<{table_name: string}>>`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `
      console.log('Existing tables:', tables.map(t => t.table_name))
      
      // Check if auth_users table exists
      const authUsersExists = tables.some(t => t.table_name === 'auth_users')
      
      if (!authUsersExists) {
        console.log('⚠️ auth_users table not found, creating it...')
        
        // Create auth_users table (mapped from User model)
        await prisma.$executeRaw`
          CREATE TABLE "auth_users" (
            "id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "password" TEXT NOT NULL,
            "name" TEXT,
            "emailVerified" BOOLEAN NOT NULL DEFAULT false,
            "verificationToken" TEXT,
            "tokenExpiresAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
          )
        `
        
        // Create unique indexes
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX "auth_users_email_key" ON "auth_users"("email")
        `
        
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX "auth_users_verificationToken_key" ON "auth_users"("verificationToken")
        `
        
        console.log('✅ Database tables created successfully')
      }
      
      // Test table access
      await prisma.user.findFirst()
      console.log('✅ Database tables are accessible')
    } catch (tableError) {
      console.error('Error during table creation:', tableError)
      throw tableError
    }
    
    return { success: true, message: 'Database initialized successfully' }
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    
    return { 
      success: false, 
      message: 'Database initialization failed',
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