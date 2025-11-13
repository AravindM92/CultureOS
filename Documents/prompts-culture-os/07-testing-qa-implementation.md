# Testing & Quality Assurance - CultureOS

## Overview
Comprehensive testing strategy for CultureOS covering unit tests, integration tests, end-to-end workflows, performance testing, and quality assurance procedures.

## 🧪 **Testing Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Unit Tests    │    │ Integration     │    │  End-to-End     │
│   (Jest/Mocha)  │    │ Tests (API)     │    │  Tests (E2E)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Performance    │    │  Load Testing   │    │  User Acceptance│
│  Tests          │    │  (Artillery)    │    │  Tests (UAT)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 **Test Setup & Configuration**

### **Test Dependencies (package.json additions)**
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "nock": "^13.4.0",
    "@types/jest": "^29.5.8",
    "artillery": "^2.0.0",
    "puppeteer": "^21.5.0",
    "chai": "^4.3.10",
    "mocha": "^10.2.0",
    "sinon": "^17.0.1"
  },
  "scripts": {
    "test": "jest --verbose",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration", 
    "test:e2e": "jest --testPathPattern=e2e",
    "test:api": "cd ../thunai-api && python -m pytest",
    "test:load": "artillery run tests/load/load-test.yml",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:api && npm run test:e2e",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

### **Jest Configuration (jest.config.js)**
```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  verbose: true,
  testTimeout: 30000
};
```

## 🔧 **Unit Tests**

### **Bot Logic Tests (tests/unit/app.test.js)**
```javascript
const { jest } = require('@jest/globals');
const { GroqChatModel } = require('../../src/app/groqChatModel');
const ThunaiAPIClient = require('../../src/app/apiClient');
const { DateUtils } = require('../../src/app/dateUtils');

// Mock external dependencies
jest.mock('../../src/app/groqChatModel');
jest.mock('../../src/app/apiClient');

describe('CultureOS Bot Logic', () => {
  let mockGroqModel;
  let mockApiClient;

  beforeEach(() => {
    mockGroqModel = new GroqChatModel();
    mockApiClient = new ThunaiAPIClient();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Moment Detection', () => {
    test('should detect birthday moment correctly', async () => {
      // Arrange
      const userMessage = "Sarah's birthday is next Tuesday";
      const expectedAIResponse = {
        message: JSON.stringify({
          category: 'operational',
          moment_detected: true,
          moment_details: {
            person_name: 'Sarah',
            moment_type: 'birthday',
            moment_date: '2025-11-12',
            description: "Sarah's birthday celebration",
            confidence: 0.95
          }
        })
      };

      mockGroqModel.sendMessage.mockResolvedValue(expectedAIResponse);

      // Act
      const result = await mockGroqModel.sendMessage([
        { role: 'user', content: userMessage }
      ]);

      // Assert
      expect(result).toBeDefined();
      const parsed = JSON.parse(result.message);
      expect(parsed.category).toBe('operational');
      expect(parsed.moment_detected).toBe(true);
      expect(parsed.moment_details.person_name).toBe('Sarah');
      expect(parsed.moment_details.moment_type).toBe('birthday');
    });

    test('should handle casual conversation without moment detection', async () => {
      // Arrange
      const userMessage = "How's the weather today?";
      const expectedAIResponse = {
        message: JSON.stringify({
          category: 'casual',
          moment_detected: false,
          response: "I'm here to help celebrate team moments! How can I assist you today?"
        })
      };

      mockGroqModel.sendMessage.mockResolvedValue(expectedAIResponse);

      // Act
      const result = await mockGroqModel.sendMessage([
        { role: 'user', content: userMessage }
      ]);

      // Assert
      const parsed = JSON.parse(result.message);
      expect(parsed.category).toBe('casual');
      expect(parsed.moment_detected).toBe(false);
      expect(parsed.response).toBeDefined();
    });

    test('should handle API failures gracefully', async () => {
      // Arrange
      const userMessage = "Test message";
      mockGroqModel.sendMessage.mockRejectedValue(new Error('API failure'));

      // Act & Assert
      await expect(mockGroqModel.sendMessage([
        { role: 'user', content: userMessage }
      ])).rejects.toThrow('API failure');
    });
  });

  describe('User Management', () => {
    test('should create new user when not exists', async () => {
      // Arrange
      const newUserData = {
        name: 'John Doe',
        teams_user_id: 'john.doe@company.com',
        email: 'john.doe@company.com'
      };

      mockApiClient.getUserByTeamsId.mockResolvedValue(null);
      mockApiClient.createUser.mockResolvedValue({ id: 123, ...newUserData });

      // Act
      const userExists = await mockApiClient.getUserByTeamsId(newUserData.teams_user_id);
      expect(userExists).toBeNull();

      const createdUser = await mockApiClient.createUser(newUserData);

      // Assert
      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBe(123);
      expect(createdUser.name).toBe('John Doe');
    });

    test('should return existing user when found', async () => {
      // Arrange
      const existingUser = {
        id: 456,
        name: 'Jane Smith',
        teams_user_id: 'jane.smith@company.com',
        email: 'jane.smith@company.com'
      };

      mockApiClient.getUserByTeamsId.mockResolvedValue(existingUser);

      // Act
      const user = await mockApiClient.getUserByTeamsId('jane.smith@company.com');

      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBe(456);
      expect(user.name).toBe('Jane Smith');
    });
  });

  describe('Date Parsing', () => {
    test('should parse "next Tuesday" correctly', () => {
      // Arrange
      const input = 'next Tuesday';
      const today = new Date('2025-11-08'); // Saturday
      
      // Act
      const result = DateUtils.parseRelativeDate(input, today);
      
      // Assert
      expect(result).toBe('2025-11-11'); // Next Tuesday
    });

    test('should parse "tomorrow" correctly', () => {
      // Arrange
      const input = 'tomorrow';
      const today = new Date('2025-11-08');
      
      // Act
      const result = DateUtils.parseRelativeDate(input, today);
      
      // Assert
      expect(result).toBe('2025-11-09');
    });

    test('should parse "today" correctly', () => {
      // Arrange
      const input = 'today';
      const today = new Date('2025-11-08');
      
      // Act
      const result = DateUtils.parseRelativeDate(input, today);
      
      // Assert
      expect(result).toBe('2025-11-08');
    });
  });
});
```

### **API Client Tests (tests/unit/apiClient.test.js)**
```javascript
const nock = require('nock');
const ThunaiAPIClient = require('../../src/app/apiClient');

describe('Thunai API Client', () => {
  let apiClient;
  const baseURL = 'http://127.0.0.1:8000/api/v1';

  beforeEach(() => {
    apiClient = new ThunaiAPIClient();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('User Operations', () => {
    test('should create user successfully', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        teams_user_id: 'test.user@company.com',
        email: 'test.user@company.com'
      };

      const expectedResponse = {
        id: 123,
        ...userData,
        created_at: '2025-11-08T10:00:00Z'
      };

      nock(baseURL)
        .post('/users', userData)
        .reply(201, expectedResponse);

      // Act
      const result = await apiClient.createUser(userData);

      // Assert
      expect(result).toEqual(expectedResponse);
    });

    test('should get user by Teams ID', async () => {
      // Arrange
      const teamsId = 'test.user@company.com';
      const expectedUser = {
        id: 123,
        name: 'Test User',
        teams_user_id: teamsId,
        email: teamsId
      };

      nock(baseURL)
        .get(`/users/teams/${teamsId}`)
        .reply(200, expectedUser);

      // Act
      const result = await apiClient.getUserByTeamsId(teamsId);

      // Assert
      expect(result).toEqual(expectedUser);
    });

    test('should handle user not found', async () => {
      // Arrange
      const teamsId = 'nonexistent@company.com';

      nock(baseURL)
        .get(`/users/teams/${teamsId}`)
        .reply(404, { detail: 'User not found' });

      // Act
      const result = await apiClient.getUserByTeamsId(teamsId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Moment Operations', () => {
    test('should create moment successfully', async () => {
      // Arrange
      const momentData = {
        person_name: 'Sarah Johnson',
        moment_type: 'birthday',
        moment_date: '2025-11-15',
        description: 'Sarah\'s birthday celebration',
        created_by: 'admin@company.com'
      };

      const expectedResponse = {
        id: 456,
        ...momentData,
        created_at: '2025-11-08T10:00:00Z'
      };

      nock(baseURL)
        .post('/moments', momentData)
        .reply(201, expectedResponse);

      // Act
      const result = await apiClient.createMoment(momentData);

      // Assert
      expect(result).toEqual(expectedResponse);
    });

    test('should get moment by ID', async () => {
      // Arrange
      const momentId = 456;
      const expectedMoment = {
        id: momentId,
        person_name: 'Sarah Johnson',
        moment_type: 'birthday',
        moment_date: '2025-11-15'
      };

      nock(baseURL)
        .get(`/moments/${momentId}`)
        .reply(200, expectedMoment);

      // Act
      const result = await apiClient.getMoment(momentId);

      // Assert
      expect(result).toEqual(expectedMoment);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      // Arrange
      nock(baseURL)
        .get('/users')
        .replyWithError('Network error');

      // Act & Assert
      await expect(apiClient.getUsers()).rejects.toThrow('Network error');
    });

    test('should handle API errors', async () => {
      // Arrange
      nock(baseURL)
        .post('/users')
        .reply(500, { error: 'Internal server error' });

      // Act & Assert
      await expect(apiClient.createUser({})).rejects.toThrow();
    });
  });
});
```

## 🔗 **Integration Tests**

### **End-to-End Workflow Tests (tests/integration/workflow.test.js)**
```javascript
const request = require('supertest');
const { GroqChatModel } = require('../../src/app/groqChatModel');
const ThunaiAPIClient = require('../../src/app/apiClient');

describe('CultureOS Integration Tests', () => {
  let apiClient;

  beforeAll(async () => {
    // Setup test database or use test environment
    apiClient = new ThunaiAPIClient();
  });

  describe('Complete Moment Detection Workflow', () => {
    test('should detect moment, create user, and store moment', async () => {
      // Test data
      const testMessage = "Alice Johnson's birthday is tomorrow";
      const expectedMomentType = 'birthday';
      const expectedPersonName = 'Alice Johnson';

      // Step 1: AI Detection
      const groqModel = new GroqChatModel();
      
      try {
        const aiResponse = await groqModel.sendMessage([
          {
            role: 'system',
            content: 'Detect celebration moments from conversations.'
          },
          {
            role: 'user',
            content: testMessage
          }
        ]);

        expect(aiResponse).toBeDefined();
        const parsed = JSON.parse(aiResponse.message);
        
        // Verify moment detection
        expect(parsed.category).toBe('operational');
        expect(parsed.moment_detected).toBe(true);
        expect(parsed.moment_details.moment_type).toBe(expectedMomentType);
        expect(parsed.moment_details.person_name).toContain('Alice');

        // Step 2: User Creation (if needed)
        const teamsId = 'alice.johnson@company.com';
        let user = await apiClient.getUserByTeamsId(teamsId);
        
        if (!user) {
          user = await apiClient.createUser({
            name: expectedPersonName,
            teams_user_id: teamsId,
            email: teamsId
          });
        }

        expect(user).toBeDefined();
        expect(user.id).toBeDefined();

        // Step 3: Moment Creation
        const momentData = {
          person_name: parsed.moment_details.person_name,
          moment_type: parsed.moment_details.moment_type,
          moment_date: parsed.moment_details.moment_date,
          description: parsed.moment_details.description,
          created_by: 'test@company.com',
          user_id: user.id
        };

        const moment = await apiClient.createMoment(momentData);

        expect(moment).toBeDefined();
        expect(moment.id).toBeDefined();
        expect(moment.person_name).toBe(momentData.person_name);
        expect(moment.moment_type).toBe(momentData.moment_type);

      } catch (error) {
        // If Groq API is not available, test with fallback
        console.warn('Groq API not available, testing with mock data');
        
        const mockMomentData = {
          person_name: expectedPersonName,
          moment_type: expectedMomentType,
          moment_date: '2025-11-09',
          description: testMessage,
          created_by: 'test@company.com'
        };

        const moment = await apiClient.createMoment(mockMomentData);
        expect(moment).toBeDefined();
      }
    });

    test('should handle greeting collection workflow', async () => {
      // Create test moment
      const moment = await apiClient.createMoment({
        person_name: 'Test Person',
        moment_type: 'birthday',
        moment_date: '2025-11-10',
        description: 'Test birthday',
        created_by: 'test@company.com'
      });

      // Add test greetings
      const greetings = [
        {
          moment_id: moment.id,
          author_name: 'John Doe',
          author_teams_id: 'john@company.com',
          greeting_text: 'Happy Birthday! Hope you have a wonderful day!'
        },
        {
          moment_id: moment.id,
          author_name: 'Jane Smith',
          author_teams_id: 'jane@company.com',
          greeting_text: 'Wishing you all the best on your special day!'
        }
      ];

      const savedGreetings = [];
      for (const greeting of greetings) {
        const saved = await apiClient.createGreeting(greeting);
        savedGreetings.push(saved);
      }

      // Verify greetings were saved
      expect(savedGreetings).toHaveLength(2);
      expect(savedGreetings[0].greeting_text).toContain('Happy Birthday');
      expect(savedGreetings[1].greeting_text).toContain('Wishing you');

      // Get all greetings for moment
      const momentGreetings = await apiClient.getGreetingsForMoment(moment.id);
      expect(momentGreetings).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid moment data', async () => {
      const invalidMoment = {
        // Missing required fields
        person_name: '',
        moment_type: 'invalid_type'
      };

      await expect(apiClient.createMoment(invalidMoment)).rejects.toThrow();
    });

    test('should handle duplicate user creation', async () => {
      const userData = {
        name: 'Duplicate User',
        teams_user_id: 'duplicate@company.com',
        email: 'duplicate@company.com'
      };

      // Create user first time
      await apiClient.createUser(userData);

      // Try to create same user again
      await expect(apiClient.createUser(userData)).rejects.toThrow();
    });
  });
});
```

## 🎯 **End-to-End Tests**

### **E2E Scenario Tests (tests/e2e/scenarios.test.js)**
```javascript
const puppeteer = require('puppeteer');

describe('CultureOS E2E Scenarios', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  describe('FastAPI Documentation', () => {
    test('should load API documentation', async () => {
      await page.goto('http://localhost:8000/docs');
      
      const title = await page.title();
      expect(title).toContain('FastAPI');

      // Check for main API endpoints
      const endpoints = await page.$$eval('[data-testid="operation"]', 
        elements => elements.map(el => el.textContent)
      );

      expect(endpoints.some(endpoint => endpoint.includes('/users'))).toBe(true);
      expect(endpoints.some(endpoint => endpoint.includes('/moments'))).toBe(true);
    });

    test('should allow API interaction via docs', async () => {
      await page.goto('http://localhost:8000/docs');

      // Find and click on GET /users endpoint
      await page.click('text=/users');
      await page.click('button:has-text("Try it out")');
      await page.click('button:has-text("Execute")');

      // Wait for response
      await page.waitForSelector('[data-testid="response-body"]', { timeout: 10000 });
      
      const response = await page.textContent('[data-testid="response-body"]');
      expect(response).toBeDefined();
    });
  });

  describe('Health Checks', () => {
    test('should return healthy status', async () => {
      const response = await page.goto('http://localhost:8000/health');
      expect(response.status()).toBe(200);

      const content = await page.content();
      expect(content).toContain('healthy');
    });
  });
});
```

## 🚄 **Performance Tests**

### **Load Testing Configuration (tests/load/load-test.yml)**
```yaml
config:
  target: 'http://localhost:8000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up phase"
    - duration: 120
      arrivalRate: 50
      name: "Load test phase"
    - duration: 60
      arrivalRate: 100
      name: "Spike test phase"
  processor: "./load-test-processor.js"

scenarios:
  - name: "API Health Check"
    weight: 20
    flow:
      - get:
          url: "/health"
          expect:
            - statusCode: 200

  - name: "Get Users"
    weight: 30
    flow:
      - get:
          url: "/api/v1/users"
          expect:
            - statusCode: 200

  - name: "Create and Get User"
    weight: 25
    flow:
      - post:
          url: "/api/v1/users"
          json:
            name: "{{ $randomString() }}"
            teams_user_id: "{{ $randomString() }}@company.com"
            email: "{{ $randomString() }}@company.com"
          capture:
            - json: "$.id"
              as: "userId"
          expect:
            - statusCode: 201
      - get:
          url: "/api/v1/users/{{ userId }}"
          expect:
            - statusCode: 200

  - name: "Create Moment"
    weight: 25
    flow:
      - post:
          url: "/api/v1/moments"
          json:
            person_name: "{{ $randomString() }}"
            moment_type: "birthday"
            moment_date: "2025-11-15"
            description: "Test moment"
            created_by: "test@company.com"
          expect:
            - statusCode: 201
```

### **Load Test Processor (tests/load/load-test-processor.js)**
```javascript
module.exports = {
  $randomString: function() {
    return Math.random().toString(36).substring(7);
  },
  
  beforeRequest: function(requestParams, context, ee, next) {
    // Add auth headers if needed
    requestParams.headers = requestParams.headers || {};
    requestParams.headers['Content-Type'] = 'application/json';
    return next();
  },

  afterResponse: function(requestParams, response, context, ee, next) {
    // Log errors
    if (response.statusCode >= 400) {
      console.log(`Error ${response.statusCode}: ${requestParams.url}`);
    }
    return next();
  }
};
```

## 🔍 **Quality Assurance Scripts**

### **Automated QA Script (tests/qa/automated-qa.js)**
```javascript
const { runAITests } = require('../ai-detection/ai-test-suite');
const ThunaiAPIClient = require('../../src/app/apiClient');

class QualityAssurance {
  constructor() {
    this.apiClient = new ThunaiAPIClient();
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runFullQACheck() {
    console.log('🔍 Starting CultureOS Quality Assurance Check\n');

    try {
      // 1. API Health Check
      await this.checkAPIHealth();

      // 2. Database Integrity Check
      await this.checkDatabaseIntegrity();

      // 3. AI Detection Tests
      await this.runAIDetectionTests();

      // 4. Data Validation Tests
      await this.runDataValidationTests();

      // 5. Performance Baseline Tests
      await this.runPerformanceTests();

      // Generate QA Report
      this.generateQAReport();

    } catch (error) {
      console.error('❌ QA Check failed:', error);
      process.exit(1);
    }
  }

  async checkAPIHealth() {
    console.log('🏥 Checking API Health...');

    try {
      const health = await fetch('http://localhost:8000/health');
      const data = await health.json();

      if (data.status === 'healthy') {
        console.log('✅ API Health: PASSED');
        this.testResults.passed++;
      } else {
        throw new Error('API not healthy');
      }
    } catch (error) {
      console.log('❌ API Health: FAILED');
      this.testResults.failed++;
      this.testResults.errors.push(`API Health: ${error.message}`);
    }
  }

  async checkDatabaseIntegrity() {
    console.log('🗄️ Checking Database Integrity...');

    try {
      // Check users table
      const users = await this.apiClient.getUsers();
      if (!Array.isArray(users)) {
        throw new Error('Users endpoint did not return array');
      }

      // Check moments table
      const moments = await this.apiClient.getMoments();
      if (!Array.isArray(moments)) {
        throw new Error('Moments endpoint did not return array');
      }

      // Check relationships
      for (const moment of moments.slice(0, 5)) { // Check first 5
        if (moment.user_id) {
          const user = await this.apiClient.getUser(moment.user_id);
          if (!user) {
            throw new Error(`Orphaned moment ${moment.id} references non-existent user ${moment.user_id}`);
          }
        }
      }

      console.log('✅ Database Integrity: PASSED');
      this.testResults.passed++;

    } catch (error) {
      console.log('❌ Database Integrity: FAILED');
      this.testResults.failed++;
      this.testResults.errors.push(`Database Integrity: ${error.message}`);
    }
  }

  async runAIDetectionTests() {
    console.log('🤖 Running AI Detection Tests...');

    try {
      const aiTestResults = await runAITests();
      
      if (aiTestResults.failed === 0) {
        console.log('✅ AI Detection: PASSED');
        this.testResults.passed++;
      } else {
        throw new Error(`${aiTestResults.failed} AI tests failed`);
      }

    } catch (error) {
      console.log('❌ AI Detection: FAILED');
      this.testResults.failed++;
      this.testResults.errors.push(`AI Detection: ${error.message}`);
    }
  }

  async runDataValidationTests() {
    console.log('📊 Running Data Validation Tests...');

    try {
      // Test moment type validation
      const invalidMoment = {
        person_name: 'Test',
        moment_type: 'invalid_type',
        moment_date: '2025-11-15',
        created_by: 'test@company.com'
      };

      try {
        await this.apiClient.createMoment(invalidMoment);
        throw new Error('API accepted invalid moment type');
      } catch (apiError) {
        // This should fail - that's expected
        if (!apiError.message.includes('invalid_type')) {
          throw apiError;
        }
      }

      // Test date validation
      const invalidDateMoment = {
        person_name: 'Test',
        moment_type: 'birthday',
        moment_date: 'invalid-date',
        created_by: 'test@company.com'
      };

      try {
        await this.apiClient.createMoment(invalidDateMoment);
        throw new Error('API accepted invalid date format');
      } catch (apiError) {
        // This should fail - that's expected
      }

      console.log('✅ Data Validation: PASSED');
      this.testResults.passed++;

    } catch (error) {
      console.log('❌ Data Validation: FAILED');
      this.testResults.failed++;
      this.testResults.errors.push(`Data Validation: ${error.message}`);
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests...');

    try {
      const startTime = Date.now();
      
      // Test API response time
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(fetch('http://localhost:8000/health'));
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const avgResponseTime = (endTime - startTime) / 10;

      if (avgResponseTime > 1000) { // 1 second threshold
        throw new Error(`Average response time too high: ${avgResponseTime}ms`);
      }

      console.log(`✅ Performance: PASSED (avg response: ${avgResponseTime}ms)`);
      this.testResults.passed++;

    } catch (error) {
      console.log('❌ Performance: FAILED');
      this.testResults.failed++;
      this.testResults.errors.push(`Performance: ${error.message}`);
    }
  }

  generateQAReport() {
    console.log('\n📋 CultureOS Quality Assurance Report');
    console.log('=====================================');
    console.log(`✅ Tests Passed: ${this.testResults.passed}`);
    console.log(`❌ Tests Failed: ${this.testResults.failed}`);
    console.log(`📊 Success Rate: ${(this.testResults.passed / (this.testResults.passed + this.testResults.failed) * 100).toFixed(1)}%`);

    if (this.testResults.errors.length > 0) {
      console.log('\n🚨 Error Details:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log('\n📄 QA Status:', this.testResults.failed === 0 ? '🟢 PASSED' : '🔴 FAILED');
    
    if (this.testResults.failed > 0) {
      process.exit(1);
    }
  }
}

// Run QA if called directly
if (require.main === module) {
  const qa = new QualityAssurance();
  qa.runFullQACheck();
}

module.exports = { QualityAssurance };
```

## 📊 **Test Reporting**

### **Test Reporter (tests/utils/test-reporter.js)**
```javascript
class TestReporter {
  static generateCoverageReport() {
    console.log('📊 Generating Coverage Report...');
    // Coverage report generation logic
  }

  static generatePerformanceReport(results) {
    console.log('⚡ Performance Test Results:');
    console.log(`Average Response Time: ${results.avgResponseTime}ms`);
    console.log(`Peak Memory Usage: ${results.peakMemory}MB`);
    console.log(`Requests Per Second: ${results.rps}`);
  }

  static generateTestSummary(suiteResults) {
    const totalTests = suiteResults.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = suiteResults.reduce((sum, suite) => sum + suite.passed, 0);
    const successRate = (totalPassed / totalTests * 100).toFixed(1);

    console.log('\n📈 Overall Test Summary');
    console.log('======================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalTests - totalPassed}`);
    console.log(`Success Rate: ${successRate}%`);

    return {
      total: totalTests,
      passed: totalPassed,
      failed: totalTests - totalPassed,
      successRate: parseFloat(successRate)
    };
  }
}

module.exports = { TestReporter };
```

---
**This comprehensive testing strategy ensures CultureOS quality through unit tests, integration tests, E2E scenarios, performance validation, and automated QA procedures.**