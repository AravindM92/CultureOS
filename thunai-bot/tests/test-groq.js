// Test Groq API directly
const { GroqChatModel } = require("../src/app/groqChatModel");

async function testGroq() {
    console.log("Testing Groq API with llama-3.1-8b-instant...");
    
    try {
        const groqModel = new GroqChatModel({
            apiKey: "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",
            model: "llama-3.1-8b-instant"
        });

        const messages = [
            { role: 'system', content: 'You are Thun.ai, a helpful AI assistant.' },
            { role: 'user', content: 'Hello, can you introduce yourself?' }
        ];

        console.log("Sending request to Groq...");
        const response = await groqModel.sendChatCompletion(messages);
        
        console.log("✅ Groq Response:", response.content);
        console.log("✅ Groq API is working correctly!");
        
    } catch (error) {
        console.error("❌ Groq API Error:", error.message);
    }
}

testGroq();