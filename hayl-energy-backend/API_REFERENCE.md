# Hayl Energy AI Backend - API Reference

**Complete API Endpoint Documentation**

## 🎯 Virginia-Focused Endpoints

### GET `/api/v1/virginia/utilities`

**Virginia utilities with capacity-based sizing for logo display**

**Query Parameters:**
- `sort_by` (string): Sort by "capacity", "name", or "diversity" (default: "capacity")  
- `include_neighboring` (boolean): Include utilities serving VA from neighboring states (default: true)
- `min_capacity` (float): Minimum capacity filter in MW
- `limit` (int): Maximum results (default: 50)

**Response Example:**
```json
{
  "utilities": [
    {
      "id": "VA_12345",
      "utility_name": "Dominion Energy Virginia",
      "state": "VA", 
      "ownership_type": "Investor Owned",
      "total_capacity_mw": 15420.5,
      "generator_count": 89,
      "technology_diversity": 8,
      "counties_served": 45,
      "size_category": "large",
      "logo_scale": 100,
      "virginia_focus": true,
      "market_position": "major"
    }
  ],
  "total_count": 15,
  "virginia_utilities": 12,
  "neighboring_utilities": 3,
  "total_virginia_capacity_mw": 28750.2
}
```

### GET `/api/v1/virginia/utilities/{utility_id}/profile`

**Detailed Virginia utility profile with market analysis**

**Response Example:**
```json
{
  "utility_info": {
    "id": "VA_12345",
    "utility_name": "Dominion Energy Virginia",
    "total_capacity_mw": 15420.5,
    "virginia_focus": true,
    "operational_span": {
      "years_in_operation": 75
    }
  },
  "market_position": {
    "virginia_market_share_percent": 53.6,
    "state_ranking": 1,
    "competitive_category": "major"
  }
}
```

### GET `/api/v1/virginia/utilities/{utility_id}/technology-mix`

**Comprehensive technology breakdown with color coding for UI**

**Response Example:**
```json
{
  "technology_mix": [
    {
      "technology": "Natural Gas Combined Cycle",
      "capacity_mw": 8420.5,
      "percentage": 54.6,
      "generator_count": 25,
      "avg_unit_size_mw": 336.8,
      "color_code": "#4F7CAC",
      "vintage": {
        "oldest_unit": 1995,
        "newest_unit": 2023
      }
    }
  ],
  "clean_energy_percentage": 32.4,
  "summary": {
    "dominant_technology": "Natural Gas Combined Cycle",
    "renewable_focused": false,
    "fossil_dependent": true
  }
}
```

## 🏢 General Utility Operations

### GET `/api/v1/utilities/{utility_id}/profile`

**Comprehensive utility profile and analysis**

**Response includes:**
- Basic utility information and market position
- State ranking and market share
- Facility breakdown (top 20 plants)
- Historical capacity development timeline

### GET `/api/v1/utilities/{utility_id}/technology-mix`

**Detailed technology mix breakdown**

**Query Parameters:**
- `include_planned` (boolean): Include planned generators (default: false)

**Response includes:**
- Energy portfolio summary (renewable/fossil/nuclear percentages)
- Category breakdown with capacity and percentages
- Technology details with unit statistics and vintage data
- Portfolio analysis (diversified, renewable leader, etc.)

### POST `/api/v1/utilities/compare`

**Compare multiple utilities across various metrics**

**Query Parameters:**
- `utility_ids` (array): List of utility IDs to compare (2-10 utilities)
- `metrics` (array): Comparison metrics (default: ["capacity", "technology_mix", "efficiency"])

**Response Example:**
```json
{
  "comparison_id": "comp_3_8472",
  "utilities": [
    {
      "utility_id": "VA_12345",
      "utility_name": "Dominion Energy Virginia",
      "total_capacity_mw": 15420.5,
      "clean_energy_percentage": 32.4,
      "dominant_technology": "Natural Gas Combined Cycle"
    }
  ],
  "insights": {
    "largest_utility": {...},
    "most_diverse": {...},
    "cleanest_portfolio": {...},
    "capacity_range": {
      "min_mw": 850.2,
      "max_mw": 15420.5,
      "ratio": 18.1
    }
  }
}
```

