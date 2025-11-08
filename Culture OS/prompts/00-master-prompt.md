# CultureOS - Master Implementation Prompt

## Project Overview
Create a complete **Microsoft Teams culture management bot** called "CultureOS" that automatically detects celebration moments (birthdays, work anniversaries, achievements) from natural conversations and orchestrates team-wide greeting collection workflows.

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
This project consists of **4 main components** with detailed prompts:

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

## 🎯 **Success Criteria**
A complete implementation should:
1. Detect moments from natural conversations ("Sarah's birthday is next Tuesday")
2. Automatically create users when they don't exist
3. Send team notifications about moments
4. Collect greetings from multiple team members
5. Generate and deliver final greeting cards
6. Track engagement analytics

## 📋 **Implementation Order**
1. **Start with Database**: Create schema and sample data
2. **Build FastAPI Backend**: Implement all API endpoints
3. **Create Teams Bot**: Bot logic with AI integration
4. **Setup DevOps**: Scripts and configuration
5. **Test Integration**: End-to-end workflow testing

## 🔧 **Key Technologies**
- **Frontend**: Microsoft Teams (Adaptive Cards)
- **Backend**: Node.js (Teams Bot) + Python FastAPI (API)
- **Database**: SQLite with proper relationships
- **AI/ML**: Groq API (Llama 3.1) for natural language processing
- **DevOps**: PowerShell scripts, package.json scripts

## 📁 **Project Structure**
```
CultureOS/
├── Culture OS/              # Teams Bot (Node.js)
│   ├── src/
│   │   ├── app/            # Main bot logic
│   │   ├── config.js       # Configuration
│   │   └── index.js        # Entry point
│   ├── package.json        # Dependencies
│   └── appPackage/         # Teams manifest
├── thunai-api/             # FastAPI Backend
│   ├── app/
│   │   ├── core/          # Database & config
│   │   ├── models/        # Pydantic schemas
│   │   ├── repositories/  # Database access
│   │   ├── services/      # Business logic
│   │   └── routers/       # API endpoints
│   ├── main.py            # FastAPI entry
│   └── requirements.txt   # Python deps
├── database_complete.sql   # Database schema
└── scripts/               # PowerShell automation
```

## 🚀 **Getting Started**
1. Read all 4 component prompts in order
2. Follow implementation instructions in each prompt
3. Use the provided code examples and configurations
4. Test each component before moving to the next
5. Run integration tests to verify complete workflow

---
*Use the individual component prompts to implement each piece of the CultureOS system.*