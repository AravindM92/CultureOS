const config = {
  MicrosoftAppId: process.env.CLIENT_ID,
  MicrosoftAppType: process.env.BOT_TYPE,
  MicrosoftAppTenantId: process.env.TENANT_ID,
  MicrosoftAppPassword: process.env.CLIENT_SECRET,
  groqApiKey: process.env.GROQ_API_KEY,
  groqModelName: process.env.GROQ_MODEL_NAME || "llama-3.1-70b-versatile",
};

module.exports = config;
