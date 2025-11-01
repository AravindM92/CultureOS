const { App, storage, MessageActivity } = require('@azure/botbuilder');
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

// Create token credentials if needed
const tokenCredentials = {};
if (config.MicrosoftAppTenantId) {
  tokenCredentials.MicrosoftAppTenantId = config.MicrosoftAppTenantId;
}

const credentialOptions = config.MicrosoftAppType === "UserAssignedMsi" ? { ...tokenCredentials } : undefined;

// Create the app with storage
const app = new App({
  ...credentialOptions,
  storage
});

// Handle incoming messages
app.on('message', async ({ send, stream, activity }) => {
  try {
    // DEBUG: Log incoming message details
    console.log(`[${new Date().toISOString()}] Message received from ${activity.from.name}: ${activity.text}`);
    
    // Simple response for testing
    if (!activity.text) {
      await send("Hello! I'm Thun.ai, your friendly assistant. How can I help you today?");
      return;
    }
    
    // Simple text response
    const response = `Thanks for your message: "${activity.text}". I'm working properly now! 🎉`;
    await send(response);
    
  } catch (error) {
    console.error('[ERROR] Message handler failed:', error);
    await send("🤖 I encountered an issue, but I'm still here to help!");
  }
});

app.on('message.submit.feedback', async ({ activity }) => {
  console.log("Your feedback is " + JSON.stringify(activity.value));
});

module.exports = app;