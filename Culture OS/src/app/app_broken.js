const { App } = require("@microsoft/teams.apps");
const { LocalStorage } = require("@microsoft/teams.common");
const { MessageActivity } = require('@microsoft/teams.api');
const config = require("../config");
const { GroqChatModel } = require('./groqChatModel');
const { MockThunaiResponses } = require('./mockResponses');
const ThunaiAPIClient = require('./apiClient');
const { MomentContextManager } = require('./momentContextManager');

// Create instances
const mockResponses = new MockThunaiResponses();
const storage = new LocalStorage();
const apiClient = new ThunaiAPIClient();
const momentManager = new MomentContextManager(apiClient);

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
    
    const userId = activity.from.id;
    const userEmail = activity.from.email || activity.from.userPrincipalName;
    
    // Check if user is admin
    const isAdmin = await apiClient.isAdmin(userId, userEmail);
    console.log(`User ${activity.from.name} (${userEmail}) admin status: ${isAdmin}`);
    
    // Handle adaptive card submissions (button clicks)
    if (activity.value && activity.value.action) {
      const actionResult = await momentManager.handleMomentAction(
        activity.value.action, 
        activity.value, 
        userId,
        userEmail
      );
      
      if (actionResult) {
        if (typeof actionResult === 'string') {
          await send(actionResult);
        } else {
          // It's an adaptive card
          await send(new MessageActivity().addAttachment({
            contentType: "application/vnd.microsoft.card.adaptive",
            content: actionResult
          }));
        }
        return;
      }
    }
    
    // Check for empty message
    if (!activity.text) {
      await send("Hello! I'm Thun.ai, your friendly assistant. How can I help you today?");
      return;
    }

    // Categorize conversation type
    const conversationType = categorizeConversation(activity.text);
    console.log(`Conversation type: ${conversationType.type}, confidence: ${conversationType.confidence}`);

    function categorizeConversation(message) {
      const text = message.toLowerCase();
      
      // Operational keywords - these require database operations
      const operationalPatterns = [
        /celebrating|anniversary|birthday|promotion|achievement|milestone|award|won|winner/,
        /add user|create user|new user|register|join team/,
        /moment|celebration|congratulations|congrats/,
        /greeting|message|card|wish/,
        /update|delete|remove|modify/
      ];

      // Casual keywords - these can be handled by AI
      const casualPatterns = [
        /joke|funny|laugh|humor/,
        /weather|how are you|hello|hi|hey/,
        /help|what can you do|capabilities/,
        /tell me about|explain|what is/,
        /thank you|thanks|bye|goodbye/
      ];

      // Check for operational patterns
      for (let pattern of operationalPatterns) {
        if (pattern.test(text)) {
          return { type: 'operational', confidence: 'high' };
        }
      }

      // Check for casual patterns
      for (let pattern of casualPatterns) {
        if (pattern.test(text)) {
          return { type: 'casual', confidence: 'high' };
        }
      }

      // Default to casual with low confidence
      return { type: 'casual', confidence: 'low' };
    }
    
    // Check if user has active moment context (awaiting celebrant details)
    if (isAdmin && momentManager.hasActiveContext(userId)) {
      const contextResult = await momentManager.handleCelebrantDetails(activity.text, userId);
      if (contextResult) {
        if (typeof contextResult === 'string') {
          await send(contextResult);
        } else {
          // It's an adaptive card
          await send(new MessageActivity().addAttachment({
            contentType: "application/vnd.microsoft.card.adaptive", 
            content: contextResult
          }));
        }
        return;
      }
    }

    // Check if user is providing user creation details (flexible parsing)
    const userCreationKey = `user_creation_${activity.conversation.id}_${activity.from.id}`;
    const awaitingUserDetails = storage.get(userCreationKey);
    
    if (isAdmin && awaitingUserDetails) {
      try {
        // Handle skip option
        if (activity.text.toLowerCase().trim() === 'skip') {
          storage.remove(userCreationKey);
          await send(`👍 Understood. The moment creation has been cancelled. Feel free to create the user in the **Thunai Dashboard** when you're ready.`);
          return;
        }
        
        // Try to parse flexible user detail formats
        const text = activity.text;
        
        // Try exact format first: "Add user: Name, email@company.com, teams-id-123"
        let userDetailsMatch = text.match(/add user:\s*([^,]+),\s*([^,]+)(?:,\s*(.+))?/i);
        
        // Try flexible format: "Full name: X Email address: Y Teams User ID: Z"
        if (!userDetailsMatch) {
          const nameMatch = text.match(/(?:full\s+name|name)\s*:\s*([^\n\r,]+)/i);
          const emailMatch = text.match(/(?:email\s+address|email)\s*:\s*([^\n\r,\s]+)/i);
          const idMatch = text.match(/(?:teams\s+user\s+id|id)\s*(?:\(if\s+known\))?\s*:\s*([^\n\r,\s]+)/i);
          
          if (nameMatch && emailMatch) {
            const name = nameMatch[1].trim();
            const email = emailMatch[1].trim();
            const teamsId = idMatch ? idMatch[1].trim() : `user-${Date.now()}`;
            userDetailsMatch = [null, name, email, teamsId];
          }
        }
        
        if (userDetailsMatch) {
          const [, name, email, teamsId] = userDetailsMatch;
          
          const userData = {
            teams_user_id: teamsId?.trim() || `user-${Date.now()}`,
            name: name.trim(),
            email: email.trim(),
            is_admin: false
          };
          
          const newUser = await apiClient.createUser(userData);
          
          if (newUser) {
            // Clear the user creation context
            storage.remove(userCreationKey);
            
            await send(`✅ **User created successfully!**

**${newUser.name}** has been added to our team directory.
- Email: ${newUser.email}
- Teams ID: ${newUser.teams_user_id}

Now that ${newUser.name} is in our system, would you like to create a moment for them? 

You can say something like: "${newUser.name} is celebrating their [event] on [date]"`);
            return;
          } else {
            await send(`❌ Failed to create user. If you continue to experience issues, please try creating the user from the **Thunai Dashboard** instead.`);
            storage.remove(userCreationKey);
            return;
          }
        } else {
          await send(`❌ I couldn't parse the user details. Please use the format:
"Add user: Name, email@company.com, teams-id-123"

Or provide details clearly:
Full name: [Name]
Email address: [email]
Teams User ID: [id]`);
          return;
        }
      } catch (error) {
        console.error('Error creating user:', error);
        await send(`❌ Error creating user. If this persists, please try creating the user from the **Thunai Dashboard** application.`);
        storage.remove(userCreationKey);
        return;
      }
    }

    // HANDLE OPERATIONAL CONVERSATIONS FIRST (before AI processing)
    if (conversationType.type === 'operational') {
      console.log('Processing operational conversation...');
      
      try {
        // MOMENT DETECTION FOR ALL USERS (but admin actions only for admins)
        const momentDetection = momentManager.detectMomentOpportunity(activity.text);
        if (momentDetection && momentDetection.length > 0) {
          console.log(`Moment detected: ${JSON.stringify(momentDetection)}`);
          
          // Extract celebrant from the message
          const celebrant = await momentManager.extractCelebrant(activity.text, { activity });
          
          if (celebrant && !celebrant.exists) {
            // Celebrant doesn't exist - MUST create user first
            if (isAdmin) {
              const userCreationKey = `user_creation_${activity.conversation.id}_${activity.from.id}`;
              storage.set(userCreationKey, { celebrant: celebrant.name, originalMessage: activity.text });
              
              await send(`🎉 I detected a moment for **${celebrant.name}**, but they're not in our team directory yet.\n\n**Important:** Only team members in our database can have moments created for them.\n\nWould you like me to help you add **${celebrant.name}** to our team directory first?\n\nPlease provide:\n\nFull name: ${celebrant.name}\nEmail address:\nTeams User ID (if known):\nReply with their details in this format: "Add user: ${celebrant.name}, email@company.com, teams-id-123"\n\nOr type "skip" to cancel this moment.`);
              return;
            } else {
              await send(`That's wonderful news about ${celebrant.name}! 🎉 However, I don't have them in our team directory yet. An admin will need to add them to our system before we can create moments for them.`);
              return;
            }
          } else if (celebrant && celebrant.exists) {
            // Celebrant exists - proceed with moment creation
            if (isAdmin) {
              const momentCard = momentManager.createAdminMomentSuggestion(
                momentDetection,
                celebrant.name,
                activity.text
              );
              
              await send(new MessageActivity().addAttachment({
                contentType: "application/vnd.microsoft.card.adaptive",
                content: momentCard
              }));
              return;
            } else {
              await send(`That's wonderful news about ${celebrant.name}! 🎉 Celebrations like these really bring the team together.`);
              return;
            }
          }
        }

        // No moment detected - inform user
        await send(`I detected this might be an operational request, but I couldn't identify a specific action to take. If you're trying to create a moment, please mention the person's name and the celebration. If this persists, you can create moments directly from the **Thunai Dashboard** application.`);
        return;
        
      } catch (operationalError) {
        console.error('[ERROR] Operational conversation failed:', operationalError);
        await send(`❌ I encountered an error while processing your request. Please try creating moments from the **Thunai Dashboard** application instead.`);
        return;
      }
    }

    // HANDLE CASUAL CONVERSATIONS ONLY (AI responses)
    if (conversationType.type === 'casual') {
      console.log('Processing casual conversation with AI...');

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

    // Handle user creation requests from admin
    if (isAdmin && activity.text.toLowerCase().startsWith('add user:')) {
      try {
        // Parse user details: "Add user: Name, email@company.com, teams-id-123"
        const userDetailsMatch = activity.text.match(/add user:\s*([^,]+),\s*([^,]+)(?:,\s*(.+))?/i);
        
        if (userDetailsMatch) {
          const [, name, email, teamsId] = userDetailsMatch;
          
          const userData = {
            teams_user_id: teamsId?.trim() || `user-${Date.now()}`,
            name: name.trim(),
            email: email.trim(),
            is_admin: false
          };
          
          const newUser = await apiClient.createUser(userData);
          
          if (newUser) {
            await send(`✅ **User created successfully!**

**${newUser.name}** has been added to our team directory.
- Email: ${newUser.email}
- Teams ID: ${newUser.teams_user_id}
- User ID: ${newUser.id}

🎉 **Now I can create moments for ${newUser.name}!** 

Would you like me to create a moment now? Please specify:
- **Event type**: birthday, work anniversary, promotion, achievement, etc.
- **Date**: When is the celebration?
- **Description**: Any additional details

Or simply say: "${newUser.name} is celebrating their [event] on [date]"`);
          } else {
            await send(`😔 I'm sorry, but there was an issue creating this user in our database.

🌟 **Alternative Solution:** Please try creating this user using the **Thunai Dashboard** application. Our dashboard team has built a reliable interface for user management.

The dashboard provides:
• Easy user creation forms
• User management tools  
• Direct database access
• Better error handling

Thank you for your patience! 🙏`);
          }
        } else {
          await send(`❌ Invalid format. Please use: "Add user: Name, email@company.com, teams-id-123"`);
        }
        return;
      } catch (error) {
        console.error('Error creating user:', error);
        await send(`😔 I'm sorry, but I encountered an issue while creating this user.

🌟 **Alternative Solution:** Please try creating this user using the **Thunai Dashboard** application. Our dashboard team has built a reliable interface for user management.

The dashboard provides:
• Easy user creation forms
• User management tools  
• Direct database access
• Better error handling

Thank you for your patience! 🙏`);
        return;
      }
    }

    // Try to use Groq AI (will fall back to mock if blocked by firewall)
    try {

    // HANDLE CASUAL CONVERSATIONS - use AI responses
    console.log('Processing casual conversation with AI...');

    // Use existing conversation messages from earlier in the function
    // (storageKey and messages were already initialized above)

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

module.exports = app;