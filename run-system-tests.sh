#!/bin/bash

# Hayl Energy AI System Test Runner
# Comprehensive testing script for the complete platform

set -e

PROJECT_ROOT="/home/mikyas/projects/Hayl-energy-ai/hayl-energy-ai"
BACKEND_DIR="$PROJECT_ROOT/hayl-energy-backend"

echo "🚀 Hayl Energy AI System Test Runner"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    log_error "Must be run from the project root directory"
    exit 1
fi

cd "$PROJECT_ROOT"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start services if needed
start_services() {
    log_info "Checking service status..."

    # Check Next.js frontend (port 3000)
    if check_port 3000; then
        log_success "Next.js frontend already running on port 3000"
    else
        log_warning "Next.js frontend not running on port 3000"
        read -p "Start Next.js frontend? (y/n): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Starting Next.js frontend..."
            npm install >/dev/null 2>&1 || true
            nohup npm run dev > frontend.log 2>&1 &
            echo $! > frontend.pid
            log_info "Waiting for frontend to start..."
            sleep 10
            
            if check_port 3000; then
                log_success "Next.js frontend started successfully"
            else
                log_error "Failed to start Next.js frontend"
            fi
        fi
    fi

    # Check FastAPI backend (port 8001)
    if check_port 8001; then
        log_success "FastAPI backend already running on port 8001"
    else
        log_warning "FastAPI backend not running on port 8001"
        
        if [ -d "$BACKEND_DIR" ]; then
            read -p "Start FastAPI backend? (y/n): " -r
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                log_info "Starting FastAPI backend..."
                cd "$BACKEND_DIR"
                
                # Create virtual environment if it doesn't exist
                if [ ! -d "venv" ]; then
                    log_info "Creating Python virtual environment..."
                    python3 -m venv venv
                fi
                
                # Activate virtual environment and install dependencies
                source venv/bin/activate
                pip install -r requirements.txt >/dev/null 2>&1 || true
                
                # Start the backend
                nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > ../backend.log 2>&1 &
                echo $! > ../backend.pid
                deactivate
                
                cd "$PROJECT_ROOT"
                log_info "Waiting for backend to start..."
                sleep 10
                
                if check_port 8001; then
                    log_success "FastAPI backend started successfully"
                else
                    log_error "Failed to start FastAPI backend"
                fi
            fi
        else
            log_error "Backend directory not found: $BACKEND_DIR"
        fi
    fi

    # Check PostgreSQL
    if pgrep -x "postgres" > /dev/null; then
        log_success "PostgreSQL is running"
    else
        log_warning "PostgreSQL not detected"
        echo "Please ensure PostgreSQL is installed and running"
        echo "Ubuntu/Debian: sudo systemctl start postgresql"
        echo "macOS: brew services start postgresql"
    fi
}

# Function to stop services
stop_services() {
    log_info "Stopping services..."
    
    if [ -f "frontend.pid" ]; then
        local pid=$(cat frontend.pid)
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            log_success "Stopped Next.js frontend"
        fi
        rm -f frontend.pid
    fi
    
    if [ -f "backend.pid" ]; then
        local pid=$(cat backend.pid)
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            log_success "Stopped FastAPI backend"
        fi
        rm -f backend.pid
    fi
}

# Function to show service logs
show_logs() {
    echo ""
    echo "📋 Recent Service Logs:"
    echo "======================"
    
    if [ -f "frontend.log" ]; then
        echo -e "${BLUE}--- Next.js Frontend Logs (last 10 lines) ---${NC}"
        tail -n 10 frontend.log
        echo ""
    fi
    
    if [ -f "backend.log" ]; then
        echo -e "${BLUE}--- FastAPI Backend Logs (last 10 lines) ---${NC}"
        tail -n 10 backend.log
        echo ""
    fi
}

# Function to run comprehensive tests
run_tests() {
    log_info "Running comprehensive system tests..."
    
    # Install node-fetch if not available
    if ! npm list node-fetch >/dev/null 2>&1; then
        log_info "Installing node-fetch for testing..."
        npm install node-fetch >/dev/null 2>&1 || true
    fi
    
    # Run the test agent
    node test-agent.js
    
    # Run existing Jest tests if available
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        log_info "Running Jest test suite..."
        npm test -- --passWithNoTests --silent 2>/dev/null || log_warning "Some Jest tests failed"
    fi
    
    log_success "System tests completed"
}

# Function to validate environment
validate_environment() {
    log_info "Validating environment..."
    
    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        log_success "Node.js found: $node_version"
    else
        log_error "Node.js not found. Please install Node.js 18+ or 20+"
        return 1
    fi
    
    # Check npm
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        log_success "npm found: v$npm_version"
    else
        log_error "npm not found"
        return 1
    fi
    
    # Check Python
    if command -v python3 >/dev/null 2>&1; then
        local python_version=$(python3 --version)
        log_success "Python found: $python_version"
    else
        log_error "Python 3 not found. Required for FastAPI backend"
        return 1
    fi
    
    # Check environment variables
    if [ -f ".env.local" ]; then
        log_success "Environment file found: .env.local"
    else
        log_warning "No .env.local file found. Some features may not work"
    fi
    
    # Check database connection
    if [ ! -z "$DATABASE_URL" ]; then
        log_success "DATABASE_URL environment variable set"
    else
        log_warning "DATABASE_URL not set. Check environment configuration"
    fi
    
    return 0
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  test        Run comprehensive system tests (default)"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  status      Check service status"
    echo "  logs        Show recent service logs"
    echo "  validate    Validate environment setup"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                  # Run tests"
    echo "  $0 start           # Start services"
    echo "  $0 test            # Run comprehensive tests"
    echo "  $0 logs            # Show service logs"
}

# Main execution
main() {
    local command=${1:-test}
    
    case $command in
        "test")
            validate_environment || exit 1
            start_services
            sleep 2
            run_tests
            show_logs
            ;;
        "start")
            validate_environment || exit 1
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 3
            validate_environment || exit 1
            start_services
            ;;
        "status")
            log_info "Checking service status..."
            if check_port 3000; then
                log_success "Next.js frontend: RUNNING (port 3000)"
            else
                log_warning "Next.js frontend: NOT RUNNING (port 3000)"
            fi
            
            if check_port 8001; then
                log_success "FastAPI backend: RUNNING (port 8001)"
            else
                log_warning "FastAPI backend: NOT RUNNING (port 8001)"
            fi
            
            if pgrep -x "postgres" > /dev/null; then
                log_success "PostgreSQL: RUNNING"
            else
                log_warning "PostgreSQL: NOT RUNNING"
            fi
            ;;
        "logs")
            show_logs
            ;;
        "validate")
            validate_environment
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Trap to cleanup on exit
cleanup() {
    log_info "Cleaning up..."
    # Don't stop services on exit, let them run for continued testing
}

trap cleanup EXIT

# Run main function
main "$@"

echo ""
log_success "Script completed successfully!"
echo ""
echo "📚 Next Steps:"
echo "  • Check the detailed JSON report for complete results"
echo "  • Follow manual testing checklist for UI/UX validation"
echo "  • Review any HIGH priority recommendations"
echo "  • Test authentication flow with real user signup"
echo "  • Validate Virginia energy market data display"
echo ""
echo "🌐 Quick Links:"
echo "  • Frontend: http://localhost:3000"
echo "  • Energy Dashboard: http://localhost:3000/energy"
echo "  • Analytics: http://localhost:3000/analytics"
echo "  • API Documentation: http://localhost:8001/docs"
echo "  • API Health: http://localhost:8001/api/v1/health"