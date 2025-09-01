#!/bin/bash

# Hayl Energy AI Backend Quick Start Script
# This script sets up and starts the complete backend system

set -e

echo "🚀 Hayl Energy AI Backend Quick Start"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Please run this script from the hayl-energy-backend directory"
    exit 1
fi

# Check for Python 3.11+
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1-2)
echo "🐍 Python version: $python_version"

# Setup virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Setup environment file
if [ ! -f ".env" ]; then
    echo "⚙️ Creating environment configuration..."
    cp .env.example .env
    echo "📝 Please edit .env file with your database credentials and JWT secrets"
fi

# Check for Docker
if command -v docker &> /dev/null; then
    echo "🐳 Docker detected - setting up database services..."
    
    # Start database and Redis
    docker-compose up -d db redis
    
    echo "⏳ Waiting for database to be ready..."
    sleep 10
    
    # Copy data files
    echo "📁 Copying data files..."
    if [ -f "scripts/copy_data.sh" ]; then
        ./scripts/copy_data.sh
    else
        echo "⚠️  Data copy script not found - please copy Excel files manually to data/ directory"
    fi
    
    # Load data
    echo "📊 Loading data into database..."
    cd app
    python ../scripts/load_data.py
    cd ..
    
else
    echo "⚠️  Docker not found - please setup PostgreSQL and Redis manually"
    echo "   Database URL: postgresql://hayl_admin:HaylEnergy2024!@localhost:5432/hayl_energy_ai_db"
    echo "   Make sure PostGIS extension is enabled"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting FastAPI server..."
echo "   API Documentation: http://localhost:8000/docs"
echo "   Health Check: http://localhost:8000/api/v1/health"
echo "   Virginia Utilities: http://localhost:8000/api/v1/virginia/utilities"
echo ""

# Start the server
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000