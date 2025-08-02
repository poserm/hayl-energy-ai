# Hayl Energy AI - Authentication System Guide

## Overview

This is a comprehensive Next.js TypeScript authentication system with enterprise-grade security features, automatic redirects, and comprehensive testing.

## File Structure

```
hayl-energy-ai/
├── 📄 Configuration Files
│   ├── package.json                 # Project dependencies and scripts
│   ├── package-lock.json           # Locked dependency versions
│   ├── tsconfig.json               # TypeScript configuration
│   ├── next.config.ts              # Next.js configuration
│   ├── next-env.d.ts               # Next.js TypeScript declarations
│   ├── middleware.ts               # Route protection & redirect logic
│   └── README.md                   # Project documentation
│
├── 🔧 Environment & Testing
│   ├── .env                        # Environment variables (production)
│   ├── .env.local                  # Local development environment
│   ├── .env.example                # Environment template
│   ├── .env.test                   # Test environment variables
│   ├── jest.config.js              # Jest testing configuration
│   ├── jest.setup.js               # Jest setup for jsdom tests
│   └── jest.setup.api.js           # Jest setup for API tests
│
├── 🗄️ Database
│   └── prisma/
│       └── schema.prisma           # Database schema (User model)
│
├── 📁 src/
│   ├── 🌐 app/ (Next.js App Router)
│   │   ├── layout.tsx              # Root layout component
│   │   ├── page.tsx                # Home page (redirects to auth)
│   │   │
│   │   ├── 🔐 Authentication Pages
│   │   ├── login/
│   │   │   └── page.tsx            # Login page with form validation
│   │   ├── signup/
│   │   │   └── page.tsx            # Signup page with form validation
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Protected dashboard page
│   │   │
│   │   └── 🚀 API Routes
│   │       └── api/
│   │           └── auth/
│   │               ├── signup/
│   │               │   └── route.ts        # User registration endpoint
│   │               ├── login/
│   │               │   └── route.ts        # User login endpoint
│   │               ├── logout/
│   │               │   └── route.ts        # User logout endpoint
│   │               ├── me/
│   │               │   └── route.ts        # Get current user endpoint
│   │               └── __tests__/
│   │                   ├── signup.api.test.ts   # Signup API tests
│   │                   ├── login.api.test.ts    # Login API tests
│   │                   └── me.api.test.ts       # Me API tests
│   │
│   ├── 🧩 components/
│   │   ├── Layout.tsx              # Main layout component
│   │   ├── Navigation.tsx          # Navigation components (header/footer/sidebar)
│   │   └── ProtectedRoute.tsx      # HOC for route protection
│   │
│   ├── 🔄 contexts/
│   │   └── AuthContext.tsx         # Enhanced authentication context & hooks
│   │
│   ├── 🪝 hooks/
│   │   └── useAuth.ts              # Legacy auth hook (superseded by context)
│   │
│   ├── 📚 lib/ (Core Libraries)
│   │   ├── 🔐 Authentication & Security
│   │   ├── auth.ts                 # Core auth utilities
│   │   ├── jwt.ts                  # JWT token management
│   │   ├── prisma.ts               # Database client
│   │   ├── rate-limit.ts           # Rate limiting middleware
│   │   ├── auth-logger.ts          # Authentication event logging
│   │   ├── password-strength.ts    # Password validation
│   │   ├── sanitization.ts         # Input sanitization
│   │   ├── validation.ts           # Input validation schemas
│   │   ├── cors.ts                 # CORS configuration
│   │   ├── security-headers.ts     # Security headers middleware
│   │   ├── security-examples.ts    # Security usage examples
│   │   └── test-utils.ts           # Testing utilities & helpers
│   │
│   ├── 🧪 __tests__/
│   │   └── auth-integration.test.ts    # Integration tests for auth flow
│   │
│   └── 📄 pages/ (Legacy Pages Router)
│       └── api/ (Empty - using App Router)
│
└── 📁 public/ (Static Assets)
```

## Key Features

### 🔐 Authentication System
- **JWT-based authentication** with access & refresh tokens (15min/7day)
- **Secure password hashing** with bcryptjs (12 salt rounds)
- **Email/password validation** with comprehensive error handling
- **Session management** with HTTP-only secure cookies

### 🛡️ Security Features
- **Rate limiting**: 5 auth attempts/15min, 3 signup/hour, 100 API/15min
- **CORS protection** with environment-aware settings
- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Input sanitization** and XSS prevention
- **Password strength validation** with entropy calculation (12+ criteria)
- **Authentication logging** with security alerts and threat detection

### 🔄 Smart Routing & Redirects
- **Automatic redirects**: Authenticated users → dashboard, guests → login
- **Redirect preservation**: Maintains intended destination through login flow
- **Route protection**: Middleware-based protecting `/dashboard`, `/profile`, `/settings`
- **Auth state management**: React Context with multiple specialized hooks

### 🧪 Comprehensive Testing
- **API endpoint tests**: Complete coverage for all authentication routes
- **Integration tests**: Full authentication flow testing
- **Security testing**: Token validation, error handling, edge cases
- **Test utilities**: Helper functions for mocking and assertions

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hayl_energy_ai"

# JWT Secrets (generate strong random strings)
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# App URL
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Database Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

### 3. Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

## API Endpoints

### POST /api/auth/signup
- **Purpose**: User registration
- **Body**: `{ email, password, name? }`
- **Security**: Rate limited (3/hour), password validation, email uniqueness
- **Response**: User object + JWT cookie

### POST /api/auth/login
- **Purpose**: User authentication
- **Body**: `{ email, password }`
- **Security**: Rate limited (5/15min), credential validation
- **Response**: User object + JWT cookie

