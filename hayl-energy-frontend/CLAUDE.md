# Hayl Energy AI - Frontend Dashboard

This is the Next.js frontend for comprehensive US energy market intelligence with Virginia utility focus.

## Project Overview
- **Type**: Next.js 15.4.4 with TypeScript and Tailwind CSS
- **Purpose**: Energy market intelligence dashboard and analytics
- **Integration**: Existing auth system + new FastAPI energy data service
- **Focus**: All energy sources (coal, gas, nuclear, renewables, storage) with Virginia emphasis
- **Deployment**: Vercel

## UI Architecture from Wireframes

### 1. Energy Buyers Dashboard (Primary View)
Based on wireframes 25-29, implement:

**Utility Company Grid**
- Display utilities with logo cards sized by capacity (50-100 scale)
- Virginia utilities: Dominion Energy, Appalachian Power, NOVEC, REC, etc.
- Filter tabs: Investor Owned, Cooperatives, Municipalities
- "ANALYSE UTILITY" button for detailed view

**Navigation Structure**
- Header: "VENTURE" branding with navigation (Home, Explore, Connections, Settings)
- Breadcrumb: "United States" with state selection
- Tab system: "Utilities" and "Corporates"

### 2. Individual Utility Analysis Pages
**Utility Profile Components:**
- Company header with logo and basic info
- Technology breakdown charts (Coal, Gas, Nuclear, Solar, Wind)
- Existing Portfolio table with capacity data by technology
- Retirements timeline and planning
- Geographic service territory maps (Virginia counties)

**Interactive Features:**
- Compare, Download, Share buttons
- Expandable sections for detailed analysis
- Latest news integration
- Advanced/Mid-stage/Early stage project categorization

### 3. Comparison Interface
- Side-by-side utility comparison
- Export functionality 
- "Exit comparison" option
- Detailed metrics tables
- Technology mix comparisons

## Component Architecture

### Core Components
```typescript
// Layout Components
- Layout.tsx              // Main app layout with navigation
- Header.tsx              // Top navigation with auth integration
- Sidebar.tsx             // Left navigation for dashboard

// Dashboard Components  
- EnergyBuyersDashboard.tsx    // Main dashboard view
- UtilityGrid.tsx              // Utility cards with logo sizing
- UtilityCard.tsx              // Individual utility card component
- FilterTabs.tsx               // Ownership type filters

// Analysis Components
- UtilityProfile.tsx           // Individual utility detailed view
- TechnologyMixChart.tsx       // Pie/bar charts for energy mix
- CapacityTimeline.tsx         // Historical capacity trends
- GeographicMap.tsx            // Virginia state/county maps

// Comparison Components
- ComparisonView.tsx           // Side-by-side utility comparison
- ComparisonTable.tsx          // Detailed metrics comparison
- ExportButtons.tsx            // PDF/Excel export functionality

// Data Visualization
- EnergyChart.tsx              // Generic chart component
- CapacityChart.tsx            // Capacity-specific visualizations
- InteractiveMap.tsx           // Virginia territory mapping
```

### Page Structure
```
src/
├── app/
│   ├── dashboard/                    # Main energy dashboard
│   │   ├── page.tsx                  # Energy buyers main view
│   │   └── utilities/
│   │       ├── page.tsx              # Utilities list
│   │       ├── [id]/
│   │       │   ├── page.tsx          # Individual utility profile
│   │       │   ├── compare/
│   │       │   │   └── page.tsx      # Utility comparison
│   │       │   └── territory/
│   │       │       └── page.tsx      # Geographic analysis
│   │       └── virginia/
│   │           └── page.tsx          # Virginia-specific utilities
│   ├── analytics/
│   │   ├── page.tsx                  # Market analytics dashboard
│   │   ├── technology/
│   │   │   └── page.tsx              # Technology trend analysis
│   │   └── geography/
│   │       └── page.tsx              # Geographic market analysis
│   └── api/                          # Integration with energy data API
├── components/                       # Reusable UI components
├── lib/
│   ├── energy-api.ts                 # FastAPI client integration
│   └── virginia-utils.ts             # Virginia-specific utilities
└── types/
    └── energy.ts                     # TypeScript interfaces
```

