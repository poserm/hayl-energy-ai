from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, and_, or_
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from database import get_db
from models import Generator, Utility, ServiceTerritory, UtilitySales, OperationalData, User
from auth import get_current_user_optional

router = APIRouter(prefix="/virginia", tags=["Virginia Energy Market"])

class UtilityResponse(BaseModel):
    id: str
    utility_name: str
    state: str
    ownership_type: str
    total_capacity_mw: float
    generator_count: int
    technology_diversity: int
    counties_served: int
    size_category: str  # For logo sizing: small, medium, large
    logo_scale: int  # 1-100 scale for frontend
    virginia_focus: bool
    market_position: str  # major, regional, local

class TechnologyMixResponse(BaseModel):
    technology: str
    capacity_mw: float
    percentage: float
    generator_count: int
    avg_unit_size_mw: float
    color_code: str  # For consistent UI colors

@router.get("/utilities", response_model=Dict[str, Any])
async def get_virginia_utilities(
    sort_by: str = Query("capacity", description="Sort by: capacity, name, diversity"),
    include_neighboring: bool = Query(True, description="Include utilities serving VA from neighboring states"),
    min_capacity: float = Query(None, description="Minimum capacity filter (MW)"),
    limit: int = Query(50, description="Maximum results"),
    request: Request = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get Virginia utilities with capacity-based sizing for logo display"""
    
    # Base query for Virginia utilities
    base_filter = [
        Generator.entity_name.isnot(None),
        Generator.source_sheet == 'operating',
        Generator.nameplate_capacity_mw.isnot(None)
    ]
    
    # Virginia-focused filter
    if include_neighboring:
        # Include utilities that serve Virginia or are headquartered in neighboring states
        virginia_filter = or_(
            Generator.plant_state == 'VA',
            and_(
                Generator.plant_state.in_(['MD', 'WV', 'KY', 'TN', 'NC']),
                # Check if they have operations in VA (would need service territory data)
                Generator.entity_name.in_(
                    db.query(Generator.entity_name).filter(Generator.plant_state == 'VA')
                )
            )
        )
        base_filter.append(virginia_filter)
    else:
        base_filter.append(Generator.plant_state == 'VA')
    
    query = db.query(
        Generator.entity_name.label('utility_name'),
        Generator.plant_state.label('state'),
        Generator.sector.label('ownership_type'),
        func.count(Generator.id).label('generator_count'),
        func.sum(Generator.nameplate_capacity_mw).label('total_capacity_mw'),
        func.count(func.distinct(Generator.technology)).label('technology_diversity'),
        func.count(func.distinct(Generator.county)).label('counties_served'),
        func.min(Generator.operating_year).label('first_operation_year'),
        func.max(Generator.operating_year).label('latest_operation_year')
    ).filter(and_(*base_filter))
    
    if min_capacity:
        # Apply filter after grouping (need subquery)
        query = query.group_by(
            Generator.entity_name,
            Generator.plant_state,
            Generator.sector
        ).having(func.sum(Generator.nameplate_capacity_mw) >= min_capacity)
    else:
        query = query.group_by(
            Generator.entity_name,
            Generator.plant_state,
            Generator.sector
        )
    
    # Sorting
    if sort_by == "capacity":
        query = query.order_by(func.sum(Generator.nameplate_capacity_mw).desc())
    elif sort_by == "name":
        query = query.order_by(Generator.entity_name)
    elif sort_by == "diversity":
        query = query.order_by(func.count(func.distinct(Generator.technology)).desc())
    
    utilities_data = query.limit(limit).all()
    
    # Process utilities for response with Virginia prioritization
    utilities = []
    for util in utilities_data:
        total_capacity = float(util.total_capacity_mw or 0)
        
        # Determine size category and logo scale (1-100)
        if total_capacity >= 10000:  # 10 GW+
            size_category = "large"
            logo_scale = 100
            market_position = "major"
        elif total_capacity >= 2000:  # 2-10 GW
            size_category = "medium"
            logo_scale = 75
            market_position = "regional"
        elif total_capacity >= 500:  # 500 MW - 2 GW
            size_category = "medium"
            logo_scale = 60
            market_position = "regional"
        else:  # < 500 MW
            size_category = "small"
            logo_scale = 45
            market_position = "local"
        
        # Virginia utilities get priority boost in visual prominence
        virginia_focus = util.state == 'VA'
        if virginia_focus and logo_scale < 100:
            logo_scale = min(100, logo_scale + 15)  # Boost Virginia utilities
        
        utility_response = {
            "id": f"{util.state}_{abs(hash(util.utility_name)) % 100000}",
            "utility_name": util.utility_name,
            "state": util.state,
            "ownership_type": util.ownership_type or "Unknown",
            "total_capacity_mw": total_capacity,
            "generator_count": util.generator_count,
            "technology_diversity": util.technology_diversity,
            "counties_served": util.counties_served,
            "size_category": size_category,
            "logo_scale": logo_scale,
            "virginia_focus": virginia_focus,
            "market_position": market_position,
            "operational_span": {
                "first_operation_year": util.first_operation_year,
                "latest_operation_year": util.latest_operation_year
            }
        }
        utilities.append(utility_response)
    
    # Sort Virginia utilities first
    utilities.sort(key=lambda x: (not x["virginia_focus"], -x["total_capacity_mw"]))
    
    return {
        "utilities": utilities,
        "total_count": len(utilities),
        "virginia_utilities": len([u for u in utilities if u["virginia_focus"]]),
        "neighboring_utilities": len([u for u in utilities if not u["virginia_focus"]]),
        "total_virginia_capacity_mw": sum(u["total_capacity_mw"] for u in utilities if u["virginia_focus"]),
        "filters": {
            "sort_by": sort_by,
            "include_neighboring": include_neighboring,
            "min_capacity": min_capacity
        }
    }

@router.get("/utilities/{utility_id}/profile")
async def get_utility_profile(
    utility_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get detailed utility profile with Virginia market analysis"""
    
    # Parse utility ID
    try:
        state_code, name_hash = utility_id.split('_')
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid utility ID format")
    
    # Get utility data
    utility_query = db.query(
        Generator.entity_name.label('utility_name'),
        Generator.plant_state.label('state'),
        Generator.sector.label('ownership_type'),
        func.count(Generator.id).label('total_generators'),
        func.sum(Generator.nameplate_capacity_mw).label('total_capacity_mw'),
        func.count(func.distinct(Generator.technology)).label('technology_diversity'),
        func.count(func.distinct(Generator.plant_name)).label('total_plants'),
        func.count(func.distinct(Generator.county)).label('counties_served'),
        func.min(Generator.operating_year).label('first_operation_year'),
        func.max(Generator.operating_year).label('latest_operation_year'),
        func.avg(Generator.nameplate_capacity_mw).label('avg_generator_size_mw')
    ).filter(
        Generator.entity_name.isnot(None),
        Generator.plant_state == state_code.upper(),
        Generator.source_sheet == 'operating'
    ).group_by(
        Generator.entity_name,
        Generator.plant_state,
        Generator.sector
    ).all()
    
    # Find matching utility by hash
    matching_utility = None
    for util in utility_query:
        if str(abs(hash(util.utility_name)) % 100000) == name_hash:
            matching_utility = util
            break
    
    if not matching_utility:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Utility not found")
    
    utility_name = matching_utility.utility_name
    total_capacity = float(matching_utility.total_capacity_mw or 0)
    
    # Virginia market context
    virginia_total_capacity = db.query(
        func.sum(Generator.nameplate_capacity_mw)
    ).filter(
        Generator.plant_state == 'VA',
        Generator.source_sheet == 'operating',
        Generator.nameplate_capacity_mw.isnot(None)
    ).scalar() or 0
    
    market_share_virginia = (total_capacity / virginia_total_capacity * 100) if virginia_total_capacity > 0 else 0
    
    # Competitive position
    ranking_query = db.query(
        func.row_number().over(order_by=func.sum(Generator.nameplate_capacity_mw).desc()).label('rank'),
        Generator.entity_name
    ).filter(
        Generator.plant_state == state_code.upper(),
        Generator.source_sheet == 'operating',
        Generator.nameplate_capacity_mw.isnot(None)
    ).group_by(Generator.entity_name).subquery()
    
    utility_rank = db.query(ranking_query.c.rank).filter(
        ranking_query.c.entity_name == utility_name
    ).scalar() or 0
    
    return {
        "utility_info": {
            "id": utility_id,
            "utility_name": utility_name,
            "state": state_code.upper(),
            "ownership_type": matching_utility.ownership_type,
            "total_capacity_mw": total_capacity,
            "total_generators": matching_utility.total_generators,
            "total_plants": matching_utility.total_plants,
            "counties_served": matching_utility.counties_served,
            "technology_diversity": matching_utility.technology_diversity,
            "avg_generator_size_mw": float(matching_utility.avg_generator_size_mw or 0),
            "virginia_focus": state_code.upper() == 'VA',
            "operational_span": {
                "first_operation_year": matching_utility.first_operation_year,
                "latest_operation_year": matching_utility.latest_operation_year,
                "years_in_operation": (matching_utility.latest_operation_year or 2025) - (matching_utility.first_operation_year or 2025)
            }
        },
        "market_position": {
            "virginia_market_share_percent": round(market_share_virginia, 2),
            "state_ranking": utility_rank,
            "competitive_category": "major" if total_capacity >= 5000 else "regional" if total_capacity >= 1000 else "local",
            "capacity_percentile": round((1 - (utility_rank - 1) / max(1, len(utility_query))) * 100, 1)
        }
    }

@router.get("/utilities/{utility_id}/technology-mix")
async def get_utility_technology_mix(
    utility_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get comprehensive technology mix for utility with color coding"""
    
    # Parse utility ID
    try:
        state_code, name_hash = utility_id.split('_')
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid utility ID format")
    
    # Find utility name
    utility_query = db.query(Generator.entity_name).filter(
        Generator.plant_state == state_code.upper(),
        Generator.source_sheet == 'operating'
    ).group_by(Generator.entity_name).all()
    
    utility_name = None
    for util in utility_query:
        if str(abs(hash(util.entity_name)) % 100000) == name_hash:
            utility_name = util.entity_name
            break
    
    if not utility_name:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Utility not found")
    
    # Get technology breakdown
    tech_query = db.query(
        Generator.technology,
        Generator.energy_source_code,
        func.count(Generator.id).label('generator_count'),
        func.sum(Generator.nameplate_capacity_mw).label('total_capacity_mw'),
        func.avg(Generator.nameplate_capacity_mw).label('avg_unit_size_mw'),
        func.min(Generator.operating_year).label('oldest_unit'),
        func.max(Generator.operating_year).label('newest_unit')
    ).filter(
        Generator.entity_name == utility_name,
        Generator.plant_state == state_code.upper(),
        Generator.source_sheet == 'operating',
        Generator.technology.isnot(None),
        Generator.nameplate_capacity_mw.isnot(None)
    ).group_by(
        Generator.technology,
        Generator.energy_source_code
    ).order_by(
        func.sum(Generator.nameplate_capacity_mw).desc()
    ).all()
    
    total_capacity = sum(float(tech.total_capacity_mw or 0) for tech in tech_query)
    
    # Technology color mapping for consistent UI
    technology_colors = {
        "Natural Gas": "#4F7CAC",
        "Coal": "#8B4513", 
        "Nuclear": "#9370DB",
        "Hydroelectric": "#1E90FF",
        "Solar": "#FFD700",
        "Wind": "#90EE90",
        "Biomass": "#228B22",
        "Petroleum": "#696969",
        "Geothermal": "#FF6347",
        "Other": "#A9A9A9"
    }
    
    def get_technology_color(tech_name: str) -> str:
        """Get color code for technology type"""
        for key, color in technology_colors.items():
            if key.lower() in tech_name.lower():
                return color
        return technology_colors["Other"]
    
    # Process technology mix
    technology_mix = []
    for tech in tech_query:
        capacity_mw = float(tech.total_capacity_mw or 0)
        percentage = (capacity_mw / total_capacity * 100) if total_capacity > 0 else 0
        
        technology_mix.append({
            "technology": tech.technology,
            "energy_source_code": tech.energy_source_code,
            "capacity_mw": capacity_mw,
            "percentage": round(percentage, 2),
            "generator_count": tech.generator_count,
            "avg_unit_size_mw": round(float(tech.avg_unit_size_mw or 0), 1),
            "color_code": get_technology_color(tech.technology),
            "vintage": {
                "oldest_unit": tech.oldest_unit,
                "newest_unit": tech.newest_unit,
                "fleet_age_range": (tech.newest_unit or 2025) - (tech.oldest_unit or 2025)
            }
        })
    
    # Calculate clean energy percentage
    clean_technologies = ["solar", "wind", "hydroelectric", "nuclear", "geothermal", "biomass"]
    clean_capacity = sum(
        tech["capacity_mw"] for tech in technology_mix 
        if any(clean_tech in tech["technology"].lower() for clean_tech in clean_technologies)
    )
    clean_percentage = (clean_capacity / total_capacity * 100) if total_capacity > 0 else 0
    
    return {
        "utility_id": utility_id,
        "total_capacity_mw": total_capacity,
        "technology_count": len(technology_mix),
        "clean_energy_percentage": round(clean_percentage, 2),
        "technology_mix": technology_mix,
        "summary": {
            "dominant_technology": technology_mix[0]["technology"] if technology_mix else "Unknown",
            "most_diverse": len(technology_mix) >= 5,
            "renewable_focused": clean_percentage >= 50,
            "fossil_dependent": any(
                tech["percentage"] > 50 for tech in technology_mix 
                if any(fossil in tech["technology"].lower() for fossil in ["coal", "natural gas", "petroleum"])
            )
        }
    }