## 📊 Market Analytics

### GET `/api/v1/analytics/capacity-trends`

**Historical capacity development trends with Virginia emphasis**

**Query Parameters:**
- `state` (string): Filter by state code
- `technology` (string): Filter by technology type  
- `start_year` (int): Start year (default: 2010)
- `end_year` (int): End year (default: 2025)
- `virginia_focus` (boolean): Prioritize Virginia data (default: true)

**Response Example:**
```json
{
  "capacity_trends": [
    {
      "year": 2023,
      "cumulative_capacity_mw": 125420.5,
      "annual_additions_mw": 2340.8,
      "annual_retirements_mw": 890.2,
      "net_change_mw": 1450.6,
      "top_technologies": [
        {"technology": "Solar Photovoltaic", "capacity_mw": 1205.4}
      ],
      "virginia_share_mw": 456.2,
      "growth_rate_percent": 1.17
    }
  ],
  "summary": {
    "analysis_period": "2010-2025",
    "total_additions_mw": 34520.8,
    "net_capacity_change_mw": 28930.4,
    "dominant_technology": "Natural Gas Combined Cycle"
  }
}
```

### GET `/api/v1/analytics/market-overview`

**Comprehensive energy market overview with regional flexibility**

**Query Parameters:**
- `region` (string): Focus region ("virginia", "southeast", "pjm", "national")
- `include_planned` (boolean): Include planned capacity (default: false)

**Response Example:**
```json
{
  "market_overview": {
    "region": "virginia", 
    "total_capacity_mw": 28750.2,
    "total_generators": 1247,
    "total_utilities": 15,
    "states_covered": 1
  },
  "clean_energy_metrics": {
    "clean_energy_percentage": 34.8,
    "renewable_percentage": 12.3,
    "nuclear_percentage": 22.5
  },
  "technology_landscape": {
    "dominant_technology": "Natural Gas Combined Cycle",
    "technology_count": 12,
    "breakdown": [...]
  },
  "geographic_distribution": {
    "top_states": [...],
    "virginia_position": 1
  }
}
```

## 🗺️ Geographic Intelligence

### GET `/api/v1/geography/virginia`

**Virginia-specific geographic analysis**

**Query Parameters:**
- `include_neighboring` (boolean): Include neighboring state utilities (default: true)
- `county_detail` (boolean): Include county-level breakdown (default: true)

**Response Example:**
```json
{
  "virginia_overview": {
    "total_capacity_mw": 28750.2,
    "counties_with_generation": 67,
    "total_plants": 156,
    "infrastructure_age": {
      "oldest_facility_year": 1948,
      "newest_facility_year": 2024
    }
  },
  "county_analysis": {
    "counties": [
      {
        "county": "Surry County",
        "total_capacity_mw": 3420.8,
        "utility_count": 1,
        "dominant_technology": "Nuclear",
        "location": {
          "latitude": 37.1234,
          "longitude": -76.5678
        }
      }
    ]
  },
  "service_territories": {
    "virginia_utilities": [...],
    "statewide_operators": [...],
    "regional_operators": [...]
  },
  "interstate_connections": {
    "operators": [...],
    "regional_integration_score": 85
  }
}
```

## 🔧 System Endpoints

### GET `/`

**API health check and feature overview**

**Response Example:**
```json
{
  "message": "Hayl Energy AI Backend",
  "status": "operational",
  "version": "1.0.0",
  "features": {
    "virginia_focus": "Priority analysis for Virginia energy market",
    "utility_intelligence": "Comprehensive utility profiling",
    "jwt_authentication": "Secure integration with frontend auth"
  },
  "endpoints": {
    "virginia": "/api/v1/virginia/utilities",
    "utility_profiles": "/api/v1/utilities/{id}/profile",
    "documentation": "/docs"
  },
  "data_coverage": {
    "generators": "37,000+ power generators nationwide",
    "utilities": "3,000+ electric utilities",
    "states": "All 50 US states + territories"
  }
}
```

