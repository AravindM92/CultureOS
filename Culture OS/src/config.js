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
  enableDebug: process.env.NODE_ENV === 'development'
};

module.exports = config;
