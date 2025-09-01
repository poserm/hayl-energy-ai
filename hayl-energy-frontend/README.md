# Hayl Energy AI - Frontend Dashboard

A comprehensive Next.js frontend for energy market intelligence with a focus on Virginia utilities and all energy technologies.

## 🚀 Features

### Core Functionality
- **Virginia Energy Market Dashboard** - Main overview with utility grid and market metrics
- **Utility Analysis** - Individual utility profiles with technology mix, capacity, and service territories
- **Comparison Tools** - Side-by-side utility comparison with detailed metrics
- **Interactive Maps** - Virginia geographic analysis and service territory visualization
- **Technology Analytics** - Comprehensive charts for all energy sources (coal, gas, nuclear, renewables, storage)
- **Real-time Data** - Integration with FastAPI energy data service

### Energy Technologies Covered
- **Traditional**: Coal, Natural Gas, Nuclear
- **Renewables**: Solar, Wind, Hydro, Biomass, Geothermal  
- **Storage**: Battery, Pumped Storage, Other
- **Planning**: Retirements, Additions, Technology Transitions

### Virginia Focus
- **Major Utilities**: Dominion Energy, Appalachian Power, NOVEC, REC
- **Ownership Types**: Investor-owned, Cooperatives, Municipal
- **Regional Analysis**: Northern VA, Central VA, Southwest VA, Tidewater
- **Regulatory Context**: Virginia SCC, Clean Economy Act compliance

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 15.4.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom energy industry theme
- **Charts**: Recharts for data visualization
- **Maps**: Leaflet/React-Leaflet for geographic analysis
- **Authentication**: JWT integration with existing auth system
- **API**: Custom client for FastAPI energy backend

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main energy dashboard
│   ├── login/             # Authentication pages
│   └── signup/
├── components/            # Reusable UI components
│   ├── dashboard/         # Dashboard-specific components
│   ├── layout/           # Layout components
│   ├── ui/               # Basic UI components
│   └── visualization/    # Charts and data viz
├── contexts/             # React contexts (Auth)
├── data/                # Static data and configurations
├── lib/                 # Utilities and API clients
└── types/               # TypeScript type definitions
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Access to authentication backend (port 3003)
- Access to energy data API (port 8001)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the following variables:
   ```bash
   # Authentication (existing system integration)
   NEXT_PUBLIC_AUTH_API_URL=http://localhost:3003
   JWT_SECRET=your-jwt-secret-here
   
   # Energy API
   NEXT_PUBLIC_ENERGY_API_URL=http://localhost:8001
   
   # Configuration
   NEXT_PUBLIC_VIRGINIA_FOCUS=true
   NEXT_PUBLIC_APP_ENV=development
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Redirects to dashboard after authentication

## 🔧 Development

### Available Scripts
```bash
# Development
npm run dev              # Start development server with turbopack
npm run build           # Build production version
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Generate coverage report

# Analysis
npm run build:analyze   # Bundle analysis
```

### Key Components

#### Dashboard Components
- `EnergyMarketDashboard` - Main dashboard with metrics and utility grid
- `UtilityGrid` - Filterable grid of Virginia utilities with logo sizing
- `UtilityCard` - Individual utility cards with key metrics
- `FilterTabs` - Ownership type filtering (Investor Owned, Cooperatives, Municipal)

#### Visualization Components
- `TechnologyMixChart` - Pie/bar charts for energy technology breakdown
- `CompactTechnologyMixChart` - Simplified charts for smaller spaces
- Charts support all energy sources, not just renewables

#### API Integration
- `energyApi` - Client for FastAPI backend integration
- `energyApiUtils` - Utility functions for data formatting and visualization
- Automatic fallback to static Virginia data if API unavailable

### Data Sources

#### Static Data (Development)
- Virginia utilities configuration with real capacity and customer data
- Service territory mapping by county
- Ownership type classifications
- Technology mix estimates

#### Dynamic Data (Production)
- Real-time utility data from FastAPI backend
- Historical capacity trends and projections
- Technology addition and retirement schedules
- Market analytics and insights

## 🎨 Design System

### Color Palette
- **Primary**: Deep blue (#1e40af) - Trust and stability
- **Secondary**: Green (#059669) - Renewable energy
- **Accent**: Orange (#ea580c) - Traditional energy
- **Technology Colors**: Specific colors for each energy source

### Logo Sizing System
Utility logos are sized based on total capacity (50-100 scale):
- **100px**: >10 GW (Dominion Energy level)
- **80px**: 5-10 GW (Large utilities)
- **70px**: 2-5 GW (Medium utilities) 
- **60px**: 1-2 GW (Smaller utilities)
- **50px**: <1 GW (Cooperatives/Municipal)

### Typography
- **Headers**: Inter Bold
- **Body**: Inter Regular
- **Data/Tables**: JetBrains Mono

## 🔒 Authentication Integration

The frontend integrates with the existing Next.js authentication system:

1. **JWT Token Handling**: Automatic token management for API calls
2. **Protected Routes**: Dashboard and analysis pages require authentication
3. **User Context**: Shared authentication state across components
4. **Automatic Redirects**: Smart routing based on authentication status

### Auth Flow
1. User signs in via existing auth system (port 3003)
2. JWT token stored in HTTP-only cookies
3. Frontend API client includes token in energy API requests
4. Protected dashboard routes accessible after authentication

## 📊 Virginia Energy Market Data

### Utility Coverage
- **Dominion Energy Virginia**: 2.7M customers, 23.4 GW capacity
- **Appalachian Power**: 550k customers, 3.1 GW capacity  
- **NOVEC**: 170k customers, cooperative
- **Rappahannock Electric**: 170k customers, cooperative
- **Municipal utilities**: Danville, others

### Market Context
- **Total Capacity**: 27+ GW across all utilities
- **Regulatory**: Virginia SCC oversight, Clean Economy Act compliance
- **Clean Energy Target**: 100% carbon-free by 2045
- **Key Trends**: Coal retirements, gas expansion, offshore wind, solar growth

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Build and deploy
npm run build
# Deploy via Vercel CLI or GitHub integration
```

### Environment Variables (Production)
```bash
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_ENERGY_API_URL=https://api.your-domain.com
NEXT_PUBLIC_AUTH_API_URL=https://auth.your-domain.com
```

## 🛡️ Security

- **Authentication**: JWT-based with HTTP-only cookies
- **API Security**: Bearer token authentication for energy data
- **CSP Headers**: Content Security Policy configuration
- **Input Validation**: Client and server-side validation
- **HTTPS**: Required for production deployment

## 📈 Performance

- **Next.js 15**: App Router with performance optimizations
- **Turbopack**: Fast development builds
- **Image Optimization**: Automatic image optimization for utility logos
- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Components and data loaded on demand

## 🤝 Contributing

1. Follow existing code patterns and TypeScript types
2. Use the established component structure
3. Maintain Virginia energy market focus
4. Include comprehensive energy technology support
5. Test authentication integration

## 📝 License

This project is part of the Hayl Energy AI platform for comprehensive energy market intelligence.

---

**Hayl Energy AI** - Comprehensive Virginia Energy Market Intelligence Platform