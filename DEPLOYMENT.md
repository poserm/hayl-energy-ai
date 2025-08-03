# Production Deployment Guide - Hayl Energy AI

## 🚀 Quick Start Deployment

### Prerequisites
- **Node.js**: v20.11.0 or higher (specified in `.nvmrc`)
- **PostgreSQL**: v15+ database instance
- **Vercel Account**: Free tier sufficient for initial deployment
- **SendGrid Account**: For email services (recommended)

### 1. Environment Setup

#### Local Development
```bash
# Install correct Node.js version
nvm use

# Install dependencies
npm install

# Setup local database
createdb hayl_energy_ai_dev

# Copy and configure environment
cp .env.example .env.local
# Edit .env.local with your local database URL
```

#### Production Environment Variables
Copy the following variables to your Vercel dashboard:

```bash
# Required for Production
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.vercel.app
DATABASE_URL=postgresql://...  # Your production database
JWT_SECRET=your-32-char-secret
NEXTAUTH_SECRET=your-nextauth-secret
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@your-domain.com

# Optional but Recommended
SENTRY_DSN=your-sentry-dsn
VERCEL_ANALYTICS_ID=your-analytics-id
```

### 2. Database Setup

#### Vercel Postgres (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel@latest

# Login to Vercel
vercel login

# Add Postgres addon
vercel env add POSTGRES_URL
vercel env add POSTGRES_PRISMA_URL
vercel env add POSTGRES_URL_NON_POOLING
```

#### Alternative: External PostgreSQL
- **Railway**: $5/month with database included
- **Supabase**: Free tier with 500MB database
- **Amazon RDS**: Pay-as-you-go pricing

### 3. Email Service Setup

#### SendGrid (Recommended)
1. Create SendGrid account (free tier: 100 emails/day)
2. Generate API key
3. Verify sender domain
4. Add `SENDGRID_API_KEY` to Vercel environment

#### Alternative: AWS SES
1. Create AWS account
2. Set up SES in your region
3. Add AWS credentials to environment

### 4. Deployment Steps

#### One-Click Vercel Deployment
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/hayl-energy-ai)

#### Manual Deployment
```bash
# Build and test locally
npm run build
npm run start

# Deploy to Vercel
vercel --prod

# Run database migrations
npx prisma migrate deploy
```

### 5. Post-Deployment Verification

#### Health Check
Visit: `https://your-domain.vercel.app/api/health`
Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "monitoring": { "sentry": true, "analytics": true }
  }
}
```

#### Functionality Tests
1. **User Registration**: Create test account
2. **Email Verification**: Check email delivery
3. **Authentication**: Login/logout flow
4. **Dashboard Access**: Protected route access

## 🔧 Configuration Guide

### Security Headers
Production security headers are automatically configured in `next.config.ts`:
- HSTS with preload
- XSS Protection
- Content Security Policy
- Frame denial

### Monitoring & Analytics
- **Error Tracking**: Sentry integration for error monitoring
- **Performance**: Vercel Analytics for performance insights
- **Logging**: Structured logging with different levels per environment

### Database Configuration
- **Connection Pooling**: Automatic with Vercel Postgres
- **Graceful Shutdown**: Proper Prisma client disconnection
- **Migration Strategy**: Automatic deployment migrations

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check Node.js version
node --version  # Should be v20.11.0+

# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

#### Database Connection Issues
```bash
# Test database connection
npx prisma db push

# Reset database (development only)
npx prisma migrate reset
```

#### Email Delivery Problems
1. Check SendGrid API key validity
2. Verify sender email domain
3. Check spam folders
4. Review Vercel function logs

#### Environment Variable Issues
```bash
# List current environment variables
vercel env ls

# Pull latest environment variables
vercel env pull .env.local
```

### Performance Optimization

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

#### Database Performance
- Use connection pooling (enabled by default)
- Implement caching for frequent queries
- Monitor query performance with Prisma metrics

### Security Checklist

- ✅ HTTPS enforced (automatic with Vercel)
- ✅ Security headers configured
- ✅ JWT secrets are secure (32+ characters)
- ✅ Database connections use SSL
- ✅ Email templates sanitized
- ✅ Rate limiting implemented
- ✅ Input validation on all endpoints

## 📊 Monitoring & Maintenance

### Health Monitoring
- **Endpoint**: `/api/health`
- **Frequency**: Check every 5 minutes
- **Alerts**: Set up notifications for downtime

### Performance Metrics
- **Core Web Vitals**: Monitored via Vercel Analytics
- **API Response Times**: Logged in monitoring service
- **Error Rates**: Tracked via Sentry

### Backup Strategy
- **Database**: Automatic backups with Vercel Postgres
- **Code**: Git repository with proper branching
- **Environment**: Document all configuration changes

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
The deployment pipeline includes:
1. **Testing**: Unit tests, integration tests, type checking
2. **Security**: Dependency audit, security scanning
3. **Building**: Production build verification
4. **Deployment**: Automatic deployment to staging/production
5. **Health Checks**: Post-deployment verification

### Branch Strategy
- `main`: Staging environment (auto-deploy)
- `production`: Production environment (manual approval)
- Feature branches: Preview deployments

## 📞 Support & Maintenance

### Incident Response
1. Check health endpoint
2. Review Vercel function logs
3. Check Sentry for recent errors
4. Verify database connectivity
5. Review recent deployments

### Scaling Considerations
- **Traffic**: Vercel scales automatically
- **Database**: Monitor connection limits
- **Email**: Upgrade SendGrid plan if needed
- **Storage**: Monitor function execution limits

### Update Procedures
1. Test changes in development
2. Deploy to staging branch
3. Run integration tests
4. Deploy to production branch
5. Monitor health metrics

---

## 🎯 Production Readiness Checklist

- ✅ Node.js v20+ compatibility
- ✅ Production environment variables configured
- ✅ Database with connection pooling
- ✅ Real email service integration
- ✅ Security headers and HTTPS
- ✅ Error monitoring and logging
- ✅ Health check endpoint
- ✅ CI/CD pipeline with quality gates
- ✅ Performance optimization
- ✅ Documentation and runbooks

**Status**: ✅ **Production Ready**

For additional support, create an issue in the GitHub repository or contact the development team.