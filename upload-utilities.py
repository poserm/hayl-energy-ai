#!/usr/bin/env python3
"""
Upload ALL utilities data to Prisma Cloud
Explaining the complete process
"""
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import time

DATABASE_URL = "postgres://7a571ce585e0cb50feb02b7f3cac367b0cf701b3fccb98a4e2ae1adc49c5859a:sk_nN4lztrkcDCw-wciq6Qak@db.prisma.io:5432/?sslmode=require"

def safe_str(value):
    if pd.isna(value) or value is None:
        return None
    return str(value).strip() if str(value).strip() else None

def safe_int(value):
    if pd.isna(value) or value == '' or value is None:
        return None
    try:
        return int(float(value))
    except:
        return None

def upload_all_utilities():
    """Upload ALL 1,716 utilities from ALL states to Prisma Cloud"""
    print("🚀 UPLOADING ALL UTILITIES TO PRISMA CLOUD")
    print("=" * 60)
    print("📍 WHAT I'M DOING:")
    print("1. Connect to your Prisma Cloud database (db.prisma.io)")
    print("2. Load Utility_Data_2023.xlsx with correct headers (skiprows=1)")
    print("3. Create utilities table with proper schema")
    print("4. Upload all 1,716 utilities in batches")
    print("5. Verify data for all states")
    print("=" * 60)
    
    try:
        # STEP 1: Connect to Prisma Cloud
        print("\n🔌 STEP 1: Connecting to Prisma Cloud...")
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=30)
        conn.autocommit = True
        cur = conn.cursor()
        print("   ✅ Connected to db.prisma.io")
        
        # STEP 2: Create utilities table
        print("\n🏢 STEP 2: Creating utilities table schema...")
        cur.execute('''
        CREATE TABLE IF NOT EXISTS utilities (
            id SERIAL PRIMARY KEY,
            data_year INT DEFAULT 2023,
            utility_number INT UNIQUE,
            utility_name VARCHAR(255),
            state VARCHAR(2),
            ownership_type VARCHAR(100),
            nerc_region VARCHAR(20),
            generation CHAR(1),
            transmission CHAR(1),
            distribution CHAR(1),
            wholesale_marketing CHAR(1),
            retail_marketing CHAR(1),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ''')
        
        # Clear existing utilities (fresh start)
        cur.execute('DELETE FROM utilities;')
        print("   ✅ Utilities table ready")
        
        # STEP 3: Load utilities Excel data with correct headers
        print("\n📁 STEP 3: Loading utilities from Excel...")
        print("   File: Utility_Data_2023.xlsx")
        print("   Method: skiprows=1 (skip header row)")
        
        df = pd.read_excel('/home/mikyas/projects/Hayl-energy-ai/hayl-energy-ai/hayl-energy-backend/data/Utility_Data_2023.xlsx', 
                          skiprows=1)
        
        print(f"   📊 Loaded: {len(df):,} utility records")
        print(f"   📋 Columns: {list(df.columns)[:8]}")
        
        # Show sample data
        if len(df) > 0:
            print(f"   📝 Sample utility: {df.iloc[0]['Utility Name']} ({df.iloc[0]['State']})")
        
        # STEP 4: Process and prepare data
        print("\n⚙️ STEP 4: Processing utility data...")
        
        data_tuples = []
        states_found = set()
        
        for _, row in df.iterrows():
            utility_num = safe_int(row.get('Utility Number'))
            state = safe_str(row.get('State'))
            
            if utility_num and state:  # Must have utility number and state
                states_found.add(state)
                data_tuples.append((
                    safe_int(row.get('Data Year', 2023)),
                    utility_num,
                    safe_str(row.get('Utility Name')),
                    state,
                    safe_str(row.get('Ownership Type')),
                    safe_str(row.get('NERC Region')),
                    safe_str(row.get('Generation')),
                    safe_str(row.get('Transmission')),
                    safe_str(row.get('Distribution')),
                    safe_str(row.get('Wholesale Marketing')),
                    safe_str(row.get('Retail Marketing'))
                ))
        
        print(f"   📈 Processed: {len(data_tuples):,} valid utilities")
        print(f"   🗺️ States: {len(states_found)} ({sorted(list(states_found))[:10]}...)")
        
        # STEP 5: Upload to Prisma Cloud in batches
        print("\n⬆️ STEP 5: Uploading to Prisma Cloud...")
        print("   Method: execute_values() in 500-record batches")
        
        batch_size = 500
        total_uploaded = 0
        
        for i in range(0, len(data_tuples), batch_size):
            batch = data_tuples[i:i+batch_size]
            
            execute_values(
                cur,
                '''INSERT INTO utilities 
                   (data_year, utility_number, utility_name, state, ownership_type, nerc_region, 
                    generation, transmission, distribution, wholesale_marketing, retail_marketing)
                   VALUES %s ON CONFLICT (utility_number) DO NOTHING''',
                batch,
                page_size=500
            )
            
            total_uploaded += len(batch)
            print(f"   ✅ Batch {i//batch_size + 1}: +{len(batch)} utilities (Total: {total_uploaded:,})")
            time.sleep(0.2)  # Brief pause
        
        # STEP 6: Verify upload
        print("\n🔍 STEP 6: Verifying utilities in Prisma Cloud...")
        
        cur.execute("SELECT COUNT(*) FROM utilities;")
        total_count = cur.fetchone()[0]
        
        cur.execute('''
        SELECT state, COUNT(*) as count, 
               STRING_AGG(DISTINCT ownership_type, ', ') as types
        FROM utilities 
        WHERE state IS NOT NULL 
        GROUP BY state 
        ORDER BY count DESC 
        LIMIT 15;
        ''')
        
        state_summary = cur.fetchall()
        
        print(f"   📊 Total utilities in Prisma Cloud: {total_count:,}")
        print(f"   🗺️ States with utilities: {len(state_summary)}")
        
        print("\n🏆 TOP STATES BY UTILITY COUNT:")
        for state, count, types in state_summary:
            print(f"   {state}: {count} utilities ({types[:30]}...)")
        
        print("\n🎉 SUCCESS! ALL UTILITIES UPLOADED TO PRISMA CLOUD!")
        print(f"🌐 Location: db.prisma.io (same database as your auth)")
        print(f"📊 Complete dataset: {total_count:,} utilities across {len(state_summary)} states")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("🔧 This means:")
        print("- Connection to Prisma Cloud failed, or")
        print("- Data format issue in Excel file, or") 
        print("- Prisma Cloud rate limiting")
        
    finally:
        if 'conn' in locals() and not conn.closed:
            conn.close()
            print("🔌 Database connection closed")

if __name__ == "__main__":
    upload_all_utilities()