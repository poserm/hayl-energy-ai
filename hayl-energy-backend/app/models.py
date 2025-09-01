from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, Index, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    company = Column(String(255))
    phone = Column(String(50))
    
    # Profile fields from onboarding
    role = Column(String(100))  # Developer, Analyst, Executive, etc.
    experience_level = Column(String(50))  # Beginner, Intermediate, Expert
    regional_focus = Column(String(255))  # Comma-separated regions
    states_of_interest = Column(String(255))  # Comma-separated states  
    technology_focus = Column(String(255))  # Comma-separated technologies
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime(timezone=True))
    
    # Password reset
    password_reset_token = Column(String(255))
    password_reset_expires = Column(DateTime(timezone=True))
    
    # Login tracking
    last_login = Column(DateTime(timezone=True))
    login_count = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Indexes
    __table_args__ = (
        Index('idx_user_email', 'email'),
        Index('idx_user_active', 'is_active'),
        Index('idx_user_verified', 'is_verified'),
        Index('idx_user_reset_token', 'password_reset_token'),
    )

class Generator(Base):
    __tablename__ = "generators"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Source tracking
    data_year = Column(Integer, index=True, default=2025)
    source_sheet = Column(String(50), index=True)  # Operating, Planned, Retired, etc.
    
    # Entity/Utility Information
    entity_id = Column(Integer, index=True)  # Maps to utility_number
    entity_name = Column(String(255), index=True)  # Utility name
    
    # Plant Information
    plant_id = Column(Integer, index=True)
    plant_name = Column(String(255), index=True)
    plant_state = Column(String(2), index=True)
    county = Column(String(100), index=True)
    
    # Grid Information
    balancing_authority_code = Column(String(20))
    sector = Column(String(100), index=True)  # Electric Utility, IPP, etc.
    
    # Generator Identification
    generator_id = Column(String(50))
    unit_code = Column(String(50))
    
    # Capacity Information
    nameplate_capacity_mw = Column(Numeric(12, 3))
    net_summer_capacity_mw = Column(Numeric(12, 3))
    net_winter_capacity_mw = Column(Numeric(12, 3))
    nameplate_energy_capacity_mwh = Column(String(50))  # Battery storage
    dc_net_capacity_mw = Column(String(50))  # Solar DC capacity
    
    # Technology Classification
    technology = Column(String(200), index=True)
    energy_source_code = Column(String(10), index=True)
    prime_mover_code = Column(String(10))
    
    # Temporal Information
    operating_month = Column(Integer)
    operating_year = Column(Integer, index=True)
    planned_operation_month = Column(Integer)  # For planned generators
    planned_operation_year = Column(Integer)   # For planned generators
    planned_retirement_month = Column(String(20))
    planned_retirement_year = Column(String(20))
    retirement_month = Column(Integer)  # For retired generators
    retirement_year = Column(Integer)   # For retired generators
    
    # Status and Planning
    status = Column(String(200), index=True)
    planned_derate_year = Column(String(20))
    planned_derate_month = Column(String(20))
    planned_derate_summer_capacity_mw = Column(String(50))
    planned_uprate_year = Column(String(20))
    planned_uprate_month = Column(String(20))
    planned_uprate_summer_capacity_mw = Column(String(50))
    
    # Geographic Information
    latitude = Column(Numeric(10, 6))
    longitude = Column(Numeric(10, 6))
    geom = Column(Geography('POINT', srid=4326))  # PostGIS geometry
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Optimized indexes
    __table_args__ = (
        Index('idx_gen_state_tech', 'plant_state', 'technology'),
        Index('idx_gen_entity_state', 'entity_id', 'plant_state'),
        Index('idx_gen_capacity', 'nameplate_capacity_mw'),
        Index('idx_gen_source_status', 'source_sheet', 'status'),
        Index('idx_gen_year_tech', 'operating_year', 'technology'),
        Index('idx_gen_energy_source', 'energy_source_code', 'plant_state'),
    )

