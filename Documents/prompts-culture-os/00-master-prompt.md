# CultureOS - Master Implementation Prompt

## Project Overview
Create a complete **Microsoft Teams culture management bot** called "CultureOS" that automatically detects celebration moments (birthdays, work anniversaries, achievements) from natural conversations and orchestrates team-wide greeting collection workflows.

> **📋 VALIDATION STATUS**: ✅ All design principles validated and documented in `DESIGN-PRINCIPLES-VALIDATION-REPORT.md` - Perfect alignment achieved between documentation and implementation (83% complete, 5/6 principles fully implemented).

## Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Teams Bot      │◄──►│  FastAPI        │◄──►│  SQLite         │
│  (Node.js)      │    │  Backend        │    │  Database       │
│  Port: 3978     │    │  Port: 8000     │    │  Local File     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   ┌──────────┐           ┌──────────┐           ┌──────────┐
   │  Groq AI │           │  CORS    │           │  Users   │
   │  (LLM)   │           │  Enabled │           │ Moments  │
   │  NLP     │           │  API     │           │Greetings │
   └──────────┘           └──────────┘           └──────────┘
```

## Core Functionality
1. **Natural Language Processing**: Detect celebration moments from conversations
2. **User Management**: Auto-create users, admin validation
3. **Moment Management**: Create, store, and manage celebration moments
4. **Team Notifications**: Broadcast moments to team channels
5. **Greeting Collection**: Interactive workflow for team participation
6. **Card Generation**: Compile greetings into celebratory cards

## Implementation Structure
This project consists of **5 main components** with detailed prompts:

### 🤖 **Component 1: Teams Bot (Node.js)**
- **Prompt**: `01-teams-bot-implementation.md`
- **Features**: Message handling, Groq AI integration, adaptive cards, conversation management
- **Key Files**: app.js, config.js, groqChatModel.js, apiClient.js, dateUtils.js

### 🔌 **Component 2: FastAPI Backend (Python)**  
- **Prompt**: `02-fastapi-backend-implementation.md`
- **Features**: RESTful API, database operations, CRUD for users/moments/greetings
- **Key Files**: main.py, database.py, models, repositories, services, routers

### 🗄️ **Component 3: Database Schema (SQLite)**
- **Prompt**: `03-database-schema-implementation.md`  
- **Features**: Complete schema with relationships, indexes, sample data
- **Key Files**: database_complete.sql, migration scripts

### ⚙️ **Component 4: DevOps & Configuration**
- **Prompt**: `04-devops-configuration-implementation.md`
- **Features**: Scripts, environment setup, Teams app manifest, deployment
- **Key Files**: package.json, .env templates, PowerShell scripts, manifest.json

### 🏢 **Component 5: WFO Prediction Module (Isolated)**
- **Prompt**: `wfo-prediction-api/documentation/08-wfo-prediction-module-prompt.md`
- **Features**: Work From Office data collection, smart scheduling, proactive messaging
- **Key Files**: WFO API (port 8001), conversation routing, friendly response generation
- **Isolation**: Zero coupling with existing business logic, separate API service

## 🎯 **Key Design Principles (ALL Components)**

> **📋 VALIDATION REFERENCE**: Complete cross-document validation and implementation status tracked in `DESIGN-PRINCIPLES-VALIDATION-REPORT.md` (✅ 83% complete, 5/6 principles fully implemented)

### **Critical Implementation Foundation**
1. **Zero Coupling**: Completely separate from Thunai API - independent services ✅
2. **LLM-First**: No hardcoded detection patterns - intelligent classification via Groq API ✅
3. **Flexible Input**: Users can provide any amount of data - partial information accepted ✅
4. **Context-Aware**: Tracks conversation state properly - knows what questions were asked ✅
5. **Smart Collection**: Avoids over-messaging with attempt tracking and smart stopping 🚧
6. **Confirmation-Based**: Always confirms extracted data with users before storage ✅

### **Principle Application by Component**
- **Components 1-4 (Core System)**: Focus on moment detection with confirmation flows
- **Component 5 (WFO Module)**: Focus on proactive collection with friendly interactions
- **Future Integrations**: Follow same principles for consistent user experience

## 🎯 **Success Criteria**
A complete implementation should:
1. **Core System**: Detect moments from natural conversations ("Sarah's birthday is next Tuesday")
2. **User Management**: Automatically create users when they don't exist
3. **Team Coordination**: Send team notifications about moments
4. **Greeting Collection**: Collect greetings from multiple team members
5. **Celebration Cards**: Generate and deliver final greeting cards
6. **Analytics Tracking**: Track engagement analytics
7. **🆕 WFO Integration**: Proactive office coordination with complete isolation

## 🏗️ **Bot-Primary Architecture (Scalable for Multiple Integrations)**

### **Core Design Principle**
The **Teams Bot is the primary system** with **modular API integrations**:
```
┌─────────────────────────────────────────────────────────┐
│                    Microsoft Teams Bot                   │
│                    (Primary System)                      │
│  ┌─────────────────────┐  ┌─────────────────────────┐    │
│  │   Core Moments      │  │   WFO Integration       │    │
│  │   (Port 8000)       │  │   (Port 8001)          │    │
│  │   ✅ PRIMARY        │  │   ✅ ISOLATED MODULE   │    │
│  └─────────────────────┘  └─────────────────────────┘    │
│               │                         │                │
│               ▼                         ▼                │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          Shared Database (SQLite)                   │ │
│  │    Separate table groups per integration            │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### **Integration Benefits**
- **Maximum Isolation**: Each integration runs independently
- **Zero Impact**: New modules don't affect existing functionality  
- **Scalable Architecture**: Easy to add more integrations (HR, Calendar, etc.)
- **Consistent Experience**: All integrations use same Teams bot interface

