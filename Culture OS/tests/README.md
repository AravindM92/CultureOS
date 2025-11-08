# CultureOS Test Files

This folder contains test scripts for the CultureOS - Thunai system.

## Test Files:

- **test-api-client.js** - Tests for API client functionality
- **test-complete-workflow.js** - End-to-end workflow testing
- **test-groq.js** - Groq AI integration tests
- **test-moment-analysis.js** - Moment detection and analysis tests
- **test-user-creation.js** - User management and creation tests

## Usage:
Run individual tests from the root project directory:
```bash
node Culture\ OS/tests/test-api-client.js
node Culture\ OS/tests/test-groq.js
# etc.
```

## Note:
These tests were moved from the root Culture OS directory for better organization. All require() paths have been updated to use `../src/app/` to properly reference the application modules.