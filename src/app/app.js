const { App } = require("@microsoft/teams.apps");
const { LocalStorage } = require("@microsoft/teams.common");
const { GroqChatModel } = require("./groqChatModel");
const { MockThunaiResponses } = require("./mockResponses");
const { MessageActivity } = require('@microsoft/teams.api');
const fs = require('fs');
const path = require('path');
const config = require("../config");

// Create storage for conversation history
const storage = new LocalStorage();

// Initialize mock responses for when API is blocked
const mockResponses = new MockThunaiResponses();

// Load instructions from file on initialization
function loadInstructions() {
  const instructionsFilePath = path.join(__dirname, "instructions.txt");
  return fs.readFileSync(instructionsFilePath, 'utf-8').trim();
}

// Load instructions once at startup
const instructions = loadInstructions();

// Create the app for playground environment (simplified)
const app = new App({
  storage
});

// Handle incoming messages
app.on('message', async ({ send, activity }) => {
  if (!config.groqApiKey) {
    await send("Groq API key not configured. Please set GROQ_API_KEY in environment.");
    return;
  }

  const conversationKey = `${activity.conversation.id}/${activity.from.id}`;
  let messages = storage.get(conversationKey) || [];

  // Limit conversation history to last 10 messages to prevent memory issues
  if (messages.length > 20) {
    messages = messages.slice(-20);
  }

  // Add system instructions if this is the first message
  if (messages.length === 0) {
    messages.push({
      role: 'system',
      content: instructions
    });
  }

  // Add user message
  messages.push({
    role: 'user',
    content: activity.text
  });

  try {
    // Check if Groq API is available
    const groqModel = new GroqChatModel({
      apiKey: config.groqApiKey,
      model: config.groqModelName
    });

    const response = await groqModel.sendChatCompletion(messages);
    
    // Add assistant response to conversation history
    messages.push({
      role: 'assistant',
      content: response.content
    });
    
    // Store updated conversation history
    storage.set(conversationKey, messages);
    
    const responseActivity = new MessageActivity(response.content).addAiGenerated().addFeedback();
    await send(responseActivity);
  } catch (error) {
    console.error('Groq API Error:', error.message);
    
    // If Groq is blocked, use smart mock responses for testing
    if (error.message.includes('403') || error.message.includes('not allowed') || error.message.includes('blocked')) {
      console.log('🤖 Using mock mode - API blocked by firewall');
      
      const mockResponse = mockResponses.getResponse(activity.text);
      
      messages.push({
        role: 'assistant',
        content: mockResponse
      });
      
      storage.set(conversationKey, messages);
      const responseActivity = new MessageActivity(mockResponse).addAiGenerated().addFeedback();
      await send(responseActivity);
    } else {
      await send("Sorry, I encountered an error processing your request. Please try again.");
    }
  }
});



module.exports = app;