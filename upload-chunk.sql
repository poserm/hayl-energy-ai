-- Create generators table in Prisma Cloud
CREATE TABLE IF NOT EXISTS generators (
    id SERIAL PRIMARY KEY,
    entity_name VARCHAR(255),
    plant_state VARCHAR(2),
    technology VARCHAR(200),
    nameplate_capacity_mw DECIMAL(12, 3),
    source_sheet VARCHAR(50) DEFAULT 'operating',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear existing data
DELETE FROM generators;