const config = {
  groqApiKey: process.env.GROQ_API_KEY,
  groqModelName: process.env.GROQ_MODEL_NAME || "llama-3.1-8b-instant",
};

module.exports = config;
