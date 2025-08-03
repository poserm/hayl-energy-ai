import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  // Handle missing DATABASE_URL during build
  const databaseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.POSTGRES_PRISMA_URL 
    : process.env.DATABASE_URL

  // During build, don't create a real client if no database URL
  if (!databaseUrl && process.env.NODE_ENV === 'production') {
    // Return a mock client for build time
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error('Database not available during build')
      }
    })
  }
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: databaseUrl || "postgresql://user:password@localhost:5432/db"
      }
    }
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// In development, store the client globally to prevent re-instantiation
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown handling for production
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
  
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}