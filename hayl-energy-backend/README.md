# Hayl Energy AI Backend

**Energy Market Intelligence API with Virginia Focus**

This FastAPI backend provides comprehensive energy market data and analytics, with specialized focus on Virginia utilities and the broader U.S. energy market. It serves the React frontend with real-time data, utility profiles, technology analysis, and market intelligence.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 14+ with PostGIS extension
- Redis (optional, for production caching)

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Ensure JWT_SECRET matches your Next.js auth system
```

### 2. Install Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Setup Database

```bash
# Using Docker (recommended)
docker-compose up -d db redis

# Or setup PostgreSQL manually with PostGIS extension
# CREATE DATABASE hayl_energy_ai_db;
# CREATE EXTENSION postgis;
```

### 4. Load Data

```bash
# Copy data files from original database project
./scripts/copy_data.sh

# Load data into database
cd app
python ../scripts/load_data.py
```

### 5. Start the Server

```bash
# Development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using Docker
docker-compose up backend
```

🌐 **API Documentation**: http://localhost:8000/docs

## 📊 API Endpoints

### Virginia-Focused Endpoints

- `GET /api/v1/virginia/utilities` - Virginia utilities with capacity-based logo sizing
- `GET /api/v1/virginia/utilities/{id}/profile` - Detailed Virginia utility analysis
- `GET /api/v1/virginia/utilities/{id}/technology-mix` - Energy source breakdown

### General Utility Operations

- `GET /api/v1/utilities/{id}/profile` - Comprehensive utility profiles
- `GET /api/v1/utilities/{id}/technology-mix` - Complete technology analysis
- `POST /api/v1/utilities/compare` - Multi-utility comparison

### Market Analytics

- `GET /api/v1/analytics/capacity-trends` - Historical capacity development
- `GET /api/v1/analytics/market-overview` - National/regional market summary

### Geographic Intelligence

- `GET /api/v1/geography/virginia` - Virginia-specific geographic analysis

### System Endpoints

- `GET /` - API health and feature overview
- `GET /api/v1/health` - Detailed system health check
- `GET /api/v1/stats/summary` - Database and market statistics

## 🏗️ Architecture

### Key Features

- **Virginia Priority**: All endpoints prioritize Virginia utilities and data
- **Capacity-Based Scaling**: Utilities sized 1-100 for frontend logo display
- **JWT Integration**: Seamless authentication with Next.js frontend
- **Real-time Analytics**: Live market trends and capacity analysis
- **Geographic Intelligence**: County-level and service territory analysis
- **Technology Breakdown**: Complete energy source analysis (coal, gas, nuclear, renewables)

### Technology Stack

- **Framework**: FastAPI 0.104+ with async support
- **Database**: PostgreSQL 15+ with PostGIS for geographic data
- **Authentication**: JWT token validation (compatible with Next.js auth)
- **Data Processing**: SQLAlchemy 2.0 with optimized queries
- **Caching**: Redis for production performance
- **Documentation**: Auto-generated OpenAPI/Swagger docs

### Database Models

- **Generator**: 37,000+ power generators with full EIA data
- **Utility**: Electric utility information and market data
- **ServiceTerritory**: Geographic service area mapping
- **UtilitySales**: Customer and revenue data by utility
- **OperationalData**: Operational metrics and performance data
- **User**: Authentication integration with frontend

## 🔐 Authentication

The backend integrates with the existing Next.js JWT authentication system:

```python
# Protected endpoint example
@router.get("/protected-data")
async def get_protected_data(
    current_user: User = Depends(get_current_user)
):
    # User automatically verified via JWT token
    return {"data": "protected_content"}