class Utility(Base):
    __tablename__ = "utilities"
    
    id = Column(Integer, primary_key=True, index=True)
    data_year = Column(Integer, index=True, default=2023)
    
    # Core Identification
    utility_number = Column(Integer, unique=True, index=True)
    utility_name = Column(String(255), index=True)
    state = Column(String(2), index=True)
    ownership_type = Column(String(100), index=True)
    
    # Grid Participation
    nerc_region = Column(String(20), index=True)
    
    # NERC Regions (Y/N flags)
    tre = Column(String(1))      # Texas
    frcc = Column(String(1))     # Florida
    mro = Column(String(1))      # Midwest
    npcc = Column(String(1))     # Northeast
    rfc = Column(String(1))      # ReliabilityFirst
    serc = Column(String(1))     # Southeast
    spp = Column(String(1))      # Southwest Power Pool
    wecc = Column(String(1))     # Western
    
    # RTO/ISO Participation (Y/N flags)
    caiso = Column(String(1))    # California ISO
    ercot = Column(String(1))    # Texas
    pjm = Column(String(1))      # PJM Interconnection
    nyiso = Column(String(1))    # New York ISO
    spp_rto = Column(String(1))  # SPP RTO
    miso = Column(String(1))     # Midcontinent ISO
    isone = Column(String(1))    # ISO New England
    other_rto = Column(String(1))
    
    # Business Activities (Y/N flags)
    generation = Column(String(1))
    transmission = Column(String(1))
    buying_transmission = Column(String(1))
    distribution = Column(String(1))
    buying_distribution = Column(String(1))
    wholesale_marketing = Column(String(1))
    retail_marketing = Column(String(1))
    bundled = Column(String(1))
    alt_fuel_vehicle = Column(String(1))
    alt_fuel_vehicle_2 = Column(String(1))
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    territories = relationship("ServiceTerritory", back_populates="utility")
    sales = relationship("UtilitySales", back_populates="utility")
    operations = relationship("OperationalData", back_populates="utility")

