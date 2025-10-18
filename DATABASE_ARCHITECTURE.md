# Hayl Energy AI - Database Architecture & Backend Documentation

## Overview

Hayl Energy AI uses a **hybrid database architecture** combining two specialized systems:

1. **Authentication Database** (PostgreSQL + Prisma ORM)
2. **Energy Data Backend** (PostgreSQL + PostGIS + FastAPI)

This separation ensures optimal performance, security, and scalability for each domain.

## 1. Authentication Database (Prisma)

### Database: PostgreSQL
- **Purpose**: User authentication, authorization, and account management
- **ORM**: Prisma (Next.js integration)
- **Location**: Hosted on cloud provider (configured via DATABASE_URL)

### Schema Structure

#### User Table (`auth_users`)
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String    // bcrypt hashed
  name              String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  emailVerified     Boolean   @default(false)
  verificationToken String?   @unique
  tokenExpiresAt    DateTime?
}
```

**Key Features:**
- Email verification system with secure tokens
- Password hashing using bcryptjs (12 salt rounds)
- JWT-based authentication (access + refresh tokens)
- HTTP-only cookie storage for security

## 2. Energy Data Backend (FastAPI + SQLAlchemy)

### Database: PostgreSQL + PostGIS
- **Purpose**: Comprehensive US energy market data and analytics
- **ORM**: SQLAlchemy with optimized indexes
- **API**: FastAPI REST service (port 8001)
- **Special Features**: PostGIS for geospatial queries

### Core Data Models

#### 1. Generators Table (`generators`)
**Purpose**: Power plant and generator unit data (37,000+ records)

```sql
Key Fields:
- entity_id/entity_name: Utility ownership
- plant_id/plant_name: Power plant identification  
- plant_state/county: Geographic location
- technology: Energy source classification
- nameplate_capacity_mw: Generator capacity
- operating_year: When unit came online
- status: Operating/Planned/Retired
- latitude/longitude: GPS coordinates
- geom: PostGIS geometry point
```

**Energy Technologies:**
- Natural Gas (Combined Cycle, Combustion Turbine, Steam)
- Coal (Conventional Steam, Subcritical, Supercritical)
- Nuclear (Pressurized Water Reactor)
- Solar (Photovoltaic, Thermal)
- Wind (Onshore, Offshore)
- Hydro (Conventional, Pumped Storage)
- Battery Storage
- Other (Biomass, Landfill Gas, etc.)

#### 2. Utilities Table (`utilities`)
**Purpose**: Electric utility company profiles (1,700+ records)

```sql
Key Fields:
- utility_number: Unique EIA identifier
- utility_name: Company name
- state: Primary state of operation
- ownership_type: Public/Private/Cooperative/Federal
- nerc_region: Grid reliability region
- Business activity flags (generation, transmission, distribution, etc.)
- RTO/ISO participation flags
```

#### 3. Service Territories Table (`service_territories`)
**Purpose**: Geographic coverage by county

```sql
Key Fields:
- utility_number: Links to utilities table
- state/county: Service area coverage
- Enables geographic market analysis
```

#### 4. Utility Sales Table (`utility_sales`)
**Purpose**: Customer and revenue data by sector

```sql
Sectors Tracked:
- Residential: Home electricity use
- Commercial: Business consumption  
- Industrial: Manufacturing/heavy industry
- Transportation: Electric vehicle charging

Metrics per Sector:
- revenue_thousands: Revenue in thousands USD
- sales_mwh: Energy sold in megawatt-hours
- customers_count: Number of customers
```

#### 5. Operational Data Table (`operational_data`)
**Purpose**: System operations and financial metrics

```sql
Key Metrics:
- Peak demand (summer/winter)
- Net generation
- Power purchases/exchanges
- System losses
- Total revenue
```

### Database Indexes

**Optimized for Common Queries:**
```sql
-- Geographic queries
idx_gen_state_tech: (plant_state, technology)
idx_territory_state_county: (state, county)

-- Capacity analysis  
idx_gen_capacity: (nameplate_capacity_mw)

-- Time series analysis
idx_gen_year_tech: (operating_year, technology)

