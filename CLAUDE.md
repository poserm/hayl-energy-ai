# Claude Code Session Memory

This file contains information for Claude Code to remember across sessions.

## Project Overview
- **Project Name**: Hayl Energy AI
- **Type**: Next.js 15.4.4 TypeScript Authentication System
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with HTTP-only cookies
- **Styling**: Tailwind CSS
- **Testing**: Jest with comprehensive test suite

## Development Commands
```bash
# Development
npm run dev

# Testing
npm test
npm run test:watch
npm run test:coverage
npm run test:api

# Building
npm run build
npm run start

# Linting
npm run lint

# Database
npx prisma generate
npx prisma db push
npx prisma studio
```

## Architecture Decisions
1. **App Router**: Using Next.js 13+ App Router instead of Pages Router
2. **JWT Strategy**: Access tokens (15min) + Refresh tokens (7 days)
3. **Security**: bcryptjs with 12 salt rounds, rate limiting, security headers
4. **State Management**: React Context with multiple specialized hooks
5. **Testing**: Separate environments for unit (jsdom) and integration (node) tests

## Key Files Created
- `middleware.ts` - Route protection and automatic redirects
- `src/contexts/AuthContext.tsx` - Enhanced auth context with hooks
- `src/lib/auth.ts` - Core authentication utilities
- `src/lib/jwt.ts` - JWT token management
- `src/lib/rate-limit.ts` - Rate limiting with IP detection
- `src/lib/auth-logger.ts` - Security event logging
- `src/lib/password-strength.ts` - Password validation
- `src/lib/test-utils.ts` - Testing utilities
- `src/components/Navigation.tsx` - Responsive navigation components
- Complete API routes in `src/app/api/auth/`
- Comprehensive test suite in `__tests__/` directories

## Environment Variables Required
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="long-random-string"
JWT_REFRESH_SECRET="long-random-string" 
NEXTAUTH_URL="http://localhost:3000"
```

## Security Features Implemented
- Rate limiting (5 auth/15min, 3 signup/hour)
- CORS protection
- Security headers (CSP, HSTS, X-Frame-Options)
- Input sanitization and XSS prevention
- Password strength validation with entropy calculation
- Authentication logging with security alerts

## Known Issues
- Node.js version warnings (v19.6.1, requires ^18.18.0 || ^19.8.0 || >= 20.0.0)
- Jest configuration needs refinement for full test execution
- @types/bcryptjs deprecated (bcryptjs provides own types)

## Email Verification System ✅
Complete email verification system implemented with:
- **Database Schema**: Added `emailVerified`, `verificationToken`, `tokenExpiresAt` fields
- **API Endpoints**: 
  - `GET /api/auth/verify-email?token=xyz` - Email verification
  - `POST /api/auth/verify-email` - Resend verification email
- **Email Service**: Professional HTML/text email templates with development console logging
- **Signup Flow**: Creates unverified users, sends verification emails
- **Login Flow**: Blocks unverified users, offers resend option
- **UI Pages**: `/verify-email` page with success/error states
- **Security**: 24-hour token expiration, one-time use tokens, comprehensive logging

## Next Steps / TODOs
- Set up production database
- Configure Redis for rate limiting in production
- ✅ Add email verification flow (COMPLETED)
- Implement password reset functionality
- Add OAuth providers (Google, GitHub)
- Set up monitoring and alerting
- Add audit logging
- Implement role-based access control (RBAC)
- Configure production email service (SendGrid/AWS SES)

## Testing Status
✅ API endpoint tests created
✅ Integration tests implemented  
✅ Test utilities and helpers
⚠️ Jest configuration needs fixing for full execution
⚠️ Need to resolve Node.js version compatibility

## Authentication Flow
1. User visits protected route → redirected to /login
2. User logs in → JWT token set in HTTP-only cookie → redirected to intended destination
3. Middleware checks token on each request
4. Token expires → automatic logout and redirect to login
5. User logs out → token cleared → redirected to login

## File Structure Complete
All authentication system components implemented including:
- Complete API routes with validation and security
- Responsive UI components with Tailwind CSS
- Comprehensive testing framework
- Security middleware and utilities
- Smart routing and redirect logic
- Database schema and client configuration