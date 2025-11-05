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
      
      console.log('[DEBUG] Attempting to use Groq AI...');
      
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
      console.log('[DEBUG] Falling back to mock responses...');
      
      // Use intelligent mock responses as backup
      try {
        const fallbackResponse = mockResponses.getResponse(activity.text);
        await send(`🤖 ${fallbackResponse}`);
        
        // CRITICAL FIX: Also check for moment detection in fallback responses
        await handleMomentDetection(activity, fallbackResponse);
        
      } catch (fallbackError) {
        console.error('[ERROR] Fallback also failed:', fallbackError);
        const defaultResponse = "🤖 Hello! I'm Thun.ai, your workplace companion. How can I help you today? ✨";
        await send(defaultResponse);
        
        // Even check default response for moment detection
        await handleMomentDetection(activity, defaultResponse);
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
    console.log('handleMomentDetection called for:', activity.text);
    
    // LLM-FIRST ARCHITECTURE: Parse structured output from LLM
    // LLM instructions format moments as: [MOMENT: NAME|TYPE|DATE]
    
    // Look for structured moment format in LLM response
    const momentMatch = botResponse.match(/\[MOMENT:\s*([^|]+)\|([^|]+)\|([^\]]+)\]/i);
    
    if (!momentMatch) {
      return; // No moment detected
    }
    
    // Extract from structured format
    const celebrantName = momentMatch[1].trim();
    const celebrationType = momentMatch[2].trim().toLowerCase();
    const dateString = momentMatch[3].trim();
    
    console.log(`Detected moment: ${celebrantName} - ${celebrationType} on ${dateString}`);
    
    // Convert date string to YYYY-MM-DD format
    let momentDate = new Date().toISOString().split('T')[0]; // Default to today
    
    try {
      const parsedDate = new Date(dateString);
      if (!isNaN(parsedDate)) {
        momentDate = parsedDate.toISOString().split('T')[0];
      }
    } catch (error) {
      console.log(`Could not parse date "${dateString}", using today`);
    }
    
    // Check if user exists in database
    let celebrant = await findUserByName(celebrantName);
    
    if (!celebrant) {
      console.log(`Creating new user: ${celebrantName}`);
      celebrant = await createUser(celebrantName, activity);
    }
    
    if (celebrant) {
      // Create the moment using correct API schema
      const momentData = {
        person_name: celebrant.name,
        moment_type: celebrationType,
        moment_date: momentDate,
        description: activity.text,
        created_by: activity.from.id || 'admin_teams_id'
      };
      
      const moment = await createMoment(momentData);
      console.log(`✅ Moment created: ${celebrant.name} - ${celebrationType} on ${momentDate}`);
    }
    
  } catch (error) {
    console.error('[ERROR] Moment detection failed:', error);
  }
}

async function findUserByName(name) {
  try {
    // Use the apiClient's findUserByName method
    return await apiClient.findUserByName(name);
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

async function createUser(name, activity) {
  try {
    // Generate a unique teams_user_id to avoid conflicts
    const baseUserId = activity.from.id || `teams-${name.toLowerCase()}`;
    const timestamp = Date.now();
    const uniqueUserId = `${baseUserId}-${timestamp}`;
    
    const userData = {
      teams_user_id: uniqueUserId,
      name: name,
      email: `${name.toLowerCase()}@company.com`,
      is_admin: false
    };
    
    console.log('Creating user with payload:', userData);
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

// Helper function to get groq model instance
function getGroqModel() {
  const config = require('../config');
  const { GroqChatModel } = require('./groqChatModel');
  return new GroqChatModel({
    apiKey: config.groqApiKey,
    model: config.groqModel || "llama-3.1-8b-instant"
  });
}

module.exports = app;