# Hayl Energy AI System Testing Guide

## Overview

This comprehensive testing suite validates the complete Hayl Energy AI platform, including:

- **Next.js Frontend** (Authentication + Energy Market Dashboard)
- **FastAPI Backend** (Energy Market Data Service)
- **PostgreSQL Database** (User management + Energy data)
- **API Integration** (JWT authentication + energy data flows)
- **UI/UX Implementation** (Virginia utilities wireframe compliance)

## Quick Start

### 1. Run Complete System Test

```bash
# Method 1: Use the shell script (recommended)
./run-system-tests.sh

# Method 2: Use npm script
npm run test:full

# Method 3: Run test agent directly
npm run test:system
```

### 2. Start Services and Test

```bash
# Start all services
./run-system-tests.sh start

# Check service status
./run-system-tests.sh status

# Run tests with services running
./run-system-tests.sh test
```

### 3. Individual Service Management

```bash
# Start services individually
./run-system-tests.sh start
./run-system-tests.sh stop
./run-system-tests.sh restart

# View service logs
./run-system-tests.sh logs

# Validate environment setup
./run-system-tests.sh validate
```

## Test Categories

### 🔍 Service Status Tests
- **Next.js Frontend** (Port 3000) - Running status
- **FastAPI Backend** (Port 8001) - Running status  
- **PostgreSQL Database** - Process detection
- **Health Endpoints** - API responsiveness

### 🔐 Authentication System Tests
- **User Registration** - Signup API endpoint
- **Email Verification** - Unverified user login blocking
- **Protected Routes** - Access control validation
- **JWT Token System** - Authentication endpoint testing

### ⚡ Energy Market Integration Tests
- **Virginia Dashboard** - `/energy` page functionality
- **Market Analytics** - `/analytics` page functionality
- **API Integration** - Backend data retrieval
- **Database Statistics** - Energy data availability

### 🔌 API Integration Tests
- **Energy API Client** - Frontend API configuration
- **Static Fallback** - Offline data availability
- **Auth Integration** - JWT token passing
- **Backend Endpoints** - FastAPI route testing

### 🗄️ Database Connectivity Tests
- **Prisma Schema** - Configuration validation
- **Database Initialization** - Connection testing
- **FastAPI Connection** - Backend database access

### 🎨 Frontend Functionality Tests
- **Page Accessibility** - All route testing
- **Static Assets** - Logo and favicon loading
- **Response Codes** - HTTP status validation

## System Requirements

### Prerequisites
```bash
# Node.js (18+ or 20+)
node --version  # Should show v18+ or v20+

# Python 3.8+
python3 --version

# PostgreSQL
psql --version
```

### Environment Setup
```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# 3. Initialize database
npx prisma generate
npx prisma db push

# 4. Set up backend (if testing full system)
cd hayl-energy-backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

## Virginia Energy Market Testing

### Wireframe Compliance Validation

The test suite validates implementation of the Virginia energy market wireframe:

1. **Utility Grid Display**
   - Cards sized based on capacity (50-100 scale)
   - Logo placeholder implementation
   - Utility information display

2. **Filter Functionality**
   - "All Utilities" filter
   - "Investor Owned" filter
   - "Cooperatives" filter
   - "Municipal" filter

3. **ANALYSE UTILITY Feature**
   - Button functionality
   - Navigation to utility detail pages
   - Data integration with backend

4. **Technology Mix Integration**
   - Color coding system
   - Energy source breakdown
   - Virginia-specific data focus

### Manual Testing Checklist

After automated tests pass, perform these manual validations:

#### 1. Virginia Energy Dashboard
- [ ] Navigate to `http://localhost:3000/energy`
- [ ] Verify utility cards display with different sizes
- [ ] Test all filter tabs work correctly
- [ ] Confirm "ANALYSE UTILITY" buttons are functional
- [ ] Check Virginia state focus is prominent

