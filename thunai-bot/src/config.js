const config = {
  MicrosoftAppId: process.env.CLIENT_ID,
  MicrosoftAppType: process.env.BOT_TYPE,
  MicrosoftAppTenantId: process.env.TENANT_ID,
  MicrosoftAppPassword: process.env.CLIENT_SECRET,
  groqApiKey: process.env.GROQ_API_KEY || "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", // Updated API key
  groqModelName: process.env.GROQ_MODEL_NAME || "llama-3.1-8b-instant",
  
  // API Configuration
  apiBaseURL: process.env.API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  apiHealthURL: process.env.API_HEALTH_URL || 'http://127.0.0.1:8000/health',
  
  // Bot Configuration  
  botPort: process.env.PORT || process.env.port || 3978,
  
  // Default Values
  emailDomain: process.env.EMAIL_DOMAIN || 'company.com',
  adminTeamsId: process.env.ADMIN_TEAMS_ID || 'admin_teams_id',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  enableDebug: process.env.NODE_ENV === 'development',
  
  // 🏢 WFO Prediction Module Configuration
  wfo: {
    // API Configuration
    apiUrl: process.env.WFO_API_URL || 'http://localhost:8001',
    apiHealthUrl: process.env.WFO_API_HEALTH_URL || 'http://localhost:8001/health',
    
    // Testing Mode Configuration
    testingMode: {
      enabled: process.env.WFO_TESTING_MODE === 'true' || true, // Default true for development
      userTriggered: process.env.WFO_USER_TRIGGERED === 'true' || true, // Enable user-triggered testing
      maxClarificationAttempts: 2 // Ask for clarification max 2 times
    },
    
    // Proactive Scheduling Configuration (Dynamic from Environment)
    proactiveScheduling: {
      enabled: process.env.WFO_PROACTIVE_SCHEDULING === 'true' || false, // Disabled by default for testing
      
      // Weekly Collection Schedule
      weeklyCollection: {
        enabled: process.env.WFO_WEEKLY_ENABLED === 'true' || true,
        dayOfWeek: parseInt(process.env.WFO_WEEKLY_DAY) || 5, // Friday = 5
        hour: parseInt(process.env.WFO_WEEKLY_HOUR) || 20, // 8 PM
        minute: parseInt(process.env.WFO_WEEKLY_MINUTE) || 0,
        timezone: process.env.WFO_TIMEZONE || 'Asia/Kolkata'
      },
      
      // Monday Follow-up Schedule  
      mondayFollowup: {
        enabled: process.env.WFO_MONDAY_ENABLED === 'true' || true,
        dayOfWeek: parseInt(process.env.WFO_MONDAY_DAY) || 1, // Monday = 1
        hour: parseInt(process.env.WFO_MONDAY_HOUR) || 8, // 8 AM
        minute: parseInt(process.env.WFO_MONDAY_MINUTE) || 0,
        timezone: process.env.WFO_TIMEZONE || 'Asia/Kolkata'
      },
      
      // Daily Reminder Schedule
      dailyReminder: {
        enabled: process.env.WFO_DAILY_ENABLED === 'true' || true,
        hour: parseInt(process.env.WFO_DAILY_HOUR) || 20, // 8 PM
        minute: parseInt(process.env.WFO_DAILY_MINUTE) || 0,
        timezone: process.env.WFO_TIMEZONE || 'Asia/Kolkata',
        skipWeekends: process.env.WFO_DAILY_SKIP_WEEKENDS === 'true' || true
      },
      
      // Testing Interval (for development)
      testingInterval: {
        enabled: process.env.WFO_TESTING_INTERVAL_ENABLED === 'true' || false,
        intervalSeconds: parseInt(process.env.WFO_TESTING_INTERVAL) || 10
      }
    },
    
    // Smart Collection Configuration
    smartCollection: {
      maxAttempts: parseInt(process.env.WFO_MAX_ATTEMPTS) || 3,
      stopOnDecline: process.env.WFO_STOP_ON_DECLINE === 'true' || true,
      stopOnComplete: process.env.WFO_STOP_ON_COMPLETE === 'true' || true,
      
      // Decline Detection Patterns
      declinePatterns: [
        'no', 'not now', 'maybe later', "don't ask", 'stop asking', 
        'skip', 'not interested', 'later', 'busy'
      ]
    },
    
    // Message Templates Configuration
    messages: {
      weeklyCollection: {
        template: process.env.WFO_WEEKLY_TEMPLATE || 
          "Hey! 👋 Hope you had a productive week! Could you share your office plans for next week? It helps me coordinate better!",
        confirmationTemplate: "Got it! Let me confirm your WFO plans: {schedule}. Should I save this to my notes? (1) Yes (2) No"
      },
      
      dailyReminder: {
        template: process.env.WFO_DAILY_TEMPLATE || 
          "Hi! 👋 Quick check - what's your office plan for tomorrow? Just trying to coordinate!",
        confirmationTemplate: "Perfect! So you'll be {status} tomorrow. Should I note this down? (1) Yes (2) No"
      },
      
      mondayFollowup: {
        template: process.env.WFO_MONDAY_TEMPLATE || 
          "Good morning! 🌅 Hope you had a great weekend! Could you share your office schedule for this week?",
        confirmationTemplate: "Thanks! I've noted your weekly schedule: {schedule}. Is this correct? (1) Yes (2) No"
      }
    },
    
    // Database Configuration
    database: {
      retentionWeeks: parseInt(process.env.WFO_RETENTION_WEEKS) || 4, // Keep 4 weeks of data
      cleanupEnabled: process.env.WFO_CLEANUP_ENABLED === 'true' || true
    },
    
    // Friendly Response Configuration
    friendlyTerms: {
      'database': 'my notes',
      'system': 'I',
      'server': 'I',
      'API': 'my system', 
      'store': 'remember',
      'save': 'note down',
      'record': 'keep track of',
      'update': 'change',
      'delete': 'remove'
    }
  }
};

module.exports = config;
