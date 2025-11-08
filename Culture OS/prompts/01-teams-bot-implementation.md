# Teams Bot Implementation - CultureOS

## Overview
Create a Microsoft Teams bot using Node.js that detects celebration moments from natural conversations using AI (Groq API) and manages team culture workflows.

## Core Requirements

### 1. **Bot Framework & Setup**
- Microsoft Teams Bot Framework integration
- Adaptive Cards for rich interactions
- Local storage for conversation context
- Environment-based configuration

### 2. **AI Integration (Groq)**
- Natural language processing for moment detection
- Conversation categorization (operational vs casual)
- Fallback mechanisms for API failures
- Configurable AI model selection

### 3. **Key Features**
- **Moment Detection**: Automatically identify birthdays, anniversaries, achievements
- **User Management**: Auto-create users when they don't exist  
- **Confirmation Flows**: Natural language confirmations ("yes"/"no")
- **Date Parsing**: Convert relative dates ("next Tuesday" → actual dates)
- **API Integration**: Connect to FastAPI backend for data operations

## Implementation Structure

### 📁 **Required Files & Structure**
```
Culture OS/src/
├── index.js                 # Bot entry point & server setup
├── config.js               # Environment configuration
└── app/
    ├── app.js              # Main bot logic & message handling
    ├── groqChatModel.js    # Groq AI integration
    ├── apiClient.js        # FastAPI client
    ├── dateUtils.js        # Date parsing utilities
    ├── mockResponses.js    # Fallback responses
    ├── instructions.txt    # AI prompt instructions
    └── testUsers.js        # Sample user data
```

## 🔧 **Key Implementation Components**

### **1. Main Bot Logic (app.js)**
```javascript
const { App } = require("@microsoft/teams.apps");
const { LocalStorage } = require("@microsoft/teams.common");
const config = require("../config");
const { GroqChatModel } = require('./groqChatModel');
const ThunaiAPIClient = require('./apiClient');

// Core Features to Implement:
// ✅ Message handling with conversation history
// ✅ Moment detection using Groq AI
// ✅ User creation when not exists
// ✅ Confirmation flows (yes/no responses)
// ✅ Date parsing for celebration dates
// ✅ Storage management for conversation state
// ✅ Error handling with fallbacks
```

**Key Functions:**
- `handleMomentDetection()` - Process AI responses for moments
- `createUser()` - Auto-create users via API
- `createMoment()` - Store moments with validation
- `handleConfirmation()` - Process user confirmations
- Message categorization and routing

### **2. Groq AI Integration (groqChatModel.js)**
```javascript
// Features:
// ✅ Groq API client with error handling
// ✅ Conversation context management
// ✅ Custom properties for pending moments
// ✅ Fallback to mock responses
// ✅ Configurable model selection
```

**Key Requirements:**
- Handle corporate firewalls (VPN support)
- Maintain conversation context
- Support custom properties for workflow state
- Graceful degradation when API unavailable

### **3. FastAPI Client (apiClient.js)**
```javascript
// Endpoints to implement:
// ✅ GET /users - List users
// ✅ POST /users - Create user
// ✅ GET /users/teams/{teams_id} - Get user by Teams ID
// ✅ POST /moments - Create moment
// ✅ GET /health - API health check
```

### **4. Date Utilities (dateUtils.js)**
```javascript
// Features:
// ✅ Parse "next Tuesday", "this Friday", "tomorrow"
// ✅ Convert to ISO date format (YYYY-MM-DD)
// ✅ Handle day name resolution
// ✅ Timezone considerations
```

### **5. Configuration (config.js)**
```javascript
const config = {
  // Teams Bot Configuration
  MicrosoftAppId: process.env.CLIENT_ID,
  MicrosoftAppType: process.env.BOT_TYPE,
  MicrosoftAppTenantId: process.env.TENANT_ID,
  MicrosoftAppPassword: process.env.CLIENT_SECRET,
  
  // Groq AI Configuration
  groqApiKey: process.env.GROQ_API_KEY,
  groqModelName: process.env.GROQ_MODEL_NAME || "llama-3.1-8b-instant",
  
  // API Configuration
  apiBaseURL: process.env.API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  apiHealthURL: process.env.API_HEALTH_URL || 'http://127.0.0.1:8000/health',
  
  // Bot Configuration
  botPort: process.env.PORT || 3978,
  emailDomain: process.env.EMAIL_DOMAIN || 'company.com',
  adminTeamsId: process.env.ADMIN_TEAMS_ID,
  logLevel: process.env.LOG_LEVEL || 'info',
  enableDebug: process.env.NODE_ENV === 'development'
};
```

