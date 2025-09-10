# Hayl Energy AI - Codebase Summary

## Project Overview
**Hayl Energy AI** is a Next.js 15.4.4 TypeScript application focused on Smart Energy Management Solutions powered by Artificial Intelligence. It features a complete authentication system with email verification, built on modern web technologies.

### Tech Stack
- **Framework**: Next.js 15.4.4 (App Router)
- **Language**: TypeScript 5
- **Database**: PostgreSQL with Prisma ORM 6.12.0
- **Authentication**: JWT-based with HTTP-only cookies
- **Styling**: Tailwind CSS 4.1.11
- **Testing**: Jest 30.0.5 with React Testing Library
- **Runtime**: React 19.1.0

## Architecture & Key Features

### 🔐 Authentication System (Complete)
- **JWT Strategy**: Access tokens (15min) + Refresh tokens (7 days)
- **Security Features**:
  - Rate limiting (5 auth attempts/15min, 3 signups/hour)
  - bcryptjs password hashing (12 salt rounds)
  - CORS protection & security headers (CSP, HSTS, X-Frame-Options)
  - Input sanitization & XSS prevention
  - Password strength validation with entropy calculation
- **Email Verification**: Complete flow with 24-hour token expiration
- **Middleware Protection**: Route-based authentication with smart redirects

### 🏗️ Project Structure
```
src/
├── app/                          # Next.js App Router
│   ├── api/auth/                # Authentication endpoints
│   │   ├── signup/route.ts      # User registration
│   │   ├── login/route.ts       # User login
│   │   ├── logout/route.ts      # User logout
│   │   ├── verify-email/route.ts # Email verification
│   │   └── me/route.ts          # Current user data
│   ├── dashboard/page.tsx       # Protected dashboard
│   ├── login/page.tsx           # Login page
│   ├── signup/page.tsx          # Registration page
│   ├── verify-email/page.tsx    # Email verification page
│   └── layout.tsx               # Root layout with AuthProvider
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Alert.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── PasswordStrength.tsx
│   ├── Navigation.tsx           # Responsive navigation
│   ├── Layout.tsx               # Page layout wrapper
│   └── ProtectedRoute.tsx       # Route protection component
├── contexts/
│   └── AuthContext.tsx          # Authentication context & hooks
└── lib/                         # Utility libraries
    ├── auth.ts                  # Core auth utilities
    ├── jwt.ts                   # JWT token management
    ├── prisma.ts                # Database client
    ├── email-service.ts         # Email service (dev console logging)
    ├── rate-limit.ts            # Rate limiting
    ├── password-strength.ts     # Password validation
    ├── security-headers.ts      # Security middleware
    ├── auth-logger.ts           # Security event logging
    ├── validation.ts            # Input validation
    ├── sanitization.ts          # Input sanitization
    └── test-utils.ts            # Testing utilities
```

### 🗄️ Database Schema (PostgreSQL + Prisma)
```prisma
model User {
  id                 String   @id @default(cuid())
  email              String   @unique
  password           String
  name               String?
  emailVerified      Boolean  @default(false)
  verificationToken  String?  @unique
  tokenExpiresAt     DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  @@map("auth_users")
}
```

### 🛡️ Security Implementation
- **Middleware Protection**: Route-based auth in `middleware.ts:5-98`
- **Rate Limiting**: IP-based throttling in `src/lib/rate-limit.ts`
- **Security Headers**: CSP, HSTS, X-Frame-Options in `src/lib/security-headers.ts`
- **Password Security**: Entropy validation in `src/lib/password-strength.ts`
- **Input Sanitization**: XSS prevention in `src/lib/sanitization.ts`
- **Audit Logging**: Security events in `src/lib/auth-logger.ts`

### 📧 Email System
- **Professional Templates**: HTML/text emails with Hayl Energy AI branding
- **Development Mode**: Console logging for testing
- **Production Ready**: Integration points for SendGrid, AWS SES, Nodemailer
- **Token Security**: UUID-based, 24-hour expiration, one-time use

## Development Workflow

### 🚀 Available Scripts
```bash
# Development
npm run dev                    # Start dev server with Turbopack
npm run build                 # Build production app
npm run start                 # Start production server

# Testing
npm test                      # Run all tests
npm run test:watch           # Watch mode testing
npm run test:coverage        # Coverage report
npm run test:api             # API endpoint tests

# Database
npx prisma generate          # Generate Prisma client
npx prisma db push          # Push schema changes
npx prisma studio           # Database GUI

# Quality Assurance
npm run lint                 # ESLint checking
npm run type-check          # TypeScript validation
npm run security:audit      # Security audit
npm run production:check    # Full pre-deploy check
```

### 🧪 Testing Strategy
- **Unit Tests**: Components and utilities with jsdom
- **Integration Tests**: API endpoints with supertest
- **Coverage**: Comprehensive test coverage tracking
- **Environment**: Separate configurations for different test types

### 🔧 Environment Variables Required
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="long-random-string"
JWT_REFRESH_SECRET="long-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

## Key Dependencies
- **Core**: next@15.4.4, react@19.1.0, typescript@5
- **Database**: @prisma/client@6.12.0, prisma@6.12.0
- **Authentication**: jose@6.0.12, jsonwebtoken@9.0.2, bcryptjs@3.0.2
- **Email**: @sendgrid/mail@8.1.5
- **Styling**: tailwindcss@4.1.11, @tailwindcss/postcss@4.1.11
- **Testing**: jest@30.0.5, @testing-library/react@16.3.0, supertest@7.1.4

## Current Status & Roadmap

### ✅ Completed Features
- Complete authentication system with JWT
- Email verification flow with professional templates
- Responsive UI with Tailwind CSS
- Comprehensive security implementation
- Route protection with smart redirects
- Database schema and migrations
- Testing framework setup
- Development and production scripts

### 🚧 Known Issues
- Node.js version warnings (requires ^18.18.0 || ^19.8.0 || >= 20.0.0)
- Jest configuration needs refinement for full test execution
- @types/bcryptjs deprecated (bcryptjs provides own types)

### 🎯 Planned Features
- Password reset functionality
- OAuth providers (Google, GitHub)
- Role-based access control (RBAC)
- Production email service integration
- Redis for production rate limiting
- Monitoring and alerting
- Audit logging
- Production database setup

## Deployment Information
- **Current Environment**: Development (localhost:3003)
- **Build System**: Next.js with Turbopack
- **Database**: PostgreSQL with Prisma migrations
- **Security**: Production-ready security headers and CORS
- **Monitoring**: Health check endpoint at `/api/health`

## File Locations Summary
- **Configuration**: `package.json`, `tsconfig.json`, `next.config.ts`, `middleware.ts`
- **Database**: `prisma/schema.prisma`, `src/lib/prisma.ts`
- **Authentication**: `src/contexts/AuthContext.tsx`, `src/lib/auth.ts`, `src/lib/jwt.ts`
- **API Routes**: `src/app/api/auth/*/route.ts`
- **UI Components**: `src/components/` and `src/components/ui/`
- **Security**: `src/lib/security-*.ts`, `src/lib/rate-limit.ts`, `src/lib/auth-logger.ts`
- **Tests**: `src/__tests__/` and `src/*/___tests___/`
- **Documentation**: `CLAUDE.md` (session memory), `README.md`, `CODEBASE_SUMMARY.md`

---
*Generated automatically on 2025-09-09 - Last updated: Branch Yemi*