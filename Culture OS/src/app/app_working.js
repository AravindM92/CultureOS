const { Application, storage } = require('@microsoft/teams.ai');
const config = require("../config");
const GroqChatModel = require('./groqChatModel');
const { MockThunaiResponses } = require('./mockResponses');

// Create instances
const mockResponses = new MockThunaiResponses();

// Load instructions
const fs = require('fs');
const path = require('path');
const instructions = fs.readFileSync(path.join(__dirname, 'instructions.txt'), 'utf-8');

console.log('🤖 Thun.ai Bot Starting...');
console.log('📖 Instructions loaded:', instructions.substring(0, 100) + '...');

// Create the app
const app = new Application({
  appId: config.botId,
  appPassword: config.botPassword,
  storage: storage
});

// Handle incoming messages
app.message(async (context, state) => {
  try {
    // DEBUG: Log incoming message details
    console.log(`[${new Date().toISOString()}] Message received from ${context.activity.from.name}: ${context.activity.text}`);
    
    // Simple response for testing
    if (!context.activity.text) {
      await context.sendActivity("Hello! I'm Thun.ai, your friendly assistant. How can I help you today?");
      return;
    }
    
    // Simple text response
    const response = `Thanks for your message: "${context.activity.text}". I'm working properly now! 🎉`;
    await context.sendActivity(response);
    
  } catch (error) {
    console.error('[ERROR] Message handler failed:', error);
    await context.sendActivity("🤖 I encountered an issue, but I'm still here to help!");
  }
});

module.exports = app;