#### 2. Responsive Design
- [ ] Test mobile view (375px width)
- [ ] Test tablet view (768px width)
- [ ] Test desktop view (1024px+ width)
- [ ] Verify logo sizing scales appropriately

#### 3. Data Integration
- [ ] Confirm Virginia utilities show correct data
- [ ] Verify technology mix colors match specification
- [ ] Test API vs static data fallback
- [ ] Check customer count and capacity displays

#### 4. Authentication Flow
- [ ] Register new test user
- [ ] Verify email verification requirement
- [ ] Test protected route access
- [ ] Confirm logout functionality

## Interpreting Results

### System Health Scoring
- **90-100%**: 🟢 EXCELLENT - System fully operational
- **75-89%**: 🟡 GOOD - Minor issues present  
- **50-74%**: 🟠 FAIR - Several issues need attention
- **0-49%**: 🔴 POOR - Critical issues require immediate action

### Common Issues and Solutions

#### Services Not Running
```bash
# Start Next.js frontend
npm run dev

# Start FastAPI backend
cd hayl-energy-backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

#### Database Connection Issues
```bash
# Check PostgreSQL service
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Reset database
npx prisma db push --force-reset
```

#### Authentication Failures
- Verify JWT_SECRET is set in environment
- Check DATABASE_URL connection string
- Ensure Prisma schema is generated

#### API Integration Problems
- Verify backend is running on port 8001
- Check CORS configuration in FastAPI
- Test backend endpoints directly at `/docs`

## Output Files

### Test Reports
- **JSON Report**: `hayl-energy-test-report-{timestamp}.json`
  - Detailed test results and API responses
  - Service status and performance metrics
  - Error logs and debugging information

### Service Logs
- **frontend.log**: Next.js application logs
- **backend.log**: FastAPI service logs
- **Console Output**: Real-time test progress

## Continuous Integration

### GitHub Actions Integration
```yaml
# .github/workflows/system-test.yml
name: System Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Run system tests
        run: npm run test:system
```

### Local Development Workflow
```bash
# Daily development testing
./run-system-tests.sh validate  # Check environment
./run-system-tests.sh start     # Start services
./run-system-tests.sh test      # Run full test suite

# Pre-commit testing
npm run test                    # Unit tests
npm run test:system            # Integration tests
npm run lint                   # Code quality
```

## Troubleshooting

### Common Error Messages

**"Cannot find package 'node-fetch'"**
```bash
npm install node-fetch
```

**"Port 3000 already in use"**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=3001 npm run dev
```

**"PostgreSQL connection failed"**
```bash
# Check if PostgreSQL is running
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS

# Verify DATABASE_URL
echo $DATABASE_URL
```

**"FastAPI backend not responding"**
```bash
# Check backend logs
tail -f backend.log

# Restart backend service
cd hayl-energy-backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8001
```

## Support

For issues with the testing system:

1. **Check Service Logs**: Review frontend.log and backend.log
2. **Validate Environment**: Run `./run-system-tests.sh validate`
3. **Review JSON Report**: Check detailed test report file
4. **Manual Testing**: Follow the manual testing checklist
5. **Documentation**: Consult API docs at `http://localhost:8001/docs`

## Test Development

### Adding New Tests

To extend the test suite:

```javascript
// In test-agent.js
async testNewFeature() {
  console.log('🧪 Testing new feature...');
  
  const response = await this.httpRequest(`${this.baseURL}/new-endpoint`);
  
  this.results.newFeature = {
    status: response.ok ? 'PASS' : 'FAIL',
    response: response
  };
}
```

### Custom Test Scenarios

Create custom test files for specific scenarios:

```javascript
// custom-test.js
const HaylEnergyTestAgent = require('./test-agent');

class CustomTestAgent extends HaylEnergyTestAgent {
  async runCustomTests() {
    // Add custom test logic here
  }
}

const agent = new CustomTestAgent();
agent.run();
```

---

**Last Updated**: September 1, 2025  
**Version**: 1.0.0  
**Compatible With**: Hayl Energy AI Platform v0.1.0