class ServiceTerritory(Base):
    __tablename__ = "service_territories"
    
    id = Column(Integer, primary_key=True, index=True)
    data_year = Column(Integer, index=True, default=2023)
    
    # Links to utility
    utility_number = Column(Integer, ForeignKey('utilities.utility_number'), index=True)
    utility_name = Column(String(255), index=True)
    short_form = Column(String(10))  # Y/N for short form reporting
    
    # Geographic Coverage
    state = Column(String(2), index=True)
    county = Column(String(100), index=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    utility = relationship("Utility", back_populates="territories")
    
    # Indexes
    __table_args__ = (
        Index('idx_territory_utility_state', 'utility_number', 'state'),
        Index('idx_territory_state_county', 'state', 'county'),
    )

class UtilitySales(Base):
    __tablename__ = "utility_sales"
    
    id = Column(Integer, primary_key=True, index=True)
    data_year = Column(Integer, index=True, default=2023)
    
    # Utility Information
    utility_number = Column(Integer, ForeignKey('utilities.utility_number'), index=True)
    utility_name = Column(String(255), index=True)
    part = Column(String(1))  # A=All, specific parts
    service_type = Column(String(50))  # Bundled, Delivery, etc.
    data_type = Column(String(50))  # O=Observed, I=Imputed
    state = Column(String(2), index=True)
    ownership = Column(String(100), index=True)
    ba_code = Column(String(20))  # Balancing Authority
    
    # RESIDENTIAL SECTOR
    residential_revenue_thousands = Column(Numeric(15, 2))
    residential_sales_mwh = Column(Numeric(15, 2))
    residential_customers_count = Column(Integer)
    
    # COMMERCIAL SECTOR
    commercial_revenue_thousands = Column(Numeric(15, 2))
    commercial_sales_mwh = Column(Numeric(15, 2))
    commercial_customers_count = Column(Integer)
    
    # INDUSTRIAL SECTOR
    industrial_revenue_thousands = Column(Numeric(15, 2))
    industrial_sales_mwh = Column(Numeric(15, 2))
    industrial_customers_count = Column(Integer)
    
    # TRANSPORTATION SECTOR
    transportation_revenue_thousands = Column(Numeric(15, 2))
    transportation_sales_mwh = Column(Numeric(15, 2))
    transportation_customers_count = Column(Integer)
    
    # TOTALS
    total_revenue_thousands = Column(Numeric(15, 2))
    total_sales_mwh = Column(Numeric(15, 2))
    total_customers_count = Column(Integer)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    utility = relationship("Utility", back_populates="sales")
    
    # Indexes
    __table_args__ = (
        Index('idx_sales_utility_state', 'utility_number', 'state'),
        Index('idx_sales_state_type', 'state', 'service_type'),
        Index('idx_sales_ownership', 'ownership', 'state'),
    )

class OperationalData(Base):
    __tablename__ = "operational_data"
    
    id = Column(Integer, primary_key=True, index=True)
    data_year = Column(Integer, index=True, default=2023)
    
    # Utility Information
    utility_number = Column(Integer, ForeignKey('utilities.utility_number'), index=True)
    utility_name = Column(String(255), index=True)
    state = Column(String(2), index=True)
    ownership_type = Column(String(100), index=True)
    nerc_region = Column(String(20), index=True)
    
    # DEMAND (Megawatts)
    summer_peak_demand_mw = Column(Numeric(12, 2))
    winter_peak_demand_mw = Column(Numeric(12, 2))
    
    # ENERGY SOURCES (Megawatthours)
    net_generation_mwh = Column(Numeric(15, 2))
    wholesale_power_purchases_mwh = Column(Numeric(15, 2))
    
    # Power Exchange
    exchange_energy_received_mwh = Column(Numeric(15, 2))
    exchange_energy_delivered_mwh = Column(Numeric(15, 2))
    net_power_exchanged_mwh = Column(Numeric(15, 2))
    
    # Wheeled Power
    wheeled_power_received_mwh = Column(Numeric(15, 2))
    wheeled_power_delivered_mwh = Column(Numeric(15, 2))
    net_wheeled_power_mwh = Column(Numeric(15, 2))
    
    # Losses and Totals
    transmission_by_other_losses_mwh = Column(Numeric(15, 2))
    total_sources_mwh = Column(Numeric(15, 2))
    
    # DISPOSITION (Megawatthours)
    sales_to_ultimate_customers_mwh = Column(Numeric(15, 2))
    sales_for_resale_mwh = Column(Numeric(15, 2))
    furnished_without_charge_mwh = Column(Numeric(15, 2))
    consumed_by_respondent_without_charge_mwh = Column(Numeric(15, 2))
    total_energy_losses_mwh = Column(Numeric(15, 2))
    total_disposition_mwh = Column(Numeric(15, 2))
    
    # ELECTRIC REVENUES (Thousands of Dollars)
    from_retail_sales_thousands = Column(Numeric(15, 2))
    from_delivery_customers_thousands = Column(Numeric(15, 2))
    from_sales_for_resale_thousands = Column(Numeric(15, 2))
    from_credits_or_adjustments_thousands = Column(Numeric(15, 2))
    from_transmission_thousands = Column(Numeric(15, 2))
    from_other_thousands = Column(Numeric(15, 2))
    total_revenue_thousands = Column(Numeric(15, 2))
    
    # Data Quality
    data_type = Column(String(50))  # O=Observed, I=Imputed
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    utility = relationship("Utility", back_populates="operations")
    
    # Indexes
    __table_args__ = (
        Index('idx_ops_utility_state', 'utility_number', 'state'),
        Index('idx_ops_state_ownership', 'state', 'ownership_type'),
        Index('idx_ops_nerc_region', 'nerc_region'),
    )