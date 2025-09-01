from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, text
from typing import List, Optional
import uvicorn
import os
from contextlib import asynccontextmanager

from database import get_db, engine
from models import Generator, Utility, ServiceTerritory, UtilitySales, OperationalData, User, Base
from auth import get_current_user_optional, get_current_user

# Import API routers
from api.v1.virginia import router as virginia_router
from api.v1.utilities import router as utilities_router
from api.v1.analytics import router as analytics_router
from api.v1.geography import router as geography_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting Hayl Energy AI Backend...")
    
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created/verified")
    except Exception as e:
        print(f"⚠️ Database setup warning: {e}")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Hayl Energy AI Backend...")

# Create FastAPI application
app = FastAPI(
    title="Hayl Energy AI Backend",
    description="""
    **Energy Market Intelligence Backend for Hayl Energy AI Platform**
    
    This API provides comprehensive energy market data and analytics with a focus on Virginia utilities and the broader U.S. energy market.
    
    ## Key Features
    - **Virginia-Focused Analysis**: Prioritized data and insights for Virginia energy market
    - **Utility Intelligence**: Detailed utility profiles, technology mix, and market analysis
    - **Real-time Analytics**: Capacity trends, market overview, and competitive analysis
    - **Geographic Intelligence**: County-level analysis and service territory mapping
    - **JWT Authentication**: Secure integration with Next.js frontend authentication
    
    ## API Structure
    - `/api/v1/virginia/` - Virginia-specific energy market endpoints
    - `/api/v1/utilities/` - General utility operations and comparisons  
    - `/api/v1/analytics/` - Market trends and analytical insights
    - `/api/v1/geography/` - Geographic and territorial analysis
    
    ## Data Sources
    - EIA Generator Database (37,000+ generators)
    - Utility operational and sales data
    - Service territory information
    - Real-time capacity and technology data
    
    **Note**: This API serves the React frontend and requires valid JWT tokens for protected endpoints.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    contact={
        "name": "Hayl Energy AI Support",
        "email": "support@haylenergyai.com"
    }
)

# Security and CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev
        "http://localhost:3003",  # Next.js custom port
        "https://haylenergyai.com",  # Production domain
        "https://*.haylenergyai.com",  # Subdomains
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Trusted host middleware for production security
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["haylenergyai.com", "*.haylenergyai.com", "api.haylenergyai.com"]
    )

# Include API routers with versioning
app.include_router(virginia_router, prefix="/api/v1")
app.include_router(utilities_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(geography_router, prefix="/api/v1")

@app.get("/")
async def root():
    """API health check and information"""
    return {
        "message": "Hayl Energy AI Backend",
        "status": "operational",
        "version": "1.0.0",
        "api_base": "/api/v1/",
        "features": {
            "virginia_focus": "Priority analysis for Virginia energy market",
            "utility_intelligence": "Comprehensive utility profiling and analysis", 
            "market_analytics": "Real-time trends and capacity analysis",
            "geographic_intelligence": "County and service territory insights",
            "technology_breakdown": "Detailed energy source and technology mix",
            "jwt_authentication": "Secure integration with frontend auth"
        },
        "endpoints": {
            "virginia": "/api/v1/virginia/utilities",
            "utility_profiles": "/api/v1/utilities/{id}/profile",
            "technology_mix": "/api/v1/utilities/{id}/technology-mix",
            "capacity_trends": "/api/v1/analytics/capacity-trends", 
            "market_overview": "/api/v1/analytics/market-overview",
            "virginia_geography": "/api/v1/geography/virginia",
            "utility_comparison": "/api/v1/utilities/compare",
            "documentation": "/docs"
        },
        "data_coverage": {
            "generators": "37,000+ power generators nationwide",
            "utilities": "3,000+ electric utilities",
            "states": "All 50 US states + territories",
            "technologies": "25+ generation technologies",
            "data_vintage": "2025 EIA data with historical trends"
        }
    }

@app.get("/api/v1/health")
async def health_check():
    """Detailed health check for monitoring"""
    try:
        # Test database connection
        from database import SessionLocal
        db = SessionLocal()
        generator_count = db.query(func.count(Generator.id)).scalar()
        db.close()
        
        return {
            "status": "healthy",
            "timestamp": "2025-01-01T00:00:00Z",  # Will be dynamic in production
            "database": {
                "status": "connected",
                "generator_records": generator_count
            },
            "services": {
                "authentication": "operational",
                "api_endpoints": "operational",
                "data_processing": "operational"
            },
            "version": "1.0.0"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.get("/api/v1/stats/summary")
async def get_database_summary(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get overall database statistics and quick insights"""
    
    # Core statistics
    total_generators = db.query(func.count(Generator.id)).scalar()
    total_capacity = db.query(func.sum(Generator.nameplate_capacity_mw)).filter(
        Generator.nameplate_capacity_mw.isnot(None),
        Generator.source_sheet == 'operating'
    ).scalar()
    
    # Virginia-specific stats
    va_generators = db.query(func.count(Generator.id)).filter(
        Generator.plant_state == 'VA',
        Generator.source_sheet == 'operating'
    ).scalar()
    
    va_capacity = db.query(func.sum(Generator.nameplate_capacity_mw)).filter(
        Generator.plant_state == 'VA',
        Generator.source_sheet == 'operating',
        Generator.nameplate_capacity_mw.isnot(None)
    ).scalar()
    
    # Technology diversity
    tech_count = db.query(func.count(distinct(Generator.technology))).filter(
        Generator.technology.isnot(None)
    ).scalar()
    
    # State coverage
    state_count = db.query(func.count(distinct(Generator.plant_state))).filter(
        Generator.plant_state.isnot(None)
    ).scalar()
    
    # Utility count
    utility_count = db.query(func.count(distinct(Generator.entity_name))).filter(
        Generator.entity_name.isnot(None),
        Generator.source_sheet == 'operating'
    ).scalar()
    
    # Generator types
    source_counts = db.query(
        Generator.source_sheet,
        func.count(Generator.id).label('count')
    ).group_by(Generator.source_sheet).all()
    
    # Recent activity (generators from last 5 years)
    recent_generators = db.query(func.count(Generator.id)).filter(
        Generator.operating_year >= 2020,
        Generator.source_sheet == 'operating'
    ).scalar()
    
    return {
        "database_overview": {
            "name": "Hayl Energy AI Database",
            "total_generators": total_generators,
            "total_capacity_mw": round(float(total_capacity or 0), 1),
            "total_utilities": utility_count,
            "states_covered": state_count,
            "technology_types": tech_count,
            "recent_additions_since_2020": recent_generators
        },
        "virginia_focus": {
            "virginia_generators": va_generators,
            "virginia_capacity_mw": round(float(va_capacity or 0), 1),
            "virginia_share_of_total_percent": round(
                (float(va_capacity or 0) / float(total_capacity or 1)) * 100, 2
            ),
            "virginia_generator_share_percent": round(
                (va_generators / max(1, total_generators)) * 100, 2
            )
        },
        "generator_types": {
            source.source_sheet: source.count for source in source_counts
        },
        "api_capabilities": {
            "virginia_utilities": "Capacity-based utility analysis with logo sizing",
            "technology_mix": "Complete energy source breakdown with color coding",
            "utility_comparison": "Multi-utility competitive analysis", 
            "capacity_trends": "Historical capacity development tracking",
            "market_overview": "National and regional market intelligence",
            "geographic_analysis": "County-level and service territory mapping"
        },
        "data_freshness": {
            "primary_data_year": "2025",
            "historical_coverage": "2000-2025",
            "update_frequency": "Annual with quarterly supplements",
            "last_refresh": "2025-01-01"
        }
    }

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return {
        "error": "Resource not found",
        "message": "The requested endpoint or resource does not exist",
        "available_endpoints": {
            "virginia": "/api/v1/virginia/utilities",
            "utility_profile": "/api/v1/utilities/{id}/profile", 
            "analytics": "/api/v1/analytics/market-overview",
            "geography": "/api/v1/geography/virginia",
            "documentation": "/docs"
        }
    }

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: HTTPException):
    return {
        "error": "Internal server error",
        "message": "An unexpected error occurred. Please try again or contact support.",
        "support": "support@haylenergyai.com"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    )