### GET `/api/v1/health`

**Detailed health check for monitoring**

**Response Example:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "database": {
    "status": "connected",
    "generator_records": 37284
  },
  "services": {
    "authentication": "operational",
    "api_endpoints": "operational",
    "data_processing": "operational"
  }
}
```

### GET `/api/v1/stats/summary`

**Database statistics and quick insights**

**Response Example:**
```json
{
  "database_overview": {
    "name": "Hayl Energy AI Database",
    "total_generators": 37284,
    "total_capacity_mw": 1254820.5,
    "total_utilities": 3247,
    "states_covered": 51,
    "technology_types": 25
  },
  "virginia_focus": {
    "virginia_generators": 1247,
    "virginia_capacity_mw": 28750.2,
    "virginia_share_of_total_percent": 2.29
  },
  "api_capabilities": {
    "virginia_utilities": "Capacity-based utility analysis with logo sizing",
    "technology_mix": "Complete energy source breakdown with color coding",
    "utility_comparison": "Multi-utility competitive analysis"
  }
}
```

## 🔐 Authentication

All protected endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Authentication Functions

- `get_current_user()` - Requires valid JWT token, returns User object
- `get_current_user_optional()` - Optional authentication for personalization
- `require_verified_user()` - Requires verified email address

### JWT Token Validation

The backend validates tokens issued by the Next.js authentication system:

- **Algorithm**: HS256
- **Secret**: Must match `JWT_SECRET` in Next.js 
- **Claims**: Standard JWT claims with user ID in `sub` field
- **Expiration**: Automatic validation of `exp` claim

## 📡 Response Formats

### Standard Response Structure

All endpoints return JSON with consistent structure:

```json
{
  "data": {...},  // Main response data
  "meta": {...},  // Metadata (pagination, filters, etc.)
  "status": "success" | "error",
  "message": "Optional message"
}
```

### Error Responses

```json
{
  "error": "Error type",
  "message": "Detailed error description", 
  "available_endpoints": {...}  // For 404 errors
}
```

### Virginia Prioritization

All responses with utility data automatically prioritize Virginia:

1. **Virginia utilities listed first** in all arrays
2. **Logo scaling boost** (+15 points) for Virginia utilities  
3. **Market share calculations** include Virginia context
4. **Geographic filtering** includes VA + neighboring states by default

## 🎨 UI Integration Features

### Logo Scaling

Utilities include `logo_scale` (1-100) for consistent frontend display:

```json
{
  "logo_scale": 100,  // Large utility (10GW+)
  "size_category": "large",  // large, medium, small
  "market_position": "major"  // major, regional, local
}
```

### Technology Color Coding

Technology mix includes `color_code` for consistent UI colors:

```json
{
  "technology": "Solar Photovoltaic",
  "color_code": "#FFD700",  // Gold for solar
  "capacity_mw": 1250.5
}
```

### Geographic Coordinates

Location data included for mapping:

```json
{
  "location": {
    "latitude": 37.1234,
    "longitude": -76.5678
  },
  "service_territory_centroid": {
    "latitude": 37.5678,
    "longitude": -76.9012
  }
}
```

## 🚀 Rate Limiting & Performance

- **Rate Limits**: 60 requests/minute per IP (configurable)
- **Response Caching**: Redis-based caching in production
- **Query Optimization**: All queries use database indexes
- **Pagination**: Large datasets automatically paginated
- **Async Processing**: FastAPI async support for concurrent requests

## 📋 Data Validation

- **Input Validation**: Pydantic models for all request/response data
- **Type Safety**: Full TypeScript-compatible type definitions
- **Range Validation**: Capacity, year, and geographic bounds checking
- **Enum Validation**: Technology types, states, and categories validated

---

**For complete interactive documentation visit: http://localhost:8000/docs**