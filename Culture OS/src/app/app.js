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
    console.log('[DEBUG] handleMomentDetection called');
    console.log('[DEBUG] User message:', activity.text);
    console.log('[DEBUG] Bot response:', botResponse);
    
    // CRITICAL: Use LLM-first architecture - extract ALL info from bot response, not user input
    // The LLM has already understood and normalized the user's unclear/misspelled input
    
    // Only process if bot response contains specific celebration indicators
    // Be more specific to avoid false positives from generic "create" mentions
    const celebrationIndicators = [
      'birthday', 'bday', 'born',
      'promotion', 'promoted', 'new role',
      'anniversary', 'years with', 'years at',
      'achievement', 'accomplished', 'completed project',
      'Happy birthday', 'Congratulations on',
      'create moment', 'create a moment', 'moment for'
    ];
    
    const hasCelebrationIndicator = celebrationIndicators.some(indicator => 
      botResponse.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (!hasCelebrationIndicator) {
      console.log('[DEBUG] Bot response does not contain specific celebration indicators');
      return;
    }
    
    console.log('[DEBUG] Bot detected celebration - extracting from LLM response');
    
    // Extract celebration type from LLM response (not user input!)
    const botResponseLower = botResponse.toLowerCase();
    let celebrationType = 'celebration';
    
    if (botResponseLower.includes('birthday') || botResponseLower.includes('bday')) {
      celebrationType = 'birthday';
    } else if (botResponseLower.includes('promotion') || botResponseLower.includes('promoted')) {
      celebrationType = 'promotion';
    } else if (botResponseLower.includes('anniversary')) {
      celebrationType = 'work_anniversary';
    } else if (botResponseLower.includes('completed') || botResponseLower.includes('finished')) {
      celebrationType = 'achievement';
    }
    
    console.log('[DEBUG] Detected celebration type:', celebrationType);
    
    // CRITICAL FIX: Extract celebrant name from LLM response (not user input!)
    // The LLM has cleaned and normalized the name properly
    let celebrantName = null;
    
    // Parse names from LLM response - look for patterns like "Happy birthday to John" or "John's birthday"
    const botWords = botResponse.split(' ');
    for (let i = 0; i < botWords.length; i++) {
      const word = botWords[i].replace(/[^\w]/g, ''); // Remove punctuation
      
      // Look for capitalized words that might be names in bot response
      if (word.length > 2 && word[0].toUpperCase() === word[0] && 
          !['The', 'This', 'That', 'When', 'Where', 'What', 'Who', 'Happy', 'Birthday', 'Is', 'His', 'Her', 'Their', 'Thunai', 'Im', 'And', 'But', 'For', 'With', 'Let', 'Me', 'Create', 'Before', 'Should', 'Can', 'You', 'Please', 'Yes', 'No'].includes(word)) {
        
        // First priority: check if this name appears in user input (cross-reference)
        const userInputLower = activity.text.toLowerCase();
        const wordLower = word.toLowerCase();
        if (userInputLower.includes(wordLower)) {
          celebrantName = word;
          console.log(`[DEBUG] Found celebrant name in bot response: ${word} (cross-referenced with user input)`);
          break;
        }
        
        // Second priority: if LLM mentions a proper name in celebration context, trust it
        // This handles conversation continuity where user says "no, next wednesday" 
        // but LLM remembers "Mukund" from previous context
        if (!celebrantName) {
          console.log(`[DEBUG] Potential celebrant name from LLM context: ${word}`);
          celebrantName = word; // Tentatively accept, but continue looking for cross-referenced names
        }
      }
    }
    
    // Fallback: if no name found in bot response, try user input as last resort
    if (!celebrantName) {
      console.log('[DEBUG] No name found in bot response, trying user input as fallback');
      const userWords = activity.text.split(' ');
      for (let i = 0; i < userWords.length; i++) {
        const word = userWords[i].replace(/[^\w]/g, '');
        if (word.length > 2 && word[0].toUpperCase() === word[0] && 
            !['The', 'This', 'That', 'When', 'Where', 'What', 'Who', 'Happy', 'Birthday', 'Is', 'His', 'Her', 'Their'].includes(word)) {
          celebrantName = word;
          console.log(`[DEBUG] Fallback: found celebrant name in user input: ${word}`);
          break;
        }
      }
    }
    
    console.log('[DEBUG] Final extracted celebrant name:', celebrantName);
    
    if (!celebrantName) {
      console.log('[DEBUG] No celebrant name detected in either bot response or user input');
      return;
    }
    
    // Simple date extraction - let LLM do the parsing
    let momentDate = new Date().toISOString().split('T')[0]; // Default to today
    
    // Look for actual dates that LLM should provide (November 8th, 2025, etc.)
    const datePatterns = [
      /(\w+)\s+(\d{1,2})(st|nd|rd|th)?,?\s*(\d{4})/i, // "November 8th, 2025"
      /(\d{1,2})(st|nd|rd|th)?\s+(\w+),?\s*(\d{4})/i, // "8th November, 2025"
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,               // "11/8/2025"
      /(\d{4})-(\d{1,2})-(\d{1,2})/                  // "2025-11-08"
    ];
    
    for (const pattern of datePatterns) {
      const match = botResponse.match(pattern);
      if (match) {
        console.log(`[DEBUG] LLM provided actual date: ${match[0]}`);
        // For now, let's try to parse common formats
        try {
          const parsedDate = new Date(match[0]);
          if (!isNaN(parsedDate)) {
            momentDate = parsedDate.toISOString().split('T')[0];
            console.log(`[DEBUG] Parsed date to: ${momentDate}`);
          }
        } catch (error) {
          console.log(`[DEBUG] Could not parse date: ${match[0]}`);
        }
        break;
      }
    }
    
    console.log(`[DEBUG] Using moment date: ${momentDate}`);
    console.log(`Detected celebration for: ${celebrantName} (${celebrationType})`);
    
    // Check if user exists in database
    let celebrant = await findUserByName(celebrantName);
    
    if (!celebrant) {
      console.log(`[INFO] User "${celebrantName}" not found in database`);
      
      // Ask for confirmation before creating new user
      const confirmationMessage = `🤔 I noticed you mentioned ${celebrantName}, but they're not in our team directory yet. Would you like me to:\n\n1️⃣ Add ${celebrantName} as a new team member\n2️⃣ Skip creating this moment\n\nPlease reply with "1" to add them or "2" to skip.`;
      
      // TODO: Implement proper confirmation flow
      // For now, we'll create the user but with a note that confirmation is needed
      console.log(`[CONFIRMATION NEEDED] ${confirmationMessage}`);
      
      // Create user with pending status until confirmed
      console.log(`Creating new user: ${celebrantName} (pending confirmation)`);
      celebrant = await createUser(celebrantName, activity);
    }
    
    if (celebrant) {
      // Create the moment using correct API schema
      const momentData = {
        person_name: celebrant.name,  // Use person_name, not celebrant_id
        moment_type: celebrationType,
        moment_date: momentDate, // Use extracted or default date
        description: activity.text, // Keep original user input as description
        created_by: activity.from.id || 'admin_teams_id' // Use teams_user_id for foreign key
      };
      
      console.log('[DEBUG] Creating moment with data:', momentData);
      const moment = await createMoment(momentData);
      console.log(`✅ Real moment created in database:`, moment);
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

module.exports = app;