# Optional authentication
@router.get("/public-with-personalization")
async def get_data(
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # Customize response based on user preferences
    if current_user and 'virginia' in current_user.states_of_interest:
        # Prioritize Virginia data
        pass
```

## 📈 Virginia-Specific Features

### Utility Scaling Algorithm

```python
# Capacity-based logo scaling for frontend display
if total_capacity >= 10000:  # 10 GW+
    size_category = "large"
    logo_scale = 100
elif total_capacity >= 2000:  # 2-10 GW
    logo_scale = 75
# Virginia utilities get +15 boost
if state == 'VA':
    logo_scale = min(100, logo_scale + 15)
```

### Market Prioritization

- Virginia utilities listed first in all responses
- Neighboring states included when they serve Virginia market
- County-level analysis for Virginia energy infrastructure
- Service territory mapping for utility coverage areas

### Technology Classification

```python
# Clean energy categories
renewable_sources = ['SUN', 'WND', 'WAT', 'GEO', 'BIO', 'WAS']
nuclear_sources = ['NUC']
fossil_sources = ['NG', 'COL', 'PET', 'OIL']

# Color coding for consistent UI display
technology_colors = {
    "Natural Gas": "#4F7CAC",
    "Coal": "#8B4513", 
    "Nuclear": "#9370DB",
    "Solar": "#FFD700",
    "Wind": "#90EE90"
}
```

## 🐳 Docker Deployment

### Development

```bash
# Start all services
docker-compose up

# Backend only
docker-compose up backend db redis
```

### Production

```bash
# With nginx reverse proxy
docker-compose --profile production up -d

# Environment-specific configuration
ENVIRONMENT=production docker-compose up -d
```

### Docker Services

- **backend**: FastAPI application server
- **db**: PostgreSQL with PostGIS extension
- **redis**: Caching and rate limiting
- **nginx**: Reverse proxy (production profile)

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT (must match Next.js)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:3003

# Performance
MAX_WORKERS=4
CHUNK_SIZE=10000
RATE_LIMIT_PER_MINUTE=60
```

### CORS Configuration

The API is configured to work with the Next.js frontend:

```python
allow_origins=[
    "http://localhost:3000",  # Next.js dev
    "http://localhost:3003",  # Next.js custom port
    "https://haylenergyai.com",  # Production
]
```

## 📊 Data Coverage

### Generator Database
- **37,000+ generators** across all US states
- **Operating, planned, and retired** facilities
- **25+ generation technologies**
- **Geographic coordinates** for mapping
- **Historical data** from 2000-2025

### Virginia Focus
- **500+ Virginia generators** with priority analysis
- **County-level breakdown** for all Virginia counties
- **Service territory mapping** for utility coverage
- **Interstate utility tracking** for regional analysis

### Market Intelligence
- **3,000+ electric utilities** nationwide
- **Technology diversity scoring**
- **Capacity trend analysis**
- **Clean energy percentage tracking**
- **Market concentration metrics**

## 🛠️ Development

### Adding New Endpoints

1. Create router in `app/api/v1/`
2. Add Virginia prioritization logic
3. Include JWT authentication
4. Update main.py to include router
5. Test with frontend integration

### Database Queries

All queries are optimized for performance:

```python
# Virginia-first ordering
utilities.sort(key=lambda x: (not x["virginia_focus"], -x["total_capacity_mw"]))

# Efficient aggregation
query = db.query(
    Generator.entity_name,
    func.sum(Generator.nameplate_capacity_mw).label('total_capacity'),
    func.count(func.distinct(Generator.technology)).label('diversity')
).group_by(Generator.entity_name)
```

### Testing

```bash
# Run tests
pytest

# Test specific endpoints
pytest tests/test_virginia_endpoints.py

# Load testing
# Use the provided test scripts in scripts/
```

## 🚀 Integration with Next.js Frontend

### Authentication Flow

1. User logs in via Next.js auth system
2. JWT token stored in HTTP-only cookie
3. Frontend includes `Authorization: Bearer <token>` header
4. Backend validates token and extracts user info
5. Personalized responses based on user preferences

### API Client Example

```typescript
// Frontend API client integration
const response = await fetch('/api/v1/virginia/utilities', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { utilities } = await response.json();

// Utilities already sorted with Virginia priority
// Logo scaling included for UI display
```

## 📋 Differences from Original Database Project

### ✅ Added Features
- **Virginia prioritization** in all endpoints
- **Logo scaling algorithm** for frontend display
- **JWT authentication integration** 
- **Technology color coding** for consistent UI
- **Enhanced geographic analysis**
- **Multi-utility comparison** endpoint
- **Market position analytics**

### ❌ Removed Features  
- **Tableau integration** completely removed
- **Tableau export endpoints** eliminated
- **BI dashboard dependencies** removed
- **Tableau-specific data formatting** eliminated

### 🔄 Modified Features
- **Utility endpoints** enhanced with capacity scaling
- **Technology mix** includes all energy sources
- **Analytics endpoints** focused on React frontend needs
- **Geographic analysis** expanded for Virginia counties

## 🎯 Next Steps

1. **Data Loading**: Run `./scripts/copy_data.sh` and `python scripts/load_data.py`
2. **Frontend Integration**: Update React components to use new endpoints
3. **Authentication**: Ensure JWT secrets match between frontend and backend
4. **Production**: Configure production database and Redis
5. **Monitoring**: Add logging and performance monitoring
6. **Testing**: Create comprehensive API tests

## 🆘 Troubleshooting

### Common Issues

**Database Connection**
```bash
# Check PostgreSQL is running
docker-compose up db
# Verify connection
psql -h localhost -U hayl_admin -d hayl_energy_ai_db
```

**JWT Authentication**
```bash
# Ensure JWT_SECRET matches Next.js auth
# Check token format in request headers
# Verify user exists in database
```

**CORS Errors**
```bash
# Check CORS_ORIGINS includes frontend URL
# Verify request includes proper headers
# Test with curl or Postman first
```

## 📞 Support

- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health
- **Database Summary**: http://localhost:8000/api/v1/stats/summary

---

**Built for Hayl Energy AI Platform** - Energy Market Intelligence with Virginia Focus