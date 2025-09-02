#!/usr/bin/env python3
"""
Quick load of essential energy data into Prisma Cloud
"""
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import time

DATABASE_URL = "postgres://7a571ce585e0cb50feb02b7f3cac367b0cf701b3fccb98a4e2ae1adc49c5859a:sk_nN4lztrkcDCw-wciq6Qak@db.prisma.io:5432/?sslmode=require"

def safe_float(value):
    if pd.isna(value) or value == '' or value is None:
        return None
    try:
        return float(value)
    except:
        return None

def safe_str(value):
    if pd.isna(value) or value is None:
        return None
    return str(value).strip() if str(value).strip() else None

def load_all_states_sample():
    """Load sample data for all 50 states"""
    print("🚀 Loading energy data for ALL 50 states...")
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Simple generators table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS generators (
            id SERIAL PRIMARY KEY,
            entity_name VARCHAR(255),
            plant_state VARCHAR(2),
            technology VARCHAR(200),
            nameplate_capacity_mw DECIMAL(12, 3),
            source_sheet VARCHAR(50),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)
        
        cur.execute("DELETE FROM generators;")
        
        # Load operating generators only (faster)
        df = pd.read_excel("/home/mikyas/projects/Hayl-energy-ai/hayl-energy-ai/hayl-energy-backend/data/april_generator2025_1.xlsx", 
                          sheet_name='Operating', skiprows=2)
        
        print(f"📊 Processing {len(df)} generators...")
        
        # Process in smaller chunks
        chunk_size = 5000
        total_loaded = 0
        
        for i in range(0, len(df), chunk_size):
            chunk = df.iloc[i:i+chunk_size]
            generators_data = []
            
            for _, row in chunk.iterrows():
                state = safe_str(row.get('Plant State'))
                if state:  # Only load records with valid state
                    generators_data.append((
                        safe_str(row.get('Entity Name')),
                        state,
                        safe_str(row.get('Technology')),
                        safe_float(row.get('Nameplate Capacity (MW)')),
                        'operating'
                    ))
            
            if generators_data:
                execute_values(
                    cur,
                    "INSERT INTO generators (entity_name, plant_state, technology, nameplate_capacity_mw, source_sheet) VALUES %s",
                    generators_data,
                    page_size=1000
                )
                conn.commit()
                total_loaded += len(generators_data)
                print(f"✅ Loaded chunk {i//chunk_size + 1}: {len(generators_data)} generators (Total: {total_loaded})")
                time.sleep(0.5)  # Brief pause to avoid overwhelming connection
        
        # Get state summary
        cur.execute("""
        SELECT plant_state, COUNT(*) as count, ROUND(SUM(nameplate_capacity_mw), 1) as total_mw 
        FROM generators 
        WHERE plant_state IS NOT NULL 
        GROUP BY plant_state 
        ORDER BY count DESC 
        LIMIT 15
        """)
        
        results = cur.fetchall()
        
        print(f"\n🎉 COMPLETE! Loaded {total_loaded:,} generators")
        print("\n🗺️ Top 15 states by generator count:")
        for state, count, capacity in results:
            print(f"  {state}: {count:,} generators ({capacity:,.1f} MW)")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        if not conn.closed:
            conn.rollback()
    finally:
        if not conn.closed:
            cur.close()
            conn.close()

if __name__ == "__main__":
    load_all_states_sample()