# API Architecture Violations Report

## Overview
Both Thunai API and WFO API should contain **ONLY** database persistence code. Any LLM processing or complex business logic must be handled in the bot layer.

## ✅ Compliant Components

### Thunai API - Clean Components
- `app/core/` - Database connection, config ✅
- `app/repositories/` - Pure CRUD operations ✅
- `app/services/` - Data validation and DB operations ✅
- `app/routers/users.py` - User management endpoints ✅
- `app/routers/moments.py` - Moment CRUD endpoints ✅
- `app/routers/greetings.py` - Greeting management ✅
- `app/routers/accolades.py` - Accolade management ✅

### WFO API - Clean Components
- `app/core/` - Database connection, config ✅
- `app/repositories/` - Pure CRUD operations ✅
- `app/routers/wfo_availability.py` - WFO data management ✅
- `app/routers/predictions.py` - Basic prediction endpoints ✅

## ❌ VIOLATIONS FOUND

### 1. Thunai API - Text Analysis Logic

**File**: `app/routers/moment_analysis.py`
**Violation Type**: Business Logic in API Layer
**Severity**: HIGH

#### Issues:
```python
# REGEX PATTERN MATCHING - Should be in bot
name_patterns = [
    r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|has|will|'s|won|received|got|achieved)",
    r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:birthday|anniversary|joining|leaving)",
    # ... more patterns
]

# MOMENT TYPE CLASSIFICATION - Should be in bot
type_keywords = {
    "joining_welcome": ["joining", "new member", "starting", "welcome"],
    "birthday": ["birthday", "born", "birth", "bday"],
    "work_anniversary": ["anniversary", "years with", "years at"],
    # ... extensive keyword mapping
}

# DATE EXTRACTION LOGIC - Should be in bot
date_patterns = [
    r"(?:on|is)\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)",
    r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",
    # ... more date patterns
]
```

#### What Should Happen:
- Bot processes text and sends structured data: `{"celebrant_name": "John", "moment_type": "birthday", "date": "2024-01-15"}`
- API only validates and stores this structured data

---

### 2. WFO API - LLM Processing Logic

**File**: `app/services/wfo_llm_processor.py`
**Violation Type**: LLM Calls in API Layer
**Severity**: CRITICAL

#### Issues:
```python
# LLM PROMPT CONSTRUCTION - Should be in bot
context_prompt = f"""
Question asked: "{message_template}"
User response: "{message}"
Collection type: {collection_type}

Based on the question and user's response, extract their office plans...
"""

# LLM API CALLS - Should be in bot
llm_result, raw_llm_output = await self._call_llm_for_extraction_with_logging(context_prompt)

# COMPLEX BUSINESS LOGIC - Should be in bot
if 'to' in message_lower or '-' in message_lower:
    # Range detection logic
    days_order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    # ... complex parsing logic
```

#### What Should Happen:
- Bot processes "Mon to Wed" and sends: `{"monday": "office", "tuesday": "office", "wednesday": "office", "thursday": "home", "friday": "home"}`
- API only validates and stores this structured data

---

### 3. WFO API - Universal Message Classification

**File**: `app/services/universal_detector.py`
**Violation Type**: LLM-Based Classification System
**Severity**: CRITICAL

#### Issues:
```python
# FULL LLM CLASSIFICATION SYSTEM - Should be in bot
async def detect_message_intent(self, message: str, user_context: Dict = None):
    classification_prompt = f"""
    Analyze this message and classify its intent. Return JSON only.
    
    Message: "{message}"
    
    Classify into one of these categories:
    1. "moment" - User sharing a celebration, achievement, birthday...
    2. "wfo_response" - User responding about work from office plans...
    # ... extensive classification logic
    """

# LLM CLIENT INTEGRATION - Should be in bot
async def _call_llm(self, prompt: str) -> str:
    if not self.groq_client:
        raise Exception("No LLM client available")
    response = await self.groq_client.sendChatCompletion(messages)
```

#### What Should Happen:
- Bot handles all message classification
- Bot sends classified, structured data to appropriate API endpoints
- APIs only handle data persistence

---

### 4. WFO API - Deprecated Test File

**File**: `test_llm_wfo_extraction.py`
**Violation Type**: LLM Testing in API Layer
**Severity**: MEDIUM

#### Issues:
```python
"""
This test file is deprecated. LLM extraction is not allowed in API. 
All LLM logic must be tested in the bot layer.
"""
# File exists but is marked deprecated
```

#### Action Required:
- Remove this file completely
- Move any relevant tests to bot layer

## 🔧 Required Cleanup Actions

### Immediate Actions (High Priority)

1. **Remove Thunai API Text Analysis**
   ```bash
   # Delete the entire router
   rm app/routers/moment_analysis.py
   
   # Remove from main.py imports
   # from app.routers import moment_analysis
   # app.include_router(moment_analysis.router, prefix="/api/v1")
   ```

2. **Remove WFO API LLM Processing**
   ```bash
   # Delete LLM processor files
   rm app/services/wfo_llm_processor.py
   rm app/services/wfo_llm_processor_clean.py
   rm app/services/universal_detector.py
   
   # Remove deprecated test
   rm test_llm_wfo_extraction.py
   ```

3. **Update WFO Services**
   - Remove any LLM client references
   - Remove complex text parsing logic
   - Keep only data validation and DB operations

### API Design Principles

#### ✅ What APIs Should Do:
- Receive structured data from bot
- Validate data format and constraints
- Perform CRUD operations on database
- Return success/error responses
- Handle authentication/authorization
- Provide health checks

#### ❌ What APIs Should NOT Do:
- Parse natural language text
- Make LLM API calls
- Classify message intent
- Extract entities from text
- Perform complex business logic
- Handle conversation context

### Correct Data Flow

```
User Message → Bot (LLM Processing) → Structured Data → API (DB Persistence) → Response
```

**Example:**
```
"John's birthday is tomorrow" 
→ Bot processes with LLM 
→ {"celebrant_name": "John", "moment_type": "birthday", "date": "2024-01-16"}
→ API stores in database
→ {"success": true, "moment_id": 123}
```

## 📊 Violation Summary

| Component | File | Violation Type | Severity | Action |
|-----------|------|----------------|----------|---------|
| Thunai API | `moment_analysis.py` | Text Analysis | HIGH | Remove |
| WFO API | `wfo_llm_processor.py` | LLM Calls | CRITICAL | Remove |
| WFO API | `universal_detector.py` | Classification | CRITICAL | Remove |
| WFO API | `test_llm_wfo_extraction.py` | Deprecated | MEDIUM | Remove |

## ✅ Post-Cleanup Verification

After cleanup, both APIs should only contain:
- Database models and schemas
- Repository classes (CRUD operations)
- Service classes (data validation)
- Router classes (REST endpoints)
- Configuration and database connection
- Health check endpoints

**No LLM calls, no text parsing, no business logic - only data persistence.**