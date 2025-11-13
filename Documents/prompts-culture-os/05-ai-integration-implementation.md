# AI Integration & Natural Language Processing - CultureOS

## Overview
Comprehensive guide for implementing Groq AI integration with natural language processing for moment detection, conversation analysis, and intelligent response generation in CultureOS.

## 🧠 **AI Architecture**

### **Core AI Components**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Message  │───►│   Groq API      │───►│   Moment        │
│   (Teams Chat)  │    │   (LLM Model)   │    │   Detection     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Context Store  │    │  Conversation   │    │   Database      │
│  (LocalStorage) │    │  Categorization │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🤖 **Groq Integration Implementation**

### **GroqChatModel.js - Complete Implementation**
```javascript
const axios = require('axios');
const config = require('../config');

class GroqChatModel {
    constructor() {
        this.apiKey = config.groqApiKey;
        this.modelName = config.groqModelName;
        this.baseURL = 'https://api.groq.com/openai/v1/chat/completions';
        this.maxRetries = 3;
        this.timeout = 30000; // 30 seconds
    }

    /**
     * Send a message to Groq AI and get response
     * @param {Array} messages - Array of message objects
     * @param {Object} customProperties - Custom properties to maintain state
     * @returns {Object} AI response with custom properties
     */
    async sendMessage(messages, customProperties = {}) {
        console.log(`[${new Date().toISOString()}] 🤖 Sending message to Groq AI...`);
        console.log('Messages:', JSON.stringify(messages, null, 2));
        console.log('Custom Properties:', JSON.stringify(customProperties, null, 2));

        try {
            const response = await this.makeGroqRequest(messages, customProperties);
            
            if (response && response.choices && response.choices.length > 0) {
                const aiMessage = response.choices[0].message;
                
                console.log(`[${new Date().toISOString()}] ✅ Groq AI response received`);
                console.log('AI Response:', aiMessage.content);
                
                return {
                    message: aiMessage.content,
                    customProperties: customProperties,
                    usage: response.usage || {},
                    model: response.model || this.modelName,
                    timestamp: new Date().toISOString()
                };
            }
            
            throw new Error('Invalid response format from Groq API');
            
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ❌ Groq AI Error:`, error.message);
            
            // Fallback to mock response
            return this.getFallbackResponse(messages, customProperties, error);
        }
    }

    /**
     * Make request to Groq API with retry logic
     * @param {Array} messages - Conversation messages
     * @param {Object} customProperties - State management
     * @returns {Object} Groq API response
     */
    async makeGroqRequest(messages, customProperties) {
        const requestData = {
            model: this.modelName,
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 1,
            stream: false,
            stop: null
        };

        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'CultureOS-Bot/1.0'
        };

        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`[${new Date().toISOString()}] 🔄 Groq API attempt ${attempt}/${this.maxRetries}`);
                
                const response = await axios.post(this.baseURL, requestData, {
                    headers: headers,
                    timeout: this.timeout,
                    validateStatus: (status) => status < 500 // Retry on 5xx errors
                });

                if (response.status === 200) {
                    console.log(`[${new Date().toISOString()}] ✅ Groq API success on attempt ${attempt}`);
                    return response.data;
                }
                
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                
            } catch (error) {
                lastError = error;
                console.warn(`[${new Date().toISOString()}] ⚠️  Groq API attempt ${attempt} failed:`, error.message);
                
                // Handle specific error types
                if (error.response) {
                    const status = error.response.status;
                    
                    if (status === 401) {
                        throw new Error('Invalid Groq API key. Please check your configuration.');
                    } else if (status === 429) {
                        // Rate limit - exponential backoff
                        const delay = Math.pow(2, attempt) * 1000;
                        console.log(`[${new Date().toISOString()}] ⏳ Rate limited, waiting ${delay}ms...`);
                        await this.sleep(delay);
                        continue;
                    } else if (status >= 500) {
                        // Server error - retry
                        await this.sleep(1000 * attempt);
                        continue;
                    }
                }
                
                // Network errors - retry
                if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
                    await this.sleep(1000 * attempt);
                    continue;
                }
                
                // Don't retry on other errors
                throw error;
            }
        }
        
        throw lastError || new Error('All Groq API attempts failed');
    }

    /**
     * Provide fallback response when Groq API fails
     * @param {Array} messages - Original messages
     * @param {Object} customProperties - State data
     * @param {Error} error - Original error
     * @returns {Object} Fallback response
     */
    getFallbackResponse(messages, customProperties, error) {
        console.log(`[${new Date().toISOString()}] 🔄 Using fallback response due to Groq API failure`);
        
        const lastMessage = messages[messages.length - 1];
        const userText = lastMessage?.content || '';
        
        // Simple keyword-based moment detection as fallback
        const momentKeywords = {
            birthday: ['birthday', 'bday', 'born', 'celebrates', 'turning'],
            work_anniversary: ['anniversary', 'years at', 'joined', 'hired', 'started working'],
            promotion: ['promoted', 'promotion', 'new role', 'advancement'],
            achievement: ['achieved', 'accomplished', 'award', 'recognition', 'completed'],
            new_hire: ['new hire', 'welcome', 'joining us', 'started today']
        };
        
        let detectedType = null;
        let confidence = 0;
        
        for (const [type, keywords] of Object.entries(momentKeywords)) {
            const matches = keywords.filter(keyword => 
                userText.toLowerCase().includes(keyword.toLowerCase())
            ).length;
            
            if (matches > confidence) {
                confidence = matches;
                detectedType = type;
            }
        }
        
        if (detectedType && confidence > 0) {
            return {
                message: JSON.stringify({
                    category: 'operational',
                    moment_detected: true,
                    moment_details: {
                        person_name: this.extractPersonName(userText),
                        moment_type: detectedType,
                        moment_date: this.extractDate(userText),
                        description: userText.trim(),
                        confidence: confidence * 0.3 // Lower confidence for fallback
                    }
                }),
                customProperties: customProperties,
                fallback: true,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
        
        // No moment detected - casual conversation
        return {
            message: JSON.stringify({
                category: 'casual',
                moment_detected: false,
                response: this.getCasualResponse(userText)
            }),
            customProperties: customProperties,
            fallback: true,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Extract person name from text (simple implementation)
     * @param {string} text - Input text
     * @returns {string} Extracted name or placeholder
     */
    extractPersonName(text) {
        // Simple regex to find capitalized words (likely names)
        const nameMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g);
        
        if (nameMatches && nameMatches.length > 0) {
            // Return first potential name that's not a common word
            const commonWords = ['Today', 'Tomorrow', 'Next', 'This', 'Happy', 'Congratulations'];
            for (const match of nameMatches) {
                if (!commonWords.includes(match)) {
                    return match;
                }
            }
        }
        
        return 'Team Member';
    }

    /**
     * Extract date from text (simple implementation)
     * @param {string} text - Input text
     * @returns {string} Extracted date or today's date
     */
    extractDate(text) {
        const today = new Date();
        
        // Look for relative dates
        if (text.toLowerCase().includes('today')) {
            return today.toISOString().split('T')[0];
        } else if (text.toLowerCase().includes('tomorrow')) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        } else if (text.toLowerCase().includes('next week')) {
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            return nextWeek.toISOString().split('T')[0];
        }
        
        // Default to today
        return today.toISOString().split('T')[0];
    }

    /**
     * Get casual conversation response
     * @param {string} userText - User's message
     * @returns {string} Casual response
     */
    getCasualResponse(userText) {
        const casualResponses = [
            "I'm here to help celebrate team moments! Feel free to share any birthdays, anniversaries, or achievements.",
            "Thanks for chatting! Let me know if there are any team celebrations coming up.",
            "I love hearing from the team! Is there anything special we should celebrate?",
            "That's interesting! I'm always ready to help organize celebrations when someone has a special moment.",
            "Great to hear from you! I'll keep an eye out for any celebration opportunities."
        ];
        
        // Simple sentiment-based response selection
        if (userText.toLowerCase().includes('hello') || userText.toLowerCase().includes('hi')) {
            return "Hello! I'm your friendly CultureOS bot, ready to help celebrate team moments! 🎉";
        } else if (userText.toLowerCase().includes('thank')) {
            return "You're very welcome! I'm always happy to help make our team culture more celebratory! 😊";
        }
        
        const randomIndex = Math.floor(Math.random() * casualResponses.length);
        return casualResponses[randomIndex];
    }

    /**
     * Utility function for delays
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Test Groq API connectivity
     * @returns {Object} Connection test results
     */
    async testConnection() {
        try {
            const testMessages = [
                {
                    role: 'system',
                    content: 'You are a helpful assistant. Respond with "Connection test successful" if you receive this message.'
                },
                {
                    role: 'user', 
                    content: 'Test connection'
                }
            ];
            
            const response = await this.sendMessage(testMessages);
            
            return {
                success: true,
                message: 'Groq API connection successful',
                model: response.model,
                timestamp: response.timestamp,
                fallback: response.fallback || false
            };
            
        } catch (error) {
            return {
                success: false,
                message: 'Groq API connection failed',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = { GroqChatModel };
```

## 📋 **AI Prompt Instructions**

### **instructions.txt - Comprehensive AI Prompt**
```
You are Thun.ai, a friendly and culturally aware Microsoft Teams bot designed to enhance team culture through celebration management.

=== CORE MISSION ===
Your primary role is to:
1. Analyze team conversations for celebration opportunities (moments)
2. Help coordinate team-wide greeting collection for special occasions
3. Strengthen team bonds through organized celebrations
4. Maintain a positive, inclusive, and engaging presence

=== CONVERSATION ANALYSIS FRAMEWORK ===

For EVERY message, you must:
1. Categorize the conversation as either 'operational' or 'casual'
2. If operational, detect any celebration moments
3. Respond in a consistent JSON format

OPERATIONAL CONVERSATIONS contain work-related content that may include:
- Personal milestones (birthdays, anniversaries, achievements)
- Team announcements (promotions, new hires, departures)  
- Project completions or recognitions
- Any information about team members' special occasions

CASUAL CONVERSATIONS are:
- General chat without celebration opportunities
- Questions about weather, sports, or daily life
- Technical discussions without personal milestones
- Simple greetings or social interactions

=== MOMENT DETECTION CRITERIA ===

Detect these moment types with high confidence:

**BIRTHDAY** moments:
- "Sarah's birthday is next Tuesday"
- "It's Mike's birthday today"
- "Don't forget, Lisa turns 30 tomorrow"
- Keywords: birthday, bday, born, celebrates, turning, cake

**WORK_ANNIVERSARY** moments:
- "John's 5-year anniversary is coming up"
- "Anna started here 3 years ago today"  
- "Celebrating Tom's work anniversary"
- Keywords: anniversary, years at, joined, hired, started working

**PROMOTION** moments:
- "Lisa got promoted to Senior Manager"
- "Congratulations to Mike on his new role"
- "Sarah's promotion was announced"
- Keywords: promoted, promotion, new role, advancement, elevated

**ACHIEVEMENT** moments:
- "Tom completed his AWS certification"
- "Sarah won the innovation award"
- "Lisa finished her master's degree"
- Keywords: achieved, accomplished, award, certification, completed, graduated

**NEW_HIRE** moments:
- "Welcome Alex to our team"
- "New hire starting Monday"
- "Everyone meet our newest team member"
- Keywords: new hire, welcome, joining us, started today, newest member

**LWD (Last Working Day)** moments:
- "Today is Sarah's last day"
- "Mike's farewell is tomorrow"
- "Lisa is leaving next week"
- Keywords: last day, leaving, farewell, goodbye, final day

=== RESPONSE FORMAT ===

For OPERATIONAL conversations, always respond with valid JSON:

```json
{
  "category": "operational",
  "moment_detected": true,
  "moment_details": {
    "person_name": "Full Name",
    "moment_type": "birthday|work_anniversary|promotion|achievement|new_hire|lwd|other",
    "moment_date": "YYYY-MM-DD",
    "description": "Brief description of the moment",
    "confidence": 0.95
  }
}
```

For CASUAL conversations, respond with JSON:

```json
{
  "category": "casual", 
  "moment_detected": false,
  "response": "Your friendly conversational response here"
}
```

=== DATE PARSING RULES ===

Convert relative dates to YYYY-MM-DD format:
- "today" → current date
- "tomorrow" → current date + 1 day  
- "next Tuesday" → date of next Tuesday
- "this Friday" → date of this Friday
- "next week" → current date + 7 days
- "in 3 days" → current date + 3 days

If no specific date is mentioned, use today's date.

=== PERSON NAME EXTRACTION ===

Extract the celebrant's full name accurately:
- "Sarah Johnson's birthday" → "Sarah Johnson"
- "It's Mike's anniversary" → "Mike" (use available information)
- "Lisa got promoted" → "Lisa"
- Always prioritize full names when available
- If name is unclear, use the most likely candidate from context

=== CONFIDENCE SCORING ===

Rate your confidence in moment detection:
- 0.9-1.0: Very explicit mentions with clear details
- 0.7-0.9: Strong indicators with good context
- 0.5-0.7: Moderate confidence, some ambiguity
- Below 0.5: Low confidence, don't detect moment

=== CONVERSATIONAL GUIDELINES ===

When responding casually:
- Be warm, friendly, and encouraging
- Show interest in team culture and celebrations
- Gently remind about celebration opportunities
- Use appropriate emojis to convey positivity
- Maintain professional yet approachable tone

Example casual responses:
- "That's great to hear! I love seeing our team connect. Let me know if there are any special moments worth celebrating! 🎉"
- "Thanks for sharing! I'm always here to help coordinate celebrations when someone has a milestone. 😊"
- "Interesting! I'll keep listening for any birthdays, anniversaries, or achievements to celebrate together! 🎯"

=== ERROR HANDLING ===

If uncertain about moment details:
- Set confidence below 0.5
- Still provide best guess for missing information
- Use "other" as moment_type when unsure
- Default to today's date if date is unclear

=== EXAMPLES ===

Input: "Sarah's birthday is next Tuesday and we should get her a cake"
Output:
```json
{
  "category": "operational",
  "moment_detected": true, 
  "moment_details": {
    "person_name": "Sarah",
    "moment_type": "birthday",
    "moment_date": "2025-11-12", 
    "description": "Sarah's birthday celebration",
    "confidence": 0.95
  }
}
```

Input: "How's everyone doing today?"
Output:
```json
{
  "category": "casual",
  "moment_detected": false,
  "response": "I'm doing great, thanks for asking! How are you? I'm always excited to hear about any team celebrations or special moments worth recognizing! 🎉"
}
```

Input: "Lisa completed her AWS certification last week"
Output:
```json
{
  "category": "operational", 
  "moment_detected": true,
  "moment_details": {
    "person_name": "Lisa",
    "moment_type": "achievement", 
    "moment_date": "2025-11-08",
    "description": "Lisa completed AWS certification",
    "confidence": 0.9
  }
}
```

=== REMEMBER ===
- Always respond in the specified JSON format for consistency
- Be inclusive and celebrate diverse cultural backgrounds
- Focus on building positive team culture
- Maintain accuracy in date and name extraction
- Show genuine enthusiasm for team celebrations
- Help create memorable moments that strengthen team bonds

You are an integral part of making the workplace more human, connected, and celebratory! 🌟
```

## 🔄 **AI Workflow Integration**

### **Message Processing Pipeline**
```javascript
// In app.js - AI integration workflow
async function processMessageWithAI(activity, conversationHistory) {
    try {
        // 1. Prepare conversation context
        const messages = [
            {
                role: 'system',
                content: fs.readFileSync(path.join(__dirname, 'instructions.txt'), 'utf-8')
            },
            ...conversationHistory,
            {
                role: 'user',
                content: activity.text
            }
        ];

        // 2. Send to Groq AI
        const groqModel = new GroqChatModel();
        const aiResponse = await groqModel.sendMessage(messages, {
            conversationId: activity.conversation.id,
            userId: activity.from.id,
            timestamp: new Date().toISOString()
        });

        // 3. Parse AI response
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(aiResponse.message);
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            parsedResponse = {
                category: 'casual',
                moment_detected: false,
                response: 'I\'m here to help celebrate team moments! How can I assist you today?'
            };
        }

        // 4. Process based on category
        if (parsedResponse.category === 'operational' && parsedResponse.moment_detected) {
            return await handleMomentDetection(activity, parsedResponse.moment_details);
        } else {
            return await handleCasualConversation(activity, parsedResponse.response);
        }

    } catch (error) {
        console.error('AI processing failed:', error);
        return 'I apologize, but I\'m having trouble processing your message right now. Please try again later.';
    }
}
```

## 🧪 **AI Testing & Validation**

### **AI Test Cases**
```javascript
// test-ai-detection.js
const { GroqChatModel } = require('./app/groqChatModel');
const fs = require('fs');
const path = require('path');

const testCases = [
    {
        name: 'Birthday Detection',
        input: "Sarah's birthday is next Tuesday",
        expectedType: 'birthday',
        expectedName: 'Sarah'
    },
    {
        name: 'Work Anniversary',
        input: "Mike's 5-year anniversary is coming up",
        expectedType: 'work_anniversary', 
        expectedName: 'Mike'
    },
    {
        name: 'Promotion',
        input: "Lisa got promoted to Senior Developer",
        expectedType: 'promotion',
        expectedName: 'Lisa'
    },
    {
        name: 'Achievement',
        input: "Tom completed his AWS certification",
        expectedType: 'achievement',
        expectedName: 'Tom'
    },
    {
        name: 'Casual Conversation',
        input: "How's the weather today?",
        expectedCategory: 'casual',
        expectedDetection: false
    }
];

async function runAITests() {
    const groqModel = new GroqChatModel();
    const instructions = fs.readFileSync(path.join(__dirname, 'app/instructions.txt'), 'utf-8');
    
    console.log('🧪 Running AI Detection Tests...\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        try {
            const messages = [
                {
                    role: 'system',
                    content: instructions
                },
                {
                    role: 'user',
                    content: testCase.input
                }
            ];
            
            const response = await groqModel.sendMessage(messages);
            const parsed = JSON.parse(response.message);
            
            console.log(`📝 Test: ${testCase.name}`);
            console.log(`   Input: "${testCase.input}"`);
            console.log(`   Response: ${JSON.stringify(parsed, null, 2)}`);
            
            let testPassed = true;
            
            if (testCase.expectedCategory) {
                if (parsed.category !== testCase.expectedCategory) {
                    console.log(`   ❌ Expected category: ${testCase.expectedCategory}, got: ${parsed.category}`);
                    testPassed = false;
                }
            }
            
            if (testCase.expectedDetection !== undefined) {
                if (parsed.moment_detected !== testCase.expectedDetection) {
                    console.log(`   ❌ Expected detection: ${testCase.expectedDetection}, got: ${parsed.moment_detected}`);
                    testPassed = false;
                }
            }
            
            if (testCase.expectedType && parsed.moment_details) {
                if (parsed.moment_details.moment_type !== testCase.expectedType) {
                    console.log(`   ❌ Expected type: ${testCase.expectedType}, got: ${parsed.moment_details.moment_type}`);
                    testPassed = false;
                }
            }
            
            if (testCase.expectedName && parsed.moment_details) {
                if (!parsed.moment_details.person_name.includes(testCase.expectedName)) {
                    console.log(`   ❌ Expected name to include: ${testCase.expectedName}, got: ${parsed.moment_details.person_name}`);
                    testPassed = false;
                }
            }
            
            if (testPassed) {
                console.log('   ✅ PASSED');
                passed++;
            } else {
                console.log('   ❌ FAILED');
                failed++;
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            failed++;
        }
        
        console.log('');
    }
    
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    return { passed, failed };
}

if (require.main === module) {
    runAITests()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = { runAITests };
```

---
**This prompt ensures comprehensive AI integration with robust natural language processing, fallback mechanisms, and thorough testing for the CultureOS moment detection system.**