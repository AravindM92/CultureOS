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

    // ✅ Simple WFO Integration - User-triggered testing
    const userId = activity.from.name || activity.from.id;
    
    // Simple WFO trigger - just check for "week" keyword
    const messageLower = activity.text.toLowerCase().trim();
    if (messageLower === 'week') {
      console.log(`[WFO] Weekly routine triggered by user ${userId}`);
      
      // Simple response without complex API calls
      const wfoMessage = `Hey ${userId}! 👋 Could you share your office plans for next week? It helps me coordinate better!`;
      
      // Store WFO conversation state
      const wfoStateKey = `${storageKey}_wfo_state`;
      storage.set(wfoStateKey, {
        waitingFor: 'wfo_schedule_response',
        userId: userId,
        startedAt: new Date().toISOString()
      });
      
      await send(wfoMessage);
      
      // Store in conversation history
      messages.push({
        role: 'assistant',
        content: wfoMessage
      });
      storage.set(storageKey, messages);
      
      console.log(`[WFO] Sent weekly collection message to user ${userId}`);
      return; // Exit early - WFO handled the message
    }
    
    // Check if user is in WFO conversation
    const wfoStateKey = `${storageKey}_wfo_state`;
    const wfoState = storage.get(wfoStateKey);
    
    if (wfoState && wfoState.waitingFor === 'wfo_schedule_response') {
      console.log(`[WFO] Processing WFO response from user ${userId}: "${activity.text}"`);
      
      // Simple pattern matching for office days
      const officedays = [];
      const dayPatterns = {
        'monday': ['monday', 'mon'],
        'tuesday': ['tuesday', 'tue', 'tues'],
        'wednesday': ['wednesday', 'wed'],
        'thursday': ['thursday', 'thu', 'thurs'],
        'friday': ['friday', 'fri']
      };
      
      for (const [day, patterns] of Object.entries(dayPatterns)) {
        for (const pattern of patterns) {
          if (messageLower.includes(pattern)) {
            officedays.push(day.charAt(0).toUpperCase() + day.slice(1));
            break;
          }
        }
      }
      
      let confirmationMessage;
      if (officedays.length > 0) {
        confirmationMessage = `Got it! You'll be in office on ${officedays.join(' and ')}. That's ${officedays.length} days. Thanks for letting me know! 🎉`;
      } else {
        confirmationMessage = "Thanks for the update! I'll note that you're working from home next week. 🏠";
      }
      
      // Clear WFO state
      storage.set(wfoStateKey, null);
      
      await send(confirmationMessage);
      
      // Store in conversation history
      messages.push({
        role: 'assistant',
        content: confirmationMessage
      });
      storage.set(storageKey, messages);
      
      console.log(`[WFO] Processed WFO response from user ${userId}`);
      return; // Exit early - WFO handled the message
    }

    // No more confirmation handling needed - we create directly    // Try to use Groq AI (will fall back to mock if blocked by firewall)
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