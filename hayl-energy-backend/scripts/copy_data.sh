#!/bin/bash

# Copy Data from Original Database Project
# This script copies the Excel data files from the original hayl-energy-ai-database project

set -e

echo "🔄 Copying data files from original database project..."

# Source and destination directories
SOURCE_DIR="/home/mikyas/projects/hayl-energy-ai-database/data"
DEST_DIR="/home/mikyas/projects/Hayl-energy-ai/hayl-energy-ai/hayl-energy-backend/data"

# Create destination directory
mkdir -p "$DEST_DIR"

# List of data files to copy
DATA_FILES=(
    "april_generator2025_1.xlsx"
    "Utility_Data_2023.xlsx"
    "Service_Territory_2023.xlsx"
    "Sales_Ult_Cust_2023.xlsx"
    "Operational_Data_2023.xlsx"
)

echo "📁 Copying data files..."

for file in "${DATA_FILES[@]}"; do
    if [ -f "$SOURCE_DIR/$file" ]; then
        echo "  ✅ Copying $file"
        cp "$SOURCE_DIR/$file" "$DEST_DIR/"
    else
        echo "  ⚠️  File not found: $file"
    fi
done

# Check what was copied
echo ""
echo "📊 Files in destination directory:"
ls -la "$DEST_DIR"

echo ""
echo "✅ Data copying completed!"
echo ""
echo "🚀 Next steps:"
echo "1. Run the data loading script: python scripts/load_data.py"
echo "2. Start the FastAPI server: uvicorn main:app --reload"