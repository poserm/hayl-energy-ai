# 🗄️ Database Setup Guide

## 🎯 **Current Recommendation: Keep Vercel Postgres for Now**

Since you already have:
- Domain on Vercel (haylenergyai.com) ✅
- Environment variables configured ✅
- Database created ✅

**Let's stick with Vercel Postgres** and get your app working quickly!

## 🚀 **Quick Migration Steps**

### 1. **Get Your Production Database URL**
```bash
# Go to: Vercel Dashboard → Storage → hayl-energy-ai-db → .env.local tab
# Copy the POSTGRES_PRISMA_URL value
```

### 2. **Update .env.production File**
```bash
# Replace "your-production-database-url-here" with your actual URL
# File: .env.production
POSTGRES_PRISMA_URL="postgres://your-actual-url"
DATABASE_URL="postgres://your-actual-url"
```

### 3. **Push Your Local Schema to Production**
```bash
# Load production environment
export $(cat .env.production | xargs)

# Push schema to production
npx prisma db push --schema=./prisma/schema.prisma

# Generate Prisma client
npx prisma generate
```

### 4. **Verify Migration**
```bash
# Test the connection
npx prisma studio --schema=./prisma/schema.prisma
```

## 📊 **Database Strategy by Phase**

### **Phase 1: MVP/Testing (Current)**
- **Local**: PostgreSQL (your current setup) ✅
- **Production**: Vercel Postgres ✅
- **Pros**: Fast setup, integrated deployment
- **Cons**: 256MB limit on free tier

### **Phase 2: Scale (Future)**
- **Local**: PostgreSQL (same) ✅
- **Production**: Migrate to Neon or Supabase
- **Why**: Better performance, more storage, advanced features

### **Phase 3: Enterprise (Later)**
- **Local**: PostgreSQL (same) ✅
- **Production**: AWS RDS or Google Cloud SQL
- **Why**: Enterprise features, compliance, dedicated support

## 🛠️ **Migration Commands**

### **To Vercel Postgres (Current)**
```bash
# Using your existing Vercel database
npx prisma db push --schema=./prisma/schema.prisma
```

### **Future Migration to Neon/Supabase**
```bash
# 1. Create new database on Neon/Supabase
# 2. Update environment variables
# 3. Run migration
npx prisma migrate deploy --schema=./prisma/schema.prisma

# 4. Export data from old database (if needed)
pg_dump $OLD_DATABASE_URL | psql $NEW_DATABASE_URL
```

## 🔒 **Environment Variables**

### **Local Development (.env.local)**
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/hayl_energy_ai_dev"
JWT_SECRET="your-dev-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### **Production (Vercel Dashboard)**
```bash
POSTGRES_PRISMA_URL="postgres://..."
JWT_SECRET="your-production-secret"
NEXTAUTH_URL="https://haylenergyai.com"
```

## ✅ **Current Action Plan**

1. **Get your Vercel Postgres URL** from dashboard
2. **Update .env.production** with the real URL
3. **Run migration**: `npx prisma db push`
4. **Test authentication** on haylenergyai.com
5. **Success!** Your beautiful UI will work with full auth 🚀

## 🔄 **Future Considerations**

When you're ready to scale (after MVP proves successful):

1. **Neon PostgreSQL** - Great serverless option
2. **Supabase** - PostgreSQL + Auth + Real-time features
3. **PlanetScale** - If you want to try MySQL

But for now, **stick with Vercel Postgres** - it's the fastest path to success!