-- Entity relationships
idx_gen_entity_state: (entity_id, plant_state)
```

## Virginia Energy Market Focus

### Key Virginia Utilities
1. **Dominion Energy Virginia** (Entity ID: 5865)
   - Largest utility serving ~2.7M customers
   - Mix of nuclear, natural gas, coal, growing solar

2. **Appalachian Power Company** (Entity ID: 733)
   - AEP subsidiary serving SW Virginia
   - Coal transitioning to renewables

3. **Northern Virginia Electric Cooperative** (NOVEC)
   - Serves Northern VA suburbs
   - Distribution cooperative

4. **Rappahannock Electric Cooperative** (REC)
   - Central Virginia coverage
   - Rural electric cooperative

### Virginia Energy Mix Insights
- **Coal**: Declining - several retirements planned
- **Natural Gas**: Growing - new combined cycle plants
- **Nuclear**: Stable - North Anna & Surry stations
- **Solar**: Rapid growth - utility and distributed
- **Wind**: Offshore potential - coastal projects planned

## API Architecture

### Authentication Flow
```
Next.js App → /api/auth/* → Prisma → Auth Database
     ↓
  JWT Token
     ↓
Next.js App → FastAPI Energy Backend → Energy Database
```

### Energy API Endpoints

**Virginia-Specific:**
- `GET /api/v1/virginia/utilities` - VA utility profiles
- `GET /api/v1/virginia/energy-mix` - Technology breakdown
- `GET /api/v1/virginia/capacity-trends` - Historical development
- `GET /api/v1/virginia/counties` - County-level analysis

**National Analysis:**
- `GET /api/v1/utilities/{id}/profile` - Detailed utility data
- `GET /api/v1/analytics/technology-trends` - Tech adoption
- `GET /api/v1/geography/generators-map` - Plant locations

## Performance Optimizations

### Database Level
- **Indexes**: Covering indexes for all common query patterns
- **Partitioning**: Annual partitions for time-series data
- **PostGIS**: Spatial indexes for geographic queries

### API Level
- **Pagination**: Cursor-based for large datasets
- **Caching**: Redis for frequently accessed analytics
- **Connection Pooling**: SQLAlchemy session management

### Query Examples

**Find Virginia Solar Projects:**
```sql
SELECT plant_name, nameplate_capacity_mw, operating_year
FROM generators
WHERE plant_state = 'VA' 
  AND technology LIKE '%Solar%'
  AND status = 'Operating'
ORDER BY nameplate_capacity_mw DESC;
```

**Utility Market Share by State:**
```sql
SELECT u.utility_name, 
       COUNT(DISTINCT g.plant_id) as plant_count,
       SUM(g.nameplate_capacity_mw) as total_capacity
FROM utilities u
JOIN generators g ON u.utility_number = g.entity_id
WHERE g.plant_state = 'VA'
GROUP BY u.utility_name
ORDER BY total_capacity DESC;
```

## Data Update Schedule

- **Generators**: Updated monthly from EIA-860M
- **Utilities**: Annual update from EIA-861
- **Sales Data**: Annual update
- **Operational Data**: Annual update

## Security Considerations

### Authentication Database
- Passwords hashed with bcryptjs
- JWT tokens with short expiration
- HTTP-only cookies prevent XSS
- Rate limiting on auth endpoints

### Energy Database  
- Read-only access for API users
- Row-level security for sensitive data
- API key authentication for external access
- CORS configured for frontend origin

## Development Tools

### Database Management
- **Prisma Studio**: Visual editor for auth data
  ```bash
  npx prisma studio
  ```

- **pgAdmin**: Full PostgreSQL management
  ```bash
  docker run -p 5050:80 \
    -e PGADMIN_DEFAULT_EMAIL=admin@hayl.com \
    -e PGADMIN_DEFAULT_PASSWORD=admin123 \
    dpage/pgadmin4
  ```

### Testing Queries
- Use pgAdmin for complex energy queries
- Prisma Studio for auth data verification
- FastAPI /docs endpoint for API testing

## Integration Points

### Frontend → Backend
```typescript
// Frontend API client
const getVirginiaUtilities = async () => {
  const token = await getAuthToken() // From auth system
  
  const response = await fetch(
    `${ENERGY_API_URL}/api/v1/virginia/utilities`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  
  return response.json()
}
```

### Cross-Database Queries
When needing user + energy data:
1. Authenticate user via Prisma/auth database
2. Use user preferences to filter energy queries
3. Return personalized energy insights

## Deployment Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │     │  FastAPI Backend │
│   (Vercel)      │────▶│  (Railway/Render) │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Auth Database  │     │  Energy Database  │
│  (PostgreSQL)   │     │  (PostgreSQL +    │
│                 │     │   PostGIS)        │
└─────────────────┘     └──────────────────┘
```

## Monitoring & Maintenance

### Health Checks
- `/api/health` - Next.js app health
- `/health` - FastAPI backend health
- Database connection monitoring

### Performance Metrics
- Query execution time tracking
- API response time monitoring
- Database connection pool stats

### Backup Strategy
- Daily automated backups
- Point-in-time recovery enabled
- Separate backup policies for each database