## 🤖 **AI Instructions (instructions.txt)**
```
You are Thun.ai, a friendly Microsoft Teams bot for CultureOS that helps teams celebrate moments together.

CONVERSATION ANALYSIS:
1. Categorize messages as 'operational' (work-related with celebrations) or 'casual'
2. For operational messages, detect celebration moments like:
   - Birthdays: "Sarah's birthday is next Tuesday"
   - Work anniversaries: "John's 5 year anniversary"
   - Achievements: "Lisa got promoted"
   - New hires: "Welcome Mark to the team"

MOMENT DETECTION:
- Extract: person_name, moment_type, moment_date, description
- Convert relative dates to YYYY-MM-DD format
- Validate celebrant exists or needs to be created

RESPONSES:
- Operational: Acknowledge moment detection and ask for confirmation
- Casual: Engage conversationally without detecting moments
- Always be helpful and culturally aware
```

## 📦 **Dependencies (package.json)**
```json
{
  "name": "cultureos-teams-bot",
  "version": "1.0.0",
  "dependencies": {
    "@microsoft/teams.apps": "^1.0.0",
    "@microsoft/teams.common": "^1.0.0", 
    "@microsoft/teams.api": "^1.0.0",
    "axios": "^1.6.0",
    "dotenv": "^16.0.0"
  },
  "scripts": {
    "start": "node src/index.js",
    "dev": "node src/index.js",
    "test": "echo \"No tests specified\""
  }
}
```

## 🎯 **Key Workflows**

### **Moment Detection Flow**
1. User sends message → Bot receives in `app.js`
2. Message sent to Groq AI for analysis
3. AI categorizes as operational/casual
4. If moment detected → Extract details
5. Check if celebrant exists → Create user if needed
6. Ask user for confirmation → "Did I understand correctly?"
7. On confirmation → Create moment via API
8. Send success message with moment details

### **User Creation Flow**
1. Moment detected for unknown person
2. Auto-generate user details (email domain, Teams ID)
3. Call POST `/api/v1/users` endpoint
4. Store user ID for moment creation
5. Continue with moment creation

### **Conversation Management**
1. Store conversation history in LocalStorage
2. Maintain context across messages
3. Handle confirmations and follow-ups
4. Clear storage after workflow completion

## 🔧 **Environment Variables (.env)**
```bash
# Teams Bot Configuration
CLIENT_ID=your-microsoft-app-id
CLIENT_SECRET=your-microsoft-app-password
TENANT_ID=your-tenant-id
BOT_TYPE=UserAssignedMsi

# Groq AI Configuration
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL_NAME=llama-3.1-8b-instant

# API Configuration
API_BASE_URL=http://127.0.0.1:8000/api/v1
API_HEALTH_URL=http://127.0.0.1:8000/health

# Bot Configuration
PORT=3978
EMAIL_DOMAIN=company.com
ADMIN_TEAMS_ID=admin-teams-user-id
NODE_ENV=development
LOG_LEVEL=info
```

## 🧪 **Testing Scenarios**

### **Test Cases**
1. **Existing User Moment**: "Sarah's birthday is next Tuesday"
2. **New User Moment**: "New hire Alice starts Monday"  
3. **Casual Conversation**: "How's the weather today?"
4. **Confirmation Handling**: "Yes, that's correct" / "No, not right"
5. **Date Parsing**: "this Friday", "next month", "tomorrow"

### **Expected Behaviors**
- Moments detected correctly with proper date conversion
- Users auto-created when they don't exist
- Confirmations processed naturally
- Fallbacks work when AI/API unavailable
- Conversation context maintained properly

## 🚀 **Deployment**

### **Local Development**
1. Install dependencies: `npm install`
2. Setup environment variables in `.env`
3. Start bot: `npm start` (port 3978)
4. Configure Teams app manifest with bot endpoint
5. Test with Teams client or Bot Framework Emulator

### **Teams Integration**
1. Create Teams app registration in Developer Portal
2. Configure bot endpoint: `https://your-domain.com/api/messages`
3. Upload app package with manifest.json
4. Install bot in Teams channels for testing

---
**Next Step**: Implement the FastAPI backend (see `02-fastapi-backend-implementation.md`)