### GET /api/auth/me
- **Purpose**: Get current user info
- **Auth**: Required (JWT token)
- **Response**: Current user object

### POST /api/auth/logout
- **Purpose**: User logout
- **Auth**: Required (JWT token)
- **Response**: Success message + cleared cookie

## Authentication Hooks

### useAuth()
Main authentication hook with full functionality:
```typescript
const { 
  user, 
  loading, 
  error, 
  isAuthenticated,
  login, 
  signup, 
  logout, 
  refreshAuth,
  clearError 
} = useAuth()
```

### useAuthStatus()
Lightweight hook for status checking:
```typescript
const { isAuthenticated, user, loading, isInitialized } = useAuthStatus()
```

### useRequireAuth(redirectTo?)
Automatic redirect for protected pages:
```typescript
const { isAuthenticated, loading, canAccess } = useRequireAuth('/login')
```

### useRequireGuest(redirectTo?)
Automatic redirect for guest-only pages:
```typescript
const { isAuthenticated, loading, canAccess } = useRequireGuest('/dashboard')
```

## Higher-Order Components

### withAuth
Protect components with authentication:
```typescript
const ProtectedComponent = withAuth(MyComponent, '/login')
```

### withGuest
Restrict components to guests only:
```typescript
const GuestOnlyComponent = withGuest(MyComponent, '/dashboard')
```

## Navigation Components

### AuthNavigation
Responsive navigation with authentication awareness:
```typescript
<AuthNavigation 
  variant="header|footer|sidebar" 
  showLogo={true}
  className="custom-styles"
/>
```

### AuthPageNav
Navigation between login/signup pages:
```typescript
<AuthPageNav currentPage="login|signup" />
```

## Security Best Practices Implemented

### 1. Password Security
- Minimum 8 characters with complexity requirements
- bcryptjs hashing with 12 salt rounds
- Entropy calculation and strength validation
- Pattern detection for common weaknesses

### 2. Token Management
- Short-lived access tokens (15 minutes)
- Longer refresh tokens (7 days)
- HTTP-only secure cookies
- Automatic token refresh

### 3. Rate Limiting
- IP-based rate limiting with memory store
- Different limits for different endpoints
- Proxy header support for real IP detection

### 4. Input Validation
- Comprehensive Zod schemas
- Server-side validation on all endpoints
- HTML sanitization to prevent XSS
- SQL injection prevention with Prisma

### 5. Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

## Testing Strategy

### Unit Tests
- Individual function testing
- Mock external dependencies
- Test edge cases and error conditions

### Integration Tests
- Complete authentication flows
- API endpoint testing with real requests
- Database integration testing

### Security Tests
- Token validation and expiration
- Rate limiting functionality
- Input sanitization effectiveness
- Error handling security

## Common Usage Patterns

### Protecting a Page
```typescript
// Option 1: Using the hook
function ProtectedPage() {
  const { canAccess, loading } = useRequireAuth()
  
  if (loading) return <div>Loading...</div>
  if (!canAccess) return null // Will redirect
  
  return <div>Protected content</div>
}

// Option 2: Using HOC
const ProtectedPage = withAuth(() => {
  return <div>Protected content</div>
})
```

### Custom Login Form
```typescript
function LoginForm() {
  const { login, loading, error } = useAuth()
  
  const handleSubmit = async (email: string, password: string) => {
    const success = await login(email, password, '/dashboard')
    if (success) {
      // Redirect handled automatically
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && <div className="error">{error}</div>}
      <button disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
```

### Navigation with Auth State
```typescript
function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  
  return (
    <header>
      {isAuthenticated ? (
        <>
          <span>Welcome, {user?.name}</span>
          <button onClick={() => logout()}>Sign Out</button>
        </>
      ) : (
        <>
          <Link href="/login">Sign In</Link>
          <Link href="/signup">Sign Up</Link>
        </>
      )}
    </header>
  )
}
```

## Environment Variables Reference

```bash
# Required - Database connection
DATABASE_URL="postgresql://user:pass@localhost:5432/db_name"

# Required - JWT secrets (use long random strings)
JWT_SECRET="your-jwt-secret-minimum-32-characters"
JWT_REFRESH_SECRET="your-refresh-secret-minimum-32-characters"

# Required - Application URL
NEXTAUTH_URL="http://localhost:3000"

# Optional - Development settings
NODE_ENV="development|production|test"

# Optional - Logging level
LOG_LEVEL="debug|info|warn|error"
```

## Troubleshooting

### Common Issues

1. **JWT_SECRET not set**
   - Ensure JWT_SECRET is defined in your environment
   - Use a strong, random string (32+ characters)

2. **Database connection issues**
   - Verify DATABASE_URL format
   - Check database server is running
   - Run `npx prisma generate` after schema changes

3. **CORS errors**
   - Check NEXTAUTH_URL matches your domain
   - Verify environment configuration

4. **Rate limiting triggered**
   - Wait for the rate limit window to reset
   - Check rate limit configuration in `src/lib/rate-limit.ts`

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

## Production Deployment

### Security Checklist
- [ ] Strong JWT secrets set
- [ ] Database connection secured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Security headers applied
- [ ] Input validation enabled
- [ ] Error messages don't leak sensitive info

### Performance Optimizations
- [ ] Database connection pooling
- [ ] Redis for rate limiting (replace memory store)
- [ ] CDN for static assets
- [ ] Monitoring and logging setup

## Contributing

When adding new features:
1. Follow existing code patterns
2. Add comprehensive tests
3. Update this documentation
4. Ensure security best practices
5. Test with real data scenarios

## License

This authentication system was built for Hayl Energy AI and includes enterprise-grade security features suitable for production use.