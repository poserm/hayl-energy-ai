# Hayl Energy AI - Energy Data Backend

This is the FastAPI energy data service for comprehensive US energy market intelligence with Virginia focus.

## Project Overview
- **Type**: FastAPI REST API with PostgreSQL + PostGIS
- **Database**: PostgreSQL with PostGIS for geospatial analysis
- **ORM**: SQLAlchemy with optimized indexes
- **Focus**: Complete US energy market data with Virginia emphasis
- **Deployment**: Railway or Render (better for persistent databases)
- **Integration**: Works with existing Next.js auth system

## Hybrid Architecture
```
Next.js App (Vercel)
├── Auth System (Prisma + JWT)
├── Frontend Dashboard  
└── API Integration Layer
        │
        ▼
FastAPI Energy Service (Railway)
├── Energy Data Models
├── Analytics Endpoints
├── Geographic Queries
└── PostgreSQL + PostGIS
```

## Database Models

### Core Entities
- **Generator**: Power plants and facilities (37K+ records)
- **Utility**: Electric companies with ownership data (1.7K+ records) 
- **UtilitySales**: Revenue and customer data by sector
- **OperationalData**: System operations and financial metrics
- **ServiceTerritory**: Geographic coverage mapping

### Technology Categories
- **Fossil Fuels**: Natural Gas, Coal, Oil
- **Nuclear**: Nuclear reactors
- **Renewables**: Solar, Wind, Hydro, Geothermal
- **Storage**: Battery systems
- **Other**: Biomass, Landfill Gas

## Virginia Energy Market Focus

### Key Virginia Utilities
- **Dominion Energy Virginia** (Largest - serving most of VA)
- **Appalachian Power Company** (AEP subsidiary)
- **Northern Virginia Electric Cooperative**
- **Rappahannock Electric Cooperative** 
- **Virginia Electric & Power Company**

### Virginia Energy Mix Analysis
- Coal plants and retirement schedules
- Natural gas expansion
- Solar development (fastest growing)
- Offshore wind potential
- Nuclear (North Anna, Surry stations)

## API Endpoints Design

### Virginia-Specific
```python
GET /api/v1/virginia/utilities           # VA utilities with capacity data
GET /api/v1/virginia/energy-mix          # VA technology breakdown
GET /api/v1/virginia/capacity-trends     # Historical capacity development
GET /api/v1/virginia/renewable-progress  # Clean energy transition
```

### Utility Analysis  
```python
GET /api/v1/utilities/{id}/profile       # Complete utility overview
GET /api/v1/utilities/{id}/generation    # Generation portfolio
GET /api/v1/utilities/{id}/territory     # Service area mapping
GET /api/v1/utilities/compare            # Multi-utility comparison
```

### Market Analytics
```python
GET /api/v1/analytics/technology-trends  # Technology adoption over time
GET /api/v1/analytics/capacity-by-state  # State-level capacity analysis
GET /api/v1/analytics/utility-rankings   # Performance metrics
GET /api/v1/analytics/market-overview    # National energy market summary
```

### Geographic Analysis
```python
GET /api/v1/geography/states/{state}     # State-level energy data
GET /api/v1/geography/utilities-map      # Utility service territories
GET /api/v1/geography/generators-map     # Power plant locations
```

## Database Visualization Options

### pgAdmin (Recommended)
- Full PostgreSQL management interface
- Visual schema browser and query builder
- Performance monitoring and optimization
- Similar experience to Prisma Studio

### Setup pgAdmin
```bash
# Docker setup
docker run -d \
  --name pgadmin \
  -p 5050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@hayl-energy.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin123 \
  dpage/pgadmin4

# Access: http://localhost:5050
```

## Development Environment
```bash
# Backend setup
cd hayl-energy-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Database
createdb hayl_energy_data
psql hayl_energy_data -c "CREATE EXTENSION postgis;"

# Data migration
python scripts/migrate_excel_data.py

# Start API
uvicorn app.main:app --reload --port 8001
```

## Integration with Auth System
```python
# In FastAPI endpoints
@router.get("/api/v1/utilities/")
async def get_utilities(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    # Validate JWT token from Next.js auth system
    user = validate_jwt_token(authorization)
    if not user:
        raise HTTPException(401, "Unauthorized")
    
    # Return energy data based on user's regional focus
    utilities = get_utilities_for_user(user, db)
    return utilities
```

## Frontend Integration
```typescript
// In Next.js frontend
const energyApiClient = {
  baseURL: process.env.NEXT_PUBLIC_ENERGY_API_URL,
  
  async getVirginiUtilities() {
    const token = await getAuthToken()
    return fetch(`${this.baseURL}/api/v1/virginia/utilities`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  }
}
```

## Performance Considerations
- **Caching**: Redis for frequently accessed analytics
- **Indexing**: Optimized database indexes for common queries
- **Pagination**: Large datasets with cursor-based pagination
- **Geographic Queries**: PostGIS spatial indexes for map performance

## Company Logo Management
- Store utility logos in `/static/logos/`
- Fallback placeholder system for missing logos
- Size-based rendering (50-100 scale) as shown in wireframes
- CDN integration for fast logo loading