## API Integration Layer

### Energy Data Client
```typescript
// lib/energy-api.ts
class EnergyDataClient {
  private baseURL = process.env.NEXT_PUBLIC_ENERGY_API_URL
  
  async getVirginiUtilities() {
    const token = await getAuthToken() // From existing auth
    return this.request('/api/v1/virginia/utilities', token)
  }
  
  async getUtilityProfile(id: string) {
    const token = await getAuthToken()
    return this.request(`/api/v1/utilities/${id}/profile`, token)
  }
  
  async getTechnologyMix(utilityId: string) {
    const token = await getAuthToken()
    return this.request(`/api/v1/utilities/${utilityId}/technology-mix`, token)
  }
}
```

## Data Visualization Libraries
- **Recharts**: Primary charting library (technology mix, capacity trends)
- **Leaflet**: Interactive Virginia state and county maps
- **React Table**: Data tables for utility comparisons
- **Framer Motion**: Smooth animations and transitions

## Virginia-Specific Features

### 1. Virginia Utility Dashboard
- Focus on major VA utilities with proper sizing
- Virginia-specific energy mix analysis
- County-level service territory mapping
- Regulatory environment context (Virginia SCC)

### 2. Energy Transition Tracking
- Coal plant retirements in Virginia
- Natural gas infrastructure development  
- Renewable energy growth (solar farms, offshore wind)
- Storage deployment tracking

### 3. Regional Analysis
- Northern Virginia (NOVEC territory)
- Central Virginia (Dominion Energy)
- Southwest Virginia (Appalachian Power)
- Tidewater region analysis

## Company Logos System
```typescript
// Logo sizing based on capacity
const getLogoSize = (capacity: number) => {
  if (capacity > 10000) return 100      // Dominion Energy
  if (capacity > 5000) return 80        // Large utilities
  if (capacity > 2000) return 70        // Medium utilities
  if (capacity > 1000) return 60        // Smaller utilities
  return 50                             // Cooperatives/Municipal
}

// Logo management
- /public/logos/dominion-energy.svg
- /public/logos/appalachian-power.svg
- /public/logos/placeholder.svg         // Fallback
```

## Design System
**Colors**: Professional energy industry palette
- Primary: Deep blue (#1e40af) for trust and stability
- Secondary: Green (#059669) for renewable energy
- Accent: Orange (#ea580c) for traditional energy
- Gray scale: Modern neutral tones

**Typography**: Clean, data-focused typography
- Headers: Inter Bold
- Body: Inter Regular  
- Data: JetBrains Mono for numbers/tables

## Development Commands
```bash
# Setup
npm install

# Development with both auth and energy APIs
npm run dev                    # Frontend on :3000
# Energy API should run on :8001

# Building
npm run build
npm run start

# Testing
npm test
npm run test:e2e

# Linting
npm run lint
npm run type-check
```

## Environment Variables
```bash
# Auth integration (existing)
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="existing-auth-secret"

# Energy API integration (new)
NEXT_PUBLIC_ENERGY_API_URL="http://localhost:8001"
NEXT_PUBLIC_VIRGINIA_FOCUS="true"

# Deployment
NEXT_PUBLIC_ENV="development"
```

## Key Features to Implement
1. **Virginia Energy Market Dashboard** - Main utility overview with sizing
2. **Technology Mix Analysis** - All energy sources, not just renewables
3. **Utility Deep Dive** - Individual utility profiles and analysis
4. **Comparison Tool** - Side-by-side utility analysis
5. **Geographic Mapping** - Virginia counties and service territories
6. **Market Analytics** - Trends, forecasts, and insights
7. **Export Functionality** - PDF/Excel reports
8. **Responsive Design** - Mobile-friendly energy market analysis

## Integration Flow
1. User authenticates via existing Next.js auth system
2. Frontend fetches energy data from FastAPI backend
3. Virginia utilities displayed with proper logo sizing
4. Interactive analysis tools and comparison features
5. Real-time data updates and caching
6. Export and sharing capabilities

This frontend will provide a comprehensive energy market intelligence platform focused on Virginia while supporting national energy market analysis.