## 📋 **Implementation Order**
1. **Database Foundation**: Create schema and sample data (Components 1-4)
2. **Core System**: Build moment detection system (Components 1-4)
3. **WFO Integration**: Add isolated WFO prediction module (Component 5)
4. **Future Integrations**: Follow same isolation pattern for additional modules

## 🔧 **Key Technologies**
- **Frontend**: Microsoft Teams (Adaptive Cards)
- **Backend**: Node.js (Teams Bot) + Python FastAPI (API)
- **Database**: SQLite with proper relationships
- **AI/ML**: Groq API (Llama 3.1) for natural language processing
- **DevOps**: PowerShell scripts, package.json scripts

## 📁 **Complete Project Structure (Including WFO Integration)**
```
CultureOS/
├── Culture OS/              # Teams Bot (Node.js) - PRIMARY SYSTEM
│   ├── src/
│   │   ├── app/            # Core bot logic & moment detection
│   │   ├── wfo/            # 🆕 WFO conversation classes (isolated)
│   │   ├── config.js       # Configuration
│   │   └── index.js        # Entry point
│   ├── package.json        # Dependencies
│   ├── appPackage/         # Teams manifest  
│   ├── prompts/            # Implementation prompts (Components 1-7)
│   └── implementation-summary/  # Implementation results
├── thunai-api/             # Core FastAPI Backend (Port 8000)
│   ├── app/                # Complete MVC structure
│   ├── main.py            # FastAPI entry  
│   ├── requirements.txt   # Python dependencies
│   ├── prompts/           # Backend implementation prompt
│   └── implementation-summary/  # Backend results
├── wfo-prediction-api/     # 🆕 WFO Integration (Port 8001) - ISOLATED
│   ├── app/               # Complete FastAPI structure
│   ├── main.py            # Independent WFO API
│   ├── requirements.txt   # Isolated dependencies
│   └── documentation/     # WFO implementation specs & summary
├── Documents/
│   ├── database_complete.sql           # Complete schema (Core + WFO)
│   └── WFO_PREDICTION_REQUIREMENTS_AND_RECOMMENDATIONS.md
├── CULTUREOS-COMPLETE-SUMMARY.md      # 🆕 Complete project overview
└── scripts/               # PowerShell automation (start/stop/test)
```

## 🚀 **Getting Started (Complete System Recreation)**

### **For Core CultureOS System (Components 1-4)**
1. **Read prompts in order:** Components 1-4 create the full moment detection system
2. **Follow implementation instructions:** Each prompt has complete code examples
3. **Test each component:** Verify functionality before proceeding to next component
4. **Run integration tests:** Ensure end-to-end moment detection workflow

### **For WFO Integration (Component 5) - OPTIONAL BUT COMPLETE**
5. **Read WFO specifications:** `wfo-prediction-api/documentation/08-wfo-prediction-module-prompt.md`
6. **Implement isolated WFO system:** Complete independence from core system
7. **Add minimal bot integration:** Single-line modification to existing bot
8. **Test isolation:** Verify core system unaffected, WFO works independently

### **Team Reproduction Instructions**
- **All prompts are complete:** Any teammate can recreate the entire system
- **Documentation alignment:** Requirements, discussions, and implementation all match
- **Isolation validation:** Each module can be built and tested independently
- **Future integrations:** Follow same isolation pattern for additional modules

## 🆕 **WFO Module Addition (November 2025)**

The **Work From Office (WFO) Prediction Module** is a new addition that provides:
- **Proactive WFO data collection** from team members
- **Smart scheduling** with testing (10-second) and production modes  
- **Intelligent conversation routing** with context awareness
- **Friendly, colleague-like interactions** without technical jargon
- **Complete isolation** from existing business logic (zero coupling)

**Key Benefits:**
- Helps teams coordinate office presence for better collaboration
- Maintains existing CultureOS functionality untouched
- Runs on separate API service (port 8001) for maximum independence
- Uses same database with new isolated tables

**Implementation**: Follow the WFO module prompt after completing the core 4 components.

---
*Use the individual component prompts to implement each piece of the CultureOS system.*