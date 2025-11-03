const { App } = require("@microsoft/teams.apps");
const { LocalStorage } = require("@microsoft/teams.common");
const { MessageActivity } = require('@microsoft/teams.api');
const config = require("../config");
const { GroqChatModel } = require('./groqChatModel');
const { MockThunaiResponses } = require('./mockResponses');
const ThunaiAPIClient = require('./apiClient');

// Create instances
const mockResponses = new MockThunaiResponses();
const apiClient = new ThunaiAPIClient();
const storage = new LocalStorage();

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
    
    // Check for empty message
    if (!activity.text) {
      await send("Hello! I'm Thun.ai, your friendly assistant. How can I help you today?");
      return;
    }

    // Get conversation history from storage
    const storageKey = `conversation_${activity.conversation.id}_${activity.from.id}`;
    let messages = storage.get(storageKey) || [];
    
    // Add system prompt if this is the first message
    if (messages.length === 0) {
      messages.push({
        role: 'system',
        content: instructions
      });
    }
    
    // Add user message to conversation history
    messages.push({
      role: 'user',
      content: activity.text
    });

    // Try to use Groq AI (will fall back to mock if blocked by firewall)
    try {
      // NOTE: Corporate firewall may block external AI services
      // Mock responses will be used as primary feature in that case
      
      // Initialize Groq model with configuration
      const groqModel = new GroqChatModel({
        apiKey: config.groqApiKey,
        model: config.groqModelName
      });

      if (activity.conversation.isGroup) {
        // Group chat - send final response
        const response = await groqModel.sendChatCompletion(messages);
        
        // Add assistant response to conversation history
        messages.push({
          role: 'assistant',
          content: response.content
        });
        
        // Check for moment creation opportunities
        await handleMomentDetection(activity, response.content);
        
        const responseActivity = new MessageActivity(response.content).addAiGenerated().addFeedback();
        await send(responseActivity);
      } else {
        // 1:1 conversation - use streaming
        let fullResponse = "";
        await groqModel.sendStreamingChatCompletion(messages, {
          onChunk: (chunk) => {
            fullResponse += chunk;
            stream.emit(chunk);
          },
        });
        
        // Add assistant response to conversation history
        messages.push({
          role: 'assistant',
          content: fullResponse
        });
        
        // Check for moment creation opportunities
        await handleMomentDetection(activity, fullResponse);
        
        // Wrap final response with AI Generated indicator
        stream.emit(new MessageActivity().addAiGenerated().addFeedback());
      }
      
      // Store updated conversation history
      storage.set(storageKey, messages);
      
    } catch (groqError) {
      console.error('[ERROR] Groq AI failed:', groqError);
      
      // Use intelligent mock responses as backup
      try {
        const fallbackResponse = mockResponses.getResponse(activity.text);
        await send(`🤖 ${fallbackResponse}`);
      } catch (fallbackError) {
        console.error('[ERROR] Fallback also failed:', fallbackError);
        await send("🤖 Hello! I'm Thun.ai, your workplace companion. How can I help you today? ✨");
      }
    }
    
  } catch (error) {
    console.error('[ERROR] Message handler failed:', error);
    await send("🤖 I encountered an issue, but I'm still here to help!");
  }
});

app.on('message.submit.feedback', async ({ activity }) => {
  console.log("Your feedback is " + JSON.stringify(activity.value));
});

// ==========================================
// MOMENT DETECTION AND CREATION
// ==========================================

async function handleMomentDetection(activity, botResponse) {
  try {
    console.log('[DEBUG] handleMomentDetection called');
    console.log('[DEBUG] User message:', activity.text);
    console.log('[DEBUG] Bot response:', botResponse);
    
    const userMessage = activity.text.toLowerCase();
    
    // Only process if bot mentioned creating a moment
    if (!botResponse.includes('create') && !botResponse.includes('moment')) {
      console.log('[DEBUG] Bot response does not mention create/moment');
      return;
    }
    
    console.log('[DEBUG] Bot response mentions create/moment - proceeding');
    
    // Simple moment detection keywords
    const celebrationKeywords = [
      'promotion', 'promoted', 'birthday', 'anniversary', 'work anniversary',
      'completed', 'finished', 'achieved', 'won', 'award', 'celebration',
      'graduating', 'graduated', 'new job', 'joining'
    ];
    
    const hasCelebration = celebrationKeywords.some(keyword => 
      userMessage.includes(keyword)
    );
    
    if (!hasCelebration) {
      return;
    }
    
    // Extract potential celebrant name (very simple extraction)
    const words = activity.text.split(' ');
    let celebrantName = null;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // Look for capitalized words that might be names
      if (word.length > 2 && word[0].toUpperCase() === word[0] && 
          !['The', 'This', 'That', 'When', 'Where', 'What', 'Who'].includes(word)) {
        celebrantName = word;
        break;
      }
    }
    
    if (!celebrantName) {
      console.log('No celebrant name detected in message');
      return;
    }
    
    console.log(`Detected celebration for: ${celebrantName}`);
    
    // Check if user exists in database
    let celebrant = await findUserByName(celebrantName);
    
    if (!celebrant) {
      // Create user if not found
      console.log(`Creating new user: ${celebrantName}`);
      celebrant = await createUser(celebrantName, activity);
    }
    
    if (celebrant) {
      // Create the moment
      const momentData = {
        celebrant_id: celebrant.id,
        moment_type: detectMomentType(userMessage),
        description: activity.text,
        created_by: activity.from.name,
        status: 'active'
      };
      
      const moment = await createMoment(momentData);
      console.log(`✅ Real moment created in database:`, moment);
    }
    
  } catch (error) {
    console.error('[ERROR] Moment detection failed:', error);
  }
}

async function findUserByName(name) {
  try {
    // Try exact name match first
    const users = await apiClient.getUsers();
    return users.find(user => 
      user.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(user.name.toLowerCase())
    );
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

async function createUser(name, activity) {
  try {
    const userData = {
      teams_user_id: activity.from.id || `teams-${name.toLowerCase()}`,
      name: name,
      email: `${name.toLowerCase()}@company.com`,
      is_admin: false
    };
    
    return await apiClient.createUser(userData);
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

async function createMoment(momentData) {
  try {
    return await apiClient.createMoment(momentData);
  } catch (error) {
    console.error('Error creating moment:', error);
    return null;
  }
}

function detectMomentType(message) {
  if (message.includes('birthday')) return 'birthday';
  if (message.includes('promotion') || message.includes('promoted')) return 'promotion';
  if (message.includes('anniversary')) return 'work_anniversary';
  if (message.includes('completed') || message.includes('finished')) return 'achievement';
  return 'celebration';
}

module.exports = app;