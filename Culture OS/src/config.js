const config = {
  MicrosoftAppId: process.env.CLIENT_ID,
  MicrosoftAppType: process.env.BOT_TYPE,
  MicrosoftAppTenantId: process.env.TENANT_ID,
  MicrosoftAppPassword: process.env.CLIENT_SECRET,
  groqApiKey: process.env.GROQ_API_KEY || "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", // Updated API key
  groqModelName: process.env.GROQ_MODEL_NAME || "llama-3.1-8b-instant",
};

module.exports = config;
