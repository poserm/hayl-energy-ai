#!/usr/bin/env node

/**
 * Hayl Energy AI System Test Agent
 * 
 * Comprehensive testing suite for the complete Hayl Energy AI platform
 * Tests both Next.js frontend and FastAPI backend services
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class HaylEnergyTestAgent {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      services: {},
      authentication: {},
      energyMarket: {},
      apiIntegration: {},
      database: {},
      frontend: {},
      recommendations: []
    };
    
    this.baseURL = 'http://localhost:3000';
    this.apiURL = 'http://localhost:8001';
  }

  // Utility methods
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async httpRequest(url, options = {}) {
    const fetch = (await import('node-fetch')).default;
    try {
      const response = await fetch(url, {
        timeout: 10000,
        ...options
      });
      return {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json().catch(() => null) : null,
        error: response.ok ? null : response.statusText
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        data: null,
        error: error.message
      };
    }
  }

  async checkPortInUse(port) {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.listen(port, () => {
        server.close(() => resolve(false));
      });
      
      server.on('error', () => resolve(true));
    });
  }

  async checkProcessRunning(processName) {
    try {
      const { stdout } = await execAsync(`pgrep -f "${processName}"`);
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  // Service status checks
  async checkServiceStatus() {
    console.log('🔍 Checking service status...');
    
    const services = {
      'Next.js Frontend (Port 3000)': await this.checkPortInUse(3000),
      'FastAPI Backend (Port 8001)': await this.checkPortInUse(8001),
      'PostgreSQL Database': await this.checkProcessRunning('postgres')
    };

    for (const [service, running] of Object.entries(services)) {
      this.results.services[service] = {
        status: running ? 'RUNNING' : 'NOT_RUNNING',
        port: service.includes('3000') ? 3000 : service.includes('8001') ? 8001 : null
      };
    }

    // Test health endpoints
    if (services['Next.js Frontend (Port 3000)']) {
      const health = await this.httpRequest(`${this.baseURL}/api/health`);
      this.results.services['Next.js Health Check'] = {
        status: health.ok ? 'HEALTHY' : 'UNHEALTHY',
        response: health
      };
    }

    if (services['FastAPI Backend (Port 8001)']) {
      const health = await this.httpRequest(`${this.apiURL}/api/v1/health`);
      this.results.services['FastAPI Health Check'] = {
        status: health.ok ? 'HEALTHY' : 'UNHEALTHY', 
        response: health
      };
    }
  }

  // Authentication system testing
  async testAuthentication() {
    console.log('🔐 Testing authentication system...');
    
    const testUser = {
      email: `test-${Date.now()}@haylenergyai.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };

    // Test signup
    console.log('  → Testing user registration...');
    const signupResponse = await this.httpRequest(`${this.baseURL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    this.results.authentication.signup = {
      status: signupResponse.ok ? 'PASS' : 'FAIL',
      response: signupResponse
    };

    // Test login with unverified user
    console.log('  → Testing login with unverified user...');
    const loginResponse = await this.httpRequest(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    this.results.authentication.unverifiedLogin = {
      status: loginResponse.status === 403 ? 'PASS' : 'FAIL',
      expected: 'Should block unverified users',
      response: loginResponse
    };

    // Test protected route without authentication
    console.log('  → Testing protected route access...');
    const protectedResponse = await this.httpRequest(`${this.baseURL}/dashboard`);
    
    this.results.authentication.protectedRoute = {
      status: protectedResponse.status === 302 || protectedResponse.status === 401 ? 'PASS' : 'FAIL',
      expected: 'Should redirect or deny access',
      response: protectedResponse
    };

    // Test /api/auth/me endpoint
    console.log('  → Testing auth/me endpoint...');
    const meResponse = await this.httpRequest(`${this.baseURL}/api/auth/me`);
    
    this.results.authentication.meEndpoint = {
      status: meResponse.status === 401 ? 'PASS' : 'FAIL',
      expected: 'Should require authentication',
      response: meResponse
    };
  }

  // Energy market integration testing
  async testEnergyMarket() {
    console.log('⚡ Testing energy market integration...');

    // Test Virginia energy dashboard
    console.log('  → Testing Virginia energy dashboard...');
    const energyPageResponse = await this.httpRequest(`${this.baseURL}/energy`);
    
    this.results.energyMarket.virginiaPage = {
      status: energyPageResponse.ok ? 'PASS' : 'FAIL',
      response: energyPageResponse
    };

    // Test analytics page
    console.log('  → Testing market analytics page...');
    const analyticsResponse = await this.httpRequest(`${this.baseURL}/analytics`);
    
    this.results.energyMarket.analyticsPage = {
      status: analyticsResponse.ok ? 'PASS' : 'FAIL',
      response: analyticsResponse
    };

    // Test energy API endpoints (if backend is running)
    if (this.results.services['FastAPI Backend (Port 8001)']?.status === 'RUNNING') {
      console.log('  → Testing Virginia utilities API...');
      const utilitiesResponse = await this.httpRequest(`${this.apiURL}/api/v1/virginia/utilities`);
      
      this.results.energyMarket.virginiaUtilitiesAPI = {
        status: utilitiesResponse.ok ? 'PASS' : 'FAIL',
        response: utilitiesResponse
      };

      console.log('  → Testing database statistics...');
      const statsResponse = await this.httpRequest(`${this.apiURL}/api/v1/stats/summary`);
      
      this.results.energyMarket.databaseStats = {
        status: statsResponse.ok ? 'PASS' : 'FAIL',
        response: statsResponse
      };
    }
  }

  // API integration testing
  async testAPIIntegration() {
    console.log('🔌 Testing API integration...');

    // Test frontend energy API client
    console.log('  → Testing energy API client configuration...');
    
    try {
      const energyApiPath = path.join(__dirname, 'src/lib/energy-api.ts');
      const energyApiExists = fs.existsSync(energyApiPath);
      
      this.results.apiIntegration.energyApiClient = {
        status: energyApiExists ? 'PASS' : 'FAIL',
        file: energyApiPath,
        exists: energyApiExists
      };

      if (energyApiExists) {
        const content = fs.readFileSync(energyApiPath, 'utf8');
        const hasStaticFallback = content.includes('virginiaUtilitiesStatic');
        const hasAuthToken = content.includes('getAuthToken');
        
        this.results.apiIntegration.staticFallback = {
          status: hasStaticFallback ? 'PASS' : 'FAIL',
          description: 'Static data fallback for API unavailability'
        };

        this.results.apiIntegration.authIntegration = {
          status: hasAuthToken ? 'PASS' : 'FAIL',
          description: 'JWT token integration with API calls'
        };
      }
    } catch (error) {
      this.results.apiIntegration.energyApiClient = {
        status: 'FAIL',
        error: error.message
      };
    }

    // Test FastAPI endpoints (if running)
    if (this.results.services['FastAPI Backend (Port 8001)']?.status === 'RUNNING') {
      const endpoints = [
        '/api/v1/virginia/utilities',
        '/api/v1/analytics/market-overview',
        '/api/v1/geography/virginia',
        '/api/v1/stats/summary'
      ];

      for (const endpoint of endpoints) {
        console.log(`  → Testing endpoint ${endpoint}...`);
        const response = await this.httpRequest(`${this.apiURL}${endpoint}`);
        
        this.results.apiIntegration[endpoint] = {
          status: response.ok ? 'PASS' : 'FAIL',
          response: response
        };
      }
    }
  }

  // Database connectivity testing
  async testDatabase() {
    console.log('🗄️  Testing database connectivity...');

    // Check Prisma schema
    const prismaSchemaPath = path.join(__dirname, 'prisma/schema.prisma');
    const prismaExists = fs.existsSync(prismaSchemaPath);
    
    this.results.database.prismaSchema = {
      status: prismaExists ? 'PASS' : 'FAIL',
      file: prismaSchemaPath
    };

    // Test database initialization endpoint
    const dbInitResponse = await this.httpRequest(`${this.baseURL}/api/db/init`);
    
    this.results.database.initialization = {
      status: dbInitResponse.ok ? 'PASS' : 'FAIL',
      response: dbInitResponse
    };

    // Test FastAPI database connection (if running)
    if (this.results.services['FastAPI Backend (Port 8001)']?.status === 'RUNNING') {
      const healthResponse = await this.httpRequest(`${this.apiURL}/api/v1/health`);
      
      if (healthResponse.ok && healthResponse.data?.database) {
        this.results.database.fastApiConnection = {
          status: healthResponse.data.database.status === 'connected' ? 'PASS' : 'FAIL',
          details: healthResponse.data.database
        };
      }
    }
  }

  // Frontend functionality testing
  async testFrontend() {
    console.log('🎨 Testing frontend functionality...');

    // Check key pages exist
    const pages = [
      '/',
      '/login',
      '/signup',
      '/energy',
      '/analytics',
      '/dashboard',
      '/verify-email'
    ];

    for (const page of pages) {
      console.log(`  → Testing page ${page}...`);
      const response = await this.httpRequest(`${this.baseURL}${page}`);
      
      this.results.frontend[page] = {
        status: response.ok || response.status === 302 ? 'PASS' : 'FAIL',
        httpStatus: response.status,
        response: response
      };
    }

    // Check static assets
    const staticAssets = [
      '/favicon.ico',
      '/hayl-logo-new.svg'
    ];

    for (const asset of staticAssets) {
      const response = await this.httpRequest(`${this.baseURL}${asset}`);
      
      this.results.frontend[`static${asset}`] = {
        status: response.ok ? 'PASS' : 'FAIL',
        httpStatus: response.status
      };
    }
  }

  // Generate recommendations
  generateRecommendations() {
    const recommendations = [];

    // Service recommendations
    const frontendRunning = this.results.services['Next.js Frontend (Port 3000)']?.status === 'RUNNING';
    const backendRunning = this.results.services['FastAPI Backend (Port 8001)']?.status === 'RUNNING';

    if (!frontendRunning) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Services',
        issue: 'Next.js frontend not running on port 3000',
        solution: 'Run `npm run dev` in the main project directory'
      });
    }

    if (!backendRunning) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Services', 
        issue: 'FastAPI backend not running on port 8001',
        solution: 'Run the backend service: `cd hayl-energy-backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload`'
      });
    }

    // Authentication recommendations
    if (this.results.authentication.signup?.status === 'FAIL') {
      recommendations.push({
        priority: 'HIGH',
        category: 'Authentication',
        issue: 'User registration not working',
        solution: 'Check database connection and verify user registration API endpoint'
      });
    }

    // API integration recommendations  
    if (backendRunning && this.results.energyMarket.virginiaUtilitiesAPI?.status === 'FAIL') {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'API Integration',
        issue: 'Virginia utilities API endpoint failing',
        solution: 'Check database seeding and verify PostgreSQL connection in FastAPI backend'
      });
    }

    // Database recommendations
    if (this.results.database.prismaSchema?.status === 'FAIL') {
      recommendations.push({
        priority: 'HIGH',
        category: 'Database',
        issue: 'Prisma schema file missing',
        solution: 'Ensure prisma/schema.prisma exists and run `npx prisma generate`'
      });
    }

    if (this.results.database.initialization?.status === 'FAIL') {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Database',
        issue: 'Database initialization failing',
        solution: 'Check DATABASE_URL environment variable and run `npx prisma db push`'
      });
    }

    this.results.recommendations = recommendations;
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🏁 HAYL ENERGY AI SYSTEM TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${this.results.timestamp}\n`);

    // Service Status Summary
    console.log('📊 SERVICE STATUS SUMMARY');
    console.log('-'.repeat(40));
    for (const [service, details] of Object.entries(this.results.services)) {
      const status = details.status;
      const emoji = status === 'RUNNING' || status === 'HEALTHY' ? '✅' : '❌';
      console.log(`${emoji} ${service}: ${status}`);
    }

    // Authentication Tests
    console.log('\n🔐 AUTHENTICATION SYSTEM TESTS');
    console.log('-'.repeat(40));
    for (const [test, details] of Object.entries(this.results.authentication)) {
      const status = details.status;
      const emoji = status === 'PASS' ? '✅' : '❌';
      console.log(`${emoji} ${test}: ${status}`);
      if (details.expected) {
        console.log(`    Expected: ${details.expected}`);
      }
    }

    // Energy Market Tests
    console.log('\n⚡ ENERGY MARKET INTEGRATION TESTS');
    console.log('-'.repeat(40));
    for (const [test, details] of Object.entries(this.results.energyMarket)) {
      const status = details.status;
      const emoji = status === 'PASS' ? '✅' : '❌';
      console.log(`${emoji} ${test}: ${status}`);
    }

    // API Integration Tests
    console.log('\n🔌 API INTEGRATION TESTS');
    console.log('-'.repeat(40));
    for (const [test, details] of Object.entries(this.results.apiIntegration)) {
      if (details.status) {
        const status = details.status;
        const emoji = status === 'PASS' ? '✅' : '❌';
        console.log(`${emoji} ${test}: ${status}`);
        if (details.description) {
          console.log(`    ${details.description}`);
        }
      }
    }

    // Database Tests
    console.log('\n🗄️  DATABASE CONNECTIVITY TESTS');
    console.log('-'.repeat(40));
    for (const [test, details] of Object.entries(this.results.database)) {
      const status = details.status;
      const emoji = status === 'PASS' ? '✅' : '❌';
      console.log(`${emoji} ${test}: ${status}`);
      if (details.details) {
        console.log(`    Details: ${JSON.stringify(details.details, null, 2)}`);
      }
    }

    // Frontend Tests
    console.log('\n🎨 FRONTEND FUNCTIONALITY TESTS');
    console.log('-'.repeat(40));
    for (const [page, details] of Object.entries(this.results.frontend)) {
      const status = details.status;
      const emoji = status === 'PASS' ? '✅' : '❌';
      console.log(`${emoji} ${page}: ${status} (HTTP ${details.httpStatus})`);
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(40));
    if (this.results.recommendations.length === 0) {
      console.log('✅ All systems operational! No immediate action required.');
    } else {
      this.results.recommendations.forEach((rec, index) => {
        const priorityEmoji = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`${priorityEmoji} ${rec.priority} - ${rec.category}`);
        console.log(`   Issue: ${rec.issue}`);
        console.log(`   Solution: ${rec.solution}\n`);
      });
    }

    // Overall System Health
    const totalTests = this.calculateTotalTests();
    const passedTests = this.calculatePassedTests();
    const healthPercent = Math.round((passedTests / totalTests) * 100);
    
    console.log('🏥 OVERALL SYSTEM HEALTH');
    console.log('-'.repeat(40));
    console.log(`Tests Passed: ${passedTests}/${totalTests} (${healthPercent}%)`);
    
    let healthStatus = '';
    if (healthPercent >= 90) {
      healthStatus = '🟢 EXCELLENT - System fully operational';
    } else if (healthPercent >= 75) {
      healthStatus = '🟡 GOOD - Minor issues present';
    } else if (healthPercent >= 50) {
      healthStatus = '🟠 FAIR - Several issues need attention';
    } else {
      healthStatus = '🔴 POOR - Critical issues require immediate action';
    }
    
    console.log(`System Status: ${healthStatus}`);

    // Manual Testing Instructions
    console.log('\n📋 MANUAL TESTING CHECKLIST');
    console.log('-'.repeat(40));
    console.log('1. Frontend UI/UX Testing:');
    console.log('   □ Visit http://localhost:3000/energy');
    console.log('   □ Verify Virginia utility cards display with different sizes (50-100 scale)');
    console.log('   □ Test filter tabs: All, Investor Owned, Cooperatives, Municipal');
    console.log('   □ Click "ANALYSE UTILITY" buttons and verify navigation');
    console.log('   □ Check technology color coding matches wireframe');
    console.log('   □ Test responsive design on mobile/tablet');
    
    console.log('\n2. Authentication Flow Testing:');
    console.log('   □ Register new user account');
    console.log('   □ Check email verification system');
    console.log('   □ Test login/logout functionality');
    console.log('   □ Verify protected route access');
    
    console.log('\n3. Energy Market Data Testing:');
    console.log('   □ Visit http://localhost:3000/analytics');
    console.log('   □ Verify Virginia-focused data display');
    console.log('   □ Test utility comparison features');
    console.log('   □ Check technology mix charts and data accuracy');
    
    console.log('\n4. API Integration Testing:');
    console.log('   □ Monitor network requests in browser dev tools');
    console.log('   □ Verify JWT tokens are passed to FastAPI');
    console.log('   □ Test fallback to static data when API unavailable');
    console.log('   □ Check API documentation at http://localhost:8001/docs');

    console.log('\n' + '='.repeat(80));
    console.log('Test completed successfully!');
    console.log('='.repeat(80));

    // Save report to file
    this.saveReport();
  }

  calculateTotalTests() {
    let total = 0;
    
    total += Object.keys(this.results.services).length;
    total += Object.keys(this.results.authentication).length;
    total += Object.keys(this.results.energyMarket).length;
    total += Object.keys(this.results.apiIntegration).filter(k => this.results.apiIntegration[k].status).length;
    total += Object.keys(this.results.database).length;
    total += Object.keys(this.results.frontend).length;
    
    return total;
  }

  calculatePassedTests() {
    let passed = 0;

    // Count passed tests across all categories
    const categories = [
      this.results.services,
      this.results.authentication, 
      this.results.energyMarket,
      this.results.database,
      this.results.frontend
    ];

    categories.forEach(category => {
      Object.values(category).forEach(result => {
        if (result.status === 'PASS' || result.status === 'RUNNING' || result.status === 'HEALTHY') {
          passed++;
        }
      });
    });

    // Count API integration tests
    Object.values(this.results.apiIntegration).forEach(result => {
      if (result.status === 'PASS') {
        passed++;
      }
    });

    return passed;
  }

  saveReport() {
    const reportPath = path.join(__dirname, `hayl-energy-test-report-${Date.now()}.json`);
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`\n📁 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`\n❌ Failed to save report: ${error.message}`);
    }
  }

  // Main test runner
  async run() {
    console.log('🚀 Starting Hayl Energy AI System Test Agent...\n');
    
    try {
      await this.checkServiceStatus();
      await this.delay(1000);
      
      await this.testAuthentication();
      await this.delay(1000);
      
      await this.testEnergyMarket();
      await this.delay(1000);
      
      await this.testAPIIntegration();
      await this.delay(1000);
      
      await this.testDatabase();
      await this.delay(1000);
      
      await this.testFrontend();
      await this.delay(1000);
      
      this.generateRecommendations();
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test agent failed:', error);
      process.exit(1);
    }
  }
}

// Run the test agent
if (require.main === module) {
  const agent = new HaylEnergyTestAgent();
  agent.run().catch(console.error);
}

module.exports = HaylEnergyTestAgent;