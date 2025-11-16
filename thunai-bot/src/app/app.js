const { App } = require("@microsoft/teams.apps");
const { LocalStorage } = require("@microsoft/teams.common");
const { MessageActivity } = require('@microsoft/teams.api');
const config = require("../config");
const { GroqChatModel } = require('./groqChatModel');
const { MockThunaiResponses } = require('./mockResponses');
const { DateUtils } = require('./dateUtils');
const ThunaiAPIClient = require('./apiClient');
const WFOHandler = require('../wfo/WFOHandler');

// Create instances
const mockResponses = new MockThunaiResponses();
const apiClient = new ThunaiAPIClient();
const storage = new LocalStorage();
// WFOHandler will be created when groqModel is available

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

    // ✅ SIMPLE WFO: Check for triggers and handle with main LLM
    const userId = activity.from.name || activity.from.id;
    
    // Initialize WFO Handler if needed
    if (!global.wfoHandler) {
      const WFOHandler = require('../wfo/WFOHandler');
      global.wfoHandler = new WFOHandler();
    }
    
    // Check if WFO can handle this message
    const userContext = { userId, activityId: activity.id, conversationId: activity.conversation.id };
    if (global.wfoHandler.canHandle(activity.text, userContext)) {
      console.log(`[WFO] Processing: ${activity.text}`);
      
      const wfoResponse = await global.wfoHandler.process(activity.text, userContext);
      
      if (wfoResponse) {
        if (wfoResponse.needsLLMProcessing) {
          // Let main LLM process the WFO response
          console.log(`[WFO] Letting main LLM process: ${wfoResponse.message}`);
          // Add WFO context to messages for LLM
          messages.push({
            role: 'system',
            content: `User is responding to WFO ${wfoResponse.wfoType} question. Extract office days from: "${wfoResponse.message}" and respond with confirmation.`
          });
          messages.push({
            role: 'user',
            content: wfoResponse.message
          });
          // Continue to main LLM processing below
        } else {
          // Direct WFO response
          await send(new MessageActivity(wfoResponse.message));
          messages.push({ role: 'assistant', content: wfoResponse.message });
          storage.set(storageKey, messages);
          return;
        }
      }
    }

    // Try to use Groq AI (will fall back to mock if blocked by firewall)
    try {
      // NOTE: Corporate firewall may block external AI services
      // Mock responses will be used as primary feature in that case
      
      if (config.enableDebug) console.log('[DEBUG] Attempting to use Groq AI...');
      
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
        const momentResult = await handleMomentDetection(activity, response.content);
        
        // Check for WFO data in LLM response
        await handleWFODetection(activity, response.content, userId);
        
        // If moment detection needs confirmation, send that message instead
        if (momentResult && momentResult.needsConfirmation) {
          // Store pending moment data separately (not in messages for Groq)
          const pendingMomentKey = `${storageKey}_pending`;
          console.log(`🔧 GROUP: STORING pending moment with key: ${pendingMomentKey}`);
          console.log(`🔧 GROUP: STORING pending moment data:`, momentResult.pendingMoment);
          storage.set(pendingMomentKey, momentResult.pendingMoment);
          
          // Add system message without custom properties
          messages.push({
            role: 'system',
            content: 'Pending moment confirmation - user needs to confirm moment creation'
          });
          
          const confirmationActivity = new MessageActivity(momentResult.message);
          await send(confirmationActivity);
          
          // Store updated conversation history
          storage.set(storageKey, messages);
          return; // Don't send the original AI response, just the confirmation
        }
        
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
        const momentResult = await handleMomentDetection(activity, fullResponse);
        
        // Check for WFO data in LLM response
        await handleWFODetection(activity, fullResponse, userId);
        
        // If moment detection needs confirmation, send that message
        if (momentResult && momentResult.needsConfirmation) {
          // Store pending moment data separately (not in messages for Groq)
          const pendingMomentKey = `${storageKey}_pending`;
          console.log(`🔧 1:1: STORING pending moment with key: ${pendingMomentKey}`);
          console.log(`🔧 1:1: STORING pending moment data:`, momentResult.pendingMoment);
          storage.set(pendingMomentKey, momentResult.pendingMoment);
          
          // Add system message without custom properties
          messages.push({
            role: 'system',
            content: 'Pending moment confirmation - user needs to confirm moment creation'
          });
          
          const confirmationActivity = new MessageActivity(momentResult.message);
          await send(confirmationActivity);
          
          // Store updated conversation history
          storage.set(storageKey, messages);
        }
        
        // Wrap final response with AI Generated indicator
        stream.emit(new MessageActivity().addAiGenerated().addFeedback());
      }
      
      // Store updated conversation history
      storage.set(storageKey, messages);
      
    } catch (groqError) {
      console.error('[ERROR] Groq AI failed:', groqError);
      if (config.enableDebug) console.log('[DEBUG] Falling back to mock responses...');
      
      // Use intelligent mock responses as backup
      try {
        const fallbackResponse = mockResponses.getResponse(activity.text);
        await send(`🤖 ${fallbackResponse}`);
        
        // CRITICAL FIX: Also check for moment detection in fallback responses
        const momentResult = await handleMomentDetection(activity, fallbackResponse);
        
        // If moment detection needs confirmation, send that message
        if (momentResult && momentResult.needsConfirmation) {
          // Store pending moment data separately
          const storageKey = `team_conversation:${activity.conversation.id}`;
          const pendingMomentKey = `${storageKey}_pending`;
          storage.set(pendingMomentKey, momentResult.pendingMoment);
          
          const confirmationActivity = new MessageActivity(momentResult.message);
          await send(confirmationActivity);
        }
        
      } catch (fallbackError) {
        console.error('[ERROR] Fallback also failed:', fallbackError);
        const defaultResponse = "🤖 Hello! I'm Thun.ai, your workplace companion. How can I help you today? ✨";
        await send(defaultResponse);
        
        // Even check default response for moment detection
        const momentResult = await handleMomentDetection(activity, defaultResponse);
        
        // If moment detection needs confirmation, send that message
        if (momentResult && momentResult.needsConfirmation) {
          // Store pending moment data separately
          const storageKey = `team_conversation:${activity.conversation.id}`;
          const pendingMomentKey = `${storageKey}_pending`;
          storage.set(pendingMomentKey, momentResult.pendingMoment);
          
          const confirmationActivity = new MessageActivity(momentResult.message);
          await send(confirmationActivity);
        }
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

// ==========================================
// WFO DETECTION AND PROCESSING
// ==========================================

async function handleWFODetection(activity, botResponse, userId) {
  try {
    // Check if user is in WFO conversation
    if (!global.wfoHandler || !global.wfoHandler.getUserState(userId)) {
      return; // Not in WFO conversation
    }

    console.log('[WFO] Checking LLM response for WFO data:', botResponse);
    console.log('[WFO] Original user message:', activity.text);
    
    // Enhanced parsing: Look for office days in both user message and bot response
    const userMessage = activity.text.toLowerCase();
    const botMessage = botResponse.toLowerCase();
    
    let officeDays = [];
    
    // Parse "Mon to Wed" format from user message
    if (userMessage.includes('mon to wed') || userMessage.includes('monday to wednesday')) {
      officeDays = ['monday', 'tuesday', 'wednesday'];
    } else if (userMessage.includes('tue to thu') || userMessage.includes('tuesday to thursday')) {
      officeDays = ['tuesday', 'wednesday', 'thursday'];
    } else if (userMessage.includes('wed to fri') || userMessage.includes('wednesday to friday')) {
      officeDays = ['wednesday', 'thursday', 'friday'];
    } else {
      // Parse individual days from user message or bot response
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const dayAbbreviations = ['mon', 'tue', 'wed', 'thu', 'fri'];
      
      days.forEach((day, index) => {
        const abbrev = dayAbbreviations[index];
        if (userMessage.includes(day) || userMessage.includes(abbrev) || 
            botMessage.includes(day) || botMessage.includes(abbrev)) {
          officeDays.push(day);
        }
      });
    }
    
    // Check for confirmation patterns in bot response
    const hasConfirmation = (botMessage.includes('office') || botMessage.includes('confirm')) && 
                           (officeDays.length > 0 || botMessage.includes('monday') || botMessage.includes('tuesday') || botMessage.includes('wednesday'));
    
    if (hasConfirmation || officeDays.length > 0) {
      console.log('[WFO] Found WFO data - Office days:', officeDays);
      
      // Create WFO data structure
      const wfoData = {
        week_start_date: '2025-11-11', // Default week
        monday_status: officeDays.includes('monday') ? 'office' : 'home',
        tuesday_status: officeDays.includes('tuesday') ? 'office' : 'home',
        wednesday_status: officeDays.includes('wednesday') ? 'office' : 'home',
        thursday_status: officeDays.includes('thursday') ? 'office' : 'home',
        friday_status: officeDays.includes('friday') ? 'office' : 'home',
        collection_method: 'weekly'
      };
      
      console.log('[WFO] Extracted WFO data:', wfoData);
      
      // Save to WFO API (DB only)
      try {
        await global.wfoHandler.saveWFOData(userId, wfoData);
        console.log('[WFO] Successfully saved WFO data to database');
        
        // Clear conversation state
        global.wfoHandler.clearUserState(userId);
        
      } catch (error) {
        console.error('[WFO] Error saving WFO data:', error.message);
        console.error('[WFO] Full error:', error);
      }
    } else {
      console.log('[WFO] No WFO data found in messages');
    }
    
  } catch (error) {
    console.error('[WFO] Error in WFO detection:', error);
  }
}

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
    
    // Convert date string using proper relative date parsing
    let momentDate;
    try {
      // Use DateUtils for proper relative date parsing
      momentDate = DateUtils.parseRelativeDate(dateString);
      console.log(`Parsed "${dateString}" to ${momentDate}`);
    } catch (error) {
      console.log(`Could not parse date "${dateString}", using today`);
      momentDate = new Date().toISOString().split('T')[0];
    }
    
    // Check if user exists in database
    let celebrant = await apiClient.findUserByName(celebrantName);
    
    if (!celebrant) {
      console.log(`User "${celebrantName}" not found in database`);
      
      // Create new user first
      console.log('🔧 Creating new user...');
      celebrant = await createUser(celebrantName, activity);
      
      if (!celebrant) {
        console.error('Failed to create new user');
        return;
      }
      
      console.log(`✅ Created new user: ${celebrant.name}`);
    }
    
    // Create the moment (for both existing and new users)
    console.log('🔧 Creating moment...');
    const momentData = {
      person_name: celebrant.name,
      moment_type: celebrationType,
      moment_date: momentDate,
      description: activity.text,
      created_by: activity.from.id || config.adminTeamsId
    };
    
    const moment = await createMoment(momentData);
    
    if (moment) {
      console.log(`✅ Moment created: ${celebrant.name} - ${celebrationType} on ${momentDate}`);
      
      // Give confirmation message AFTER creation
      const confirmationMessage = `🎉 **Moment Created!**\n\n✅ **${celebrant.name}**'s **${celebrationType}** on **${momentDate}**\n\nThe team will be notified! 🎊`;
      
      return {
        needsConfirmation: false,
        message: confirmationMessage
      };
    } else {
      console.error('Failed to create moment');
      return {
        needsConfirmation: false,
        message: `❌ Sorry, there was an issue creating the moment for ${celebrant.name}. Please try again.`
      };
    }
    
  } catch (error) {
    console.error('[ERROR] Moment detection failed:', error);
  }
}



async function createUser(name, activity) {
  try {
    console.log('🔧 Starting user creation process...');
    // Generate a unique teams_user_id to avoid conflicts
    const baseUserId = activity.from.id || `teams-${name.toLowerCase()}`;
    const timestamp = Date.now();
    const uniqueUserId = `${baseUserId}-${timestamp}`;
    
    const userData = {
      teams_user_id: uniqueUserId,
      name: name,
      email: `${name.toLowerCase()}@${config.emailDomain || 'company.com'}`,
      is_admin: false
    };
    
    console.log('🔧 Creating user with payload:', userData);
    const result = await apiClient.createUser(userData);
    console.log('✅ User created successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ ERROR in createUser function:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    return null;
  }
}

async function createMoment(momentData) {
  try {
    console.log('🔧 Starting moment creation process...');
    console.log('🔧 Creating moment with data:', momentData);
    const result = await apiClient.createMoment(momentData);
    console.log('✅ Moment created successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ ERROR in createMoment function:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
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